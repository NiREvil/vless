import re
import os
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import random
import time

# Set up logging for better debugging and tracking
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Telegram channels to fetch configs from
CHANNELS = {
    "diwire": "https://t.me/s/Diwire",
    "freewireguard": "https://t.me/s/freewireguard",
}

# Directory and file paths for storing configs
OUTPUT_DIR = "sub"
OUTPUT_FILES = {
    "neko": "nekobox-wg.txt",
    "husi": "husi-wg.txt",
    "exclave": "exclave-wg.txt",
    "v2ray": "v2rayng-wg.txt",
}

# Maximum number of configs to keep for each type
MAX_CONFIGS = {
    "neko": float("inf"),
    "husi": float("inf"),
    "exclave": float("inf"),
    "v2ray": 80,  # Maximum 80 configs
}


def read_existing_configs(file_path):
    """Read existing configs from a file"""
    logger.info(f"Reading existing configs from {file_path}")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return set(f.read().strip().split("\n"))
    return set()


def write_configs_to_file(configs, file_path, max_count, keep_order=False):
    """Write configs to a file, limiting to max_count"""
    config_list = configs if isinstance(configs, list) else list(configs)

    if len(config_list) > max_count:
        logger.warning(f"Too many configs for {file_path}. Limiting to {max_count}")
        if file_path.endswith("v2rayng-wg.txt"):
            config_list = random.sample(config_list, max_count)
        else:
            config_list = config_list[-max_count:]

    with open(file_path, "w", encoding="utf-8") as f:
        if keep_order and file_path != os.path.join(OUTPUT_DIR, OUTPUT_FILES["v2ray"]):
            f.write("\n".join(config_list))
        else:
            f.write("\n".join(sorted(config_list)))

    logger.info(f"Wrote {len(config_list)} configs to {file_path}")


def fetch_telegram_page(channel_url, max_pages=5, max_retries=3):
    """Fetch multiple pages from the Telegram channel"""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    }
    all_html = ""
    last_message_id = None

    for page in range(max_pages):
        url = (
            channel_url
            if last_message_id is None
            else f"{channel_url}?before={last_message_id}"
        )
        logger.info(f"Fetching page {page+1}: {url}")
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            html = response.text
            all_html += html

            soup = BeautifulSoup(html, "html.parser")
            messages = soup.find_all("div", class_="tgme_widget_message")
            if not messages:
                break
            last_message_id = min(
                int(m.get("data-post", "0").split("/")[-1])
                for m in messages
                if m.get("data-post")
            )
            time.sleep(2)  # Delay to avoid being blocked
        except Exception as e:
            logger.error(f"Error fetching page {url}: {str(e)}")
            break

    return all_html


def extract_configs_from_diwire(html_content):
    """Extract configs from Diwire channel in chronological order"""
    soup = BeautifulSoup(html_content, "html.parser")
    configs = {"neko": [], "husi": [], "exclave": []}

    message_containers = soup.find_all("div", class_="tgme_widget_message")
    logger.info(f"Found {len(message_containers)} messages in Diwire channel")

    message_containers.sort(
        key=lambda x: (
            int(x.get("data-post", "0").split("/")[-1]) if x.get("data-post") else 0
        )
    )

    patterns = {
        "neko": r"sn://[^\s]+",
        "husi": r"husi://[^\s]+",
        "exclave": r"exclave://[^\s]+",
    }

    for container in message_containers:
        message = container.find("div", class_="tgme_widget_message_text")
        if not message or not message.text:
            continue

        for config_type, pattern in patterns.items():
            for match in re.finditer(pattern, message.text):
                config = match.group(0)
                if config not in configs[config_type]:
                    configs[config_type].append(config)

    for config_type, config_list in configs.items():
        logger.info(f"Extracted {len(config_list)} {config_type} configs from Diwire")

    return configs


def extract_configs_from_freewireguard(html_content):
    """Extract WireGuard configs from freewireguard channel in chronological order"""
    soup = BeautifulSoup(html_content, "html.parser")
    configs = []

    message_containers = soup.find_all("div", class_="tgme_widget_message")
    logger.info(f"Found {len(message_containers)} messages in freewireguard channel")

    message_containers.sort(
        key=lambda x: (
            int(x.get("data-post", "0").split("/")[-1]) if x.get("data-post") else 0
        )
    )

    for container in message_containers:
        message = container.find("div", class_="tgme_widget_message_text")
        if not message or not message.text:
            continue

        for match in re.finditer(r"wireguard://[^\s]+", message.text):
            config = match.group(0)
            base_config = config.split("#")[0]
            configs.append(f"{base_config}#REvil{len(configs)+1}")

    logger.info(f"Extracted {len(configs)} configs from freewireguard")
    return configs


def verify_and_clean_configs(configs):
    """Verify and clean configs, preserving order for lists"""
    cleaned_configs = {}

    for config_type, config_collection in configs.items():
        if isinstance(config_collection, list):
            cleaned = []
            seen = set()
            for config in config_collection:
                config = config.strip()
                if config and config not in seen:
                    cleaned.append(config)
                    seen.add(config)
            cleaned_configs[config_type] = cleaned
            if len(cleaned) != len(config_collection):
                logger.warning(
                    f"Removed {len(config_collection) - len(cleaned)} invalid or duplicate {config_type} configs"
                )
        else:
            cleaned = set()
            for config in config_collection:
                config = config.strip()
                if config:
                    cleaned.add(config)
            cleaned_configs[config_type] = cleaned
            if len(cleaned) != len(config_collection):
                logger.warning(
                    f"Removed {len(config_collection) - len(cleaned)} invalid {config_type} configs"
                )

    return cleaned_configs


def fetch_configs():
    """Main function to fetch and store configs"""
    try:
        logger.info("Starting configuration fetch process")
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        # Fetch configs from Diwire
        try:
            diwire_html = fetch_telegram_page(CHANNELS["diwire"], max_pages=5)
            diwire_configs = extract_configs_from_diwire(diwire_html)

            for config_type in ["neko", "husi", "exclave"]:
                output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILES[config_type])
                max_count = MAX_CONFIGS[config_type]
                write_configs_to_file(
                    diwire_configs[config_type], output_path, max_count, keep_order=True
                )
                logger.info(
                    f"Completely rewrote {config_type} configs with {len(diwire_configs[config_type])} configs in chronological order"
                )
        except Exception as e:
            logger.error(f"Error fetching from Diwire: {str(e)}")

        # Fetch configs from freewireguard
        try:
            freewireguard_html = fetch_telegram_page(
                CHANNELS["freewireguard"], max_pages=5
            )
            v2ray_configs = extract_configs_from_freewireguard(freewireguard_html)

            # Get the latest 80 configs
            latest_v2ray_configs = (
                v2ray_configs[-80:] if len(v2ray_configs) > 80 else v2ray_configs
            )

            # Write to file
            output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILES["v2ray"])
            write_configs_to_file(
                latest_v2ray_configs, output_path, max_count=80, keep_order=True
            )
            logger.info(f"Wrote {len(latest_v2ray_configs)} configs to v2rayng-wg.txt")
        except Exception as e:
            logger.error(f"Error fetching from freewireguard: {str(e)}")

        logger.info(f"Successfully synced at - {datetime.now()}")
    except Exception as e:
        logger.error(f"Error occurred in fetch_configs: {str(e)}")
        raise


if __name__ == "__main__":
    try:
        fetch_configs()
        logger.info("Completed the configuration fetch process successfully")
    except Exception as e:
        logger.error(f"Script execution failed: {str(e)}")
