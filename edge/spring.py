import ipaddress
import platform
import subprocess
import os
import datetime
import base64
import json
import shutil

TEHRAN_SYMBOL = "\u26AA\uFE0F"  # IOS white circle 
BERLIN_SYMBOL = "\U0001F7E1"    #    yellow circle

TEHRAN_TAG = f"{TEHRAN_SYMBOL}Tehran"
BERLIN_TAG = f"{BERLIN_SYMBOL}Berlin"


warp_cidr = [
    "162.159.192.0/24",
    "162.159.193.0/24",
    "162.159.195.0/24",
    "162.159.204.0/24",
    "188.114.96.0/24",
    "188.114.97.0/24",
    "188.114.98.0/24",
    "188.114.99.0/24",
]

# Define main paths
script_directory = os.path.dirname(__file__)
main_directory = os.path.dirname(script_directory)
edge_directory = os.path.join(main_directory, "edge")

# Define file paths
edge_bestip_path = os.path.join(edge_directory, "Bestip.txt")
edge_result_path = os.path.join(edge_directory, "Endpoints.csv")
main_result_path = os.path.join(main_directory, "Endpoints.csv")
main_singbox_path = os.path.join(main_directory, "sing-box.json")
main_warp_path = os.path.join(main_directory, "warp.json")

# Create a list of cloudflare wireguard endpoints
def create_ips():
    c = 0
    top_ips = sum(len(list(ipaddress.IPv4Network(cidr))) for cidr in warp_cidr)

    with open(edge_bestip_path, "w") as file:
        for cidr in warp_cidr:
            ip_addresses = list(ipaddress.IPv4Network(cidr))
            for addr in ip_addresses:
                c += 1
                file.write(str(addr))
                if c != top_ips:
                    file.write("\n")

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
        raise ValueError("Unsupported CPU architecture")

# warp ON warp wireguard configurations, Exclusively for hidfify clients
def export_Hiddify(t_ips):
    config_prefix = (
        f"warp://{t_ips[0]}?ifp=1-3&ifpm=m4#{TEHRAN_TAG}&&detour=warp://{t_ips[1]}?ifp=1-2&ifpm=m5#{BERLIN_TAG}"
    )
    formatted_time = datetime.datetime.now().strftime("%A, %d %b %Y, %H:%M")
    return config_prefix, formatted_time

# warp ON warp wireguard configurations, Only for official sinbox clients
def toSingBox(tag, clean_ip, detour):
    print(f"Generating Warp Conf for {tag}")
    command = 'wget -N "https://gitlab.com/fscarmen/warp/-/raw/main/api.sh" && sudo bash api.sh -r'
    prc = subprocess.run(command, capture_output=True, text=True, shell=True)
    output = prc.stdout

    if (prc.returncode == 0) and output:
        try:
            data = json.loads(output)
            wg = {
                "tag": f"{tag}",
                "type": "wireguard",
                "server": f"{clean_ip.split(':')[0]}",
                "server_port": int(clean_ip.split(":")[1]),
                "local_address": [
                    "172.16.0.2/32",
                    "2606:4700:110:8735:bb29:91bc:1c82:aa73/128",
                ],
                "private_key": f"{data['private_key']}",
                "peer_public_key": "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
                "mtu": 1300,
                "reserved": data["config"]["reserved"],
                "detour": f"{detour}",
                "workers": 2,
            }

            if os.path.exists("api.sh"):
                os.remove("api.sh")
                print("Removed api.sh")

            return wg
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error processing JSON data: {e}")
            return None
    else:
        print("Error: Command execution failed or produced no output")
        return None

def export_SingBox(t_ips):
    template_path = os.path.join(edge_directory, "assets", "singbox-template.json")
    with open(template_path, "r") as f:
        data = json.load(f)

    data["outbounds"][1]["outbounds"].extend([TEHRAN_TAG, BERLIN_TAG])

    tehran_wg = toSingBox(TEHRAN_TAG, t_ips[0], "direct")
    if tehran_wg:
        data["outbounds"].insert(2, tehran_wg)
    else:
        print("Failed to generate {TEHRAN_TAG} configuration")

    berlin_wg = toSingBox(BERLIN_TAG, t_ips[1], TEHRAN_TAG)
    if berlin_wg:
        data["outbounds"].insert(3, berlin_wg)
    else:
        print("Failed to generate {BERLIN_TAG} configuration")

    with open(main_singbox_path, "w") as f:
        json.dump(data, f, indent=4)

def main():
    try:
        if not os.path.exists(edge_directory):
            os.makedirs(edge_directory)

        if os.path.exists(edge_bestip_path):
            print("Bestip.txt exists.")
        else:
            print("Creating Bestip.txt File.")
            create_ips()
            print("Bestip.txt File Created Successfully!")

        # Running warp for scan clean ips 
        arch = arch_suffix()
        print("Fetching warp program...")
        url = f"https://gitlab.com/Misaka-blog/warp-script/-/raw/main/files/warp-yxip/warp-linux-{arch}"
        
        warp_executable = os.path.join(edge_directory, "warp")
        subprocess.run(["wget", url, "-O", warp_executable], check=True)
        os.chmod(warp_executable, 0o755)
        
        print("Scanning IPs...")
        subprocess.run(
            [warp_executable],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        print("Warp executed successfully.")

        if os.path.exists(edge_result_path):
            shutil.copy2(edge_result_path, main_result_path)
            
        Bestip = []
        with open(edge_result_path, "r") as csv_file:
            next(csv_file)
            c = 0
            for line in csv_file:
                Bestip.append(line.split(",")[0])
                c += 1
                if c == 2:
                    break

        formatted_time = datetime.datetime.now().strftime("%a, %H:%M:%S")
        config_prefix, _ = export_Hiddify(Bestip)

        # Hiddify profile shits
        title = "//profile-title: base64:" + base64.b64encode("Freedom to Dream 💛✨".encode("utf-8")).decode("utf-8") + "\n"
        update_interval = "//profile-update-interval: 4\n"
        sub_info = "//subscription-userinfo: upload=805306368000; download=2576980377600; total=6012954214400; expire=1762677732\n"
        profile_web = "//profile-web-page-url: https://github.com/NiREvil\n"
        last_modified = "//last update on: " + formatted_time + "\n"

        with open(main_warp_path, "w") as op:
            op.write(title + update_interval + sub_info + profile_web + last_modified + config_prefix)

        export_SingBox(Bestip)

    except subprocess.CalledProcessError as e:
        print(f"Error executing command: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
    finally:
        # Cleanup
        if os.path.exists(edge_bestip_path):
            os.remove(edge_bestip_path)
        if os.path.exists(warp_executable):
            os.remove(warp_executable)

if __name__ == "__main__":
    main()
