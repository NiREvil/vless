use anyhow::{anyhow, Result};
use chrono::{DateTime, Utc};
use chrono_tz::Asia::Tehran;
use futures::stream::{self, StreamExt};
use native_tls::TlsConnector as NativeTlsConnector;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    net::{IpAddr, Ipv4Addr, Ipv6Addr, SocketAddr},
    sync::Arc,
    time::{Duration, Instant},
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::TcpStream,
    time::timeout,
};
use tokio_native_tls::TlsConnector;

const CF_API: &str = "https://api.cloudflare.com/client/v4/ips";
const CF_HOST: &str = "cloudflare.com";
const CF_PATH: &str = "/cdn-cgi/trace";

const PRIORITY_RANGES: &[&str] = &[
    "8.6.112.0/24",
    "104.16.0.0/24",
    "104.16.92.0/24",
    "104.16.140.0/24",
    "104.16.147.0/24",
    "104.16.148.0/24",
    "104.17.121.0/24",
    "104.17.148.0/24",
    "104.17.222.0/24",
    "104.18.79.0/24",
    "104.19.220.0/24",
    "104.20.6.0/24",
    "104.20.29.0/24",
    "104.26.4.0/24",
    "104.27.196.0/24",
    "141.101.115.0/24",
    "162.159.46.0/24",
    "162.159.193.0/24",
    "162.159.195.0/24",
    "162.159.243.0/24",
    "172.64.146.0/24",
    "172.66.147.0/24",
    "172.67.69.0/24",
    "172.67.138.0/24",
    "172.67.158.0/24",
    "188.114.96.0/24",
    "188.114.97.0/24",
    "188.114.98.0/24",
    "188.114.99.0/24",
    "190.93.245.0/24",
    "190.93.247.0/24",
];

const BLOCKED_RANGES: &[&str] = &[
    "103.22.200.0/22",
    "103.31.4.0/22",
    "141.101.64.0/18",
    "108.162.192.0/18",
    "197.234.240.0/22",
    "198.41.128.0/17",
    "162.158.0.0/15",
    "131.0.72.0/22",
];

const DEFAULT_IPV6_RANGES: &[&str] = &[
    "2400:cb00::/32",
    "2606:4700::/32",
    "2803:f800::/32",
    "2405:b500::/32",
    "2405:8100::/32",
    "2a06:98c0::/29",
    "2c0f:f248::/32",
];

const IPV4_SAMPLES_PER_RANGE: usize = 120;
const PRIORITY_SAMPLES_PER_RANGE: usize = 64;
const IPV4_OUTPUT_COUNT: usize = 35;
const IPV6_OUTPUT_COUNT: usize = 5;
const MIN_PRIORITY_RESULTS: usize = 25;
const CONCURRENCY: usize = 100;
const PROBE_ATTEMPTS: usize = 3;
const TEST_TIMEOUT: Duration = Duration::from_secs(5);

#[derive(Debug, Deserialize)]
struct CloudflareApiResponse {
    success: bool,
    result: CloudflareRanges,
}

#[derive(Debug, Deserialize)]
struct CloudflareRanges {
    ipv4_cidrs: Vec<String>,
    ipv6_cidrs: Vec<String>,
}

#[derive(Debug, Clone)]
struct Ipv4Net {
    network: u32,
    mask: u32,
}

impl Ipv4Net {
    fn parse(cidr: &str) -> Result<Self> {
        let (address, prefix) = parse_ipv4_cidr(cidr)?;

        let mask = if prefix == 0 {
            0
        } else {
            u32::MAX << (32 - prefix as u32)
        };

        Ok(Self {
            network: u32::from(address) & mask,
            mask,
        })
    }

    fn contains(&self, ip: Ipv4Addr) -> bool {
        (u32::from(ip) & self.mask) == self.network
    }
}

#[derive(Debug, Clone)]
struct TestResult {
    ip: IpAddr,
    latency: u64,
    loss: u8,
    colo: String,
}

#[derive(Debug, Serialize)]
struct IpRecord {
    colo: String,
    ip: String,
    latency: u64,
    line: String,
    loss: u8,
    node: String,
    speed: u64,
    time: String,
}

#[derive(Debug, Serialize)]
struct CloudflareOutput {
    ipv4: Vec<IpRecord>,
    ipv6: Vec<IpRecord>,
}

