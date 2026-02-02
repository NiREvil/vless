use anyhow::{Context, Result};
use clap::Parser;
use serde::Deserialize;
use std::collections::{BTreeMap, HashMap};
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use chrono::{Duration as ChronoDuration, Utc};
use chrono_tz::Asia::Tehran;
use colored::*;
use futures::StreamExt;
use reqwest::Client;

const DEFAULT_PROXY_FILE: &str = "edge/assets/p-list-february.txt";
const DEFAULT_OUTPUT_FILE: &str = "sub/ProxyIP-Daily.md";
const DEFAULT_MAX_CONCURRENT: usize = 50;
const DEFAULT_TIMEOUT_SECONDS: u64 = 6;
const REQUEST_DELAY_MS: u64 = 50;
const CHECK_URL: &str = "https://ipp.nscl.ir"; 

const GOOD_ISPS: &[&str] = &[
    "M247","OVH","Vultr","GCore","IONOS","Google","Amazon","NetLab","Akamai","Turunc","Contabo",
    "UpCloud","Tencent","Hetzner","Multacom","HostPapa","Ultahost","DataCamp","Bluehost",
    "Scaleway","DO Space","Leaseweb","Hostinger","netcup GmbH","Protilab","ByteDance","RackSpace",
    "SiteGround","Online Ltd","The Empire","Cloudflare","Relink LTD","PQ Hosting","Gigahost AS",
    "White Label","G-Core Labs","3HCLOUD LLC","HOSTKEY B.V","DigitalOcean","3NT SOLUTION",
    "Zenlayer Inc","RackNerd LLC","Plant Holding","WorkTitans","IROKO Networks","WorldStream",
    "Cluster","The Constant Company","Cogent Communications","Metropolis networks inc",
    "Total Uptime Technologies",
];

#[derive(Parser, Clone)]
#[command(name = "Proxy Checker")]
struct Args {
    #[arg(short, long, default_value = DEFAULT_PROXY_FILE)]
    proxy_file: String,

    #[arg(short, long, default_value = DEFAULT_OUTPUT_FILE)]
    output_file: String,

    #[arg(long, default_value_t = DEFAULT_MAX_CONCURRENT)]
    max_concurrent: usize,

    #[arg(long, default_value_t = DEFAULT_TIMEOUT_SECONDS)]
    timeout: u64,
}

#[derive(Debug, Clone, Deserialize)]
struct WorkerResponse {
    ip: String,
    cf: WorkerCf,
}

#[derive(Debug, Clone, Deserialize)]
struct WorkerCf {
    #[serde(rename = "asOrganization")]
    isp: Option<String>,
    city: Option<String>,
    region: Option<String>,
    country: Option<String>,
}

#[derive(Debug, Clone)]
struct ProxyInfo {
    ip: String,
    isp: String,
    country_code: String,
    city: String,
    region: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    if let Some(parent) = Path::new(&args.output_file).parent() {
        fs::create_dir_all(parent).context("Failed to create output directory")?;
    }
    File::create(&args.output_file).context("Failed to create output file")?;

    let proxies = read_proxy_file(&args.proxy_file).context("Failed to read proxy file")?;
    println!("Loaded {} proxies from file", proxies.len());

    let proxies: Vec<String> = proxies
        .into_iter()
        .filter(|line| {
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() < 4 {
                return false;
            }
            let port_ok = parts[1].trim() == "443";
            let isp_name = parts[3].to_string();
            let isp_ok = GOOD_ISPS.iter().any(|kw| isp_name.contains(kw));
            port_ok && isp_ok
        })
        .collect();
    println!("Filtered to {} good proxies (port 443 + ISP whitelist)", proxies.len());

    let self_ip = fetch_self_ip().await.unwrap_or_else(|_| "0.0.0.0".to_string());
    println!("Your real IP: {}", self_ip);

    let active_proxies = Arc::new(Mutex::new(BTreeMap::<String, Vec<(ProxyInfo, u128)>>::new()));

    let tasks = futures::stream::iter(
        proxies.into_iter().map(|proxy_line| {
            let active_proxies = Arc::clone(&active_proxies);
            let self_ip = self_ip.clone();
            async move {
                tokio::time::sleep(Duration::from_millis(REQUEST_DELAY_MS)).await;
                process_proxy(proxy_line, &active_proxies, &self_ip).await;
            }
        })
    )
    .buffer_unordered(args.max_concurrent)
    .collect::<Vec<()>>();

    tasks.await;

    let locked_proxies = active_proxies.lock().unwrap_or_else(|e| e.into_inner());
    write_markdown_file(&locked_proxies, &args.output_file).context("Failed to write Markdown file")?;

    println!("Proxy checking completed.");
    Ok(())
}

