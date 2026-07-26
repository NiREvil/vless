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
use serde_json::Value;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;
use tokio_native_tls::TlsConnector as TokioTlsConnector;

const IP_RESOLVER_HOST: &str = "speed.cloudflare.com";
const CLOUDFLARE_INDEX_ENDPOINT: &str = "/";
const CLOUDFLARE_META_ENDPOINT: &str = "/meta";

const DEFAULT_OUTPUT_FILE: &str = "sub/ProxyIP-Daily.md";
const DEFAULT_PROXY_FILE: &str = "edge/assets/p-legacies.csv";
const SECONDARY_PROXY_FILE: &str = "sub/country_proxies/02_proxies.csv";

const MAX_CONCURRENT_SCANS: usize = 150;
const TIMEOUT_SECONDS: u64 = 8;
const TARGET_PROXY_PORT: u16 = 443;

const NORTHERN_TERRITORY_ENV: &str = "NORTHERN_TERRITORY";
const RISK_API_HOST_ENV: &str = "RISK_API_HOST";

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

#[derive(Debug, Clone)]
struct CookieJar {
    cookies: Vec<String>,
}

impl CookieJar {
    fn new() -> Self {
        Self { cookies: Vec::new() }
    }

    fn add_from_headers(&mut self, headers: &str) {
        for line in headers.lines() {
            let line_lower = line.to_lowercase();
            if line_lower.starts_with("set-cookie:") {
                let cookie = line[11..].trim();
                if let Some(cookie_value) = cookie.split(';').next() {
                    self.cookies.push(cookie_value.to_string());
                }
            }
        }
    }

