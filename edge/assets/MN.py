import os
import base64
import random
import json
import yaml
import sys
import requests
import datetime
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey


def byte_to_base64(myb):
    return base64.b64encode(myb).decode("utf-8")


def generate_public_key(key_bytes):
    private_key = X25519PrivateKey.from_private_bytes(key_bytes)
    public_key = private_key.public_key()
    public_key_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
    )
    return public_key_bytes


def generate_private_key():
    key = os.urandom(32)
    key = list(key)
    key[0] &= 248
    key[31] &= 127
    key[31] |= 64
    return bytes(key)


def register_key_on_CF(pub_key):
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
    return r


def bind_keys():
    priv_bytes = generate_private_key()
    priv_string = byte_to_base64(priv_bytes)
    pub_bytes = generate_public_key(priv_bytes)
    pub_string = byte_to_base64(pub_bytes)
    result = register_key_on_CF(pub_string)
    if result.status_code == 200:
        try:
            z = json.loads(result.content)
            client_id = z["config"]["client_id"]
            cid_byte = base64.b64decode(client_id)
            reserved = [int(j) for j in cid_byte]
            return priv_string, reserved
        except Exception as e:
            print(f"Error with API: {e}")
            sys.exit(1)
    else:
        print(f"API request failed with status {result.status_code}")
        sys.exit(1)


# IPv6
ipv6_prefixes = ["2606:4700:d1", "2606:4700:d0"]

# IPv4
ipv4_prefixes = [
    "188.114.96.",
    "188.114.97.",
    "188.114.98.",
    "188.114.99.",
    "162.159.192.",
    "162.159.195.",
]

ports_str = "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 4500 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886"
available_ports = [int(p) for p in ports_str.split()]


def generate_ipv4_endpoint():
    """Generates a random IPv4 server address and port."""
    prefix = random.choice(ipv4_prefixes)
    last_octet = random.randint(1, 254)
    port = random.choice(available_ports)
    server = f"{prefix}{last_octet}"
    return server, port


def generate_ipv6_endpoint():
    """Generates a random IPv6 server address and port."""
    prefix = random.choice(ipv6_prefixes)
    random_part = ":".join(f"{random.randint(0, 65535):04x}" for _ in range(4))
    port = random.choice(available_ports)
    server = f"[{prefix}::{random_part}]"
    return server, port


config_template = {
    "port": 7890,
    "socks-port": 7891,
    "mixed-port": 7892,
    "ipv6": True,
    "allow-lan": True,
    "mode": "rule",
    "log-level": "info",
    "disable-keep-alive": False,
    "keep-alive-idle": 30,
    "keep-alive-interval": 30,
    "unified-delay": False,
    "external-controller": "127.0.0.1:9090",
    "external-ui-url": "https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip",
    "external-ui": "ui",
    "external-controller-cors": {"allow-origins": ["*"], "allow-private-network": True},
    "profile": {"store-selected": True, "store-fake-ip": True},
    "dns": {
        "enable": True,
        "listen": "0.0.0.0:1053",
        "ipv6": False,
        "respect-rules": True,
        "use-system-hosts": False,
        "nameserver": [
            "https://8.8.8.8/dns-query#⚪ REvil",
            "https://94.140.14.14/dns-query",
            "https://208.67.222.222/dns-query",
            "https://dns.alidns.com/dns-query",
        ],
        "fallback": [
            "https://revil-nginx.deno.dev/1:-J8-HwADAAgDECIBLKDAAFQzIABAywBI",
            "tls://dns.quad9.net",
            "tls://1.1.1.1",
            "tls://dns.google",
        ],
        "proxy-server-nameserver": ["8.8.4.4#DIRECT"],
        "nameserver-policy": {
            "raw.githubusercontent.com": "8.8.4.4#DIRECT",
            "time.apple.com": "8.8.8.8#DIRECT",
            "www.gstatic.com": "system",
            "rule-set:ir": ["8.8.4.4#DIRECT"],
        },
    },
    "tun": {
        "enable": True,
        "stack": "mixed",
        "auto-route": True,
        "strict-route": True,
        "auto-detect-interface": True,
        "dns-hijack": ["any:53"],
        "mtu": 9000,
    },
    "sniffer": {
        "enable": True,
        "force-dns-mapping": True,
        "parse-pure-ip": True,
        "override-destination": False,
        "sniff": {
            "HTTP": {"ports": [80, 8080, 8880, 2052, 2082, 2086, 2095]},
            "TLS": {"ports": [443, 8443, 2053, 2083, 2087, 2096]},
        },
    },
    "proxies": [],
    "proxy-groups": [
        {
            "name": "⚪ REvil",
            "type": "select",
            "proxies": [
                "🔴 AUTO",
                "DIRECT",
                "🇮🇷 Warp - IPv4",
                "🇩🇪 Warp - IPv4",
                "🇮🇷 Warp - IPv6",
                "🇸🇪 Warp - IPv6",
            ],
        },
        {
            "name": "🔴 AUTO",
            "type": "url-test",
            "url": "http://www.gstatic.com/generate_204",
            "interval": 300,
            "tolerance": 50,
            "proxies": [
                "🇮🇷 Warp - IPv4",
                "🇩🇪 Warp - IPv4",
                "🇮🇷 Warp - IPv6",
                "🇸🇪 Warp - IPv6",
            ],
        },
    ],
    "rule-providers": {
        "ir": {
            "type": "http",
            "format": "text",
            "behavior": "domain",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ir.txt",
            "path": "./ruleset/ir.txt",
            "interval": 86400,
        },
        "ir-cidr": {
            "type": "http",
            "format": "text",
            "behavior": "ipcidr",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ircidr.txt",
            "path": "./ruleset/ir-cidr.txt",
            "interval": 86400,
        },
        "malware": {
            "type": "http",
            "format": "text",
            "behavior": "domain",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/malware.txt",
            "path": "./ruleset/malware.txt",
            "interval": 86400,
        },
        "phishing": {
            "type": "http",
            "format": "text",
            "behavior": "domain",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/phishing.txt",
            "path": "./ruleset/phishing.txt",
            "interval": 86400,
        },
        "cryptominers": {
            "type": "http",
            "format": "text",
            "behavior": "domain",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/cryptominers.txt",
            "path": "./ruleset/cryptominers.txt",
            "interval": 86400,
        },
        "ads": {
            "type": "http",
            "format": "text",
            "behavior": "domain",
            "url": "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ads.txt",
            "path": "./ruleset/ads.txt",
            "interval": 86400,
        },
    },
    "rules": [
        "RULE-SET,ir,DIRECT",
        "RULE-SET,ir-cidr,DIRECT",
        "RULE-SET,ads,REJECT",
        "RULE-SET,malware,REJECT",
        "RULE-SET,phishing,REJECT",
        "RULE-SET,cryptominers,REJECT",
        "MATCH,⚪ REvil",
    ],
    "ntp": {"enable": True, "server": "time.apple.com", "port": 123, "interval": 30},
}