async fn fetch_self_ip() -> Result<String> {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()?;
    
    match client.get(CHECK_URL).send().await {
        Ok(resp) => {
            if let Ok(json) = resp.json::<WorkerResponse>().await {
                return Ok(json.ip);
            }
        }
        Err(_) => {}
    }
    
    let resp = client.get("https://api.ipify.org").send().await?.text().await?;
    Ok(resp.trim().to_string())
}

async fn check_proxy_worker(
    ip: &str,
    port: u16,
    self_ip: &str,
) -> Result<(WorkerResponse, u128)> {
    use anyhow::anyhow;
    use tokio::net::TcpStream;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use native_tls::TlsConnector;
    use tokio_native_tls::TlsConnector as TokioTlsConnector;

    let timeout = Duration::from_secs(DEFAULT_TIMEOUT_SECONDS);

    let start_ping = Instant::now();
    let tcp = tokio::time::timeout(
        timeout,
        TcpStream::connect(format!("{}:{}", ip, port))
    ).await??;

    let tls = TokioTlsConnector::from(
        TlsConnector::builder().build()?
    );

    let mut stream = tokio::time::timeout(
        timeout,
        tls.connect("speed.cloudflare.com", tcp)
    ).await??;

    let ping = start_ping.elapsed().as_millis();

    let req = concat!(
        "GET /meta HTTP/1.1\r\n",
        "Host: speed.cloudflare.com\r\n",
        "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\r\n",
        "Accept: */*\r\n",
        "Accept-Encoding: identity\r\n",
        "Referer: https://speed.cloudflare.com/\r\n",
        "Origin: https://speed.cloudflare.com\r\n",
        "Connection: close\r\n\r\n"
    );

    stream.write_all(req.as_bytes()).await?;

    let mut buf = Vec::new();
    let mut tmp = [0u8; 8192];
    while let Ok(n) = stream.read(&mut tmp).await {
        if n == 0 { break; }
        buf.extend_from_slice(&tmp[..n]);
    }

    let text = String::from_utf8_lossy(&buf);

    let body = if let Some(pos) = text.find("\r\n\r\n") {
        &text[pos + 4..]
    } else {
        &text
    };

    let body = body.trim();

    let v: serde_json::Value = serde_json::from_str(body)?;

    let out_ip = v.get("clientIp")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    if out_ip.is_empty() || out_ip == self_ip {
        return Err(anyhow!("IP match or empty"));
    }

    Ok((
        WorkerResponse {
            ip: out_ip,
            cf: WorkerCf {
                isp: v.get("asOrganization").and_then(|v| v.as_str()).map(String::from),
                city: v.get("city").and_then(|v| v.as_str()).map(String::from),
                region: v.get("region").and_then(|v| v.as_str()).map(String::from),
                country: v.get("country").and_then(|v| v.as_str()).map(String::from),
            },
        },
        ping
    ))
}

async fn process_proxy(
    proxy_line: String,
    active_proxies: &Arc<Mutex<BTreeMap<String, Vec<(ProxyInfo, u128)>>>>,
    self_ip: &str,
) {
    let parts: Vec<&str> = proxy_line.split(',').collect();
    if parts.len() < 2 {
        return;
    }

    let ip = parts[0];
    let port = parts[1].parse::<u16>().unwrap_or(443);
    let csv_isp = if parts.len() > 3 {
        parts[3].trim().to_string()
    } else {
        "Unknown".to_string()
    };

    match check_proxy_worker(ip, port, self_ip).await {
        Ok((data, ping)) => {
            let info = ProxyInfo {
                ip: data.ip,
                isp: data.cf.isp.unwrap_or(csv_isp),
                country_code: data.cf.country.unwrap_or_else(|| "XX".to_string()),
                city: data.cf.city.unwrap_or_else(|| "Unknown".to_string()),
                region: data.cf.region.unwrap_or_else(|| "Unknown".to_string()),
            };

            println!(
                "{}",
                format!("PROXY LIVE 🟩: {} ({} ms) - {}", ip, ping, info.city).green()
            );

            let mut active_proxies_locked =
                active_proxies.lock().unwrap_or_else(|e| e.into_inner());

            active_proxies_locked
                .entry(info.country_code.clone())
                .or_default()
                .push((info, ping));
        }
        Err(e) => {
            println!("PROXY DEAD ❌: {} ({})", ip, e);
        }
    }
}

