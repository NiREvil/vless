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
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

# --- Configuration ---
NUM_PROXY_PAIRS = 8 # Number of proxy pairs to generate
OUTPUT_YAML_FILENAME = "sub/clash-meta-wg.yml" # Output JSON filename
CONFIG_TEMPLATE_PATH = "edge/assets/clash-meta-wg-template.yml" # Path to the template file
CACHE_FILE_PATH = "sub/key_cache.json" # Path for caching generated keys

# Proxy Naming Configuration
DIALER_PROXY_BASE_NAME = "ReGuard-Dialer 🇩🇪"
ENTRY_PROXY_BASE_NAME = "EviLink-Entry 🇮🇷"
MAIN_SELECTOR_GROUP_NAME = "SELECT 🛡️"
DIALER_URL_TEST_GROUP_NAME = f"BP-{DIALER_PROXY_BASE_NAME}"
ENTRY_URL_TEST_GROUP_NAME = f"BP-{ENTRY_PROXY_BASE_NAME}"
# --- End Configuration ---

# Log settings
logging.basicConfig(
    level=logging.WARNING,
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
                if not content:
                    return []
                return json.loads(content)
        except json.JSONDecodeError:
            logger.warning(f"Cache file {CACHE_FILE_PATH} is corrupted. Starting fresh.")
            return []
        except IOError as e:
            logger.error(f"Error reading cache file {CACHE_FILE_PATH}: {e}")
            return []
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
    stop=stop_after_attempt(3), # Retry up to 3 times
    wait=wait_exponential(multiplier=1, min=4, max=10), # Exponential backoff
    retry=retry_if_exception_type(RateLimitError), # Only retry on RateLimitError
    reraise=True # Reraise the exception if all retries fail
)
def register_key_on_CF(pub_key):
    logger.info(f"Registering public key: {pub_key[:20]}... with Cloudflare API")
    try:
        # Using the API endpoint and headers
        url = "https://api.cloudflareclient.com/v0a4005/reg"
        # Generate random install_id and fcm_token for each registration attempt
        install_id = base64.b64encode(os.urandom(12)).decode('utf-8')
        fcm_token = f"{install_id}:APA91b{base64.b64encode(os.urandom(138)).decode('utf-8')}"

        body = {
            "key": pub_key,
            "install_id": install_id, # Use generated install_id
            "fcm_token": fcm_token,   # Use generated fcm_token
            "warp_enabled": True, # Set to True as per user's code
            "tos": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"), # Use UTC time
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
            # "CF-Client-Version": "a-6.30-3596", # Often optional
        }
        # Add a small random delay before the request
        time.sleep(random.uniform(1, 2))
        r = requests.post(url, data=bodyString, headers=headers, timeout=20) # Increased timeout

        if r.status_code == 429:
            logger.warning(f"Rate limit hit (429). Headers: {r.headers}")
            # Extract retry-after header if available
            retry_after = r.headers.get("Retry-After")
            wait_time = int(retry_after) if retry_after else 10 # Default wait if header missing
            logger.warning(f"Waiting for {wait_time} seconds due to rate limit.")
            time.sleep(wait_time) # Wait before raising the error for retry
            raise RateLimitError("Rate limit exceeded")

        logger.info(f"Cloudflare API response status: {r.status_code}")
        r.raise_for_status() # Raise HTTPError for other bad responses (4xx or 5xx)
        return r

    except requests.exceptions.Timeout:
        logger.error("Cloudflare API request timed out.")
        # Let tenacity handle retry for timeouts if desired, or raise specific error
        # For now, we let it fall through to RequestException
        raise requests.exceptions.RequestException("API request timed out")
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to Cloudflare API: {e}")
        raise # Reraise the exception for tenacity or final failure


