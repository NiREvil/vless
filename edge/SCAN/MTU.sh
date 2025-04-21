#!/data/data/com.termux/files/usr/bin/bash

# --- Color Definitions ---
# Define ANSI color codes for output styling
RESET='\033[0m'
B_CYAN='\033[1;36m'
B_YELLOW='\033[1;33m'
B_RED='\033[1;31m'
B_BLUE='\033[1;34m'
B_GREEN='\033[1;32m'
B_WHITE='\033[1;37m'
B_MAGENTA='\033[1;35m'

# --- Helper Functions ---

# Function to draw a progress bar
# Usage: draw_progress_bar current_step total_steps "Message Prefix"
draw_progress_bar() {
    local current=$1
    local total=$2
    local message=$3
    local width=40 # Width of the progress bar in characters
    local percent=$((current * 100 / total))
    local completed_width=$((width * current / total))
    local remaining_width=$((width - completed_width))

    # Create the bar string
    local bar=$(printf "%${completed_width}s" | tr ' ' '█')
    local remaining=$(printf "%${remaining_width}s" | tr ' ' '.')

    # Print the progress bar using \r to overwrite the line
    printf "\r${B_WHITE}${message} [${B_GREEN}%s${B_YELLOW}%s${B_WHITE}] %d%%${RESET}" "${bar}" "${remaining}" "${percent}"

    # Print newline when complete
    if [ "$current" -eq "$total" ]; then
        echo
    fi
}


# --- Script Header ---
echo -e "\n${B_CYAN}==========[ MTU & DNS Analyzer ]==========${RESET}"

# --- Prerequisite Checks ---
echo -e "${B_YELLOW}Checking prerequisites...${RESET}"
# Check for ping (inetutils)
if ! command -v ping >/dev/null 2>&1; then
    echo -e "${B_YELLOW}Installing required package: inetutils...${RESET}"
    pkg update -y && pkg install inetutils -y
    if [ $? -ne 0 ]; then
        echo -e "${B_RED}Failed to install inetutils. Check your internet or VPN setup.${RESET}"
        exit 1
    fi
fi

# Check for awk (usually built-in, but good practice)
if ! command -v awk >/dev/null 2>&1; then
    echo -e "${B_RED}Error: 'awk' not found. This is unusual. Try reinstalling Termux or coreutils.${RESET}"
    exit 1
fi

# Check for dig (dnsutils)
if ! command -v dig >/dev/null 2>&1; then
    echo -e "${B_YELLOW}Installing required package: dnsutils...${RESET}"
    pkg update -y && pkg install dnsutils -y
    if [ $? -ne 0 ]; then
        echo -e "${B_RED}Failed to install dnsutils. Check your internet or VPN.${RESET}"
        exit 1
    fi
fi
echo -e "${B_GREEN}Prerequisites met.${RESET}"

# --- MTU Section ---
echo -e "\n${B_CYAN}--- MTU Scan ---${RESET}"

# Configuration 
host="1.1.1.1"      # Target host for MTU test (Google DNS is reliable)
min_payload=1280    # Minimum payload size to test
max_payload=1500    # Maximum payload size to test
step=10             # Increment step for payload size
attempts=10          # Number of pings per payload size
declare -A mtu_results # Associative array to store results (payload_size -> success_count)

# Function to draw MTU chart
draw_mtu_chart() {
    local width=50 # Width of the success rate bar
    echo -e "\n${B_BLUE}MTU Success Rate Chart:${RESET}"
    echo -e "${B_GREEN}┌──────────────────────┬───────────────────────────────────────────────────────────┐${RESET}"
    echo -e "${B_GREEN}│   Payload Size (bytes) │ Success Rate (out of $attempts)                                 │${RESET}"
    echo -e "${B_GREEN}├──────────────────────┼───────────────────────────────────────────────────────────┤${RESET}"
    # Sort keys numerically for display (requires process substitution)
    for size in $(echo "${!mtu_results[@]}" | tr ' ' '\n' | sort -n); do
        count=${mtu_results[$size]:-0} # Default to 0 if somehow unset
        # Ensure attempts is not zero to avoid division by zero
        if [ "$attempts" -eq 0 ]; then
            percent=0
            bar_length=0
        else
            percent=$((count * 100 / attempts))
            bar_length=$((count * width / attempts))
        fi
        # Ensure bar_length is an integer for printf
        bar_length_int=$(printf "%.0f" "$bar_length")
        bar=$(printf "%${bar_length_int}s" | tr ' ' '█')
        # Determine color based on percentage
        if [ $percent -ge 80 ]; then color="${B_GREEN}"; elif [ $percent -ge 50 ]; then color="${B_YELLOW}"; else color="${B_RED}"; fi
        # Print the row
        printf "${B_WHITE}│ %-20d │ ${color}%-${width}s ${B_WHITE}(%3d%%) │${RESET}\n" "$size" "$bar" "$percent"
    done
    echo -e "${B_GREEN}└──────────────────────┴───────────────────────────────────────────────────────────┘${RESET}"
}

