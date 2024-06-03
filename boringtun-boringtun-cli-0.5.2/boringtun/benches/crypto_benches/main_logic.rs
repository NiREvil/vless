use base64::Engine;

use futures_util::future::join_all;

use std::{sync::Arc, time::Duration};
use tracing::{debug_span, instrument, Instrument};
use hickory_proto::rr::Name;

use anyhow::{anyhow, bail};
use sha2::Digest;
use tokio::io::AsyncWriteExt;

use crate::barrier::Barrier;
use crate::config;
use crate::dns::DnsChallenges;

pub fn create_restricted_file<T>(path: impl AsRef<std::path::Path>) -> anyhow::Result<T>
where
    std::fs::File: Into<T>,
{
    let mut open_opt = std::fs::OpenOptions::new();
    open_opt.write(true).create(true);
    #[cfg(target_os = "linux")]
    {
        use std::os::unix::fs::OpenOptionsExt;
        open_opt.mode(0o640);
    }
    let std_file = open_opt.open(path)?;
    Ok(std_file.into())
}

/// From RFC 8555:
/// > A client fulfills this challenge by constructing a key authorization from
/// > the "token" value provided in the challenge and the client's account key.
/// > The client then computes the SHA-256 digest of the key authorization. The
/// > record provisioned to the DNS contains the base64url encoding of this
/// > digest.
/// This function computes the digest base64 encoding from the key
/// authorization.
fn key_auth_to_dns_txt(key_auth: &str) -> String {
    static BASE64_ENGINE: base64::engine::GeneralPurpose = {
        let alpha = base64::alphabet::URL_SAFE;
        let config = base64::engine::general_purpose::NO_PAD;
        base64::engine::GeneralPurpose::new(&alpha, config)
    };
    let hash = sha2::Sha256::digest(key_auth.as_bytes());
    BASE64_ENGINE.encode(hash)
}

// A lot of the code here relies on the use of a "barrier". This is
// because without synchronziation, the following race condition used to occur.
// Unfortunately, the exact scenario has been lost in time.

/// Entry point at the [`config::Account`] level.
///
/// # Arguments
///
/// - `config_account`: One of the ACME account of the user configuration
/// - `acme_dir`: A directory object representing an ACME server
/// - `handle`: The DNS Worker which will reply to the challenge
/// - `barrier`: A synchronisation barrier
#[instrument(name = "", level="debug",skip_all,fields(account = %config_account.email))]
pub async fn process_config_account(
    config_account: config::Account,
    acme_dir: Arc<acme2::Directory>,
    handle: DnsChallenges,
    barrier: Barrier,
) -> anyhow::Result<()> {
    tracing::info!("Processing account {}", &config_account.email);
    let priv_key = {
        if !config_account.private_key_path.exists() {
            bail!(
                "Private key for account <{}>, expected to be located at {} does not exist. \
                Consider generating it with agnos-generate-accounts-keys.",
                config_account.email,
                config_account.private_key_path.display()
            )
        }
        let buf = tokio::fs::read(&config_account.private_key_path).await?;
        openssl::pkey::PKey::private_key_from_pem(&buf)?
    };
    let account = acme2::AccountBuilder::new(acme_dir.clone())
        .contact(vec![format!("mailto:{}", config_account.email)])
        .terms_of_service_agreed(true)
        .private_key(priv_key)
        .build()
        .await?;
    let barriers = vec![barrier; config_account.certificates.len()];
    let certs_fut = config_account
        .certificates
        .into_iter()
        .zip(barriers)
        .map(|(cert, barrier)| {
            process_config_certificate(cert, account.clone(), handle.clone(), barrier)
        });
    for res in join_all(certs_fut).await.into_iter() {
        res?;
    }
    Ok(())
}