# Function to generate and register private/public key pair, using cache
def bind_keys(key_type):
    """
    Generates or retrieves a cached key pair and registers it with Cloudflare.
    Uses client_id as the 'reserved' value.

    Args:
        key_type (str): The type of key ('dialer' or 'entry') for caching purposes.

    Returns:
        tuple: (private_key_base64, reserved_value (client_id)) or exits on failure.
    """
    cached_keys = load_cached_keys()
    # Filter keys by the specified type
    matching_keys = [k for k in cached_keys if k.get("type") == key_type]

    if matching_keys:
        # Use a random key from the matching cached keys
        key_data = random.choice(matching_keys)
        private_key = key_data.get("private_key")
        reserved_value = key_data.get("reserved")
        if private_key and reserved_value:
             logger.warning(f"Using cached {key_type} key starting with: {private_key[:10]}...")
             return private_key, reserved_value
        else:
            logger.warning(f"Found incomplete cached key data for {key_type}. Generating new key.")
            # Remove invalid entry? For now, just generate a new one.

    # If no valid cached key found, generate a new one
    logger.info(f"No valid cached key found for type '{key_type}'. Generating and registering a new key.")
    priv_bytes = generate_private_key()
    priv_string = byte_to_base64(priv_bytes)
    logger.info(f"Generated private key for {key_type}: {priv_string[:10]}...")
    pub_bytes = generate_public_key(priv_bytes)
    pub_string = byte_to_base64(pub_bytes)
    logger.info(f"Generated public key for {key_type}: {pub_string[:10]}...")

    try:
        result = register_key_on_CF(pub_string) # This call now includes retry logic

        if result and result.status_code == 200:
            try:
                response_data = result.json()
                # Extract client_id from the response config section
                client_id = response_data.get("config", {}).get("client_id")
                # Extract interface IPs (optional, for logging or potential future use)
                interface_v4 = response_data.get("config", {}).get("interface", {}).get("addresses", {}).get("v4")
                interface_v6 = response_data.get("config", {}).get("interface", {}).get("addresses", {}).get("v6")

                if not client_id:
                    logger.error("Could not find 'client_id' in API response.")
                    logger.debug(f"Response content: {result.text}")
                    sys.exit(1)

                logger.info(
                    f"Successfully registered {key_type} with client_id: ...{client_id[-10:]}"
                )
                logger.info(f"Interface IPs received: v4={interface_v4}, v6={interface_v6}")

                # Add the new key to the cache list
                new_key_data = {
                    "type": key_type,
                    "private_key": priv_string,
                    "reserved": client_id, # Use client_id as reserved value
                    "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat() # Add timestamp
                }
                cached_keys.append(new_key_data)
                save_cached_keys(cached_keys) # Save updated cache

                return priv_string, client_id # Return private key and client_id

            except (json.JSONDecodeError, KeyError, TypeError) as e:
                logger.error(f"Error parsing Cloudflare API response: {e}")
                logger.debug(f"Response content: {result.text}")
                sys.exit(1)
        else:
            # Handle cases where register_key_on_CF might return None or non-200 status after retries
            status = result.status_code if result else "N/A"
            text = result.text if result else "No response object"
            logger.error(
                f"API request failed after retries with status {status}: {text}"
            )
            sys.exit(1)

    except Exception as e: # Catch potential exceptions from register_key_on_CF (like tenacity reraising)
        logger.error(f"Cloudflare API registration failed for {key_type}: {e}", exc_info=True)
        sys.exit(1)


# IPv6 prefixes for generating endpoints
ipv6_prefixes = ["2606:4700:d1", "2606:4700:d0"]

# IPv4 prefixes for generating endpoints
ipv4_prefixes = [
    "162.159.192.", "162.159.193.", "162.159.195.", "162.159.204.",
    "188.114.96.", "188.114.97.", "188.114.98.", "188.114.99."
]

# Available ports for endpoint generation
ports_str = "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886"
available_ports = [int(p) for p in ports_str.split()]

# Cloudflare's fixed public key for WireGuard
CLOUDFLARE_PUBLIC_KEY = "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo="

# Function to generate a random IPv4 endpoint
def generate_ipv4_endpoint():
    prefix = random.choice(ipv4_prefixes)
    last_octet = random.randint(1, 254)
    server = f"{prefix}{last_octet}"
    port = random.choice(available_ports)
    logger.info(f"Generated IPv4 endpoint: {server}:{port}")
    return server, port