fn write_markdown_file(proxies_by_country: &BTreeMap<String, Vec<(ProxyInfo, u128)>>, output_file: &str) -> io::Result<()> {
    let mut file = File::create(output_file)?;

    let total_active = proxies_by_country.values().map(|v| v.len()).sum::<usize>();
    let total_countries = proxies_by_country.len();
    let avg_ping = if total_active > 0 {
        let sum_ping: u128 = proxies_by_country.values().flatten().map(|(_, p)| *p).sum();
        sum_ping / total_active as u128
    } else {
        0
    };

    let now = Utc::now();
    let tehran_now = now.with_timezone(&Tehran);
    let tehran_next = tehran_now + ChronoDuration::days(1);
    let last_updated_str = tehran_now.format("%a, %d %b %Y %H:%M").to_string();
    let next_update_str = tehran_next.format("%a, %d %b %Y %H:%M").to_string();

    fn encode_badge_label(s: &str) -> String {
        s.replace(' ', "%20")
         .replace(':', "%3A")
         .replace(',', "%2C")
         .replace('+', "%2B")
         .replace('(', "%28")
         .replace(')', "%29")
    }

    let last_badge_label = encode_badge_label(&format!("{} (UTC+3:30)", last_updated_str));
    let next_badge_label = encode_badge_label(&format!("{} (UTC+3:30)", next_update_str));

    let last_badge = format!("<img src=\"https://img.shields.io/badge/Last_Update-{}-966600\" />", last_badge_label);
    let next_badge = format!("<img src=\"https://img.shields.io/badge/Next_Update-{}-966600\" />", next_badge_label);
    let active_badge = format!("<img src=\"https://img.shields.io/badge/Active_Proxies-{}-966600\" />", total_active);
    let countries_badge = format!("<img src=\"https://img.shields.io/badge/Countries-{}-966600\" />", total_countries);
    let latency_badge = format!("<img src=\"https://img.shields.io/badge/Avg_Latency-{}ms-darkred\" />", avg_ping);


    writeln!(
        file,
        r##"<p align="left">
 <img src="https://latex.codecogs.com/svg.image?\huge&space;{{\color{{Golden}}\mathrm{{PR{{\color{{black}}\O}}XY\;IP}}" width=220px" </p><br/>

> [!WARNING]
>
> <p><b>Daily Fresh Proxies</b></p>
>
> A curated list of <b>high-quality</b>, fully-tested proxies sourced from reputable ISPs and major global data centers (e.g., Google, Amazon, Cloudflare, Tencent, Hetzner, and others)
>
> <br/>
>
> <p><b>Auto-Updated Daily</b></p>
>
> {last}  
> {next}
>
> <br/>
>
> <p><b>Overview</b></p>  
>
> {active}  
> {countries}  
> {latency}
>
> <br><br/>  
"##,
        last = last_badge,
        next = next_badge,
        active = active_badge,
        countries = countries_badge,
        latency = latency_badge,
    )?;

    let top_providers = ["Google", "Amazon", "Cloudflare", "Tencent", "Hetzner"];

    let mut provider_buckets: HashMap<&str, Vec<(ProxyInfo, u128)>> = HashMap::new();
    for prov in top_providers.iter() {
        provider_buckets.insert(prov, Vec::new());
    }

    for (_country, proxies) in proxies_by_country.iter() {
        for (info, ping) in proxies.iter() {
            for prov in top_providers.iter() {
                if info.isp.to_lowercase().contains(&prov.to_lowercase()) {
                    if let Some(vec) = provider_buckets.get_mut(prov) {
                        vec.push((info.clone(), *ping));
                    }
                }
            }
        }
    }

    for prov in top_providers.iter() {
        if let Some(list) = provider_buckets.get(prov) {
            if !list.is_empty() {
                let prov_logo = provider_logo_html(prov);
                let prov_title = match prov_logo {
                    Some(ref html) => format!("{} {}", html, prov),
                    None => prov.to_string(),
                };
                writeln!(file, "## {} ({})", prov_title, list.len())?;
                writeln!(file, "<details>")?;
                writeln!(file, "<summary>Click to expand</summary>\n")?;
                writeln!(file, "|   IP   |   ISP    |   Location   |   Ping   |")?;
                writeln!(file, "|:-------|:---------|:------------:|:--------:|")?;
                let mut sorted = list.clone();
                sorted.sort_by_key(|&(_, p)| p);
                for (info, ping) in sorted.iter() {
                    let location = format!("{}, {}", info.region, info.city);
                    let emoji = if *ping < 1099 {
                        "⚡"
                    } else if *ping < 1599 {
                        "🐇"
                    } else {
                        "🐌"
                    };
                    let isp_cell = info.isp.clone();

                    writeln!(
                        file,
                        "| <pre><code>{}</code></pre> | {} | {} | {} ms {} |",
                        info.ip, isp_cell, location, ping, emoji
                    )?;
                }
                writeln!(file, "\n</details>\n\n---\n")?;
            }
        }
    }

    for (country_code, proxies) in proxies_by_country.iter() {
        let mut sorted_proxies = proxies.clone();
        sorted_proxies.sort_by_key(|&(_, ping)| ping);
        let flag = country_flag(country_code);
        let name = get_country_name(country_code);

        writeln!(
            file,
            "## {} {} ({} proxies)",
            flag,
            name,
            sorted_proxies.len()
        )?;
        writeln!(file, "<details>")?;
        writeln!(file, "<summary>Click to expand</summary>\n")?;
        writeln!(file, "|   IP   |   ISP   |   Location   |   Ping   |")?;
        writeln!(file, "|:-------|:--------|:------------:|:--------:|")?;

        for (info, ping) in sorted_proxies.iter() {
            let location = format!("{}, {}", info.region, info.city);
            let emoji = if *ping < 1099 {
                "⚡"
            } else if *ping < 1599 {
                "🐇"
            } else {
                "🐌"
            };
            let isp_cell = info.isp.clone();

            writeln!(
                file,
                "| <pre><code>{}</code></pre> | {} | {} | {} ms {} |",
                info.ip, isp_cell, location, ping, emoji
            )?;
        }

        writeln!(file, "\n</details>\n\n---\n")?;
    }

    println!("All active proxies saved to {}", output_file);
    Ok(())
}

