import os
import base64
import random
import json
import sys
import requests
import datetime
import logging
import time
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception

NUM_PROXY_PAIRS = int(os.environ.get("NUM_PROXY_PAIRS", 5))

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(SCRIPT_DIR)

CONFIG_TEMPLATE_PATH = os.path.join(SCRIPT_DIR, "assets", "clash-meta-wg-template.yml")
CACHE_FILE_PATH = os.path.join(PARENT_DIR, "sub", "key_cache.json")
OUTPUT_YAML_FILENAME = os.path.join(PARENT_DIR, "sub", "clash-meta-wg.yml")

DIALER_PROXY_BASE_NAME = os.environ.get("DIALER_PROXY_BASE_NAME", "IR-DIALER")
ENTRY_PROXY_BASE_NAME = os.environ.get("ENTRY_PROXY_BASE_NAME", "EU-ENTRY")
MAIN_SELECTOR_GROUP_NAME = os.environ.get("MAIN_SELECTOR_GROUP_NAME", "⚪PROXIES")
DIALER_URL_TEST_GROUP_NAME = f"🇮🇷AUTO-{DIALER_PROXY_BASE_NAME}"
ENTRY_URL_TEST_GROUP_NAME = f"🇪🇺AUTO-{ENTRY_PROXY_BASE_NAME}"

MASQUE_PRIVATE_KEY = "MHcCAQEEIOkcsGqzwUFIGp+Je205ipuWNfma1yqMRvahFSXj9mG5oAoGCCqGSM49AwEHoUQDQgAEdNtk2zEZ9eDjbUfgjuM9oV9inJ9CiY8J9Nx6ZvxSm8mXcm52wy+ql1+PTrwkFKH948jv53PWsSqh1GekL8HKew=="
MASQUE_PUBLIC_KEY = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEIaU7MToJm9NKp8YfGxR6r+/h4mcG7SxI8tsW8OR1A5tv/zCzVbCRRh2t87/kxnP6lAy0lkr7qYwu+ox+k3dr6w=="
MASQUE_IP = "172.16.0.2"
MASQUE_IPV6 = "2606:4700:110:8142:4b68:f1cd:25f:56b6"
MASQUE_SERVER = "162.159.198.2"
MASQUE_PORT = 443
MASQUE_SNI = "4pda.to"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    pass


def byte_to_base64(myb):
    return base64.b64encode(myb).decode("utf-8")


def generate_public_key(key_bytes):
    private_key = X25519PrivateKey.from_private_bytes(key_bytes)
    public_key = private_key.public_key()
    return public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )


def generate_private_key():
    private_key = X25519PrivateKey.generate()
    private_bytes = private_key.private_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PrivateFormat.Raw,
        encryption_algorithm=serialization.NoEncryption(),
    )
    key = list(private_bytes)
    key[0] &= 248
    key[31] &= 127
    key[31] |= 64
    return bytes(key)


def load_cached_keys():
    if os.path.exists(CACHE_FILE_PATH):
        try:
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                content = f.read()
                return json.loads(content) if content else []
        except json.JSONDecodeError:
            logger.warning(
                f"Cache file {CACHE_FILE_PATH} is corrupted. Starting fresh."
            )
            return []
        except IOError as e:
            logger.error(f"Error reading cache file {CACHE_FILE_PATH}: {e}")
            return []
    return []


def save_cached_keys(keys):
    try:
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(keys, f, indent=2)
    except IOError as e:
        logger.error(f"Error writing cache file {CACHE_FILE_PATH}: {e}")


def should_retry(exception):
    if isinstance(exception, RateLimitError):
        return True
    if isinstance(exception, requests.exceptions.HTTPError):
        if 500 <= exception.response.status_code < 600:
            return True
    return False


def log_before_sleep(retry_state):
    exc = retry_state.outcome.exception()
    if isinstance(exc, requests.exceptions.HTTPError):
        status_code = exc.response.status_code if exc.response is not None else "N/A"
        logger.warning(f"Retrying due to HTTP {status_code} error: {exc}")
    elif isinstance(exc, RateLimitError):
        logger.warning("Retrying due to Cloudflare rate limiting (429)")
    else:
        logger.warning(f"Retrying due to exception: {exc}")


