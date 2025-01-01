import re
import os
import time
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

CHANNEL_URL = "https://t.me/s/freewireguard"
OUTPUT_FILE = 'sub/wireguardv'

def fetch_wireguard_configs():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(CHANNEL_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        messages = soup.find_all('div', class_='tgme_widget_message_text')
        
        configs = []
        for message in messages:
            if not message.text:
                continue
            
            matches = re.finditer(r'wireguard://[^\s]+', message.text)
            for match in matches:
                config = match.group(0)
                base_config = config.split('#')[0]
                configs.append(base_config)
                
            if len(configs) >= 25:
                break
        
        configs = configs[:25]
        
        if not configs:
            logger.error("There is NO FUCKIN shit here!!!")
            return
        
        final_configs = [
            f"{config}#NiREvil{i+1}"
            for i, config in enumerate(configs)
        ]
        
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(final_configs))
            
        logger.info(f"Successfully SYNCED AT: {datetime.now()}")
        
    except Exception as e:
        logger.error(f"Error occurred: {str(e)}")

if __name__ == '__main__':
    fetch_wireguard_configs()
              
