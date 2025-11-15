/**
 * Last update: Monday, 4:20 UTC, 6 January 2025  ----We are all REvil----
 * - The subscription link contains a v2ray fragmented configuration with random parameters created in cf Workers.
 * - Replace these lines with your hostname & uuid, Hostname in line (28), UUID in lines (29), and in the line of (30) you can add your preferred cf clean ip addresses ;)
 * - Fragment values can be changed from (151-152-153).
 */

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

// Utility functions
const selectRandomItem = (items) => items[Math.floor(Math.random() * items.length)];
const generateRandomString = (
  length,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
) => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const randomizeCase = (str) =>
  str
    .split("")
    .map((char) => (Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase()))
    .join("");

// Main handler function
async function handleRequest(request) {
  // Constants
  const portsList = [443, 8443, 2053, 2096, 2087, 2083]; // Preferred TLS Ports of cloudflare.
  const domain = "rr-ff.pages.dev"; // Specify the hostname of your VLESS configuration.
  const userUUID = "048ce287-6a7b-4dad-98fe-b5f3f6789b57"; // Specify the UUID of your VLESS configuration.
  const bestip = "creativecommons.org"; // Preferred cloudflare clean IPv4/IPv6 addresses.

  // Randomized constants
  const randomPort = selectRandomItem(portsList);
  const randomizedDomain = randomizeCase(domain);
  const randomPath = "/assets/" + generateRandomString(24) + "?ed=2560"; // Preferred path

  // Configuration object
  const config = {
    remarks: "rnd fragment", // Specify the config name
    log: {
      loglevel: "warning",
    },
    dns: {
      hosts: {
        "domain:googleapis.cn": ["googleapis.com"],
        "dns.google": ["8.8.4.4", "8.8.8.8", "2001:4860:4860::8888", "2001:4860:4860::8844"],
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
            allowInsecure: false,
            fingerprint: "chrome", // Preferred fingeprint, is better to use chrome, firefox, safari.
            alpn: ["h2", "http/1.1"],
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
            packets: "1-1", // "1-2"      Or  "1-5"    Or  "tlshello"
            length: "1403", // "100-200"  Or  "10-30"  Or  "100-200"
            interval: "1", // "1-2"      Or  "1-3"    Or  "2-4"
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
