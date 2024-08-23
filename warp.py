import ipaddress
import platform
import subprocess
import os
import datetime
import base64
import json

warp_cidr = [
    '162.159.192.0/24',
    '162.159.193.0/24',
    '162.159.195.0/24',
    '162.159.204.0/24',
    '188.114.96.0/24',
    '188.114.97.0/24',
    '188.114.98.0/24',
    '188.114.99.0/24'
]

script_directory = os.path.dirname(__file__)
Bestip_path = os.path.join(script_directory, 'Bestip.txt')
result_path = os.path.join(script_directory, 'result.csv')

def export_bestIPS(path):
    Bestip = []

    with open(path, 'r') as csv_file:
        next(csv_file)
        c = 0
        for line in csv_file:
            Bestip.append(line.split(',')[0])
            c += 1
            if c == 2:
                break

    with open('Bestip.txt', 'w') as f:
        for ip in Bestip:
            f.write(f"{ip}\n")

    return Bestip


def export_Hiddify(t_ips, f_ips):
    creation_time = os.path.getctime(f_ips)
    formatted_time = datetime.datetime.fromtimestamp(creation_time).strftime("%Y-%m-%d %H:%M:%S")
    config_prefix = f'warp://{t_ips[0]}?ifp=10-20&ifps=20-60&ifpd=5-10#Warp-IR&&detour=warp://{t_ips[1]}?ifp=10-20&ifps=20-60&ifpd=5-10#Warp-ON-Warp'

    title = "//profile-title: base64:" + base64.b64encode('Women Life Freedom 🤍'.encode('utf-8')).decode(
        'utf-8') + "\n"
    update_interval = "//profile-update-interval: 1\n"
    sub_info = "//subscription-userinfo: upload=0; download=0; total=10737418240000000; expire=2546249531\n"
    profile_web = "//profile-web-page-url: https://github.com/NiREvil\n"
    last_modified = "//last update on: " + formatted_time + "\n"

    with open('warp.json', 'w') as op:
        op.write(title + update_interval + sub_info + profile_web + last_modified + config_prefix)


def toSingBox(tag, clean_ip, detour):
    print("Generating Warp Conf")
    config_url = "https://api.zeroteam.top/warp?format=warp-go"
    conf_name = 'warp.conf'
    subprocess.run(["wget", config_url, "-O", f"{conf_name}"])
    cmd = ["./warp-go", f"--config={conf_name}", "--export-singbox=proxy.json"]
    process = subprocess.run(cmd, capture_output=True, text=True)
    output = process.stdout

    if (process.returncode == 0) and output:
        with open('proxy.json', 'r') as f:
            data = json.load(f)
            wg = data["outbounds"][0]
            wg['server'] = clean_ip.split(':')[0]
            wg['server_port'] = int(clean_ip.split(':')[1])
            wg['mtu'] = 1300
            wg['workers'] = 2
            wg['detour'] = detour
            wg['tag'] = tag
        return wg
    else:
        return None


def export_SingBox(t_ips, arch):
    with open('edge/assets/singbox-template.json', 'r') as f:
        data = json.load(f)

    warp_go_url = f"https://gitlab.com/Misaka-blog/warp-script/-/raw/main/files/warp-go/warp-go-latest-linux-{arch}"
    subprocess.run(["wget", warp_go_url, "-O", "warp-go"])
    os.chmod("warp-go", 0o755)

    main_wg = toSingBox('WARP-MAIN', t_ips[0], "direct")
    data["outbounds"].insert(1, main_wg)
    wow_wg = toSingBox('WARP-WOW', t_ips[1], "WARP-MAIN")
    data["outbounds"].insert(2, wow_wg)

    with open('sing-box.json', 'w') as f:
        f.write(json.dumps(data, indent=4))

    os.remove("warp.conf")
    os.remove("proxy.json")
    os.remove("warp-go")


def main(script_dir):
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

    result_path = os.path.join(script_dir, 'result.csv')
    top_ips = export_bestIPS(result_path)
    export_Hiddify(t_ips=top_ips, f_ips=result_path)
    export_SingBox(t_ips=top_ips, arch=arch)

    os.remove("warp")
    os.remove(result_path)


if __name__ == '__main__':
    script_directory = os.path.dirname(__file__)
    main(script_directory)
