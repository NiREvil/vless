#![allow(unreachable_code)]
#![forbid(missing_docs, rustdoc::broken_intra_doc_links)]
//! Agnos is a single-binary program allowing you to easily obtain certificates (including wildcards) from [Let's Encrypt](https://letsencrypt.org/) using [DNS-01](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge) challenges. It answers Let's Encrypt DNS queries on its own, bypassing the need for API calls to your DNS provider.
//!
//! More info in the repository's [README](https://github.com/krtab/agnos#readme).

use clap::{Arg, ArgAction};
use futures_util::future::join_all;
use reqwest::Certificate;

use tracing_subscriber::prelude::*;

use agnos::barrier::Barrier;
use agnos::config::Config;
use agnos::dns::DnsWorker;
use agnos::main_logic::*;

static ACME_URL_STAGING: &str = "https://acme-staging-v02.api.letsencrypt.org/directory";
static ACME_URL: &str = "https://acme-v02.api.letsencrypt.org/directory";

#[tokio::main]
// #[instrument]
async fn main() -> anyhow::Result<()> {
    let cli_ops = clap::command!()
        .arg_required_else_help(true)
        .arg(
            Arg::new("config")
                .required(true)
                .action(ArgAction::Set)
                .value_name("config.toml")
                .help("Path to the configuration file."),
        )
        .arg(
            Arg::new("no-color")
                .long("no-color")
                .help("Deactivates colors in output.")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("debug")
                .long("debug")
                .help("Activates debug output.")
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("no-staging")
                .long("no-staging")
                .help(
                    "Use Let's Encrypt production server \
                    for certificate validation. Set this \
                    flag once you have tested your \
                    configuration.",
                )
                .action(ArgAction::SetTrue),
        )
        .arg(
            Arg::new("acme-url")
                .long("acme-url")
                .action(ArgAction::Set)
                .value_name("url")
                .conflicts_with("no-staging")
                .help(
                    "Use the given URL as ACME server. Incompatible \
                    with the '--no-staging' option.",
                ),
        )
        .arg(
            Arg::new("acme-serv-ca")
                .long("acme-serv-ca")
                .action(ArgAction::Set)
                .value_name("acme_ca_root.pem")
                .help(
                    "The root certificate (in PEM format) of the ACME server's HTTPS interface. \
                    Mostly useful when testing with the pebbles ACME server.",
                ),
        )
        .arg(
            Arg::new("no-wait")
                .long("no-wait")
                .action(ArgAction::SetTrue)
                .hide(true),
        )
        .get_matches();

    let debug_mode = cli_ops.get_flag("debug");

    let tracing_filter = std::env::var("RUST_LOG").unwrap_or(if debug_mode {
        format!(
            "info,{}=debug,hickory_server=off",
            env!("CARGO_CRATE_NAME")
        )
    } else {
        "info,hickory_server=off".to_owned()
    });

    tracing_subscriber::fmt()
        .with_env_filter(tracing_filter)
        .with_ansi(!cli_ops.get_flag("no-color"))
        .finish()
        .with(tracing_error::ErrorLayer::default())
        .init();

    let config_file =
        tokio::fs::read_to_string(cli_ops.get_one::<String>("config").unwrap()).await?;
    let config: Config = toml::from_str(&config_file)?;

    let dns_worker = DnsWorker::new(config.dns_listen_addr).await?;
    let dns_handle = dns_worker.challenges();

    let acme_url = if cli_ops.get_flag("no-staging") {
        ACME_URL.to_string()
    } else if let Some(url) = cli_ops.get_one::<String>("acme-url") {
        url.clone()
    } else {
        ACME_URL_STAGING.to_string()
    };
    let mut http_client_bldr = reqwest::ClientBuilder::new();
    if let Some(cert_path) = cli_ops.get_one::<String>("acme-serv-ca") {
        let file_content = std::fs::read(cert_path)?;
        let certif = Certificate::from_pem(&file_content)?;
        http_client_bldr = http_client_bldr.add_root_certificate(certif);
    }
    let acme_dir = acme2::DirectoryBuilder::new(acme_url)
        .http_client(http_client_bldr.build()?)
        .build()
        .await?;
    let barriers = vec![Barrier::new(cli_ops.get_flag("no-wait")); config.accounts.len()];
    let accounts_futures = config
        .accounts
        .into_iter()
        .zip(barriers)
        .map(|(acc, barrier)| {
            process_config_account(acc, acme_dir.clone(), dns_handle.clone(), barrier)
        });
    let acme_fut = join_all(accounts_futures);
    let dns_worker_fut = dns_worker.run();
    let accounts_ress = tokio::select! {
        res = acme_fut => res,
        _ = dns_worker_fut => unreachable!("DNS worker should run endlessly.")
    };
    for res in accounts_ress {
        res?;
    }
    Ok(())
}
