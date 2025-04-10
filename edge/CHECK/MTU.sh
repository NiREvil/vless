#!/data/data/com.termux/files/usr/bin/bash

echo -e "\n\033[1;36m==========[ MTU Deep Scan Analyzer ]==========\033[0m"

# Check dependencies
if ! command -v ping >/dev/null 2>&1; then
    echo -e "\033[1;33mInstalling required package: inetutils...\033[0m"
    pkg update -y && pkg install inetutils dnsutils -y
    if [ $? -ne 0 ]; then
        echo -e "\033[1;31mFailed to install inetutils. Check your internet or vpn.\033[0m"
        exit 1
    fi
fi

if ! command -v awk >/dev/null 2>&1; then
    echo -e "\033[1;31mError: 'awk' not found. This is unusual for Termux. Try reinstalling Termux.\033[0m"
    exit 1
fi

# Defaults
host="8.8.8.8"
min=1300
max=1500
step=5
attempts=10
declare -A results

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

# MTU scanning
total_steps=$(((max - min) / step + 1))
current_step=0
for ((size=$min; size<=$max; size+=$step)); do
    ((current_step++))
    percent=$((current_step * 100 / total_steps))
    echo -ne "\rTesting payload size: $size/$max [$percent%]"
    success_count=$(ping -c $attempts -W 2 -M do -s $size $host 2>/dev/null | awk '/received/ {print $4}')
    results[$size]=${success_count:-0}
done
echo -e "\n\033[1;32mScan completed!\033[0m"

# Draw chart
draw_chart

# Find best payload
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

# print results
echo -e "\n\033[1;36m==========[ Best MTU Recommendation ]==========\033[0m"
echo -e "\033[1;35m├───────────────────────────────────────────────────────────────┤"
echo -e "│ \033[1;37mHighest Success Rate: \033[1;33m$best_success/$attempts \033[1;37m($((best_success * 100 / attempts))%)\033[1;35m           │"
echo -e "│ \033[1;37mBest Payload Size:   \033[1;33m$best_payload\033[1;35m                                 │"
echo -e "│ \033[1;37mRecommended MTU:     \033[1;33m$recommended_mtu \033[1;37m(Payload + 28)\033[1;35m                    │"
echo -e "└───────────────────────────────────────────────────────────────┘\033[0m"
echo -e "\033[1;37mSet this in your WireGuard config under [Interface]: MTU = $recommended_mtu\033[0m"