@retry(
    stop=stop_after_attempt(6),
    wait=wait_exponential(multiplier=1, min=5, max=60),
    retry=retry_if_exception(should_retry),
    reraise=True,
    before_sleep=log_before_sleep,
)
def register_key_on_CF(pub_key):
    logger.info(f"Registering public key: {pub_key[:10]}...")
    try:
        url = "https://api.cloudflareclient.com/v0a4005/reg"
        install_id = base64.b64encode(os.urandom(12)).decode("utf-8")
        fcm_token = (
            f"{install_id}:APA91b{base64.b64encode(os.urandom(138)).decode('utf-8')}"
        )
        body = {
            "key": pub_key,
            "install_id": install_id,
            "fcm_token": fcm_token,
            "warp_enabled": True,
            "tos": datetime.datetime.now(datetime.timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "type": "Android",
            "model": "PC",
            "locale": "en_US",
        }
        headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "Host": "api.cloudflareclient.com",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
            "User-Agent": "okhttp/3.12.1",
        }
        time.sleep(random.uniform(1.5, 2.5))
        with requests.post(
            url, data=json.dumps(body), headers=headers, timeout=25
        ) as r:
            if r.status_code == 429:
                retry_after = r.headers.get("Retry-After")
                wait_time = int(retry_after) if retry_after else 15
                logger.warning(f"Rate limit hit. Waiting {wait_time}s.")
                time.sleep(wait_time)
                raise RateLimitError("Rate limit exceeded")
            r.raise_for_status()
            return r
    except requests.exceptions.Timeout:
        raise requests.exceptions.RequestException("API request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to Cloudflare API: {e}")
        raise


def bind_keys(key_type):
    cached_keys = load_cached_keys()
    matching_keys = [k for k in cached_keys if k.get("type") == key_type]

    if matching_keys:
        key_data = random.choice(matching_keys)
        priv = key_data.get("private_key")
        reserved = key_data.get("reserved")
        v4 = key_data.get("interface_v4")
        v6 = key_data.get("interface_v6")
        if priv and reserved:
            logger.info(f"Using cached {key_type} key: {priv[:10]}...")
            return priv, reserved, v4, v6

    priv_bytes = generate_private_key()
    priv_string = byte_to_base64(priv_bytes)
    pub_string = byte_to_base64(generate_public_key(priv_bytes))

    try:
        result = register_key_on_CF(pub_string)
        if result and result.status_code == 200:
            resp = result.json()
            config_data = resp.get("config", {})
            client_id = config_data.get("client_id")
            addresses = config_data.get("interface", {}).get("addresses", {})
            v4 = addresses.get("v4")
            v6 = addresses.get("v6")

            if not client_id:
                logger.error("Could not find 'client_id' in API response.")
                sys.exit(1)

            cached_keys.append(
                {
                    "type": key_type,
                    "private_key": priv_string,
                    "reserved": client_id,
                    "interface_v4": v4,
                    "interface_v6": v6,
                    "timestamp": datetime.datetime.now(
                        datetime.timezone.utc
                    ).isoformat(),
                }
            )
            save_cached_keys(cached_keys)
            return priv_string, client_id, v4, v6
        else:
            logger.error(f"API failed: {result.status_code if result else 'N/A'}")
            sys.exit(1)
    except Exception as e:
        logger.error(
            f"Cloudflare API registration failed for {key_type}: {e}", exc_info=True
        )
        sys.exit(1)


ipv4_prefixes = ["8.6.112.", "188.114.97."]

ports_str = os.environ.get(
    "AVAILABLE_PORTS",
    "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 4500 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886",
)
available_ports = [int(p) for p in ports_str.split()]

CLOUDFLARE_PUBLIC_KEY = "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="