# Function to generate a random IPv6 endpoint - CORRECTED
def generate_ipv6_endpoint():
    prefix = random.choice(ipv6_prefixes)
    # Generate 4 random hex groups (not 6)
    random_part = ":".join(f"{random.randint(0, 65535):04x}" for _ in range(4))
    port = random.choice(available_ports)
    # Format as prefix::random_part (NO BRACKETS)
    server = f"{prefix}::{random_part}"
    logger.info(f"Generated IPv6 endpoint: {server}:{port}")
    return server, port

# --- Main Script Logic ---
try:
    # Load the base configuration template (YAML format)
    logger.info(f"Loading config template from {CONFIG_TEMPLATE_PATH}")
    try:
        with open(CONFIG_TEMPLATE_PATH, "r", encoding="utf-8") as f:
            config_template_dict = yaml.safe_load(f)
        logger.info("Config template loaded successfully")
    except IOError as e:
        logger.error(f"Error reading config template file '{CONFIG_TEMPLATE_PATH}': {e}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Invalid YML syntax in config file '{CONFIG_TEMPLATE_PATH}': {e}")
        sys.exit(1)

    # Generate/retrieve keys for dialer and entry proxies using the cache mechanism
    logger.warning("Binding keys for Entry proxies...")
    # Use 'entry' as key_type for caching
    priv_key_entry, reserved_entry = bind_keys('entry')
    
    logger.warning("Binding keys for Dialer proxies...")
    # Use 'dialer' as key_type for caching
    priv_key_dialer, reserved_dialer = bind_keys('dialer')

    # Default IPs (Consider extracting from bind_keys response if needed, but not strictly necessary for config)
    default_ip_v4 = "172.16.0.2/32"
    default_ip_v6 = "2606:4700:110:8867:3f4a:906:1933:43c5/128" # Example fallback

    proxies_list = []
    dialer_proxy_names = []
    entry_proxy_names = []

    logger.warning(f"Generating {NUM_PROXY_PAIRS} proxy pairs...")
    for i in range(NUM_PROXY_PAIRS):
        pair_num = i + 1
        logger.info(f"Generating pair {pair_num}/{NUM_PROXY_PAIRS}...")

        # --- Create Dialer Proxy FIRST ---
        # Use leading zeros for better sorting
        dialer_proxy_name = f"{DIALER_PROXY_BASE_NAME}-{pair_num:02d} ✨"
        dialer_proxy_names.append(dialer_proxy_name)

        # Use IPv4 endpoint for Dialer proxy
        server_dialer, port_dialer = generate_ipv4_endpoint()

        # Define the entry proxy name *before* creating the dialer dict that references it
        entry_proxy_name = f"{ENTRY_PROXY_BASE_NAME}-{pair_num:02d} ⚡"

        dialer_proxy = {
            "name": dialer_proxy_name,
            "type": "wireguard",
            "ip": default_ip_v4,
            "ipv6": default_ip_v6,
            "private-key": priv_key_dialer,
            "server": server_dialer,
            "port": port_dialer,
            "public-key": CLOUDFLARE_PUBLIC_KEY,
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_dialer, # Use client_id from bind_keys
            "udp": True,
            "mtu": 1280,
            "dialer-proxy": entry_proxy_name # Link to the corresponding Entry proxy
            # No amnezia options for the dialer proxy
        }
        # Add Dialer proxy to the list
        proxies_list.append(dialer_proxy)


        # --- Create Entry Proxy SECOND ---
        entry_proxy_names.append(entry_proxy_name)

        # Alternate between IPv4 and IPv6 for Entry endpoints
        if i % 2 == 0:
            server_entry, port_entry = generate_ipv4_endpoint()
        else:
            # Use the CORRECTED IPv6 generation function
            server_entry, port_entry = generate_ipv6_endpoint()

        entry_proxy = {
            "name": entry_proxy_name,
            "type": "wireguard",
            "ip": default_ip_v4,
            "ipv6": default_ip_v6,
            "private-key": priv_key_entry,
            "server": server_entry,
            "port": port_entry,
            "public-key": CLOUDFLARE_PUBLIC_KEY,
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_entry,
            "udp": True,
            "mtu": 1280,
            "amnezia-wg-option": { # Amnezia options (as strings)
                "jc": "5",
                "jmin": "50",
                "jmax": "100"
            }
        }
        # Add Entry proxy to the list
        proxies_list.append(entry_proxy)


    # Add the generated proxies to the template dictionary
    config_template_dict["proxies"] = proxies_list

    # --- Create Proxy Groups Dynamically ---
    # (Proxy group creation logic remains the same, but the order of proxies inside might change slightly)
    logger.warning("Creating proxy groups...")
    proxy_groups = [
        {
            "name": MAIN_SELECTOR_GROUP_NAME, # Main selector group with new name
            "type": "select",
            "proxies": [
                ENTRY_URL_TEST_GROUP_NAME, # Include url-test groups first
                DIALER_URL_TEST_GROUP_NAME,
                "DIRECT", # Add DIRECT option
                # Add individual proxies after url-test groups
                # The order here reflects the new generation order (Dialer then Entry)
                *dialer_proxy_names,
                *entry_proxy_names,
            ]
        },
        {
            "name": ENTRY_URL_TEST_GROUP_NAME, # url-test for Entry proxies
            "type": "url-test",
            "url": "https://www.gstatic.com/generate_204",
            "interval": 30,
            "tolerance": 50,
            "proxies": entry_proxy_names # Use new list name
        },
        {
            "name": DIALER_URL_TEST_GROUP_NAME, # url-test for Dialer proxies
            "type": "url-test",
            "url": "https://www.gstatic.com/generate_204",
            "interval": 30,
            "tolerance": 50,
            "proxies": dialer_proxy_names # Use new list name
        }
    ]
    # Add the generated proxy groups to the template dictionary
    config_template_dict["proxy-groups"] = proxy_groups

    # Ensure the final MATCH rule uses the correct selector group name
    if "rules" in config_template_dict:
        updated_rules = []
        match_rule_found = False
        for rule in config_template_dict["rules"]:
            if isinstance(rule, str) and rule.startswith("MATCH,"):
                 updated_rules.append(f"MATCH,{MAIN_SELECTOR_GROUP_NAME}")
                 logger.info(f"Updated MATCH rule to use '{MAIN_SELECTOR_GROUP_NAME}' group.")
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
             # Assuming the first nameserver is the one tagged with the selector
             parts = config_template_dict["dns"]["nameserver"][0].split('#')
             if len(parts) == 2:
                 config_template_dict["dns"]["nameserver"][0] = f"{parts[0]}#{MAIN_SELECTOR_GROUP_NAME}"
                 logger.info(f"Updated primary DNS nameserver to use '{MAIN_SELECTOR_GROUP_NAME}' group tag.")
             else:
                 logger.warning("Primary DNS nameserver format unexpected. Could not update tag.")
         else:
             logger.warning("DNS nameserver list is empty in template.")

    # --- Write Output JSON File ---
    logger.warning(f"Writing output to {OUTPUT_YAML_FILENAME}") # Use new filename variable
    try:
        # Ensure the output directory exists
        os.makedirs(os.path.dirname(OUTPUT_YAML_FILENAME), exist_ok=True)
        with open(OUTPUT_YAML_FILENAME, "w", encoding="utf-8") as f:
            # Add header comments (optional)
            f.write("# Generated Clash Meta WireGuard config using GuardLink script\n")
            f.write(f"# Generated on: {datetime.datetime.now().isoformat()}\n\n")

            # Dump the dictionary as YAML using yaml.safe_dump
            yaml.safe_dump(
                config_template_dict,
                f,
                allow_unicode=True,    # Preserve emojis and other unicode characters
                sort_keys=False,       # Keep the original order of keys
                default_flow_style=False # Use block style for better readability
            )
        logger.warning(f"Successfully generated '{OUTPUT_YAML_FILENAME}'") # Use new filename variable
    except IOError as e:
        logger.error(f"Error writing to file '{OUTPUT_YAML_FILENAME}': {e}") # Use new filename variable
        sys.exit(1)
    except Exception as e:
        logger.error(
            f"An unexpected error occurred while writing YAML: {e}", exc_info=True
        )
        sys.exit(1)

except Exception as e:
    logger.error(f"Unexpected error occurred in script execution: {e}", exc_info=True)
    sys.exit(1)
    
