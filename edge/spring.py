import base64
import datetime
import ipaddress
import json
import logging
import os
import subprocess
import sys
import random

# Set up logging
logging.basicConfig(level=logging.INFO)

# Constants
IRAN_SYMBOL = "⚪️"
FOREIGN_SYMBOL = "🟢"

IR_TAG = f"{IRAN_SYMBOL}Tehran"
SW_TAG = f"{FOREIGN_SYMBOL}Somewhere"

# IPv4 prefixes associated with the CloudFlare WARP service
warp_cidr = [
    "8.6.112.0/24",
    "8.34.70.0/24",
    "8.34.146.0/24",
    "8.35.211.0/24",
    "8.39.125.0/24",
    "8.39.204.0/24",
    "8.47.69.0/24",
    "162.159.192.0/24",
    "162.159.195.0/24",
    "188.114.96.0/24",
    "188.114.97.0/24",
    "188.114.98.0/24",
    "188.114.99.0/24",
]

# Available ports for endpoint generation
ports_str = os.environ.get(
    "AVAILABLE_PORTS",
    "500 854 859 864 878 880 890 891 894 903 908 928 934 939 942 943 945 946 955 968 987 988 1002 1010 1014 1018 1070 1074 1180 1387 1701 1843 2371 2408 2506 3138 3476 3581 3854 4177 4198 4233 4500 5279 5956 7103 7152 7156 7281 7559 8319 8742 8854 8886",
)
available_ports = [int(p) for p in ports_str.split()]


# Function to generate a random WARP endpoint
def generate_warp_endpoint():
    cidr = random.choice(warp_cidr)
    network = ipaddress.IPv4Network(cidr)
    # To avoid network and broadcast addresses, we select from the usable host range.
    ip = network.network_address + random.randint(1, network.num_addresses - 2)
    port = random.choice(available_ports)
    endpoint = f"{ip}:{port}"
    logging.info(f"Generated WARP endpoint: {endpoint}")
    return endpoint


# Paths
script_directory = os.path.dirname(__file__)
main_directory = os.path.dirname(script_directory)
edge_directory = os.path.join(main_directory, "edge")
edge_bestip_path = os.path.join(edge_directory, "Bestip.txt")
edge_result_path = os.path.join(main_directory, "result.csv")
main_singbox_path = os.path.join(main_directory, "sing-box.json")
main_warp_path = os.path.join(main_directory, "warp.json")


# Function to generate Hiddify config
def export_Hiddify(t_ips):
    config_prefix = f"warp://{t_ips[0]}?ifp=1-3&ifpm=m4#{IR_TAG}&&detour=warp://{t_ips[1]}?ifp=1-2&ifpm=m5#{SW_TAG}"
    formatted_time = datetime.datetime.now().strftime("%A, %d %b %Y, %H:%M")
    return config_prefix, formatted_time


# Function to generate Sing-box config
def toSingBox(tag, clean_ip, detour, addresses):
    logging.info(f"Generating Warp config for {tag}")
    subprocess.run(
        ["wget", "-N", "https://gitlab.com/fscarmen/warp/-/raw/main/api.sh"], check=True
    )
    prc = subprocess.run(
        ["sudo", "bash", "api.sh", "-r"], capture_output=True, text=True
    )
    output = prc.stdout

    if prc.returncode == 0 and output:
        try:
            data = json.loads(output)
            wg = {
                "address": addresses,
                "detour": f"{detour}",
                "mtu": 1280,
                "peers": [
                    {
                        "address": f"{clean_ip.split(':')[0]}",
                        "allowed_ips": ["0.0.0.0/0", "::/0"],
                        "persistent_keepalive_interval": 30,
                        "port": int(clean_ip.split(":")[1]),
                        "public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
                        "reserved": data["config"]["reserved"],
                    }
                ],
                "private_key": f"{data['private_key']}",
                "tag": tag,
                "type": "wireguard",
                "workers": 4,
            }

            if os.path.exists("api.sh"):
                os.remove("api.sh")
                logging.info("api.sh file removed.")

            return wg
        except (json.JSONDecodeError, KeyError) as e:
            logging.error(f"Error processing JSON data: {e}")
            return None
    else:
        logging.error("Error: Command execution failed or produced no output.")
        return None


# Function to export Sing-box config
def export_SingBox(t_ips):
    addresses_1 = [
        "172.16.0.2/32",
        "2606:4700:110:8836:f1c9:4393:9b37:3814/128",
    ]
    addresses_2 = [
        "172.16.0.3/32",
        "2606:4700:110:8867:3f4a:906:1933:43c5/128",
    ]

    template_path = os.path.join(edge_directory, "assets", "singbox-template.json")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template file not found at {template_path}")
    with open(template_path, "r") as f:
        data = json.load(f)

    data["outbounds"][0]["outbounds"].extend([IR_TAG, SW_TAG])
    data["outbounds"][1]["outbounds"].extend([IR_TAG, SW_TAG])

    tehran_wg = toSingBox(IR_TAG, t_ips[0], "direct", addresses_1)
    if tehran_wg:
        data["endpoints"].append(tehran_wg)
    else:
        logging.error(f"Failed to generate {IR_TAG} configuration.")

    Somewhere_wg = toSingBox(SW_TAG, t_ips[1], IR_TAG, addresses_2)
    if Somewhere_wg:
        data["endpoints"].append(Somewhere_wg)
    else:
        logging.error(f"Failed to generate {SW_TAG} configuration.")

    with open(main_singbox_path, "w") as f:
        json.dump(data, f, indent=2)


# Main function
def main():
    try:
        if not os.path.exists(edge_directory):
            os.makedirs(edge_directory)

        Bestip = [generate_warp_endpoint(), generate_warp_endpoint()]

        formatted_time = datetime.datetime.now().strftime("%a, %H:%M:%S")
        config_prefix, _ = export_Hiddify(Bestip)

        # Hiddify profile details
        title = (
            "//profile-title: base64:"
            + base64.b64encode("Freedom to Dream 🤍".encode("utf-8")).decode("utf-8")
            + "\n"
        )
        update_interval = "//profile-update-interval: 6\n"
        sub_info = "//subscription-userinfo: upload = 800306368000; download = 2576980377600; total = 6012954214400; expire = 1794182399\n"
        profile_web = "//profile-web-page-url: https://github.com/NiREvil/vless\n"
        last_modified = "//last update on: " + formatted_time + "\n"

        with open(main_warp_path, "w") as op:
            op.write(
                title
                + update_interval
                + sub_info
                + profile_web
                + last_modified
                + config_prefix
            )

        export_SingBox(Bestip)

    except subprocess.CalledProcessError as e:
        logging.error(f"Error executing command: {e}")
        sys.exit(1)
    except Exception as e:
        logging.error(f"An unexpected error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