def generate_ipv4_endpoint():
    prefix = random.choice(ipv4_prefixes)
    last_octet = random.randint(1, 254)
    return f"{prefix}{last_octet}", random.choice(available_ports)


def build_proxies_block(
    pairs, priv_dialer, reserved_dialer, priv_entry, reserved_entry
):
    lines = []

    lines.append("warp-dialer-common: &warp-dialer-common")
    lines.append("  type: wireguard")
    lines.append("  ip: 172.16.0.2/32")
    lines.append("  ip-version: ipv4")
    lines.append(f"  private-key: {priv_dialer}")
    lines.append(f"  public-key: {CLOUDFLARE_PUBLIC_KEY}")
    lines.append("  allowed-ips:")
    lines.append("    - 0.0.0.0/0")
    lines.append(f"  reserved: {reserved_dialer}")
    lines.append("  udp: true")
    lines.append("  mtu: 1280")
    lines.append("  amnezia-wg-option:")
    lines.append("    jc: 3")
    lines.append("    jmin: 10")
    lines.append("    jmax: 50")
    lines.append("    s1: 0")
    lines.append("    s2: 0")
    lines.append("    h1: 1")
    lines.append("    h2: 2")
    lines.append("    h4: 3")
    lines.append("    h3: 4")
    lines.append(
        "    i1: <b 0xc800000001018800002b45615e996de27ff5ec5f583061ab38eac69fd8fec356802847cd1c7c15a87402bb0a433d4054defedc066e>"
    )
    lines.append("")

    lines.append("warp-entry-common: &warp-entry-common")
    lines.append("  type: wireguard")
    lines.append("  ip: 172.16.0.3/32")
    lines.append("  ip-version: ipv4")
    lines.append(f"  private-key: {priv_entry}")
    lines.append(f"  public-key: {CLOUDFLARE_PUBLIC_KEY}")
    lines.append("  allowed-ips:")
    lines.append("    - 0.0.0.0/0")
    lines.append(f"  reserved: {reserved_entry}")
    lines.append("  udp: true")
    lines.append("  mtu: 1120")
    lines.append("")

    lines.append("masque-common: &masque-common")
    lines.append("  type: masque")
    lines.append(f"  private-key: {MASQUE_PRIVATE_KEY}")
    lines.append(f"  public-key: {MASQUE_PUBLIC_KEY}")
    lines.append(f"  ip: {MASQUE_IP}")
    lines.append(f"  ipv6: {MASQUE_IPV6}")
    lines.append("  mtu: 1280")
    lines.append("  udp: true")
    lines.append("  remote-dns-resolve: true")
    lines.append("  dns:")
    lines.append("    - 1.1.1.1")
    lines.append("    - 1.0.0.1")
    lines.append("")

    lines.append("proxies:")

    for num, (s_dialer, p_dialer, s_entry, p_entry) in enumerate(pairs, 1):
        tag = f"{num:02d}"
        entry_name = f"{ENTRY_PROXY_BASE_NAME}-{tag}"

        lines.append(f"  - name: {DIALER_PROXY_BASE_NAME}-{tag}")
        lines.append("    <<: *warp-dialer-common")
        lines.append(f"    server: {s_dialer}")
        lines.append(f"    port: {p_dialer}")
        lines.append("")

        lines.append(f"  - name: {entry_name}")
        lines.append("    <<: *warp-entry-common")
        lines.append(f"    server: {s_entry}")
        lines.append(f"    port: {p_entry}")
        lines.append(f"    dialer-proxy: {DIALER_PROXY_BASE_NAME}-{tag}")
        lines.append("")

    lines.append("  - name: MASQUE")
    lines.append("    <<: *masque-common")
    lines.append(f"    server: {MASQUE_SERVER}")
    lines.append(f"    port: {MASQUE_PORT}")
    lines.append(f"    sni: {MASQUE_SNI}")
    lines.append("")

    lines.append("  - name: MASQUE-H2")
    lines.append("    <<: *masque-common")
    lines.append(f"    server: {MASQUE_SERVER}")
    lines.append(f"    port: {MASQUE_PORT}")
    lines.append(f"    sni: {MASQUE_SNI}")
    lines.append("    network: h2")
    lines.append("")

    return "\n".join(lines)


