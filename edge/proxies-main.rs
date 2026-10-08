use std::collections::{BTreeMap, HashMap, HashSet};
use colored::*;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::fs::{self, File};
use std::io::{self, BufRead, BufReader, Write};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use chrono::{Duration as ChronoDuration, Utc};
use chrono_tz::Asia::Tehran;
use futures::StreamExt;
use native_tls::TlsConnector as NativeTlsConnector;
use serde::Serialize;
use serde_json::Value;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio::sync::Semaphore;
use tokio_native_tls::TlsConnector as TokioTlsConnector;

static API_INDEX_COUNTER: AtomicUsize = AtomicUsize::new(0);
static RISK_DIRECT_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_CORSPROXY_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_CODETABS_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_ALLORIGINS_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_THINGPROXY_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_JSONP_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_UNKNOWN_SOURCE_SUCCESS: AtomicUsize = AtomicUsize::new(0);
static RISK_CONCURRENCY: Semaphore = Semaphore::const_new(6);
static RISK_FAILURES: AtomicUsize = AtomicUsize::new(0);

const PRIMARY_WORKER_HOST: &str = "cf-connecting.pages.dev";
const CF_TRACE_HOST: &str = "1.1.1.1";
const RISK_API_HOSTS: &[&str] = &[
    "api.cf-connect.workers.dev",
    "apii.cf-connect.workers.dev",
    "api.serpents.workers.dev",
    "harmonica.serpents.workers.dev",
];

const DEFAULT_OUTPUT_FILE: &str = "sub/ProxyIP-Daily.md";
const ZIZIFN_JSON_FILE: &str = "sub/ProxyIP-for-zizifn.json";
const DEFAULT_PROXY_FILE: &str = "edge/assets/REvil-proxies.csv";
const NORTHERN_TERRITORY_ENV: &str = "NORTHERN_TERRITORY";

const MAX_CONCURRENT_SCANS: usize = 100;
const TIMEOUT_SECONDS: u64 = 5;
const RISK_TIMEOUT_SECONDS: u64 = 8;
const TARGET_PROXY_PORT: u16 = 443;

type Result<T> = std::result::Result<T, Box<dyn std::error::Error + Send + Sync>>;

#[derive(Debug, Clone)]
struct ProxyInfo {
    ip: String,
    isp: String,
    country_code: String,
    city: String,
    region: String,
    fraud_score: i64,
    risk: String,
}

#[derive(Debug, Serialize)]
struct ZizifnProxy {
    ip: String,
    port: u16,
    isp: String,
    country: String,
    city: String,
    region: String,
    score: i64,
    risk: String,
}

#[derive(Debug, Serialize)]
struct ZizifnDataset {
    updated_at: String,
    proxies: Vec<ZizifnProxy>,
    providers: BTreeMap<String, Vec<String>>,
    countries: BTreeMap<String, Vec<String>>,
}

