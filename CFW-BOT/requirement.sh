#!/bin/bash

package_installed() {
    dpkg -s "$1" &> /dev/null
}

if ! package_installed telebot; then
    pip install telebot --user
fi

if ! package_installed pytelegrambotapi; then
    pip install pytelegrambotapi --upgrade --user
fi

if ! package_installed qrcode; then
    pip install qrcode[pil] --user
fi

if ! package_installed requests; then
    pip install requests --user
fi

if ! package_installed python-dotenv; then
    pip install python-dotenv --user
fi

curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash

. ~/.nvm/nvm.sh

nvm install 16.17.0

echo -e '\nexport NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo -e '[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo -e '[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"' >> ~/.bashrc

echo "Environment variables for nvm set up."

npm install -g wrangler@latest

echo "Wrangler installed successfully."