# MTU Scan Logic
total_steps=$(((max_payload - min_payload) / step + 1))
current_step=0
echo -e "${B_YELLOW}Scanning MTU payload sizes from ${min_payload} to ${max_payload} against ${B_WHITE}${host}${B_YELLOW}...${RESET}"
for ((size=min_payload; size<=max_payload; size+=step)); do
    ((current_step++))
    # -c attempts: Number of pings
    # -W 2: Wait 2 seconds for reply
    # -M do: Set Don't Fragment (DF) flag - crucial for MTU testing
    # -s size: Payload size (ICMP data size)
    # awk: Extracts the number of received packets
    ping_output=$(ping -c $attempts -W 2 -M do -s $size $host 2>/dev/null)
    success_count=$(echo "$ping_output" | awk '/packets transmitted/ {gsub(/,/, ""); print $4}')

    # Basic validation: ensure success_count is a number
    if [[ "$success_count" =~ ^[0-9]+$ ]]; then
        mtu_results[$size]=${success_count}
    else
        mtu_results[$size]=0 # Treat errors or no reply as 0 successes
    fi

    # Update progress bar
    draw_progress_bar $current_step $total_steps "Testing Payload ${size} bytes"
done
# Ensure the progress bar line is cleared after the loop
echo # Print a newline

# Find best MTU
max_success_found=-1 # Initialize to -1 to correctly find the max, even if it's 0
# First pass: Find the maximum success count achieved across all sizes
for size in "${!mtu_results[@]}"; do
    if [[ ${mtu_results[$size]} -gt $max_success_found ]]; then
        max_success_found=${mtu_results[$size]}
    fi
done

best_payload_final=0
# Second pass: Find the largest payload size that achieved this maximum success count
# Iterate downwards from max_payload
for ((size=max_payload; size>=min_payload; size-=step)); do
    # Check if the result for this size exists and equals the max success found
    if [[ -v mtu_results[$size] ]] && [[ ${mtu_results[$size]} -eq $max_success_found ]]; then
        best_payload_final=$size
        break # Found the largest payload with the max success rate
    fi
done

# Draw the chart after calculations
draw_mtu_chart

# Display MTU results
echo -e "\n${B_CYAN}==========[ Best MTU Recommendation ]==========${RESET}"
echo -e "${B_MAGENTA}├───────────────────────────────────────────────────────────────┤${RESET}"
if [[ $max_success_found -lt 0 ]]; then # Should not happen with init to -1, but safe check
     echo -e "${B_MAGENTA}│ ${B_RED}Error: MTU scan did not run correctly.${B_MAGENTA}                       │${RESET}"
     recommended_mtu="Error"
     best_payload_display="Error"
     best_success_display="Error"
elif [[ $max_success_found -eq 0 ]]; then
     echo -e "${B_MAGENTA}│ ${B_RED}Warning: No successful pings for any payload size.${B_MAGENTA}           │${RESET}"
     recommended_mtu="N/A"
     best_payload_display="N/A"
     best_success_display="0/${attempts} (0%)"
