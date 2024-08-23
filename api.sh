#!/usr/bin/env bash

# 只允许root运行
[[ "$EUID" -ne '0' ]] && echo "Error:This script must be run as root!" && exit 1

# 帮助
help() {
  echo -ne " Usage:\n   bash api.sh\n\t-h/--help\t\thelp\n\t-f/--file string\tConfiguration file\n\t-r/--register\t\tRegister an account\n\t-t/--token\t\tRegister with a team token\n\t-d/--device\t\tGet the devices information and plus traffic quota\n\t-a/--app\t\tFetch App information\n\t-b/--bind\t\tGet the account blinding devices\n\t-n/--name\t\tChange the device name\n\t-l/--license\t\tChange the license\n\t-u/--unbind\t\tUnbine a device from the account\n\t-c/--cancle\t\tCancle the account\n\t-i/--id\t\t\tShow the client id and reserved\n\n"
}

# 获取账户信息
fetch_account_information() {
  # 如不使用账户信息文件，则手动填写 Device id 和 Api token
  if [ -s "$REGISTER_PATH" ]; then
    # Teams 账户文件
    if grep -q 'xml version' $REGISTER_PATH; then
      ID=$(grep 'correlation_id' $REGISTER_PATH | sed "s#.*>\(.*\)<.*#\1#")
      TOKEN=$(grep 'warp_token' $REGISTER_PATH | sed "s#.*>\(.*\)<.*#\1#")
      CLIENT_ID=$(grep 'client_id' $REGISTER_PATH | sed "s#.*client_id&quot;:&quot;\([^&]\{4\}\)&.*#\1#")

    # 官方 api 文件
    elif grep -q 'client_id' $REGISTER_PATH; then
      ID=$(grep -m1 '"id' "$REGISTER_PATH" | cut -d\" -f4)
      TOKEN=$(grep '"token' "$REGISTER_PATH" | cut -d\" -f4)
      CLIENT_ID=$(grep 'client_id' "$REGISTER_PATH" | cut -d\" -f4)

    # client 文件，默认存放路径为 /var/lib/cloudflare-warp/reg.json
    elif grep -q 'registration_id' $REGISTER_PATH; then
      ID=$(cut -d\" -f4 "$REGISTER_PATH")
      TOKEN=$(cut -d\" -f8 "$REGISTER_PATH")

    # wgcf 文件，默认存放路径为 /etc/wireguard/wgcf-account.toml
    elif grep -q 'access_token' $REGISTER_PATH; then
      ID=$(grep 'device_id' "$REGISTER_PATH" | cut -d\' -f2)
      TOKEN=$(grep 'access_token' "$REGISTER_PATH" | cut -d\' -f2)

    # warp-go 文件，默认存放路径为 /opt/warp-go/warp.conf
    elif grep -q 'PrivateKey' $REGISTER_PATH; then
      ID=$(awk -F' *= *' '/^Device/{print $2}' "$REGISTER_PATH")
      TOKEN=$(awk -F' *= *' '/^Token/{print $2}' "$REGISTER_PATH")

    else
      echo " There is no registered account information, please check the content. " && exit 1
    fi
  else
    read -rp " Input device id: " ID
    local i=5
    until [[ "$ID" =~ ^(t\.)?[A-F0-9a-f]{8}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{12}$ ]]; do
      ((i--)) || true
      [ "$i" = 0 ] && echo " Input errors up to 5 times. The script is aborted. " && exit 1 || read -rp " Device id should be 36 or 38 characters, please re-enter (${i} times remaining): " ID
    done

    read -rp " Input api token: " TOKEN
    local i=5
    until [[ "$TOKEN" =~ ^[A-F0-9a-f]{8}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{4}-[A-F0-9a-f]{12}$ ]]; do
      ((i--)) || true
      [ "$i" = 0 ] && echo " Input errors up to 5 times. The script is aborted. " && exit 1 || read -rp " Api token should be 36 characters, please re-enter (${i} times remaining): " TOKEN
    done
  fi
}

# 注册warp账户
register_account() {
  # 生成 wireguard 公私钥，并且补上 private key
  if [ -x "$(type -p wg)" ]; then
    PRIVATE_KEY=$(wg genkey)
    PUBLIC_KEY=$(wg pubkey <<<"$PRIVATE_KEY")
  elif [[ -x "$(type -p openssl)" && -x "$(type -p xxd)" && -x "$(type -p base64)" ]]; then
    KEY_PAIR=$(openssl genpkey -algorithm X25519 -text)
    PRIVATE_KEY=$(echo $KEY_PAIR | sed 's/.*priv:\(.*\)pub.*/\1/' | xxd -r -p | base64)
    PUBLIC_KEY=$(echo $KEY_PAIR | sed 's/.*pub://' | xxd -r -p | base64)
  else
    WG_API=$(curl -m5 -sSL https://wg-key.forvps.gq/)
    PRIVATE_KEY=$(awk 'NR==2 {print $2}' <<<"$WG_API")
    PUBLIC_KEY=$(awk 'NR==1 {print $2}' <<<"$WG_API")
  fi

  if grep -q . <<<"$PRIVATE_KEY" && grep -q . <<<"$PUBLIC_KEY"; then
    INSTALL_ID=$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 22)
    FCM_TOKEN="${INSTALL_ID}:APA91b$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 134)"

    # 由于某些 IP 存在被限制注册，所以使用不停的注册来处理
    until grep -q 'account' <<<"$ACCOUNT"; do
      [ "$ACCOUNT" = 'error code: 1015' ] && sleep 10
      ACCOUNT=$(curl --request POST 'https://api.cloudflareclient.com/v0a2158/reg' \
        --silent \
        --location \
        --tlsv1.3 \
        --header 'User-Agent: okhttp/3.12.1' \
        --header 'CF-Client-Version: a-6.10-2158' \
        --header 'Content-Type: application/json' \
        --header "Cf-Access-Jwt-Assertion: $(sed 's/.*?token=//' <<<"$TEAM_TOKEN")" \
        --data '{"key":"'${PUBLIC_KEY}'","install_id":"'${INSTALL_ID}'","fcm_token":"'${FCM_TOKEN}'","tos":"'$(date +"%Y-%m-%dT%H:%M:%S.000Z")'","model":"PC","serial_number":"'${INSTALL_ID}'","locale":"zh_CN"}')
    done

    CLIENT_ID=$(sed 's/.*"client_id":"\([^\"]\+\)\".*/\1/' <<<"$ACCOUNT")
    RESERVED=$(echo "$CLIENT_ID" | base64 -d | xxd -p | fold -w2 | while read HEX; do printf '%d ' "0x${HEX}"; done | awk '{print "["$1", "$2", "$3"]"}')

    ACCOUNT=$(python3 -m json.tool <<<"$ACCOUNT" 2>&1 | sed "/\"key\"/a\    \"private_key\": \"$PRIVATE_KEY\"," | sed "/\"client_id\"/a\        \"reserved\": $RESERVED,")
  fi

  grep -q 'error' <<<"$ACCOUNT" && echo " Failed to register an account. " && exit 1
  if [ -n "$REGISTER_PATH" ]; then
    [ ! -d "$(dirname "$REGISTER_PATH")" ] && mkdir -p $(dirname "$REGISTER_PATH")
    echo "$ACCOUNT" >$REGISTER_PATH 2>&1
    cat $REGISTER_PATH
  else
    echo "$ACCOUNT"
  fi

  exit 0
}

# 获取设备信息
device_information() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request GET "https://api.cloudflareclient.com/v0a2158/reg/${ID}" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" |
    python3 -m json.tool | sed "/\"warp_enabled\"/i\    \"token\": \"${TOKEN}\","
}

# 获取账户APP信息
app_information() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request GET "https://api.cloudflareclient.com/v0a2158/client_config" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" |
    python3 -m json.tool
}

# 查看账户绑定设备
account_binding_devices() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request GET "https://api.cloudflareclient.com/v0a2158/reg/${ID}/account/devices" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" |
    python3 -m json.tool
}

# 添加或者更改设备名
change_device_name() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request PATCH "https://api.cloudflareclient.com/v0a2158/reg/${ID}/account/reg/${ID}" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" \
    --data '{"name":"'$DEVICE_NAME'"}' |
    python3 -m json.tool
}

# 更换 license
change_license() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request PUT "https://api.cloudflareclient.com/v0a2158/reg/${ID}/account" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" \
    --data '{"license": "'$LICENSE'"}' |
    python3 -m json.tool
}

# 删除绑定设备
unbind_devide() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  curl --request PATCH "https://api.cloudflareclient.com/v0a2158/reg/${ID}/account/reg/${ID}" \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" \
    --data '{"active":false}' |
    python3 -m json.tool
}

# 删除账户
cancle_account() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information

  local RESULT=$(curl --request DELETE "https://api.cloudflareclient.com/v0a2158/reg/${ID}" \
    --head \
    --silent \
    --location \
    --header 'User-Agent: okhttp/3.12.1' \
    --header 'CF-Client-Version: a-6.10-2158' \
    --header 'Content-Type: application/json' \
    --header "Authorization: Bearer ${TOKEN}" | awk '/HTTP/{print $(NF-1)}')

  grep -qw '204' <<<"$RESULT" && echo " Success. The account has been cancelled. " || echo " Failure. The account is not available. "
}