    fn to_header(&self) -> String {
        if self.cookies.is_empty() {
            String::new()
        } else {
            format!("Cookie: {}\r\n", self.cookies.join("; "))
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let api_host = std::env::var(RISK_API_HOST_ENV).expect("Environment variable RISK_API_HOST is missing");

    if let Some(parent) = Path::new(DEFAULT_OUTPUT_FILE).parent() {
        fs::create_dir_all(parent)?;
    }
    File::create(DEFAULT_OUTPUT_FILE)?;

    let mut seen_ips: HashSet<String> = HashSet::new();
    let mut proxy_candidates: Vec<(String, u16, String)> = Vec::new();
    
    match read_csv_proxy_file(SECONDARY_PROXY_FILE) {
      Ok(list) => {
          let mut added = 0;
          for (ip, port, isp) in list {
              if seen_ips.insert(ip.clone()) {
                  proxy_candidates.push((ip, port, isp));
                  added += 1;
              }
          }
          println!("Picked up {} candidates from the csv file", added);
      }
      Err(e) => println!("⚠️  Heads up — couldn't read the csv file: {}", e),
    }

    match read_proxy_file(DEFAULT_PROXY_FILE) {
        Ok(list) => {
            for (ip, port, isp) in list {
                if port == TARGET_PROXY_PORT && seen_ips.insert(ip.clone()) {
                    proxy_candidates.push((ip, port, isp));
                }
            }
            println!("Picked up {} candidates from the proxy list", proxy_candidates.len());
        }
        Err(e) => println!("⚠️  Heads up — couldn't read the proxy file: {}", e),
    }

    if let Ok(raw_domains) = std::env::var(NORTHERN_TERRITORY_ENV) {
        let domains: Vec<String> = raw_domains
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();

        println!("🔍 Resolving {} domain(s) from the Northern Territory...", domains.len());
        for domain in domains {
            if let Ok(ips) = resolve_domain(&domain).await {
                for ip in ips {
                    if seen_ips.insert(ip.clone()) {
                        proxy_candidates.push((ip, TARGET_PROXY_PORT, "Private Domain".to_string()));
                    }
                }
            }
        }
    }

    println!("🧮 A total of {} unique candidates queued for scanning", proxy_candidates.len());

    let scanner_ip = match get_scanner_ip().await {
        Ok(ip) => ip,
        Err(_) => "0.0.0.0".to_string(),
    };
    println!("✋🏿 Our own exit IP looks like: {}\n", scanner_ip);

    let validated_proxies = Arc::new(Mutex::new(BTreeMap::<String, Vec<ProxyInfo>>::new()));

    let total_candidates = proxy_candidates.len();
    let live_count = Arc::new(AtomicUsize::new(0));
    let failed_count = Arc::new(AtomicUsize::new(0));

    println!("::group::🐾 Live Scan - tap to peek");

    let tasks = futures::stream::iter(proxy_candidates.into_iter().map(|(ip, port, isp_source)| {
        let validated_proxies = Arc::clone(&validated_proxies);
        let scanner_ip = scanner_ip.clone();
        let api_host = api_host.clone();
        let live_count = Arc::clone(&live_count);
        let failed_count = Arc::clone(&failed_count);
        async move {
            scan_candidate(
                ip, port, isp_source, &validated_proxies, &scanner_ip, &api_host,
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

    let total_live = live_count.load(Ordering::Relaxed);
    let total_failed = failed_count.load(Ordering::Relaxed);

    println!("\n{}", "==============================================".cyan().bold());
    println!("{}", "       🌌  SCAN WRAPPED - HERE'S THE LOWDOWN       ".cyan().bold());
    println!("{}\n", "==============================================".cyan().bold());
    println!("  🧶 Candidates tested  : {}", total_candidates.to_string().bold());
    println!("  🟢 Alive & kicking    : {}", total_live.to_string().green().bold());
    println!("  🔴 Dead / timed out   : {}", total_failed.to_string().red());
    println!("  🌐 Countries covered  : {}", locked_proxies.len().to_string().yellow().bold());
    println!("\n{}", "----------------------------------------------".dimmed());
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
    println!("{}\n", "==============================================".cyan().bold());

    println!("🥸 All done, Everything wrapped up nicely.");
    Ok(())
}

fn read_csv_proxy_file(file_path: &str) -> io::Result<Vec<(String, u16, String)>> {
    let file = File::open(file_path)?;
    let reader = BufReader::new(file);
    let mut result = Vec::new();

    for (i, line) in reader.lines().enumerate() {
        let line = line?;
        if i == 0 {
            continue;
        }
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        let parts: Vec<&str> = trimmed.split(',').collect();
        if parts.len() < 2 {
            continue;
        }
        let ip = parts[0].trim().to_string();
        let port: u16 = parts[1].trim().parse().unwrap_or(443);
        result.push((ip, port, "Unknown ISP".to_string()));
    }

    Ok(result)
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

async fn get_scanner_ip() -> Result<String> {
    let mut cookie_jar = CookieJar::new();
    let _ = make_http_request(IP_RESOLVER_HOST, CLOUDFLARE_INDEX_ENDPOINT, None, &mut cookie_jar, false).await;
    let (_, body) = make_http_request(IP_RESOLVER_HOST, CLOUDFLARE_META_ENDPOINT, None, &mut cookie_jar, true).await?;
    let json = parse_json_response(&body)?;

    json.get("clientIp")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| "No clientIp in response".into())
}

async fn fetch_risk_assessment(ip: &str, api_host: &str) -> Result<(i64, String)> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECONDS))
        .danger_accept_invalid_certs(true)
        .build()?;

    let url = format!("https://{}/api/{}", api_host, ip);

    let resp = client
        .get(&url)
        .header("User-Agent", "RustClient/1.0")
        .send()
        .await?;

    let val: Value = resp.json().await?;

    if let Some(info) = val.get("info") {
        let score = info.get("fraud_score").and_then(|v| v.as_i64()).unwrap_or(100);
        let risk = info.get("risk").and_then(|v| v.as_str()).unwrap_or("high").to_string();
        Ok((score, risk))
    } else {
        Err("Invalid API JSON Structure".into())
    }
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

async fn scan_candidate(
    ip: String,
    port: u16,
    isp_source: String,
    validated_proxies: &Arc<Mutex<BTreeMap<String, Vec<ProxyInfo>>>>,
    scanner_ip: &str,
    api_host: &str,
    live_count: &Arc<AtomicUsize>,
    failed_count: &Arc<AtomicUsize>,
) {
    let mut cookie_jar = CookieJar::new();

    if make_http_request(IP_RESOLVER_HOST, CLOUDFLARE_INDEX_ENDPOINT, Some((&ip, port)), &mut cookie_jar, false).await.is_err() {
        failed_count.fetch_add(1, Ordering::Relaxed);
        println!("  ❌ {:<7} | {:<15} | {}", "DEAD".red().bold(), ip, "couldn't connect".dimmed());
        return;
    }

    match make_http_request(IP_RESOLVER_HOST, CLOUDFLARE_META_ENDPOINT, Some((&ip, port)), &mut cookie_jar, true).await {
        Ok((_, body)) => {
            if let Ok(json) = parse_json_response(&body) {
                if let Some(out_ip) = json.get("clientIp").and_then(|v| v.as_str()) {
                    if out_ip != scanner_ip {
                        let isp = json
                            .get("asOrganization")
                            .and_then(|v| v.as_str())
                            .map(String::from)
                            .unwrap_or(isp_source);

                        let (fraud_score, risk) = fetch_risk_assessment(&ip, api_host)
                            .await
                            .unwrap_or((100, "high".to_string()));

                        let info = ProxyInfo {
                            ip: ip.clone(),
                            isp,
                            country_code: json.get("country").and_then(|v| v.as_str()).unwrap_or("XX").to_string(),
                            city: json.get("city").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
                            region: json.get("region").and_then(|v| v.as_str()).unwrap_or("Unknown").to_string(),
                            fraud_score,
                            risk,
                        };

                        live_count.fetch_add(1, Ordering::Relaxed);

                        let (r, g, b) = {
                            let clamped = info.fraud_score.clamp(0, 100) as f32 / 100.0;
                            let low = (0xC9, 0xA2, 0x27);
                            let high = (0x8B, 0x1E, 0x1E);
                            (
                                (low.0 as f32 + (high.0 as f32 - low.0 as f32) * clamped) as u8,
                                (low.1 as f32 + (high.1 as f32 - low.1 as f32) * clamped) as u8,
                                (low.2 as f32 + (high.2 as f32 - low.2 as f32) * clamped) as u8,
                            )
                        };
                        let risk_badge = format!("{}", info.fraud_score).truecolor(r, g, b).bold();

                        let flag = generate_country_flag_emoji(&info.country_code);

                        println!(
                            "  ✅ {:<7} | {:<15} | Risk: {:<17} | Score: {:<3} | {} {}",
                            "ALIVE".green().bold(),
                            ip.bold(),
                            risk_badge,
                            info.fraud_score,
                            flag,
                            info.country_code.cyan()
                        );

                        let mut locked = validated_proxies.lock().unwrap_or_else(|e| e.into_inner());
                        locked.entry(info.country_code.clone()).or_default().push(info);
                        return;
                    }
                }
            }
            failed_count.fetch_add(1, Ordering::Relaxed);
            println!("  ❌ {:<7} | {:<15} | {}", "DEAD".red().bold(), ip, "response didn't check out".dimmed());
        }
        Err(_) => {
            failed_count.fetch_add(1, Ordering::Relaxed);
            println!("  ❌ {:<7} | {:<15} | {}", "DEAD".red().bold(), ip, "meta request fell over".dimmed());
        }
    }
}

async fn make_http_request(
    host: &str,
    path: &str,
    proxy: Option<(&str, u16)>,
    cookie_jar: &mut CookieJar,
    is_meta_endpoint: bool,
) -> Result<(String, String)> {
    let timeout = Duration::from_secs(TIMEOUT_SECONDS);

    tokio::time::timeout(timeout, async {
        let mut headers = Vec::new();
        headers.push(format!("Host: {}", host));
        headers.push("User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36".to_string());
        headers.push("Accept: */*".to_string());
        headers.push("Accept-Language: en-US,en;q=0.9".to_string());
        headers.push("Accept-Encoding: identity".to_string());
        headers.push("Connection: close".to_string());

        let cookie_str = cookie_jar.to_header();
        if !cookie_str.is_empty() {
            headers.push(cookie_str);
        }

        if is_meta_endpoint {
            headers.push("Referer: https://speed.cloudflare.com/".to_string());
            headers.push("Sec-Fetch-Dest: empty".to_string());
            headers.push("Sec-Fetch-Mode: cors".to_string());
            headers.push("Sec-Fetch-Site: same-origin".to_string());
            headers.push("Origin: https://speed.cloudflare.com".to_string());
        }

        let request_payload = format!("GET {} HTTP/1.1\r\n{}\r\n\r\n", path, headers.join("\r\n"));

        let stream = if let Some((proxy_ip, proxy_port)) = proxy {
            TcpStream::connect(format!("{}:{}", proxy_ip, proxy_port)).await?
        } else {
            TcpStream::connect(format!("{}:443", host)).await?
        };

        let native_connector = NativeTlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()?;
        let tokio_connector = TokioTlsConnector::from(native_connector);

        let mut tls_stream = tokio_connector.connect(host, stream).await?;
        tls_stream.write_all(request_payload.as_bytes()).await?;

        let mut response_bytes = Vec::new();
        let mut buffer = [0u8; 8192];

        loop {
            match tls_stream.read(&mut buffer).await {
                Ok(0) => break,
                Ok(n) => response_bytes.extend_from_slice(&buffer[..n]),
                Err(_) => break,
            }
        }

        let response_str = String::from_utf8_lossy(&response_bytes).to_string();

        if let Some(pos) = response_str.find("\r\n\r\n") {
            let headers_part = &response_str[..pos];
            let body_part = response_str[pos + 4..].to_string();
            cookie_jar.add_from_headers(headers_part);
            Ok((headers_part.to_string(), body_part))
        } else {
            Ok(("".to_string(), response_str))
        }
    })
    .await
    .map_err(|_| Box::<dyn std::error::Error + Send + Sync>::from("Timeout"))?
}

fn parse_json_response(body: &str) -> Result<Value> {
    let trimmed = body.trim();
    if let Ok(val) = serde_json::from_str::<Value>(trimmed) {
        if val.get("clientIp").is_some() {
            return Ok(val);
        }
    }
    if let Some(start) = trimmed.find('{') {
        if let Some(end) = trimmed.rfind('}') {
            if end > start {
                if let Ok(val) = serde_json::from_str::<Value>(&trimmed[start..=end]) {
                    if val.get("clientIp").is_some() {
                        return Ok(val);
                    }
                }
            }
        }
    }
    Err("Invalid JSON response".into())
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
 <img src="https://latex.codecogs.com/svg.image?\huge&space;{{\color{{Golden}}\mathrm{{PR{{\color{{black}}\O}}XY\;IP}}" width=220px" </p><br/>

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
                writeln!(file, "|   IP   |   ISP    |   Location   |   Risk Score   |")?;
                writeln!(file, "|:-------|:---------|:------------:|:--------------:|")?;
                let mut sorted = list.clone();
                sorted.sort_by_key(|info| info.fraud_score);
                for info in sorted.iter() {
                    let location = format!("{}, {}", info.region, info.city);
                    let badge = risk_badge_html(info.fraud_score);

                    writeln!(
                        file,
                        "| <pre><code>{}</code></pre> | {} | {} | {} |",
                        info.ip, info.isp, location, badge
                    )?;
                }

                writeln!(file, "\n</details>\n\n---\n\n")?;
            }
        }
    }

    for (country_code, proxies) in proxies_by_country.iter() {
        let mut sorted_proxies = proxies.clone();
        sorted_proxies.sort_by_key(|info| info.fraud_score);
        let flag = generate_country_flag_emoji(country_code);
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
        writeln!(file, "|   IP   |   ISP   |   Location   |   Risk Score   |")?;
        writeln!(file, "|:-------|:--------|:------------:|:--------------:|")?;

        for info in sorted_proxies.iter() {
            let location = format!("{}, {}", info.region, info.city);
            let badge = risk_badge_html(info.fraud_score);

            writeln!(
                file,
                "| <pre><code>{}</code></pre> | {} | {} | {} |",
                info.ip, info.isp, location, badge
            )?;
        }

        writeln!(file, "\n</details>\n\n---\n\n")?;
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
        ("OVH", "ovh.com"),
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