fn provider_logo_html(isp: &str) -> Option<String> {
    let mapping = [
        ("Google", "google.com"),
        ("Amazon", "amazon.com"),
        ("Cloudflare", "cloudflare.com"),
        ("Hetzner", "hetzner.com"),
        ("Hostinger", "hostinger.com"),
        ("Tencent", "www.tencent.com"),
        ("DigitalOcean", "digitalocean.com"),
        ("Vultr", "vultr.com"),
    ];

    for (kw, domain) in mapping.iter() {
        if isp.to_lowercase().contains(&kw.to_lowercase()) {
            let html = format!(
                "<img alt=\"{}\" src=\"https://www.google.com/s2/favicons?sz=22&domain_url={}\" />",
                isp, domain
            );
            return Some(html);
        }
    }

    None
}

fn country_flag(code: &str) -> String {
    code.chars()
        .filter_map(|c| {
            if c.is_ascii_alphabetic() {
                Some(char::from_u32(0x1F1E6 + (c.to_ascii_uppercase() as u32 - 'A' as u32)).unwrap())
            } else {
                None
            }
        })
        .collect()
}

fn get_country_name(code: &str) -> String {
    match code.to_uppercase().as_str() {
        "US" => "United States".to_string(),
        "DE" => "Germany".to_string(),
        "GB" => "United Kingdom".to_string(),
        "FR" => "France".to_string(),
        "NL" => "Netherlands".to_string(),
        "CA" => "Canada".to_string(),
        "AU" => "Australia".to_string(),
        "JP" => "Japan".to_string(),
        "CN" => "China".to_string(),
        "SG" => "Singapore".to_string(),
        "KR" => "South Korea".to_string(),
        "IN" => "India".to_string(),
        "RU" => "Russia".to_string(),
        "BR" => "Brazil".to_string(),
        "IT" => "Italy".to_string(),
        "ES" => "Spain".to_string(),
        "SE" => "Sweden".to_string(),
        "CH" => "Switzerland".to_string(),
        "TR" => "Turkey".to_string(),
        "PL" => "Poland".to_string(),
        "FI" => "Finland".to_string(),
        "NO" => "Norway".to_string(),
        "IE" => "Ireland".to_string(),
        "BE" => "Belgium".to_string(),
        "AT" => "Austria".to_string(),
        "DK" => "Denmark".to_string(),
        "CZ" => "Czech Republic".to_string(),
        "UA" => "Ukraine".to_string(),
        "HK" => "Hong Kong".to_string(),
        "TW" => "Taiwan".to_string(),
        "IR" => "Iran".to_string(),
        "ZA" => "South Africa".to_string(),
        "RO" => "Romania".to_string(),
        "ID" => "Indonesia".to_string(),
        "VN" => "Vietnam".to_string(),
        "TH" => "Thailand".to_string(),
        "MY" => "Malaysia".to_string(),
        "MX" => "Mexico".to_string(),
        "AR" => "Argentina".to_string(),
        "CL" => "Chile".to_string(),
        "CO" => "Colombia".to_string(),
        "IL" => "Israel".to_string(),
        "AE" => "United Arab Emirates".to_string(),
        "SA" => "Saudi Arabia".to_string(),
        "PT" => "Portugal".to_string(),
        "HU" => "Hungary".to_string(),
        "GR" => "Greece".to_string(),
        "BG" => "Bulgaria".to_string(),
        _ => code.to_string(),
    }
}

fn read_proxy_file(file_path: &str) -> io::Result<Vec<String>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let mut proxies = Vec::new();

    for line in reader.lines() {
        let line = line?;
        if !line.trim().is_empty() {
            proxies.push(line);
        }
    }

    Ok(proxies)
}