#[tokio::main]
async fn main() -> Result<()> {
    println!("Starting CFScanner...");

    let ranges = fetch_ranges_or_default().await;
    let connector = Arc::new(build_connector()?);

    println!(
        "Cloudflare ranges: {} IPv4 ranges, {} IPv6 ranges.",
        ranges.ipv4_cidrs.len(),
        ranges.ipv6_cidrs.len()
    );

    println!(
        "Scanning {} priority IPv4 ranges...",
        PRIORITY_RANGES.len()
    );

    let priority_candidates = generate_priority_candidates()?;

    println!(
        "Generated {} priority IPv4 candidates.",
        priority_candidates.len()
    );

    let mut ipv4_results = scan_ipv4(priority_candidates, connector.clone()).await;

    sort_results(&mut ipv4_results);

    println!(
        "Priority scan produced {} working IPv4 addresses.",
        ipv4_results.len()
    );

    if ipv4_results.len() < MIN_PRIORITY_RESULTS {
        println!(
            "Priority ranges produced fewer than {} working IPs.",
            MIN_PRIORITY_RESULTS
        );
        println!("Falling back to Cloudflare API ranges...");

        let fallback_candidates = generate_fallback_candidates(&ranges.ipv4_cidrs)?;

        println!(
            "Generated {} fallback IPv4 candidates.",
            fallback_candidates.len()
        );

        let mut fallback_results = scan_ipv4(fallback_candidates, connector).await;

        sort_results(&mut fallback_results);

        let existing = ipv4_results
            .iter()
            .map(|result| result.ip)
            .collect::<HashSet<_>>();

        for result in fallback_results {
            if !existing.contains(&result.ip) {
                ipv4_results.push(result);
            }
        }

        sort_results(&mut ipv4_results);
    }

    ipv4_results.truncate(IPV4_OUTPUT_COUNT);

    if ipv4_results.is_empty() {
        return Err(anyhow!("No working IPv4 addresses found."));
    }

    let ipv6_results = generate_ipv6_candidates(&ranges.ipv6_cidrs)?;

    println!(
        "Generated {} random IPv6 addresses.",
        ipv6_results.len()
    );

    let ipv4_records = ipv4_results
        .iter()
        .map(make_record)
        .collect::<Vec<_>>();

    let ipv6_records = ipv6_results
        .iter()
        .map(|ip| make_ipv6_record(*ip))
        .collect::<Vec<_>>();

    std::fs::create_dir_all("sub")?;

    write_json("sub/Cf-ipv4.json", &ipv4_records)?;
    write_json("sub/Cf-ipv6.json", &ipv6_records)?;

    let mut bpb_ips = String::new();

    for record in &ipv4_records {
        bpb_ips.push_str(&record.ip);
        bpb_ips.push('\n');
    }

    for record in &ipv6_records {
        bpb_ips.push('[');
        bpb_ips.push_str(&record.ip);
        bpb_ips.push_str("]\n");
    }

    std::fs::write("sub/Cf-ip-bpb.txt", bpb_ips)?;

    let output = CloudflareOutput {
        ipv4: ipv4_records,
        ipv6: ipv6_records,
    };

    write_json("Cloudflare-IPs.json", &output)?;

    println!();
    println!("Cloudflare-IPs.json updated successfully.");
    println!("IPv4: {}", output.ipv4.len());
    println!("IPv6: {}", output.ipv6.len());

    Ok(())
}

async fn fetch_ranges_or_default() -> CloudflareRanges {
    match fetch_ranges().await {
        Ok(ranges) => ranges,
        Err(error) => {
            eprintln!(
                "Cloudflare API unavailable ({}). Using built-in ranges.",
                error
            );

            CloudflareRanges {
                ipv4_cidrs: PRIORITY_RANGES
                    .iter()
                    .map(|range| range.to_string())
                    .collect(),
                ipv6_cidrs: DEFAULT_IPV6_RANGES
                    .iter()
                    .map(|range| range.to_string())
                    .collect(),
            }
        }
    }
}

async fn fetch_ranges() -> Result<CloudflareRanges> {
    let client = reqwest::Client::builder()
        .connect_timeout(Duration::from_secs(10))
        .timeout(Duration::from_secs(20))
        .user_agent("CFScanner/1.0")
        .build()?;

    let response = client.get(CF_API).send().await?;
    let status = response.status();

    if !status.is_success() {
        return Err(anyhow!(
            "Cloudflare IP API returned HTTP {}",
            status
        ));
    }

    let body = response.json::<CloudflareApiResponse>().await?;

    if !body.success {
        return Err(anyhow!("Cloudflare IP API returned success=false"));
    }

    Ok(body.result)
}

fn build_connector() -> Result<TlsConnector> {
    let native_connector = NativeTlsConnector::builder()
        .danger_accept_invalid_certs(false)
        .build()?;

    Ok(TlsConnector::from(native_connector))
}

