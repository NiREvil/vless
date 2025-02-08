{
  "log": {
    "level": "warn",
    "timestamp": true
  },
  "dns": {
    "servers": [
      {
        "type": "tcp",
        "tag": "proxy-dns",
        "detour": "proxy",
        "domain_resolver": "local-dns",
        "server": "185.228.168.9",
        "server_port": 0
      },
      {
        "type": "tcp",
        "tag": "local-dns",
        "detour": "direct",
        "server": "8.8.4.4",
        "server_port": 0
      },
      {
        "type": "local",
        "tag": "direct-dns",
        "detour": "direct"
      }
    ],
    "rules": [
      {
        "source_ip_cidr": "172.19.0.0/30",
        "clash_mode": "Global",
        "server": "proxy-dns"
      },
      {
        "source_ip_cidr": "172.19.0.0/30",
        "server": "proxy-dns"
      },
      {
        "clash_mode": "Direct",
        "server": "direct-dns"
      },
      {
        "rule_set": "geosite-ir",
        "server": "direct-dns"
      }
    ],
    "final": "proxy-dns",
    "strategy": "prefer_ipv4"
  },
  "endpoints": [],
  "inbounds": [
    {
      "type": "direct",
      "tag": "dns-in",
      "listen": "0.0.0.0",
      "listen_port": 6450,
      "override_address": "1.1.1.1",
      "override_port": 53
    },
    {
      "type": "tun",
      "tag": "tun-in",
      "mtu": 9000,
      "address": "172.18.0.1/28",
      "auto_route": true,
      "stack": "mixed"
    },
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "0.0.0.0",
      "listen_port": 2080
    }
  ],
  "outbounds": [
    {
      "type": "selector",
      "tag": "proxy",
      "outbounds": [],
      "default": "🟡Berlin"
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": [],
      "url": "https://www.gstatic.com/generate_204",
      "tolerance": 50
    },
    {
      "type": "direct",
      "tag": "direct",
      "domain_strategy": "ipv4_only"
    }
  ],
  "route": {
    "rules": [
      {
        "action": "sniff",
        "timeout": "1s"
      },
      {
        "protocol": "dns",
        "action": "hijack-dns"
      },
      {
        "clash_mode": "Direct",
        "action": "resolve",
        "strategy": "prefer_ipv4"
      },
      {
        "clash_mode": "Global",
        "action": "route-options",
        "override_address": "1.1.1.1",
        "override_port": 443
      },
      {
        "rule_set": ["geoip-private", "geosite-private", "geosite-ir", "geoip-ir"],
        "action": "direct"
      },
      {
        "rule_set": "geosite-ads",
        "action": "reject",
        "method": "default"
      }
    ],
    "rule_set": [
      {
        "type": "remote",
        "tag": "geosite-ads",
        "format": "binary",
        "url": "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs",
        "download_detour": "direct"
      },
      {
        "type": "remote",
        "tag": "geosite-private",
        "format": "binary",
        "url": "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/private.srs",
        "download_detour": "direct"
      },
      {
        "type": "remote",
        "tag": "geosite-ir",
        "format": "binary",
        "url": "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ir.srs",
        "download_detour": "direct"
      },
      {
        "type": "remote",
        "tag": "geoip-private",
        "format": "binary",
        "url": "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/private.srs",
        "download_detour": "direct"
      },
      {
        "type": "remote",
        "tag": "geoip-ir",
        "format": "binary",
        "url": "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/ir.srs",
        "download_detour": "direct"
      }
    ],
    "final": "proxy",
    "auto_detect_interface": true,
    "override_android_vpn": true
  }
}