/// Entry point at the [`config::Certificate`] level.
///
/// # Arguments
///
/// - `config_cert`: One of the ACME certificate of the user configuration
/// - `account`: The ACME account to which the certificate belongs
/// - `handle`: The DNS Worker which will reply to the challenge
/// - `barrier`: A synchronisation barrier
#[instrument(name = "", level="debug",skip_all,fields(cert = %config_cert.fullchain_output_file.display()))]
pub async fn process_config_certificate(
    config_cert: config::Certificate,
    account: Arc<acme2::Account>,
    handle: DnsChallenges,
    barrier: Barrier,
) -> anyhow::Result<()> {
    tracing::info!(
        "Processing certificate {}",
        &config_cert.fullchain_output_file.display()
    );
    match tokio::fs::read(&config_cert.fullchain_output_file).await {
        Err(e) => match e.kind() {
            std::io::ErrorKind::NotFound => {
                tracing::info!("Certificate not found on disk, continuing...")
            }
            _ => {
                anyhow::bail!(e)
            }
        },
        Ok(f) => {
            tracing::info!("Certificate chain found on disk, checking its validity");
            let current_certs = openssl::x509::X509::stack_from_pem(&f)?;
            let mut need_renewal = false;
            let today_plus_validity = openssl::asn1::Asn1Time::days_from_now(30)?;
            for c in current_certs {
                let end = c.not_after();
                let to_renew = end < today_plus_validity;
                tracing::debug!(
                    "Found certificate for {:?} ending: {}. Need renewal: {}",
                    c.subject_name(),
                    end,
                    to_renew
                );
                need_renewal |= to_renew;
            }
            if !need_renewal {
                tracing::info!("No certificate in the chain requires renewal.");
                return Ok(());
            } else {
                tracing::info!(
                    "A certificate in the chain expires in 30 days or less, renewing it."
                )
            }
        }
    };

    tracing::debug!("Building order...");
    let mut order = acme2::OrderBuilder::new(account);
    for domain in config_cert.domains {
        order.add_dns_identifier(domain);
    }
    let order = order.build().await?;

    tracing::debug!("Obtaining authorizations");
    let authorizations = order.authorizations().await?;

    tracing::info!("Processing authorizations");
    let n_auth_total = authorizations.len();
    let barriers = vec![barrier; n_auth_total];
    let authorizations_fut =
        authorizations
            .into_iter()
            .enumerate()
            .zip(barriers)
            .map(|((n_auth, auth), barrier)| {
                let handle = handle.clone();
                let span =
                    debug_span!("",domain = %auth.identifier.value, wildcard = auth.wildcard);
                async move {
                    tracing::debug!("Processing authorization {}/{}", n_auth + 1, n_auth_total);
                    let challenge = auth.get_challenge("dns-01").unwrap();
                    let key = challenge
                        .key_authorization()?
                        .ok_or_else(|| anyhow!("Challenge's key was None"))?;
                    let txt_value = key_auth_to_dns_txt(&key);
                    tracing::debug!("TXT value: {}", txt_value);
                    // TODO: to check when clarifying FQDNs.
                    let domain_validated: Name = format!("{}.", &auth.identifier.value).parse()?;
                    tracing::info!(
                        "Adding challenge {} to dns zone for domain '{}'.",
                        &txt_value,
                        &domain_validated
                    );
                    handle.add_token(domain_validated, txt_value);
                    barrier.wait().await;
                    tracing::debug!("Requesting challenge validation from acme server.");
                    let challenge = challenge.validate().await?;
                    let challenge = challenge.wait_done(Duration::from_secs(5), 30).await?;
                    if !matches!(challenge.status, acme2::ChallengeStatus::Valid) {
                        bail!(
                            "Challenge status is not valid, challenge status is: {:?}",
                            challenge.status
                        )
                    }
                    tracing::debug!("Requesting authorization validation from acme server.");
                    let authorization = auth.wait_done(Duration::from_secs(5), 10).await?;
                    if !matches!(authorization.status, acme2::AuthorizationStatus::Valid) {
                        bail!(
                            "Authorization status is not valid, authorization status is: {:?}",
                            authorization.status
                        )
                    }
                    Ok(())
                }
                .instrument(span)
            });
    let authorization_res: anyhow::Result<Vec<_>> =
        join_all(authorizations_fut).await.into_iter().collect();
    authorization_res?;

    tracing::info!("Waiting for order to be ready on ACME server.");
    let order = order.wait_ready(Duration::from_secs(5), 3).await?;
    if !matches!(order.status, acme2::OrderStatus::Ready) {
        bail!(
            "Order status is not Ready, order status is: {:?}",
            order.status
        )
    }
    let pkey = acme2::gen_ec_p256_private_key()?;
    let pkey_pem = pkey.private_key_to_pem_pkcs8()?;
    let order = order.finalize(acme2::Csr::Automatic(pkey)).await?;
    tracing::info!("Waiting for certificate signature by the ACME server.");
    let order = order.wait_done(Duration::from_secs(5), 3).await?;
    if !matches!(order.status, acme2::OrderStatus::Valid) {
        bail!(
            "Order status is not valid, order status is: {:?}",
            order.status
        )
    }
    tracing::info!("Downloading certificate.");
    let cert = order
        .certificate()
        .await?
        .ok_or_else(|| anyhow!("Certificate was None"))?;
    assert!(cert.len() > 1);

    tracing::info!(
        "Writting certificate to file {}.",
        config_cert.fullchain_output_file.display()
    );
    {
        let mut certificate_file: tokio::fs::File =
            create_restricted_file(&config_cert.fullchain_output_file)?;
        for c in cert {
            certificate_file.write_all(&c.to_pem()?).await?;
            certificate_file.write_all(b"\n").await?;
        }
    }
    tracing::info!(
        "Writting certificate key to file {}.",
        config_cert.key_output_file.display()
    );
    {
        let mut private_key_file: tokio::fs::File =
            create_restricted_file(&config_cert.key_output_file)?;
        private_key_file.write_all(&pkey_pem).await?;
    }
    Ok(())
}
