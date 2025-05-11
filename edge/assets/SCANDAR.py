# ---- Only for using formatter/Linter ----
# ---- WarpScanner source: https://github.com/arshiacomplus ----

try:
    from tkinter import ttk, messagebox
    from tkinter import *
    from concurrent.futures import ThreadPoolExecutor, wait
    from PIL import Image, ImageTk
    from urllib.parse import quote
    from requests.exceptions import RequestException
    from typing import List, Dict, Any, Optional
    from dataclasses import dataclass, field
    from json import JSONEncoder
    from retrying import retry
    from requests.exceptions import ConnectionError
    from icmplib import ping as pinging
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey
    from numbers import Number
    from webbrowser import open_new
    import tkinter as tk
    import os
    import sys
    import base64
    import urllib.request
    import urllib.parse
    import winreg as reg
    import requests
    import pyperclip
    import logging
    import re
    import gc
    import threading
    import time
    import random
    import json
    import datetime
    import customtkinter as ctk
    import subprocess
    import yaml
    import psutil
except Exception as E:
    messagebox.showerror("Error", f"An error has occurred!: \n {E}")
logging.basicConfig(
    filename="xray/error_log.txt",
    level=logging.ERROR,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


def log_exception(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        sys.__excepthook__(exc_type, exc_value, exc_traceback)
        return
    logging.error("Uncaught exception", exc_info=(exc_type, exc_value, exc_traceback))


sys.excepthook = log_exception
CONF_PATH = "settings.json"
DEFAULT_CONFIG = {
    "core": {
        "test_url": "https://www.gstatic.com/generate_204",
        "log_level": "warning",
        "domain_strategy": "IPIFNonMatch",
        "allow_insecure_tls": False,
        "sniffing_enabled": True,
        "inbound_ports": {"socks": 10808, "http": 10809},
        "dns": {
            "enabled": True,
            "fake_dns_enabled": True,
            "local_port": 10853,
            "remote_server": "https://8.8.8.8/dns-query",
            "domestic_server": "1.1.1.2",
        },
        "routing_rules": {"proxy": "", "direct": "", "block": ""},
        "fragment": {
            "enabled": True,
            "packets": "tlshello",
            "length": "10-30",
            "interval": "1-5",
        },
        "fake_host": {"enabled": False, "domain": "cloudflare.com"},
        "mux": {"enabled": False, "concurrency": 8},
    },
    "warp_on_warp": {"enabled": False, "config_url": ""},
    "internal_settings": {"per_app_proxy_enabled": False},
    "theme": {"type": "system"},
}


def load_app_config():
    if not os.path.exists(CONF_PATH):
        with open(CONF_PATH, "w") as f:
            json.dump(DEFAULT_CONFIG, f, indent=2)
        return DEFAULT_CONFIG
    try:
        with open(CONF_PATH, "r") as f:
            config = json.load(f)
            return config
    except (json.JSONDecodeError, IOError):
        print(f"Error loading {CONF_PATH}, using default.")
        return DEFAULT_CONFIG


app_config = load_app_config()
test_link_ = app_config.get("core", {}).get(
    "test_url", "https://www.gstatic.com/generate_204"
)
if not os.path.exists("warp_setting"):
    lio = []
    with open("warp_setting", "w") as f:
        f.writelines(
            [
                "1\n",
                "2\n",
                "2\n",
                "1\n",
                "1\n",
                "2\n",
                "5\n",
                "300\n",
                "1\n",
                "1\n",
                "1\n",
                "2\n",
                "2\n",
                "2\n",
                "off\n",
                " \n",
            ]
        )
if not os.path.exists("xray/sub_files_name"):
    with open("xray/sub_files_name", "w") as f:
        f.write("user_confs\nuser_custom_confs\n")
them = app_config.get("ui_preferences", {}).get("theme", "system")
ctk.set_appearance_mode(them)
gc.enable()
is_close_ping = False
wire_config_temp = ""
wire_c = 0
wire_p = 0
send_msg_wait = 0
results = []
sorted_results = []
save_result = []
save_result1 = []
best_result = []
temp_conf = []
WoW_v2 = ""
isIran = ""
check = "none"
temp_green_txtb = ""
temp_gray_txtb = ""
confss = ""
sub_org = ""
pidproc = []
hyproc = []
stoped_loop = False
wch_sel = 0
count = 0
on_is_green = False
is_editing = False
last_list = ""
frams_in_show = []
frams_in_ping = []
on_top_vpn = None
t_f_count = 0
is_less = []
fram_in_flag = []
image_cache = {}
is_hy2 = False
max_workers_number = 0
Cpu_speed = ""
if warp[0] == "1":
    Cpu_speed = "2"
else:
    Cpu_speed = "1"
best_ip = 0
do_you_save = ""
best_result_avg = ""
i_ip_scan = False
is_sub = False
is_v2ray = False
ty = False
ty2 = False
check = ""
concted = False
ping_range_see = int(warp[7])
conf_simple_full_list = []
items_currently_displayed_count = 0
ITEMS_PER_LOAD = 20
MAX_ITEMS_TO_DISPLAY_AT_ONCE = 100
loading_in_progress_flag = False
header = {"outbounds": []}
header2 = {"outbounds": []}
header_temp = {"outbounds": []}
temp_sing_old = {
    "outbounds": [
        {
            "type": "wireguard",
            "tag": "",
            "local_address": ["172.16.0.2/32", ""],
            "private_key": "0",
            "peer_public_key": "0",
            "server": "0",
            "server_port": 0,
            "reserved": 0,
            "mtu": 1280,
        },
        {
            "type": "wireguard",
            "tag": "",
            "detour": "",
            "local_address": ["172.16.0.2/32", "0"],
            "private_key": "0",
            "server": "0",
            "server_port": 0,
            "peer_public_key": "0",
            "reserved": 0,
            "mtu": 1330,
        },
    ]
}
temp_sing_new = {
    "outbounds": [
        {
            "type": "wireguard",
            "tag": "",
            "local_address": ["172.16.0.2/32", ""],
            "private_key": "0",
            "peer_public_key": "0",
            "server": "0",
            "server_port": 0,
            "reserved": 0,
            "mtu": 1280,
            "fake_packets": "1-3",
            "fake_packets_size": "10-30",
            "fake_packets_delay": "10-30",
            "fake_packets_mode": "m4",
        },
        {
            "type": "wireguard",
            "tag": "",
            "detour": "",
            "local_address": ["172.16.0.2/32", "0"],
            "private_key": "0",
            "server": "0",
            "server_port": 0,
            "peer_public_key": "0",
            "reserved": 0,
            "mtu": 1330,
            "fake_packets_mode": "m4",
        },
    ]
}


class ProcessManager:
    def __init__(self):
        self.active_processes = {}
        self.lock = threading.Lock()

    def add_process(self, name, pid):
        with self.lock:
            self.active_processes[name] = pid

    def stop_process(self, name):
        with self.lock:
            if name in self.active_processes:
                pid = self.active_processes[name]
                try:
                    if psutil.pid_exists(pid):
                        subprocess.call(
                            ["taskkill", "/F", "/PID", str(pid)],
                            creationflags=subprocess.CREATE_NO_WINDOW,
                        )
                except (ProcessLookupError, psutil.NoSuchProcess):
                    pass
                del self.active_processes[name]


process_manager = ProcessManager()
try:
    os.makedirs("imgs")
except Exception:
    pass


def hand2(event):
    event.widget.configure(cursor="hand2")


def focus(entry):
    entry.focus()


def check_ipv6() -> List[str]:
    results = {"ipv4": "Unavailable", "ipv6": "Unavailable"}
    timeout = 10
    urls = {
        "ipv4": "http://v4.ipv6-test.com/api/myip.php",
        "ipv6": "http://v6.ipv6-test.com/api/myip.php",
    }
    with requests.Session() as session:
        for version in urls:
            try:
                response = session.get(urls[version], timeout=timeout)
                response.raise_for_status()
                results[version] = "Available"
            except (requests.RequestException, requests.Timeout):
                pass
    return [results["ipv4"], results["ipv6"]]


def get_ip_details(ip_address):
    try:
        response = requests.get(f"http://ip-api.com/json/{ip_address}", timeout=10)
        return response.json().get("countryCode", "None")
    except Exception:
        return "None"


def fetch_ip(url):
    try:
        return requests.get(url, timeout=15).text.strip()
    except Exception:
        return "Unavailable"


def what_ip():
    ipv4, ipv6 = (
        fetch_ip("http://v4.ipv6-test.com/api/myip.php"),
        fetch_ip("http://v6.ipv6-test.com/api/myip.php"),
    )
    c_ipv4, c_ipv6 = (
        get_ip_details(ip) if ip != "Unavailable" else "Unavailable"
        for ip in (ipv4, ipv6)
    )
    return [c_ipv4 if c_ipv4 != "None" else c_ipv6, c_ipv6]


def Check_for_update():
    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda x: isinstance(x, ConnectionError),
    )
    def fetch_version():
        urls = [
            "https://raw.githubusercontent.com/arshiacomplus/WarpScanner/main/windows/NewVersion.txt"
        ]
        for url in urls:
            try:
                return (
                    urllib.request.urlopen(url, timeout=1)
                    .read()
                    .decode("utf-8")
                    .strip()
                )
            except Exception:
                return requests.get(url, timeout=30).text.strip()
        return ""

    version = fetch_version()
    print(version)
    return [version != "v0.5.2", version]


def check_up():
    def go():
        ret = Check_for_update()
        if not ret[0]:
            return
        root = ctk.CTk()
        root.protocol("WM_TAKE_FOCUS")
        root.title("Update")
        root.geometry("500x250+200+100")
        ctk.CTkLabel(
            root, font=("Helvetica", 12, "bold"), text=f"New version Available {ret[1]}"
        ).pack(fill=tk.X)
        ctk.CTkButton(
            root,
            font=("Helvetica", 12, "bold"),
            text="Click to update",
            command=Github_link,
        ).pack(fill=tk.X, side=tk.BOTTOM)
        root.mainloop()

    def go_thread():
        threading.Thread(target=go, daemon=True).start()

    def Github_link():
        open_new(r"https://github.com/arshiacomplus/WarpScanner/releases")

    go_thread()


def start():
    def check_settings():
        if (
            not os.path.exists("warp_setting")
            or len(open("warp_setting").readlines()) != 16
        ):
            sp_label.configure(text="Creating WarpSetting ...")
            root_splash.update()
            with open("warp_setting", "w") as f:
                f.writelines(
                    [
                        "1\n",
                        "2\n",
                        "2\n",
                        "1\n",
                        "1\n",
                        "2\n",
                        "5\n",
                        "300\n",
                        "1\n",
                        "1\n",
                        "1\n",
                        "2\n",
                        "2\n",
                        "2\n",
                        "off\n",
                        " \n",
                    ]
                )
        try:
            with open("result.txt", "r") as f:
                pass
        except Exception:
            sp_label.configure(text="Creating result.txt ...")
            root_splash.update()
            with open("result.txt", "w") as f:
                f.write("")

    global check
    steps = [
        ("start ...", lambda: None),
        (None, lambda: None),
        ("checking setting...", check_settings),
        ("check for update ...", lambda: threading.Thread(target=check_up).start()),
    ]
    for i, (msg, action) in enumerate(steps):
        if msg:
            sp_label.configure(text=msg)
            root_splash.update()
        action()
        progress.set((i + 1) * 0.2)
        root_splash.update_idletasks()
        time.sleep(1)
    root_splash.destroy()


try:
    root_splash = tk.Tk()
    root_splash.title("splash")
    root_splash.resizable(False, False)
    root_splash.geometry("500x500+200+100")
    bg = ImageTk.PhotoImage(Image.open("imgs/splash.png"))
    background_label = tk.Label(root_splash, image=bg)
    background_label.place(relwidth=1, relheight=1)
    progress = ctk.CTkProgressBar(
        root_splash,
        orientation="horizontal",
        height=20,
        fg_color="pink",
        bg_color="white",
        mode="determinate",
    )
    progress.pack(ipadx=20, side=tk.BOTTOM, pady=20)
    sp_label = tk.Label(root_splash, text="0%", bg="white")
    sp_label.pack(side=tk.BOTTOM, pady=0)
    root_splash.after(1, start)
    root_splash.mainloop()
    with open("warp_setting", "r") as f:
        num33 = f.readlines()
    interval_see, count_see, timeout_see, ping_range_see = map(
        lambda x: int(x.strip()), num33[4:8]
    )
except Exception as E:
    messagebox.showerror("Error", f"An error has occurred!: \n {E}")


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
    key = list(key)  # Convert bytes to list for mutable operations
    key[0] &= 248
    key[31] &= 127
    key[31] |= 64
    return bytes(key)  # Convert list back to bytes


def register_key_on_CF(pub_key):
    time.sleep(5)
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
    try:
        r = requests.post(url, data=bodyString, headers=headers)
    except Exception as E:
        return E
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
            return (
                "2606:4700:110:846c:e510:bfa1:ea9f:5247/128",
                priv_string,
                reserved,
                "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
            )
        except Exception:
            print("Something went wronge with api")


def free_cloudflare_account():
    with open("warp_setting", "r") as f:
        num33 = f.readlines()
    if num33[3] == "1\n":
        keys = bind_keys()
        return keys

    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda x: isinstance(x, ConnectionError),
    )
    def file_o():
        try:
            response = (
                urllib.request.urlopen(
                    "https://api.zeroteam.top/warp?format=sing-box", timeout=30
                )
                .read()
                .decode("utf-8")
            )
            return response
        except Exception:
            response = requests.get(
                "https://api.zeroteam.top/warp?format=sing-box", timeout=30
            )
            return response.text

    output = file_o()
    Address_pattern = r'"2606:4700:[0-9a-f:]+/128"'
    private_key_pattern = r'"private_key":"[0-9a-zA-Z/+]+="'
    reserved_pattern = r'"reserved":[[0-9]+(,[0-9]+){2}]'
    Address_search = re.search(Address_pattern, output)
    private_key_search = re.search(private_key_pattern, output)
    reserved_search = re.search(reserved_pattern, output)
    Address_key = Address_search.group(0).replace('"', "") if Address_search else None
    private_key = (
        private_key_search.group(0).split(":")[1].replace('"', "")
        if private_key_search
        else None
    )
    reserved = (
        reserved_search.group(0).replace('"reserved":', "").replace('"', "")
        if reserved_search
        else None
    )
    all_key = [
        Address_key,
        private_key,
        reserved,
        "bmXOC+F1FxEMF9dyiK2H5/1SUtzH0JuVo51h2wPfgyo=",
    ]
    return all_key


def fetch_config_from_api():
    with open("warp_setting", "r") as f:
        num33 = f.readlines()
    if num33[3] == "1\n":
        print("heloo")
        keys = bind_keys()
        keys = list(keys)
        return {
            "PrivateKey": keys[1],
            "PublicKey": keys[3],
            "Reserved": keys[2],
            "Address": keys[0],
        }
    elif num33[3] == "1\n":
        pass

    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda x: isinstance(x, ConnectionError),
    )
    def file_o():
        try:
            response = (
                urllib.request.urlopen(
                    "https://api.zeroteam.top/warp?format=sing-box", timeout=30
                )
                .read()
                .decode("utf-8")
            )
            return response
        except Exception:
            response = requests.get(
                "https://api.zeroteam.top/warp?format=sing-box", timeout=30
            )
            return response.text

    response = file_o()
    data = json.loads(response)
    return {
        "PrivateKey": data.get("private_key"),
        "PublicKey": data.get("peer_public_key"),
        "Reserved": (
            ",".join([str(x) for x in data.get("reserved", [])])
            if data.get("reserved")
            else None
        ),
        "Address": data.get("local_address"),
    }


def urlencode(string):
    if string is None:
        return None
    return urllib.parse.quote(string, safe="a-zA-Z0-9.~_-")


def generate_wireguard_url(configure, endpoint):
    global api
    required_keys = ["PrivateKey", "PublicKey", "Address"]
    if not all(
        key in configure and configure[key] is not None for key in required_keys
    ):
        print(
            "Incomplete configuration. Missing one of the required keys or value is None."
        )
        return None
    with open("warp_setting", "r") as f:
        num33 = f.readlines()
    print(num33)
    if num33[3] == "2\n":
        encoded_addresses = [quote(address1) for address1 in (configure["Address"])]
        address = ",".join(encoded_addresses)
        if num33[9] == "2\n":
            wireguard_urll = (
                f"wireguard://{urlencode(configure['PrivateKey'])}@{endpoint}"
                f"?address=172.16.0.2/32,{address}&"
                f"publickey={urlencode(configure['PublicKey'])}"
            )
            if configure.get("Reserved"):
                wireguard_urll += f"&reserved={urlencode(configure['Reserved'])}"
        else:
            wireguard_urll = (
                "```configure\n"
                f"wireguard://{urlencode(configure['PrivateKey'])}@{endpoint}"
                f"?wnoise=quic&address=172.16.0.2/32,{address}&keepalive=10&wpayloadsize=1-8&"
                f"publickey={urlencode(configure['PublicKey'])}&wnoisedelay=1-3&wnoisecount=15&mtu=1330"
            )
            if configure.get("Reserved"):
                wireguard_urll += f"&reserved={urlencode(configure['Reserved'])}"
    else:
        listt = configure["Reserved"]
        lostt2 = ""
        for num in range(len(listt)):
            lostt2 += str(listt[num])
            if num != len(listt) - 1:
                lostt2 += ","
        configure["Reserved"] = urlencode(lostt2)
        if num33[9] == "2\n":
            wireguard_urll = (
                f"wireguard://{urlencode(configure['PrivateKey'])}@{endpoint}"
                f"?address=172.16.0.2/32,{configure['Address']}&"
                f"publickey={urlencode(configure['PublicKey'])}"
            )
            if configure.get("Reserved"):
                wireguard_urll += f"&reserved={configure['Reserved']}"
        else:
            wireguard_urll = (
                f"wireguard://{urlencode(configure['PrivateKey'])}@{endpoint}"
                f"?wnoise=quic&address=172.16.0.2/32,{configure['Address']}&keepalive=10&wpayloadsize=1-8&"
                f"publickey={urlencode(configure['PublicKey'])}&wnoisedelay=1-3&wnoisecount=15&mtu=1330"
            )
            if configure.get("Reserved"):
                wireguard_urll += f"&reserved={configure['Reserved']}"
    wireguard_urll += "#Tel= @arshiacomplus wire"
    return wireguard_urll


def which_Cpu_speed():
    global Cpu_speed


