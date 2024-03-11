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
    const domain = 'consequences.revil.workers.dev'; // Replace with your domain.
    const userUUID = 'f9344391-0caf-4816-a5cb-51d748f128ba'; // Replace with your User UUID.

    // Randomized constants
    const randomPort = selectRandomItem(portsList);
    const randomizedDomain = randomizeCase(domain);
    const randomPath = '/' + generateRandomString(59);

    // Configuration object
    const config = {
        "log": {
            "access": "",
            "error": "",
            "loglevel": "warning"
        },
        "inbounds": [
            {
                "tag": "socks",
                "port": 10808,
                "listen": "127.0.0.1",
                "protocol": "socks",
                "sniffing": {
                    "enabled": true,
                    "destOverride": [
                        "http",
                        "tls"
                    ],
                    "routeOnly": false
                },
                "settings": {
                    "auth": "noauth",
                    "udp": true,
                    "allowTransparent": false
                }
            },
            {
                "tag": "http",
                "port": 10809,
                "listen": "127.0.0.1",
                "protocol": "http",
                "sniffing": {
                    "enabled": true,
                    "destOverride": [
                        "http",
                        "tls"
                    ],
                    "routeOnly": false
                },
                "settings": {
                    "auth": "noauth",
                    "udp": true,
                    "allowTransparent": false
                }
            }
        ],
        "outbounds": [
            {
                "tag": "proxy",
                "protocol": "vless",
                "settings": {
                    "vnext": [
                        {
                            "address": randomizedDomain,
                            "port": randomPort,
                            "users": [
                                {
                                    "id": userUUID,
                                    "alterId": 0,
                                    "email": "t@t.tt",
                                    "security": "auto",
                                    "encryption": "none",
                                    "flow": ""
                                }
                            ]
                        }
                    ]
                },
                "streamSettings": {
                    "network": "ws",
                    "security": "tls",
                    "tlsSettings": {
                        "allowInsecure": false,
                        "serverName": randomizedDomain,
                        "alpn": [
                            "h2",
                            "http/1.1"
                        ],
                        "fingerprint": "chrome",
                        "show": false
                    },
                    "wsSettings": {
                        "path": randomPath,
                        "headers": {
                            "Host": randomizedDomain
                        }
                    },
                    "sockopt": {
                        "dialerProxy": "fragment",
                        "tcpKeepAliveIdle": 100,
                        "mark": 255,
                        "tcpNoDelay": true
                    }
                },
                "mux": {
                    "enabled": false,
                    "concurrency": -1
                }
            },
            {
                "tag": "fragment",
                "protocol": "freedom",
                "settings": {
                    "domainStrategy": "AsIs",
                    "fragment": {
                        "packets": "tlshello",
                        "length": "100-200",
                        "interval": "10-20"
                    }
                },
                "streamSettings": {
                    "sockopt": {
                        "tcpNoDelay": true,
                        "tcpKeepAliveIdle": 100
                    }
                }
            },
            {
                "tag": "direct",
                "protocol": "freedom",
                "settings": {}
            },
            {
                "tag": "block",
                "protocol": "blackhole",
                "settings": {
                    "response": {
                        "type": "http"
                    }
                }
            }
        ],
        "routing": {
            "domainStrategy": "AsIs",
            "rules": [
                {
                    "type": "field",
                    "inboundTag": [
                        "api"
                    ],
                    "outboundTag": "api",
                    "enabled": true
                },
                {
                    "id": "5627785659655799759",
                    "type": "field",
                    "port": "0-65535",
                    "outboundTag": "proxy",
                    "enabled": true
                }
            ]
        }
    };

    // Respond with the JSON configuration
    return new Response(JSON.stringify(config), {
        headers: { 'content-type': 'application/json' }
    });
}