# reserved 解码
decode_reserved() {
  [[ -z "$ID" && -z "$TOKEN" ]] && fetch_account_information
  [ -z "$CLIENT_ID" ] && {
    fetch_client_id=$(device_information)
    CLIENT_ID=$(expr " $fetch_client_id" | awk -F'"' '/client_id/{print $4}')
  }
  RESERVED=$(echo "$CLIENT_ID" | base64 -d | xxd -p | fold -w2 | while read HEX; do printf '%d ' "0x${HEX}"; done | awk '{print "["$1", "$2", "$3"]"}')
  echo -e "client id: $CLIENT_ID\nreserved : $RESERVED"
}

[[ "$#" -eq '0' ]] && help && exit

while [[ $# -ge 1 ]]; do
  case "${1,,}" in
  -f | --file)
    shift
    REGISTER_PATH="$1"
    shift
    ;;
  -r | --register)
    RUN=register_account
    shift
    ;;
  -d | --device)
    RUN=device_information
    shift
    ;;
  -a | --app)
    RUN=app_information
    shift
    ;;
  -b | --bind)
    RUN=account_binding_devices
    shift
    ;;
  -n | --name)
    shift
    DEVICE_NAME="$1"
    RUN=change_device_name
    shift
    ;;
  -l | --license)
    shift
    LICENSE="$1"
    RUN=change_license
    shift
    ;;
  -u | --unbind)
    RUN=unbind_devide
    shift
    ;;
  -c | --cancle)
    RUN=cancle_account
    shift
    ;;
  -i | --id)
    RUN=decode_reserved
    shift
    ;;
  -t | --token)
      shift
      team_token="$1"
      shift
      ;;
  -h | --help)
    help
    exit
    ;;
  *)
    help
    exit
    ;;
  esac
done

# 根据参数运行
$RUN