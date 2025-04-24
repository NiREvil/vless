import os
import base64
import random
import json
import yaml
import sys
import requests
import datetime
import logging
import time
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

# --- Configuration ---
NUM_PROXY_PAIRS = 8  # Number of proxy pairs to generate
NUM_IPV6_ENTRY_ENDPOINTS = (
    2  # How many Entry proxies should use an IPv6 server endpoint
)
OUTPUT_YAML_FILENAME = "sub/clash-meta-wg.yaml"  # Output YAML filename
CONFIG_TEMPLATE_PATH = (
    "edge/assets/clash-meta-wg-template.yml"  # Path to the template file
)
CACHE_FILE_PATH = "sub/key_cache.json"  # Path for caching generated keys

# Proxy Naming Configuration
DIALER_PROXY_BASE_NAME = "WG-Dialer"
ENTRY_PROXY_BASE_NAME = "WG-Entry"
MAIN_SELECTOR_GROUP_NAME = "🔰 Proxies"  # Changed selector name
DIALER_URL_TEST_GROUP_NAME = f"{DIALER_PROXY_BASE_NAME} - Ping"
ENTRY_URL_TEST_GROUP_NAME = f"{ENTRY_PROXY_BASE_NAME} - Ping"
# --- End Configuration ---

# Log settings
logging.basicConfig(
    level=logging.INFO,  # Set back to INFO for more detailed logs during generation
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)


# Custom exception for rate limiting
class RateLimitError(Exception):
    pass


# Function to encode bytes to base64
def byte_to_base64(myb):
    return base64.b64encode(myb).decode("utf-8")


# Function to generate a public key from private key bytes
def generate_public_key(key_bytes):
    private_key = X25519PrivateKey.from_private_bytes(key_bytes)
    public_key = private_key.public_key()
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )
    return public_key_bytes


# Function to generate a new private key with specific bit manipulations
def generate_private_key():
    logger.info("Generating new private key...")
    key = os.urandom(32)
    key = list(key)
    key[0] &= 248
    key[31] &= 127
    key[31] |= 64
    return bytes(key)


# Load cached keys
def load_cached_keys():
    if os.path.exists(CACHE_FILE_PATH):
        try:
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                content = f.read()
                if not content:  # Handle empty file case
                    return []
                return json.loads(content)
        except json.JSONDecodeError:
            logger.warning(
                f"Cache file {CACHE_FILE_PATH} is corrupted. Starting fresh."
            )
            return []
        except IOError as e:
            logger.error(f"Error reading cache file {CACHE_FILE_PATH}: {e}")
            return []  # Treat as no cache on read error
    return []


# Save cached keys
def save_cached_keys(keys):
    try:
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(keys, f, indent=2)
        logger.info(f"Saved keys to cache file: {CACHE_FILE_PATH}")
    except IOError as e:
        logger.error(f"Error writing cache file {CACHE_FILE_PATH}: {e}")


# Function to register a public key with Cloudflare API using tenacity for retries
@retry(
    stop=stop_after_attempt(4),  # Retry up to 4 times
    wait=wait_exponential(multiplier=1, min=5, max=15),  # Exponential backoff
    retry=retry_if_exception_type(RateLimitError),  # Only retry on RateLimitError
    reraise=True,  # Reraise the exception if all retries fail
)
def register_key_on_CF(pub_key):
    logger.info(f"Registering public key: {pub_key[:10]}... with Cloudflare API")
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
        bodyString = json.dumps(body)
        headers = {
            "Content-Type": "application/json; charset=UTF-8",
            "Host": "api.cloudflareclient.com",
            "Connection": "Keep-Alive",
            "Accept-Encoding": "gzip",
            "User-Agent": "okhttp/3.12.1",
        }
        time.sleep(random.uniform(1.5, 2.5))
        r = requests.post(
            url, data=bodyString, headers=headers, timeout=25
        )  # Increased timeout

        if r.status_code == 429:
            logger.warning(f"Rate limit hit (429). Headers: {r.headers}")
            retry_after = r.headers.get("Retry-After")
            wait_time = (
                int(retry_after) if retry_after else 15
            )  # Default wait if header missing
            logger.warning(f"Waiting for {wait_time} seconds due to rate limit.")
            time.sleep(wait_time)
            raise RateLimitError("Rate limit exceeded")

        logger.info(f"Cloudflare API response status: {r.status_code}")
        r.raise_for_status()  # Raise HTTPError for other bad responses (4xx or 5xx)
        return r

    except requests.exceptions.Timeout:
        logger.error("Cloudflare API request timed out.")
        raise requests.exceptions.RequestException("API request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to Cloudflare API: {e}")
        raise


