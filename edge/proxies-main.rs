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

const DEFAULT_PROXY_FILE: &str = "edge/assets/p-list-december.txt";
const DEFAULT_OUTPUT_FILE: &str = "sub/ProxyIP-Daily.md";
const DEFAULT_MAX_CONCURRENT: usize = 60;
const DEFAULT_TIMEOUT_SECONDS: u64 = 6;
const REQUEST_DELAY_MS: u64 = 40;

const GOOD_ISPS: &[&str] = &[
    "M247","Vultr","GCore","IONOS","Google","Amazon","NetLab","Akamai","Turunc","Contabo",
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
#[command(about = "Checks proxies via Cloudflare /meta and outputs active ones")]
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
struct CfMeta {
    #[serde(rename = "clientIp", alias = "ip")]
    client_ip: Option<String>,

    #[serde(rename = "asOrganization")]
    as_organization: Option<String>,

    country: Option<String>,
    region: Option<String>,
    city: Option<String>,
}

#[derive(Debug, Clone)]
struct ProxyInfo {
    ip: String,
    isp: String,
    country: String,
    region: String,
    city: String,
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

    let self_ip = match fetch_cf_meta(None).await {
        Ok(meta) => {
            let ip = meta.client_ip.unwrap_or_else(|| "0.0.0.0".to_string());
            println!("Your real IP: {}", ip);
            ip
        },
        Err(e) => {
            eprintln!("Warning: Failed to fetch self IP: {}. Assuming 0.0.0.0", e);
            "0.0.0.0".to_string()
        }
    };

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

async fn fetch_cf_meta(proxy: Option<(String, u16)>) -> Result<CfMeta> {
    let host = "speed.cloudflare.com";
    let url = format!("https://{}/meta", host);

    let timeout_duration = Duration::from_secs(DEFAULT_TIMEOUT_SECONDS);

    let mut client_builder = Client::builder()
        .timeout(timeout_duration)
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    if let Some((ip, port)) = proxy {
        let addr_str = format!("{}:{}", ip, port);
        let addr: std::net::SocketAddr = addr_str
            .parse()
            .context(format!("Invalid IP/port combination: {}", addr_str))?;
        client_builder = client_builder.resolve(host, addr);
    }

    let client = client_builder.build().context("Failed to build reqwest client")?;

    let response = client.get(&url)
        .header("Host", host)
        .send()
        .await
        .context("Failed to send request")?;

    let text = response.text().await.context("Failed to read response body")?;

    let meta: CfMeta = serde_json::from_str(&text)
        .map_err(|e| anyhow::anyhow!("JSON Parse Error: {}. Body: {}", e, text))?;

    Ok(meta)
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

    let start = Instant::now();
    match fetch_cf_meta(Some((ip.to_string(), port))).await {
        Ok(meta) => {
            if let Some(remote_ip) = meta.client_ip {
                if remote_ip != self_ip {
                    let ping = start.elapsed().as_millis();
                    let info = ProxyInfo {
                        ip: remote_ip,
                        isp: meta.as_organization.unwrap_or_else(|| "Unknown".to_string()),
                        country: meta.country.unwrap_or_else(|| "Unknown".to_string()),
                        region: meta.region.unwrap_or_else(|| "Unknown".to_string()),
                        city: meta.city.unwrap_or_else(|| "Unknown".to_string()),
                    };
                    println!("{}", format!("PROXY LIVE 🟩: {} ({} ms)", ip, ping).green());
                    let mut active_proxies_locked = active_proxies.lock().unwrap_or_else(|e| e.into_inner());
                    active_proxies_locked.entry(info.country.clone()).or_default().push((info, ping));
                } else {
                    println!("PROXY DEAD ❌: {} (did not change IP)", ip);
                }
            } else {
                println!("PROXY DEAD ❌: {} (No IP returned)", ip);
            }
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

    for (country, proxies) in proxies_by_country.iter() {
        let mut sorted_proxies = proxies.clone();
        sorted_proxies.sort_by_key(|&(_, ping)| ping);
        let flag = country_flag(country);

        writeln!(
            file,
            "## {} {} ({} proxies)",
            flag,
            country,
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