fn blocked_nets() -> Result<Vec<Ipv4Net>> {
    BLOCKED_RANGES
        .iter()
        .map(|cidr| Ipv4Net::parse(cidr))
        .collect()
}

fn generate_priority_candidates() -> Result<Vec<Ipv4Addr>> {
    let mut candidates = HashSet::new();
    let mut rng = rand::thread_rng();

    for cidr in PRIORITY_RANGES {
        let (network, prefix) = parse_ipv4_cidr(cidr)?;
        let network = u32::from(network);
        let host_bits = 32u32 - prefix as u32;
        let host_count = 1u64 << host_bits;

        let samples = if prefix >= 24 {
            PRIORITY_SAMPLES_PER_RANGE.min(host_count.saturating_sub(2) as usize)
        } else {
            IPV4_SAMPLES_PER_RANGE
        };

        for _ in 0..samples {
            let offset = if host_count > 2 {
                rng.gen_range(1..host_count - 1)
            } else {
                0
            };

            candidates.insert(Ipv4Addr::from(
                network.wrapping_add(offset as u32),
            ));
        }
    }

    Ok(candidates.into_iter().collect())
}

fn generate_fallback_candidates(ranges: &[String]) -> Result<Vec<Ipv4Addr>> {
    let blocked = blocked_nets()?;
    let mut rng = rand::thread_rng();
    let mut candidates = HashSet::new();

    for cidr in ranges {
        let (network, prefix) = parse_ipv4_cidr(cidr)?;
        let network = u32::from(network);
        let host_bits = 32u32 - prefix as u32;
        let host_count = 1u64 << host_bits;

        for _ in 0..IPV4_SAMPLES_PER_RANGE {
            let offset = if host_count > 2 {
                rng.gen_range(1..host_count - 1)
            } else {
                0
            };

            let ip = Ipv4Addr::from(
                network.wrapping_add(offset as u32),
            );

            if blocked.iter().any(|net| net.contains(ip)) {
                continue;
            }

            candidates.insert(ip);
        }
    }

    Ok(candidates.into_iter().collect())
}

fn generate_ipv6_candidates(ranges: &[String]) -> Result<Vec<Ipv6Addr>> {
    if ranges.is_empty() {
        return Ok(Vec::new());
    }

    let mut rng = rand::thread_rng();
    let mut candidates = HashSet::new();

    while candidates.len() < IPV6_OUTPUT_COUNT {
        let cidr = &ranges[rng.gen_range(0..ranges.len())];
        let (network, prefix) = parse_ipv6_cidr(cidr)?;

        let base = u128::from(network);

        let mask = if prefix == 0 {
            0
        } else {
            u128::MAX << (128 - prefix as u32)
        };

        let random_bits = rng.gen::<u128>();

        let address = Ipv6Addr::from((base & mask) | (random_bits & !mask));

        candidates.insert(address);
    }

    Ok(candidates.into_iter().collect())
}

async fn scan_ipv4(
    candidates: Vec<Ipv4Addr>,
    connector: Arc<TlsConnector>,
) -> Vec<TestResult> {
    stream::iter(candidates)
        .map(|ip| {
            let connector = connector.clone();

            async move {
                match timeout(TEST_TIMEOUT, test_ipv4(ip, connector)).await {
                    Ok(Ok(result)) => Some(result),
                    _ => None,
                }
            }
        })
        .buffer_unordered(CONCURRENCY)
        .filter_map(|result| async move { result })
        .collect()
        .await
}

async fn test_ipv4(
    ip: Ipv4Addr,
    connector: Arc<TlsConnector>,
) -> Result<TestResult> {
    let mut latencies = Vec::with_capacity(PROBE_ATTEMPTS);
    let mut colo = None;

    for _ in 0..PROBE_ATTEMPTS {
        match test_ipv4_once(ip, connector.clone()).await {
            Ok((latency, detected_colo)) => {
                latencies.push(latency);
                colo.get_or_insert(detected_colo);
            }
            Err(_) => {}
        }
    }

    if latencies.is_empty() {
        return Err(anyhow!("All probes failed for {}", ip));
    }

    latencies.sort_unstable();

    let median = latencies[latencies.len() / 2];
    let loss =
        ((PROBE_ATTEMPTS - latencies.len()) * 100 / PROBE_ATTEMPTS) as u8;

    let colo = colo.ok_or_else(|| anyhow!("No Cloudflare colo for {}", ip))?;

    println!(
        "OK {:<15} latency={}ms loss={}% colo={}",
        ip, median, loss, colo
    );

    Ok(TestResult {
        ip: IpAddr::V4(ip),
        latency: median,
        loss,
        colo,
    })
}