# Function to generate and register private/public key pair, using cache
def bind_keys(key_type):
    """
    Generates or retrieves a cached key pair and registers it with Cloudflare.
    Uses client_id as the 'reserved' value and returns interface IPs.

    Args:
        key_type (str): The type of key ('dialer' or 'entry') for caching purposes.

    Returns:
        tuple: (private_key_base64, reserved_value (client_id), interface_v4, interface_v6)
               Returns None for IPs if not found. Exits on failure.
    """
    cached_keys = load_cached_keys()
    matching_keys = [k for k in cached_keys if k.get("type") == key_type]

    if matching_keys:
        key_data = random.choice(matching_keys)
        private_key = key_data.get("private_key")
        reserved_value = key_data.get("reserved")
        interface_v4 = key_data.get("interface_v4")
        interface_v6 = key_data.get("interface_v6")
        if private_key and reserved_value:
            logger.info(
                f"Using cached {key_type} key starting with: {private_key[:10]}..."
            )
            return private_key, reserved_value, interface_v4, interface_v6
        else:
            logger.warning(
                f"Found incomplete cached key data for {key_type}. Generating new key."
            )

    logger.info(
        f"No valid cached key found for type '{key_type}'. Generating and registering a new key."
    )
    priv_bytes = generate_private_key()
    priv_string = byte_to_base64(priv_bytes)
    logger.info(f"Generated private key for {key_type}: {priv_string[:10]}...")
    pub_bytes = generate_public_key(priv_bytes)
    pub_string = byte_to_base64(pub_bytes)
    logger.info(f"Generated public key for {key_type}: {pub_string[:10]}...")

    try:
        result = register_key_on_CF(pub_string)

        if result and result.status_code == 200:
            try:
                response_data = result.json()
                logger.debug(
                    f"Full API response for {key_type}: {json.dumps(response_data, indent=2)}"
                )

                config_data = response_data.get("config", {})
                client_id = config_data.get("client_id")
                interface_data = config_data.get("interface", {})
                addresses_data = interface_data.get("addresses", {})
                interface_v4 = addresses_data.get("v4")
                interface_v6 = addresses_data.get("v6")

                if not client_id:
                    logger.error("Could not find 'client_id' in API response.")
                    sys.exit(1)
                if not interface_v4:
                    logger.warning(
                        "Could not find 'v4' interface address in API response."
                    )
                if not interface_v6:
                    logger.warning(
                        "Could not find 'v6' interface address in API response."
                    )

                logger.info(
                    f"Successfully registered {key_type} with client_id: ...{client_id[-10:]}"
                )
                logger.info(
                    f"Interface IPs received: v4={interface_v4}, v6={interface_v6}"
                )

                new_key_data = {
                    "type": key_type,
                    "private_key": priv_string,
                    "reserved": client_id,
                    "interface_v4": interface_v4,
                    "interface_v6": interface_v6,
                    "timestamp": datetime.datetime.now(
                        datetime.timezone.utc
                    ).isoformat(),
                }
                cached_keys.append(new_key_data)
                save_cached_keys(cached_keys)

                return priv_string, client_id, interface_v4, interface_v6

            except (json.JSONDecodeError, KeyError, TypeError) as e:
                logger.error(f"Error parsing Cloudflare API response: {e}")
                logger.debug(f"Response content: {result.text}")
                sys.exit(1)
        else:
            status = result.status_code if result else "N/A"
            text = result.text if result else "No response object"
            logger.error(
                f"API request failed after retries with status {status}: {text}"
            )
            sys.exit(1)

    except Exception as e:
        logger.error(
            f"Cloudflare API registration failed for {key_type}: {e}", exc_info=True
        )
        sys.exit(1)


# IPv6 prefixes for generating endpoints
ipv6_prefixes = ["2606:4700:d1", "2606:4700:d0"]

# IPv4 prefixes for generating endpoints
ipv4_prefixes = [
    "162.159.192.",
    "162.159.193.",
    "162.159.195.",
    "162.159.204.",
    "188.114.96.",
    "188.114.97.",
    "188.114.98.",
    "188.114.99.",
]

# Available ports for endpoint generation
ports_str = "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 4500 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886"
available_ports = [int(p) for p in ports_str.split()]

# Cloudflare's fixed public key for WireGuard
CLOUDFLARE_PUBLIC_KEY = "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="


# Function to generate a random IPv4 endpoint
def generate_ipv4_endpoint():
    prefix = random.choice(ipv4_prefixes)
    last_octet = random.randint(1, 254)
    server = f"{prefix}{last_octet}"
    port = random.choice(available_ports)
    logger.debug(f"Generated IPv4 endpoint: {server}:{port}")
    return server, port