else
    # Recommended MTU = Payload Size + IP Header (20 bytes) + ICMP Header (8 bytes)
    recommended_mtu=$((best_payload_final + 28))
    best_payload_display="$best_payload_final"
    best_success_rate=$((max_success_found * 100 / attempts))
    best_success_display="${max_success_found}/${attempts} (${best_success_rate}%)"
    echo -e "${B_MAGENTA}│ ${B_WHITE}Highest Success Rate: ${B_YELLOW}${best_success_display}${B_MAGENTA}                              │${RESET}"
    echo -e "${B_MAGENTA}│ ${B_WHITE}Largest Payload Size: ${B_YELLOW}${best_payload_display}${RESET}" 
    echo -e "${B_MAGENTA}│ ${B_WHITE}Recommended MTU:     ${B_YELLOW}${recommended_mtu} ${B_WHITE}(Payload + 28)${B_MAGENTA}                      │${RESET}"
fi
echo -e "${B_MAGENTA}└───────────────────────────────────────────────────────────────┘${RESET}"

# Provide guidance based on results
if [[ "$recommended_mtu" == "N/A" ]]; then
    echo -e "${B_YELLOW}Could not determine a reliable MTU. Check connectivity or try a different host/range.${RESET}"
elif [[ "$recommended_mtu" != "Error" ]]; then
    echo -e "${B_WHITE}Set this in your VPN config (e.g., WireGuard [Interface]): ${B_GREEN}MTU = $recommended_mtu${RESET}"
fi


#--- DNS Section ---
echo -e "\n${B_CYAN}--- DNS Benchmark ---${RESET}"

# DNS list
dns_list=(
    "8.8.8.8"       # Google DNS
    "8.8.4.4"
    "1.1.1.1"       # Cloudflare DNS
    "1.0.0.1"
    "9.9.9.9"       # Quad9 (Security/Privacy focused)
    "149.112.112.112"
    "9.9.9.10"      # Quad9 (No Malware blocking (for experts only!))
    "149.112.112.10"
    "9.9.9.11"      # Quad9 (ECS Enable)
    "149.112.112.11"
    "94.140.14.14"  # AdGuard DNS (Ad-blocking)
    "94.140.15.15"
    "76.76.2.2"     # Control D (Customizable)
    "76.76.10.2"
    "185.228.168.9" # CleanBrowsing (Family Filter)
    "185.228.169.9"
    "208.67.222.222" # OpenDNS Cisco
    "208.67.220.220"
    "76.76.19.19"    # Alternate DNS
    "76.223.122.150"
    "78.157.42.100"  # Shekan
    "78.157.42.101"
    "45.90.28.0"     # Next DNS
    "45.90.30.0"
    "8.26.56.26"     # Comodo secureDNS
    "8.20.247.20"
    "84.200.69.80"   # DNS Watch 
    "84.200.70.40"
    "64.6.64.6"      # Verisign
    "64.6.65.6"
    "46.151.208.154" # OpenNIC 
    "128.199.248.105"
    "80.80.80.80"    # Freenom
    "80.80.81.81"
    "156.154.70.1"   # Advantage DNS
    "156.154.71.1"
    "129.250.35.250" # NTT DNS
    "129.250.35.251"
    "216.146.35.35"  # DNY DNS
    "216.146.36.36"
    "216.146.36.36"  # Turkish
    "81.214.55.192"
    "204.106.240.53" # USA
    "108.179.34.214" 
    "203.141.131.66" # Japan
    "220.110.210.114"
    "94.206.42.74"   # Dubai
    "94.206.47.14"
    "168.119.27.54" # Frankfurt
    "168.119.61.220"
    "46.166.189.67" # Amsterdam
    "80.113.19.90"
    # Add your ISP's DNS here if known, or router address (e.g., 192.168.1.1)
)
domain="google.com" # Domain to query for benchmark
declare -A dns_results_ms # Store successful results (DNS -> time_ms)
declare -A dns_timeouts   # Store servers that timed out (DNS -> 1)
best_dns=""
best_time=99999 # Initialize with a very high value

