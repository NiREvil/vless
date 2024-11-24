//profile-title: base64:V2luZHNjcmliZSBvbiBIMiAoaGlkZGlmeSBvdXRib3VuZCk=
//profile-update-interval: 48
//subscription-userinfo: upload=1547483648; download=840034815488; total=966367641600; expire=1740774601
//support-url:  https://t.me/F_NiREvil
//profile-web-page-url: https://github.com/NiREvil

{
  "log": {
    "level": "warn",
    "output": "box.log",
    "timestamp": true
  },
  "dns": {
    "servers": [
      {
        "tag": "dns-remote",
        "address": "tcp://8.8.8.8",
        "address_resolver": "dns-direct"
      },
      {
        "tag": "dns-trick-direct",
        "address": "https://sky.rethinkdns.com/",
        "detour": "direct-fragment"
      },
      {
        "tag": "dns-direct",
        "address": "tcp://8.8.8.8",
        "address_resolver": "dns-local",
        "detour": "direct"
      },
      {
        "tag": "dns-local",
        "address": "local",
        "detour": "direct"
      },
      {
        "tag": "dns-block",
        "address": "rcode://success"
      }
    ],
    "rules": [
      {
        "domain": "clients3.google.com",
        "server": "dns-remote",
        "rewrite_ttl": 3000
      },
      {
        "domain_suffix": ".ir",
        "server": "dns-direct"
      },
      {
        "rule_set": [
          "geoip-ir",
          "geosite-ir"
        ],
        "server": "dns-direct"
      }
    ],
    "final": "dns-remote",
    "static_ips": {
      "sky.rethinkdns.com": [
        "104.17.148.22",
        "104.17.147.22",
        "188.114.98.0",
        "188.114.99.0"
      ]
    },
    "independent_cache": true
  },
  "inbounds": [
    {
      "type": "mixed",
      "tag": "mixed-in",
      "listen": "127.0.0.1",
      "listen_port": 12334,
      "sniff": true,
      "sniff_override_destination": true,
      "set_system_proxy": true
    },
    {
      "type": "direct",
      "tag": "dns-in",
      "listen": "127.0.0.1",
      "listen_port": 16450
    }
  ],
  "outbounds": [
    {
      "type": "selector",
      "tag": "select",
      "outbounds": [
        "auto",
        "🇫🇷Windscribe",
        "🇸🇪H2"
      ],
      "default": "auto",
      "interrupt_exist_connections": true
    },
    {
      "type": "urltest",
      "tag": "auto",
      "outbounds": [
        "🇫🇷Windscribe",
        "🇸🇪H2"
      ],
      "url": "https://clients3.google.com/generate_204",
      "interval": "10m0s",
      "tolerance": 1,
      "idle_timeout": "30m0s",
      "interrupt_exist_connections": true
    },
    {
      "type": "wireguard",
      "tag": "🇫🇷Windscribe",
      "detour": "🇸🇪H2",
      "local_address": "100.100.196.8/32",
      "private_key": "qKgJJNTkkAr37k74Ix7FkdB3tVIHE1rQBOp4adjm2HU=",
      "server": "138.199.47.222",
      "server_port": 65142,
      "peer_public_key": "cmaT8JIehfRf5PWWDkcBRwLWDb3jrIkk/SDbw4JmUAc=",
      "pre_shared_key": "p9oZWElz4vn74dOqa0+UNIJGxy2/VeBF6b8YIfmVgY0=",
      "mtu": 1280
    },
    {
      "type": "hysteria2",
      "tag": "🇸🇪H2",
      "server": "77.91.87.167",
      "server_port": 2087,
      "obfs": {
        "type": "salamander",
        "password": "fd784f88798796c1"
      },
      "password": "04bb42227f7c629c",
      "tls": {
        "enabled": true,
        "server_name": "www.google.c",
        "insecure": true,
        "alpn": "h3"
      }
    },
    {
      "type": "dns",
      "tag": "dns-out"
    },
    {
      "type": "direct",
      "tag": "direct"
    },
    {
      "type": "direct",
      "tag": "direct-fragment",
      "tls_fragment": {
        "enabled": true,
        "size": "10-30",
        "sleep": "1-2"
      }
    },
    {
      "type": "direct",
      "tag": "bypass"
    },
    {
      "type": "block",
      "tag": "block"
    }
  ],
  "route": {
    "rules": [
      {
        "inbound": "dns-in",
        "outbound": "dns-out"
      },
      {
        "port": 53,
        "outbound": "dns-out"
      },
      {
        "domain_suffix": ".ir",
        "outbound": "direct"
      },
      {
        "rule_set": [
          "geoip-ir",
          "geosite-ir"
        ],
        "outbound": "direct"
      }
    ],
    "rule_set": [
      {
        "type": "remote",
        "tag": "geoip-ir",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/hiddify/hiddify-geo/rule-set/country/geoip-ir.srs",
        "update_interval": "120h0m0s"
      },
      {
        "type": "remote",
        "tag": "geosite-ir",
        "format": "binary",
        "url": "https://raw.githubusercontent.com/hiddify/hiddify-geo/rule-set/country/geosite-ir.srs",
        "update_interval": "120h0m0s"
      }
    ],
    "final": "select",
    "auto_detect_interface": true,
    "override_android_vpn": true
  },
  "experimental": {
    "cache_file": {
      "enabled": true,
      "path": "clash.db"
    },
    "clash_api": {
      "external_controller": "127.0.0.1:16756",
      "secret": "8gqnMX4uVcuRYNVf"
    }
  }
}
