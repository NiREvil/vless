// <----- Time is 16:57pm  Wednesday, 19 June 2024 UTC -  NiREvil ----->
// Create a subscription link containing a configured fragment with random parameters in Cloudflare Workers for use in v2rayNG Client.
// replace contents of line (28) with your vless configuration hostname, the line of (30) with your UUID and also line (31) with your preferred cf clean ip or your worker/pages.dev domain.
// Fragment values can be edited from these lines: (139-140-141).
// If you don't have the VLESS config, create it for yourself by cloudflare pages using this code: https://github.com/NiREvil/Emotional-Damage

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

// Utility functions
const selectRandomItem = (items) => items[Math.floor(Math.random() * items.length)];

const generateRandomString = (length, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const randomizeCase = (str) => str.split('').map(char => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()).join('');

// Main handler function
async function handleRequest(request) {
    // Constants
    const portsList = [443, 8443, 2053, 2096, 2087, 2083];
    const domain = 'randomfrag.pages.dev';// Replace with your hostname.
    //If you wanted to use Trojan configuration instead of vless, in this section instead of userUUID, you should put the Trojan password.
    const userUUID = '048ce287-6a7b-4dad-98fe-b5f3f6789b57';// Replace with your vless config UUID.
    const cleanIPs = 'creativecommons.org';// your preferred cf clean ip/domain.

    // Randomized constants
    const randomPort = selectRandomItem(portsList);
    const randomizedDomain = randomizeCase(domain);
    const randomPath = '/NiREvil' + generateRandomString(44) + '?ed=2560';


    // Configuration object
    const config = {
  "remarks": "⨵ Frɑgϻϵͷ₺",
  "log": {
    "loglevel": "warning"
  },
  "dns": {
    "hosts": {},
    "servers": [
      "https://94.140.14.14/dns-query"
    ],
    "tag": "dns"
  },
  "inbounds": [
    {
      "port": 10808,
      "protocol": "socks",
      "settings": {
        "auth": "noauth",
        "udp": true,
        "userLevel": 8
      },
      "sniffing": {
        "destOverride": [
          "http",
          "tls"
        ],
        "enabled": true
      },
      "tag": "socks-in"
    },
    {
      "port": 10809,// v2rayNG
      "protocol": "http",
      "settings": {
        "auth": "noauth",
        "udp": true,
        "userLevel": 8
      },
      "sniffing": {
        "destOverride": [
          "http",
          "tls"
        ],
        "enabled": true
      },
      "tag": "http-in"
    }
  ],
  "outbounds": [
    {
      "protocol": "vless",
      "settings": {
        "vnext": [
          {
            "address": cleanIPs,
            "port": randomPort,
            "users": [
              {
                "encryption": "none",
                "flow": "",
                "id": userUUID,
                "level": 8,
                "security": "auto"
              }
            ]
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "security": "tls",
        "sockopt": {
          "dialerProxy": "fragment",
          "tcpKeepAliveIdle": 100,
          "tcpNoDelay": true
        },
        "tlsSettings": {
          "allowInsecure": false,
          "fingerprint": "chrome",
          "alpn": [
            "h2",
            "http/1.1"
          ],
          "serverName": randomizedDomain,
        },
        "wsSettings": {
          "headers": {
            "Host": randomizedDomain,
          },
          "path": randomPath,
        }
      },
      "tag": "proxy"
    },
    {
      "tag": "fragment",
      "protocol": "freedom",
      "settings": {
        "fragment": {
          "packets": "1-1",// 1-1 OR 1-5 OR tlshello
          "length": "1403",// 20 ~ 7500
          "interval": "1"// 1 ~ 30 
        }
      },
      "streamSettings": {
        "sockopt": {
          "tcpKeepAliveIdle": 100,
          "tcpNoDelay": true
        }
      }
    },
    {
      "protocol": "dns",
      "tag": "dns-out"
    },
    {
      "protocol": "freedom",
      "settings": {},
      "tag": "direct"
    },
    {
      "protocol": "blackhole",
      "settings": {
        "response": {
          "type": "http"
        }
      },
      "tag": "block"
    }
  ],
  "policy": {
    "levels": {
      "8": {
        "connIdle": 300,
        "downlinkOnly": 1,
        "handshake": 4,
        "uplinkOnly": 1
      }
    },
    "system": {
      "statsOutboundUplink": true,
      "statsOutboundDownlink": true
    }
  },
  "routing": {
    "domainStrategy": "IPIfNonMatch",
    "rules": [
      {
        "ip": [
          "8.8.8.8"
        ],
        "outboundTag": "direct",
        "port": "53",
        "type": "field"
      },
      {
        "inboundTag": [
          "socks-in",
          "http-in"
        ],
        "type": "field",
        "port": "53",
        "outboundTag": "dns-out",
        "enabled": true
      },
      {
        "outboundTag": "proxy",
        "type": "field",
        "network": "tcp,udp"
      }
    ]
  },
  "stats": {}
}
// Respond with the JSON configuration in pretty printed format
return new Response(JSON.stringify(config, null, 2), {
  status: 200,
  headers: {
      'Content-Type': 'application/json;charset=utf-8',
  },
});
}