async fn test_ipv4_once(
    ip: Ipv4Addr,
    connector: Arc<TlsConnector>,
) -> Result<(u64, String)> {
    let total_start = Instant::now();
    let address = SocketAddr::new(IpAddr::V4(ip), 443);

    let stream = TcpStream::connect(address).await?;
    let mut stream = connector.connect(CF_HOST, stream).await?;

    let request = format!(
        "GET {} HTTP/1.1\r\nHost: {}\r\nUser-Agent: CFScanner/1.0\r\nConnection: close\r\nAccept: */*\r\n\r\n",
        CF_PATH, CF_HOST
    );

    stream.write_all(request.as_bytes()).await?;

    let mut response = Vec::with_capacity(8192);

    stream
        .take(16384)
        .read_to_end(&mut response)
        .await?;

    let response = String::from_utf8_lossy(&response);

    let colo = validate_cf_response(&response)
        .ok_or_else(|| anyhow!("Cloudflare response validation failed for {}", ip))?;

    let total_ms = total_start.elapsed().as_millis() as u64;

    Ok((total_ms, colo))
}

fn sort_results(results: &mut Vec<TestResult>) {
    results.sort_by(|a, b| {
        (a.loss, a.latency).cmp(&(b.loss, b.latency))
    });
}

fn validate_cf_response(response: &str) -> Option<String> {
    if !is_successful_http_response(response) {
        return None;
    }

    let colo = parse_cf_ray_colo(response)?;

    let has_trace_data = response.lines().any(|line| {
        let line = line.trim();

        line.starts_with("colo=") || line.starts_with("fl=")
    });

    if !has_trace_data {
        return None;
    }

    Some(colo)
}

fn is_successful_http_response(response: &str) -> bool {
    let Some(status_line) = response.lines().next() else {
        return false;
    };

    let mut parts = status_line.split_whitespace();

    parts.next();

    let Some(status) = parts.next() else {
        return false;
    };

    let Ok(status) = status.parse::<u16>() else {
        return false;
    };

    (200..400).contains(&status)
}

fn parse_cf_ray_colo(response: &str) -> Option<String> {
    response.lines().find_map(|line| {
        let (name, value) = line.split_once(':')?;

        if name.eq_ignore_ascii_case("cf-ray") {
            value
                .trim()
                .rsplit_once('-')
                .map(|(_, colo)| colo.trim())
                .filter(|colo| !colo.is_empty())
                .map(ToOwned::to_owned)
        } else {
            None
        }
    })
}

fn make_record(result: &TestResult) -> IpRecord {
    IpRecord {
        colo: result.colo.clone(),
        ip: result.ip.to_string(),
        latency: result.latency,
        line: "CF".to_string(),
        loss: result.loss,
        node: "NETCUP".to_string(),
        speed: 0,
        time: current_tehran_time(),
    }
}

fn make_ipv6_record(ip: Ipv6Addr) -> IpRecord {
    IpRecord {
        colo: "Default".to_string(),
        ip: ip.to_string(),
        latency: 0,
        line: "CF".to_string(),
        loss: 0,
        node: "Diana".to_string(),
        speed: 0,
        time: current_tehran_time(),
    }
}

fn current_tehran_time() -> String {
    let now: DateTime<Utc> = Utc::now();

    now.with_timezone(&Tehran)
        .format("%Y-%m-%d %H:%M:%S")
        .to_string()
}

fn parse_ipv4_cidr(cidr: &str) -> Result<(Ipv4Addr, u8)> {
    let (address, prefix) = cidr
        .split_once('/')
        .ok_or_else(|| anyhow!("Invalid IPv4 CIDR: {}", cidr))?;

    let address = address.parse::<Ipv4Addr>()?;
    let prefix = prefix.parse::<u8>()?;

    if prefix > 32 {
        return Err(anyhow!("Invalid IPv4 prefix: {}", prefix));
    }

    Ok((address, prefix))
}

fn parse_ipv6_cidr(cidr: &str) -> Result<(Ipv6Addr, u8)> {
    let (address, prefix) = cidr
        .split_once('/')
        .ok_or_else(|| anyhow!("Invalid IPv6 CIDR: {}", cidr))?;

    let address = address.parse::<Ipv6Addr>()?;
    let prefix = prefix.parse::<u8>()?;

    if prefix > 128 {
        return Err(anyhow!("Invalid IPv6 prefix: {}", prefix));
    }

    Ok((address, prefix))
}

fn write_json<T: Serialize>(path: &str, value: &T) -> Result<()> {
    let json = serde_json::to_string_pretty(value)?;
    std::fs::write(path, format!("{}\n", json))?;
    Ok(())
}
