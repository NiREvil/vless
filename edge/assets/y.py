import ipaddress
import platform
import subprocess
import os
import datetime

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

script_directory = os.path.dirname(__file__)
ip_txt_path = os.path.join(script_directory, "ip.txt")
result_path = os.path.join(script_directory, "result.csv")


def create_ips():
    c = 0
    total_ips = sum(len(list(ipaddress.IPv4Network(cidr))) for cidr in warp_cidr)

    with open(ip_txt_path, "w") as file:
        for cidr in warp_cidr:
            ip_addresses = list(ipaddress.IPv4Network(cidr))
            for addr in ip_addresses:
                c += 1
                file.write(str(addr))
                if c != total_ips:
                    file.write("\n")


if os.path.exists(ip_txt_path):
    print("ip.txt exist.")
else:
    print("Creating ip.txt File.")
    create_ips()
    print("ip.txt File Created Successfully!")


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


arch = arch_suffix()

print("Fetch warp program...")
url = f"https://gitlab.com/Misaka-blog/warp-script/-/raw/main/files/warp-yxip/warp-linux-{arch}"

subprocess.run(["wget", url, "-O", "warp"])
os.chmod("warp", 0o755)
command = "./warp >/dev/null 2>&1"
print("Scanning ips...")
process = subprocess.Popen(command, shell=True)

process.wait()

if process.returncode != 0:
    print("Error: Warp execution failed.")
else:
    print("Warp executed successfully.")


def warp_ip():
    counter = 0
    config_prefixes = ""
    creation_time = os.path.getctime(result_path)
    formatted_time = datetime.datetime.fromtimestamp(creation_time).strftime(
        "%Y-%m-%d %H:%M:%S"
    )
    with open(result_path, "r") as csv_file:
        next(csv_file)
        for ips in csv_file:
            counter += 1
            if counter == 5:
                break
            else:
                ip = ips.split(",")[0]
                config_prefix = (
                    f"warp://{ip}/?ifp=40-80&ifps=50-100&ifpd=2-4&ifpm=m4#🇮🇷𓄂𓆃\n"
                )
                config_prefixes += config_prefix
    return config_prefixes, formatted_time


configs = warp_ip()[0]
with open("warpauto.json", "w") as op:
    op.write(configs)

os.remove(ip_txt_path)
os.remove(result_path)
os.remove("warp")
