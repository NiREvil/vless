/**
 * RND FRAGMENT
 * A proxy configuration with the fragment technique using variable parameters.
 * - Last Update: Thu, November 20, 2025, 04:20 UTC.
 *   https://github.com/NiREvil/vless/blob/main/edge/Fragment.js
 * - This vless-ws-tls configuration is fragmented and replaces parameters such as:
 *   Domain, host/ip, port, sni, uuid, path, fingerprints, alpn & etc with the values set by us after each update within the client.
 *
 * REPLACEMENT
 * Replace the default code values with the actual values from your configuration:
 * - Replace the default hostname in line 44 with your own.
 * - While the UUID is in line 45.
 * - You can place a clean Cloudflare domain or IP in line 46 (a domain is recommended).
 * - You can change the default values of the fragment according to your needs based on your internet connection,
 *   From lines 167, 168, and 169.
 */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

// Utility functions
function selectRandomItem(/** @type {string | any[]} */ items) {
  return items[Math.floor(Math.random() * items.length)];
}
function generateRandomString(/** @type {number} */ length, characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function randomizeCase(/** @type {string} */ str) {
  return str.split('').map((/** @type {string} */ char) => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()).join('');
}

/**
 * Main handler function
 * @param {Request<unknown, CfProperties<unknown>>} _request
 */
async function handleRequest(_request) {
  const portsList = [443, 8443, 2053, 2083, 2087, 2096]; // Standard cloudflare TLS ports
  const domain = "zizifn-ewm.pages.dev"; // Specify the hostname of your VLESS configuration.
  const userUUID = "9ff85896-3d34-4560-a1f0-5dc5b127fb00"; // Specify the UUID of your VLESS configuration.
  const bestip = "creativecommons.org"; // Preferred cloudflare clean IPv4/IPv6 addresses or Domain.

  // Randomized constants
  const randomPort = selectRandomItem(portsList);
  const randomizedDomain = randomizeCase(domain);
  const randomPath = "/" + generateRandomString(24) + "?ed=2560"; // Path with 24 random characters (/24 rnd characters + Early data params).

  // Configuration object
  const config = {
    remarks: "🎈 RND fragment", // Specify the config name
    log: {
      loglevel: "warning",
    },
    dns: {
      hosts: {
        "domain:googleapis.cn": ["googleapis.com"],
        "dns.google": [
          "8.8.4.4",
          "8.8.8.8",
          "2001:4860:4860::8888",
          "2001:4860:4860::8844",
        ],
      },
      servers: [
        "https://dns.google/dns-query",
        {
          address: "8.8.8.8",
          domains: ["full:www.speedtest.net"],
        },
      ],
      tag: "dns",
    },
    inbounds: [
      {
        port: 10808,
        protocol: "socks",
        settings: {
          auth: "noauth",
          udp: true,
          userLevel: 8,
        },
        sniffing: {
          destOverride: ["http", "tls"],
          enabled: true,
          routeOnly: true,
        },
        tag: "socks-in",
      },
      {
        port: 10809,
        protocol: "http",
        settings: {
          auth: "noauth",
          udp: true,
          userLevel: 8,
        },
        sniffing: {
          destOverride: ["http", "tls"],
          enabled: true,
          routeOnly: true,
        },
        tag: "http-in",
      },
      {
        listen: "127.0.0.1",
        port: 10853,
        protocol: "dokodemo-door",
        settings: {
          address: "1.1.1.1",
          network: "tcp,udp",
          port: 53,
        },
        tag: "dns-in",
      },
    ],
    outbounds: [
      {
        protocol: "vless",
        settings: {
          vnext: [
            {
              address: bestip,
              port: randomPort,
              users: [
                {
                  id: userUUID,
                  encryption: "none",
                  level: 8,
                },
              ],
            },
          ],
        },
        streamSettings: {
          network: "ws",
          security: "tls",
          sockopt: {
            dialerProxy: "fragment",
          },
          wsSettings: {
            headers: {
              Host: randomizedDomain,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            },
            path: randomPath,
          },
          tlsSettings: {
            allowInsecure: true,
            fingerprint: "chrome", // Client fingerprint (currently only chrome works reliably)
            alpn: ["http/1.1"], // Application-layer protocol negotiation (websocket only support http/1.1)
            serverName: randomizedDomain,
          },
        },
        tag: "proxy",
      },
      {
        tag: "fragment",
        protocol: "freedom",
        settings: {
          fragment: {
            packets: "tlshello", // "tlshello" or "1-1" or"1-2" or "1-3" or maximum "1-5",
            length: "1403", // "10-20" or "10-30" or "100-200" or maximum "1500",
            interval: "1", // "1-2" or "1-3" or "2-4" or maximum "10",
          },
        },
        streamSettings: {
          sockopt: {
            tcpKeepAliveIdle: 100,
            tcpNoDelay: true,
          },
        },
      },
      {
        protocol: "dns",
        tag: "dns-out",
      },
      {
        protocol: "freedom",
        settings: {},
        tag: "direct",
      },
      {
        protocol: "blackhole",
        settings: {
          response: {
            type: "http",
          },
        },
        tag: "block",
      },
    ],
    policy: {
      levels: {
        8: {
          connIdle: 300,
          downlinkOnly: 1,
          handshake: 4,
          uplinkOnly: 1,
        },
      },
      system: {
        statsOutboundUplink: true,
        statsOutboundDownlink: true,
      },
    },
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        {
          ip: ["8.8.8.8"],
          outboundTag: "direct",
          port: "53",
          type: "field",
        },
        {
          inboundTag: ["socks-in", "http-in"],
          type: "field",
          port: "53",
          outboundTag: "dns-out",
          enabled: true,
        },
        {
          outboundTag: "proxy",
          type: "field",
          network: "tcp,udp",
        },
      ],
    },
    stats: {},
  };
  // Respond with the JSON configuration in pretty printed format
  return new Response(JSON.stringify(config, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });
}