# Function to generate a random IPv6 endpoint
def generate_ipv6_endpoint():
    prefix = random.choice(ipv6_prefixes)
    random_part = ":".join(f"{random.randint(0, 65535):04x}" for _ in range(4))
    port = random.choice(available_ports)
    server = f"{prefix}::{random_part}"
    logger.debug(f"Generated IPv6 endpoint: {server}:{port}")
    return server, port


# --- Main Script Logic ---
try:
    # --- Delete existing cache file ---
    if os.path.exists(CACHE_FILE_PATH):
        logger.warning(f"Deleting existing cache file: {CACHE_FILE_PATH}")
        try:
            os.remove(CACHE_FILE_PATH)
            logger.info("Cache file deleted successfully.")
        except OSError as e:
            logger.error(
                f"Error deleting cache file: {e}. Please delete it manually and restart."
            )
            sys.exit(1)  # Exit if cache cannot be deleted

    # Load the base configuration template (YAML format)
    logger.info(f"Loading config template from {CONFIG_TEMPLATE_PATH}")
    try:
        with open(CONFIG_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            config_template_dict = yaml.safe_load(f)
        logger.info("Config template loaded successfully")
    except IOError as e:
        logger.error(
            f"Error reading config template file '{CONFIG_TEMPLATE_PATH}': {e}"
        )
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Invalid YML syntax in config file '{CONFIG_TEMPLATE_PATH}': {e}")
        sys.exit(1)

    # Generate/retrieve keys for dialer and entry proxies
    logger.info("Binding keys for Dialer proxies...")
    priv_key_dialer, reserved_dialer, ip_v4_dialer, ip_v6_dialer = bind_keys("dialer")

    logger.info("Binding keys for Entry proxies...")
    priv_key_entry, reserved_entry, ip_v4_entry, ip_v6_entry = bind_keys("entry")

    # Prepare unique interface IPs, adding CIDR notation
    ip_dialer = f"{ip_v4_dialer}/32" if ip_v4_dialer else "172.16.0.2/32"
    ipv6_dialer = (
        f"{ip_v6_dialer}/128"
        if ip_v6_dialer
        else "2606:4700:110:8867:3f4a:906:1933:43c5/128"
    )
    ip_entry = (
        f"{ip_v4_entry}/32" if ip_v4_entry else "172.16.0.3/32"
    )  # Use a different fallback
    ipv6_entry = (
        f"{ip_v6_entry}/128"
        if ip_v6_entry
        else "2606:4700:110:8867:3f4a:906:1933:43c5/128"
    )  # Different fallback

    logger.info(f"Using Dialer IPs: {ip_dialer}, {ipv6_dialer}")
    logger.info(f"Using Entry IPs: {ip_entry}, {ipv6_entry}")

    proxies_list = []
    dialer_proxy_names = []
    entry_proxy_names = []
    ipv6_endpoint_count = 0  # Counter for limiting IPv6 endpoints

    logger.info(f"Generating {NUM_PROXY_PAIRS} proxy pairs...")
    for i in range(NUM_PROXY_PAIRS):
        pair_num = i + 1
        logger.debug(f"Generating pair {pair_num}/{NUM_PROXY_PAIRS}...")

        # --- Create Dialer Proxy FIRST ---
        dialer_proxy_name = f"{DIALER_PROXY_BASE_NAME}-{pair_num:02d} 🔗"
        dialer_proxy_names.append(dialer_proxy_name)
        server_dialer, port_dialer = generate_ipv4_endpoint()
        entry_proxy_name = f"{ENTRY_PROXY_BASE_NAME}-{pair_num:02d} ⚡"

        dialer_proxy = {
            "name": dialer_proxy_name,
            "type": "wireguard",
            "ip": ip_dialer,
            "ipv6": ipv6_dialer,
            "private-key": priv_key_dialer,
            "server": server_dialer,
            "port": port_dialer,
            "public-key": CLOUDFLARE_PUBLIC_KEY,
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_dialer,
            "udp": True,
            "mtu": 1280,
            "dialer-proxy": entry_proxy_name,
        }
        proxies_list.append(dialer_proxy)

        # --- Create Entry Proxy SECOND ---
        entry_proxy_names.append(entry_proxy_name)

        # Decide whether to use IPv6 or IPv4 endpoint for Entry proxy
        if ipv6_endpoint_count < NUM_IPV6_ENTRY_ENDPOINTS:
            server_entry, port_entry = generate_ipv6_endpoint()
            ipv6_endpoint_count += 1
            logger.debug(f"Using IPv6 endpoint for Entry proxy {pair_num}")
        else:
            server_entry, port_entry = generate_ipv4_endpoint()
            logger.debug(f"Using IPv4 endpoint for Entry proxy {pair_num}")

        entry_proxy = {
            "name": entry_proxy_name,
            "type": "wireguard",
            "ip": ip_entry,
            "ipv6": ipv6_entry,
            "private-key": priv_key_entry,
            "server": server_entry,
            "port": port_entry,
            "public-key": CLOUDFLARE_PUBLIC_KEY,
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_entry,
            "udp": True,
            "mtu": 1280,
            "amnezia-wg-option": {"jc": "5", "jmin": "50", "jmax": "100"},
        }
        proxies_list.append(entry_proxy)

    # Add the generated proxies to the template dictionary
    config_template_dict["proxies"] = proxies_list

    # --- Create Proxy Groups Dynamically ---
    logger.info("Creating proxy groups...")
    proxy_groups = [
        {
            "name": MAIN_SELECTOR_GROUP_NAME,
            "type": "select",
            "proxies": [
                ENTRY_URL_TEST_GROUP_NAME,
                DIALER_URL_TEST_GROUP_NAME,
                "DIRECT",
                *dialer_proxy_names,  # Dialer proxies first in list
                *entry_proxy_names,  # Entry proxies second
            ],
        },
        {
            "name": ENTRY_URL_TEST_GROUP_NAME,
            "type": "url-test",
            "url": "https://www.gstatic.com/generate_204",
            "interval": 60,  # Increased interval slightly
            "tolerance": 100,  # Increased tolerance slightly
            "proxies": entry_proxy_names,
        },
        {
            "name": DIALER_URL_TEST_GROUP_NAME,
            "type": "url-test",
            "url": "https://www.gstatic.com/generate_204",
            "interval": 60,
            "tolerance": 100,
            "proxies": dialer_proxy_names,
        },
    ]
    config_template_dict["proxy-groups"] = proxy_groups

    # Ensure the final MATCH rule uses the correct selector group name
    if "rules" in config_template_dict:
        updated_rules = []
        match_rule_found = False
        for rule in config_template_dict["rules"]:
            if isinstance(rule, str) and rule.startswith("MATCH,"):
                updated_rules.append(f"MATCH,{MAIN_SELECTOR_GROUP_NAME}")
                logger.info(
                    f"Updated MATCH rule to use '{MAIN_SELECTOR_GROUP_NAME}' group."
                )
                match_rule_found = True
            else:
                updated_rules.append(rule)
        if not match_rule_found:
            logger.warning("MATCH rule not found in template. Appending default.")
            updated_rules.append(f"MATCH,{MAIN_SELECTOR_GROUP_NAME}")
        config_template_dict["rules"] = updated_rules

    # Ensure the primary DNS nameserver uses the correct selector group name tag
    if "dns" in config_template_dict and "nameserver" in config_template_dict["dns"]:
        if config_template_dict["dns"]["nameserver"]:
            parts = config_template_dict["dns"]["nameserver"][0].split("#")
            if len(parts) >= 1:  # Check if there is at least a server part
                # Rebuild tag using the main selector group name
                config_template_dict["dns"]["nameserver"][
                    0
                ] = f"{parts[0]}#{MAIN_SELECTOR_GROUP_NAME}"
                logger.info(
                    f"Updated primary DNS nameserver to use '{MAIN_SELECTOR_GROUP_NAME}' group tag."
                )
            else:
                logger.warning(
                    "Primary DNS nameserver format unexpected. Could not update tag."
                )
        else:
            logger.warning("DNS nameserver list is empty in template.")

    # --- Write Output YAML File ---
    logger.info(f"Writing output to {OUTPUT_YAML_FILENAME}")
    try:
        os.makedirs(os.path.dirname(OUTPUT_YAML_FILENAME), exist_ok=True)
        # Add comments to the beginning of the file
        generation_time = datetime.datetime.now().isoformat()
        header_comment = "# Generated Clash Meta WireGuard config using WG script\n"
        header_comment += f"# Generated on: {generation_time}\n\n"

        with open(OUTPUT_YAML_FILENAME, "w", encoding="utf-8") as f:
            f.write(header_comment)
            # Dump the dictionary as YAML
            yaml.dump(
                config_template_dict,
                f,
                allow_unicode=True,
                sort_keys=False,
                default_flow_style=False,
                indent=2,
            )
        logger.info(f"Successfully generated '{OUTPUT_YAML_FILENAME}'")
    except IOError as e:
        logger.error(f"Error writing to file '{OUTPUT_YAML_FILENAME}': {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(
            f"An unexpected error occurred while writing YAML: {e}", exc_info=True
        )
        sys.exit(1)

except Exception as e:
    logger.error(f"Unexpected error occurred in script execution: {e}", exc_info=True)
    sys.exit(1)
