import os
import base64
import random
import json
import yaml
import sys
import requests
import datetime
import logging
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey

# Log settings
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

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

# Function to register a public key with Cloudflare API
def register_key_on_CF(pub_key):
    logger.info(f"Registering public key: {pub_key[:20]}... with Cloudflare API")
    logger.debug("Checking network connectivity before API call...")
    try:
        url = "https://api.cloudflareclient.com/v0a4005/reg"
        body = {
            "key": pub_key,
            "install_id": "",
            "fcm_token": "",
            "warp_enabled": True,
            "tos": datetime.datetime.now().isoformat()[:-3] + "+07:00",
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
            "CF-Client-Version": "a-6.30-3596",
        }
        r = requests.post(url, data=bodyString, headers=headers)
        logger.info(f"Cloudflare API response status: {r.status_code}")
        return r
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to connect to Cloudflare API: {e}")
        raise

# Function to generate and register private/public key pair
def bind_keys():
    priv_bytes = generate_private_key()
    priv_string = byte_to_base64(priv_bytes)
    logger.info(f"Generated private key: {priv_string[:20]}...")
    pub_bytes = generate_public_key(priv_bytes)
    pub_string = byte_to_base64(pub_bytes)
    logger.info(f"Generated public key: {pub_string[:20]}...")
    result = register_key_on_CF(pub_string)
    if result.status_code == 200:
        try:
            z = json.loads(result.content)
            client_id = z["config"]["client_id"]
            cid_byte = base64.b64decode(client_id)
            reserved = [int(j) for j in cid_byte]
            logger.info(
                f"Successfully registered with client_id: {client_id[:20]}... and reserved: {reserved}"
            )
            return priv_string, reserved
        except Exception as e:
            logger.error(f"Error parsing API response: {e}")
            sys.exit(1)
    else:
        logger.error(
            f"API request failed with status {result.status_code}: {result.text}"
        )
        sys.exit(1)

# IPv6 prefixes for generating endpoints
ipv6_prefixes = ["2606:4700:d1", "2606:4700:d0"]

# IPv4 prefixes for generating endpoints
ipv4_prefixes = [
    "162.159.192.0/24",
    "162.159.193.0/24",
    "162.159.195.0/24",
    "162.159.204.0/24",
    "188.114.96.0/24",
    "188.114.97.0/24",
    "188.114.98.0/24",
    "188.114.99.0/24",
]

# Available ports for endpoint generation
ports_str = "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 4500 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886"
available_ports = [int(p) for p in ports_str.split()]

# Function to generate a random IPv4 endpoint
def generate_ipv4_endpoint():
    prefix = random.choice(ipv4_prefixes)
    last_octet = random.randint(1, 254)
    port = random.choice(available_ports)
    server = f"{prefix}{last_octet}"
    logger.info(f"Generated IPv4 endpoint: {server}:{port}")
    return server, port

# Function to generate a random IPv6 endpoint
def generate_ipv6_endpoint():
    prefix = random.choice(ipv6_prefixes)
    random_part = ":".join(f"{random.randint(0, 65535):04x}" for _ in range(4))
    port = random.choice(available_ports)
    server = f"[{prefix}::{random_part}]"
    logger.info(f"Generated IPv6 endpoint: {server}:{port}")
    return server, port

# Main script logic wrapped in try-except for catching unexpected errors
try:
    # Reading the template YML file
    config_file_path = "edge/assets/clash-meta-wg-template.yml"
    logger.info(f"Loading config template from {config_file_path}")
    try:
        with open(config_file_path, "r", encoding="utf-8") as f:
            config_template = yaml.safe_load(f)
        logger.info("Config template loaded successfully")
    except IOError as e:
        logger.error(f"Error reading config template file '{config_file_path}': {e}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"Invalid YML syntax in config file '{config_file_path}': {e}")
        sys.exit(1)

    proxies_list = []

    # First, call bind_keys for configurations 1 and 3.
    logger.info("Generating keys for ReGuard-IPv4 and EviLink-IPv4")
    private_key_1, reserved_1 = bind_keys()

    server1_ipv4, port1_ipv4 = generate_ipv4_endpoint()
    proxies_list.append(
        {
            "name": "🇮🇷 ReGuard-v4",
            "type": "wireguard",
            "ip": "172.16.0.2/32",
            "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
            "private-key": private_key_1,
            "server": server1_ipv4,
            "port": port1_ipv4,
            "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_1,
            "udp": True,
            "mtu": 1380,
            "dialer-proxy": "🇩🇪 ReGuard-v6",
            "amnezia-wg-option": {
                "jc": 4,
                "jmin": 40,
                "jmax": 100,
                "s1": 0,
                "s2": 0,
                "h1": 1,
                "h2": 2,
                "h4": 3,
                "h3": 4,
            },
        }
    )

    # Second, call bind_keys for configurations 2 and 4.
    logger.info("Generating keys for ReGuard-IPv6 and EviLink-IPv6")
    private_key_2, reserved_2 = bind_keys()

    server1_ipv6, port1_ipv6 = generate_ipv6_endpoint()
    proxies_list.append(
        {
            "name": "🇩🇪 ReGuard-v6",
            "type": "wireguard",
            "ip": "172.16.0.2/32",
            "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
            "private-key": private_key_2,
            "server": server1_ipv6,
            "port": port1_ipv6,
            "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_2,
            "udp": True,
            "mtu": 1280,
        }
    )

    server2_ipv4, port2_ipv4 = generate_ipv4_endpoint()
    proxies_list.append(
        {
            "name": "🇮🇷 EviLink-v4",
            "type": "wireguard",
            "ip": "172.16.0.2/32",
            "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
            "private-key": private_key_1,
            "server": server2_ipv4,
            "port": port2_ipv4,
            "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_1,
            "udp": True,
            "mtu": 1380,
            "dialer-proxy": "🇩🇪 EviLink-v6",
            "amnezia-wg-option": {
                "jc": 4,
                "jmin": 40,
                "jmax": 100,
                "s1": 0,
                "s2": 0,
                "h1": 1,
                "h2": 2,
                "h4": 3,
                "h3": 4,
            },
        }
    )

    server2_ipv6, port2_ipv6 = generate_ipv6_endpoint()
    proxies_list.append(
        {
            "name": "🇩🇪 EviLink-v6",
            "type": "wireguard",
            "ip": "172.16.0.2/32",
            "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
            "private-key": private_key_2,
            "server": server2_ipv6,
            "port": port2_ipv6,
            "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            "allowed-ips": ["0.0.0.0/0", "::/0"],
            "reserved": reserved_2,
            "udp": True,
            "mtu": 1280,
        }
    )

    config_template["proxies"] = proxies_list

    # Writing the output YML file with comments
    output_yaml_filename = "sub/clash-meta-wg.yml"
    logger.info(f"Writing output to {output_yaml_filename}")
    try:
        with open(output_yaml_filename, "w", encoding="utf-8") as f:
            f.write(
                "# Generated config for clash-meta with Warp/WireGuard proxies that have amnezia values.\n"
            )
            f.write(f"# Generated on: {datetime.datetime.now().isoformat()}\n\n")
            yaml.safe_dump(config_template, f, allow_unicode=True, sort_keys=False)
        logger.info(f"Successfully generated '{output_yaml_filename}'")
    except IOError as e:
        logger.error(f"Error writing to file '{output_yaml_filename}': {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"An unexpected error occurred while writing YML: {e}", exc_info=True)
        sys.exit(1)

except Exception as e:
    logger.error(f"Unexpected error occurred in script execution: {e}", exc_info=True)
    sys.exit(1)