# Function to draw DNS table
draw_dns_table() {
    echo -e "\n${B_BLUE}DNS Response Time Table:${RESET}"
    echo -e "${B_GREEN}┌──────────────────┬────────────────────────────┐${RESET}"
    echo -e "${B_GREEN}│ DNS Server       │ Response Time (ms)         │${RESET}"
    echo -e "${B_GREEN}├──────────────────┼────────────────────────────┤${RESET}"
    # Iterate in the original list order for consistency
    for dns in "${dns_list[@]}"; do
        if [[ -v dns_timeouts[$dns] ]]; then
            color="${B_RED}"
            display_time="Timeout"
        elif [[ -v dns_results_ms[$dns] ]]; then
            time=${dns_results_ms[$dns]}
            # Color coding based on response time
            if ((time < 50)); then
                color="${B_GREEN}" # Fast
            elif ((time < 150)); then
                color="${B_YELLOW}" # Moderate
            else
                color="${B_RED}"   # Slow
            fi
            display_time="${time} ms"
        else
             # This case means it wasn't tested or failed unexpectedly before storing result
             color="${B_RED}"
             display_time="Error/Untested"
        fi
         printf "${B_WHITE}│ %-16s │ ${color}%-25s${B_WHITE} │${RESET}\n" "$dns" "$display_time"
    done
    echo -e "${B_GREEN}└──────────────────┴────────────────────────────┘${RESET}"
}

# DNS Benchmark Logic
total_dns=${#dns_list[@]}
current_dns_step=0
echo -e "${B_YELLOW}Benchmarking ${total_dns} DNS servers against ${B_WHITE}${domain}${B_YELLOW}...${RESET}"
for dns in "${dns_list[@]}"; do
    ((current_dns_step++))
    # dig options:
    # @dns: Specify the DNS server to query
    # domain: The domain name to look up
    # +noall: Don't print verbose output sections
    # +answer: Print the answer section (useful for verifying success, though we only use time)
    # +stats: Print statistics, including Query time
    # +time=1: Set query timeout to 1 second
    # +tries=1: Attempt query only once
    # awk: Extract the query time in ms
    result=$(dig @"$dns" "$domain" +noall +answer +stats +time=1 +tries=1 2>/dev/null | grep "Query time:" | awk '{print $4}')

    # Check if dig returned a valid time (numeric and >= 0)
    if [[ "$result" =~ ^[0-9]+$ ]] && [[ "$result" -ge 0 ]]; then
        dns_results_ms[$dns]="$result"
        # Update best time if this one is faster
        if ((result < best_time)); then
            best_time=$result
            best_dns=$dns
        fi
    else
        dns_timeouts[$dns]=1 # Mark this DNS as timed out or failed
    fi

    # Update progress bar
    draw_progress_bar $current_dns_step $total_dns "Testing DNS ${dns}"
    # Optional: Small delay to prevent rate limiting by DNS servers
    # sleep 0.05
done
# Ensure the progress bar line is cleared
echo

# Draw the results table
draw_dns_table

# Display DNS recommendation
echo -e "\n${B_CYAN}==========[ Best DNS Recommendation ]==========${RESET}"
echo -e "${B_MAGENTA}├───────────────────────────────────────────────────────────────┤${RESET}"
if [[ -z "$best_dns" ]]; then
    # This happens if all DNS servers timed out or failed
    echo -e "${B_MAGENTA}│ ${B_RED}No responsive DNS server found in the list.${B_MAGENTA}                  │${RESET}"
    echo -e "${B_MAGENTA}│ ${B_YELLOW}Check network connection or try different DNS servers.${B_MAGENTA}       │${RESET}"
else
    echo -e "${B_MAGENTA}│ ${B_WHITE}Fastest Responsive DNS: ${B_YELLOW}${best_dns}${B_MAGENTA}                               │${RESET}"
    echo -e "${B_MAGENTA}│ ${B_WHITE}Response Time:          ${B_YELLOW}${best_time} ms${B_MAGENTA}                                 │${RESET}"
fi
echo -e "${B_MAGENTA}└───────────────────────────────────────────────────────────────┘${RESET}"

# Provide guidance
if [[ -n "$best_dns" ]]; then
    echo -e "${B_WHITE}Consider using ${B_GREEN}${best_dns}${B_WHITE} in your system or VPN DNS settings for potentially faster lookups.${RESET}"
    echo -e "${B_WHITE}(e.g., WireGuard [Interface] ${B_GREEN}DNS = ${best_dns}${B_WHITE})${RESET}"
fi

# --- Final Message ---
echo -e "\n${B_GREEN}>> Script finished.${RESET}"
echo -e "${B_WHITE}We are all${RESET} ${B_RED}REvil${RESET}"