proxies_list = []

# First call bind_keys for configs 1 and 3
private_key_1, reserved_1 = bind_keys()

server1_ipv4, port1_ipv4 = generate_ipv4_endpoint()
proxies_list.append(
    {
        "name": "🇮🇷 Warp - IPv4",
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
        "mtu": 1280,
        "dialer-proxy": "🇩🇪 Warp - IPv4",
        "remote-dns-resolve": True,
        "dns": ["1.1.1.1", "1.0.0.1"],
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

# Calling bind_keys for configs 2 and 4
private_key_2, reserved_2 = bind_keys()

server2_ipv4, port2_ipv4 = generate_ipv4_endpoint()
proxies_list.append(
    {
        "name": "🇩🇪 Warp - IPv4",
        "type": "wireguard",
        "ip": "172.16.0.2/32",
        "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
        "private-key": private_key_2,
        "server": server2_ipv4,
        "port": port2_ipv4,
        "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
        "allowed-ips": ["0.0.0.0/0", "::/0"],
        "reserved": reserved_2,
        "udp": True,
        "mtu": 1280,
        "dialer-proxy": "",
        "remote-dns-resolve": True,
        "dns": ["1.1.1.1", "1.0.0.1"],
    }
)

server3_ipv4, port3_ipv4 = generate_ipv4_endpoint()
proxies_list.append(
    {
        "name": "🇮🇷 Warp - IPV4",
        "type": "wireguard",
        "ip": "172.16.0.2/32",
        "ipv6": "2606:4700:110:8875:1644:47c0:47a1:8bc5/128",
        "private-key": private_key_1,
        "server": server3_ipv4,
        "port": port3_ipv4,
        "public-key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
        "allowed-ips": ["0.0.0.0/0", "::/0"],
        "reserved": reserved_1,
        "udp": True,
        "mtu": 1280,
        "dialer-proxy": "🇸🇪 Warp - IPv6",
        "remote-dns-resolve": True,
        "dns": ["1.1.1.1", "1.0.0.1"],
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

# If you want a True IPv6 endpoint here, change generate_ipv4_endpoint() to generate_ipv6_endpoint() below.
server1_ipv6, port1_ipv6 = generate_ipv6_endpoint()
proxies_list.append(
    {
        "name": "🇸🇪 Warp - IPv6",
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
        "dialer-proxy": "",
        "remote-dns-resolve": True,
        "dns": ["1.1.1.1", "1.0.0.1"],
    }
)

config_template["proxies"] = proxies_list

# json
output_json_filename = "clash_wg.json"
try:
    with open(output_json_filename, "w", encoding="utf-8") as f:
        json.dump(config_template, f, indent=2, ensure_ascii=False)
    print(f"Successfully generated '{output_json_filename}'")
except IOError as e:
    print(f"Error writing to file '{output_json_filename}': {e}", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f"An unexpected error occurred while writing JSON: {e}", file=sys.stderr)
    sys.exit(1)

# yaml
output_yaml_filename = "clash_wg.yml"
try:
    with open(output_yaml_filename, "w", encoding="utf-8") as f:
        yaml.dump(
            config_template, f, default_flow_style=False, allow_unicode=True, indent=2
        )
    print(f"Successfully generated '{output_yaml_filename}'")
except IOError as e:
    print(f"Error writing to file '{output_yaml_filename}': {e}", file=sys.stderr)
except Exception as e:
    print(f"An unexpected error occurred while writing YAML: {e}", file=sys.stderr)
    sys.exit(1)