#[tokio::main]
async fn main() -> Result<()> {
    if let Some(parent) = Path::new(DEFAULT_OUTPUT_FILE).parent() {
        fs::create_dir_all(parent)?;
    }
    File::create(DEFAULT_OUTPUT_FILE)?;

    let mut seen_ips: HashSet<String> = HashSet::new();
    let mut proxy_candidates: Vec<(String, u16, String)> = Vec::new();

    match read_proxy_file(DEFAULT_PROXY_FILE) {
        Ok(list) => {
            for (ip, port, isp) in list {
                if port == TARGET_PROXY_PORT && seen_ips.insert(ip.clone()) {
                    proxy_candidates.push((ip, port, isp));
                }
            }
            println!("Picked up {} candidates from the proxy list", proxy_candidates.len());
        }
        Err(e) => println!("⚠️ Heads up, Couldn't read the proxy file: {}", e),
    }

    if let Ok(raw_domains) = std::env::var(NORTHERN_TERRITORY_ENV) {
        let domains: Vec<String> = raw_domains
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();

        println!("🔭 Receiving {} 🤷🏻‍♀️ from the Northern Territory", domains.len());
        for domain in domains {
            if let Ok(ips) = resolve_domain(&domain).await {
                for ip in ips {
                    if seen_ips.insert(ip.clone()) {
                        proxy_candidates.push((ip, TARGET_PROXY_PORT, "Private".to_string()));
                    }
                }
            }
        }
    }

    println!("📥 A total of {} unique candidates queued for scanning", proxy_candidates.len());

    let scanner_ip = match get_scanner_ip().await {
        Ok(ip) => ip,
        Err(_) => "0.0.0.0".to_string(),
    };
    println!("☁️ Own exit IP: {}\n", scanner_ip.yellow());

    let validated_proxies = Arc::new(Mutex::new(BTreeMap::<String, Vec<ProxyInfo>>::new()));
    let total_candidates = proxy_candidates.len();
    let live_count = Arc::new(AtomicUsize::new(0));
    let failed_count = Arc::new(AtomicUsize::new(0));

    println!("::group::🌀 Live Scan Started");

    let tasks = futures::stream::iter(proxy_candidates.into_iter().map(|(ip, port, isp_source)| {
        let validated_proxies = Arc::clone(&validated_proxies);
        let scanner_ip = scanner_ip.clone();
        let live_count = Arc::clone(&live_count);
        let failed_count = Arc::clone(&failed_count);
        async move {
            scan_candidate(
                ip, port, isp_source, &validated_proxies, &scanner_ip,
                &live_count, &failed_count
            ).await;
        }
    }))
    .buffer_unordered(MAX_CONCURRENT_SCANS)
    .collect::<Vec<()>>();

    tasks.await;

    println!("::endgroup::");

    let locked_proxies = validated_proxies.lock().unwrap_or_else(|e| e.into_inner());

    write_markdown_report(&locked_proxies, DEFAULT_OUTPUT_FILE)?;
    write_zizifn_json(&locked_proxies, ZIZIFN_JSON_FILE)?;

    let total_live = live_count.load(Ordering::Relaxed);
    let total_failed = failed_count.load(Ordering::Relaxed);

    println!("\n{}", "============================================".cyan().bold());
    println!("{}", "     🌌  SCAN WRAPPED - HERE'S THE LOWDOWN       ".cyan().bold());
    println!("{}\n", "============================================".cyan().bold());
    println!("  🌠 Candidates tested  : {}", total_candidates.to_string().bold());
    println!("  🟢 Alive & kicking    : {}", total_live.to_string().green().bold());
    println!("  🔴 Dead / timed out   : {}", total_failed.to_string().red());
    println!("  🌏 Countries covered  : {}", locked_proxies.len().to_string().yellow().bold());
    println!("\n{}", "--------------------------------------------".dimmed());
    println!("{}", "  🪩 Active proxies per country:".bold());
    
    for (country_code, proxies) in locked_proxies.iter() {
        let flag = generate_country_flag_emoji(country_code);
        let country_name = get_country_name(country_code);
        println!(
            "   {} {:<20} ({}) : {} working",
            flag,
            country_name.cyan(),
            country_code.bold(),
            proxies.len().to_string().green().bold()
        );
    }
    println!("{}\n", "============================================".cyan().bold());
    
    let risk_failures = RISK_FAILURES.load(Ordering::Relaxed);

    if risk_failures > 0 {
      println!("  ⚠️ Risk unavailable     : {}", risk_failures);
      println!();
      println!("🔬 Risk acquisition diagnostics");
      println!("--------------------------------------------");
  
      println!(
          "Direct       : SUCCESS={}",
          RISK_DIRECT_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "CorsProxyIO  : SUCCESS={}",
          RISK_CORSPROXY_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "Codetabs     : SUCCESS={}",
          RISK_CODETABS_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "AllOrigins   : SUCCESS={}",
          RISK_ALLORIGINS_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "ThingProxy   : SUCCESS={}",
          RISK_THINGPROXY_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "JSONP        : SUCCESS={}",
          RISK_JSONP_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!(
          "Unknown      : SUCCESS={}",
          RISK_UNKNOWN_SOURCE_SUCCESS.load(Ordering::Relaxed)
      );
  
      println!("============================================");
  }
      Ok(())
}

async fn scan_candidate(
    ip: String,
    port: u16,
    isp_source: String,
    validated_proxies: &Arc<Mutex<BTreeMap<String, Vec<ProxyInfo>>>>,
    scanner_ip: &str,
    live_count: &Arc<AtomicUsize>,
    failed_count: &Arc<AtomicUsize>,
) {
    
    if let Ok((status, body)) = raw_socket_request(PRIMARY_WORKER_HOST, "/", &ip, port).await {
        if status == 200 {
            if let Ok(json) = serde_json::from_str::<Value>(&body) {
                let resolved_ip = json.get("ip")
                    .or_else(|| json.get("clientIp"))
                    .and_then(|v| v.as_str());

                if let Some(out_ip) = resolved_ip {
                    if out_ip != scanner_ip && !out_ip.is_empty() {
                        let isp = json.get("as_organization")
                            .or_else(|| json.get("asOrganization"))
                            .and_then(|v| v.as_str())
                            .unwrap_or(&isp_source)
                            .to_string();

                        let country = json.get("country")
                            .and_then(|v| v.as_str())
                            .unwrap_or("XX")
                            .to_string();

                        let city = json.get("city")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Unknown")
                            .to_string();

                        let region = json.get("region")
                            .and_then(|v| v.as_str())
                            .unwrap_or("Unknown")
                            .to_string();

                        register_success(
                            ip, isp, country, city, region,
                            validated_proxies, live_count, "Worker"
                        ).await;
                        return;
                    }
                }
            }
        }
    }

    if let Ok((status, body)) = raw_socket_request(CF_TRACE_HOST, "/cdn-cgi/trace", &ip, port).await {
        if status == 200 {
            let (trace_ip, loc) = parse_trace_details(&body);
            if !trace_ip.is_empty() && trace_ip != scanner_ip {
                register_success(
                    ip, isp_source, loc, "Unknown".to_string(), "Unknown".to_string(),
                    validated_proxies, live_count, "CF-Trace"
                ).await;
                return;
            }
        }
    }

    failed_count.fetch_add(1, Ordering::Relaxed);
    println!("  ❌ {:<7} | {:<15} | {}", "DEAD".red().bold(), ip, "Failed verification".dimmed());
}

async fn register_success(
    ip: String,
    isp: String,
    country_code: String,
    city: String,
    region: String,
    validated_proxies: &Arc<Mutex<BTreeMap<String, Vec<ProxyInfo>>>>,
    live_count: &Arc<AtomicUsize>,
    source: &str,
) {
    let risk_result = fetch_risk_assessment_balanced(&ip).await;
    let (fraud_score, risk) = risk_result
      .map(|(score, risk)| (score, risk))
      .unwrap_or((-1, "unknown".to_string()));

    let country_clean = country_code.trim().to_uppercase();
    let country_final = if country_clean.len() > 2 { country_clean[..2].to_string() } else { country_clean };

    let info = ProxyInfo {
        ip: ip.clone(),
        isp,
        country_code: country_final.clone(),
        city,
        region,
        fraud_score,
        risk,
    };

    live_count.fetch_add(1, Ordering::Relaxed);

    let flag = generate_country_flag_emoji(&info.country_code);
    let score_display = if info.fraud_score >= 0 {
    info.fraud_score.to_string()
    } else {
        "N/A".to_string()
    };
    
    println!(
        "  ✅ {:<7} | {:<15} | Score: {:<3} | Via: {:<8} | {} {}",
        "ALIVE".green().bold(),
        ip.bold(),
        score_display,
        source.magenta(),
        flag,
        info.country_code.cyan()
    );

    let mut locked = validated_proxies.lock().unwrap_or_else(|e| e.into_inner());
    locked.entry(info.country_code.clone()).or_default().push(info);
}

async fn fetch_risk_assessment_balanced(ip: &str) -> Option<(i64, String)> {
    let _permit = match RISK_CONCURRENCY.acquire().await {
        Ok(permit) => permit,
        Err(_) => {
            RISK_FAILURES.fetch_add(1, Ordering::Relaxed);
            return None;
        }
    };

    let client = match reqwest::Client::builder()
        .timeout(Duration::from_secs(RISK_TIMEOUT_SECONDS))
        .danger_accept_invalid_certs(true)
        .build()
    {
        Ok(c) => c,
        Err(_) => {
            RISK_FAILURES.fetch_add(1, Ordering::Relaxed);
            return None;
        }
    };

    let start_idx = API_INDEX_COUNTER.fetch_add(1, Ordering::Relaxed);
    let total_apis = RISK_API_HOSTS.len();

    for i in 0..total_apis {
        let current_host = RISK_API_HOSTS[(start_idx + i) % total_apis];
        let url = format!("https://{}/api/{}", current_host, ip);

        let response = match client
            .get(&url)
            .header(
                "User-Agent",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            )
            .header("Accept", "application/json")
            .send()
            .await
        {
            Ok(response) => response,
            Err(_) => continue,
        };

        if !response.status().is_success() {
            continue;
        }

        let value = match response.json::<Value>().await {
            Ok(value) => value,
            Err(_) => continue,
        };
        
        if value
            .get("error")
            .and_then(|e| e.as_bool())
            .unwrap_or(false)
        {
            continue;
        }

        let info = match value.get("info") {
            Some(info) => info,
            None => continue,
        };

        let score = match info
            .get("fraud_score")
            .and_then(|v| v.as_i64())
        {
            Some(score) if (0..=100).contains(&score) => score,
            _ => continue,
        };

        let risk = match info
            .get("risk")
            .and_then(|v| v.as_str())
        {
            Some(risk) if !risk.is_empty() => risk.to_string(),
            _ => continue,
        };

        match info
            .get("risk_source")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
        {
            "Direct" => {
                RISK_DIRECT_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            "CorsProxyIO" => {
                RISK_CORSPROXY_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            "Codetabs" => {
                RISK_CODETABS_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            "AllOrigins" | "AllOrigins Raw" => {
                RISK_ALLORIGINS_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            "ThingProxy" => {
                RISK_THINGPROXY_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            "JSONPlaceholder Proxy" | "JSONP" => {
                RISK_JSONP_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
            _ => {
                RISK_UNKNOWN_SOURCE_SUCCESS.fetch_add(1, Ordering::Relaxed);
            }
        }

        return Some((score, risk));
    }

    RISK_FAILURES.fetch_add(1, Ordering::Relaxed);
    None
}

async fn raw_socket_request(
    host: &str,
    path: &str,
    proxy_ip: &str,
    proxy_port: u16,
) -> Result<(u16, String)> {
    let timeout = Duration::from_secs(TIMEOUT_SECONDS);

    tokio::time::timeout(timeout, async {
        let stream = TcpStream::connect(format!("{}:{}", proxy_ip, proxy_port)).await?;

        let native_connector = NativeTlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()?;
        let tokio_connector = TokioTlsConnector::from(native_connector);

        let mut tls_stream = tokio_connector.connect(host, stream).await?;

        let request = format!(
            "GET {} HTTP/1.1\r\n\
             Host: {}\r\n\
             User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36\r\n\
             Accept: */*\r\n\
             Connection: close\r\n\r\n",
            path, host
        );

        tls_stream.write_all(request.as_bytes()).await?;

        let mut response_bytes = Vec::new();
        let mut buffer = [0u8; 4096];

        loop {
            match tls_stream.read(&mut buffer).await {
                Ok(0) => break,
                Ok(n) => response_bytes.extend_from_slice(&buffer[..n]),
                Err(_) => break,
            }
        }

        let response = String::from_utf8_lossy(&response_bytes);
        if let Some(pos) = response.find("\r\n\r\n") {
            let header_part = &response[..pos];
            let body_part = &response[pos + 4..];

            if let Some(first_line) = header_part.lines().next() {
                let parts: Vec<&str> = first_line.split_whitespace().collect();
                if parts.len() >= 2 {
                    if let Ok(code) = parts[1].parse::<u16>() {
                        return Ok((code, body_part.to_string()));
                    }
                }
            }
        }

        Err("Malformed HTTP Response".into())
    })
    .await
    .map_err(|_| Box::<dyn std::error::Error + Send + Sync>::from("Timeout"))?
}

fn parse_trace_details(text: &str) -> (String, String) {
    let mut ip = String::new();
    let mut loc = String::new();
    for line in text.lines() {
        if line.starts_with("ip=") {
            ip = line.trim_start_matches("ip=").trim().to_string();
        } else if line.starts_with("loc=") {
            loc = line.trim_start_matches("loc=").trim().to_string();
        }
    }
    (ip, loc)
}

async fn get_scanner_ip() -> Result<String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECONDS))
        .build()?;
    
    if let Ok(resp) = client.get(format!("https://{}", PRIMARY_WORKER_HOST)).send().await {
        if let Ok(json) = resp.json::<Value>().await {
            if let Some(ip) = json.get("ip").or_else(|| json.get("clientIp")).and_then(|v| v.as_str()) {
                return Ok(ip.to_string());
            }
        }
    }

    let resp = client.get("https://checkip.amazonaws.com").send().await?.text().await?;
    Ok(resp.trim().to_string())
}

fn read_proxy_file(file_path: &str) -> io::Result<Vec<(String, u16, String)>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let mut result = Vec::new();

    for line in reader.lines() {
        let line = line?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        let parts: Vec<&str> = trimmed.split(',').collect();
        let ip = parts[0].trim().to_string();
        let port: u16 = if parts.len() > 1 {
            parts[1].trim().parse().unwrap_or(443)
        } else {
            443
        };
        let isp = if parts.len() > 3 {
            parts[3].trim().to_string()
        } else {
            "Unknown ISP".to_string()
        };
        result.push((ip, port, isp));
    }

    Ok(result)
}

async fn resolve_domain(domain: &str) -> Result<Vec<String>> {
    use tokio::net::lookup_host;
    let addrs = lookup_host(format!("{}:443", domain)).await?;
    Ok(addrs.map(|addr| addr.ip().to_string()).collect())
}

fn risk_color_hex(score: i64) -> String {
    let clamped = score.clamp(0, 100) as f32 / 100.0;
    let low = (0xC9, 0xA2, 0x27);
    let high = (0x8B, 0x1E, 0x1E);
    let r = (low.0 as f32 + (high.0 as f32 - low.0 as f32) * clamped) as u8;
    let g = (low.1 as f32 + (high.1 as f32 - low.1 as f32) * clamped) as u8;
    let b = (low.2 as f32 + (high.2 as f32 - low.2 as f32) * clamped) as u8;
    format!("{:02X}{:02X}{:02X}", r, g, b)
}

fn risk_badge_html(score: i64) -> String {
    let color = risk_color_hex(score);
    format!("<img src=\"https://img.shields.io/badge/-{}-{}\" />", score, color)
}

fn write_zizifn_json(
    proxies_by_country: &BTreeMap<String, Vec<ProxyInfo>>,
    output_file: &str,
) -> io::Result<()> {
    let mut proxies = Vec::new();
    let mut providers: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let mut countries: BTreeMap<String, Vec<String>> = BTreeMap::new();
    let mut seen = HashSet::new();

    for (country, country_proxies) in proxies_by_country {
        for info in country_proxies {
            if !seen.insert(info.ip.clone()) {
                continue;
            }

            proxies.push(ZizifnProxy {
                ip: info.ip.clone(),
                port: 443,
                isp: info.isp.clone(),
                country: country.clone(),
                city: info.city.clone(),
                region: info.region.clone(),
                score: info.fraud_score,
                risk: info.risk.clone(),
            });

            countries
                .entry(country.clone())
                .or_default()
                .push(info.ip.clone());

            for provider in ["Google", "Amazon", "Cloudflare", "OVH", "Hetzner"] {
                if info
                    .isp
                    .to_lowercase()
                    .contains(&provider.to_lowercase())
                {
                    providers
                        .entry(provider.to_string())
                        .or_default()
                        .push(info.ip.clone());
                }
            }
        }
    }

    for ips in providers.values_mut() {
        ips.sort();
        ips.dedup();
    }

    for ips in countries.values_mut() {
        ips.sort();
        ips.dedup();
    }

    let dataset = ZizifnDataset {
        updated_at: Utc::now().to_rfc3339(),
        proxies,
        providers,
        countries,
    };

    let json = serde_json::to_string_pretty(&dataset)?;

    if let Some(parent) = Path::new(output_file).parent() {
        fs::create_dir_all(parent)?;
    }

    fs::write(output_file, json)?;

    println!("💠 Zizifn JSON refreshed at {}", output_file);

    Ok(())
}

fn write_markdown_report(proxies_by_country: &BTreeMap<String, Vec<ProxyInfo>>, output_file: &str) -> io::Result<()> {
    let mut file = File::create(output_file)?;

    let total_active = proxies_by_country.values().map(|v| v.len()).sum::<usize>();
    let total_countries = proxies_by_country.len();

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
    let active_badge = format!("<img src=\"https://img.shields.io/badge/validated_proxies-{}-966600\" />", total_active);
    let countries_badge = format!("<img src=\"https://img.shields.io/badge/Countries-{}-966600\" />", total_countries);

    writeln!(
        file,
        r##"<p align="left">
  <img src="https://latex.codecogs.com/svg.image?\huge&space;{{\color{{&hash;C39026}}\mathrm{{PR}}{{\color{{&hash;966600}}\O}}\mathrm{{XY}}\;\mathrm{{IP}}}}" width="280px" </p><br/>

> [!WARNING]
>
> <p><b>Daily Fresh Proxies</b></p>
>
> A curated list of <b>high-quality</b>, fully-tested proxies sourced from reputable ISPs and major global data centers (e.g., Google, Amazon, Cloudflare, OVH, Hetzner, and others)
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
>
> <br><br/>  
"##,
        last = last_badge,
        next = next_badge,
        active = active_badge,
        countries = countries_badge,
    )?;

    let top_providers = ["Google", "Amazon", "Cloudflare", "OVH", "Hetzner"];

    let mut provider_buckets: HashMap<&str, Vec<ProxyInfo>> = HashMap::new();
    for prov in top_providers.iter() {
        provider_buckets.insert(prov, Vec::new());
    }

    for proxies in proxies_by_country.values() {
        for info in proxies.iter() {
            for prov in top_providers.iter() {
                if info.isp.to_lowercase().contains(&prov.to_lowercase()) {
                    if let Some(vec) = provider_buckets.get_mut(prov) {
                        vec.push(info.clone());
                    }
                }
            }
        }
    }

    for prov in top_providers.iter() {
        if let Some(list) = provider_buckets.get(prov) {
            if !list.is_empty() {
                let provider_logo = generate_provider_logo_html(prov);
                let provider_title = match provider_logo {
                    Some(ref html) => format!("{} {}", html, prov),
                    None => prov.to_string(),
                };
                writeln!(file, "## {} ({})", provider_title, list.len())?;
                writeln!(file, "<details>")?;
                writeln!(file, "<summary>Click to expand</summary>\n")?;
                writeln!(file, "|   IP   |   ISP    |   Location   |  Risk Score  |")?;
                writeln!(file, "|:-------|:---------|:------------:|:------------:|")?;
                let mut sorted = list.clone();
                sorted.sort_by_key(|info| info.fraud_score);
                for info in sorted.iter() {
                    let location = format!("{}, {}", info.region, info.city);
                    let badge = risk_badge_html(info.fraud_score);
                    writeln!(file, "| <pre><code>{}</code></pre> | {} | {} | {} |", info.ip, info.isp, location, badge)?;
                }
                writeln!(file, "\n</details>\n\n---\n")?;
            }
        }
    }

    for (country_code, proxies) in proxies_by_country.iter() {
        let mut sorted_proxies = proxies.clone();
        sorted_proxies.sort_by_key(|info| info.fraud_score);
        let flag = generate_country_flag_emoji(country_code);
        let name = get_country_name(country_code);

        writeln!(file, "## {} {} ({} proxies)", flag, name, sorted_proxies.len())?;
        writeln!(file, "<details>")?;
        writeln!(file, "<summary>Click to expand</summary>\n")?;
        writeln!(file, "|   IP   |   ISP   |   Location   |  Risk Score  |")?;
        writeln!(file, "|:-------|:--------|:------------:|:------------:|")?;

        for info in sorted_proxies.iter() {
            let location = format!("{}, {}", info.region, info.city);
            let badge = risk_badge_html(info.fraud_score);
            writeln!(file, "| <pre><code>{}</code></pre> | {} | {} | {} |", info.ip, info.isp, location, badge)?;
        }
        writeln!(file, "\n</details>\n\n---\n")?;
    }

if !proxies_by_country.is_empty() {
    writeln!(
        file,
        r##"> <br/>
>
> <p><b>🪶 Credits</b></p>
>
> [<img src="https://img.shields.io/badge/Founder_%26_Owner-NiREvil-966600" />](https://github.com/NiREvil)  
> [<img src="https://img.shields.io/badge/Development_%26_Maintenance-Diana--Cl-966600" />](https://github.com/Diana-Cl)     
> [<img src="https://img.shields.io/badge/IP_Risk_API_%26_Contributions-Mehdi_Hexing-966600" />](https://github.com/mehdi-hexing/Cloudflare-Scamalytics)    
>
> <br/>
"##
    )?;
}
    println!("💠 Markdown report refreshed at {}", output_file);
    Ok(())
}

fn generate_provider_logo_html(isp: &str) -> Option<String> {
    let mapping = [
        ("Google", "google.com"),
        ("Amazon", "amazon.com"),
        ("Cloudflare", "cloudflare.com"),
        ("Hetzner", "hetzner.com"),
        ("Hostinger", "hostinger.com"),
        ("OVH", "ovhcloud.com"),
        ("DigitalOcean", "digitalocean.com"),
        ("Vultr", "vultr.com"),
    ];

    for (kw, domain) in mapping.iter() {
        if isp.to_lowercase().contains(&kw.to_lowercase()) {
            return Some(format!(
                "<img alt=\"{}\" src=\"https://www.google.com/s2/favicons?sz=24&domain_url={}\" />",
                isp, domain
            ));
        }
    }
    None
}

fn generate_country_flag_emoji(code: &str) -> String {
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
        "AE" => "United Arab Emirates".to_string(),
        "AL" => "Albania".to_string(),
        "AM" => "Armenia".to_string(),
        "AR" => "Argentina".to_string(),
        "AT" => "Austria".to_string(),
        "AU" => "Australia".to_string(),
        "AZ" => "Azerbaijan".to_string(),
        "BE" => "Belgium".to_string(),
        "BG" => "Bulgaria".to_string(),
        "BR" => "Brazil".to_string(),
        "CA" => "Canada".to_string(),
        "CH" => "Switzerland".to_string(),
        "CL" => "Chile".to_string(),
        "CN" => "China".to_string(),
        "CO" => "Colombia".to_string(),
        "CY" => "Cyprus".to_string(),
        "CZ" => "Czech Republic".to_string(),
        "DE" => "Germany".to_string(),
        "DK" => "Denmark".to_string(),
        "EE" => "Estonia".to_string(),
        "EG" => "Egypt".to_string(),
        "ES" => "Spain".to_string(),
        "FI" => "Finland".to_string(),
        "FR" => "France".to_string(),
        "GB" => "United Kingdom".to_string(),
        "GE" => "Georgia".to_string(),
        "GR" => "Greece".to_string(),
        "HK" => "Hong Kong".to_string(),
        "HU" => "Hungary".to_string(),
        "ID" => "Indonesia".to_string(),
        "IE" => "Ireland".to_string(),
        "IL" => "Israel".to_string(),
        "IN" => "India".to_string(),
        "IR" => "Iran".to_string(),
        "IT" => "Italy".to_string(),
        "JP" => "Japan".to_string(),
        "KR" => "South Korea".to_string(),
        "KZ" => "Kazakhstan".to_string(),
        "LT" => "Lithuania".to_string(),
        "LU" => "Luxembourg".to_string(),
        "LV" => "Latvia".to_string(),
        "MD" => "Moldova".to_string(),
        "MU" => "Mauritius".to_string(),
        "MX" => "Mexico".to_string(),
        "MY" => "Malaysia".to_string(),
        "NL" => "Netherlands".to_string(),
        "NO" => "Norway".to_string(),
        "NZ" => "New Zealand".to_string(),
        "PH" => "Philippines".to_string(),
        "PL" => "Poland".to_string(),
        "PR" => "Puerto Rico".to_string(),
        "PT" => "Portugal".to_string(),
        "QA" => "Qatar".to_string(),
        "RO" => "Romania".to_string(),
        "RS" => "Serbia".to_string(),
        "RU" => "Russia".to_string(),
        "SA" => "Saudi Arabia".to_string(),
        "SE" => "Sweden".to_string(),
        "SG" => "Singapore".to_string(),
        "SK" => "Slovakia".to_string(),
        "TH" => "Thailand".to_string(),
        "TR" => "Turkey".to_string(),
        "TW" => "Taiwan".to_string(),
        "UA" => "Ukraine".to_string(),
        "US" => "United States".to_string(),
        "UZ" => "Uzbekistan".to_string(),
        "VN" => "Vietnam".to_string(),
        "ZA" => "South Africa".to_string(),
        _ => code.to_string(),
    }
}
