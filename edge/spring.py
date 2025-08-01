import base64
import datetime
import ipaddress
import json
import logging
import os
import platform
import subprocess
import sys

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
#   "8.39.204.0/24",
    "8.47.69.0/24",
#   "162.159.192.0/24",
    "162.159.195.0/24",
#   "188.114.96.0/24",
#   "188.114.97.0/24",
    "188.114.98.0/24",
#   "188.114.99.0/24",
]

# Paths
script_directory = os.path.dirname(__file__)
main_directory = os.path.dirname(script_directory)
edge_directory = os.path.join(main_directory, "edge")
edge_bestip_path = os.path.join(edge_directory, "Bestip.txt")
edge_result_path = os.path.join(main_directory, "result.csv")
main_singbox_path = os.path.join(main_directory, "sing-box.json")
main_warp_path = os.path.join(main_directory, "warp.json")


# Function to create list of IP addresses
def create_ips():
    logging.info("Creating Bestip.txt file...")
    with open(edge_bestip_path, "w") as file:
        for cidr in warp_cidr:
            for addr in ipaddress.IPv4Network(cidr):
                file.write(f"{addr}\n")
    logging.info("Bestip.txt file created successfully!")


# Function to determine architecture suffix
def arch_suffix():
    machine = platform.machine().lower()
    if machine.startswith("i386") or machine.startswith("i686"):
        return "386"
    elif machine.startswith(("x86_64", "amd64")):
        return "amd64"
    elif machine.startswith(("armv8", "arm64", "aarch64")):
        return "arm64"
    elif machine.startswith("s390x"):
        return "s390x"
    else:
        raise ValueError(
            "Unsupported CPU architecture. Supported architectures are: i386, i686, x86_64, amd64, armv8, arm64, aarch64, s390x"
        )


# Function to generate Hiddify config
def export_Hiddify(t_ips):
    config_prefix = f"warp://{t_ips[0]}?ifp=1-3&ifpm=m4#{IR_TAG}&&detour=warp://{t_ips[1]}?ifp=1-2&ifpm=m5#{SW_TAG}"
    formatted_time = datetime.datetime.now().strftime("%A, %d %b %Y, %H:%M")
    return config_prefix, formatted_time


# Function to generate Sing-box config
def toSingBox(tag, clean_ip, detour):
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
                "address": [
                    "172.16.0.2/32",
                    "2606:4700:110:8836:f1c9:4393:9b37:3814/128",
                ],
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
    template_path = os.path.join(edge_directory, "assets", "singbox-template.json")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template file not found at {template_path}")
    with open(template_path, "r") as f:
        data = json.load(f)

    data["outbounds"][0]["outbounds"].extend([IR_TAG, SW_TAG])
    data["outbounds"][1]["outbounds"].extend([IR_TAG, SW_TAG])

    tehran_wg = toSingBox(IR_TAG, t_ips[0], "direct")
    if tehran_wg:
        data["endpoints"].append(tehran_wg)
    else:
        logging.error(f"Failed to generate {IR_TAG} configuration.")

    Somewhere_wg = toSingBox(SW_TAG, t_ips[1], IR_TAG)
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

        if os.path.exists(edge_bestip_path):
            logging.info("Bestip.txt file already exists.")
        else:
            create_ips()

        arch = arch_suffix()
        logging.info("Fetching warp program...")
        url = f"https://gitlab.com/Misaka-blog/warp-script/-/raw/main/files/warp-yxip/warp-linux-{arch}"

        warp_executable = os.path.join(edge_directory, "warp")

        logging.info(f"Downloading warp executable from {url}")
        subprocess.run(["wget", "-O", warp_executable, url], check=True)
        os.chmod(warp_executable, 0o755)

        if os.path.exists(edge_result_path):
            os.remove(edge_result_path)
            logging.info("Removed existing Endpoints.csv to force a new scan.")

        logging.info("Scanning IPs...")
        result = subprocess.run(
            [warp_executable], check=True, capture_output=True, text=True
        )
        logging.info("Warp executed successfully.")
        logging.info(f"Warp output: {result.stdout}")

        if not os.path.exists(edge_result_path):
            raise FileNotFoundError(
                "Endpoints.csv was not generated by warp executable."
            )

        Bestip = []
        with open(edge_result_path, "r") as csv_file:
            next(csv_file)
            for line in csv_file:
                Bestip.append(line.split(",")[0])
                if len(Bestip) == 2:
                    break
        if len(Bestip) < 2:
            raise ValueError("Less than 2 clean IPs found in Endpoints.csv.")

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
    finally:
        for temp_file in [edge_bestip_path, warp_executable]:
            if os.path.exists(temp_file):
                os.remove(temp_file)


if __name__ == "__main__":
    main()