def build_proxy_groups_block(dialer_names, entry_names):
    all_proxies = (
        [
            ENTRY_URL_TEST_GROUP_NAME,
            DIALER_URL_TEST_GROUP_NAME,
            "DIRECT",
            "MASQUE",
            "MASQUE-H2",
        ]
        + dialer_names
        + entry_names
    )

    lines = ["proxy-groups:"]

    lines.append(f"  - name: {MAIN_SELECTOR_GROUP_NAME}")
    lines.append("    type: select")
    lines.append("    icon: https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/cf.svg")
    lines.append("    proxies:")
    for p in all_proxies:
        lines.append(f"      - {p}")
    lines.append("")

    lines.append(f"  - name: {DIALER_URL_TEST_GROUP_NAME}")
    lines.append("    type: url-test")
    lines.append("    url: https://www.gstatic.com/generate_204")
    lines.append("    icon: https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/ir.svg")
    lines.append("    interval: 180")
    lines.append("    tolerance: 50")
    lines.append("    proxies:")
    for p in dialer_names:
        lines.append(f"      - {p}")
    lines.append("")

    lines.append(f"  - name: {ENTRY_URL_TEST_GROUP_NAME}")
    lines.append("    type: url-test")
    lines.append("    url: http://speed.cloudflare.com")
    lines.append("    icon: https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/eu.svg")
    lines.append("    interval: 180")
    lines.append("    tolerance: 50")
    lines.append("    proxies:")
    for p in entry_names:
        lines.append(f"      - {p}")
    lines.append("")

    return "\n".join(lines)


def main():
    if os.path.exists(CACHE_FILE_PATH):
        if os.environ.get("FORCE_CLEAR_CACHE", "0") == "1":
            try:
                os.remove(CACHE_FILE_PATH)
                logger.info("Cache file deleted.")
            except OSError as e:
                logger.error(f"Error deleting cache file: {e}")

    try:
        with open(CONFIG_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            template_str = f.read()
    except IOError as e:
        logger.error(f"Error reading template: {e}")
        sys.exit(1)

    priv_dialer, reserved_dialer, _, _ = bind_keys("dialer")
    priv_entry, reserved_entry, _, _ = bind_keys("entry")

    pairs = []
    dialer_names = []
    entry_names = []

    for i in range(NUM_PROXY_PAIRS):
        tag = f"{i + 1:02d}"
        s_d, p_d = generate_ipv4_endpoint()
        s_e, p_e = generate_ipv4_endpoint()
        pairs.append((s_d, p_d, s_e, p_e))
        dialer_names.append(f"{DIALER_PROXY_BASE_NAME}-{tag}")
        entry_names.append(f"{ENTRY_PROXY_BASE_NAME}-{tag}")

    proxies_block = build_proxies_block(
        pairs, priv_dialer, reserved_dialer, priv_entry, reserved_entry
    )
    groups_block = build_proxy_groups_block(dialer_names, entry_names)

    output = (
        template_str.replace("__PROXIES_BLOCK__", proxies_block)
        .replace("__PROXY_GROUPS_BLOCK__", groups_block)
        .replace("__SELECTOR_GROUP__", MAIN_SELECTOR_GROUP_NAME)
    )

    try:
        os.makedirs(os.path.dirname(OUTPUT_YAML_FILENAME), exist_ok=True)
        generation_time = datetime.datetime.now().isoformat()
        with open(OUTPUT_YAML_FILENAME, "w", encoding="utf-8") as f:
            f.write(
                "# Generated configs for clash-meta with WireGuard proxies that have amnezia v2 parameters.\n"
            )
            f.write(f"# Time is: {generation_time}\n\n")
            f.write(output)
        logger.info(f"Successfully generated '{OUTPUT_YAML_FILENAME}'")
    except IOError as e:
        logger.error(f"Error writing output: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
