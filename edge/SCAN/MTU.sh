#!/data/data/com.termux/files/usr/bin/bash

echo -e "\n\033[1;36m==========[ MTU Deep Scan Analyzer ]==========\033[0m"

# Check and install prerequisites
if ! command -v ping >/dev/null 2>&1; then
    echo -e "\033[1;33mInstalling required package: inetutils...\033[0m"
    pkg update -y && pkg install inetutils -y
    if [ $? -ne 0 ]; then
        echo -e "\033[1;31mFailed to install inetutils. Check your internet or Termux setup.\033[0m"
        exit 1
    fi
fi

if ! command -v awk >/dev/null 2>&1; then
    echo -e "\033[1;31mError: 'awk' not found. This is unusual for Termux. Try reinstalling Termux.\033[0m"
    exit 1
fi

# Install dnsutils for dig if not present
if ! command -v dig >/dev/null 2>&1; then
    echo -e "\033[1;33mInstalling required package: dnsutils...\033[0m"
    pkg update -y && pkg install dnsutils -y
    if [ $? -ne 0 ]; then
        echo -e "\033[1;31mFailed to install dnsutils. Check your internet or Termux setup.\033[0m"
        exit 1
    fi
fi

# --- MTU Section ---

# Defaults
host="8.8.8.8"
min=1300
max=1500
step=5
attempts=10
declare -A results

# Function to draw MTU chart
draw_chart() {
    local width=50
    echo -e "\n\033[1;34mMTU Success Rate Chart:\033[0m"
    echo -e "\033[1;32m┌──────────────────────┬───────────────────────────────────────────────────────────┐\033[0m"
    echo -e "\033[1;32m│   Payload Size       │ Success Rate (out of $attempts)                      │\033[0m"
    echo -e "\033[1;32m├──────────────────────┼───────────────────────────────────────────────────────────┤\033[0m"
    for ((size=$min; size<=$max; size+=$step)); do
        count=${results[$size]}
        percent=$((count * 100 / attempts))
        bar_length=$((count * width / attempts))
        bar=$(printf "%${bar_length}s" | tr ' ' '█')
        if [ $percent -ge 80 ]; then color="\033[1;32m"; elif [ $percent -ge 50 ]; then color="\033[1;33m"; else color="\033[1;31m"; fi
        printf "\033[1;37m│ %-20d │ ${color}%-${width}s \033[1;37m(%3d%%) │\n" "$size" "$bar" "$percent"
    done
    echo -e "\033[1;32m└──────────────────────┴───────────────────────────────────────────────────────────┘\033[0m"
}

# MTU Scan
total_steps=$(((max - min) / step + 1))
current_step=0
for ((size=$min; size<=$max; size+=$step)); do
    ((current_step++))
    percent=$((current_step * 100 / total_steps))
    echo -ne "\rTesting payload size: $size/$max [$percent%]"
    success_count=$(ping -c $attempts -W 2 -M do -s $size $host 2>/dev/null | awk '/received/ {print $4}')
    results[$size]=${success_count:-0}
done
echo -e "\n\033[1;32mMTU Scan completed!\033[0m"

# Draw MTU chart
draw_chart

# Find best MTU
best_payload=0
best_success=0
for ((size=$max; size>=$min; size-=$step)); do
    if [[ ${results[$size]} -gt $best_success ]]; then
        best_success=${results[$size]}
        best_payload=$size
    fi
    if [[ ${results[$size]} -eq $attempts ]]; then
        break
    fi
done
recommended_mtu=$((best_payload + 28))

# Display MTU results
echo -e "\n\033[1;36m==========[ Best MTU Recommendation ]==========\033[0m"
echo -e "\033[1;35m├───────────────────────────────────────────────────────────────┤"
echo -e "│ \033[1;37mHighest Success Rate: \033[1;33m$best_success/$attempts \033[1;37m($((best_success * 100 / attempts))%)\033[1;35m           │"
echo -e "│ \033[1;37mBest Payload Size:   \033[1;33m$best_payload\033[1;35m                                 │"
echo -e "│ \033[1;37mRecommended MTU:     \033[1;33m$recommended_mtu \033[1;37m(Payload + 28)\033[1;35m                    │"
echo -e "└───────────────────────────────────────────────────────────────┘\033[0m"
echo -e "\033[1;37mSet this in your WireGuard config under [Interface]: MTU = $recommended_mtu\033[0m"

