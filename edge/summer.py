import re
import os
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

CHANNELS = {
    "freewireguard": "https://t.me/s/freewireguard",
    "diwire": "https://t.me/s/Diwire",
}

OUTPUT_DIR = "sub"
OUTPUT_FILES = {
    "neko": "nekobox-wg.txt",
    "husi": "husi-wg.txt",
    "exclave": "exclave-wg.txt",
    "v2ray": "v2rayng-wg.txt",
}


def read_existing_configs(file_path):
    logger.info(f"Reading existing configs from {file_path}")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return set(f.read().strip().split("\n"))
    return set()


def fetch_configs():
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }

        existing_configs = {
            config_type: read_existing_configs(os.path.join(OUTPUT_DIR, filename))
            for config_type, filename in OUTPUT_FILES.items()
        }

        new_configs = {"neko": set(), "husi": set(), "exclave": set(), "v2ray": set()}

        logger.info("Fetching configs from Diwire channel")
        response = requests.get(CHANNELS["diwire"], headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        for message in soup.find_all("div", class_="tgme_widget_message_text"):
            if not message.text:
                continue

            patterns = {
                "neko": r"sn://[^\s]+",
                "husi": r"husi://[^\s]+",
                "exclave": r"exclave://[^\s]+",
            }

            for config_type, pattern in patterns.items():
                for match in re.finditer(pattern, message.text):
                    config = match.group(0)
                    if config not in existing_configs[config_type]:
                        new_configs[config_type].add(config)

        logger.info("Fetching configs from freewireguard channel")
        response = requests.get(CHANNELS["freewireguard"], headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        for message in soup.find_all("div", class_="tgme_widget_message_text"):
            if not message.text:
                continue

            for match in re.finditer(r"wireguard://[^\s]+", message.text):
                config = match.group(0)
                base_config = config.split("#")[0]
                if base_config not in existing_configs["v2ray"]:
                    new_configs["v2ray"].add(
                        f"{base_config}#REvil{len(new_configs['v2ray'])+1}"
                    )

        os.makedirs(OUTPUT_DIR, exist_ok=True)

        for config_type, config_set in new_configs.items():
            if config_set:
                output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILES[config_type])
                all_configs = existing_configs[config_type].union(config_set)

                with open(output_path, "w", encoding="utf-8") as f:
                    f.write("\n".join(sorted(all_configs)))

                logger.info(f"Added {len(config_set)} new {config_type} configs")

        logger.info(f"Successfully synced at- {datetime.now()}")

    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")


if __name__ == "__main__":
    logger.info("Starting the configuration fetch process")
    fetch_configs()
    logger.info("Completed the configuration fetch process")