def mainactivity():
    def scan_ip_port(ip, port):
        global results
        icmp = pinging(
            ip,
            count=count_see,
            interval=interval_see,
            timeout=timeout_see,
            family="ipv4",
        )
        if icmp.is_alive:
            results.append(
                (
                    ip,
                    port,
                    float(icmp.avg_rtt),
                    float(icmp.packet_loss),
                    float(icmp.jitter),
                )
            )

    def remove_empty_strings(input_list):
        return [item for item in input_list if item and item != "\n"]

    def clear_widgets(parent: ctk.CTk):
        for widget in parent.winfo_children():
            widget.destroy()
            rootmainactivity.update_idletasks()

    def forget_widgets(parent: ctk.CTk):
        for widget in parent.winfo_children():
            widget.pack_forget()
        return

    def forget_widget_list(list: list):
        for i in list:
            i.pack_forget()

    def pack_widgets(
        widgets,
        padx=None,
        pady=None,
        ipady=None,
        ipadx=None,
        anchor="center",
        side=None,
        fill=None,
    ):
        for widget in widgets:
            try:
                widget.pack(
                    padx=padx,
                    pady=pady,
                    anchor=anchor,
                    side=side,
                    ipady=ipady,
                    ipadx=ipadx,
                    fill=fill,
                )
            except Exception:
                pass

    def change_list_f(list_w: list, value):
        list_w_index_f = list_w.index(value)
        temp = list_w[0]
        list_w[0] = str(list_w[list_w_index_f])
        if list_w[0] != temp:
            del list_w[list_w_index_f]
            list_w.append(temp)
        return list_w

    dis_cion = ctk.CTkImage(
        light_image=Image.open("imgs/disconc.png"),
        dark_image=Image.open("imgs/disconc.png"),
        size=(100, 100),
    )
    is_cion = ctk.CTkImage(
        light_image=Image.open("imgs/isconc.png"),
        dark_image=Image.open("imgs/isconc.png"),
        size=(100, 100),
    )

    def reset_v_of_file():
        global count
        with open("xray/" + selec_sub.get() + "temp", "r", encoding="utf-8") as f:
            if selec_sub.get() == "user_custom_confs":
                with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as ff:
                    bef_red = json.load(ff)
                sun_na = json.load(f)
                sun_na = sun_na[count:]
                sun_na = bef_red[:count][::-1] + sun_na
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as ff:
                    json.dump(sun_na, ff)
            else:
                with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as ff:
                    bef_red = ff.readlines()
                sun_na = f.readlines()
                sun_na = sun_na[count:]
                sun_na = bef_red[:count][::-1] + sun_na
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as ff:
                    ff.writelines(sun_na)
        os.remove("xray/" + selec_sub.get() + "temp")

    def parse_configs(
        conifg, num=0, cv=1, hy2_path="hy2/config.yaml"
    ):  # nuitka: pragma: no cover
        global is_editing, is_hy2
        if not is_editing and (isinstance(conifg, dict) or "{" in conifg):
            with open("xray/user_custom_confs", "r") as f:
                cconf = json.load(f)
                len_cconf = len(cconf)
            if not isinstance(conifg, dict):
                conifg = json.loads(conifg)
            cconf = [conifg] + cconf
            with open("xray/user_custom_confs", "w") as f:
                json.dump(cconf, f)
            show_confs("test", is_new=True, len_f=len_cconf, is_dict=True)
            return
        elif is_editing and (isinstance(conifg, dict) or "{" in conifg):
            if not isinstance(conifg, dict):
                conifg = json.loads(conifg)

            def save_c(conf, num: int):
                global is_editing, frams_in_show, count, fram_in_flag, count
                is_editing = False
                print(num)
                print("iedited")
                rootmainactivity.grab_set()
                conf = text_box.get("1.0", tk.END).strip()
                tabview.set("configs")
                clear_widgets(tabview.tab("edit"))
                tabview.delete("edit")
                with open("xray/user_custom_confs", "r") as f:
                    lust = json.load(f)
                lust[num] = json.loads(conf)
                lable = frams_in_show[num]
                lable.configure(state=tk.NORMAL)
                lable.delete(1.0, tk.END)
                remarks = lust[num]["remarks"].strip()
                lable.insert(1.0, remarks)
                lable.configure(state=tk.DISABLED)
                lusttemp = lust[:count][::-1]
                lust = lusttemp + lust[count:]
                with open("xray/user_custom_confs", "w") as f:
                    json.dump(lust, f)
                try:
                    os.remove("xray/user_custom_confstemp")
                except Exception:
                    pass
                try:
                    flag_icon = ctk.CTkImage(
                        light_image=Image.open(f"imgs/{remarks.split('>>')[1]}.png"),
                        dark_image=Image.open(f"imgs/{remarks.split('>>')[1]}.png"),
                        size=(10, 10),
                    )
                    fram_in_flag[num].configure(image=flag_icon)
                except Exception:
                    try:
                        fram_in_flag[num].configure(image=None)
                    except Exception:
                        pass
                # reset_v_of_file()
                return

            def restart_c(conf, num):
                text_box.delete(1.0, tk.END)
                text_box.insert(1.0, json.dumps(conifg, indent=4))

            def exit_out():
                global is_editing
                is_editing = False
                reset_v_of_file()
                rootmainactivity.grab_set()
                tabview.set("configs")
                clear_widgets(tabview.tab("edit"))
                tabview.delete("edit")

            tabview.add("edit")
            tabview.set("edit")
            tabview.tab("edit").grab_set()
            fram_top = ctk.CTkFrame(
                tabview.tab("edit"), height=50, border_width=1, border_color="#868686"
            )
            fram_top.pack(fill=tk.X)
            back_arrow = ctk.CTkImage(
                light_image=Image.open("imgs/arrow.png"),
                dark_image=Image.open("imgs/arrow_light.png"),
                size=(25, 25),
            )
            go_out_button = ctk.CTkButton(
                fram_top,
                command=exit_out,
                fg_color="transparent",
                hover_color="#DF9C27",
                width=25,
                image=back_arrow,
                text="",
            )
            go_out_button.pack(padx=(0, 10), pady=5, side=tk.RIGHT)
            save_button = ctk.CTkButton(
                fram_top,
                fg_color="transparent",
                command=lambda conifg=conifg, num=num: save_c(conifg, num),
                hover_color="#DF9C27",
                width=25,
                image=ip_cion,
                text="",
            )
            save_button.pack(padx=(5, 10), pady=5, side=tk.LEFT)
            restart_button = ctk.CTkButton(
                fram_top,
                fg_color="transparent",
                command=lambda conifg=conifg, num=num: restart_c(conifg, num),
                hover_color="#DF9C27",
                width=25,
                image=update_icon,
                text="",
            )
            restart_button.pack(padx=(0, 0), pady=5, side=tk.LEFT)
            fram_in = ctk.CTkFrame(tabview.tab("edit"), height=500, width=500)
            fram_in.pack(fill=tk.BOTH, pady=(5, 5))
            text_box = ctk.CTkTextbox(fram_in, width=500, height=500)
            text_box.pack(fill=tk.BOTH)
            text_box.insert(1.0, json.dumps(conifg, indent=4))
            return
        else:
            pass

        @dataclass
        class ConfigParams:
            protocol: str
            address: str
            port: int
            security: Optional[str] = ""
            encryption: Optional[str] = "none"
            header_type: Optional[str] = "none"
            network: Optional[str] = "tcp"
            flow: Optional[str] = ""
            sni: Optional[str] = ""
            fp: Optional[str] = ""
            alpn: Optional[str] = None
            pbk: Optional[str] = ""
            sid: Optional[str] = ""
            spx: Optional[str] = ""
            tag: Optional[str] = ""
            id: Optional[str] = ""
            type: Optional[str] = "tcp"
            alter_id: Optional[str] = ""
            mode: Optional[str] = None
            host: Optional[str] = None
            path: Optional[str] = None
            scy: Optional[str] = ""
            socks_user: Optional[str] = ""
            ss_method: Optional[str] = "chacha20-poly1305"
            ss_password: Optional[str] = ""
            hy2_insecure: Optional[str] = "0"
            hy2_obfs_password: Optional[str] = ""
            hy2_hop_interval: Optional[str] = "30"
            hy2_pinsha256: Optional[str] = ""
            hy2_obfs: Optional[str] = ""
            wg_reserved: Optional[str] = ""
            wg_public_key: Optional[str] = ""
            wg_endpoint: Optional[str] = ""
            wg_secret_key: Optional[str] = ""
            wg_keep_alive: Optional[int] = 10
            wg_mtu: Optional[int] = 0
            wg_address: Optional[str] = ""
            wnoise: Optional[str] = "quic"
            wnoisecount: Optional[str] = "15"
            wnoisedelay: Optional[str] = "1-3"
            wpayloadsize: Optional[str] = "1-8"
            extra_params: Dict[str, Any] = field(default_factory=dict)

        def parse_configs_by_get(config: str) -> ConfigParams:
            """Parse all possible parameters from config strings"""
            try:
                config = config.strip()
                config_parts = config.split("#", 1)
                main_config = config_parts[0]
                print(config_parts)
                tag = config_parts[1] if len(config_parts) > 1 else ""
                protocol = next(
                    (
                        p
                        for p in [
                            "vless",
                            "vmess",
                            "trojan",
                            "hy2",
                            "hysteria2",
                            "ss",
                            "socks",
                            "wireguard",
                        ]
                        if main_config.startswith(p)
                    ),
                    None,
                )
                if not protocol:
                    raise ValueError("Invalid protocol")
                common_params = {"protocol": protocol, "tag": tag}
                if protocol in ["vless", "trojan"]:
                    match = re.search(r"([^:]+)@([^:]+):(\d+)", main_config)
                    if match:
                        common_params.update(
                            {
                                "id": (
                                    match.group(1).replace("//", "")
                                    if protocol != "trojan"
                                    else ""
                                ),
                                "address": match.group(2),
                                "port": int(match.group(3)),
                            }
                        )
                elif protocol == "wireguard":
                    match = re.search(r"([^@]+)@([^:]+):(\d+)", main_config)
                    if match:
                        common_params.update(
                            {
                                "wg_secret_key": match.group(1).split("wireguard://")[
                                    1
                                ],
                                "address": match.group(2),
                                "port": int(match.group(3)),
                            }
                        )
                else:
                    match = re.search(r"@([^:]+):(\d+)", main_config)
                    if match:
                        common_params.update(
                            {"address": match.group(1), "port": int(match.group(2))}
                        )
                protocol_handlers = {
                    "vless": parse_vless,
                    "vmess": parse_vmess,
                    "trojan": parse_trojan,
                    "hy2": parse_hysteria,
                    "hysteria2": parse_hysteria,
                    "ss": parse_shadowsocks,
                    "socks": parse_socks,
                    "wireguard": parse_wireguard,
                }
                parser = protocol_handlers.get(protocol)
                if not parser:
                    raise NotImplementedError(f"Unsupported protocol: {protocol}")
                return parser(main_config, common_params)
            except Exception as e:
                logging.error(f"Error parsing config: {e}")
                return ConfigParams(protocol="", address="", port=0)

        def parse_vless(config: str, common: dict) -> ConfigParams:
            query = re.split(r"\?", config, 1)[1] if "?" in config else ""
            params = parse_query_params(query)
            host_params = {
                "tcp": params.get("host", None),
                "ws": params.get("host", None),
                "h2": params.get("host", None),
                "httpupgrade": params.get("host", None),
                "xhttp": params.get("host", None),
                "splithttp": params.get("host", None),
                "quic": params.get("quicSecurity", None),
                "grpc": params.get("authority", None),
            }
            path_params = {
                "ws": params.get("path", None),
                "h2": params.get("path", None),
                "httpupgrade": params.get("path", None),
                "splithttp": params.get("path", None),
                "xhttp": params.get("path", None),
                "kcp": params.get("seed", None),
                "grpc": params.get("serviceName", None),
                "quic": params.get("key", None),
            }
            return ConfigParams(
                **common,
                security=params.get("security", ""),
                encryption=params.get("encryption", "none"),
                type=params.get("type", "tcp"),
                host=host_params.get(params.get("type", "tcp"), None),
                path=path_params.get(params.get("type", "tcp"), None),
                flow=params.get("flow", ""),
                sni=params.get("sni", ""),
                fp=params.get("fp", ""),
                alpn=params.get("alpn", None),
                pbk=params.get("pbk", ""),
                sid=params.get("sid", ""),
                spx=params.get("spx", ""),
                mode=params.get("mode", None),
            )

        def parse_vmess(config: str, common: dict) -> ConfigParams:
            encoded_part = config.split("://")[1]
            missing_padding = len(encoded_part) % 4
            if missing_padding:
                encoded_part += "=" * (4 - missing_padding)
            decoded = base64.b64decode(encoded_part).decode("utf-8")
            vmess_data = json.loads(decoded)
            address = vmess_data.get("add", "")
            port = int(vmess_data.get("port", 0))
            tag = vmess_data.get("ps", "none")
            sec = vmess_data.get("tls", "")
            return ConfigParams(
                protocol=common.get("protocol", ""),
                address=address,
                port=port,
                tag=tag,
                security=sec,
                id=vmess_data.get("id", ""),
                alter_id=int(vmess_data.get("aid", 0)),
                scy=vmess_data.get("scy", ""),
                sni=vmess_data.get("sni", ""),
                fp=vmess_data.get("fp", ""),
                type=vmess_data.get("net", "tcp"),
                host=vmess_data.get("host", None),
                path=vmess_data.get("path", None),
                alpn=vmess_data.get("alpn", None),
                mode=vmess_data.get("mode", None),
            )

        def parse_trojan(config: str, common: dict) -> ConfigParams:
            query = re.split(r"\?", config, 1)[1] if "?" in config else ""
            params = parse_query_params(query)
            password = (
                re.search(r"trojan://([^@]+)@", config).group(1)
                if "trojan://" in config
                else ""
            )
            host_params = {
                "tcp": params.get("host", None),
                "ws": params.get("host", None),
                "h2": params.get("host", None),
                "httpupgrade": params.get("host", None),
                "xhttp": params.get("host", None),
                "splithttp": params.get("host", None),
                "quic": params.get("quicSecurity", None),
                "grpc": params.get("authority", None),
            }
            path_params = {
                "ws": params.get("path", None),
                "h2": params.get("path", None),
                "httpupgrade": params.get("path", None),
                "splithttp": params.get("path", None),
                "xhttp": params.get("path", None),
                "kcp": params.get("seed", None),
                "grpc": params.get("serviceName", None),
                "quic": params.get("key", None),
            }
            return ConfigParams(
                **common,
                security="tls",
                ss_password=password,
                sni=params.get("sni", ""),
                fp=params.get("fp", ""),
                alpn=params.get("alpn", None),
                pbk=params.get("pbk", ""),
                sid=params.get("sid", ""),
                type=params.get("type", "tcp"),
                host=host_params.get(params.get("type", "tcp"), None),
                path=path_params.get(params.get("type", "tcp"), None),
                spx=params.get("spx", ""),
                mode=params.get("mode", None),
            )

        def parse_hysteria(config: str, common: dict) -> ConfigParams:
            query = re.split(r"\?", config, 1)[1] if "?" in config else ""
            params = parse_query_params(query)
            return ConfigParams(
                **common,
                security="tls",
                hy2_insecure=params.get("insecure", "0") == "1",
                hy2_obfs_password=params.get("obfs-password", ""),
                hy2_hop_interval=int(params.get("hopInterval", 30)),
                hy2_pinsha256=params.get("pinSHA256", ""),
                hy2_obfs=params.get("obfs", ""),
                sni=params.get("sni", ""),
                alpn=params.get("alpn", None),
            )

        def parse_socks(config: str, common: dict) -> ConfigParams:
            auth_part = config.split("://")[1].split("@")[0]
            user_pass = base64.b64decode(auth_part).decode("utf-8").split(":")
            return ConfigParams(
                **common,
                socks_user=user_pass[0],
                ss_password=user_pass[1],
                security="none",
            )

        def parse_wireguard(config: str, common: dict) -> ConfigParams:
            query = re.split(r"\?", config, 1)[1] if "?" in config else ""
            params = parse_query_params(query)
            return ConfigParams(
                **common,
                wg_reserved=params.get("reserved", ""),
                wg_public_key=params.get("publickey", ""),
                wg_endpoint=params.get("endpoint", ""),
                wg_keep_alive=int(params.get("keepalive", 5)),
                wg_mtu=int(params.get("mtu", 0)),
                wg_address=params.get("address", ""),
                wnoise=params.get("wnoise", "quic"),
                wnoisecount=params.get("wnoisecount", "15"),
                wnoisedelay=params.get("wnoisedelay", "1-3"),
                wpayloadsize=params.get("wpayloadsize", "1-8"),
            )

        def parse_shadowsocks(config: str, common: dict) -> ConfigParams:
            auth_part = config.split("://")[1].split("@")[0]
            method_pass = base64.b64decode(auth_part).decode("utf-8").split(":")
            return ConfigParams(
                **common,
                ss_method=method_pass[0],
                ss_password=method_pass[1],
                security="none",
            )

        def parse_query_params(query: str) -> Dict[str, str]:
            params = {}
            for pair in query.split("&"):
                if "=" in pair:
                    key, value = pair.split("=", 1)
                    params[key] = urllib.parse.unquote(value)
            return params

        conifg = urllib.parse.unquote(conifg)
        dict_conf = parse_configs_by_get(conifg)
        LOCAL_HOST = "127.0.0." + str(cv)
        DEFAULT_PORT = 443
        DEFAULT_SECURITY = "auto"
        DEFAULT_LEVEL = 8
        DEFAULT_NETWORK = "tcp"
        TLS = "tls"
        REALITY = "reality"
        HTTP = "http"
        try:
            with open(CONF_PATH, "r") as f:
                file = json.load(f)
            core = file["core"]
            warp_sets = file["warp_on_warp"]
            fragment_sets = core["fragment"]
            fake_host_sets = core["fake_host"]
            mux_sets = core["mux"]
            dns_sets = core["dns"]
            routing_sets = core["routing_rules"]
            inbound_ports = core["inbound_ports"]
            PACKETS = fragment_sets["packets"]
            LENGTH = fragment_sets["length"]
            INTERVAL = fragment_sets["interval"]
            FAKEHOST_ENABLE = fake_host_sets["enabled"]
            HOST1_DOMAIN = fake_host_sets["domain"]
            HOST2_DOMAIN = HOST1_DOMAIN
            MUX_ENABLE = mux_sets["enabled"]
            CONCURRENCY = mux_sets["concurrency"]
            FRAGMENT = fragment_sets["enabled"]
            IS_WARP_ON_WARP = warp_sets["enabled"]
            WARPONWARP = urllib.parse.unquote(warp_sets["config_url"])
            ENABLELOCALDNS = dns_sets["enabled"]
            ENABLEFAKEDNS = dns_sets["fake_dns_enabled"]
            LOCALDNSPORT = dns_sets["local_port"]
            ALLOWINCREASE = core["allow_insecure_tls"]
            DOMAINSTRATEGY = core["domain_strategy"]
            CUSTOMRULES_PROXY = routing_sets["proxy"].split(",")
            CUSTOMRULES_DIRECT = routing_sets["direct"].split(",")
            CUSTOMRULES_BLOCKED = routing_sets["block"].split(",")
            SOCKS5 = inbound_ports["socks"]
            HTTP5 = inbound_ports["http"]
            REMOTEDNS = dns_sets["remote_server"]
            DOMESTICDNS = dns_sets["domestic_server"]
            LOGLEVEL = core["log_level"]
            SNIFFING = core["sniffing_enabled"]
        except Exception as E:
            print(E)
        is_warp = False

        class V2rayConfig:
            def __init__(
                self,
                remarks: Optional[str] = None,
                stats: Optional[Any] = None,
                log: "LogBean" = None,
                policy: Optional["PolicyBean"] = None,
                inbounds: List["InboundBean"] = None,
                outbounds: List["OutboundBean"] = None,
                dns: "DnsBean" = None,
                routing: "RoutingBean" = None,
                api: Optional[Any] = None,
                transport: Optional[Any] = None,
                reverse: Optional[Any] = None,
                fakedns: Optional[Any] = None,
                browserForwarder: Optional[Any] = None,
                observatory: Optional[Any] = None,
                burstObservatory: Optional[Any] = None,
            ):
                self.remarks = remarks
                self.stats = stats
                self.log = log
                self.policy = policy
                self.inbounds = inbounds if inbounds is not None else None
                self.outbounds = outbounds if outbounds is not None else None
                self.dns = dns
                self.routing = routing
                self.api = api
                self.transport = transport
                self.reverse = reverse
                self.fakedns = fakedns
                self.browserForwarder = browserForwarder
                self.observatory = observatory
                self.burstObservatory = burstObservatory

            class LogBean:
                def __init__(
                    self,
                    access: str,
                    error: str,
                    loglevel: Optional[str] = None,
                    dnsLog: Optional[bool] = None,
                ):
                    self.access = access
                    self.error = error
                    self.loglevel = loglevel
                    self.dnsLog = dnsLog

            class InboundBean:
                def __init__(
                    self,
                    tag: str,
                    port: int,
                    protocol: str,
                    listen: Optional[str] = None,
                    settings: Optional[Any] = None,
                    sniffing: Optional["V2rayConfig.InboundBean.SniffingBean"] = None,
                    streamSettings: Optional[Any] = None,
                    allocate: Optional[Any] = None,
                ):
                    self.tag = tag
                    self.port = port
                    self.protocol = protocol
                    self.listen = listen
                    self.settings = settings
                    self.sniffing = sniffing
                    self.streamSettings = streamSettings
                    self.allocate = allocate

                class InSettingsBean:
                    def __init__(
                        self,
                        auth: Optional[str] = None,
                        udp: Optional[bool] = None,
                        allowTransparent: Optional[bool] = None,
                        userLevel: Optional[int] = None,
                        address: Optional[str] = None,
                        port: Optional[int] = None,
                        network: Optional[str] = None,
                    ):
                        self.auth = auth
                        self.udp = udp
                        self.userLevel = userLevel
                        self.address = address
                        self.port = port
                        self.network = network
                        self.allowTransparent = allowTransparent

                class SniffingBean:
                    def __init__(
                        self,
                        enabled: bool,
                        destOverride: List[str],
                        metadataOnly: Optional[bool] = None,
                        routeOnly: Optional[bool] = None,
                    ):
                        self.enabled = enabled
                        self.destOverride = destOverride
                        self.metadataOnly = metadataOnly
                        self.routeOnly = routeOnly

            @dataclass
            class OutboundBean:
                def __init__(
                    self,
                    tag: str = "proxy",
                    protocol: str = "",
                    settings: Optional[
                        "V2rayConfig.OutboundBean.OutSettingsBean"
                    ] = None,
                    streamSettings: Optional[
                        "V2rayConfig.OutboundBean.StreamSettingsBean"
                    ] = None,
                    proxySettings: Optional[Any] = None,
                    sendThrough: Optional[str] = None,
                    mux: "V2rayConfig.OutboundBean.MuxBean" = None,
                ):
                    self.tag = tag
                    self.protocol = protocol
                    self.settings = settings
                    self.streamSettings = streamSettings
                    self.proxySettings = proxySettings
                    self.sendThrough = sendThrough
                    self.mux = mux if mux is not None else self.MuxBean(False)

                class BeforeFrgSettings:
                    def __init__(
                        self,
                        tag: Optional[str] = None,
                        protocol: Optional[str] = "freedom",
                        settings: Optional[
                            "V2rayConfig.OutboundBean.OutSettingsBean.FragmentBean"
                        ] = None,
                        streamSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean"
                        ] = None,
                    ):
                        self.tag = tag
                        self.protocol = protocol
                        self.settings = settings
                        self.streamSettings = streamSettings

                class OutSettingsBean:
                    def __init__(
                        self,
                        vnext: Optional[
                            List["V2rayConfig.OutboundBean.OutSettingsBean.VnextBean"]
                        ] = None,
                        fragment: Optional[
                            "V2rayConfig.OutboundBean.OutSettingsBean.FragmentBean"
                        ] = None,
                        noises: Optional[
                            List["V2rayConfig.OutboundBean.OutSettingsBean.NoiseBean"]
                        ] = None,
                        servers: Optional[
                            List["V2rayConfig.OutboundBean.OutSettingsBean.ServersBean"]
                        ] = None,
                        response: Optional[
                            "V2rayConfig.OutboundBean.OutSettingsBean.Response"
                        ] = None,
                        network: Optional[str] = None,
                        address: Optional[Any] = None,
                        port: Optional[int] = None,
                        domainStrategy: Optional[str] = None,
                        redirect: Optional[str] = None,
                        userLevel: Optional[int] = None,
                        inboundTag: Optional[str] = None,
                        secretKey: Optional[str] = None,
                        peers: Optional[
                            List[
                                "V2rayConfig.OutboundBean.OutSettingsBean.WireGuardBean"
                            ]
                        ] = None,
                        reserved: Optional[List[int]] = None,
                        mtu: Optional[int] = None,
                        obfsPassword: Optional[str] = None,
                        wnoise: Optional[str] = None,
                        wnoisecount: Optional[str] = None,
                        keepAlive: Optional[int] = None,
                        wnoisedelay: Optional[str] = None,
                        wpayloadsize: Optional[str] = None,
                    ):
                        self.vnext = vnext
                        self.fragment = fragment
                        self.noises = noises
                        self.servers = servers
                        self.response = response
                        self.network = network
                        self.address = address
                        self.port = port
                        self.domainStrategy = domainStrategy
                        self.redirect = redirect
                        self.userLevel = userLevel
                        self.inboundTag = inboundTag
                        self.secretKey = secretKey
                        self.peers = peers
                        self.reserved = reserved
                        self.mtu = mtu
                        self.obfsPassword = obfsPassword
                        self.wnoise = wnoise
                        self.wnoisecount = wnoisecount
                        self.wnoisedelay = wnoisedelay
                        self.wpayloadsize = wpayloadsize
                        self.keepAlive = keepAlive

                    class VnextBean:
                        def __init__(
                            self,
                            address: str = "",
                            port: int = DEFAULT_PORT,
                            users: List[
                                "V2rayConfig.OutboundBean.OutSettingsBean.VnextBean.UsersBean"
                            ] = None,
                        ):
                            self.address = address
                            self.port = port
                            self.users = users if users is not None else None

                        class UsersBean:
                            def __init__(
                                self,
                                id: str = "",
                                alterId: Optional[int] = None,
                                security: str = DEFAULT_SECURITY,
                                level: int = DEFAULT_LEVEL,
                                encryption: str = "",
                                flow: str = "",
                            ):
                                self.id = id
                                self.alterId = alterId
                                self.security = security
                                self.level = level
                                self.encryption = encryption
                                self.flow = flow

                    class FragmentBean:
                        def __init__(
                            self,
                            packets: Optional[str] = PACKETS,
                            length: Optional[str] = LENGTH,
                            interval: Optional[str] = INTERVAL,
                            host1_domain: Optional[str] = None,
                            host2_domain: Optional[str] = None,
                        ):
                            self.packets = packets
                            self.length = length
                            self.interval = interval
                            self.host1_domain = host1_domain
                            self.host2_domain = host2_domain

                    class NoiseBean:
                        def __init__(
                            self,
                            type: Optional[str] = None,
                            packet: Optional[str] = None,
                            delay: Optional[str] = None,
                        ):
                            self.type = type
                            self.packet = packet
                            self.delay = delay

                    class ServersBean:
                        def __init__(
                            self,
                            address: str = "",
                            method: Optional[str] = None,
                            ota: bool = False,
                            password: Optional[str] = None,
                            port: int = DEFAULT_PORT,
                            level: int = DEFAULT_LEVEL,
                            email: Optional[str] = None,
                            flow: Optional[str] = None,
                            ivCheck: Optional[bool] = None,
                            users: Optional[
                                List[
                                    "V2rayConfig.OutboundBean.OutSettingsBean.ServersBean.SocksUsersBean"
                                ]
                            ] = None,
                        ):
                            self.address = address
                            self.method = (
                                method if users is None else "chacha20-poly1305"
                            )
                            self.ota = ota
                            self.password = password
                            self.port = port
                            self.level = level
                            self.email = email
                            self.flow = flow
                            self.ivCheck = ivCheck
                            self.users = users if users is not None else None

                        class SocksUsersBean:
                            def __init__(
                                self,
                                user: str = "",
                                passw: str = "",
                                level: int = DEFAULT_LEVEL,
                            ):
                                self.user = user
                                self.passw = passw
                                self.level = level

                    class Response:
                        def __init__(self, type: str):
                            self.type = type

                    class WireGuardBean:
                        def __init__(
                            self,
                            keepAlvie: int = None,
                            publicKey: str = "",
                            endpoint: str = "",
                        ):
                            self.publicKey = publicKey
                            self.endpoint = endpoint
                            self.keepAlvie = keepAlvie

                class StreamSettingsBean:
                    def __init__(
                        self,
                        network: str = DEFAULT_NETWORK,
                        security: str = "",
                        tcpSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.TcpSettingsBean"
                        ] = None,
                        kcpSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.KcpSettingsBean"
                        ] = None,
                        wsSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.WsSettingsBean"
                        ] = None,
                        httpupgradeSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.HttpupgradeSettingsBean"
                        ] = None,
                        xhttpSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.XhttpSettingsBean"
                        ] = None,
                        splithttpSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.SplithttpSettingsBean"
                        ] = None,
                        httpSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.HttpSettingsBean"
                        ] = None,
                        tlsSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.TlsSettingsBean"
                        ] = None,
                        quicSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.QuicSettingBean"
                        ] = None,
                        realitySettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.TlsSettingsBean"
                        ] = None,
                        grpcSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.GrpcSettingsBean"
                        ] = None,
                        hy2steriaSettings: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.Hy2steriaSettingsBean"
                        ] = None,
                        dsSettings: Optional[Any] = None,
                        sockopt: Optional[
                            "V2rayConfig.OutboundBean.StreamSettingsBean.SockoptBean"
                        ] = None,
                    ):
                        self.network = network
                        self.security = security
                        self.tcpSettings = tcpSettings
                        self.kcpSettings = kcpSettings
                        self.wsSettings = wsSettings
                        self.httpupgradeSettings = httpupgradeSettings
                        self.splithttpSettings = splithttpSettings
                        self.httpSettings = httpSettings
                        self.tlsSettings = tlsSettings
                        self.quicSettings = quicSettings
                        self.realitySettings = realitySettings
                        self.grpcSettings = grpcSettings
                        self.hy2steriaSettings = hy2steriaSettings
                        self.dsSettings = dsSettings
                        self.sockopt = sockopt

                    # ... (Nested classes for TcpSettingsBean, KcpSettingsBean, etc.  -  See below for these) ...
                    def populateTransportSettings(
                        self,
                        transport: str,
                        headerType: Optional[str],
                        host: Optional[str],
                        path: Optional[str],
                        seed: Optional[str],
                        quicSecurity: Optional[str],
                        key: Optional[str],
                        mode: Optional[str],
                        serviceName: Optional[str],
                        authority: Optional[str],
                    ) -> str:
                        sni = ""
                        self.network = transport
                        # ... (Implementation for transport settings - see below)
                        return sni

                    def populateTlsSettings(
                        self,
                        streamSecurity: str,
                        allowInsecure: bool,
                        sni: str,
                        fingerprint: Optional[str],
                        alpns: Optional[str],
                        publicKey: Optional[str],
                        shortId: Optional[str],
                        spiderX: Optional[str],
                    ):
                        self.security = streamSecurity
                        # ... (Implementation for TLS settings - see below)

                class MuxBean:
                    def __init__(
                        self,
                        enabled: bool,
                        concurrency: int = 8,
                        xudpConcurrency: int = None,
                        xudpProxyUDP443: str = None,
                    ):
                        self.enabled = enabled
                        self.concurrency = concurrency
                        self.xudpConcurrency = xudpConcurrency
                        self.xudpProxyUDP443 = xudpProxyUDP443

                class HeadersBean:
                    def __init__(
                        self,
                        Host: Optional[str] = None,
                        userAgent: Optional[str] = None,
                        acceptEncoding: Optional[str] = None,
                        Connection: Optional[str] = None,
                        Pragma: Optional[str] = None,
                        Host_single: str = "",
                    ):  # Added Host_single for WsSettingsBean compatibility
                        self.Host = Host if Host is not None else None
                        self.userAgent = userAgent if userAgent is not None else None
                        self.acceptEncoding = (
                            acceptEncoding if acceptEncoding is not None else None
                        )
                        self.Connection = Connection if Connection is not None else None
                        self.Pragma = Pragma
                        self.Host_single = Host_single

                class RequestBean:
                    def __init__(
                        self,
                        path: List[str] = None,
                        headers: Optional[
                            "V2rayConfig.OutboundBean.HeadersBean"
                        ] = None,
                        version: Optional[str] = None,
                        method: Optional[str] = None,
                    ):
                        self.path = path if path is not None else None
                        self.headers = (
                            headers
                            if headers is not None
                            else V2rayConfig.OutboundBean.HeadersBean()
                        )
                        self.version = version
                        self.method = method

                class HeaderBean:
                    def __init__(
                        self,
                        type: str = "none",
                        request: Optional[
                            "V2rayConfig.OutboundBean.RequestBean"
                        ] = None,
                        response: Any = None,
                    ):
                        self.type = type
                        self.request = request
                        self.response = response

                class TcpSettingsBean:
                    def __init__(
                        self,
                        header: Optional["V2rayConfig.OutboundBean.HeaderBean"] = None,
                        acceptProxyProtocol: Optional[bool] = None,
                    ):
                        self.header = (
                            header
                            if header is not None
                            else V2rayConfig.OutboundBean.HeaderBean()
                        )
                        self.acceptProxyProtocol = acceptProxyProtocol

                class KcpSettingsBean:
                    def __init__(
                        self,
                        mtu: int = 1350,
                        tti: int = 50,
                        uplinkCapacity: int = 12,
                        downlinkCapacity: int = 100,
                        congestion: bool = False,
                        readBufferSize: int = 1,
                        writeBufferSize: int = 1,
                        header: Optional["V2rayConfig.OutboundBean.HeaderBean"] = None,
                        seed: Optional[str] = None,
                    ):
                        self.mtu = mtu
                        self.tti = tti
                        self.uplinkCapacity = uplinkCapacity
                        self.downlinkCapacity = downlinkCapacity
                        self.congestion = congestion
                        self.readBufferSize = readBufferSize
                        self.writeBufferSize = writeBufferSize
                        self.header = (
                            header
                            if header is not None
                            else V2rayConfig.OutboundBean.HeaderBean(type="none")
                        )
                        self.seed = seed

                class WsSettingsBean:
                    def __init__(
                        self,
                        path: str = "",
                        headers: Optional[
                            "V2rayConfig.OutboundBean.HeadersBean"
                        ] = None,
                        maxEarlyData: Optional[int] = None,
                        useBrowserForwarding: Optional[bool] = None,
                        acceptProxyProtocol: Optional[bool] = None,
                    ):
                        self.path = path
                        self.headers = (
                            headers
                            if headers is not None
                            else V2rayConfig.OutboundBean.HeadersBean(Host_single="")
                        )
                        self.maxEarlyData = maxEarlyData
                        self.useBrowserForwarding = useBrowserForwarding
                        self.acceptProxyProtocol = acceptProxyProtocol

                class HttpupgradeSettingsBean:
                    def __init__(
                        self,
                        path: str = "",
                        host: str = "",
                        acceptProxyProtocol: Optional[bool] = None,
                    ):
                        self.path = path
                        self.host = host
                        self.acceptProxyProtocol = acceptProxyProtocol

                class XhttpSettingsBean:
                    def __init__(
                        self,
                        path: Optional[str] = None,
                        host: Optional[str] = None,
                        mode: Optional[str] = None,
                        extra: Optional[Any] = None,
                    ):
                        self.path = path
                        self.host = host
                        self.mode = mode

                class SplithttpSettingsBean:
                    def __init__(
                        self,
                        path: str = "",
                        host: str = "",
                        maxUploadSize: Optional[int] = None,
                        maxConcurrentUploads: Optional[int] = None,
                    ):
                        self.path = path
                        self.host = host
                        self.maxUploadSize = maxUploadSize
                        self.maxConcurrentUploads = maxConcurrentUploads

                class HttpSettingsBean:
                    def __init__(self, host: List[str] = None, path: str = ""):
                        self.host = host if host is not None else None
                        self.path = path

                class SockoptBean:
                    def __init__(
                        self,
                        TcpNoDelay: Optional[bool] = None,
                        tcpKeepAliveIdle: Optional[int] = None,
                        tcpFastOpen: Optional[bool] = None,
                        tproxy: Optional[str] = None,
                        mark: Optional[int] = None,
                        dialerProxy: Optional[str] = None,
                    ):
                        self.TcpNoDelay = TcpNoDelay
                        self.tcpKeepAliveIdle = tcpKeepAliveIdle
                        self.tcpFastOpen = tcpFastOpen
                        self.tproxy = tproxy
                        self.mark = mark
                        self.dialerProxy = dialerProxy

                class TlsSettingsBean:
                    def __init__(
                        self,
                        allowInsecure: bool = False,
                        serverName: str = "",
                        alpn: Optional[List[str]] = None,
                        minVersion: Optional[str] = None,
                        maxVersion: Optional[str] = None,
                        preferServerCipherSuites: Optional[bool] = None,
                        cipherSuites: Optional[str] = None,
                        fingerprint: Optional[str] = None,
                        certificates: Optional[List[Any]] = None,
                        disableSystemRoot: Optional[bool] = None,
                        enableSessionResumption: Optional[bool] = None,
                        show: bool = False,
                        publicKey: Optional[str] = None,
                        shortId: Optional[str] = None,
                        spiderX: Optional[str] = None,
                    ):
                        self.allowInsecure = allowInsecure
                        self.serverName = serverName
                        self.alpn = alpn
                        self.minVersion = minVersion
                        self.maxVersion = maxVersion
                        self.preferServerCipherSuites = preferServerCipherSuites
                        self.cipherSuites = cipherSuites
                        self.fingerprint = fingerprint
                        self.certificates = certificates
                        self.disableSystemRoot = disableSystemRoot
                        self.enableSessionResumption = enableSessionResumption
                        self.show = show
                        self.publicKey = publicKey
                        self.shortId = shortId
                        self.spiderX = spiderX

                class QuicSettingBean:
                    def __init__(
                        self,
                        security: str = "none",
                        key: str = "",
                        header: Optional["V2rayConfig.OutboundBean.HeaderBean"] = None,
                    ):
                        self.security = security
                        self.key = key
                        self.header = (
                            header
                            if header is not None
                            else V2rayConfig.OutboundBean.HeaderBean(type="none")
                        )

                class GrpcSettingsBean:
                    def __init__(
                        self,
                        serviceName: str = "",
                        authority: Optional[str] = None,
                        multiMode: Optional[bool] = None,
                        idle_timeout: Optional[int] = None,
                        health_check_timeout: Optional[int] = None,
                    ):
                        self.serviceName = serviceName
                        self.authority = authority
                        self.multiMode = multiMode
                        self.idle_timeout = idle_timeout
                        self.health_check_timeout = health_check_timeout

                class Hy2CongestionBean:
                    def __init__(
                        self,
                        type: Optional[str] = "bbr",
                        up_mbps: Optional[int] = None,
                        down_mbps: Optional[int] = None,
                    ):
                        self.type = type
                        self.up_mbps = up_mbps
                        self.down_mbps = down_mbps

                class Hy2steriaSettingsBean:
                    def __init__(
                        self,
                        password: Optional[str] = None,
                        use_udp_extension: Optional[bool] = True,
                        congestion: Optional[
                            "V2rayConfig.OutboundBean.Hy2CongestionBean"
                        ] = None,
                    ):
                        self.password = password
                        self.use_udp_extension = use_udp_extension
                        self.congestion = congestion

                def split_string_to_list(s: str) -> List[str]:
                    return [item.strip() for item in s.split(",") if item.strip()]

                def populate_transport_settings(
                    transport: str,
                    headerType: Optional[str],
                    host: Optional[str],
                    path: Optional[str],
                    seed: Optional[str],
                    quicSecurity: Optional[str],
                    key: Optional[str],
                    mode: Optional[str],
                    serviceName: Optional[str],
                    authority: Optional[str],
                ) -> str:
                    network = transport
                    sni = ""
                    if network == "tcp":
                        tcpSetting = V2rayConfig.OutboundBean.TcpSettingsBean()
                        if headerType == HTTP:
                            tcpSetting.header.type = HTTP
                            if host or path:
                                requestObj = V2rayConfig.OutboundBean.RequestBean()
                                requestObj.headers.Host = (
                                    V2rayConfig.OutboundBean.split_string_to_list(
                                        host or ""
                                    )
                                )
                                requestObj.path = (
                                    V2rayConfig.OutboundBean.split_string_to_list(
                                        path or ""
                                    )
                                )
                                tcpSetting.header.request = requestObj
                                sni = (
                                    requestObj.headers.Host[0]
                                    if requestObj.headers.Host
                                    else sni
                                )
                        else:
                            tcpSetting.header.type = "none"
                            sni = host or ""
                        tcpSettings = (
                            tcpSetting  # Assuming tcpSettings is a global variable
                        )
                    elif network == "kcp":
                        kcpsetting = V2rayConfig.OutboundBean.KcpSettingsBean()
                        kcpsetting.header.type = headerType or "none"
                        kcpsetting.seed = seed
                        kcpSettings = kcpsetting
                    elif network == "ws":
                        wssetting = V2rayConfig.OutboundBean.WsSettingsBean()
                        wssetting.headers.Host_single = host or ""
                        sni = wssetting.headers.Host_single
                        wssetting.path = path or "/"
                        wsSettings = wssetting
                    elif network == "httpupgrade":
                        httpupgradeSetting = (
                            V2rayConfig.OutboundBean.HttpupgradeSettingsBean()
                        )
                        httpupgradeSetting.host = host or ""
                        sni = httpupgradeSetting.host
                        httpupgradeSetting.path = path or "/"
                        httpupgradeSettings = httpupgradeSetting
                    elif network == "xhttp":
                        xhttpSetting = V2rayConfig.OutboundBean.XhttpSettingsBean()
                        xhttpSetting.host = host or ""
                        sni = xhttpSetting.host
                        xhttpSetting.path = path if path else "/"
                        xhttpSettings = xhttpSetting
                    elif network == "splithttp":
                        splithttpSetting = (
                            V2rayConfig.OutboundBean.SplithttpSettingsBean()
                        )
                        splithttpSetting.host = host or ""
                        sni = splithttpSetting.host
                        splithttpSetting.path = path or "/"
                        splithttpSettings = splithttpSetting  # Assuming splithttpSettings is a global variable
                    elif network in ["h2", "http"]:
                        network = "h2"
                        h2Setting = V2rayConfig.OutboundBean.HttpSettingsBean()
                        h2Setting.host = V2rayConfig.OutboundBean.split_string_to_list(
                            host or ""
                        )
                        sni = h2Setting.host[0] if h2Setting.host else sni
                        h2Setting.path = path or "/"
                        httpSettings = (
                            h2Setting  # Assuming httpSettings is a global variable
                        )
                    elif network == "quic":
                        quicsetting = V2rayConfig.OutboundBean.QuicSettingBean()
                        quicsetting.security = quicSecurity or "none"
                        quicsetting.key = key or ""
                        quicsetting.header.type = headerType or "none"
                        quicSettings = (
                            quicsetting  # Assuming quicSettings is a global variable
                        )
                    elif network == "grpc":
                        grpcSetting = V2rayConfig.OutboundBean.GrpcSettingsBean()
                        grpcSetting.multiMode = mode == False
                        grpcSetting.serviceName = serviceName or ""
                        grpcSetting.authority = authority or ""
                        grpcSetting.idle_timeout = 60
                        grpcSetting.health_check_timeout = 20
                        sni = authority or ""
                        grpcSettings = (
                            grpcSetting  # Assuming grpcSettings is a global variable
                        )
                    return sni

                def populate_tls_settings(
                    streamSecurity: str,
                    allowInsecure: bool,
                    sni: str,
                    fingerprint: Optional[str],
                    alpns: Optional[str],
                    publicKey: Optional[str],
                    shortId: Optional[str],
                    spiderX: Optional[str],
                ):
                    security = streamSecurity
                    tlsSetting = V2rayConfig.OutboundBean.TlsSettingsBean(
                        allowInsecure=allowInsecure,
                        serverName=sni,
                        fingerprint=fingerprint,
                        alpn=(
                            V2rayConfig.OutboundBean.split_string_to_list(alpns or "")
                            if alpns
                            else None
                        ),
                        publicKey=publicKey,
                        shortId=shortId,
                        spiderX=spiderX,
                    )
                    if security == TLS:
                        tlsSettings = tlsSetting
                        realitySettings = None
                    elif security == REALITY:
                        tlsSettings = None
                        realitySettings = tlsSetting

            class DnsBean:
                def __init__(
                    self,
                    servers: Optional[List[Any]] = None,
                    hosts: Optional[Dict[str, Any]] = None,
                    clientIp: Optional[str] = None,
                    disableCache: Optional[bool] = None,
                    queryStrategy: Optional[str] = None,
                    tag: Optional[str] = None,
                    fakedns: Optional[list] = None,
                ):
                    self.servers = servers
                    self.hosts = hosts
                    self.fakedns = fakedns
                    self.clientIp = clientIp
                    self.disableCache = disableCache
                    self.queryStrategy = queryStrategy
                    self.tag = tag

                class ServersBean:
                    def __init__(
                        self,
                        address: str = "",
                        port: Optional[int] = None,
                        domains: Optional[List[str]] = None,
                        expectIPs: Optional[List[str]] = None,
                        clientIp: Optional[str] = None,
                    ):
                        self.address = address
                        self.port = port
                        self.domains = domains
                        self.expectIPs = expectIPs
                        self.clientIp = clientIp

            class RoutingBean:
                def __init__(
                    self,
                    domainStrategy: str,
                    domainMatcher: Optional[str] = None,
                    rules: List["V2rayConfig.RoutingBean.RulesBean"] = None,
                    balancers: Optional[List[Any]] = None,
                ):
                    self.domainStrategy = domainStrategy
                    self.domainMatcher = domainMatcher
                    self.rules = rules if rules is not None else None
                    self.balancers = balancers

                class RulesBean:
                    def __init__(
                        self,
                        type: str = "field",
                        ip: Optional[List[str]] = None,
                        domain: Optional[List[str]] = None,
                        outboundTag: str = "",
                        balancerTag: Optional[str] = None,
                        port: Optional[str] = None,
                        sourcePort: Optional[str] = None,
                        network: Optional[str] = None,
                        source: Optional[List[str]] = None,
                        user: Optional[List[str]] = None,
                        inboundTag: Optional[List[str]] = None,
                        protocol: Optional[List[str]] = None,
                        attrs: Optional[str] = None,
                        domainMatcher: Optional[str] = None,
                        enabled: Optional[bool] = None,
                        id: Optional[str] = None,
                    ):
                        self.type = type
                        self.ip = ip
                        self.id = id
                        self.domain = domain
                        self.outboundTag = outboundTag
                        self.balancerTag = balancerTag
                        self.port = port
                        self.sourcePort = sourcePort
                        self.network = network
                        self.source = source
                        self.user = user
                        self.inboundTag = inboundTag
                        self.protocol = protocol
                        self.attrs = attrs
                        self.domainMatcher = domainMatcher
                        self.enabled = enabled

            class PolicyBean:
                def __init__(
                    self,
                    levels: Dict[str, "V2rayConfig.PolicyBean.LevelBean"],
                    system: Optional[Any] = None,
                ):
                    self.levels = levels
                    self.system = system

                class LevelBean:
                    def __init__(
                        self,
                        handshake: Optional[int] = None,
                        connIdle: Optional[int] = None,
                        uplinkOnly: Optional[int] = None,
                        downlinkOnly: Optional[int] = None,
                        statsUserUplink: Optional[bool] = None,
                        statsUserDownlink: Optional[bool] = None,
                        bufferSize: Optional[int] = None,
                    ):
                        self.handshake = handshake
                        self.connIdle = connIdle
                        self.uplinkOnly = uplinkOnly
                        self.downlinkOnly = downlinkOnly
                        self.statsUserUplink = statsUserUplink
                        self.statsUserDownlink = statsUserDownlink
                        self.bufferSize = bufferSize

            class FakednsBean:
                def __init__(
                    self, ipPool: str = "198.18.0.0/15", poolSize: int = 10000
                ):
                    self.ipPool = ipPool
                    self.poolSize = poolSize

            outbounds = []

            class EConfigType:
                entries = []

            def getProxyOutbound():
                for outbound in V2rayConfig.outbounds:
                    for it in V2rayConfig.EConfigType.entries:
                        if outbound.protocol.lower() == it.name.lower():
                            return outbound

            def to_dict(self):
                result = {}
                for key, value in self.__dict__.items():
                    if value is not None:
                        if isinstance(value, list):
                            result[key] = [
                                item.to_dict() if hasattr(item, "to_dict") else item
                                for item in value
                                if item is not None
                            ]
                        elif hasattr(value, "to_dict"):
                            result[key] = value.to_dict()
                        else:
                            result[key] = value
                return result

            def toPrettyPrinting(self) -> str:
                return json.dumps(self.to_dict(), indent=4, cls=MyEncoder)

            def __str__(self):
                return self.toPrettyPrinting()

        class MyEncoder(JSONEncoder):
            def default(self, o):
                if hasattr(o, "to_dict"):
                    return o.to_dict()
                return o.__dict__

        class V2rayConfigLogBean:
            def __init__(
                self,
                access: str,
                error: str,
                loglevel: Optional[str] = None,
                dnsLog: Optional[bool] = None,
            ):
                self.access = access
                self.error = error
                self.loglevel = loglevel
                self.dnsLog = dnsLog

            def to_dict(self):
                result = {}
                for key, value in self.__dict__.items():
                    if value is not None:
                        result[key] = value
                return result

        def remove_nulls(data):
            if isinstance(data, dict):
                return {k: remove_nulls(v) for k, v in data.items() if v is not None}
            elif isinstance(data, list):
                return [remove_nulls(item) for item in data if item is not None]
            elif hasattr(data, "__dict__"):
                obj_dict = data.__dict__
                cleaned_dict = {
                    k: remove_nulls(v) for k, v in obj_dict.items() if v is not None
                }
                return cleaned_dict
            else:
                return data

        def replace_accept_encoding(d):
            if isinstance(d, dict):
                new_dict = {}
                for key, value in d.items():
                    if key == "acceptEncoding":
                        new_dict["Accept-Encoding"] = value
                    elif key == "passw":
                        new_dict["pass"] = value
                    else:
                        new_dict[key] = replace_accept_encoding(value)
                return new_dict
            elif isinstance(d, list):
                return [replace_accept_encoding(item) for item in d]
            elif hasattr(d, "__dict__"):
                obj_dict = d.__dict__
                cleaned_dict = {
                    itemk: replace_accept_encoding(itemk)
                    for itemk, itemv in obj_dict.items()
                }
                return cleaned_dict
            else:
                return d

        (
            ID,
            ADDRESS,
            PORT,
            SECURITY,
            ALPN,
            FP,
            SNI,
            SPX,
            HEADER_TYPE,
            ENCRYPTION,
            TYPE,
            MODE,
            FLOW,
            ALTERID,
            R_HOST,
            PATH,
            SCY,
            PASS,
            SID,
            METHOD,
            OBFS_PASSWORD,
            INSECURE,
            PORTHOPINGINTERVAL,
            PINSHA256,
            OBFS,
            USER,
            WNOISE,
            WNOISECOUNT,
            WNOISEDELAY,
            WPAYLOADSIZE,
            KEEPALIVE,
            MTU,
            ENDPOINT,
            RESERVED,
            PBK,
            SECERKEY,
            REMARKS,
            protocol_c,
        ) = (
            dict_conf.id,
            dict_conf.address,
            dict_conf.port,
            dict_conf.security,
            dict_conf.alpn,
            dict_conf.fp,
            dict_conf.sni,
            dict_conf.spx,
            dict_conf.header_type,
            dict_conf.encryption,
            dict_conf.type,
            dict_conf.mode,
            dict_conf.flow,
            dict_conf.alter_id,
            dict_conf.host,
            dict_conf.path,
            dict_conf.scy,
            dict_conf.ss_password,
            dict_conf.sid,
            dict_conf.ss_method,
            dict_conf.hy2_obfs_password,
            dict_conf.hy2_insecure,
            dict_conf.hy2_hop_interval,
            dict_conf.hy2_pinsha256,
            dict_conf.hy2_obfs,
            dict_conf.socks_user,
            dict_conf.wnoise,
            dict_conf.wnoisecount,
            dict_conf.wnoisedelay,
            dict_conf.wpayloadsize,
            dict_conf.wg_keep_alive,
            dict_conf.wg_mtu,
            dict_conf.address,
            dict_conf.wg_reserved,
            dict_conf.pbk,
            dict_conf.wg_secret_key,
            dict_conf.tag,
            dict_conf.protocol,
        )
        if SECURITY == "none":
            SECURITY = ""
        if INSECURE == "0":
            INSECURE = False
        else:
            INSECURE = True
        if RESERVED != "":
            RESERVED = list(map(int, RESERVED.split(",")))
        if MODE == "gun" and TYPE == "grpc":
            MODE = False
        elif MODE == "multi" and TYPE == "grpc":
            MODE = True
        if protocol_c == "wireguard":
            ADDRESS = dict_conf.wg_address.split(",")
            PBK = dict_conf.wg_public_key
        if IS_WARP_ON_WARP:
            warp_conf = parse_configs_by_get(WARPONWARP)
            (
                WNOISEON,
                WNOISECOUNTON,
                WNOISEDELAYON,
                WPAYLOADSIZEON,
                KEEPALIVEON,
                MTUON,
                SECERKEYON,
                ENDPOINTON,
                PORTON,
                ADDRESSON,
                RESERVEDON,
                PBKON,
            ) = (
                warp_conf.wnoise,
                warp_conf.wnoisecount,
                warp_conf.wnoisedelay,
                warp_conf.wpayloadsize,
                warp_conf.wg_keep_alive,
                warp_conf.wg_mtu,
                warp_conf.wg_secret_key,
                warp_conf.address,
                warp_conf.port,
                warp_conf.wg_address.split(","),
                warp_conf.wg_reserved,
                warp_conf.wg_public_key,
            )
            if RESERVEDON != "":
                RESERVEDON = list(map(int, RESERVEDON.split(",")))
        #################                    eding configs if                 ############################
        if is_editing:
            try:
                if HEADER_TYPE == None:
                    HEADER_TYPE = "none"
            except Exception:
                pass
            if (
                conifg.startswith("vless://")
                or conifg.startswith("vmess://")
                or conifg.startswith("trojan://")
            ):
                if ALPN == None:
                    ALPN = ""
                if TYPE == "grpc":
                    if MODE == False:
                        MODE = "gun"
                    else:
                        MODE = "multi"
            try:
                if R_HOST == None:
                    R_HOST = ""
            except Exception:
                pass
            REMARKS_w = ctk.StringVar(value=REMARKS)
            ADDRESS_w = ctk.StringVar(value=ADDRESS)
            if conifg.startswith("wireguard://"):
                ADDRESS_w = ctk.StringVar(value=ENDPOINT)
                LOCAL_add_w = ctk.StringVar(value=ADDRESS)
            PORT_w = ctk.IntVar(value=PORT)
            ID_w = ""
            ENCRYPTION_w = ""
            ALTERID_w = ""
            PASS_w = ""
            R_HOST_w = ""
            PATH_w = ""
            SNI_w = ""
            PBK_w = ""
            SID_w = ""
            SPX_w = ""
            PASS_w = ""
            USER_w = ""
            SECERKEY_w = ""
            RESERVED_w = ""
            MTU_w = ""
            KEEPALIVE_w = ""
            WNOISE_w = ""
            WNOISECOUNT_w = ""
            WNOISEDELAY_w = ""
            WPAYLOADSIZE_w = ""
            INSECURE_w = ""
            PINSHA256_w = ""
            OBFS_PASSWORD_w = ""
            PORTHOPINGINTERVAL_w = ""
            FLOW_w = [""]
            SCY_w = [""]
            TYPE_w = [""]
            network_head_values = [""]
            MODE_w = [""]
            TLS_w = [""]
            FP_w = [""]
            ALPN_w = [""]
            SECURITY_w = [""]
            if (
                conifg.startswith("vless://")
                or conifg.startswith("vmess://")
                or conifg.startswith("trojan://")
            ):
                ID_w = ctk.StringVar(value=ID)
                if conifg.startswith("vless://"):
                    FLOW_w = change_list_f(
                        ["", "xtls-rprx-vision", "xtls-rprx-vision-udp443"], FLOW
                    )
                    ENCRYPTION_w = ctk.StringVar(value=ENCRYPTION)
                elif conifg.startswith("vmess://"):
                    ALTERID_w = ctk.StringVar(value=ALTERID)
                    SCY_w = change_list_f(
                        ["chacha20-poly1305", "aes-128-gcm", "auto", "none", "zero"],
                        SCY,
                    )
                elif conifg.startswith("trojan://"):
                    PASS_w = ctk.StringVar(value=PASS)
                TYPE_w = change_list_f(
                    [
                        "tcp",
                        "kcp",
                        "ws",
                        "httpupgrade",
                        "splithttp",
                        "xhttp",
                        "h2",
                        "quic",
                        "grpc",
                    ],
                    TYPE,
                )
                if TYPE == "tcp" or TYPE == "kcp" or TYPE == "quic":
                    if TYPE == "tcp":
                        network_head_values = ["none", "http"]
                    elif TYPE == "kcp" or TYPE == "quic":
                        network_head_values = [
                            "none",
                            "strp",
                            "utp",
                            "wechat-video",
                            "dtls",
                            "wireguard",
                        ]
                    network_head_values = change_list_f(
                        network_head_values, HEADER_TYPE
                    )
                elif TYPE == "grpc":
                    MODE_w = change_list_f(["gun", "multi"], MODE)
                elif TYPE == "xhttp":
                    MODE_w = change_list_f(
                        ["auto", "packet-up", "stream-up", "stream-one"], MODE
                    )
                if TYPE != "tcp":
                    if TYPE != "kcp":
                        R_HOST_w = ctk.StringVar(value=R_HOST)
                    PATH_w = ctk.StringVar(value=PATH)
                TLS_w = change_list_f(["", "tls", "reality"], SECURITY)
                if SECURITY != "":
                    SNI_w = ctk.StringVar(value=SNI)
                    FP_w = change_list_f(
                        [
                            "",
                            "chrome",
                            "firefox",
                            "safari",
                            "ios",
                            "android",
                            "edge",
                            "360",
                            "qq",
                            "random",
                            "randomized",
                        ],
                        FP,
                    )
                    if SECURITY == "tls":
                        ALPN_w = change_list_f(
                            [
                                "",
                                "h3",
                                "h2",
                                "http/1.1",
                                "h3,h2,http/1.1",
                                "h3,h2",
                                "h2,http/1.1",
                            ],
                            ALPN,
                        )
                    elif SECURITY == "reality":
                        PBK_w = ctk.StringVar(value=PBK)
                        SID_w = ctk.StringVar(value=SID)
                        SPX_w = ctk.StringVar(value=SPX)
            elif conifg.startswith("ss://") or conifg.startswith("socks://"):
                PASS_w = ctk.StringVar(value=PASS)
                if conifg.startswith("socks://"):
                    USER_w = ctk.StringVar(value=USER)
                else:
                    SECURITY_w = change_list_f(
                        [
                            "aes-256-gcm",
                            "aes-128-gcm",
                            "chacha20-poly1305",
                            "chacha20-ietf-poly1305",
                            "xchacha20-poly1305",
                            "xchacha20-ietf-poly1305",
                            "none",
                            "plain",
                            "2022-blake3-aes-128-gcm",
                            "2022-blake3-aes-256-gcm",
                            "2022-blake3-chacha20-poly1305",
                        ],
                        METHOD,
                    )
            elif conifg.startswith("wireguard://"):
                SECERKEY_w = ctk.StringVar(value=SECERKEY)
                PBK_w = ctk.StringVar(value=PBK)
                RESERVED_w = ctk.StringVar(value=RESERVED)
                MTU_w = ctk.IntVar(value=int(MTU))
                KEEPALIVE_w = ctk.IntVar(value=int(KEEPALIVE))
                WNOISE_w = ctk.StringVar(value=WNOISE)
                WNOISECOUNT_w = ctk.StringVar(value=WNOISECOUNT)
                WNOISEDELAY_w = ctk.StringVar(value=WNOISEDELAY)
                WPAYLOADSIZE_w = ctk.StringVar(value=WPAYLOADSIZE)
            elif conifg.startswith("hy2://") or conifg.startswith("hysteria2://"):
                PASS_w = ctk.StringVar(value=PASS)
                TLS_w = change_list_f(["", "tls"], SECURITY)
                if SECURITY == "tls":
                    SNI_w = ctk.StringVar(value=SNI)
                    INSECURE_w = change_list_f(["True", "False"], str(INSECURE))
                    PINSHA256_w = ctk.StringVar(value=PINSHA256)
                if OBFS != "":
                    OBFS_PASSWORD_w = ctk.StringVar(value=OBFS_PASSWORD)
                PORTHOPINGINTERVAL_w = ctk.IntVar(value=int(PORTHOPINGINTERVAL))
            tabview.add("edit")
            tabview.set("edit")
            tabview.tab("edit").grab_set()
            fram_top = ctk.CTkFrame(
                tabview.tab("edit"), height=50, border_width=1, border_color="#868686"
            )
            fram_top.pack(fill=tk.X)
            back_arrow = ctk.CTkImage(
                light_image=Image.open("imgs/arrow.png"),
                dark_image=Image.open("imgs/arrow_light.png"),
                size=(25, 25),
            )

            def exit_out():
                reset_v_of_file()
                rootmainactivity.grab_set()
                tabview.set("configs")
                clear_widgets(tabview.tab("edit"))
                tabview.delete("edit")

            def restart_editing(conifg: str, num: int):
                global is_editing
                is_editing = True
                rootmainactivity.grab_set()
                tabview.set("configs")
                tabview.delete("edit")
                rootmainactivity.update()
                parse_configs(conifg, num)

            def save_normal_conf_form(conifg: str, num: int, remarks: ctk.CTkEntry):
                global \
                    is_editing, \
                    count, \
                    wch_sel, \
                    frams_in_show, \
                    frams_in_ping, \
                    fram_in_flag
                data = {
                    "protocol": protocol_c,
                    "address": ip_address.get().strip() if ip_address else "",
                    "port": ports.get() if ports else "",
                    "security": tls.get().strip() if tls else "",
                    "sni": sni.get().strip() if sni else "",
                    "fp": fp.get().strip() if fp else "",
                    "user": user.get() if user else "",
                    "ss_method": security.get() if security else "",
                    "alpn": alpn.get().strip() if alpn else "",
                    "pbk": pbk.get().strip() if pbk else "",
                    "sid": sid.get().strip() if sid else "",
                    "spx": spx.get().strip() if spx else "",
                    "mode": mode.get().strip() if mode else "",
                    "flow": flow.get().strip() if flow else "",
                    "encryption": encryption.get().strip() if encryption else "",
                    "network": network.get().strip() if network else "",
                    "header_type": header_type.get().strip() if header_type else "",
                    "id": id.get().strip() if id else "",
                    "alter_id": alterid.get() if alterid else "",
                    "password": pass_w.get().strip() if pass_w else "",
                    "user": user.get().strip() if user else "",
                    "host": r_host.get().strip() if r_host else "",
                    "path": path.get().strip() if path else "",
                    "hy2_insecure": insecure.get() == "True" if insecure else "",
                    "hy2_obfs_password": (
                        obfs_password.get().strip() if obfs_password else ""
                    ),
                    "hy2_hop_interval": (
                        porthopinginterval.get() if porthopinginterval else ""
                    ),
                    "wg_secret_key": secrekey.get().strip() if secrekey else "",
                    "wg_public_key": pbk.get().strip() if pbk else "",
                    "wg_reserved": reserved.get().strip() if reserved else "",
                    "wg_endpoint": ip_address.get().strip() if ip_address else "",
                    "wg_keep_alive": keepAlive.get() if keepAlive else "",
                    "wg_mtu": mtu.get().strip() if mtu else "",
                    "wg_address": address.get().strip() if address else "",
                    "wnoise": wnoise.get().strip() if wnoise else "",
                    "wnoisecount": wnoisecount.get().strip() if wnoisecount else "",
                    "wnoisedelay": wnoisedelay.get().strip() if wnoisedelay else "",
                    "wpayloadsize": wpayloadsize.get().strip() if wpayloadsize else "",
                    "tag": remarks.get().strip() or "Untitled" if remarks else "",
                }
                try:
                    if data["protocol"] == "vless":
                        config = build_vless_config(data)
                    elif data["protocol"] == "vmess":
                        config = build_vmess_config(data)
                    elif data["protocol"] == "trojan":
                        config = build_trojan_config(data)
                    elif data["protocol"] in ["hy2", "hysteria2"]:
                        config = build_hysteria_config(data)
                    elif data["protocol"] == "wireguard":
                        config = build_wireguard_config(data)
                    elif data["protocol"] == "socks":
                        config = build_socks_config(data)
                    elif data["protocol"] == "ss":
                        config = build_shadowsocks_config(data)
                    else:
                        raise ValueError("Unsupported protocol")
                    lable = frams_in_show[num]
                    lable.configure(state=tk.NORMAL)
                    lable.delete(1.0, tk.END)
                    remarks = re.sub(r"\n", "", remarks.get())
                    lable.insert(1.0, remarks)
                    lable.configure(state=tk.DISABLED)
                    try:
                        flag_icon = ctk.CTkImage(
                            light_image=Image.open(
                                f"imgs/{remarks.split('>>')[1]}.png"
                            ),
                            dark_image=Image.open(f"imgs/{remarks.split('>>')[1]}.png"),
                            size=(10, 10),
                        )
                        fram_in_flag[num].configure(image=flag_icon)
                    except Exception:
                        try:
                            fram_in_flag[num].configure(image=None)
                        except Exception:
                            pass
                    with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as f:
                        sun_na = f.readlines()
                    config = re.sub(r"\n", "", config)
                    sun_na[num] = config + "\n"
                    with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                        f.writelines(sun_na)
                    # reset_v_of_file()
                    rootmainactivity.grab_set()
                    tabview.set("configs")
                    clear_widgets(tabview.tab("edit"))
                    tabview.delete("edit")
                except Exception as e:
                    logging.error(f"Error saving config: {e}")
                    messagebox.showerror("Error", "Failed to save configuration!")

            def build_vless_config(data: dict) -> str:
                base = f"vless://{data['id']}@{data['address']}:{data['port']}"
                query_params = {
                    "security": data["security"],
                    "encryption": data["encryption"],
                    "flow": data["flow"],
                    "type": data["network"],
                    "mode": data["mode"],
                    "headerType": data["header_type"],
                    "sni": data["sni"],
                    "fp": data["fp"],
                    "alpn": data["alpn"],
                    "pbk": data["pbk"],
                    "sid": data["sid"],
                    "spx": data["spx"],
                }
                if data["network"] in [
                    "tcp",
                    "ws",
                    "h2",
                    "httpupgrade",
                    "xhttp",
                    "splithttp",
                ]:
                    query_params.update({"host": data["host"]})
                elif data["network"] == "quic":
                    query_params.update({"quicSecurity": data["host"]})
                elif data["network"] == "grpc":
                    query_params.update({"authority": data["host"]})
                if data["network"] in ["ws", "h2", "httpupgrade", "xhttp", "splithttp"]:
                    query_params.update({"path": data["path"]})
                elif data["network"] == "quic":
                    query_params.update({"key": data["path"]})
                elif data["network"] == "grpc":
                    query_params.update({"serviceName": data["path"]})
                elif data["network"] == "kcp":
                    query_params.update({"seed": data["path"]})
                query = urllib.parse.urlencode(
                    {k: v for k, v in query_params.items() if v}
                )
                return (
                    f"{base}?{query}#{data['tag']}"
                    if query
                    else f"{base}#{data['tag']}"
                )

            def build_vmess_config(data: dict) -> str:
                vmess_data = {
                    "v": "2",
                    "ps": data["tag"],
                    "add": data["address"],
                    "port": str(data["port"]),
                    "id": data["id"],
                    "aid": str(data["alter_id"]),
                    "scy": data["scy"],
                    "net": data["network"],
                    "type": data["header_type"],
                    "sni": data["sni"],
                    "fp": data["fp"],
                    "host": data["host"],
                    "path": data["path"],
                    "alpn": data["alpn"],
                    "tls": data["security"],
                }
                if data["network"] == "xhttp":
                    vmess_data["type"] = mode.get()
                encoded = base64.b64encode(
                    json.dumps(vmess_data).encode("utf-8")
                ).decode("utf-8")
                return f"vmess://{encoded}"

            def build_trojan_config(data: dict) -> str:
                base = f"trojan://{data['password']}@{data['address']}:{data['port']}"
                query_params = {
                    "security": data["security"],
                    "sni": data["sni"],
                    "fp": data["fp"],
                    "mode": data["mode"],
                    "alpn": data["alpn"],
                    "pbk": data["pbk"],
                    "sid": data["sid"],
                    "spx": data["spx"],
                }
                if data["network"] in [
                    "tcp",
                    "ws",
                    "h2",
                    "httpupgrade",
                    "xhttp",
                    "splithttp",
                ]:
                    query_params.update({"host": data["host"]})
                elif data["network"] == "quic":
                    query_params.update({"quicSecurity": data["host"]})
                elif data["network"] == "grpc":
                    query_params.update({"authority": data["host"]})
                if data["network"] in ["ws", "h2", "httpupgrade", "xhttp", "splithttp"]:
                    query_params.update({"path": data["path"]})
                elif data["network"] == "quic":
                    query_params.update({"key": data["path"]})
                elif data["network"] == "grpc":
                    query_params.update({"serviceName": data["path"]})
                elif data["network"] == "kcp":
                    query_params.update({"seed": data["path"]})
                query = urllib.parse.urlencode(
                    {k: v for k, v in query_params.items() if v}
                )
                return (
                    f"{base}?{query}#{data['tag']}"
                    if query
                    else f"{base}#{data['tag']}"
                )

            def build_hysteria_config(data: dict) -> str:
                base = f"hy2://{data['password']}@{data['address']}:{data['port']}"
                query_params = {
                    "insecure": "1" if data["hy2_insecure"] else "0",
                    "obfs-password": data["hy2_obfs_password"],
                    "hopInterval": str(data["hy2_hop_interval"]),
                    "sni": data["sni"],
                    "alpn": data["alpn"],
                }
                query = urllib.parse.urlencode(
                    {k: v for k, v in query_params.items() if v}
                )
                return (
                    f"{base}?{query}#{data['tag']}"
                    if query
                    else f"{base}#{data['tag']}"
                )

            def build_wireguard_config(data: dict) -> str:
                base = f"wireguard://{urlencode(data['wg_secret_key'])}@{data['address']}:{data['port']}"
                query_params = {
                    "address": data["wg_address"],
                    "publicKey": data["wg_public_key"],
                    "reserved": data["wg_reserved"].replace(" ", ","),
                    "keepAlive": str(data["wg_keep_alive"]),
                    "mtu": str(data["wg_mtu"]),
                    "wnoise": data["wnoise"],
                    "wnoisecount": data["wnoisecount"],
                    "wnoisedelay": data["wnoisedelay"],
                    "wpayloadsize": data["wpayloadsize"],
                }
                query = urllib.parse.urlencode(
                    {k: v for k, v in query_params.items() if v}
                )
                return (
                    f"{base}?{query}#{data['tag']}"
                    if query
                    else f"{base}#{data['tag']}"
                )

            def build_socks_config(data: dict) -> str:
                auth = f"{data['user']}:{data['password']}".encode("utf-8")
                encoded_auth = base64.b64encode(auth).decode("utf-8")
                return f"socks://{encoded_auth}@{data['address']}:{data['port']}#{data['tag']}"

            def build_shadowsocks_config(data: dict) -> str:
                auth = f"{data['ss_method']}:{data['password']}".encode("utf-8")
                encoded_auth = base64.b64encode(auth).decode("utf-8")
                return f"ss://{encoded_auth}@{data['address']}:{data['port']}#{data['tag']}"

            ip_address = None
            ports = None
            secrekey = None
            sni = None
            fp = None
            alpn = None
            pbk = None
            sid = None
            spx = None
            flow = None
            encryption = None
            network = None
            header_type = None
            id = None
            alterid = None
            pass_w = None
            user = None
            r_host = None
            path = None
            insecure = None
            obfs_password = None
            porthopinginterval = None
            secrekey = None
            pbk = None
            reserved = None
            ip_address = None
            keepAlive = None
            mtu = None
            address = None
            wnoise = None
            wnoisecount = None
            wnoisedelay = None
            wpayloadsize = None
            remarks = None
            go_out_button = ctk.CTkButton(
                fram_top,
                command=exit_out,
                fg_color="transparent",
                hover_color="#DF9C27",
                width=25,
                image=back_arrow,
                text="",
            )
            go_out_button.pack(padx=(0, 10), pady=5, side=tk.RIGHT)
            save_button = ctk.CTkButton(
                fram_top,
                fg_color="transparent",
                command=lambda conifg=conifg, num=num: save_normal_conf_form(
                    conifg, num, remarks
                ),
                hover_color="#DF9C27",
                width=25,
                image=ip_cion,
                text="",
            )
            save_button.pack(padx=(5, 10), pady=5, side=tk.LEFT)
            restart_button = ctk.CTkButton(
                fram_top,
                fg_color="transparent",
                command=lambda conifg=conifg, num=num: restart_editing(conifg, num),
                hover_color="#DF9C27",
                width=25,
                image=update_icon,
                text="",
            )
            restart_button.pack(padx=(0, 0), pady=5, side=tk.LEFT)
            fram_in = ctk.CTkFrame(tabview.tab("edit"), height=500, width=500)
            fram_in.pack(fill=tk.BOTH, pady=(5, 5))
            fram_in_in_1 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_1.pack(fill=tk.X, pady=5, ipady=5, padx=5)
            remarks_la = ctk.CTkLabel(fram_in_in_1, text="remarks: ")
            remarks_la.pack(padx=(20, 0), side=tk.LEFT)
            remarks = ctk.CTkEntry(
                fram_in_in_1, textvariable=REMARKS_w, placeholder_text="remarks"
            )
            remarks.pack(fill=tk.X, side=tk.LEFT, padx=4)
            ip_address_la = ctk.CTkLabel(fram_in_in_1, text="address: ")
            ip_address_la.pack(padx=2, side=tk.LEFT)
            ip_address = ctk.CTkEntry(
                fram_in_in_1,
                textvariable=ADDRESS_w,
                placeholder_text="ip address(x.x.x.x)",
            )
            ip_address.pack(fill=tk.X, side=tk.LEFT, padx=2)
            fram_in_in_2 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_2.pack(fill=tk.X, pady=5, ipady=5, padx=5)
            ports_la = ctk.CTkLabel(fram_in_in_2, text="port: ")
            ports_la.pack(padx=(20, 0), side=tk.LEFT)
            ports = ctk.CTkEntry(
                fram_in_in_2, textvariable=PORT_w, placeholder_text="port"
            )
            ports.pack(fill=tk.X, side=tk.LEFT, padx=4)

            def set_type():
                fram_in_in_4.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                network_la = ctk.CTkLabel(fram_in_in_4, text="network: ")
                network_la.pack(padx=(20, 0), side=tk.LEFT)
                network.pack(fill=tk.X, side=tk.LEFT, padx=4)

            def check_type(typ: str):
                type_widgets = {
                    "tcp": {
                        "show": {
                            "labels": [header_type_la, r_host_la],
                            "entries": [header_type, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [path_la, path, mode_la, mode],
                        "header_values": ["none", "http"],
                    },
                    "kcp": {
                        "show": {
                            "labels": [header_type_la, path_la],
                            "entries": [header_type, path],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [r_host_la, r_host, mode_la, mode],
                        "header_values": [
                            "none",
                            "srtp",
                            "utp",
                            "wechat-video",
                            "dtls",
                            "wireguard",
                        ],
                    },
                    "quic": {
                        "show": {
                            "labels": [header_type_la, path_la, r_host_la],
                            "entries": [header_type, path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [mode_la, mode],
                        "header_values": [
                            "none",
                            "srtp",
                            "utp",
                            "wechat-video",
                            "dtls",
                            "wireguard",
                        ],
                    },
                    "grpc": {
                        "show": {
                            "labels": [mode_la, path_la, r_host_la],
                            "entries": [mode, path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type],
                        "mode_values": ["gun", "multi"],
                    },
                    "h2": {
                        "show": {
                            "labels": [path_la, r_host_la],
                            "entries": [path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type, mode_la, mode],
                        "header_values": [],
                    },
                    "splithttp": {
                        "show": {
                            "labels": [path_la, r_host_la],
                            "entries": [path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type, mode_la, mode],
                        "header_values": [],
                    },
                    "httpupgrade": {
                        "show": {
                            "labels": [path_la, r_host_la],
                            "entries": [path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type, mode_la, mode],
                        "header_values": [],
                    },
                    "xhttp": {
                        "show": {
                            "labels": [mode_la, path_la, r_host_la],
                            "entries": [mode, path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type],
                        "mode_values": ["auto", "packet-up", "stream-up", "stream-one"],
                    },
                    "ws": {
                        "show": {
                            "labels": [path_la, r_host_la],
                            "entries": [path, r_host],
                            "frame": [fram_in_in_5],
                        },
                        "hide": [header_type_la, header_type, mode_la, mode],
                        "header_values": [],
                    },
                }
                if TYPE in ["grpc", "xhttp"]:
                    mode_la.configure(text=f"{TYPE} mode:")
                config = type_widgets.get(typ, [])
                for frame in config["show"]["frame"]:
                    frame.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                for label_widget, entry in zip(
                    config["show"]["labels"], config["show"]["entries"]
                ):
                    label_widget.pack(padx=(20, 0), side=tk.LEFT)
                    entry.pack(fill=tk.X, side=tk.LEFT, padx=4)
                if config.get("header_values"):
                    header_type.configure(values=config["header_values"])
                    if config["header_values"]:
                        header_type.set(config["header_values"][0])
                if config.get("mode_values"):
                    mode.configure(values=config["mode_values"])
                    if config["mode_values"]:
                        mode.set(config["mode_values"][0])
                for widget in config["hide"]:
                    widget.pack_forget()

            def set__security():
                fram_in_in_6.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                tls_la = ctk.CTkLabel(fram_in_in_6, text="tls: ")
                tls_la.pack(padx=(20, 0), side=tk.LEFT)
                tls.pack(fill=tk.X, side=tk.LEFT, padx=4)

            def check_security(sec: str):
                sec_widget = {
                    "tls": {
                        "show": {
                            "frames": [fram_in_in_7],
                            "label": [sni_la, fp_la, alpn_la],
                            "other": [sni, fp, alpn],
                        },
                        "hide": [pbk_la, pbk, fram_in_in_8, sid_la, sid, spx_la, spx],
                    },
                    "reality": {
                        "show": {
                            "frames": [fram_in_in_7, fram_in_in_8],
                            "label": [sni_la, fp_la, pbk_la, sid_la, spx_la],
                            "other": [sni, fp, pbk, sid, spx],
                        },
                        "hide": [alpn, alpn_la],
                    },
                    "": {
                        "show": {"frames": [], "label": [], "other": []},
                        "hide": [
                            sni_la,
                            sni,
                            fram_in_in_7,
                            fp_la,
                            fp,
                            alpn_la,
                            alpn,
                            pbk_la,
                            pbk,
                            fram_in_in_8,
                            sid_la,
                            sid,
                            spx_la,
                            spx,
                        ],
                    },
                }
                shows_widet = sec_widget.get(sec, "").get("show", [])
                for frame in shows_widet["frames"]:
                    frame.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                for label, other in zip(shows_widet["label"], shows_widet["other"]):
                    label.pack(padx=(20, 0), side=tk.LEFT)
                    other.pack(fill=tk.X, side=tk.LEFT, padx=4)
                hide_widgets = sec_widget.get(sec, "").get("hide", [])
                for hide in hide_widgets:
                    hide.pack_forget()

            def un_chnage_network(test):
                TYPE = network.get()
                check_type(TYPE)

            def un_chnage_tls(test):
                SECURITY = tls.get()
                check_security(SECURITY)

            fram_in_in_3 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_4 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_5 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_6 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_7 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_8 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            fram_in_in_9 = ctk.CTkFrame(
                fram_in,
                height=100,
                border_width=1,
                border_color="#48adfa",
                corner_radius=5,
            )
            id = ctk.CTkEntry(
                master=fram_in_in_2, textvariable=ID_w, placeholder_text="id"
            )
            obfs_password_la = ctk.CTkLabel(fram_in_in_9, text="Obfs password: ")
            obfs_password = ctk.CTkEntry(
                master=fram_in_in_9,
                textvariable=OBFS_PASSWORD_w,
                placeholder_text="Obfs password",
            )
            porthopinginterval_la = ctk.CTkLabel(
                fram_in_in_9, text="hopping interval: "
            )
            porthopinginterval = ctk.CTkEntry(
                master=fram_in_in_9,
                textvariable=PORTHOPINGINTERVAL_w,
                placeholder_text="Port hopping interval(d: 30)",
            )
            insecure_la = ctk.CTkLabel(fram_in_in_7, text="allow insecure: ")
            insecure = ctk.CTkOptionMenu(
                master=fram_in_in_7, values=INSECURE_w, width=30
            )
            pinsha256_la = ctk.CTkLabel(fram_in_in_7, text="pinsha256: ")
            pinsha256 = ctk.CTkEntry(
                master=fram_in_in_7,
                textvariable=PINSHA256_w,
                placeholder_text="pinsha256",
            )
            flow = ctk.CTkOptionMenu(master=fram_in_in_3, values=FLOW_w, width=30)
            encryption = ctk.CTkEntry(
                master=fram_in_in_3,
                textvariable=ENCRYPTION_w,
                placeholder_text="encryption",
            )
            network = ctk.CTkOptionMenu(
                master=fram_in_in_4, values=TYPE_w, width=30, command=un_chnage_network
            )
            header_type = ctk.CTkOptionMenu(
                master=fram_in_in_4, values=network_head_values, width=30
            )
            mode = ctk.CTkOptionMenu(master=fram_in_in_4, width=30, values=MODE_w)
            r_host_la = ctk.CTkLabel(fram_in_in_5, text="requets host: ")
            r_host = ctk.CTkEntry(
                master=fram_in_in_5, textvariable=R_HOST_w, placeholder_text=""
            )
            path = ctk.CTkEntry(
                master=fram_in_in_5, textvariable=PATH_w, placeholder_text=""
            )
            path_la = ctk.CTkLabel(fram_in_in_5, text="path: ")
            tls = ctk.CTkOptionMenu(
                master=fram_in_in_6, width=3, values=TLS_w, command=un_chnage_tls
            )
            sni = ctk.CTkEntry(
                master=fram_in_in_6, textvariable=SNI_w, placeholder_text=""
            )
            fp = ctk.CTkOptionMenu(master=fram_in_in_7, width=30, values=FP_w)
            alpn = ctk.CTkOptionMenu(master=fram_in_in_7, width=30, values=ALPN_w)
            pbk = ctk.CTkEntry(
                master=fram_in_in_7, placeholder_text="", textvariable=PBK_w
            )
            sid = ctk.CTkEntry(
                master=fram_in_in_8, placeholder_text="", textvariable=SID_w
            )
            spx = ctk.CTkEntry(
                master=fram_in_in_8, placeholder_text="", textvariable=SPX_w
            )
            alterid = ctk.CTkEntry(
                master=fram_in_in_3, placeholder_text="alterid", textvariable=ALTERID_w
            )
            security = ctk.CTkOptionMenu(
                master=fram_in_in_3, values=SECURITY_w, width=30
            )
            pass_w = ctk.CTkEntry(
                master=fram_in_in_2, placeholder_text="password", textvariable=PASS_w
            )
            user = ctk.CTkEntry(
                master=fram_in_in_3, placeholder_text="user", textvariable=USER_w
            )
            sni_la = ctk.CTkLabel(fram_in_in_6, text="SNI: ")
            fp_la = ctk.CTkLabel(fram_in_in_7, text="Fingerprint: ")
            alpn_la = ctk.CTkLabel(fram_in_in_7, text="Alpn: ")
            pbk_la = ctk.CTkLabel(fram_in_in_7, text="PublicKey: ")
            sid_la = ctk.CTkLabel(fram_in_in_8, text="ShortId: ")
            spx_la = ctk.CTkLabel(fram_in_in_8, text="SpiderX: ")
            header_type_la = ctk.CTkLabel(fram_in_in_4, text="head type: ")
            mode_la = ctk.CTkLabel(fram_in_in_4, text="gRPC mode: ")
            if conifg.startswith("vless://") or conifg.startswith("vmess://"):
                id_la = ctk.CTkLabel(fram_in_in_2, text="id: ")
                id_la.pack(padx=2, side=tk.LEFT)
                id.pack(fill=tk.X, side=tk.LEFT, padx=2)
                if conifg.startswith("vless://"):
                    fram_in_in_3.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                    flow_la = ctk.CTkLabel(fram_in_in_3, text="flow: ")
                    flow_la.pack(padx=(20, 0), side=tk.LEFT)
                    flow.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    encryption_la = ctk.CTkLabel(fram_in_in_3, text="encryption: ")
                    encryption_la.pack(padx=(20, 0), side=tk.LEFT)
                    encryption.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    set_type()
                    check_type(TYPE)
                    set__security()
                    check_security(SECURITY)
                if conifg.startswith("vmess://"):
                    fram_in_in_3.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                    alterid_la = ctk.CTkLabel(fram_in_in_3, text="alterid: ")
                    alterid_la.pack(padx=(20, 0), side=tk.LEFT)
                    alterid.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    security_la = ctk.CTkLabel(fram_in_in_3, text="security: ")
                    security_la.pack(padx=(20, 0), side=tk.LEFT)
                    security.configure(values=SCY_w)
                    security.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    set_type()
                    check_type(TYPE)
                    set__security()
                    check_security(SECURITY)
            elif conifg.startswith("trojan://"):
                pass_w_la = ctk.CTkLabel(fram_in_in_2, text="password: ")
                pass_w_la.pack(padx=2, side=tk.LEFT)
                pass_w.pack(fill=tk.X, side=tk.LEFT, padx=2)
                set_type()
                check_type(TYPE)
                set__security()
                check_security(SECURITY)
            elif conifg.startswith("ss://"):
                pass_w_la = ctk.CTkLabel(fram_in_in_2, text="password: ")
                pass_w_la.pack(padx=2, side=tk.LEFT)
                pass_w.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_3.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                security_la = ctk.CTkLabel(fram_in_in_3, text="security: ")
                security_la.pack(padx=(20, 0), side=tk.LEFT)
                security.pack(fill=tk.X, side=tk.LEFT, padx=4)
            elif conifg.startswith("socks://"):
                pass_w_la = ctk.CTkLabel(fram_in_in_2, text="password: ")
                pass_w_la.pack(padx=2, side=tk.LEFT)
                pass_w.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_3.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                user_la = ctk.CTkLabel(fram_in_in_3, text="user: ")
                user_la.pack(padx=(20, 0), side=tk.LEFT)
                user.pack(fill=tk.X, side=tk.LEFT, padx=2)
            elif conifg.startswith("wireguard://"):
                secrekey_la = ctk.CTkLabel(fram_in_in_2, text="secret or Private key: ")
                secrekey_la.pack(padx=2, side=tk.LEFT)
                secrekey = ctk.CTkEntry(
                    fram_in_in_2, textvariable=SECERKEY_w, placeholder_text="secret key"
                )
                secrekey.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_3.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                pbk_la = ctk.CTkLabel(fram_in_in_3, text="PublicKey: ")
                pbk_la.pack(padx=(20, 0), side=tk.LEFT)
                pbk = ctk.CTkEntry(
                    fram_in_in_3, textvariable=PBK_w, placeholder_text="pbk"
                )
                pbk.pack(fill=tk.X, side=tk.LEFT, padx=2)
                reserved_la = ctk.CTkLabel(fram_in_in_3, text="reserved: ")
                reserved_la.pack(padx=(20, 0), side=tk.LEFT)
                reserved = ctk.CTkEntry(
                    fram_in_in_3, textvariable=RESERVED_w, placeholder_text="reserved"
                )
                reserved.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_5.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                address_la = ctk.CTkLabel(fram_in_in_5, text="address: ")
                address_la.pack(padx=(20, 0), side=tk.LEFT)
                address = ctk.CTkEntry(
                    fram_in_in_5, textvariable=LOCAL_add_w, placeholder_text="address"
                )
                address.pack(fill=tk.X, side=tk.LEFT, padx=2)
                mtu_la = ctk.CTkLabel(fram_in_in_5, text="mtu: ")
                mtu_la.pack(padx=(20, 0), side=tk.LEFT)
                mtu = ctk.CTkEntry(
                    fram_in_in_5, textvariable=MTU_w, placeholder_text="mtu"
                )
                mtu.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_6.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                keepAlive_la = ctk.CTkLabel(fram_in_in_6, text="keepAlive: ")
                keepAlive_la.pack(padx=(20, 0), side=tk.LEFT)
                keepAlive = ctk.CTkEntry(
                    fram_in_in_6, textvariable=KEEPALIVE_w, placeholder_text="keepAlive"
                )
                keepAlive.pack(fill=tk.X, side=tk.LEFT, padx=2)
                wnoise_la = ctk.CTkLabel(fram_in_in_6, text="wnoise: ")
                wnoise_la.pack(padx=(20, 0), side=tk.LEFT)
                wnoise = ctk.CTkEntry(
                    fram_in_in_6, textvariable=WNOISE_w, placeholder_text="wnoise"
                )
                wnoise.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_7 = ctk.CTkFrame(
                    fram_in,
                    height=100,
                    border_width=1,
                    border_color="#48adfa",
                    corner_radius=5,
                )
                fram_in_in_7.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                wnoisecount_la = ctk.CTkLabel(fram_in_in_7, text="wnoisecount: ")
                wnoisecount_la.pack(padx=(20, 0), side=tk.LEFT)
                wnoisecount = ctk.CTkEntry(
                    fram_in_in_7,
                    textvariable=WNOISECOUNT_w,
                    placeholder_text="wnoisecount",
                )
                wnoisecount.pack(fill=tk.X, side=tk.LEFT, padx=2)
                wnoisedelay_la = ctk.CTkLabel(fram_in_in_7, text="wnoisedelay: ")
                wnoisedelay_la.pack(padx=(20, 0), side=tk.LEFT)
                wnoisedelay = ctk.CTkEntry(
                    fram_in_in_7,
                    textvariable=WNOISEDELAY_w,
                    placeholder_text="wnoisedelay",
                )
                wnoisedelay.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_8 = ctk.CTkFrame(
                    fram_in,
                    height=100,
                    border_width=1,
                    border_color="#48adfa",
                    corner_radius=5,
                )
                fram_in_in_8.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                wpayloadsize_la = ctk.CTkLabel(fram_in_in_8, text="wpayloadsize: ")
                wpayloadsize_la.pack(padx=(20, 0), side=tk.LEFT)
                wpayloadsize = ctk.CTkEntry(
                    fram_in_in_8,
                    textvariable=WPAYLOADSIZE_w,
                    placeholder_text="wpayloadsize",
                )
                wpayloadsize.pack(fill=tk.X, side=tk.LEFT, padx=2)
            elif conifg.startswith("hy2://") or conifg.startswith("hysteria2://"):
                pass_w_la = ctk.CTkLabel(fram_in_in_2, text="password: ")
                pass_w_la.pack(padx=2, side=tk.LEFT)
                pass_w.pack(fill=tk.X, side=tk.LEFT, padx=2)
                fram_in_in_9.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                obfs_password_la.pack(padx=(20, 0), side=tk.LEFT)
                obfs_password.pack(fill=tk.X, side=tk.LEFT, padx=4)
                pack_widgets(
                    [porthopinginterval_la, porthopinginterval],
                    fill=tk.X,
                    side=tk.LEFT,
                    padx=4,
                )
                tls_la = ctk.CTkLabel(fram_in_in_6, text="tls: ")
                tls_la.pack(padx=(20, 0), side=tk.LEFT)
                tls.pack(fill=tk.X, side=tk.LEFT, padx=4)
                fram_in_in_6.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                print("es")
                if SECURITY == "tls":
                    sni_la.pack(padx=(20, 0), side=tk.LEFT)
                    sni.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    fram_in_in_7.pack(fill=tk.X, pady=5, ipady=5, padx=5)
                    insecure_la.pack(padx=(20, 0), side=tk.LEFT)
                    insecure.pack(fill=tk.X, side=tk.LEFT, padx=4)
                    pinsha256_la.pack(padx=(20, 0), side=tk.LEFT)
                    pinsha256.pack(fill=tk.X, side=tk.LEFT, padx=4)
            is_editing = False
            return

        ##################################################################################################
        def parse_yaml_hy2():
            yaml_hy2 = {
                "server": ADDRESS + ":" + str(PORT),
                "auth": PASS,
                "transport": {
                    "type": "udp",
                    "udp": {"hopInterval": str(PORTHOPINGINTERVAL) + "s"},
                },
            }
            if SECURITY == "tls":
                tlsin = {"tls": {"insecure": INSECURE}}
                if SNI != "":
                    tlsin.update({"sni": SNI})
                if PINSHA256 != "":
                    tlsin.update({"pinSHA256": PINSHA256})
                yaml_hy2.update(tlsin)
            if OBFS == "salamander":
                obfsin = {
                    "obfs": {
                        "type": "salamander",
                        "salamander": {"password": OBFS_PASSWORD},
                    }
                }
                yaml_hy2.update(obfsin)
            nest_yaml_hy2 = {
                "bandwidth": {"up": "20 mbps", "down": "100 mbps"},
                "quic": {
                    "initStreamReceiveWindow": 8388608,
                    "maxStreamReceiveWindow": 8388608,
                    "initConnReceiveWindow": 20971520,
                    "maxConnReceiveWindow": 20971520,
                    "maxIdleTimeout": "30s",
                    "keepAlivePeriod": "10s",
                    "disablePathMTUDiscovery": False,
                },
                "fastOpen": True,
                "lazy": True,
                "socks5": {
                    "listen": LOCAL_HOST + ":" + str(SOCKS5 + 2),
                },
                "http": {"listen": LOCAL_HOST + ":" + str(HTTP5 + 2)},
            }
            yaml_hy2.update(nest_yaml_hy2)
            return yaml_hy2

        if conifg.startswith("hy2://") or conifg.startswith("hysteria2://"):
            with open(hy2_path, "w") as f:
                yaml.dump(parse_yaml_hy2(), f)
            return parse_configs(
                conifg=f"socks://Og==@{LOCAL_HOST}:{str(SOCKS5 + 2)}#hy2", cv=cv
            )
        try:
            ALPN = ALPN.split(",")
        except Exception:
            pass
        logBean = V2rayConfigLogBean(
            "", "", LOGLEVEL
        )  # Make sure to adjust the imports for these
        inboundBean = V2rayConfig.InboundBean(
            tag="socks",
            port=SOCKS5,
            protocol="socks",
            listen=LOCAL_HOST,
            sniffing=V2rayConfig.InboundBean.SniffingBean(False, [], routeOnly=False),
            settings=V2rayConfig.InboundBean.InSettingsBean(
                auth="noauth", udp=True, allowTransparent=False
            ),
        )
        inboundBean2 = V2rayConfig.InboundBean(
            tag="http",
            listen=LOCAL_HOST,
            port=HTTP5,
            protocol="http",
            settings=V2rayConfig.InboundBean.InSettingsBean(userLevel=8),
        )
        sniff_list = []
        sniff_enable = False
        if SNIFFING:
            sniff_list += ["http", "tls"]
            sniff_enable = True
        if ENABLELOCALDNS:
            if ENABLEFAKEDNS:
                inboundBean = V2rayConfig.InboundBean(
                    tag="socks",
                    port=SOCKS5,
                    protocol="socks",
                    listen=LOCAL_HOST,
                    sniffing=V2rayConfig.InboundBean.SniffingBean(
                        True, sniff_list + ["fakedns"], routeOnly=False
                    ),
                    settings=V2rayConfig.InboundBean.InSettingsBean(
                        auth="noauth", udp=True, allowTransparent=False
                    ),
                )
                inboundBean3 = V2rayConfig.InboundBean(
                    listen=LOCAL_HOST,
                    port=LOCALDNSPORT,
                    protocol="dokodemo-door",
                    settings=V2rayConfig.InboundBean.InSettingsBean(
                        address="8.8.8.8", network="tcp,udp", port=53
                    ),
                    tag="dns-in",
                )
            else:
                inboundBean = V2rayConfig.InboundBean(
                    tag="socks",
                    port=SOCKS5,
                    protocol="socks",
                    listen=LOCAL_HOST,
                    sniffing=V2rayConfig.InboundBean.SniffingBean(
                        sniff_enable, sniff_list, routeOnly=False
                    ),
                    settings=V2rayConfig.InboundBean.InSettingsBean(
                        auth="noauth", udp=True, allowTransparent=False
                    ),
                )
                inboundBean3 = V2rayConfig.InboundBean(
                    listen=LOCAL_HOST,
                    port=LOCALDNSPORT,
                    protocol="dokodemo-door",
                    settings=V2rayConfig.InboundBean.InSettingsBean(
                        address="8.8.8.8", network="tcp,udp", port=53
                    ),
                    tag="dns-in",
                )
        outboundBean = ""
        if IS_WARP_ON_WARP:
            outboundBeanwow = V2rayConfig.OutboundBean(
                tag="warp-out",
                protocol="wireguard",
                settings=V2rayConfig.OutboundBean.OutSettingsBean(
                    address=ADDRESSON,
                    mtu=MTUON,
                    reserved=RESERVEDON,
                    secretKey=SECERKEYON,
                    wnoise=WNOISEON,
                    wnoisecount=WNOISECOUNTON,
                    wnoisedelay=WNOISEDELAYON,
                    wpayloadsize=WPAYLOADSIZEON,
                    keepAlive=KEEPALIVEON,
                    peers=[
                        V2rayConfig.OutboundBean.OutSettingsBean.WireGuardBean(
                            endpoint=ENDPOINTON + ":" + str(PORTON), publicKey=PBKON
                        )
                    ],
                ),
                streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                    network="tcp",
                    security="",
                    sockopt=V2rayConfig.OutboundBean.SockoptBean(dialerProxy="proxy"),
                ),
            )
        rulesBean = []
        domainrule = []
        iprule = []
        domaindirectdns = []
        hostdomains = {"domain:googleapis.cn": "googleapis.com"}
        if CUSTOMRULES_PROXY[0] != "":
            for i in CUSTOMRULES_PROXY:
                found_num = any(ch.isdigit() for ch in i)
                if not found_num and "geoip" not in i:
                    domainrule.append(i)
                else:
                    iprule.append(i)
            if domainrule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field",
                        domain=domainrule,
                        outboundTag="proxy",
                        enabled=True,
                    )
                )
            if iprule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field", ip=iprule, outboundTag="proxy", enabled=True
                    )
                )
            domainrule = []
            iprule = []
        if CUSTOMRULES_DIRECT[0] != "":
            for i in CUSTOMRULES_DIRECT:
                found_num = any(ch.isdigit() for ch in i)
                if not found_num and "geoip" not in i:
                    domainrule.append(i)
                else:
                    iprule.append(i)
                domaindirectdns.extend(domainrule)
            if domainrule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field",
                        domain=domainrule,
                        outboundTag="direct",
                        enabled=True,
                    )
                )
            if iprule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field", ip=iprule, outboundTag="direct", enabled=True
                    )
                )
            domainrule = []
            iprule = []
        if CUSTOMRULES_BLOCKED[0] != "":
            for i in CUSTOMRULES_BLOCKED:
                found_num = any(ch.isdigit() for ch in i)
                if not found_num and "geoip" not in i:
                    domainrule.append(i)
                else:
                    iprule.append(i)
                if "geosite" in i or "domain" in i:
                    hostdomains.update({f"{i}": LOCAL_HOST})
            if domainrule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field",
                        domain=domainrule,
                        outboundTag="block",
                        enabled=True,
                    )
                )
            if iprule != []:
                rulesBean.append(
                    V2rayConfig.RoutingBean.RulesBean(
                        type="field", ip=iprule, outboundTag="block", enabled=True
                    )
                )
        hostdomains.update(
            {
                "dns.pub": ["1.12.12.12", "120.53.53.53"],
                "dns.alidns.com": [
                    "223.5.5.5",
                    "223.6.6.6",
                    "2400:3200::1",
                    "2400:3200:baba::1",
                ],
                "one.one.one.one": [
                    "1.1.1.1",
                    "1.0.0.1",
                    "2606:4700:4700::1111",
                    "2606:4700:4700::1001",
                ],
                "dns.google": [
                    "8.8.8.8",
                    "8.8.4.4",
                    "2001:4860:4860::8888",
                    "2001:4860:4860::8844",
                ],
            }
        )
        routingBean = V2rayConfig.RoutingBean(
            domainStrategy=DOMAINSTRATEGY, rules=rulesBean
        )
        ######servers
        if not ENABLELOCALDNS:
            dnsBeanSERVERS = [REMOTEDNS]
        else:
            if not ENABLEFAKEDNS:
                dnsBeanSERVERS = [
                    V2rayConfig.DnsBean.ServersBean(
                        address=DOMESTICDNS,
                        domains=["geosite:cn"] + domaindirectdns,
                        expectIPs=["geoip:cn"],
                        port=53,
                    ),
                    REMOTEDNS,
                ]
            else:
                dnsBeanSERVERS = [
                    V2rayConfig.DnsBean.ServersBean(
                        address=DOMESTICDNS,
                        domains=["geosite:cn"] + domaindirectdns,
                        expectIPs=["geoip:cn"],
                        port=53,
                    ),
                    V2rayConfig.DnsBean.ServersBean(
                        address="fakedns", domains=["geosite:cn"] + domaindirectdns
                    ),
                    REMOTEDNS,
                ]
        dnsBean = V2rayConfig.DnsBean(
            hosts=hostdomains,
            servers=dnsBeanSERVERS,
            fakedns=V2rayConfig.FakednsBean(ipPool="198.18.0.0/15", poolSize=10000),
        )

        def check_type():
            header = V2rayConfig.OutboundBean.HeaderBean()
            if HEADER_TYPE == "http" and TYPE == "tcp":
                headers = V2rayConfig.OutboundBean.HeadersBean(
                    Connection=["keep-alive"],
                    Host=[R_HOST],
                    Pragma="no-cache",
                    acceptEncoding=["gzip, deflate"],
                    userAgent=[
                        "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36",
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/53.0.2785.109 Mobile/14A456 Safari/601.1.46",
                    ],
                )
                requests = V2rayConfig.OutboundBean.RequestBean(
                    headers=headers, method="GET", path=PATH, version="1.1"
                )
                header = V2rayConfig.OutboundBean.HeaderBean(
                    type="http", request=requests
                )
            outboundBean_Stream_tcpsettings = V2rayConfig.OutboundBean.TcpSettingsBean(
                header=header
            )
            if TYPE == "kcp":
                outboundBean_Stream_kcp_settings = (
                    V2rayConfig.OutboundBean.KcpSettingsBean(
                        congestion=False,
                        downlinkCapacity=100,
                        header=V2rayConfig.OutboundBean.HeaderBean(type=HEADER_TYPE),
                        mtu=1350,
                        readBufferSize=1,
                        seed=PATH,
                        tti=50,
                        uplinkCapacity=12,
                        writeBufferSize=1,
                    )
                )
            elif TYPE == "ws":
                outboundBean_Stream_ws_settings = (
                    V2rayConfig.OutboundBean.WsSettingsBean(
                        headers=V2rayConfig.OutboundBean.HeadersBean(
                            Host=R_HOST,
                            userAgent=None,
                            acceptEncoding=None,
                            Connection=None,
                            Pragma=None,
                            Host_single=None,
                        ),
                        path=PATH,
                    )
                )
            elif TYPE == "httpupgrade":
                outboundBean_Stream_httpupgrade_settings = (
                    V2rayConfig.OutboundBean.HttpupgradeSettingsBean(
                        host=R_HOST, path=PATH
                    )
                )
            elif TYPE == "xhttp":
                outboundBean_Stream_xhttp_settings = (
                    V2rayConfig.OutboundBean.XhttpSettingsBean(
                        host=R_HOST,
                        path=PATH,
                        mode=MODE,
                    )
                )
            elif TYPE == "splithttp":
                outboundBean_Stream_splithttp_settings = (
                    V2rayConfig.OutboundBean.SplithttpSettingsBean(
                        host=R_HOST, path=PATH
                    )
                )
            elif TYPE == "h2":
                outboundBean_Stream_h2_settings = (
                    V2rayConfig.OutboundBean.HttpSettingsBean(host=[R_HOST], path=PATH)
                )
            elif TYPE == "quic":
                outboundBean_Stream_quic_settings = (
                    V2rayConfig.OutboundBean.QuicSettingBean(
                        header=V2rayConfig.OutboundBean.HeaderBean(type=HEADER_TYPE),
                        key=PATH,
                        security=R_HOST,
                    )
                )
            elif TYPE == "grpc":
                outboundBean_Stream_grpc_settings = (
                    V2rayConfig.OutboundBean.GrpcSettingsBean(
                        authority=R_HOST,
                        serviceName=PATH,
                        multiMode=MODE,
                    )
                )
            if SECURITY != "reality":
                outboundBean_Stream_tlssettings = (
                    V2rayConfig.OutboundBean.TlsSettingsBean(
                        allowInsecure=ALLOWINCREASE,
                        alpn=ALPN,
                        fingerprint=FP,
                        serverName=SNI,
                        show=False,
                    )
                )
            else:
                outboundBean_Stream_tlssettings = (
                    V2rayConfig.OutboundBean.TlsSettingsBean(
                        allowInsecure=ALLOWINCREASE,
                        alpn=ALPN,
                        fingerprint=FP,
                        publicKey=PBK,
                        serverName=SNI,
                        shortId=SID,
                        spiderX=SPX,
                        show=False,
                    )
                )
            if FRAGMENT:
                if SECURITY == "reality":
                    if TYPE == "tcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="tcp",
                                security=SECURITY,
                                tcpSettings=outboundBean_Stream_tcpsettings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "kcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="kcp",
                                security=SECURITY,
                                kcpSettings=outboundBean_Stream_kcp_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "ws":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="ws",
                                security=SECURITY,
                                wsSettings=outboundBean_Stream_ws_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "httpupgrade":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="httpupgrade",
                            security=SECURITY,
                            httpupgradeSettings=outboundBean_Stream_httpupgrade_settings,
                            realitySettings=outboundBean_Stream_tlssettings,
                            sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
                            ),
                        )
                    elif TYPE == "xhttp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="httpx",
                                security=SECURITY,
                                xhttpSettings=outboundBean_Stream_xhttp_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "splithttp":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="splithttp",
                            security=SECURITY,
                            splithttpSettings=outboundBean_Stream_splithttp_settings,
                            realitySettings=outboundBean_Stream_tlssettings,
                            sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
                            ),
                        )
                    elif TYPE == "h2":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="h2",
                                security=SECURITY,
                                httpSettings=outboundBean_Stream_h2_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "quic":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="quic",
                                security=SECURITY,
                                quicSettings=outboundBean_Stream_quic_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "grpc":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="grpc",
                                security=SECURITY,
                                grpcSettings=outboundBean_Stream_grpc_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                else:
                    if TYPE == "tcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="tcp",
                                security=SECURITY,
                                tcpSettings=outboundBean_Stream_tcpsettings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "kcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="kcp",
                                security=SECURITY,
                                kcpSettings=outboundBean_Stream_kcp_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "ws":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="ws",
                                security=SECURITY,
                                wsSettings=outboundBean_Stream_ws_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "httpupgrade":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="httpupgrade",
                            security=SECURITY,
                            httpupgradeSettings=outboundBean_Stream_httpupgrade_settings,
                            tlsSettings=outboundBean_Stream_tlssettings,
                            sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
                            ),
                        )
                    elif TYPE == "xhttp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="httpx",
                                security=SECURITY,
                                xhttpSettings=outboundBean_Stream_xhttp_settings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "splithttp":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="splithttp",
                            security=SECURITY,
                            splithttpSettings=outboundBean_Stream_splithttp_settings,
                            tlsSettings=outboundBean_Stream_tlssettings,
                            sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
                            ),
                        )
                    elif TYPE == "h2":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="h2",
                                security=SECURITY,
                                httpSettings=outboundBean_Stream_h2_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "quic":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="quic",
                                security=SECURITY,
                                quicSettings=outboundBean_Stream_quic_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
                    elif TYPE == "grpc":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="grpc",
                                security=SECURITY,
                                grpcSettings=outboundBean_Stream_grpc_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                                    dialerProxy="fragment",
                                    tcpKeepAliveIdle=100,
                                    mark=255,
                                ),
                            )
                        )
            else:
                if SECURITY == "reality":
                    if TYPE == "tcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="tcp",
                                security=SECURITY,
                                tcpSettings=outboundBean_Stream_tcpsettings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "kcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="kcp",
                                security=SECURITY,
                                kcpSettings=outboundBean_Stream_kcp_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "ws":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="ws",
                                security=SECURITY,
                                wsSettings=outboundBean_Stream_ws_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "httpupgrade":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="httpupgrade",
                            security=SECURITY,
                            httpupgradeSettings=outboundBean_Stream_httpupgrade_settings,
                            realitySettings=outboundBean_Stream_tlssettings,
                        )
                    elif TYPE == "xhttp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="httpx",
                                security=SECURITY,
                                xhttpSettings=outboundBean_Stream_xhttp_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "splithttp":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="splithttp",
                            security=SECURITY,
                            splithttpSettings=outboundBean_Stream_splithttp_settings,
                            realitySettings=outboundBean_Stream_tlssettings,
                        )
                    elif TYPE == "h2":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="h2",
                                security=SECURITY,
                                httpSettings=outboundBean_Stream_h2_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "quic":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="quic",
                                security=SECURITY,
                                quicSettings=outboundBean_Stream_quic_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "grpc":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="grpc",
                                security=SECURITY,
                                grpcSettings=outboundBean_Stream_grpc_settings,
                                realitySettings=outboundBean_Stream_tlssettings,
                            )
                        )
                else:
                    if TYPE == "tcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="tcp",
                                security=SECURITY,
                                tcpSettings=outboundBean_Stream_tcpsettings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "kcp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="kcp",
                                security=SECURITY,
                                kcpSettings=outboundBean_Stream_kcp_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "ws":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="ws",
                                security=SECURITY,
                                wsSettings=outboundBean_Stream_ws_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "httpupgrade":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="httpupgrade",
                            security=SECURITY,
                            httpupgradeSettings=outboundBean_Stream_httpupgrade_settings,
                            tlsSettings=outboundBean_Stream_tlssettings,
                        )
                    elif TYPE == "xhttp":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="httpx",
                                security=SECURITY,
                                xhttpSettings=outboundBean_Stream_xhttp_settings,
                            )
                        )
                    elif TYPE == "splithttp":
                        outboundBean_Stream_tcp = V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="splithttp",
                            security=SECURITY,
                            splithttpSettings=outboundBean_Stream_splithttp_settings,
                            tlsSettings=outboundBean_Stream_tlssettings,
                        )
                    elif TYPE == "h2":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="h2",
                                security=SECURITY,
                                httpSettings=outboundBean_Stream_h2_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "quic":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="quic",
                                security=SECURITY,
                                quicSettings=outboundBean_Stream_quic_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
                    elif TYPE == "grpc":
                        outboundBean_Stream_tcp = (
                            V2rayConfig.OutboundBean.StreamSettingsBean(
                                network="grpc",
                                security=SECURITY,
                                grpcSettings=outboundBean_Stream_grpc_settings,
                                tlsSettings=outboundBean_Stream_tlssettings,
                            )
                        )
            return outboundBean_Stream_tcp

        if conifg.startswith("vless://"):
            outboundBean_Stream_tcp = check_type()
            outboundBean = V2rayConfig.OutboundBean(
                tag="proxy",
                protocol="vless",
                settings=V2rayConfig.OutboundBean.OutSettingsBean(
                    vnext=[
                        V2rayConfig.OutboundBean.OutSettingsBean.VnextBean(
                            address=ADDRESS,
                            port=PORT,
                            users=[
                                V2rayConfig.OutboundBean.OutSettingsBean.VnextBean.UsersBean(
                                    id=ID,
                                    security="auto",
                                    level=8,
                                    encryption=ENCRYPTION,
                                    flow=FLOW,
                                    alterId=0,
                                )
                            ],
                        )
                    ]
                ),
                mux=V2rayConfig.OutboundBean.MuxBean(
                    enabled=MUX_ENABLE,
                    concurrency=CONCURRENCY,
                    xudpConcurrency=CONCURRENCY,
                    xudpProxyUDP443="",
                ),
                streamSettings=outboundBean_Stream_tcp,
            )
        elif conifg.startswith("vmess://"):
            outboundBean_Stream_tcp = check_type()
            outboundBean = V2rayConfig.OutboundBean(
                tag="proxy",
                protocol="vmess",
                settings=V2rayConfig.OutboundBean.OutSettingsBean(
                    vnext=[
                        V2rayConfig.OutboundBean.OutSettingsBean.VnextBean(
                            address=ADDRESS,
                            port=PORT,
                            users=[
                                V2rayConfig.OutboundBean.OutSettingsBean.VnextBean.UsersBean(
                                    id=ID,
                                    security=SCY,
                                    level=8,
                                    encryption="",
                                    flow="",
                                    alterId=ALTERID,
                                )
                            ],
                        )
                    ]
                ),
                mux=V2rayConfig.OutboundBean.MuxBean(
                    enabled=MUX_ENABLE,
                    concurrency=CONCURRENCY,
                    xudpConcurrency=CONCURRENCY,
                    xudpProxyUDP443="",
                ),
                streamSettings=outboundBean_Stream_tcp,
            )
        elif conifg.startswith("trojan://"):
            outboundBean_Stream_tcp = check_type()
            outboundBean = V2rayConfig.OutboundBean(
                tag="proxy",
                protocol="trojan",
                mux=V2rayConfig.OutboundBean.MuxBean(
                    enabled=MUX_ENABLE,
                    concurrency=CONCURRENCY,
                    xudpConcurrency=CONCURRENCY,
                    xudpProxyUDP443="",
                ),
                streamSettings=outboundBean_Stream_tcp,
                settings=V2rayConfig.OutboundBean.OutSettingsBean(
                    servers=[
                        V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                            address=ADDRESS,
                            port=PORT,
                            method="chacha20-poly1305",
                            ota=False,
                            level=8,
                            password=PASS,
                        )
                    ]
                ),
            )
        elif conifg.startswith("ss://"):
            sockopt = V2rayConfig.OutboundBean.SockoptBean(
                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
            )
            if FRAGMENT:
                outboundBean = V2rayConfig.OutboundBean(
                    tag="proxy",
                    protocol="shadowsocks",
                    streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                        network="tcp", security="", sockopt=sockopt
                    ),
                    mux=V2rayConfig.OutboundBean.MuxBean(
                        enabled=MUX_ENABLE,
                        concurrency=CONCURRENCY,
                        xudpConcurrency=CONCURRENCY,
                        xudpProxyUDP443="",
                    ),
                    settings=V2rayConfig.OutboundBean.OutSettingsBean(
                        servers=[
                            V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                address=ADDRESS,
                                method=METHOD,
                                port=PORT,
                                ota=False,
                                level=8,
                                password=PASS,
                            )
                        ]
                    ),
                )
            else:
                outboundBean = V2rayConfig.OutboundBean(
                    tag="proxy",
                    protocol="shadowsocks",
                    streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                        network="tcp", security=""
                    ),
                    mux=V2rayConfig.OutboundBean.MuxBean(
                        enabled=MUX_ENABLE,
                        concurrency=CONCURRENCY,
                        xudpConcurrency=CONCURRENCY,
                        xudpProxyUDP443="",
                    ),
                    settings=V2rayConfig.OutboundBean.OutSettingsBean(
                        servers=[
                            V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                address=ADDRESS,
                                port=PORT,
                                method=METHOD,
                                ota=False,
                                level=8,
                                password=PASS,
                            )
                        ]
                    ),
                )
        elif conifg.startswith("socks://"):
            if is_hy2:
                FRAGMENT = False
                IS_WARP_ON_WARP = False
                MUX_ENABLE = False
            print(FRAGMENT, is_hy2)
            sockopt = V2rayConfig.OutboundBean.SockoptBean(
                dialerProxy="fragment", tcpKeepAliveIdle=100, mark=255
            )
            if FRAGMENT == False:
                if PASS == "" and USER == "":
                    outboundBean = V2rayConfig.OutboundBean(
                        tag="proxy",
                        protocol="socks",
                        streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="tcp", security=""
                        ),
                        mux=V2rayConfig.OutboundBean.MuxBean(
                            enabled=MUX_ENABLE,
                            concurrency=CONCURRENCY,
                            xudpConcurrency=CONCURRENCY,
                            xudpProxyUDP443="",
                        ),
                        settings=V2rayConfig.OutboundBean.OutSettingsBean(
                            servers=[
                                V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                    address=ADDRESS,
                                    method=METHOD,
                                    port=PORT,
                                    ota=False,
                                    level=8,
                                    password="",
                                )
                            ]
                        ),
                    )
                else:
                    outboundBean = V2rayConfig.OutboundBean(
                        tag="proxy",
                        protocol="socks",
                        streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="tcp", security=""
                        ),
                        mux=V2rayConfig.OutboundBean.MuxBean(
                            enabled=MUX_ENABLE,
                            concurrency=CONCURRENCY,
                            xudpConcurrency=CONCURRENCY,
                            xudpProxyUDP443="",
                        ),
                        settings=V2rayConfig.OutboundBean.OutSettingsBean(
                            servers=[
                                V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                    address=ADDRESS,
                                    method=METHOD,
                                    port=PORT,
                                    ota=False,
                                    level=8,
                                    password="",
                                    users=V2rayConfig.OutboundBean.OutSettingsBean.ServersBean.SocksUsersBean(
                                        level=8, passw=PASS, user=USER
                                    ),
                                )
                            ]
                        ),
                    )
            else:
                if PASS == "" and USER == "":
                    outboundBean = V2rayConfig.OutboundBean(
                        tag="proxy",
                        protocol="socks",
                        streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="tcp", security="", sockopt=sockopt
                        ),
                        mux=V2rayConfig.OutboundBean.MuxBean(
                            enabled=MUX_ENABLE,
                            concurrency=CONCURRENCY,
                            xudpConcurrency=CONCURRENCY,
                            xudpProxyUDP443="",
                        ),
                        settings=V2rayConfig.OutboundBean.OutSettingsBean(
                            servers=[
                                V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                    address=ADDRESS,
                                    method=METHOD,
                                    port=PORT,
                                    ota=False,
                                    level=8,
                                    password="",
                                )
                            ]
                        ),
                    )
                else:
                    outboundBean = V2rayConfig.OutboundBean(
                        tag="proxy",
                        protocol="socks",
                        streamSettings=V2rayConfig.OutboundBean.StreamSettingsBean(
                            network="tcp", security="", sockopt=sockopt
                        ),
                        mux=V2rayConfig.OutboundBean.MuxBean(
                            enabled=MUX_ENABLE,
                            concurrency=CONCURRENCY,
                            xudpConcurrency=CONCURRENCY,
                            xudpProxyUDP443="",
                        ),
                        settings=V2rayConfig.OutboundBean.OutSettingsBean(
                            servers=[
                                V2rayConfig.OutboundBean.OutSettingsBean.ServersBean(
                                    address=ADDRESS,
                                    method=METHOD,
                                    port=PORT,
                                    ota=False,
                                    level=8,
                                    password="",
                                    users=V2rayConfig.OutboundBean.OutSettingsBean.ServersBean.SocksUsersBean(
                                        level=8, passw=PASS, user=USER
                                    ),
                                )
                            ]
                        ),
                    )
        elif conifg.startswith("wireguard://"):
            FRAGMENT = False
            is_warp = True
            outboundBean = V2rayConfig.OutboundBean(
                tag="proxy",
                protocol="wireguard",
                settings=V2rayConfig.OutboundBean.OutSettingsBean(
                    address=ADDRESS,
                    mtu=MTU,
                    reserved=RESERVED,
                    secretKey=SECERKEY,
                    wnoise=WNOISE,
                    wnoisecount=WNOISECOUNT,
                    wnoisedelay=WNOISEDELAY,
                    wpayloadsize=WPAYLOADSIZE,
                    keepAlive=KEEPALIVE,
                    peers=[
                        V2rayConfig.OutboundBean.OutSettingsBean.WireGuardBean(
                            endpoint=ENDPOINT + ":" + str(PORT), publicKey=PBK
                        )
                    ],
                ),
            )
        end_outbound_bf_frg_set = V2rayConfig.OutboundBean.BeforeFrgSettings(
            tag="direct", protocol="freedom", settings={}
        )
        end_outbound_bf_frg_set2 = V2rayConfig.OutboundBean.BeforeFrgSettings(
            tag="block", protocol="blackhole", settings={"response": {"type": "http"}}
        )
        if FRAGMENT:
            if FAKEHOST_ENABLE:
                frg = V2rayConfig.OutboundBean.OutSettingsBean.FragmentBean(
                    packets=PACKETS,
                    length=LENGTH,
                    interval=INTERVAL,
                    host1_domain=HOST1_DOMAIN,
                    host2_domain=HOST2_DOMAIN,
                )
            else:
                frg = V2rayConfig.OutboundBean.OutSettingsBean.FragmentBean(
                    packets=PACKETS, length=LENGTH, interval=INTERVAL
                )
            frg_stream = V2rayConfig.OutboundBean.StreamSettingsBean(
                network=None,
                security=None,
                sockopt=V2rayConfig.OutboundBean.SockoptBean(
                    TcpNoDelay=True, tcpKeepAliveIdle=100, mark=255
                ),
            )
            bf_frg_set = V2rayConfig.OutboundBean.BeforeFrgSettings(
                tag="fragment",
                protocol="freedom",
                settings=frg,
                streamSettings=frg_stream,
            )
            if ENABLELOCALDNS:
                config = V2rayConfig(
                    log=logBean,
                    dns=dnsBean,
                    inbounds=[inboundBean, inboundBean2, inboundBean3],
                    outbounds=[
                        outboundBean,
                        bf_frg_set,
                        end_outbound_bf_frg_set,
                        end_outbound_bf_frg_set2,
                    ],
                    remarks=REMARKS,
                    routing=routingBean,
                )
            else:
                config = V2rayConfig(
                    log=logBean,
                    dns=dnsBean,
                    inbounds=[inboundBean, inboundBean2],
                    outbounds=[
                        outboundBean,
                        bf_frg_set,
                        end_outbound_bf_frg_set,
                        end_outbound_bf_frg_set2,
                    ],
                    remarks=REMARKS,
                    routing=routingBean,
                )
        else:
            if is_warp == False:
                if IS_WARP_ON_WARP:
                    if ENABLELOCALDNS:
                        config = V2rayConfig(
                            log=logBean,
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2, inboundBean3],
                            outbounds=[
                                outboundBeanwow,
                                outboundBean,
                                end_outbound_bf_frg_set,
                                end_outbound_bf_frg_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
                    else:
                        config = V2rayConfig(
                            log=logBean,
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2],
                            outbounds=[
                                outboundBeanwow,
                                outboundBean,
                                end_outbound_bf_frg_set,
                                end_outbound_bf_frg_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
                else:
                    config = V2rayConfig(
                        log=logBean,
                        dns=dnsBean,
                        inbounds=[inboundBean, inboundBean2],
                        outbounds=[
                            outboundBean,
                            end_outbound_bf_frg_set,
                            end_outbound_bf_frg_set2,
                        ],
                        remarks=REMARKS,
                        routing=routingBean,
                    )
            else:
                bf_after_warp_set = V2rayConfig.OutboundBean.BeforeFrgSettings(
                    protocol="freedom",
                    settings={"domainStrategy": "UseIP"},
                    tag="direct",
                )
                after_warp_set = V2rayConfig.OutboundBean.BeforeFrgSettings(
                    protocol="blackhole",
                    settings={"response": {"type": "http"}},
                    tag="block",
                )
                after_warp_set2 = V2rayConfig.OutboundBean.BeforeFrgSettings(
                    protocol="dns", tag="dns-out"
                )
                if IS_WARP_ON_WARP:
                    if ENABLELOCALDNS:
                        config = V2rayConfig(
                            log=logBean,
                            stats={},
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2, inboundBean3],
                            outbounds=[
                                outboundBeanwow,
                                outboundBean,
                                bf_after_warp_set,
                                after_warp_set,
                                after_warp_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
                    else:
                        config = V2rayConfig(
                            log=logBean,
                            stats={},
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2],
                            outbounds=[
                                outboundBeanwow,
                                outboundBean,
                                bf_after_warp_set,
                                after_warp_set,
                                after_warp_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
                else:
                    if ENABLELOCALDNS:
                        config = V2rayConfig(
                            log=logBean,
                            stats={},
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2, inboundBean3],
                            outbounds=[
                                outboundBean,
                                bf_after_warp_set,
                                after_warp_set,
                                after_warp_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
                    else:
                        config = V2rayConfig(
                            log=logBean,
                            stats={},
                            dns=dnsBean,
                            inbounds=[inboundBean, inboundBean2],
                            outbounds=[
                                outboundBean,
                                bf_after_warp_set,
                                after_warp_set,
                                after_warp_set2,
                            ],
                            remarks=REMARKS,
                            routing=routingBean,
                        )
        data_conf = remove_nulls(config)
        data_conf = replace_accept_encoding(data_conf)
        data_conf = json.dumps(data_conf, indent=4, cls=MyEncoder)
        return data_conf

    ###########################################################################################
    def set_proxy(ip, port):
        key = reg.OpenKey(
            reg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            0,
            reg.KEY_SET_VALUE,
        )
        reg.SetValueEx(key, "ProxyEnable", 0, reg.REG_DWORD, 1)
        reg.SetValueEx(key, "ProxyServer", 0, reg.REG_SZ, f"{ip}:{port}")
        reg.CloseKey(key)
        print("Proxy has been set.")

    def remove_proxy():
        # حذف پروکسی
        key = reg.OpenKey(
            reg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
            0,
            reg.KEY_SET_VALUE,
        )
        reg.SetValueEx(key, "ProxyEnable", 0, reg.REG_DWORD, 0)
        reg.SetValueEx(key, "ProxyServer", 0, reg.REG_SZ, "")
        reg.CloseKey(key)
        print("Proxy has been removed.")

    @retry(
        stop_max_attempt_number=3,
        wait_fixed=2000,
        retry_on_exception=lambda x: isinstance(x, Exception),
    )
    def test_connection():
        global concted
        result = ""
        conn = concted
        concted = True
        with open("xray/config.json", "r") as f:
            temp3 = json.load(f)
        port = temp3["inbounds"][1]["port"]
        if conn == False:
            set_proxy("127.0.0.1", port)
        response = ""
        try:
            proxies = {
                "http": f"http://127.0.0.1:{port}",
                "https": f"http://127.0.0.1:{port}",
            }
            url = test_link_
            headers = {"Connection": "close"}
            try:
                start = time.time()
                response = requests.get(
                    url, proxies=proxies, timeout=5, headers=headers
                )
            except Exception:
                start = time.time()
                response = requests.get(
                    url, proxies=proxies, timeout=15, headers=headers
                )
            elapsed = (time.time() - start) * 1000  # تبدیل به میلی‌ثانیه
            if response.status_code == 204 or (
                response.status_code == 200 and len(response.content) == 0
            ):
                result = f"Connection test available, time elapsed: {int(elapsed)} ms"
            else:
                raise IOError(
                    f"Connection test error, status code: {response.status_code}"
                )
        except RequestException as e:
            print(f"testConnection RequestException: {e}")
            result = "Connection test error, time out !"
            try:
                if response.status_code == 503:
                    result = (
                        "Connection test error, check your connection or ping again ..."
                    )
            except Exception:
                pass
        except Exception as e:
            print(f"testConnection Exception: {e}")
            result = "Connection test error, time out !"
            try:
                if response.status_code == 503:
                    result = (
                        "Connection test error, check your connection or ping again ..."
                    )
            except Exception:
                pass
        ping_la.configure(text=result)
        ping_la.bind("<Button-1>", th_test_connection)
        if conn:
            return
        ttemp = what_ip()
        print(ttemp)
        if ttemp:
            if ttemp[0] != "Unavailable":
                try:
                    ip_loc = ctk.CTkImage(
                        light_image=Image.open(f"imgs/{ttemp[0].lower()}.png"),
                        dark_image=Image.open(f"imgs/{ttemp[0].lower()}.png"),
                        size=(25, 25),
                    )
                except Exception:
                    ip_loc = False
            else:
                try:
                    ip_loc = ctk.CTkImage(
                        light_image=Image.open(f"imgs/{ttemp[1].lower()}.png"),
                        dark_image=Image.open(f"imgs/{ttemp[1].lower()}.png"),
                        size=(25, 25),
                    )
                except Exception:
                    ip_loc = False
        if ip_loc != False:
            ipp_la.configure(image=ip_loc, text=" ")
        return result

    def th_test_connection(nott=""):
        theard3 = threading.Thread(target=test_connection)
        theard3.start()

    def conc():
        global concted, is_hy2
        config_abs = os.path.abspath("xray/config.json")
        xray_abs = os.path.abspath("xray/xray.exe")
        if concted:
            conc_button.configure(image=dis_cion)
            concted = False
            ping_la.unbind("<Button-1>")
            remove_proxy()
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            if is_hy2:
                print("kill hy2")
                subprocess.Popen(
                    ["taskkill", "/F", "/IM", "hysteria.exe"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    startupinfo=startupinfo,
                )
                is_hy2 = False
            subprocess.Popen(
                ["taskkill", "/F", "/IM", "xray.exe"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                startupinfo=startupinfo,
            )
            ping_la.configure(text="\nclick to connect ")
            ipp_la.configure(image=None)
            return
        ping_la.configure(text="wait ...")
        conc_button.configure(image=is_cion)

        def s_xray():
            global wch_sel, is_hy2
            with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as f:
                slc_sub = selec_sub.get()
                conf_simple = (
                    json.load(f) if slc_sub == "user_custom_confs" else f.readlines()
                )
                if (
                    selec_sub.get() != "user_confs"
                    and selec_sub.get() != "user_custom_confs"
                ):
                    conf_simple = conf_simple[: len(conf_simple) - 1]
                if selec_sub.get() != "user_custom_confs":
                    conf_simple = remove_empty_strings(conf_simple)
            with open("xray/count", "r") as f:
                wch_sel = int(f.readline())
            with open("xray/config.json", "w") as f:
                (
                    f.write(parse_configs(conf_simple[wch_sel]))
                    if not isinstance(conf_simple[wch_sel], dict)
                    else json.dump(conf_simple[wch_sel], f)
                )
            if not isinstance(conf_simple[wch_sel], dict):
                if conf_simple[wch_sel].startswith("hy2://") or conf_simple[
                    wch_sel
                ].startswith("hysteria2://"):
                    hy = subprocess.Popen(
                        ["hy2/hysteria.exe", "client", "-c", "hy2/config.yaml"],
                        stdin=subprocess.DEVNULL,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        creationflags=subprocess.CREATE_NO_WINDOW,
                    )
                    is_hy2 = True
            with open("xray/xrayErr.log", "w") as errFile:
                xa = subprocess.Popen(
                    [xray_abs, "run", "-c", config_abs],
                    stdin=subprocess.DEVNULL,
                    stdout=errFile,
                    stderr=errFile,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )

        def theaerd_s_xray():
            thraaed = threading.Thread(target=s_xray)
            thraaed.start()
            time.sleep(3)
            th_test_connection()

        theaerd_s_xray()

    def goCheckWithConfig(sorted_results):
        print("igo")
        oklist = []

        def go():
            with open("warp_setting", "r") as f:
                config = f.readlines()[15].strip()
            with open("client_set", "r") as f:
                client_set = f.readlines()
            http5 = int(client_set[10].strip())

            def split_list(lst, n):
                k, m = divmod(len(lst), n)
                return [
                    lst[i * k + min(i, m) : (i + 1) * k + min(i + 1, m)]
                    for i in range(n)
                ]

            split_r = split_list(sorted_results, 20)

            def test_th(port, num=1):
                response = ""
                result = ""
                try:
                    proxies = {
                        "http": f"http://127.0.0.{num}:{port}",
                        "https": f"http://127.0.0.{num}:{port}",
                    }
                    url = test_link_
                    headers = {"Connection": "close"}
                    try:
                        start = time.time()
                        response = requests.get(
                            url, proxies=proxies, timeout=5, headers=headers
                        )
                    except Exception:
                        start = time.time()
                        response = requests.get(
                            url, proxies=proxies, timeout=5, headers=headers
                        )
                    elapsed = (time.time() - start) * 1000  # تبدیل به میلی‌ثانیه
                    if response.status_code == 204 or (
                        response.status_code == 200 and len(response.content) == 0
                    ):
                        result = elapsed
                    else:
                        raise IOError(
                            f"Connection test error, status code: {response.status_code}"
                        )
                except RequestException as e:
                    print(f"testConnection RequestException: {e}")
                    result = "Connection test error, time out !"
                    try:
                        if response.status_code == 503:
                            result = "Connection test error, check your connection or ping again ..."
                    except Exception:
                        pass
                except Exception as e:
                    print(f"testConnection Exception: {e}")
                    result = "Connection test error, time out !"
                    try:
                        if response.status_code == 503:
                            result = "Connection test error, check your connection or ping again ..."
                    except Exception:
                        pass
                if isinstance(result, Number):
                    return True
                return False

            def goOnTheTh(whichTuple, i):
                nonlocal oklist
                global WH_ipVersion
                for ip, port, ping, loss_rate, jitter, combined_score in whichTuple:
                    ip = f"[{ip}]" if WH_ipVersion == "ipv6" else ip
                    if loss_rate == 0.00 and ping != 0.0 and ping < 500.00:
                        ipchanged = config.split("@")[0] + f"@{ip}:{port}"
                        if "?" in config:
                            ipchanged += f"?{config.split('?')[1]}"
                        else:
                            ipchanged += "#none"
                        with open(f"xray/config{i}.json", "w") as f:
                            json.dump(
                                json.loads(parse_configs(ipchanged, cv=i)), f, indent=4
                            )
                        startupinfo = subprocess.STARTUPINFO()
                        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                        if ipchanged.startswith("hy2://") or ipchanged.startswith(
                            "hysteria2://"
                        ):
                            hy = subprocess.Popen(
                                ["hy2/hysteria.exe", "client", "-c", "hy2/config.yaml"],
                                stdin=subprocess.DEVNULL,
                                stdout=subprocess.DEVNULL,
                                stderr=subprocess.DEVNULL,
                                startupinfo=startupinfo,
                            )
                        with open("xray/xrayErr.log", "w") as errFile:
                            xa = subprocess.Popen(
                                ["xray/xray.exe", "run", "-c", f"xray/config{i}.json"],
                                stdin=subprocess.DEVNULL,
                                stdout=errFile,
                                stderr=errFile,
                                startupinfo=startupinfo,
                            )
                        if test_th(http5, i):
                            print("is ok")
                            oklist.append(
                                (ip, port, ping, loss_rate, jitter, combined_score)
                            )
                        subprocess.call(
                            ["taskkill", "/F", "/PID", str(xa.pid)],
                            creationflags=subprocess.CREATE_NO_WINDOW,
                        )
                        if ipchanged.startswith("hy2://") or ipchanged.startswith(
                            "hysteria2://"
                        ):
                            subprocess.call(
                                ["taskkill", "/F", "/PID", str(hy.pid)],
                                creationflags=subprocess.CREATE_NO_WINDOW,
                            )
                        os.remove(f"xray/config{i}.json")

            def goOnEachThreadOfTuple(split_r):
                threads = []
                for i, part in enumerate(split_r, start=1):
                    thread = threading.Thread(target=goOnTheTh, args=(part, i))
                    thread.start()
                    threads.append(thread)
                for thread in threads:
                    thread.join()

            goOnEachThreadOfTuple(split_r)

        go()
        return oklist

    def theard_conc():
        theard = threading.Thread(target=conc)
        theard.start()

    def wireguard_config_main(which_ip):
        global Cpu_speed
        global max_workers_number
        global sorted_results
        global i_ip_scan
        global wire_p
        global best_result
        global best_ip_mix
        global WH_ipVersion
        WH_ipVersion = which_ip
        labelmain1.configure(text="\n\n\n\nwait ... ")
        max_workers_number = 0
        if Cpu_speed == "1":
            max_workers_number = 100
        elif Cpu_speed == "2":
            max_workers_number = 50

        def upload_to_bashupload(config_data):
            @retry(
                stop_max_attempt_number=3,
                wait_fixed=2000,
                retry_on_exception=lambda x: isinstance(x, ConnectionError),
            )
            def file_o():
                files = {"file": ("output.json", config_data)}
                try:
                    response = requests.post(
                        "https://bashupload.com/", files=files, timeout=30
                    )
                except Exception:
                    response = requests.post(
                        "https://bashupload.com/", files=files, timeout=50
                    )
                return response

            response = file_o()
            if response.ok:
                download_link = response.text.strip()
                download_link_with_query = (
                    download_link[59 : len(download_link) - 27] + "?download=1"
                )
                true = ""
                for i in download_link_with_query:
                    if true == "":
                        if i != "b":
                            pass
                        else:
                            true = "https://"
                            true += i
                    else:
                        true += i
                label_best.insert(1.0, str(true))
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(str(true))
            else:
                label_best.insert(1.0, "Error try again")

        def generate_ipv6():
            return f"2606:4700:d{random.randint(0, 1)}::{random.randint(0, 65535):x}:{random.randint(0, 65535):x}:{random.randint(0, 65535):x}:{random.randint(0, 65535):x}"

        def ping_ip(ip, port):
            global results
            global best_ip
            global best_result_avg
            icmp = pinging(
                ip,
                count=count_see,
                interval=interval_see,
                timeout=timeout_see,
                family="ipv6",
            )
            ping = float(icmp.avg_rtt)
            jitter = icmp.jitter
            loss_rate = icmp.packet_loss
            if ping == 0.0:
                ping = 1000
            if jitter == 0.0:
                jitter = 100
            if loss_rate == 1.0:
                loss_rate = 100
            loss_rate = loss_rate * 100
            if (0.5 * ping + +0.2 * jitter + 0.3 * loss_rate) > best_ip:
                best_ip = (
                    0.5 * float(icmp.avg_rtt)
                    + 0.2 * icmp.jitter
                    + 0.3 * icmp.packet_loss
                )
                best_result_avg = ip
            results.append((ip, port, ping, loss_rate, jitter))

        def check_ac_v6(mn, i):
            global i_ip_scan
            global is_v2ray
            global best_ip_mix
            global wire_config_temp
            global wire_p
            global header
            best_result[0] = best_ip_mix[0]
            if "[" not in best_ip_mix[0]:
                best_result[0] = "[" + best_ip_mix[0] + "]"
            best_result[1] = best_ip_mix[1]
            if is_v2ray:
                configure = fetch_config_from_api()
                wireguard_url = generate_wireguard_url(
                    configure, f"[{ip}]" + ":" + str(port)
                )
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(wireguard_url)
                label_best.insert(1.0, wireguard_url)
                labelmain1.configure(text="\n\n\n\nClick to scan ip")
                return
            all_key = []
            try:
                all_key = free_cloudflare_account()
            except Exception as E:
                print(" Try again Error =", E)
            all_key2 = []
            try:
                all_key2 = free_cloudflare_account()
            except Exception as E:
                print(" Try again Error =", E)
            if is_sub == False and is_v2ray == False:
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                    if num[8] == "2\n":
                        hi_from = "1"
                    elif num[8] == "1\n":
                        hi_from = "2"
                conf = ""
                if hi_from == "1":
                    conf = temp_sing_old
                elif hi_from == "2":
                    conf = temp_sing_new
                conf["outbounds"][0]["local_address"][1] = all_key[0]
                conf["outbounds"][0]["private_key"] = all_key[1]
                conf["outbounds"][0]["reserved"] = all_key[2]
                conf["outbounds"][0]["peer_public_key"] = all_key[3]
                conf["outbounds"][0]["peer_public_key"] = all_key[3]
                conf["outbounds"][0]["server"] = best_result[0]
                conf["outbounds"][0]["server_port"] = best_result[1]
                conf["outbounds"][0]["tag"] = "Tel=@arshiacomplus Warp-IR"
                conf["outbounds"][1]["local_address"][1] = all_key2[0]
                conf["outbounds"][1]["private_key"] = all_key2[1]
                conf["outbounds"][1]["reserved"] = all_key2[2]
                conf["outbounds"][1]["peer_public_key"] = all_key2[3]
                conf["outbounds"][1]["peer_public_key"] = all_key2[3]
                conf["outbounds"][1]["server"] = best_result[0]
                conf["outbounds"][1]["server_port"] = best_result[1]
                conf["outbounds"][1]["tag"] = "Tel=@arshiacomplus Warp-Main"
                conf["outbounds"][1]["detour"] = "Tel=@arshiacomplus Warp-IR"
                conf = str(conf).replace("'", '"')
                label_best.insert(1.0, conf)
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(f"{conf}")
                labelmain1.configure(text="\n\n\n\nClick to scan ip")
                return
            if is_sub and is_v2ray == False:
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                    if num[8] == "2\n":
                        hi_from = "1"
                    elif num[8] == "1\n":
                        hi_from = "2"
                conf = ""
                conf2 = ""
                if hi_from == "1":
                    conf = temp_sing_old["outbounds"][0]
                    conf2 = temp_sing_old["outbounds"][1]
                elif hi_from == "2":
                    conf = temp_sing_new["outbounds"][0]
                    conf2 = temp_sing_new["outbounds"][1]
                conf["local_address"][1] = all_key[0]
                conf["private_key"] = all_key[1]
                conf["reserved"] = all_key[2]
                conf["peer_public_key"] = all_key[3]
                conf["peer_public_key"] = all_key[3]
                conf["server"] = best_result[0]
                conf["server_port"] = best_result[1]
                conf["tag"] = "Tel=@arshiacomplus Warp-IR" + str(i)
                conf2["local_address"][1] = all_key2[0]
                conf2["private_key"] = all_key2[1]
                conf2["reserved"] = all_key2[2]
                conf2["peer_public_key"] = all_key2[3]
                conf2["peer_public_key"] = all_key2[3]
                conf2["server"] = best_result[0]
                conf2["server_port"] = best_result[1]
                conf2["tag"] = "Tel=@arshiacomplus Warp-Main" + str(i)
                conf2["detour"] = "Tel=@arshiacomplus Warp-IR" + str(i)
                if wire_p == 0:
                    wire_config_temp += f"{conf}" + f",{conf2}"
                else:
                    wire_config_temp += f",{conf}" + f",{conf2}"
                print(header)
                time.sleep(8)
                print(i)
                wire_p = 1

        def check_ac(i):
            global i_ip_scan
            global is_sub
            global best_result
            global save_result
            global is_v2ray
            global wire_c
            global temp_conf
            global wire_config_temp
            global header
            global wire_p
            if wire_p == 0 and i_ip_scan == False:
                ip, port, ping, loss_rate, jitter, combined_score = best_result
                best_result = [1] * 2
                best_result[0] = ip
                best_result[1] = int(port)
            else:
                ip, port = best_result
            all_key = ["NONe", "none", "none", "ghjgj"]
            try:
                all_key = free_cloudflare_account()
            except Exception:
                all_key = free_cloudflare_account()
            try:
                all_key2 = free_cloudflare_account()
            except Exception:
                all_key2 = free_cloudflare_account()
            if is_sub == False and is_v2ray == False:
                best_result[1] = int(best_result[1])
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                    if num[8] == "2\n":
                        hi_from = "1"
                    elif num[8] == "1\n":
                        hi_from = "2"
                conf = ""
                if hi_from == "1":
                    conf = temp_sing_old
                elif hi_from == "2":
                    conf = temp_sing_new
                conf["outbounds"][0]["local_address"][1] = all_key[0]
                conf["outbounds"][0]["private_key"] = all_key[1]
                conf["outbounds"][0]["reserved"] = all_key[2]
                conf["outbounds"][0]["peer_public_key"] = all_key[3]
                conf["outbounds"][0]["peer_public_key"] = all_key[3]
                conf["outbounds"][0]["server"] = best_result[0]
                conf["outbounds"][0]["server_port"] = best_result[1]
                conf["outbounds"][0]["tag"] = "Tel=@arshiacomplus Warp-IR"
                conf["outbounds"][1]["local_address"][1] = all_key2[0]
                conf["outbounds"][1]["private_key"] = all_key2[1]
                conf["outbounds"][1]["reserved"] = all_key2[2]
                conf["outbounds"][1]["peer_public_key"] = all_key2[3]
                conf["outbounds"][1]["peer_public_key"] = all_key2[3]
                conf["outbounds"][1]["server"] = best_result[0]
                conf["outbounds"][1]["server_port"] = best_result[1]
                conf["outbounds"][1]["tag"] = "Tel=@arshiacomplus Warp-Main"
                conf["outbounds"][1]["detour"] = "Tel=@arshiacomplus Warp-IR"
                conf = str(conf).replace("'", '"')
                label_best.insert(1.0, conf)
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(f"{conf}")
                labelmain1.configure(text="\n\n\n\nClick to scan ip")
                return
            if is_v2ray:
                configure = fetch_config_from_api()
                wireguard_url = generate_wireguard_url(
                    configure, f"{ip}" + ":" + str(port)
                )
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(wireguard_url)
                label_best.insert(1.0, wireguard_url)
                labelmain1.configure(text="\n\n\n\nClick to scan ip")
                return
            if is_sub:
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                    if num[8] == "2\n":
                        hi_from = "1"
                    elif num[8] == "1\n":
                        hi_from = "2"
                conf = ""
                conf2 = ""
                if hi_from == "1":
                    conf = temp_sing_old["outbounds"][0]
                    conf2 = temp_sing_old["outbounds"][1]
                elif hi_from == "2":
                    conf = temp_sing_new["outbounds"][0]
                    conf2 = temp_sing_new["outbounds"][1]
                conf["local_address"][1] = all_key[0]
                conf["private_key"] = all_key[1]
                conf["reserved"] = all_key[2]
                conf["peer_public_key"] = all_key[3]
                conf["peer_public_key"] = all_key[3]
                conf["server"] = best_result[0]
                conf["server_port"] = best_result[1]
                conf["tag"] = "Tel=@arshiacomplus Warp-IR" + str(i)
                conf2["local_address"][1] = all_key2[0]
                conf2["private_key"] = all_key2[1]
                conf2["reserved"] = all_key2[2]
                conf2["peer_public_key"] = all_key2[3]
                conf2["peer_public_key"] = all_key2[3]
                conf2["server"] = best_result[0]
                conf2["server_port"] = best_result[1]
                conf2["tag"] = "Tel=@arshiacomplus Warp-Main" + str(i)
                conf2["detour"] = "Tel=@arshiacomplus Warp-IR" + str(i)
                if wire_p == 0:
                    wire_config_temp += f"{conf}" + f",{conf2}"
                else:
                    wire_config_temp += f",{conf}" + f",{conf2}"
                print(header)
                time.sleep(8)
                print(i)
                wire_p = 1

        def create_ip_range(start_ip, end_ip):
            start = list(map(int, start_ip.split(".")))
            end = list(map(int, end_ip.split(".")))
            temp = start[:]
            ip_range = []
            while temp != end:
                ip_range.append(".".join(map(str, temp)))
                temp[3] += 1
                for i2 in (3, 2, 1):
                    if temp[i2] == 256:
                        temp[i2] = 0
                        temp[i2 - 1] += 1
            ip_range.append(end_ip)
            return ip_range

        def scan_ip_port(ip, port):
            global best_result
            global sorted_results
            global results
            icmp = pinging(
                ip,
                count=count_see,
                interval=interval_see,
                timeout=timeout_see,
                family="ipv4",
            )
            results.append(
                (ip, port, float(icmp.avg_rtt), icmp.packet_loss, icmp.jitter)
            )

        def parse_ip_ranges(filename):
            start_ips = []
            end_ips = []
            with open(filename, "r") as file:
                for line in file:
                    line = line.strip()
                    if not line:
                        continue
                    start_ip, end_ip = line.split(":")
                    start_ips.append(start_ip)
                    end_ips.append(end_ip)
            if start_ips == [] and end_ips == []:
                return ["188.114.96.0", "162.159.192.0", "162.159.195.0"], [
                    "188.114.99.224",
                    "162.159.193.224",
                    "162.159.195.224",
                ]
            return start_ips, end_ips

        if i_ip_scan:

            def submit():
                global best_result
                best_result = [1] * 2
                best_result_temp = str(ip_entry.get())
                best_result_temp2 = str(port_entry.get())
                best_result[0] = best_result_temp
                best_result[1] = best_result_temp2
                clear_widgets(rootip)
                rootip.destroy(), check_ac("")

            rootip = ctk.CTk()
            rootip.protocol("WM_TAKE_FOCUS")
            rootip.title("main activity ")
            rootip.geometry("+200+200")
            label_ff = ctk.CTkLabel(rootip, text="Enter an ip/port")
            label_ff.pack(fill=tk.X)
            ip_entry = ctk.CTkEntry(rootip, placeholder_text="Just ip(v4/v6)")
            port_entry = ctk.CTkEntry(rootip, placeholder_text="port")
            pack_widgets([ip_entry, port_entry], padx=10, pady=10, fill=tk.X)
            rootip.after(0, focus(ip_entry))
            submitb = ctk.CTkButton(rootip, text="submit", command=submit)
            submitb.pack(fill=tk.X, padx=11, pady=4)
            submitb.bind("<Enter>", hand2)
            rootip.mainloop()
        else:
            if which_ip == "ipv6":
                if i_ip_scan:

                    def submit():
                        global best_ip_mix
                        best_ip_mix = [1] * 2
                        best_result_temp = str(ip_entry.get())
                        best_result_temp2 = str(port_entry.get())
                        best_ip_mix[0] = best_result_temp
                        best_ip_mix[1] = best_result_temp2
                        clear_widgets(rootip)
                        rootip.destroy(), check_ac_v6("")

                    rootip = ctk.CTk()
                    rootip.protocol("WM_TAKE_FOCUS")
                    rootip.title("main activity ")
                    rootip.geometry("+200+200")
                    label_ff = ctk.CTkLabel(rootip, text="Enter an ip/port")
                    label_ff.pack(fill=tk.X)
                    ip_entry = ctk.CTkEntry(rootip, placeholder_text="Just ip(v4/v6)")
                    port_entry = ctk.CTkEntry(rootip, placeholder_text="port")
                    pack_widgets([ip_entry, port_entry], padx=10, pady=10, fill=tk.X)
                    rootip.after(0, focus(ip_entry))
                    submitb = ctk.CTkButton(rootip, text="submit", command=submit)
                    submitb.pack(fill=tk.X, padx=11, pady=4)
                    submitb.bind("<Enter>", hand2)
                    rootip.mainloop()
                ports_to_check = [1074, 864]
                random_ip = generate_ipv6()
                executor = ThreadPoolExecutor(max_workers=max_workers_number)
                try:
                    for _ in range(101):
                        executor.submit(
                            ping_ip,
                            generate_ipv6(),
                            ports_to_check[random.randint(0, 1)],
                        )
                except Exception:
                    print("AN Error")
                finally:
                    executor.shutdown(wait=True)
                extended_results = []
                with open("warp_setting", "r") as f:
                    warp111 = f.readlines()
                for result in results:
                    ip, port, ping, loss_rate, jitter = result
                    if loss_rate == 0.00 and ping != 0.0 and ping < ping_range_see:
                        try:
                            save_result.index(str(ip))
                        except Exception:
                            if warp111[2] == "2\n":
                                save_result.append(",")
                                save_result.append(str(ip))
                            else:
                                save_result.append("\n")
                                save_result.append(str(ip))
                    combined_score = 0.5 * ping + 0.2 * jitter + 0.3 * loss_rate
                    extended_results.append(
                        (ip, port, ping, loss_rate, jitter, combined_score)
                    )
                if warp111[14] == "on\n":
                    extended_results = goCheckWithConfig(extended_results)
                sorted_results = sorted(extended_results, key=lambda x: x[5])
                best_result = sorted_results[0]
                port_random = ports_to_check[random.randint(0, len(ports_to_check) - 1)]
                if best_ip:
                    best_ip_mix = [1] * 2
                    best_ip_mix[0] = best_result_avg
                    best_ip_mix[1] = port_random
                else:
                    best_ip_mix = [1] * 2
                    best_ip_mix[0] = random_ip
                    best_ip_mix[1] = port_random
                best_result = [1] * 2
                best_result[0] = best_ip_mix[0]
                best_result[1] = best_ip_mix[1]
                labelmain1.configure(f"{best_result[0]}:{best_result[1]}")
                if is_sub:
                    global wire_config_temp
                    global header
                    wire_p = 0
                    for i in range(int(how_menypp.get())):
                        check_ac_v6(best_ip_mix, i)
                    wire_config_temp = str(wire_config_temp).replace("'", '"')
                    header["outbounds"].append(f"{wire_config_temp}")
                    header = str(header).replace("'", '"')
                    header = list(header)
                    header[15] = ""
                    header[len(header) - 3] = ""
                    header = "".join(header)
                    upload_to_bashupload(header)
                    header = header_temp
                    wire_p = 0
                else:
                    wire_p = 0
                    check_ac_v6(best_ip_mix, "")
            else:
                start_ips, end_ips = parse_ip_ranges("ip_range/warp.ipv4")
                ports = [1074, 894, 908, 878]
                for start_ip, end_ip in zip(start_ips, end_ips):
                    ip_range = create_ip_range(start_ip, end_ip)
                    executor = ThreadPoolExecutor(max_workers=max_workers_number)
                    try:
                        for ip in ip_range:
                            randomp = ports[random.randint(0, 3)]
                            executor.submit(scan_ip_port, ip, randomp)
                    except Exception:
                        print("AN Error")
                    finally:
                        executor.shutdown(wait=True)
                extended_results = []
                with open("warp_setting", "r") as f:
                    warp111 = f.readlines()
                for result in results:
                    ip, port, ping, loss_rate, jitter = result
                    if loss_rate == 0.00 and ping != 0.0 and ping < 500.00:
                        try:
                            save_result.index(str(ip))
                        except Exception:
                            save_result.append("\n")
                            save_result.append(str(ip))
                    if ping == 0.0:
                        ping = 1000
                    if jitter == 0.0:
                        jitter = 1000
                    if loss_rate == 1.0:
                        loss_rate = 100
                    loss_rate = loss_rate * 100
                    combined_score = combined_score = (
                        0.5 * ping + 0.2 * jitter + 0.3 * loss_rate
                    )
                    extended_results.append(
                        (ip, port, ping, loss_rate, jitter, combined_score)
                    )
                if warp111[14] == "on\n":
                    extended_results = goCheckWithConfig(extended_results)
                sorted_results = sorted(extended_results, key=lambda x: x[5])
                best_result = sorted_results[0]
                ip, port, ping, loss_rate, jitter, combined_score = best_result
                labelmain1.configure(f"{ip}:{port}")
                while len(sorted_results) < 10:
                    sorted_results.append(("No IP", None, None, 100, 1000))
                if is_sub:
                    for i in range(int(how_menypp.get())):
                        check_ac(i)
                        time.sleep(1)
                    wire_config_temp = str(wire_config_temp).replace("'", '"')
                    header["outbounds"].append(f"{wire_config_temp}")
                    header = str(header).replace("'", '"')
                    header = list(header)
                    header[15] = ""
                    header[len(header) - 3] = ""
                    header = "".join(header)
                    upload_to_bashupload(header)
                    header = header_temp
                    wire_p = 0
                else:
                    check_ac("")

    def wireguard_config_without():
        global i_ip_scan
        global is_sub
        global is_v2ray
        is_v2ray = False
        i_ip_scan = True
        is_sub = False
        wireguard_config_main(WH_ipVersion)

    def wireguard_config_sub():
        global is_sub
        global i_ip_scan
        global is_v2ray
        is_v2ray = False
        i_ip_scan = False
        is_sub = True
        wireguard_config_main(WH_ipVersion)

    def v2ray():
        global is_v2ray
        global i_ip_scan
        global is_sub
        i_ip_scan = False
        is_v2ray = True
        is_sub = False
        wireguard_config_main(WH_ipVersion)

    def v2ray_without():
        global is_v2ray
        global i_ip_scan
        global is_sub
        i_ip_scan = True
        is_v2ray = True
        is_sub = False
        wireguard_config_main(WH_ipVersion)

    def wireguard_config_ok():
        global i_ip_scan
        global is_sub
        global is_v2ray
        i_ip_scan = False
        is_sub = False
        is_v2ray = False
        wireguard_config_main(WH_ipVersion)

    def theard_wireguard_config_without():
        thread = threading.Thread(target=wireguard_config_without)
        thread.start()

    def theard_wireguard_config_sub():
        thread = threading.Thread(target=wireguard_config_sub)
        thread.start()

    def theard_v2ray():
        thread = threading.Thread(target=v2ray)
        thread.start()

    def theard_v2ray_without():
        thread = threading.Thread(target=v2ray_without)
        thread.start()

    def theard_wireguard_config_ok():
        thread = threading.Thread(target=wireguard_config_ok)
        thread.start()

    def main():
        global save_result
        global max_workers_number
        WH_ipVersion = ""
        sorted_results = []

        def main_menu():
            global WH_ipVersion
            global save_result
            labelmain1.configure(text="\n\n\n\nplease wait ... ")
            label_best.insert(1.0, "best result: ")
            global sorted_results
            global best_result
            with open("warp_setting", "r") as f:
                num = f.readline()
            if num[0] == "2":
                Cpu_speed = "1"
            elif num[0] == "1":
                Cpu_speed = "2"
            if Cpu_speed == "1":
                max_workers_number = 100
            elif Cpu_speed == "2":
                max_workers_number = 50
            print(max_workers_number)

            def copy_ip(text):
                global sorted_results
                selected = table.selection()[0]
                ip = table.item(selected)["values"][0]
                print(ip)
                tabview.tab("main").clipboard_clear()
                if WH_ipVersion == "ipv4":
                    tabview.tab("main").clipboard_append(ip + ":" + str(port))
                else:
                    tabview.tab("main").clipboard_append(
                        "[" + ip + "]" + ":" + str(port)
                    )

            def generate_ipv6():
                return f"2606:4700:d{random.randint(0, 1)}::{random.randint(0, 65535):x}:{random.randint(0, 65535):x}:{random.randint(0, 65535):x}:{random.randint(0, 65535):x}"

            def ping_ip(ip, port):
                global results
                global best_ip
                global best_result_avg
                icmp = pinging(
                    ip,
                    count=count_see,
                    interval=interval_see,
                    timeout=timeout_see,
                    family="ipv6",
                )
                ping = float(icmp.avg_rtt)
                jitter = icmp.jitter
                loss_rate = icmp.packet_loss
                if ping == 0.0:
                    ping = 1000
                if jitter == 0.0:
                    jitter = 100
                if loss_rate == 1.0:
                    loss_rate = 100
                loss_rate = loss_rate * 100
                if (0.5 * ping + +0.2 * jitter + 0.3 * loss_rate) > best_ip:
                    best_ip = (
                        0.5 * float(icmp.avg_rtt)
                        + 0.2 * icmp.jitter
                        + 0.3 * icmp.packet_loss
                    )
                    best_result_avg = ip
                results.append((ip, port, ping, loss_rate, jitter))

            def check_ac_v6(mn):
                global best_result
                global save_result
                global do_you_save
                global sorted_results
                global save_result
                print(sorted_results)
                label_best.delete(1.0, tk.END)
                best_result = mn
                table.bind("<Double-1>", copy_ip)
                for ip, port, ping, loss_rate, jitter, combined_score in sorted_results[
                    :10
                ]:
                    table.insert(
                        "",
                        "end",
                        values=(
                            ip,
                            str(port) if port else "878",
                            f"{ping:.2f}" if ping else "None",
                            f"{loss_rate:.2f}%",
                            f"{jitter:.2f}",
                            f"{combined_score:.2f}",
                        ),
                    )
                best_result = sorted_results[0] if sorted_results else None
                ip, port, ping, loss_rate, jitter, combined_score = best_result
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append("[" + ip + "]" + ":" + str(port))
                label_best.insert(
                    1.0,
                    f"The best IP: [{ip}]:{port if port else 'N/A'} , ping: {ping:.2f} ms, packet loss: {loss_rate:.2f}% ,{jitter} ms , score: {combined_score:.2f}",
                )
                best_result = 2 * [1]
                best_result[0] = f"{ip}"
                best_result[1] = 878
                labelmain1.configure(text="\n\n\n\nFinished")
                do_you_save = ""
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                print(do_you_save)
                print(best_result)
                os.remove("result.txt")
                t = 0
                if num[1] == "2\n":
                    with open("result.txt", "w") as filef:
                        for i in save_result:
                            if t == 0:
                                filef.write(i[1:])
                                t = 1
                            else:
                                filef.write(i)

            def check_ac():
                global save_result
                global best_result
                global do_you_save
                label_best.delete(1.0, tk.END)
                table.tag_configure("oddrow", background="black")
                # table.bind("<Button-1>", copy_ip)
                table.bind("<Double-1>", copy_ip)
                for j in range(len(table.get_children(""))):
                    if j % 2 == 2:
                        item = table.get_children("")[j]
                        table.item(item, tags=("oddrow",))
                for ip, port, ping, loss_rate, jitter, combined_score in sorted_results[
                    :10
                ]:
                    table.insert(
                        "",
                        "end",
                        values=(
                            ip,
                            str(port) if port else "878",
                            f"{ping:.2f}" if ping else "None",
                            f"{loss_rate:.2f}%",
                            f"{jitter}",
                            f"{combined_score:.2f}",
                        ),
                    )
                best_result = sorted_results[0] if sorted_results else None
                ip, port, ping, loss_rate, jitter, combined_score = best_result
                tabview.tab("main").clipboard_clear()
                tabview.tab("main").clipboard_append(ip + ":" + str(port))
                try:
                    label_best.insert(
                        1.0,
                        f"The best IP: {ip}:{port if port else 'N/A'} , ping: {ping:.2f} ms, packet loss: {loss_rate:.2f}%, {jitter} ms , score: {combined_score:.2f}",
                    )
                except TypeError:
                    label_best.insert(
                        1.0,
                        f"The best IP: {ip}:{port if port else '878'} , ping: None, packet loss: {loss_rate:.2f}%, {jitter} ms , score: {combined_score:.2f}",
                    )
                best_result = 2 * [1]
                best_result[0] = f"{ip}"
                best_result[1] = 878
                do_you_save = ""
                with open("warp_setting", "r") as f:
                    num = f.readlines()
                os.remove("result.txt")
                t = 0
                if num[1] == "2\n":
                    with open("result.txt", "w") as fileff:
                        for i in save_result:
                            if t == 0:
                                fileff.write(i[1:])
                                t = 1
                            else:
                                fileff.write(i)
                return best_result

            def create_ip_range(start_ip, end_ip):
                start = list(map(int, start_ip.split(".")))
                end = list(map(int, end_ip.split(".")))
                temp = start[:]
                ip_range = []
                while temp != end:
                    ip_range.append(".".join(map(str, temp)))
                    temp[3] += 1
                    for i2 in (3, 2, 1):
                        if temp[i2] == 256:
                            temp[i2] = 0
                            temp[i2 - 1] += 1
                ip_range.append(end_ip)
                return ip_range

            labelmain1.configure(text="\n\n\n\nPlease wait scannig ip ...")
            if WH_ipVersion == "ipv6":
                print("ipv6")
                save_result = []
                sorted_results = []
                ports_to_check = [1074, 864]
                random_ip = generate_ipv6()
                executor = ThreadPoolExecutor(max_workers=max_workers_number)
                try:
                    for _ in range(101):
                        executor.submit(
                            ping_ip,
                            generate_ipv6(),
                            ports_to_check[random.randint(0, 1)],
                        )
                except Exception:
                    print("AN Error")
                finally:
                    executor.shutdown(wait=True)
                label_best.insert(1.0, "sort result ...")
                extended_results = []
                with open("warp_setting", "r") as f:
                    warp1111 = f.readlines()
                for result in results:
                    ip, port, ping, loss_rate, jitter = result
                    combined_score = 0.5 * ping + 0.2 * jitter + 0.3 * loss_rate
                    extended_results.append(
                        (ip, port, ping, loss_rate, jitter, combined_score)
                    )
                if warp1111[14] == "on\n":
                    extended_results = goCheckWithConfig(extended_results)
                sorted_results = sorted(extended_results, key=lambda x: x[5])
                if warp1111[2] != "3\n":
                    for (
                        ip,
                        port,
                        ping,
                        loss_rate,
                        jitter,
                        combined_score,
                    ) in sorted_results:
                        if loss_rate == 0.00 and ping != 0.0 and ping < ping_range_see:
                            if warp1111[10] == "1\n":
                                try:
                                    save_result.index(str(ip))
                                except Exception:
                                    if warp1111[2] == "2\n":
                                        save_result.append(",")
                                        save_result.append(str(ip))
                                    else:
                                        save_result.append("\n")
                                        save_result.append(str(ip))
                            else:
                                try:
                                    save_result.index(str(ip))
                                except Exception:
                                    if warp1111[2] == "2\n":
                                        save_result.append(",")
                                        save_result.append(str(ip) + ":" + str(port))
                                    else:
                                        save_result.append("\n")
                                        save_result.append(str(ip) + ":" + str(port))
                if warp1111[2] == "3\n":
                    for (
                        ip,
                        port,
                        ping,
                        loss_rate,
                        jitter,
                        combined_score,
                    ) in sorted_results:
                        if ping <= ping_range_see:
                            if warp1111[10] == "1\n":
                                save_result.append("\n")
                                save_result.append(
                                    ip
                                    + " | "
                                    + "ping: "
                                    + str(ping)
                                    + "packet_loss: "
                                    + str(loss_rate)
                                    + "jitter: "
                                    + str(jitter)
                                )
                            else:
                                save_result.append("\n")
                                save_result.append(
                                    ip
                                    + ":"
                                    + " | "
                                    + "ping: "
                                    + str(ping)
                                    + "packet_loss: "
                                    + str(loss_rate)
                                    + "jitter: "
                                    + str(jitter)
                                )
                best_result = sorted_results[0]
                port_random = ports_to_check[random.randint(0, len(ports_to_check) - 1)]
                if best_ip:
                    best_ip_mix = [1] * 2
                    best_ip_mix[0] = "[" + best_result_avg + "]"
                    best_ip_mix[1] = port_random
                else:
                    best_ip_mix = [1] * 2
                    best_ip_mix[0] = "[" + random_ip + "]"
                    best_ip_mix[1] = port_random
                print(best_ip_mix)
                check_ac_v6(best_ip_mix)
                return
            else:
                print("ipv4")
                save_result = []
                sorted_results = []
                start_ips = []
                end_ips = []
                print(warp[12])
                if warp[12] == "2\n":
                    start_ips = ["188.114.96.0", "162.159.192.0", "162.159.195.0"]
                    end_ips = ["188.114.99.224", "162.159.193.224", "162.159.195.224"]
                elif warp[12] == "1\n":
                    start_ips = [
                        "167.82.229.0",
                        "185.31.16.0",
                        "146.75.31.0",
                        "146.75.46.0",
                        "199.232.65.0",
                        "167.82.238.0",
                        "167.82.231.0",
                        "199.232.74.0",
                        "146.75.115.0",
                        "167.82.224.0",
                        "146.75.25.0",
                        "199.232.80.0",
                    ]
                    end_ips = [
                        "167.82.229.255",
                        "185.31.16.255",
                        "146.75.31.255",
                        "146.75.46.255",
                        "199.232.65.255",
                        "167.82.238.255",
                        "167.82.231.255",
                        "199.232.74.255",
                        "146.75.115.255",
                        "167.82.224.255",
                        "146.75.25.255",
                        "199.232.80.255",
                    ]
                ports = [1074, 894, 908, 878]
                # except Exception:
                #      executor_bar.shutdown(wait=True)
                for start_ip, end_ip in zip(start_ips, end_ips):
                    ip_range = create_ip_range(start_ip, end_ip)
                    executor = ThreadPoolExecutor(max_workers=max_workers_number)
                    try:
                        for ip in ip_range:
                            futures = executor.submit(
                                scan_ip_port, ip, ports[random.randint(0, 3)]
                            )
                    except Exception as e:
                        print("AN Error", e)
                    finally:
                        executor.shutdown(wait=True)
                label_best.insert(1.0, "sort result ...")
                extended_results = []
                with open("warp_setting", "r") as f:
                    warp1111 = f.readlines()
                for result in results:
                    ip, port, ping, loss_rate, jitter = result
                    if ping == 0.0:
                        ping = 1000
                    if jitter == 0.0:
                        jitter = 1000
                    if loss_rate == 1.0:
                        loss_rate = 100
                    loss_rate = loss_rate * 100
                    combined_score = 0.5 * ping + 0.2 * jitter + 0.3 * loss_rate
                    extended_results.append(
                        (ip, port, ping, loss_rate, jitter, combined_score)
                    )
                if warp1111[14] == "on\n":
                    extended_results = goCheckWithConfig(extended_results)
                sorted_results = sorted(extended_results, key=lambda x: x[5])
                if warp1111[2] != "3\n":
                    for (
                        ip,
                        port,
                        ping,
                        loss_rate,
                        jitter,
                        combined_score,
                    ) in sorted_results:
                        if loss_rate == 0.00 and ping != 0.0 and ping < ping_range_see:
                            if warp1111[10] == "1\n":
                                try:
                                    save_result.index(str(ip))
                                except Exception:
                                    if warp1111[2] == "2\n":
                                        save_result.append(",")
                                        save_result.append(str(ip))
                                    else:
                                        save_result.append("\n")
                                        save_result.append(str(ip))
                            else:
                                try:
                                    save_result.index(str(ip))
                                except Exception:
                                    if warp1111[2] == "2\n":
                                        save_result.append(",")
                                        save_result.append(str(ip) + ":" + str(port))
                                    else:
                                        save_result.append("\n")
                                        save_result.append(str(ip) + ":" + str(port))
                if warp1111[2] == "3\n":
                    for (
                        ip,
                        port,
                        ping,
                        loss_rate,
                        jitter,
                        combined_score,
                    ) in sorted_results:
                        if ping <= ping_range_see:
                            if warp1111[10] == "1\n":
                                save_result.append("\n")
                                save_result.append(
                                    ip
                                    + " | "
                                    + "ping: "
                                    + str(ping)
                                    + "packet_loss: "
                                    + str(loss_rate)
                                    + "jitter: "
                                    + str(jitter)
                                )
                            else:
                                save_result.append("\n")
                                save_result.append(
                                    ip
                                    + ":"
                                    + " | "
                                    + "ping: "
                                    + str(ping)
                                    + "packet_loss: "
                                    + str(loss_rate)
                                    + "jitter: "
                                    + str(jitter)
                                )
                best_result = sorted_results[0]
                while len(sorted_results) < 10:
                    sorted_results.append(("No IP", None, None, 100, 1000))
                check_ac()
                return

        try:
            for w in tabview.tab("table").winfo_children():
                if "treeview" in str(w):
                    w.pack_forget()
        except Exception:
            pass
        table = ttk.Treeview(
            tabview.tab("table"),
            columns=(
                "IP",
                "Port",
                "Ping (ms)",
                "Packet Loss (%)",
                "Jitter (ms)",
                "Score",
            ),
            show="headings",
        )
        table.pack(fill=tk.BOTH)
        style = ttk.Style(tabview.tab("table"))
        style.configure("Treeview", rowheight=30)
        table.heading("IP", text="IP")
        table.heading("Port", text="port")
        table.heading("Ping (ms)", text="Ping (ms)")
        table.heading("Packet Loss (%)", text="Packet Loss (%)")
        table.heading("Jitter (ms)", text="jitter (ms)")
        table.heading("Score", text="Score")
        tabview.set("table")
        rootmainactivity.geometry("1200x500")
        main_menu()

    def main_move():
        global WH_ipVersion
        global results
        label_best.delete(1.0, "end")
        results = []
        WH_ipVersion = "ipv4"
        if radio_var.get() == 2:
            thread = threading.Thread(target=main)
            thread.start()
        else:
            option = optionmenu.get()
            if option == "wireguard configure":
                theard_wireguard_config_ok()
            elif option == "configure without ip scan":
                theard_wireguard_config_without()
            elif option == "wireguard with a sub link":
                theard_wireguard_config_sub()
            elif option == "wireguard for v2rayN Pro and my scanner":
                theard_v2ray()
            elif option == "v2rayN Pro without ip scan and my scanner":
                theard_v2ray_without()

    def main_move_v6():
        global results
        results = []
        label_best.delete(1.0, "end")
        global WH_ipVersion
        WH_ipVersion = "ipv6"
        if radio_var.get() == 2:
            thread = threading.Thread(target=main)
            thread.start()
        else:
            option = optionmenu.get()
            if option == "wireguard configure":
                theard_wireguard_config_ok()
            elif option == "configure without ip scan":
                theard_wireguard_config_without()
            elif option == "wireguard with a sub link":
                theard_wireguard_config_sub()
            elif option == "wireguard for v2rayN Pro and my scanner":
                theard_v2ray()
            elif option == "v2rayN Pro without ip scan and my scanner":
                theard_v2ray_without()

    def clean():
        try:
            with open("result.txt", "r") as f:
                lines = f.read().splitlines()
                if not lines:
                    raise ValueError("Result file is empty")
                first_line = lines[0]
            if "|" not in first_line:
                raise ValueError("Invalid format in result file")
            with open("warp_setting", "r") as f2:
                warp_settings = f2.read().splitlines()
                separator = (
                    "," if len(warp_settings) > 2 and warp_settings[2] == "2" else "\n"
                )
            clean_result = []
            ip_count = 0
            for line in lines:
                ip_part = line.split("|")[0].strip()
                if ip_part:
                    clean_result.append(f"{ip_part}{separator}")
                    ip_count += 1
            with (
                open("clean_result.txt", "w") as txt_file,
                open("clean_result.csv", "w") as csv_file,
            ):
                txt_file.writelines(clean_result)
                csv_file.writelines(clean_result)
            labelmain1.configure(text="\n\n\n\nFinished")
            label_best.delete(1.0, tk.END)
            label_best.insert(1.0, f"{ip_count} IPs")
        except (FileNotFoundError, IndexError, ValueError) as e:
            logging.error(f"Error in clean function: {e}")
            labelmain1.configure(text="\n\n\n\nError")
            label_best.insert(1.0, "0 IPs")

    def on_tab_change():
        selected_tab = tabview.get()
        if selected_tab == "table":
            rootmainactivity.geometry("1200x500")
        elif (
            selected_tab == "main" or selected_tab == "vpn" or selected_tab == "configs"
        ):
            rootmainactivity.geometry("500x550")

    rootmainactivity = ctk.CTk()
    rootmainactivity.protocol("WM_TAKE_FOCUS")
    rootmainactivity.geometry("500x550")
    rootmainactivity.geometry("+200+100")
    rootmainactivity.title("main activity ")
    rootmainactivity.configure(cursor="arrow")
    rootmainactivity.attributes("-alpha", 1.0)
    if not os.path.exists("xray"):
        label_sure = ctk.CTkLabel(rootmainactivity, text="Could not find xray folder")
        label_sure.pack(fill=tk.X, side="top")
        rootmainactivity.mainloop()

    def or_you_sure():
        global is_hy2
        print("igo")
        remove_proxy()
        if is_hy2:
            subprocess.call(
                ["taskkill", "/F", "/IM", "hy2/hysteria.exe"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=subprocess.CREATE_NO_WINDOW,
            )
        subprocess.call(
            ["taskkill", "/F", "/IM", "xray.exe"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        subprocess.call(
            ["taskkill", "/F", "/IM", "xray.exe"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            creationflags=subprocess.CREATE_NO_WINDOW,
        )
        remove_proxy()
        clear_widgets(rootmainactivity)
        rootmainactivity.destroy()
        exit()

    rootmainactivity.protocol("WM_DELETE_WINDOW", or_you_sure)
    tabview = ctk.CTkTabview(master=rootmainactivity, width=500, command=on_tab_change)
    tabview.place(relwidth=1, relheight=1)
    tabview.add("main")
    tabview.add("vpn")
    tabview.add("configs")
    tabview.add("table")
    with open("warp_setting", "r") as f:
        tep = f.readlines()
    if tep[13] == "2\n":
        tabview.set("main")  # set currently visible tab
    else:
        tabview.set("vpn")
    menu_image = ctk.CTkImage(
        light_image=Image.open("imgs/profile.png"),
        dark_image=Image.open("imgs/profile.png"),
        size=(150, 150),
    )

    def restart():
        os.execv(sys.executable, ["python"] + sys.argv)

    def toggle_menu_r():
        menu_frame.lift()
        toggle_menu_button.lift()
        rootmainactivity.update_idletasks()  # اطمینان از مقدار صحیح عرض منو
        menu_width = menu_frame.winfo_width()
        window_width = rootmainactivity.winfo_width()
        if menu_frame.winfo_x() >= window_width:  # اگر منو مخفی است، آن را باز کن
            toggle_menu_button.configure(text="Close")
            menu_frame.place(x=window_width - menu_width, y=0)
        else:  # اگر منو باز است، آن را مخفی کن
            toggle_menu_button.configure(text="Menu")
            menu_frame.place(x=window_width, y=0)

    def About():
        def Github_link(event):
            open_new(r"https://github.com/arshiacomplus/WarpScanner/releases")

        def Telegram_link(event):
            open_new(r"https://t.me/arshia_mod_fun")

        def copy_donate(event):
            root_about.clipboard_append("TKUpVDG5DqLDUSg3X1hhidRPuhm1GmqZ2G")
            trx.configure(text="Copied")

        root_about = ctk.CTkToplevel(rootmainactivity)
        root_about.protocol("WM_TAKE_FOCUS")
        root_about.title("About")
        root_about.configure(cursor="heart")
        root_about.geometry("+200+50")
        root_about.geometry("600x600")
        frame_root_about = ctk.CTkFrame(
            root_about, corner_radius=25, fg_color="#0DFACF"
        )
        frame_root_about.pack(fill=tk.X, pady=(0, 10))
        label_about = ctk.CTkLabel(
            frame_root_about,
            text="This is an Warp Scanner For win",
            text_color="black",
            corner_radius=10,
            fg_color="gray",
        )
        label_about.pack(ipadx=10)
        frame_root_about_links = ctk.CTkFrame(
            root_about, corner_radius=25, fg_color="#0DB7FA"
        )
        frame_root_about_links.pack(fill=tk.X)
        label_about1 = ctk.CTkLabel(
            frame_root_about_links, text_color="black", text="Github Link :"
        )
        label_about1.pack(ipady=10, ipadx=5)
        link_git = ctk.CTkLabel(
            frame_root_about_links,
            text="Github",
            text_color="black",
            fg_color="#FA0DA3",
            cursor="hand2",
            corner_radius=20,
        )
        link_git.pack(ipady=10, ipadx=5)
        link_git.bind("<Button-1>", Github_link)
        label_about2 = ctk.CTkLabel(
            frame_root_about_links, text_color="black", text="Telegram Link :"
        )
        label_about2.pack(ipady=10, ipadx=5)
        link_tel = ctk.CTkLabel(
            frame_root_about_links,
            text="Telegram",
            text_color="black",
            fg_color="#FA0DA3",
            cursor="hand2",
            corner_radius=20,
        )
        link_tel.pack(ipady=10, ipadx=5, pady=(0, 5))
        link_tel.bind("<Button-1>", Telegram_link)
        frame_root_about_donate = ctk.CTkFrame(
            root_about, corner_radius=25, fg_color="#0DFA44"
        )
        frame_root_about_donate.pack(fill=tk.X, pady=5)
        label_about2 = ctk.CTkLabel(
            frame_root_about_donate, text_color="black", text="Donate:"
        )
        label_about2.pack()
        trx = ctk.CTkLabel(
            frame_root_about_donate,
            text_color="black",
            fg_color="#F2FA0D",
            text="Trx/ click to copy: \n\nTKUpVDG5DqLDUSg3X1hhidRPuhm1GmqZ2G",
            cursor="hand2",
            corner_radius=20,
        )
        trx.pack(pady=5, ipady=5)
        trx.bind("<Button-1>", copy_donate)
        frame_root_about_who = ctk.CTkFrame(
            root_about, corner_radius=25, fg_color="#FA830D"
        )
        frame_root_about_who.pack(side=tk.BOTTOM, fill=tk.X, pady=5)
        label_about2 = ctk.CTkLabel(
            frame_root_about_who,
            text_color="white",
            fg_color="#490DFF",
            text="Created by Arshiacomplus",
            corner_radius=20,
        )
        label_about2.pack(ipady=10)
        root_about.mainloop()

    def Setting():
        # button_left=ctk.CTkButton(rootmainactivity,text="", width=5,image=back_arrow,bg_color="#000000",fg_color="#000000")
        # button_left.place(y=0,x=430)
        def faster_warn():
            error_window = ctk.CTkToplevel(rootmainactivity)
            error_window.grab_set()
            error_window.title("Warning")
            error_window.geometry("300x100")
            error_window.geometry("+100+200")
            # warn_icon=tksvg.SvgImage(file="imgs/warn.svg")
            ctk.CTkLabel(
                error_window,
                compound="right",
                text="if you have weak system , please do not use it ",
            ).pack(pady=20)
            ctk.CTkButton(error_window, text="Ok!", command=error_window.destroy).pack()

        def api_no():
            error_window = ctk.CTkToplevel(rootmainactivity)
            error_window.grab_set()
            error_window.title("Warning")
            error_window.geometry("300x100")
            error_window.geometry("+100+200")
            # warn_icon=tksvg.SvgImage(file="imgs/warn.svg")
            ctk.CTkLabel(
                error_window,
                compound="right",
                text="This api don not work , please do not use it !",
            ).pack(pady=20)
            ctk.CTkButton(error_window, text="Ok!", command=error_window.destroy).pack()

        def sumbit_f():
            global interval_see
            global count_see
            global timeout_see
            global ping_range_see
            labe.place_forget()
            Cpu_speed = ""
            Do_you_save = ""
            toggle_menu_button.configure(text="Menu")
            for i in range(0, rootmainactivity.winfo_screenwidth(), 10):
                scrollable_frame.place(x=i, y=0)
            with open("warp_setting", "r") as f:
                warp = f.readlines()
            print("hello", int(checkbox_var.get()))
            if int(checkbox_var.get()) == 1:
                Cpu_speed = "2\n"
            else:
                Cpu_speed = "1\n"
            if checkbox_var2.get() == 1:
                Do_you_save = "2\n"
            if checkbox_var2.get() == 0:
                Do_you_save = "1\n"
            if checkbox_var3.get() == 1:
                wich_p = "2\n"
            elif checkbox_var3.get() == 0:
                wich_p = "1\n"
            else:
                wich_p = "3\n"
            if checkbox_var4.get() == 1:
                api = "2\n"
            elif checkbox_var4.get() == 0:
                api = "1\n"
            if checkbox_var10.get() == 1:
                is_port = "2\n"
            elif checkbox_var10.get() == 0:
                is_port = "1\n"
            icmp_interval_get = interval.get() + "\n"
            icmp_count_get = count.get() + "\n"
            icmp_timeout_get = timeout.get() + "\n"
            ping_range_get = ping_range.get() + "\n"
            formsing = "1\n"
            if checkbox_var8.get() == 1:
                formsing = "2\n"
            else:
                formsing == "1\n"
            wh_v2 = "2\n"
            if checkbox_var9.get() == 1:
                wh_v2 = "2\n"
            elif checkbox_var9.get() == 0:
                wh_v2 = "1\n"
            print(wh_v2, "wwww")
            theme = ""
            if checkbox_var11.get() == 1:
                theme = "2\n"
            elif checkbox_var11.get() == 0:
                theme = "1\n"
            else:
                theme = "3\n"
            cd_g = "2\n"
            if checkbox_var12.get() == 1:
                cd_g = "2\n"
            elif checkbox_var12.get() == 0:
                cd_g = "1\n"
            f_tab = "2\n"
            if checkbox_var15.get() == 1:
                f_tab = "2\n"
            elif checkbox_var15.get() == 0:
                f_tab = "1\n"
            with open("warp_setting", "w") as f:
                warp[0] = Cpu_speed
                warp[1] = Do_you_save
                warp[2] = wich_p
                warp[3] = api
                warp[4] = icmp_interval_get
                warp[5] = icmp_count_get
                warp[6] = icmp_timeout_get
                warp[7] = ping_range_get
                warp[8] = formsing
                warp[9] = wh_v2
                warp[10] = is_port
                warp[11] = theme
                warp[12] = cd_g
                warp[13] = f_tab
                warp[14] = str(switch.get()) + "\n"
                if configtextbox.get("1.0", tk.END).strip() == "":
                    warp[15] = " \n"
                else:
                    warp[15] = str(configtextbox.get("1.0", tk.END).strip()) + "\n"
                f.writelines(warp)
            interval_see = warp[4]
            interval_see = int(interval_see[: interval_see.index("\n")])
            count_see = warp[5]
            count_see = int(count_see[: count_see.index("\n")])
            timeout_see = warp[6]
            timeout_see = int(timeout_see[: timeout_see.index("\n")])
            ping_range_see = warp[7]
            ping_range_see = int(ping_range_see[: ping_range_see.index("\n")])
            menu_frame.place_forget()
            menu_frame.pack_forget()
            clear_widgets(scrollable_frame)
            clear_widgets(slide_frame)
            scrollable_frame.place_forget()
            scrollable_frame.pack_forget()
            scrollable_frame.destroy()
            slide_frame.destroy()
            tabview.tab("main").update()
            gc.collect()
            return

        def event_submit_f(eee):
            sumbit_f()
            return

        menu_frame.place(x=tabview.tab("main").winfo_screenwidth(), y=0)
        height_root = tabview.tab("main").winfo_height()
        # height_root=500
        slide_frame = ctk.CTkFrame(tabview.tab("main"), width=200, height=height_root)
        slide_frame.pack(side="right", fill="y", expand=True)
        slide_frame.place(x=tabview.tab("main").winfo_screenwidth(), y=0)
        scrollable_frame = ctk.CTkScrollableFrame(
            tabview.tab("main"), width=170, height=height_root
        )
        scrollable_frame.pack(padx=10, pady=10, fill="both")
        # speed_icon=tksvg.SvgImage(file="imgs/speedometer.svg")
        spu_label = ctk.CTkLabel(scrollable_frame, compound="right", text="Scan speed ")
        scrollable_frame.lift()
        back_arrow = ctk.CTkImage(
            light_image=Image.open("imgs/arrow.png"),
            dark_image=Image.open("imgs/arrow_light.png"),
            size=(25, 25),
        )
        labe = ctk.CTkLabel(
            tabview.tab("main"),
            text="",
            image=back_arrow,
            fg_color="transparent",
            corner_radius=10,
        )
        labe.place(y=0, x=rootmainactivity.winfo_width() - 50)
        labe.bind("<Button-1>", event_submit_f)
        labe.lift()
        spu_label.pack(fill=tk.X)
        checkbox_var = ctk.IntVar()
        with open("warp_setting", "r") as f:
            num = f.readlines()
        print(len(num))
        checkbox_var = ctk.IntVar()
        if num[0] == "2\n":
            checkbox_var = ctk.IntVar(value=1)
        elif num[0] == "1\n":
            checkbox_var = ctk.IntVar(value=0)
        checkbox1 = ctk.CTkCheckBox(
            scrollable_frame,
            command=faster_warn,
            text="Faster",
            variable=checkbox_var,
            onvalue=1,
            offvalue=0,
        )
        checkbox1.bind("<Enter>", hand2)
        checkbox2 = ctk.CTkCheckBox(
            scrollable_frame,
            text="Slower",
            variable=checkbox_var,
            onvalue=0,
            offvalue=0,
        )
        checkbox2.bind("<Enter>", hand2)
        pack_widgets([checkbox1, checkbox2], ipady=5, fill=tk.X)
        checkbox_var12 = ctk.IntVar()
        cd_gcore = ctk.CTkLabel(
            scrollable_frame, compound="right", text="which ip range"
        )
        cd_gcore.pack(fill=tk.X)
        if num[12] == "2\n":
            checkbox_var12 = ctk.IntVar(value=1)
        else:
            checkbox_var12 = ctk.IntVar(value=0)
        checkbox19 = ctk.CTkCheckBox(
            scrollable_frame,
            text="warp",
            variable=checkbox_var12,
            onvalue=1,
            offvalue=0,
        )
        checkbox19.bind("<Enter>", hand2)
        checkbox20 = ctk.CTkCheckBox(
            scrollable_frame,
            text="gcore",
            variable=checkbox_var12,
            onvalue=0,
            offvalue=0,
        )
        checkbox20.bind("<Enter>", hand2)
        pack_widgets([checkbox19, checkbox20], ipady=5, fill=tk.X)
        save_ch = ctk.CTkLabel(scrollable_frame, compound="right", text="Save result ")
        save_ch.pack(fill=tk.X)
        if num[1] == "2\n":
            checkbox_var2 = ctk.IntVar(value=1)
        else:
            checkbox_var2 = ctk.IntVar(value=0)
        checkbox3 = ctk.CTkCheckBox(
            scrollable_frame, text="Yes", variable=checkbox_var2, onvalue=1, offvalue=0
        )
        checkbox3.bind("<Enter>", hand2)
        checkbox4 = ctk.CTkCheckBox(
            scrollable_frame, text="No", variable=checkbox_var2, onvalue=0, offvalue=0
        )
        checkbox4.bind("<Enter>", hand2)
        pack_widgets([checkbox3, checkbox4], ipady=5, fill=tk.X)
        # which_icon=tksvg.SvgImage(file="imgs/pannel.svg")
        which_panel = ctk.CTkLabel(
            scrollable_frame, compound="right", text="Which panel "
        )
        which_panel.pack(fill=tk.X)
        checkbox_var3 = ctk.IntVar()
        print(num[2], "hhh")
        if num[2] == "2\n":
            checkbox_var3 = ctk.IntVar(value=1)
        elif num[2] == "1\n":
            checkbox_var3 = ctk.IntVar(value=0)
        else:
            checkbox_var3 = ctk.IntVar(value=2)
        checkbox5 = ctk.CTkCheckBox(
            scrollable_frame, text="bpb", variable=checkbox_var3, onvalue=1, offvalue=0
        )
        checkbox5.bind("<Enter>", hand2)
        checkbox6 = ctk.CTkCheckBox(
            scrollable_frame,
            text="vahid",
            variable=checkbox_var3,
            onvalue=0,
            offvalue=0,
        )
        checkbox6.bind("<Enter>", hand2)
        checkbox7 = ctk.CTkCheckBox(
            scrollable_frame,
            text="with score",
            variable=checkbox_var3,
            onvalue=2,
            offvalue=0,
        )
        checkbox7.bind("<Enter>", hand2)
        pack_widgets([checkbox5, checkbox6, checkbox7], ipady=5, fill=tk.X)
        if num[13] == "2\n":
            checkbox_var15 = ctk.IntVar(value=1)
        else:
            checkbox_var15 = ctk.IntVar(value=0)
        which_tab = ctk.CTkLabel(scrollable_frame, compound="right", text="first tab")
        which_tab.pack(fill=tk.X)
        checkbox23 = ctk.CTkCheckBox(
            scrollable_frame,
            text="main",
            variable=checkbox_var15,
            onvalue=1,
            offvalue=0,
        )
        checkbox23.bind("<Enter>", hand2)
        checkbox24 = ctk.CTkCheckBox(
            scrollable_frame, text="vpn", variable=checkbox_var15, onvalue=0, offvalue=0
        )
        pack_widgets([checkbox23, checkbox24], ipady=5, fill=tk.X)
        checkbox24.bind("<Enter>", hand2)
        # theme_icon=tksvg.SvgImage(file="imgs/theme.svg")
        which_theme = ctk.CTkLabel(scrollable_frame, compound="right", text="theme ")
        which_theme.pack(fill=tk.X)
        checkbox_var11 = ctk.IntVar()
        print(num[11], "hhh")
        if num[11] == "2\n":
            checkbox_var11 = ctk.IntVar(value=1)
        elif num[11] == "1\n":
            checkbox_var11 = ctk.IntVar(value=0)
        else:
            checkbox_var11 = ctk.IntVar(value=2)
        checkbox16 = ctk.CTkCheckBox(
            scrollable_frame,
            text="system",
            variable=checkbox_var11,
            onvalue=1,
            offvalue=0,
        )
        checkbox16.bind("<Enter>", hand2)
        checkbox17 = ctk.CTkCheckBox(
            scrollable_frame,
            text="dark",
            variable=checkbox_var11,
            onvalue=0,
            offvalue=0,
        )
        checkbox17.bind("<Enter>", hand2)
        checkbox18 = ctk.CTkCheckBox(
            scrollable_frame,
            text="light",
            variable=checkbox_var11,
            onvalue=2,
            offvalue=0,
        )
        checkbox18.bind("<Enter>", hand2)
        pack_widgets([checkbox16, checkbox17, checkbox18], ipady=5, fill=tk.X)
        checkbox_var10 = ctk.IntVar()
        is_port_la = ctk.CTkLabel(
            scrollable_frame, compound="right", text="Save with port "
        )
        is_port_la.pack(fill=tk.X)
        if num[10] == "2\n":
            checkbox_var10 = ctk.IntVar(value=1)
        else:
            checkbox_var10 = ctk.IntVar(value=0)
        checkbox15 = ctk.CTkCheckBox(
            scrollable_frame, text="Yes", variable=checkbox_var10, onvalue=1, offvalue=0
        )
        checkbox15.bind("<Enter>", hand2)
        checkbox14 = ctk.CTkCheckBox(
            scrollable_frame, text="No", variable=checkbox_var10, onvalue=0, offvalue=0
        )
        checkbox14.bind("<Enter>", hand2)
        pack_widgets([checkbox15, checkbox14], ipady=5, fill=tk.X)
        # api_icon=tksvg.SvgImage(file="imgs/api.svg")
        Wh_api = ctk.CTkLabel(scrollable_frame, compound="right", text="Which api ")
        Wh_api.pack(fill=tk.X)
        checkbox_var4 = ctk.IntVar()
        with open("warp_setting", "r") as f:
            num33 = f.readlines()
        if num33[3] == "2\n":
            checkbox_var4 = ctk.IntVar(value=1)
        elif num33[3] == "1\n":
            checkbox_var4 = ctk.IntVar(value=0)
        checkbox8 = ctk.CTkCheckBox(
            scrollable_frame,
            command=api_no,
            text="api 1/not work",
            variable=checkbox_var4,
            onvalue=1,
            offvalue=0,
        )
        checkbox8.bind("<Enter>", hand2)
        checkbox9 = ctk.CTkCheckBox(
            scrollable_frame,
            text="api 2",
            variable=checkbox_var4,
            onvalue=0,
            offvalue=0,
        )
        checkbox9.bind("<Enter>", hand2)
        pack_widgets([checkbox8, checkbox9], ipady=5, fill=tk.X)
        # format_icon=tksvg.SvgImage(file="imgs/format.svg")
        save_ch = ctk.CTkLabel(
            scrollable_frame, compound="right", text="sing-box formt "
        )
        save_ch.pack(fill=tk.X)
        checkbox_var8 = ctk.IntVar()
        if num[8] == "2\n":
            checkbox_var8 = ctk.IntVar(value=1)
        else:
            checkbox_var8 = ctk.IntVar(value=0)
        checkbox10 = ctk.CTkCheckBox(
            scrollable_frame,
            text="sing-box - hiddify(old)",
            variable=checkbox_var8,
            onvalue=1,
            offvalue=0,
        )
        checkbox10.bind("<Enter>", hand2)
        checkbox11 = ctk.CTkCheckBox(
            scrollable_frame,
            text="Just hiddify(New)",
            variable=checkbox_var8,
            onvalue=0,
            offvalue=0,
        )
        checkbox11.bind("<Enter>", hand2)
        pack_widgets([checkbox10, checkbox11], ipady=5, fill=tk.X)
        save_ch2 = ctk.CTkLabel(scrollable_frame, compound="right", text="v2ray formt ")
        save_ch2.pack(fill=tk.X)
        checkbox_var9 = ctk.IntVar()
        if num[9] == "2\n":
            checkbox_var9 = ctk.IntVar(value=1)
        else:
            checkbox_var9 = ctk.IntVar(value=0)
        checkbox12 = ctk.CTkCheckBox(
            scrollable_frame,
            text="v2rayN pro(old)",
            variable=checkbox_var9,
            onvalue=1,
            offvalue=0,
        )
        checkbox12.bind("<Enter>", hand2)
        checkbox13 = ctk.CTkCheckBox(
            scrollable_frame,
            text="v2rayN pro(New)",
            variable=checkbox_var9,
            onvalue=0,
            offvalue=0,
        )
        checkbox13.bind("<Enter>", hand2)
        pack_widgets([checkbox12, checkbox13], ipady=5, fill=tk.X)
        # range_icon=tksvg.SvgImage(file="imgs/range.svg")
        ping_lab = ctk.CTkLabel(scrollable_frame, compound="right", text="ping range ")
        ping_lab.pack(fill=tk.X)
        with open("warp_setting", "r") as f:
            num33 = f.readlines()
        num33 = num33[7]
        num33 = num33[: num33.index("\n")]
        ping_range = ctk.CTkEntry(scrollable_frame, placeholder_text="50~250", width=25)
        ping_range.pack(padx=10, pady=10, fill=tk.X)
        ping_range.insert(0, num33)
        # icmp=pinging(ip, count=count_see ,interval=interval_see,timeout=timeout_see,family="ipv4" )
        advane = ctk.CTkLabel(scrollable_frame, text="<Advance>\n")
        advane.pack(fill=tk.X)
        with open("warp_setting", "r") as f:
            num33 = f.readlines()
        num33 = num33[4]
        num33 = num33[: num33.index("\n")]
        # interval_icon=tksvg.SvgImage(file="imgs/interval.svg")
        icmp_interval = ctk.CTkLabel(
            scrollable_frame, compound="right", text="icmp_interval "
        )
        icmp_interval.pack(fill=tk.X)
        interval = ctk.CTkEntry(scrollable_frame, placeholder_text="1~5", width=25)
        interval.pack(padx=10, pady=10, fill=tk.X)
        interval.insert(0, num33)
        with open("warp_setting", "r") as f:
            num33 = f.readlines()
        num33 = num33[5]
        num33 = num33[: num33.index("\n")]
        # count_icon=tksvg.SvgImage(file="imgs/count.svg")
        icmp_count = ctk.CTkLabel(
            scrollable_frame, compound="right", text="icmp_ping_count "
        )
        icmp_count.pack(fill=tk.X)
        count = ctk.CTkEntry(scrollable_frame, placeholder_text="2~10", width=25)
        count.pack(padx=10, pady=10, fill=tk.X)
        count.insert(0, num33)
        with open("warp_setting", "r") as f:
            num33 = f.readlines()
        num33 = num33[6]
        num33 = num33[: num33.index("\n")]
        # timeout_icon=tksvg.SvgImage(file="imgs/timeout.svg")
        icmp_timeout = ctk.CTkLabel(
            scrollable_frame, compound="right", text="icmp_timeout "
        )
        icmp_timeout.pack(fill=tk.X)
        timeout = ctk.CTkEntry(scrollable_frame, placeholder_text="5~10", width=25)
        timeout.pack(padx=10, pady=10, fill=tk.X)
        timeout.insert(0, num33)
        num33 = num[14].strip()
        switch_var = ctk.StringVar(value=num33)
        switch = ctk.CTkSwitch(
            scrollable_frame,
            text="config ping",
            variable=switch_var,
            onvalue="on",
            offvalue="off",
        )
        switch.pack(pady=5, ipady=5, fill=tk.X)
        submit = ctk.CTkButton(scrollable_frame, text="save", command=sumbit_f)
        num33 = num[15].strip()
        configtextbox = ctk.CTkTextbox(scrollable_frame, height=100)
        configtextbox.pack(fill=tk.X)
        configtextbox.insert(1.0, num33)
        submit.pack(pady=5, ipady=5, fill=tk.X)
        submit.bind("<Enter>", hand2)
        scrollable_frame.place(
            x=tabview.tab("main").winfo_width() - menu_frame.winfo_width() - 40, y=0
        )
        rootmainactivity.update()

    def check_up():
        def Github_link():
            open_new(r"https://github.com/arshiacomplus/WarpScanner/releases")

        def on_go():
            ret = Check_for_update()
            if ret[0] == True:
                label_up = ctk.CTkLabel(
                    rootupdate,
                    font=("Helvetica", 12, "bold"),
                    text=f"New version Available {ret[1]}",
                )
                label_up.pack(fill=tk.X)
                button_up = ctk.CTkButton(
                    rootupdate,
                    font=("Helvetica", 12, "bold"),
                    text="click to update",
                    command=Github_link,
                )
                button_up.pack(fill=tk.X, side=tk.BOTTOM)
                button_up.bind("<Enter>", hand2)
            else:
                label_up = ctk.CTkLabel(
                    rootupdate,
                    font=("Helvetica", 12, "bold"),
                    text="New version v0.5.2:\nGood news:\n\nbetter Graphic\n\nfix Bugs\n\nBad news:\n\nNotihng:))",
                )
                label_up.pack(fill=tk.X)
                button_up = ctk.CTkButton(
                    rootupdate,
                    font=("Helvetica", 12, "bold"),
                    text="Close",
                    command=rootupdate.destroy,
                )
                button_up.pack(fill=tk.X, side=tk.BOTTOM)
                button_up.bind("<Enter>", hand2)

        rootupdate = ctk.CTk()
        rootupdate.title("Update")
        on_go()
        rootupdate.geometry("500x250")
        rootupdate.geometry("+200+100")
        rootupdate.mainloop()

    def theard_check_up():
        thread = threading.Thread(target=check_up)
        thread.start()

    def close_frame(event):
        clear_widgets(menu_frame)
        menu_frame.destroy()

    #     labelmain=tk.Label(rootmainactivity, width=50, padx=50,pady=10, fg="blue" ,text="""Hello This is my Scanner
    # created by Telegram= @arshiacomplus\n""")
    #     labelmain.pack()
    height_root = tabview.tab("main").winfo_screenheight()
    menu_frame = ctk.CTkFrame(tabview.tab("main"), width=150, height=height_root)
    menu_frame.pack(side="right", fill="y", padx=5, expand=True)
    menu_frame.place(x=tabview.tab("main").winfo_screenwidth(), y=0)
    label_pro = ctk.CTkLabel(menu_frame, image=menu_image)
    label_pro.pack(pady=50)
    label_pro.configure(cursor="pirate")
    Setting_button = ctk.CTkButton(
        menu_frame, text="Setting", compound="right", command=Setting
    )
    Setting_button.bind("<Enter>", hand2)
    up_button = ctk.CTkButton(
        menu_frame, text="Check for update", compound="right", command=theard_check_up
    )
    up_button.bind("<Enter>", hand2)
    About_button = ctk.CTkButton(
        menu_frame, text="About", compound="right", command=About
    )
    About_button.bind("<Enter>", hand2)
    exit_button = ctk.CTkButton(
        menu_frame, text="Exit", compound="right", command=tabview.tab("main").quit
    )
    exit_button.bind("<Enter>", hand2)
    label_arshia = ctk.CTkLabel(menu_frame, text="by arshiacomplus\nv0.5.2")
    pack_widgets(
        [Setting_button, up_button, About_button, exit_button, label_arshia],
        pady=5,
        ipady=5,
        fill=tk.BOTH,
    )
    toggle_menu_button = ctk.CTkButton(
        tabview.tab("main"),
        height=40,
        width=70,
        compound="right",
        text="Menu",
        command=lambda: toggle_menu_r(),
    )
    toggle_menu_button.pack(side="right", anchor="ne")

    def theard_check_ip6_again(event):
        def check_ip6_again():
            global check
            time.sleep(3)
            label_ipv4.configure(text="ipv4 : Checking ", corner_radius=8)
            label_ipv6.configure(text="ipv6 : Checking ", corner_radius=8)
            tabview.tab("main").update()
            time.sleep(2.5)
            check = "none"
            check = check_ipv6()
            if check[0] == "Available":
                color1 = "green"
            else:
                color1 = "red"
            if check[1] == "Available":
                color2 = "green"
            else:
                color2 = "red"
            label_ipv4.configure(text=f"ipv4 : {check[0]}")
            label_ipv4.configure(fg_color=color1)
            label_ipv6.configure(text=f"ipv6 : {check[1]}")
            label_ipv6.configure(fg_color=color2)
            tabview.tab("main").update()

        thread = threading.Thread(target=check_ip6_again)
        thread.start()

    def ratio_event():
        global ty, ty2
        try:
            tabview.delete("table")
        except Exception:
            pass
        if radio_var.get() == 1:
            label_best.configure(height=50)
            forget_widget_list([button, button1, button3])
            optionmenu.pack(
                fill=tk.X,
                anchor="center",
                pady=4,
            )
            if ty:
                how_menypp.pack(fill=tk.X, anchor="center")
            if ty2:
                optionmenu_gi.pack()
            button.bind("<Enter>", hand2)
            button1.bind("<Enter>", hand2)
            button3.bind("<Enter>", hand2)
            pack_widgets(
                [button, button1, button3],
                fill=tk.X,
                anchor="center",
                pady=4,
            )
        else:
            label_best.configure(height=1)
            ty = False
            try:
                how_menypp.pack_info()
                ty = True
            except tk.TclError:
                t2 = False
            if ty:
                how_menypp.pack_forget()
            optionmenu.pack_forget()
            ty2 = False
            try:
                optionmenu_gi.pack_info()
                ty2 = True
            except tk.TclError:
                ty2 = False
            if ty2:
                optionmenu_gi.pack_forget()

    def need_how_meny(*args):
        if optionmenu.get() == "wireguard with a sub link":
            forget_widget_list([button, button1, button3])
            how_menypp.pack(fill=tk.X, anchor="center")
            button.bind("<Enter>", hand2)
            button1.bind("<Enter>", hand2)
            button3.bind("<Enter>", hand2)
            pack_widgets(
                [button, button1, button3],
                fill=tk.X,
                anchor="center",
                pady=4,
            )
        else:
            how_menypp.pack_forget()

    label_ipv4 = ctk.CTkLabel(
        tabview.tab("main"), text="ipv4 : checking ", compound="right", corner_radius=8
    )
    label_ipv4.pack(side="top", anchor="nw", pady=2)
    label_ipv6 = ctk.CTkLabel(
        tabview.tab("main"), text="ipv6 : checking ", compound="right", corner_radius=8
    )
    label_ipv6.pack(side="top", anchor="nw")
    ch_ag = ctk.CTkLabel(
        tabview.tab("main"),
        text="Check again ",
        compound="right",
        text_color="#848484",
        corner_radius=8,
    )
    ch_ag.pack(pady=3, side="top", anchor="nw")
    ch_ag.bind("<Button-1>", theard_check_ip6_again)
    ch_ag.bind("<Enter>", hand2)
    theard_check_ip6_again("none")
    labelmain1 = ctk.CTkLabel(tabview.tab("main"), text="\n\n\n\nClick to scan ip")
    label_best = ctk.CTkTextbox(tabview.tab("main"), width=50, height=1)
    how_menypp = ctk.CTkEntry(tabview.tab("main"), placeholder_text="haw many ? (2~4)")
    radio_var = tk.IntVar(value=2)
    radiobutton_1 = ctk.CTkRadioButton(
        tabview.tab("main"),
        text="IP scanning ",
        command=ratio_event,
        variable=radio_var,
        value=2,
    )
    radiobutton_2 = ctk.CTkRadioButton(
        tabview.tab("main"),
        text="Get config",
        command=ratio_event,
        variable=radio_var,
        value=1,
    )
    optionmenu = ctk.CTkOptionMenu(
        tabview.tab("main"),
        values=[
            "wireguard configure",
            "configure without ip scan",
            "wireguard with a sub link",
            "wireguard for v2rayN Pro and my scanner",
            "v2rayN Pro without ip scan and my scanner",
        ],
        command=need_how_meny,
    )
    optionmenu_gi = ctk.CTkOptionMenu(
        tabview.tab("main"),
        values=[
            "Iran",
            "German",
        ],
        command=need_how_meny,
    )
    button = ctk.CTkButton(
        tabview.tab("main"), width=5, compound="right", text="ipV4", command=main_move
    )
    button1 = ctk.CTkButton(
        tabview.tab("main"),
        width=5,
        compound="right",
        text="ipV6",
        command=main_move_v6,
    )
    button3 = ctk.CTkButton(
        tabview.tab("main"), width=5, compound="right", text="clean", command=clean
    )
    pack_widgets([labelmain1, label_best], fill=tk.X, anchor="center", pady=10)
    pack_widgets([radiobutton_1, radiobutton_2], anchor="center", pady=4)
    button.bind("<Enter>", hand2)
    button1.bind("<Enter>", hand2)
    button3.bind("<Enter>", hand2)
    pack_widgets(
        [button, button1, button3],
        fill=tk.X,
        anchor="center",
        pady=4,
    )  #################### vpn view

    def is_frag_or_wire(nn):
        op = is_warp_or_not.get()
        if op == "wiregaurd config setting":
            (
                forget_widgets(button_frame),
                forget_widgets(button_frame2),
                forget_widgets(button_frame3),
            )
            wireguard_la.pack(fill=tk.X, pady=5, padx=5, side=tk.LEFT)
            wireguard.pack(fill=tk.X)
        elif op == "fragment setting":
            (
                forget_widgets(button_frame),
                forget_widgets(button_frame2),
                forget_widgets(button_frame3),
            )
            pack_widgets(
                [
                    packets_la,
                    packets,
                    length_la,
                    length,
                    interval_la,
                    interval,
                    fakehost_la,
                    fakehost,
                    mux_la,
                    mux,
                    frag_la,
                ],
                padx=(20, 0),
                fill=tk.X,
                side=tk.LEFT,
            )
        elif op == "vpn setting":
            (
                forget_widgets(button_frame),
                forget_widgets(button_frame2),
                forget_widgets(button_frame3),
            )
            pack_widgets(
                [
                    perapp_la,
                    enablelocaldns_la,
                    enablefakedns_la,
                    local_la,
                    local,
                    allowincrease,
                    sniffing,
                ],
                fill=tk.X,
                pady=5,
                padx=5,
                side=tk.LEFT,
            )
        elif op == "routing setting":
            (
                forget_widgets(button_frame),
                forget_widgets(button_frame2),
                forget_widgets(button_frame3),
            )
            pack_widgets(
                [
                    domainStrategy_la,
                    domainStrategy,
                    customRules_proxy_la,
                    customRules_proxy,
                    customRules_direct_la,
                    customRules_direct,
                    customRules_blocked_la,
                    customRules_blocked,
                ],
                fill=tk.X,
                pady=5,
                padx=5,
                side=tk.LEFT,
            )
        elif op == "advanced setting":
            (
                forget_widgets(button_frame),
                forget_widgets(button_frame2),
                forget_widgets(button_frame3),
            )
            pack_widgets(
                [
                    socks5_la,
                    socks5,
                    http_la,
                    http,
                    remotedns_la,
                    remotedns,
                    domesticdns_la,
                    domesticdns,
                    loglevel_la,
                    loglevel,
                    test_link_la,
                    test_link,
                ],
                fill=tk.X,
                pady=5,
                padx=5,
                side=tk.LEFT,
            )

    def save_frag_setting(*args):
        global app_config

        def _save_to_json():
            app_config["core"]["fragment"]["packets"] = (
                packets.get().strip() or DEFAULT_CONFIG["core"]["fragment"]["packets"]
            )
            app_config["core"]["fragment"]["length"] = (
                length.get().strip() or DEFAULT_CONFIG["core"]["fragment"]["length"]
            )
            app_config["core"]["fragment"]["interval"] = (
                interval.get().strip() or DEFAULT_CONFIG["core"]["fragment"]["interval"]
            )

            app_config["core"]["fake_host"]["enabled"] = (
                True if fakehost_var.get() == 1 else False
            )
            app_config["core"]["fake_host"]["domain"] = (
                fakehost.get().strip() or DEFAULT_CONFIG["core"]["fake_host"]["domain"]
            )

            app_config["core"]["mux"]["enabled"] = True if mux_var.get() == 1 else False
            try:
                app_config["core"]["mux"]["concurrency"] = int(mux.get().strip())
            except ValueError:
                app_config["core"]["mux"]["concurrency"] = DEFAULT_CONFIG["core"][
                    "mux"
                ]["concurrency"]
            selected_mode = frag_or_var.get()
            fragment_is_enabled = selected_mode == 1
            warp_on_warp_is_enabled = selected_mode == 2

            app_config["core"]["fragment"]["enabled"] = fragment_is_enabled
            app_config["warp_on_warp"]["enabled"] = warp_on_warp_is_enabled
            app_config["warp_on_warp"]["config_url"] = wireguard.get(
                "1.0", tk.END
            ).strip()
            save_app_config(app_config)
            if is_use_freg_la:
                is_use_freg_la.configure(
                    fg_color="#0DFE12" if fragment_is_enabled else "red"
                )
            if is_use_warp_la:
                is_use_warp_la.configure(
                    fg_color="#0DFE12" if warp_on_warp_is_enabled else "red"
                )
            if fragment_is_enabled:
                frag_or_var.set(1)
            elif warp_on_warp_is_enabled:
                frag_or_var.set(2)
            else:
                frag_or_var.set(0)
            frag_la.configure(variable=frag_or_var)
            wireguard_la.configure(variable=frag_or_var)

        _save_to_json()

    fram_on_top_ver = ctk.CTkFrame(tabview.tab("vpn"), corner_radius=5, height=25)
    fram_on_top_ver.pack(side=tk.TOP, pady=2, padx=5, fill=tk.X)
    versoin_la = ctk.CTkButton(
        fram_on_top_ver,
        text="v0.5.2",
        state="disable",
        fg_color="#2BFED0",
        text_color="black",
    )
    versoin_la.pack(fill=tk.X)
    useage_on_top_ver = ctk.CTkFrame(tabview.tab("vpn"), corner_radius=5, height=25)
    useage_on_top_ver.pack(side=tk.TOP, pady=2, padx=5, fill=tk.X)
    is_use_freg_la = ctk.CTkButton(
        useage_on_top_ver,
        text="Fragment",
        state="disable",
        fg_color="#0DFE12",
        text_color="black",
        width=25,
    )
    if is_use_freg == "false\n":
        is_use_freg_la.configure(fg_color="red")
    is_use_freg_la.pack(fill=tk.X, side=tk.LEFT, pady=(3, 0))
    is_use_warp_la = ctk.CTkButton(
        useage_on_top_ver,
        text="Warp",
        state="disable",
        fg_color="#0DFE12",
        text_color="black",
        width=25,
    )
    if is_use_warp == "false\n":
        is_use_warp_la.configure(fg_color="red")
    is_use_warp_la.pack(fill=tk.X, side=tk.RIGHT, pady=(3, 0))
    conc_button = ctk.CTkButton(
        tabview.tab("vpn"),
        width=100,
        height=100,
        fg_color="transparent",
        corner_radius=500,
        border_width=1,
        image=dis_cion,
        compound="right",
        text="",
        command=theard_conc,
        hover_color="#783154",
    )
    conc_button.pack(anchor="center", pady=(50, 0))
    conc_button.bind("<Enter>", hand2)
    ping_la = ctk.CTkLabel(tabview.tab("vpn"), text="\nclick to connect ")
    ping_la.pack(fill=tk.X, anchor="center", pady=(0, 10))
    button_loc = ctk.CTkFrame(
        tabview.tab("vpn"), border_width=1, border_color="#33cccc"
    )
    button_loc.pack(pady=5, ipady=5, fill=tk.X)
    ipp_la = ctk.CTkLabel(button_loc, text="Loc:  ")
    ipp_la.pack(fill=tk.X, anchor="center", pady=(0, 10))
    is_warp_or_not = ctk.CTkOptionMenu(
        tabview.tab("vpn"),
        values=[
            "fragment setting",
            "wiregaurd config setting",
            "vpn setting",
            "routing setting",
            "advanced setting",
        ],
        command=is_frag_or_wire,
    )
    is_warp_or_not.pack(fill=tk.X, pady=3)
    set = [
        "tlshello\n",
        "10-30\n",
        "1-5\n",
        "false\n",
        "cloudflare.com\n",
        "false\n",
        "8\n",
        "true\n",
        "false\n",
        " ",
    ]
    core_fragment_settings = app_config.get("core", {}).get(
        "fragment", DEFAULT_CONFIG["core"]["fragment"]
    )
    core_fake_host_settings = app_config.get("core", {}).get(
        "fake_host", DEFAULT_CONFIG["core"]["fake_host"]
    )
    core_mux_settings = app_config.get("core", {}).get(
        "mux", DEFAULT_CONFIG["core"]["mux"]
    )
    warp_on_warp_settings = app_config.get(
        "warp_on_warp", DEFAULT_CONFIG["warp_on_warp"]
    )
    packets_var = ctk.StringVar(value=core_fragment_settings.get("packets", ""))
    length_var = ctk.StringVar(value=core_fragment_settings.get("length", ""))
    interval_var = ctk.StringVar(value=core_fragment_settings.get("interval", ""))
    fakehost_var_str = ctk.StringVar(value=core_fake_host_settings.get("domain", ""))
    mux_var_str = ctk.StringVar(value=str(core_mux_settings.get("concurrency", 8)))

    fakehost_var = ctk.IntVar(
        value=1 if core_fake_host_settings.get("enabled", False) else 0
    )
    mux_var = ctk.IntVar(value=1 if core_mux_settings.get("enabled", False) else 0)

    fragment_enabled_from_json = core_fragment_settings.get("enabled", False)
    warp_on_warp_enabled_from_json = warp_on_warp_settings.get("enabled", False)

    if fragment_enabled_from_json:
        frag_or_var = ctk.IntVar(value=1)
    elif warp_on_warp_enabled_from_json:
        frag_or_var = ctk.IntVar(value=2)
    else:
        frag_or_var = ctk.IntVar(value=0)
    warpOnconf = warp_on_warp_settings.get("config_url", "")

    # client
    core_settings = app_config.get("core", DEFAULT_CONFIG["core"])
    dns_settings = core_settings.get("dns", DEFAULT_CONFIG["core"]["dns"])
    inbound_ports_settings = core_settings.get(
        "inbound_ports", DEFAULT_CONFIG["core"]["inbound_ports"]
    )
    routing_rules_settings = core_settings.get(
        "routing_rules", DEFAULT_CONFIG["core"]["routing_rules"]
    )
    internal_settings_data = app_config.get(
        "internal_settings", DEFAULT_CONFIG["internal_settings"]
    )
    perapp_var = ctk.IntVar(
        value=1 if internal_settings_data.get("per_app_proxy_enabled", False) else 0
    )
    enablelocaldns_var = ctk.IntVar(
        value=1 if dns_settings.get("enabled", False) else 0
    )
    enablefakedns_var = ctk.IntVar(
        value=1 if dns_settings.get("fake_dns_enabled", False) else 0
    )
    local_var = ctk.StringVar(value=str(dns_settings.get("local_port", 10853)))
    allowincrease_var = ctk.IntVar(
        value=1 if core_settings.get("allow_insecure_tls", False) else 0
    )
    sniffing_var = ctk.IntVar(
        value=1 if core_settings.get("sniffing_enabled", True) else 0
    )
    domain_strategy_options = ["AsIs", "IPIFNonMatch", "IPOnDemand"]
    current_domain_strategy = core_settings.get("domain_strategy", "IPIFNonMatch")
    domainStrategy_var = change_list_f(
        list(domain_strategy_options), current_domain_strategy
    )
    customRules_proxy_var = routing_rules_settings.get("proxy", "")
    customRules_direct_var = routing_rules_settings.get("direct", "")
    customRules_blocked_var = routing_rules_settings.get("block", "")
    socks5_var = ctk.StringVar(value=str(inbound_ports_settings.get("socks", 10808)))
    http_var = ctk.StringVar(value=str(inbound_ports_settings.get("http", 10809)))
    remote_dns_var = ctk.StringVar(value=dns_settings.get("remote_server", ""))
    domestic_dns_var = ctk.StringVar(value=dns_settings.get("domestic_server", ""))
    log_level_options = ["debug", "info", "warning", "error", "none"]
    current_log_level = core_settings.get("log_level", "warning")
    log_level_var = change_list_f(list(log_level_options), current_log_level)
    test_link_var = ctk.StringVar(value=core_settings.get("test_url", ""))
    scrollable_vpn = ctk.CTkScrollableFrame(tabview.tab("vpn"))
    scrollable_vpn.pack(padx=10, pady=(10, 0), fill="both")
    button_frame = ctk.CTkFrame(scrollable_vpn, border_width=3)
    button_frame.pack(pady=5, ipady=5, fill=tk.X)
    packets_la = ctk.CTkLabel(button_frame, text="packets: ")
    packets_la.pack(pady=2, padx=(20, 0), side=tk.LEFT)
    packets = ctk.CTkEntry(
        button_frame,
        width=100,
        textvariable=packets_var,
        placeholder_text="packets [tlshello, ...]",
    )
    packets.pack(fill=tk.X, side=tk.LEFT, padx=2)
    packets_var.trace_add("write", save_frag_setting)
    length_la = ctk.CTkLabel(button_frame, text="length: ")
    length_la.pack(padx=2, side=tk.LEFT)
    length = ctk.CTkEntry(
        button_frame,
        width=100,
        textvariable=length_var,
        placeholder_text="length[10-30 , ...]",
    )
    length.pack(fill=tk.X, side=tk.LEFT, padx=2)
    length_var.trace_add("write", save_frag_setting)
    button_frame2 = ctk.CTkFrame(scrollable_vpn, border_width=3)
    button_frame2.pack(pady=5, ipady=5, fill=tk.X)
    interval_la = ctk.CTkLabel(button_frame2, text="interval: ")
    interval_la.pack(padx=(20, 0), side=tk.LEFT)
    interval = ctk.CTkEntry(
        button_frame2,
        width=100,
        textvariable=interval_var,
        placeholder_text="interval['1-5']",
    )
    interval.pack(fill=tk.X, side=tk.LEFT, padx=4)
    interval_var.trace_add("write", save_frag_setting)
    fakehost_la = ctk.CTkCheckBox(
        button_frame2, variable=fakehost_var, onvalue=1, offvalue=0, text="fakehost: "
    )
    fakehost_la.pack(padx=2, side=tk.LEFT)
    fakehost_var.trace_add("write", save_frag_setting)
    fakehost = ctk.CTkEntry(
        button_frame2,
        width=100,
        textvariable=fakehost_var_str,
        placeholder_text="fakehost[cloudflare.com]",
    )
    fakehost.pack(fill=tk.X, side=tk.LEFT, padx=2)
    fakehost_var_str.trace_add("write", save_frag_setting)
    button_frame3 = ctk.CTkFrame(scrollable_vpn, border_width=3)
    button_frame3.pack(pady=5, ipady=5, fill=tk.X)
    mux_la = ctk.CTkCheckBox(
        button_frame3, variable=mux_var, onvalue=1, offvalue=0, text="mux: "
    )
    mux_la.pack(padx=(20, 0), side=tk.LEFT)
    mux_var.trace_add("write", save_frag_setting)
    mux = ctk.CTkEntry(
        button_frame3, width=100, textvariable=mux_var_str, placeholder_text="mux[5]"
    )
    mux.pack(fill=tk.X, side=tk.LEFT, padx=3)
    mux_var_str.trace_add("write", save_frag_setting)
    frag_la = ctk.CTkCheckBox(
        button_frame3, variable=frag_or_var, onvalue=1, offvalue=0, text="fragment"
    )
    frag_la.pack(padx=(20, 0), side=tk.LEFT)
    wireguard_la = ctk.CTkCheckBox(
        button_frame,
        command=save_frag_setting,
        variable=frag_or_var,
        onvalue=2,
        offvalue=0,
        text="warp: ",
    )
    frag_or_var.trace_add("write", save_frag_setting)
    wireguard = ctk.CTkTextbox(button_frame2)
    wireguard.insert(1.0, warpOnconf)
    wireguard.bind("<KeyRelease>", save_frag_setting, add="+")

    def save_app_config(config_data):
        try:
            with open(CONF_PATH, "w") as f:
                json.dump(config_data, f, indent=2)
        except IOError as e:
            print(f"Error saving config file {CONF_PATH}: {e}")

    def save_client_setting(*args):
        global app_config, test_link_
        app_config["internal_settings"]["per_app_proxy_enabled"] = (
            True if perapp_var.get() == 1 else False
        )
        app_config["core"]["dns"]["enabled"] = (
            True if enablelocaldns_var.get() == 1 else False
        )
        app_config["core"]["dns"]["fake_dns_enabled"] = (
            True if enablefakedns_var.get() == 1 else False
        )
        try:
            app_config["core"]["dns"]["local_port"] = int(local.get().strip())
        except ValueError:
            app_config["core"]["dns"]["local_port"] = DEFAULT_CONFIG["core"]["dns"][
                "local_port"
            ]
        app_config["core"]["dns"]["remote_server"] = (
            remotedns.get().strip() or DEFAULT_CONFIG["core"]["dns"]["remote_server"]
        )
        app_config["core"]["dns"]["domestic_server"] = (
            domesticdns.get().strip()
            or DEFAULT_CONFIG["core"]["dns"]["domestic_server"]
        )
        app_config["core"]["domain_strategy"] = domainStrategy.get().strip()
        app_config["core"]["allow_insecure_tls"] = (
            True if allowincrease_var.get() == 1 else False
        )
        app_config["core"]["sniffing_enabled"] = (
            True if sniffing_var.get() == 1 else False
        )
        app_config["core"]["log_level"] = loglevel.get().strip()
        app_config["core"]["test_url"] = (
            test_link.get().strip() or DEFAULT_CONFIG["core"]["test_url"]
        )
        test_link_ = app_config["core"]["test_url"]
        try:
            app_config["core"]["inbound_ports"]["socks"] = int(socks5.get().strip())
        except ValueError:
            app_config["core"]["inbound_ports"]["socks"] = DEFAULT_CONFIG["core"][
                "inbound_ports"
            ]["socks"]
        try:
            app_config["core"]["inbound_ports"]["http"] = int(http.get().strip())
        except ValueError:
            app_config["core"]["inbound_ports"]["http"] = DEFAULT_CONFIG["core"][
                "inbound_ports"
            ]["http"]
        app_config["core"]["routing_rules"]["proxy"] = customRules_proxy.get(
            "1.0", tk.END
        ).strip()
        app_config["core"]["routing_rules"]["direct"] = customRules_direct.get(
            "1.0", tk.END
        ).strip()
        app_config["core"]["routing_rules"]["block"] = customRules_blocked.get(
            "1.0", tk.END
        ).strip()
        save_app_config(app_config)
        if enablefakedns_la:
            enablefakedns_la.configure(
                state=tk.NORMAL if app_config["core"]["dns"]["enabled"] else tk.DISABLED
            )

    perapp_la = ctk.CTkCheckBox(
        button_frame,
        variable=perapp_var,
        onvalue=1,
        offvalue=0,
        text="per-app proxy",
        state=tk.DISABLED,
    )
    enablelocaldns_la = ctk.CTkCheckBox(
        button_frame,
        variable=enablelocaldns_var,
        onvalue=1,
        offvalue=0,
        text="enable local DNS",
    )
    enablefakedns_la = ctk.CTkCheckBox(
        button_frame2,
        variable=enablefakedns_var,
        onvalue=1,
        offvalue=0,
        text="enable fake DNS",
    )
    if enablelocaldns_var.get() == 0:
        enablefakedns_la.configure(state=tk.DISABLED)
    else:
        enablefakedns_la.configure(state=tk.NORMAL)
    local_la = ctk.CTkLabel(button_frame2, text="local DNS PORT: ")
    local = ctk.CTkEntry(
        button_frame2,
        width=100,
        textvariable=local_var,
        placeholder_text="local DNS PORT",
    )
    allowincrease = ctk.CTkCheckBox(
        button_frame3,
        variable=allowincrease_var,
        onvalue=1,
        offvalue=0,
        text="allow increase",
    )
    sniffing = ctk.CTkCheckBox(
        button_frame3, variable=sniffing_var, onvalue=1, offvalue=0, text="sniffing"
    )

    def open_big(none, frame: ctk.CTkTextbox, label):
        def on_close():
            rootup.destroy()

        def on_go():
            frame.delete(1.0, tk.END)
            frame.insert(1.0, big_label.get(1.0, tk.END).strip())
            save_client_setting()
            on_close()

        rootup = ctk.CTkFrame(rootmainactivity)
        rootup.pack(fill=tk.BOTH, side=tk.BOTTOM)
        lab = ctk.CTkLabel(rootup, text=label, bg_color="red")
        lab.pack(fill=tk.X)
        big_label = ctk.CTkTextbox(rootup)
        big_label.insert(1.0, frame.get("1.0", tk.END).strip())
        big_label.pack(fill=tk.BOTH)
        buto = ctk.CTkButton(rootup, text="save", command=on_go)
        buto.pack(fill=tk.X)
        butoclo = ctk.CTkButton(rootup, text="close", command=on_close)
        butoclo.pack(fill=tk.X, side=tk.BOTTOM, pady=(5, 0))
        rootup.lift(tabview.tab("vpn"))

    domainStrategy_la = ctk.CTkLabel(button_frame, text="domain strategy: ")
    domainStrategy = ctk.CTkOptionMenu(
        button_frame, values=domainStrategy_var, command=save_client_setting
    )
    customRules_proxy_la = ctk.CTkLabel(button_frame, text="proxy url or ip: ")
    customRules_proxy = ctk.CTkTextbox(button_frame, height=5, width=100)
    customRules_proxy.insert(1.0, customRules_proxy_var)
    customRules_proxy.bind(
        "<Button-1>",
        lambda n="", frame=customRules_proxy: open_big(n, frame, "proxy url or ip: "),
        add="+",
    )
    customRules_direct_la = ctk.CTkLabel(button_frame2, text="direct url or ip: ")
    customRules_direct = ctk.CTkTextbox(button_frame2, height=5, width=100)
    customRules_direct.insert(1.0, customRules_direct_var)
    customRules_direct.bind(
        "<Button-1>",
        lambda n="", frame=customRules_direct: open_big(n, frame, "direct url or ip: "),
        add="+",
    )
    customRules_blocked_la = ctk.CTkLabel(button_frame2, text="blocked url or ip: ")
    customRules_blocked = ctk.CTkTextbox(button_frame2, height=5, width=100)
    customRules_blocked.insert(1.0, customRules_blocked_var)
    customRules_blocked.bind(
        "<Button-1>",
        lambda n="", frame=customRules_blocked: open_big(
            n, frame, "blocked url or ip: "
        ),
        add="+",
    )
    socks5_la = ctk.CTkLabel(button_frame, text="SOCKS5 proxy port: ")
    socks5 = ctk.CTkEntry(
        button_frame,
        width=100,
        textvariable=socks5_var,
        placeholder_text="SOCKS5 proxy port",
    )
    http_la = ctk.CTkLabel(button_frame, text="HTTP proxy port: ")
    http = ctk.CTkEntry(
        button_frame,
        width=100,
        textvariable=http_var,
        placeholder_text="HTTP proxy port",
    )
    remotedns_la = ctk.CTkLabel(button_frame2, text="Remote DNS: ")
    remotedns = ctk.CTkEntry(
        button_frame2,
        width=100,
        textvariable=remote_dns_var,
        placeholder_text="REMOTE DNS",
    )
    domesticdns_la = ctk.CTkLabel(button_frame2, text="Domestic DNS: ")
    domesticdns = ctk.CTkEntry(
        button_frame2,
        width=100,
        textvariable=domestic_dns_var,
        placeholder_text="Domestic DNS",
    )
    loglevel_la = ctk.CTkLabel(button_frame3, text="Log Level: ")
    loglevel = ctk.CTkOptionMenu(
        button_frame3, values=log_level_var, command=save_client_setting
    )
    test_link_la = ctk.CTkLabel(button_frame3, text="Test Link: ")
    test_link = ctk.CTkEntry(
        button_frame3,
        width=100,
        textvariable=test_link_var,
        placeholder_text="Test Link",
    )
    perapp_var.trace_add("write", save_client_setting)
    enablelocaldns_var.trace_add("write", save_client_setting)
    enablefakedns_var.trace_add("write", save_client_setting)
    local_var.trace_add("write", save_client_setting)
    allowincrease_var.trace_add("write", save_client_setting)
    socks5_var.trace_add("write", save_client_setting)
    http_var.trace_add("write", save_client_setting)
    remote_dns_var.trace_add("write", save_client_setting)
    domestic_dns_var.trace_add("write", save_client_setting)
    test_link_var.trace_add("write", save_client_setting)
    sniffing_var.trace_add("write", save_client_setting)
    protocl_confs = [
        "vless://",
        "vmess://",
        "trojan://",
        "wireguard://",
        "ss://",
        "socks://",
        "hy2://",
        "hysteria2://",
    ]

    def parse_sub(sub: str):
        global sub_org
        sub_org = sub

        def get_confs():
            global confss, sub_org
            tag = sub_org.split("/")[-1]
            sub = sub_org.strip()
            try:
                tag = sub.split("#")[1]
                tag = sub.split("#")
                sub = tag[0]
                tag = tag[1]
            except:
                pass
            confss2 = requests.get(sub, timeout=30)
            confss = confss2.text
            if "{" in confss and "}" in confss and "[" in confss:
                confss = confss2.json()
                check_confs(confss, is_sub=True)
                return
            boolor, confss, cout_add = check_confs(confss)
            if boolor == False:
                print("rturn")
                return
            if not os.path.exists("xray/" + tag):
                with open("xray/sub_files_name", "a") as f:
                    f.write(tag + "\n")
                with open("xray/sub_files_name", "r") as f:
                    sun_nms = f.readlines()
                    sun_nms = remove_empty_strings(sun_nms)
                    sun_nms = [line.strip() for line in sun_nms]
                selec_sub.configure(values=sun_nms)
            with open("xray/" + tag, "w", encoding="utf-8") as f:
                f.write(str(confss))
                f.write("\n" + sub)
            get_config_from_user()

        tha = threading.Thread(target=get_confs)
        tha.start()

    def show_confs(test: str, is_new=False, len_f=0, is_dict=False):
        global wch_sel, count
        if selec_sub.get() != "user_confs" and selec_sub.get() != "user_custom_confs":
            update_buton.pack(side=tk.RIGHT, padx=(5, 0))
        elif selec_sub.get() == "user_confs" and selec_sub.get() == "user_custom_confs":
            try:
                update_buton.pack_forget()
            except Exception:
                pass
        sun_nms = selec_sub._values
        print(sun_nms)
        tag_num = sun_nms.index(selec_sub.get())
        if tag_num != 0:
            tag_sel = sun_nms[tag_num]
            temp1 = sun_nms[0]
            sun_nms[0] = tag_sel
            sun_nms[tag_num] = temp1
            with open("xray/sub_files_name", "w") as f:
                for j in sun_nms:
                    f.write(j + "\n")
            sun_nms = [line.strip() for line in sun_nms]
            selec_sub.configure(values=sun_nms)
        path_c = "xray/" + selec_sub.get()
        with open(path_c, "r", encoding="utf-8") as f:
            if selec_sub.get() != "user_custom_confs":
                conf_simple = f.readlines()
            else:
                conf_simple = json.load(f)
            if (
                selec_sub.get() != "user_confs"
                and selec_sub.get() != "user_custom_confs"
            ):
                conf_simple = conf_simple[: len(conf_simple) - 1]
            conf_simple = remove_empty_strings(conf_simple)
        try:
            with open("xray/count", "r") as f:
                wch_sel = int(f.readline())
        except Exception:
            pass
        print(len(conf_simple))
        print(wch_sel)
        if wch_sel >= len(conf_simple) or wch_sel < 0:
            print("true")
            with open("xray/count", "w") as f:
                f.write(str(0))
            wch_sel = 0
        if is_new:
            conf_simple = conf_simple[::-1]
            del conf_simple[:len_f]

        # print("len conf_simple: ",len(conf_simple))
        def remove_frame(widget):
            try:
                widget.destroy()
            except Exception:
                pass

        def edit_config(conf, count_in: int, is_new_c=False):
            global is_editing, count, is_less
            is_editing = True
            if not is_new:
                count_in -= (is_less[count_in + count]) * -1
            else:
                count_in -= (is_less[count_in]) * -1
            with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as f:
                if selec_sub.get() == "user_custom_confs":
                    sun_na = json.load(f)
                    with open(
                        "xray/" + selec_sub.get() + "temp", "w", encoding="utf-8"
                    ) as ff:
                        json.dump(sun_na, ff)
                else:
                    sun_na = f.readlines()
                    with open(
                        "xray/" + selec_sub.get() + "temp", "w", encoding="utf-8"
                    ) as ff:
                        ff.writelines(sun_na)
                sun_na_t = sun_na[:count][::-1]
                del sun_na[:count]
                sun_na = sun_na_t + sun_na
            if selec_sub.get() == "user_custom_confs":
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                    json.dump(sun_na, f)
            else:
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                    f.writelines(sun_na)
            if not is_new_c:
                parse_configs(sun_na[count_in + count], count_in + count)
                print(count_in + count)
            else:
                parse_configs(sun_na[count_in], count_in)
                print(count_in)

        def remove_config(
            frame: ctk.CTkFrame, count_in, is_new_c=False, is_on: ctk.CTkTextbox = None
        ):
            global count, frams_in_ping, frams_in_show, is_less
            if is_on._fg_color == "green":
                return
            with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as f:
                if selec_sub.get() == "user_custom_confs":
                    sun_na = json.load(f)
                    with open(
                        "xray/" + selec_sub.get() + "temp", "w", encoding="utf-8"
                    ) as ff:
                        json.dump(sun_na, ff)
                else:
                    sun_na = f.readlines()
                    with open(
                        "xray/" + selec_sub.get() + "temp", "w", encoding="utf-8"
                    ) as ff:
                        ff.writelines(sun_na)
                if count != 0:
                    sun_na_t = sun_na[:count][::-1]
                    del sun_na[:count]
                    sun_na = sun_na_t + sun_na
            if selec_sub.get() == "user_custom_confs":
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                    json.dump(sun_na, f)
            else:
                with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                    f.writelines(sun_na)
            if not is_new_c:
                if not is_less[count_in] == 0:
                    count_in = count_in + count - (is_less[count_in + count] * -1)
                del sun_na[count_in + count]
                for i in range(
                    len(is_less) - len(is_less[count_in + count :]), len(is_less)
                ):
                    is_less[i] = is_less[i] - 1
                print(count_in + count)
                del frams_in_ping[count_in + count]
                del frams_in_show[count_in + count]
                del fram_in_flag[count_in + count]
            else:
                if not is_less[count_in] == 0:
                    count_in = count_in - (is_less[count_in] * -1)
                del sun_na[count_in]
                if count != 0:
                    if not count_in <= count - 1:
                        temp = sun_na[:count][::-1]
                        sun_na = temp + sun_na[count:]
                        for i in range(
                            len(is_less) - len(is_less[count_in:]), len(is_less)
                        ):
                            is_less[i] = is_less[i] - 1
                    else:
                        count -= 1
                del frams_in_ping[count_in]
                del frams_in_show[count_in]
                del fram_in_flag[count_in]
            sun_na = sun_na[:count][::-1] + sun_na[count:]
            with open("xray/" + selec_sub.get(), "w", encoding="utf-8") as f:
                if selec_sub.get() == "user_custom_confs":
                    json.dump(sun_na, f)
                else:
                    f.writelines(sun_na)
            frame.destroy()
            scrollable_frame5.update()
            os.remove("xray/" + selec_sub.get() + "temp")

        def clear_frames_in_scrollable_frame():
            with ThreadPoolExecutor(max_workers=50) as executor:
                futures = []
                for widget in scrollable_frame5.winfo_children():
                    if isinstance(widget, ctk.CTkFrame):
                        futures.append(executor.submit(remove_frame, widget))
                wait(futures)
            scrollable_frame5.update_idletasks()

        copy_icon = ctk.CTkImage(
            light_image=Image.open("imgs/copy.png"),
            dark_image=Image.open("imgs/copy.png"),
            size=(25, 25),
        )
        remove_icon = ctk.CTkImage(
            light_image=Image.open("imgs/remove.png"),
            dark_image=Image.open("imgs/remove.png"),
            size=(25, 25),
        )
        edit_icon = ctk.CTkImage(
            light_image=Image.open("imgs/edit.png"),
            dark_image=Image.open("imgs/edit.png"),
            size=(25, 25),
        )

        def copy_config(config):
            on_copy_root = ctk.CTkFrame(
                tabview.tab("configs"),
                width=tabview.tab("configs").winfo_screenwidth(),
                height=tabview.tab("configs").winfo_screenheight(),
                border_width=1,
                border_color="red",
                corner_radius=5,
            )
            on_copy_root.place(x=230, y=200)
            on_copy_root.grab_set()

            def normal():
                tabview.tab("configs").clipboard_clear()
                if not isinstance(config, dict):
                    tabview.tab("configs").clipboard_append(config)
                else:
                    tabview.tab("configs").clipboard_append(
                        json.dumps(config, indent=4)
                    )
                on_copy_root.place_forget()
                rootmainactivity.grab_set()

            def full():
                tabview.tab("configs").clipboard_clear()
                tabview.tab("configs").clipboard_append(parse_configs(config))
                on_copy_root.place_forget()
                rootmainactivity.grab_set()

            def close(close):
                on_copy_root.place_forget()
                rootmainactivity.grab_set()

            back_arrow = ctk.CTkImage(
                light_image=Image.open("imgs/arrow.png"),
                dark_image=Image.open("imgs/arrow_light.png"),
                size=(25, 25),
            )
            labe = ctk.CTkButton(
                on_copy_root,
                text="",
                image=back_arrow,
                fg_color="transparent",
                corner_radius=10,
                width=5,
                hover_color="#DF9C27",
            )
            labe.pack(anchor=tk.NE, side=tk.TOP, ipady=10, ipadx=10)
            labe.bind("<Button-1>", close)
            # buttonctk_b=ctk.CTkButton(on_copy_root,text="",image=back_arrow).pack(anchor=tk.NE)
            button_normal = ctk.CTkButton(
                on_copy_root, command=normal, text="Normal"
            ).pack(pady=(5, 5), padx=5)
            if not isinstance(config, dict):
                button_norma2 = ctk.CTkButton(
                    on_copy_root, command=full, text="Full"
                ).pack(pady=(5, 10), padx=5)
            on_copy_root.lift()

        def show_confs_therd():
            global \
                temp_green_txtb, \
                stoped_loop, \
                wch_sel, \
                count, \
                on_is_green, \
                frams_in_show, \
                frams_in_ping, \
                t_f_count, \
                is_less, \
                fram_in_flag
            if not is_new:
                frams_in_show = []
                frams_in_ping = []
                fram_in_flag = []
                is_less = [0] * (len(conf_simple))
                count = 0
                t_f_count = 0
            else:
                is_less = [0] * (len(conf_simple)) + is_less
            tcount = 0
            if not is_new:
                clear_frames_in_scrollable_frame()
            try:
                add_add_prog = 10 / len(conf_simple) / 10
            except Exception:
                return
            if conf_simple == []:
                return
            try:
                for i in conf_simple:
                    if not isinstance(i, dict):
                        i = urllib.parse.unquote(i)
                        if not i.startswith("vmess://"):
                            i_p = i.strip().split("#")[-1]
                        else:
                            after_vemss = i.split("vmess://")[1]
                            missing_padding = len(after_vemss) % 4
                            if missing_padding:
                                after_vemss += "=" * (4 - missing_padding)
                            after_vemss_d = base64.b64decode(after_vemss).decode(
                                "utf-8"
                            )
                            after_vemss_d = json.loads(after_vemss_d)
                            i_p = after_vemss_d.get("ps", "none")
                    else:
                        try:
                            i_p = i["remarks"].strip()
                        except Exception:
                            i_p = "None " + str(count)
                    LOC_user_raw = None
                    try:
                        parts = i_p.split(">>")
                        if len(parts) > 1:
                            LOC_user_raw = parts[1].strip()
                    except Exception:
                        pass
                    LOC_user = None
                    if LOC_user_raw:
                        match = re.match(r"([a-zA-Z\s]+)", LOC_user_raw)
                        if match:
                            LOC_user = match.group(1).strip()
                    frame_confs = ctk.CTkFrame(
                        scrollable_frame5, border_width=1, height=50, corner_radius=10
                    )
                    if not is_new:
                        frame_confs.pack(pady=5, ipady=5, fill=tk.X)
                    else:
                        children = scrollable_frame5.winfo_children()
                        for child in children:
                            try:
                                child.pack_forget()
                            except Exception:
                                child.destroy()
                    if not is_new:
                        is_on = create_textbox(frame_confs, count == wch_sel)
                    else:
                        is_on = create_textbox(frame_confs, count == None)
                    label = ctk.CTkTextbox(frame_confs, width=100, height=48)
                    label.pack(padx=(5, 5), side=tk.LEFT)
                    label.insert(1.0, i_p)
                    label.configure(state="disabled")
                    if not is_new:
                        frams_in_show.append(label)
                        frams_in_ping.append(create_ping_label(frame_confs, i))
                        if LOC_user != None:
                            fram_in_flag.append(create_loc_label(frame_confs, LOC_user))
                        else:
                            fram_in_flag.append(create_loc_label(frame_confs))
                    else:
                        frams_in_show = (
                            frams_in_show[:count] + [label] + frams_in_show[:]
                        )
                        frams_in_ping = [
                            create_ping_label(frame_confs, i)
                        ] + frams_in_ping[:]
                        if LOC_user != None:
                            fram_in_flag = (
                                fram_in_flag[:count]
                                + [create_loc_label(frame_confs, LOC_user)]
                                + fram_in_flag[:]
                            )
                        else:
                            fram_in_flag = (
                                fram_in_flag[:count]
                                + [create_loc_label(frame_confs)]
                                + fram_in_flag[:]
                            )
                    if not isinstance(i, dict):
                        frame_which_protocol = ctk.CTkLabel(
                            frame_confs,
                            text=i.strip().split("://")[0],
                            width=5,
                            text_color="#DF9C27",
                        )
                        frame_which_protocol.pack(
                            side=tk.LEFT, padx=(5, 5), anchor="s", pady=(0, 2)
                        )
                    edit_label = ctk.CTkButton(
                        frame_confs,
                        image=edit_icon,
                        text="",
                        width=25,
                        command=lambda i=i, count=count, is_new_c=is_new: edit_config(
                            i, count, is_new_c
                        ),
                        hover_color="#DF9C27",
                        fg_color="#2b2b2b",
                    )
                    edit_label.pack(fill=tk.X, side=tk.RIGHT, padx=(10, 2))
                    remove_label = ctk.CTkButton(
                        frame_confs,
                        image=remove_icon,
                        text="",
                        width=25,
                        command=lambda i=i,
                        count=count,
                        frame_confs=frame_confs,
                        is_new_c=is_new,
                        is_on=is_on: remove_config(frame_confs, count, is_new_c, is_on),
                        hover_color="#DF9C27",
                        fg_color="#2b2b2b",
                    )
                    remove_label.pack(fill=tk.X, side=tk.RIGHT, padx=(10, 0))
                    copy_label = ctk.CTkButton(
                        frame_confs,
                        image=copy_icon,
                        text="",
                        width=25,
                        command=lambda i=i: copy_config(i),
                        hover_color="#DF9C27",
                        fg_color="#2b2b2b",
                    )
                    copy_label.pack(fill=tk.X, side=tk.RIGHT, padx=(0, 0))
                    if stoped_loop:
                        print(stoped_loop, count)
                        is_on = handle_stopped_loop(is_on)
                        frame_confs.bind(
                            "<Button-1>",
                            lambda e, i=i, is_on=is_on, count=count: on_conf_click(
                                i, count, is_on
                            ),
                        )
                        frame_confs.bind(
                            "<Double-Button-1>",
                            lambda e,
                            i=i,
                            is_on=is_on,
                            count=count,
                            is_new_c=is_new: th_ping_all(i, count, is_new_c),
                        )
                        break
                    frame_confs.bind(
                        "<Button-1>",
                        lambda e, i=i, is_on=is_on, count=count: on_conf_click(
                            i, count, is_on
                        ),
                    )
                    frame_confs.bind(
                        "<Double-Button-1>",
                        lambda e,
                        i=i,
                        is_on=is_on,
                        count=count,
                        is_new_c=is_new: th_ping_all(i, count, is_new_c),
                    )
                    if is_new:
                        if selec_sub.get() != "user_custom_confs":
                            frame_confs.pack(pady=5, ipady=5, fill=tk.X)
                            for child in children[::-1][: count + 1]:
                                child.pack(pady=5, ipady=5, fill=tk.X)
                            for child in children[: len(children) - count]:
                                child.pack(pady=5, ipady=5, fill=tk.X)
                        else:
                            frame_confs.pack(pady=5, ipady=5, fill=tk.X)
                            for child in children[::-1][: count + 1]:
                                child.pack(pady=5, ipady=5, fill=tk.X)
                            for child in children[: len(children) - count]:
                                child.pack(pady=5, ipady=5, fill=tk.X)
                        scrollable_frame5.update_idletasks()
                    count += 1
                    tcount += add_add_prog
                    update_progress(tcount)
            except Exception as E:
                print(E)
            clear_widgets(wait_progress)
            wait_progress.destroy()
            if not is_new:
                count = 0
            if t_f_count == 0:
                t_f_count = count

        def create_textbox(frame, is_selected):
            fg_color = "green" if is_selected else "gray"
            textbox = ctk.CTkTextbox(
                frame,
                width=1,
                height=48,
                fg_color=fg_color,
                activate_scrollbars=False,
                state="disabled",
            )
            textbox.pack(padx=(3, 0), side=tk.LEFT)
            textbox.bind("<Enter>", hand2)
            if is_selected:
                global temp_green_txtb, on_is_green
                temp_green_txtb = textbox
                on_is_green = True
            return textbox

        def create_ping_label(frame, i: str):
            ping_text = ""
            ping_fg_color = None
            remarks = ""
            if not isinstance(i, dict):
                try:
                    if i.startswith("vmess://"):
                        after_vemss = i.split("vmess://")[1]
                        parts = after_vemss.split("#", 1)
                        encoded_part = parts[0]
                        vmess_tag_in_link = parts[1] if len(parts) > 1 else ""
                        missing_padding = len(encoded_part) % 4
                        if missing_padding:
                            encoded_part += "=" * (4 - missing_padding)
                        decoded = base64.b64decode(encoded_part).decode("utf-8")
                        vmess_data = json.loads(decoded)
                        remarks = vmess_data.get("ps", "")
                    elif "#" in i:
                        remarks = i.strip().split("#", 1)[-1]
                    else:
                        remarks = ""
                except Exception:
                    remarks = ""
            else:
                remarks = i.get("remarks", "")
            remarks = remarks.strip()
            txt_color = "white"
            if ":" in remarks:
                ping_text = remarks.split(":")[-1].strip()
                if int(ping_text) >= 1000:
                    ping_fg_color = "#FFBF00"
                    txt_color = "#000000"
                elif int(ping_text) == -1:
                    ping_fg_color = "red"
                    txt_color = "white"
                elif int(ping_text) < 1000:
                    ping_fg_color = "green"
                    txt_color = "white"
            else:
                ping_text = ""
                ping_fg_color = None
            ping_label = ctk.CTkLabel(
                frame,
                text=ping_text,
                text_color=txt_color,
                width=50,
                corner_radius=5,
                fg_color=ping_fg_color,
            )
            ping_label.pack(side=tk.LEFT, pady=(0, 25))
            return ping_label

        def create_loc_label(frame, path=None):
            global image_cache
            image_key = str(path)
            if path and image_key in image_cache:
                locPng = image_cache[image_key]
            elif path and os.path.exists(f"imgs/{path}.png"):
                try:
                    img = Image.open(f"imgs/{path}.png")
                    locPng = ctk.CTkImage(
                        light_image=img, dark_image=img, size=(10, 10)
                    )
                    image_cache[image_key] = locPng
                except Exception as e:
                    logging.error(f"Error loading image {path}: {e}")
                    locPng = None
            else:
                locPng = None
            loc_label = ctk.CTkLabel(frame, anchor="s", text="", image=locPng, width=10)
            loc_label.pack(side=tk.LEFT, pady=(3, 0))
            gc.collect()
            return loc_label

        def handle_stopped_loop(is_on):
            global stoped_loop, on_is_green, temp_green_txtb
            if not on_is_green:
                is_on.configure(fg_color="green")
                is_on.pack(padx=(3, 0), side=tk.LEFT)
                is_on.bind("<Enter>", hand2)
                temp_green_txtb = is_on
            else:
                is_on.configure(fg_color="gray")
                is_on.pack(padx=(3, 0), side=tk.LEFT)
                is_on.bind("<Enter>", hand2)
            stoped_loop = False
            on_is_green = False
            return is_on

        def update_progress(tcount):
            progress_bar_go.set(tcount)
            wait_progress.lift()
            label_show_which.configure(
                text=text_update + " " + str(tcount * 100 // 1) + " %"
            )

        def show_confs_int_therd():
            threading.Thread(target=show_confs_therd).start()

        wait_progress = ctk.CTkToplevel(tabview.tab("configs"))
        wait_progress.geometry("+200+100")
        wait_progress_f = ctk.CTkFrame(
            wait_progress, border_width=2, border_color="red"
        )
        wait_progress_f.pack(pady=10, padx=10, ipady=5, ipadx=5)
        text_update = "load configs from " + selec_sub.get() + " "
        label_show_which = ctk.CTkLabel(wait_progress_f, text=text_update)
        label_show_which.pack(padx=5, pady=5)
        progress_bar_go = ctk.CTkProgressBar(
            wait_progress_f,
            orientation="horizontal",
            height=20,
            fg_color="pink",
            mode="determinate",
        )
        progress_bar_go.pack(fill=tk.X)

        def exit_thread():
            global wch_sel, count, stoped_loop, on_is_green
            with open("xray/count", "w") as f:
                f.write(str(wch_sel - 2))
            stoped_loop = True
            print("is_go to stop")

        ctk.CTkButton(wait_progress, text="cancel", command=exit_thread).pack(
            padx=5, pady=5
        )
        show_confs_int_therd()

    def check_confs(config, is_sub=False):
        if isinstance(config, list) and is_sub:
            config = [json.dumps(co) for co in config]
            config = [json.loads(co) for co in config]
            with open("xray/user_custom_confs", "r") as f:
                confs = json.load(f)
                len_f = len(confs)
            confs = config + confs
            with open("xray/user_custom_confs", "w") as f:
                json.dump(confs, f)
            show_confs("", is_new=True, len_f=len_f, is_dict=True)
            return
        config = config.splitlines()
        booltemp = False
        boolor = False
        cout_add = 0
        confgis = ""
        for j in config:
            for i in protocl_confs:
                if j.startswith(i):
                    booltemp = True
                    if booltemp and i == "ss://":
                        if j[0] != "s":
                            booltemp = False
                    if booltemp:
                        break
                    print("True")
            if booltemp:
                cout_add += 1
                confgis = confgis + (j + "\n")
                boolor = True
                booltemp = False
        return boolor, confgis, cout_add

    def get_config_from_user():
        global confss
        config = pyperclip.paste()
        with open("xray/user_confs", "r", encoding="utf-8") as f:
            len_first = len(f.readlines())
        if "{" in config:
            with open("xray/count", "r") as f:
                count = int(f.readline()) + 1
            with open("xray/count", "w") as f:
                f.write(str(count))
            parse_configs(config)
            # show_confs("test",is_new=True,len_f=len_first)
            return
        if (
            config.startswith("http://") or config.startswith("https://")
        ) and confss == "":
            parse_sub(config)
            return
        if confss != "":
            config = confss
            confss = ""
            show_confs("test", is_new=True, len_f=len_first)
            return
        boolor, confgis, cout_add = check_confs(config)
        confgis = str(confgis)
        if confgis[-1] == "\n":
            confgis = confgis[0 : len(confgis) - 1]
        if boolor == False:
            print("rturn")
            return
        with open("xray/user_confs", "r", encoding="utf-8") as f:
            confgs = f.readlines()
            confgs = remove_empty_strings(confgs)
        confs = ""
        for i in confgs:
            confs += i
        confs = confgis + "\n" + confs
        with open("xray/user_confs", "w", encoding="utf-8") as f:
            f.write(confs.strip())
            f.write("\n")
        with open("xray/count", "r") as f:
            count = int(f.readline()) + cout_add
        with open("xray/count", "w") as f:
            f.write(str(count))
        show_confs("test", is_new=True, len_f=len_first)

    def parse_sub_in():
        with open("xray/" + selec_sub.get(), "r", encoding="utf-8") as f:
            sun_na = f.readlines()[-1]
        tabview.tab("configs").clipboard_clear()
        tabview.tab("configs").clipboard_append(str(sun_na))
        get_config_from_user()
        tabview.tab("configs").clipboard_clear()

    def remove_sub_in():
        if selec_sub.get() == "user_confs":
            with open("xray/" + selec_sub.get(), "w") as f:
                f.write("")
            show_confs("testttttttt")
            return
        elif selec_sub.get() == "user_custom_confs":
            with open("xray/" + selec_sub.get(), "w") as f:
                json.dump([], f)
            show_confs("testttttttt")
            return
        os.remove("xray/" + selec_sub.get())
        with open("xray/sub_files_name", "r") as f:
            sun_nms = f.readlines()
            del sun_nms[0]
        with open("xray/sub_files_name", "w") as f:
            f.writelines(sun_nms)
        print(sun_nms)
        sun_nms = remove_empty_strings(sun_nms)
        sun_nms = [line.strip() for line in sun_nms]
        selec_sub.configure(values=sun_nms)
        selec_sub.set(sun_nms[0])
        try:
            update_buton.pack_forget()
        except Exception:
            pass
        show_confs("testttttttt")

    def th_ping_all(sus="", nume=0, is_new=False, is_all=False):
        global is_close_ping, count, is_less, frams_in_ping
        save = frams_in_ping
        print("num: ", nume)
        if is_all == False or is_all == True:
            if not is_new and not is_all:
                nume -= (is_less[nume + count]) * -1
                nume += count
                temp = frams_in_ping[:count]
                frams_in_ping = temp + frams_in_ping[count:]
            else:
                nume -= (is_less[nume]) * -1
                temp = frams_in_ping[:count][::-1]
                frams_in_ping = temp + frams_in_ping[count:]
        print("num: ", nume)
        if sus == "":
            if ping_b._text == "ping":
                ping_b.configure(text="stop")
                is_close_ping = False
            else:
                is_close_ping = True
                ping_b.configure(text="ping")
                print("return 1")
                return

        def ping_all():
            global frams_in_ping, count
            global is_close_ping
            xray_abs = os.path.abspath("xray/xray.exe")
            config_path = f"xray/{selec_sub.get()}"

            def s_xray(conf_path, t):
                global pidproc
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                proc = subprocess.Popen(
                    [xray_abs, "run", "-c", conf_path],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    startupinfo=startupinfo,
                )
                process_manager.add_process(f"xray_{t}", proc.pid)

            def stop_x(pidproc):
                subprocess.call(
                    ["taskkill", "/F", "/PID", str(pidproc)],
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )

            def s_hy2(path_file, t):
                global hyproc
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                hy = subprocess.Popen(
                    ["hy2/hysteria.exe", "client", "-c", path_file],
                    stdin=subprocess.DEVNULL,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    startupinfo=startupinfo,
                )
                process_manager.add_process(f"hysteria_{t}", hy.pid)

            def stop_h(hyproc):
                subprocess.call(
                    ["taskkill", "/F", "/PID", str(hyproc)],
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )

            def load_config():
                global count
                with open(f"xray/{selec_sub.get()}", "r", encoding="utf-8") as f:
                    if selec_sub.get() == "user_custom_confs":
                        file = json.load(f)
                        temp = file[:count][::-1]
                        file = temp + file[count:]
                        return file, True
                    else:
                        try:
                            file = f.readlines()
                            temp = file[:count][::-1]
                            file = temp + file[count:]
                            return remove_empty_strings(file), False
                        except Exception:
                            file = json.load(f)
                            temp = file[:count][::-1]
                            file = temp + file[count:]
                            return file, True

            def update_vmess_config_name_with_ping(
                vmess_link: str, ping_result: str
            ) -> str:
                if not vmess_link or not vmess_link.startswith("vmess://"):
                    return vmess_link

                try:
                    parts = vmess_link.split("#", 1)
                    main_link_part = parts[0]
                    external_tag = f"#{parts[1]}" if len(parts) > 1 else ""

                    encoded_json_str = main_link_part.replace("vmess://", "")

                    missing_padding = len(encoded_json_str) % 4
                    if missing_padding:
                        encoded_json_str += "=" * (4 - missing_padding)

                    decoded_json_bytes = base64.b64decode(encoded_json_str)
                    decoded_json_str = decoded_json_bytes.decode("utf-8")

                    config_dict = json.loads(decoded_json_str)

                    current_ps = config_dict.get("ps", "")

                    base_ps = (
                        ":".join(current_ps.split(":")[:-1])
                        if ":" in current_ps
                        and current_ps.split(":")[-1].isdigit()
                        or current_ps.split(":")[-1] == "-1"
                        else current_ps
                    )

                    updated_ps = f"{base_ps}:{ping_result}"
                    config_dict["ps"] = updated_ps.strip(":")

                    updated_json_str = json.dumps(config_dict, separators=(",", ":"))

                    updated_encoded_json_bytes = base64.b64encode(
                        updated_json_str.encode("utf-8")
                    )
                    updated_encoded_json_str = updated_encoded_json_bytes.decode(
                        "utf-8"
                    )

                    final_link = f"vmess://{updated_encoded_json_str}{external_tag}"
                    return final_link

                except Exception as e:
                    print(f"Error updating vmess link '{vmess_link}': {e}")
                    return vmess_link

            def parse_address(i):
                try:
                    if i.startswith("vmess://"):
                        after_vemss = i.split("vmess://")[1].encode("utf-8")
                        after_vemss_d = base64.b64decode(after_vemss).decode("utf-8")
                        after_vemss_d = json.loads(after_vemss_d)
                        return after_vemss_d["add"]
                    else:
                        return i.split(i[i.index("://")])[1].split("@")[1].split(":")[0]
                except Exception:
                    return ""

            def get_address_from_dict(i):
                try:
                    if i["outbounds"][0]["protocol"] == "wireguard":
                        return i["outbounds"][0]["settings"]["peers"][0][
                            "endpoint"
                        ].split(":")[0]
                    else:
                        return i["outbounds"][0]["settings"]["servers"][0]["address"]
                except Exception:
                    return ""

            def update_ip_addresses(input_dict, t):
                def update_value(value):
                    if isinstance(value, str):
                        if "127.0.0." in value:
                            return f"127.0.0.{str(t)}"
                    elif isinstance(value, list):
                        return [update_value(item) for item in value]
                    elif isinstance(value, dict):
                        return update_ip_addresses(value, t)
                    return value

                return {key: update_value(value) for key, value in input_dict.items()}

            def process_ping(i: str, t, counter=2):
                global frams_in_ping, is_close_ping, pidproc, hyproc
                while t > 100:
                    t -= 100
                path_test_file = f"xray/config_test_ping{'' if t == 0 else str(t)}.json"
                hy2_path_test_file = f"hy2/config{'' if t == 0 else str(t)}.yaml"
                ADDRESS = (
                    parse_address(i)
                    if not isinstance(i, dict)
                    else get_address_from_dict(i)
                )
                result = "-1"
                if is_close_ping:
                    if sus != "":
                        frams_in_ping = save
                    print("return 2")
                    if t == len(copy_in_sus_nms) - 1:
                        is_close_ping = False
                    exit()
                    return
                if frams_in_ping[t]._text == "....":
                    print("return 3")
                    return
                frams_in_ping[t].configure(text="....", fg_color="gray")
                is_wrong = False
                with open(path_test_file, "w") as f:
                    try:
                        if not is_dict:
                            f.write(
                                parse_configs(
                                    i,
                                    cv=2 if sus != "" else t + 2,
                                    hy2_path=hy2_path_test_file,
                                )
                            )
                        else:
                            json.dump(
                                update_ip_addresses(i, 2 if sus != "" else t + 2), f
                            )
                    except Exception:
                        is_wrong = True
                if not is_wrong:
                    with open(path_test_file, "r") as f:
                        temp3 = json.load(f)
                    port = temp3["inbounds"][1]["port"]
                    if not is_dict:
                        if i.startswith("hy2://") or i.startswith("hysteria2://"):
                            th3h = threading.Thread(
                                target=s_hy2,
                                args=(
                                    hy2_path_test_file,
                                    t,
                                ),
                            )
                            th3h.start()
                    th3 = threading.Thread(
                        target=s_xray,
                        args=(
                            path_test_file,
                            t,
                        ),
                    )
                    th3.start()
                    time.sleep(3)
                    os.remove(path_test_file)
                    if os.path.exists(hy2_path_test_file):
                        os.remove(hy2_path_test_file)

                    @retry(
                        stop_max_attempt_number=3,
                        wait_fixed=500,
                        retry_on_exception=lambda x: isinstance(x, Exception),
                    )
                    def pingg():
                        try:
                            proxies = {
                                "http": f"http://127.0.0.{2 if sus != '' else t + 2}:{port}",
                                "https": f"http://127.0.0.{2 if sus != '' else t + 2}:{port}",
                            }
                            url = test_link_
                            headers = {"Connection": "close"}
                            start = time.time()
                            response = requests.get(
                                url, proxies=proxies, timeout=10, headers=headers
                            )
                            elapsed = (time.time() - start) * 1000
                            if response.status_code == 204 or (
                                response.status_code == 200
                                and len(response.content) == 0
                            ):
                                return f"{int(elapsed)}"
                            else:
                                if response.status_code == 503:
                                    raise IOError(
                                        "Connection test error, check your connection or ping again ..."
                                    )
                                else:
                                    raise IOError(
                                        f"Connection test error, status code: {response.status_code}"
                                    )
                        except RequestException as e:
                            print(f"testConnection RequestException: {e}")
                            return "-1"
                        except Exception as e:
                            print(f"testConnection Exception: {e}")
                            return "-1"

                    try:
                        result = pingg()
                    except Exception:
                        result = "-1"
                    if int(result) >= 1000:
                        ping_fg_color = "#FFBF00"
                        txt_color = "#000000"
                    elif int(result) == -1:
                        ping_fg_color = "red"
                        txt_color = "white"
                    elif int(result) < 1000:
                        ping_fg_color = "green"
                        txt_color = "white"
                    frams_in_ping[t].configure(
                        text=result, fg_color=ping_fg_color, text_color=txt_color
                    )
                    if not is_dict:
                        if i.startswith("hy2://") or i.startswith("hysteria2://"):
                            process_manager.stop_process(f"hysteria_{t}")
                    process_manager.stop_process(f"xray_{t}")
                else:
                    frams_in_ping[t].configure(text="-1", fg_color="red")

                if is_dict:
                    with threading.Lock():
                        if t < len(copy_in_sus_nms):
                            copy_in_sus_nms[t]["remarks"] += (
                                f"{':'.join(copy_in_sus_nms[t]['remarks'].split(':')[:-1])}:{result}"
                            )
                else:
                    with threading.Lock():
                        if copy_in_sus_nms[t].startswith("vmess://"):
                            copy_in_sus_nms[t] = update_vmess_config_name_with_ping(
                                copy_in_sus_nms[t], result
                            )
                        else:
                            copy_in_sus_nms[t] = (
                                f"{':'.join(copy_in_sus_nms[t].strip().split(':')[:-1]) if ':' in copy_in_sus_nms[t].strip().split('#')[-1] else copy_in_sus_nms[t].strip()}:{result}"
                            )

            sun_nms, is_dict = load_config()
            copy_in_sus_nms = sun_nms
            if sus != "":
                sun_nms = [sus] if is_dict else remove_empty_strings([sus])
            with ThreadPoolExecutor(max_workers=5) as executor:
                futures = [
                    executor.submit(process_ping, i, t)
                    for t, i in enumerate(sun_nms, start=nume)
                ]
            if is_dict:
                with open(config_path, "w", encoding="utf-8") as f:
                    json.dump(copy_in_sus_nms, f, indent=2, ensure_ascii=False)
            else:
                with open(config_path, "w", encoding="utf-8") as f:
                    f.writelines(f"{line.strip()}\n" for line in copy_in_sus_nms)
            is_close_ping = False
            ping_b.configure(text="ping")
            print("ireset")
            if sus != "":
                frams_in_ping = save

        threading.Thread(target=ping_all).start()

    def extract_ping(label) -> int:
        text = label.cget("text")
        match = re.search(r"-?\d+", text)
        return int(match.group()) if match else None

    def sort_frames_by_ping(frames: List, labels: List) -> List:
        paired = list(zip(frames, labels))
        numeric_pairs = [
            (frame, label) for frame, label in paired if extract_ping(label) is not None
        ]
        non_numeric_pairs = [
            (frame, label) for frame, label in paired if extract_ping(label) is None
        ]
        positive_pairs = [pair for pair in numeric_pairs if extract_ping(pair[1]) >= 0]
        negative_pairs = [pair for pair in numeric_pairs if extract_ping(pair[1]) < 0]
        sorted_positive_pairs = sorted(positive_pairs, key=lambda x: extract_ping(x[1]))
        sorted_negative_pairs = sorted(negative_pairs, key=lambda x: extract_ping(x[1]))
        return (
            [frame for frame, _ in sorted_positive_pairs]
            + [frame for frame, _ in sorted_negative_pairs]
            + [frame for frame, _ in non_numeric_pairs]
        )

    def th_sort_all():
        def th():
            global frams_in_ping
            li1 = sort_frames_by_ping(scrollable_frame5.winfo_children(), frams_in_ping)
            for widget in scrollable_frame5.winfo_children():
                widget.pack_forget()
            for i in li1:
                i.pack(pady=5, ipady=5, fill=tk.X)

        threading.Thread(target=th, daemon=True).start()

    top_vpn_f = ctk.CTkFrame(tabview.tab("configs"), border_width=1, corner_radius=10)
    top_vpn_f.pack(pady=5, ipady=5, fill=tk.X)
    ip_cion = ctk.CTkImage(
        light_image=Image.open("imgs/save.png"),
        dark_image=Image.open("imgs/save.png"),
        size=(25, 25),
    )
    add_icon = ctk.CTkButton(
        top_vpn_f,
        image=ip_cion,
        text="",
        width=25,
        command=get_config_from_user,
        hover_color="#DF9C27",
        fg_color="#2b2b2b",
    )
    add_icon.pack(side=tk.LEFT, padx=3)
    update_icon = ctk.CTkImage(
        light_image=Image.open("imgs/update.png"),
        dark_image=Image.open("imgs/update.png"),
        size=(25, 25),
    )
    remove_icon = ctk.CTkImage(
        light_image=Image.open("imgs/remove.png"),
        dark_image=Image.open("imgs/remove.png"),
        size=(25, 25),
    )
    with open("xray/sub_files_name", "r") as f:
        sun_nms = f.readlines()
        sun_nms = remove_empty_strings(sun_nms)
        sun_nms = [line.strip() for line in sun_nms]
    selec_sub = ctk.CTkOptionMenu(
        top_vpn_f, values=sun_nms, width=150, command=show_confs
    )
    selec_sub.pack(side=tk.LEFT, padx=(20, 0))
    update_buton = ctk.CTkButton(
        top_vpn_f,
        image=update_icon,
        text="",
        width=25,
        command=parse_sub_in,
        hover_color="#DF9C27",
        fg_color="#2b2b2b",
    )
    remov_buton = ctk.CTkButton(
        top_vpn_f,
        image=remove_icon,
        text="",
        width=25,
        command=remove_sub_in,
        hover_color="#DF9C27",
        fg_color="#2b2b2b",
    )
    remov_buton.pack(side=tk.RIGHT, padx=(5, 15))
    confs_fram = ctk.CTkFrame(
        tabview.tab("configs"), border_width=1, height=500, corner_radius=10
    )
    confs_fram.pack(pady=5, ipady=5, fill=tk.BOTH)
    dwonfram = ctk.CTkFrame(confs_fram)
    dwonfram.pack(side=tk.BOTTOM)
    ping_b = ctk.CTkButton(
        dwonfram,
        command=lambda start=0: th_ping_all(nume=start, is_all=True),
        text="ping",
        corner_radius=20,
    )
    ping_b.pack(side=tk.LEFT)
    sort_b = ctk.CTkButton(
        dwonfram, command=lambda start=0: th_sort_all(), text="sort", corner_radius=20
    )
    sort_b.pack(side=tk.LEFT, padx=3)
    scrollable_frame5 = ctk.CTkScrollableFrame(confs_fram, width=490, height=500)
    scrollable_frame5.pack(padx=10, pady=10, fill="both")

    def on_conf_click(i, c, is_on: ctk.CTkTextbox):
        global temp_green_txtb
        if is_on._fg_color == "green":
            return
        is_on.configure(fg_color="green")
        temp_green_txtb.configure(fg_color="gray")
        temp_green_txtb = is_on
        with open("xray/count", "w") as f:
            f.write(str(c))

    show_confs("test")
    rootmainactivity.mainloop()


if __name__ == "__main__":
    mainactivity()