# --- DNS Section ---

echo -e "\n\033[1;36m==========[ DNS Benchmark - Termux Edition ]==========\033[0m"

# DNS list with some additions (popular and reliable servers)
dns_list=(
    "8.8.8.8"       # Google DNS
    "8.8.4.4"       # Google DNS
    "1.1.1.1"       # Cloudflare DNS
    "1.0.0.1"       # Cloudflare DNS
    "9.9.9.9"       # Quad9
    "149.112.112.112" # Quad9 (additional)
    "94.140.14.14"  # AdGuard DNS
    "94.140.15.15"  # AdGuard DNS
    "76.76.2.2"     # Control D
    "76.76.10.2"    # Control D
    "185.228.168.9" # CleanBrowsing
    "208.67.222.222" # OpenDNS
    "208.67.220.220" # OpenDNS (additional)
)
domain="google.com"
declare -A dns_results
best_dns=""
best_time=9999

# Function to draw DNS table
draw_dns_table() {
    echo -e "\n\033[1;34mDNS Response Time Table:\033[0m"
    echo -e "\033[1;32m┌──────────────────┬────────────────────────────┐\033[0m"
    echo -e "\033[1;32m│ DNS Server       │ Response Time             │\033[0m"
    echo -e "\033[1;32m├──────────────────┼────────────────────────────┤\033[0m"
    for dns in "${!dns_results[@]}"; do
        time="${dns_results[$dns]}"
        if [[ "$time" == "Timeout" ]]; then
            color="\033[1;31m"
        elif ((time < 50)); then
            color="\033[1;32m"
        elif ((time < 100)); then
            color="\033[1;33m"
        else
            color="\033[1;31m"
        fi
        printf "\033[1;37m│ %-16s │ ${color}%-25s\033[1;37m│\n" "$dns" "$time"
    done
    echo -e "\033[1;32m└──────────────────┴────────────────────────────┘\033[0m"
}

# DNS Benchmark
total_dns=${#dns_list[@]}
current_dns=0
for dns in "${dns_list[@]}"; do
    ((current_dns++))
    percent=$((current_dns * 100 / total_dns))
    echo -ne "\rTesting DNS $dns [$percent%]"
    result=$(dig @"$dns" "$domain" +stats +time=1 +tries=1 2>/dev/null | grep "Query time" | awk '{print $4}')
    if [[ -z "$result" ]]; then
        dns_results[$dns]="Timeout"
    else
        dns_results[$dns]="${result} ms"
        # Track the best DNS
        if ((result < best_time)); then
            best_time=$result
            best_dns=$dns
        fi
    fi
done
echo -e "\n\033[1;32mDNS Benchmark completed!\033[0m"

# Draw DNS table
draw_dns_table

# Display best DNS recommendation
echo -e "\n\033[1;36m==========[ Best DNS Recommendation ]==========\033[0m"
echo -e "\033[1;35m├───────────────────────────────────────────────────────────────┤"
echo -e "│ \033[1;37mFastest DNS Server:  \033[1;33m$best_dns\033[1;35m                                 │"
echo -e "│ \033[1;37mResponse Time:       \033[1;33m$best_time ms\033[1;35m                              │"
echo -e "└───────────────────────────────────────────────────────────────┘\033[0m"
echo -e "\033[1;37mAdd this to your DNS settings for faster and secure browsing!\033[0m"

# Final message
echo -e "\n\033[1;32m>> Script done. Stay private, stay smart.\033[0m"
echo -e "\033[1;37mWe are all\033[1;31m \033[0mREvil
