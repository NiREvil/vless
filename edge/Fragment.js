/**
 * Last update: Tuesday, 4:20 UTC, 4 Aug 2026
 * - VLESS fragment config generator (Cypher-style) using dual-layer finalmask fragmentation + unsafe fingerprint + custom cipherSuites.
 * - Replace DEFAULT_HOSTNAME, DEFAULT_UUID, and CLEAN_ADDRESSES with your own Worker hostname, UUID, and preferred Cloudflare clean IP/domain,
 *   Also you can add Environment variables with: VLESS_CLEAN_ADDRESS, VLESS_PORT, VLESS_WS_PATH, VLESS_HOSTNAME, VLESS_UUID, VLESS_REMARKS
 * - Fragment layers are tuned per patterniha's config; adjust lengths/delays/maxSplit in finalmask.tcp if DPI patterns change.
 * - Requires xray-core with finalmask support — test against your client's core version before deploying.
 */

// Default / fallback values
const DEFAULT_HOSTNAME = "in-god-we-trust.mathematical.workers.dev";
const DEFAULT_UUID = "c84b1d08-1e9e-4e1c-977a-c7fff6ccb8ec";
const DEFAULT_REMARKS = "Cypherand";

const CLEAN_ADDRESSES = [
  "npmjs.com",
  "www.gitbook.com",
  "auth.vercel.com",
  "chat.openai.com",
  "www.udacity.com",
  "www.speedtest.net",
  "sky.rethinkdns.com",
  "creativecommons.org",
  "static.cloudflareinsights.com",
];

const PORTS = [443, 8443, 2053, 2096, 2087, 2083];

// Randomization flags
const RANDOMIZE_SERVER_NAME_CASE = true;

// TLS cipher suites from patternihas serverless conf
const CIPHER_SUITES =
  "TLS_AES_256_GCM_SHA384:" +
  "TLS_CHACHA20_POLY1305_SHA256:" +
  "TLS_AES_128_GCM_SHA256:" +
  "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384:" +
  "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384:" +
  "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256:" +
  "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256:" +
  "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256:" +
  "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256:" +
  "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA:" +
  "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA:" +
  "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256:" +
  "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256";

const DNS_HOSTS = {
  "domain:googleapis.cn": "googleapis.com",
  "dns.alidns.com": ["223.5.5.5", "223.6.6.6", "2400:3200::1", "2400:3200:baba::1"],
  "dns.sse.cisco.com": ["208.67.220.220", "208.67.222.222", "2620:119:35::35", "2620:119:53::53"],
  "dns.umbrella.com": ["208.67.220.220", "208.67.222.222", "2620:119:35::35", "2620:119:53::53"],
  "one.one.one.one": ["1.1.1.1", "1.0.0.1", "2606:4700:4700::1111", "2606:4700:4700::1001"],
  "1dot1dot1dot1.cloudflare-dns.com": [
    "1.1.1.1",
    "1.0.0.1",
    "2606:4700:4700::1111",
    "2606:4700:4700::1001",
  ],
  "dns.cloudflare.com": ["162.159.61.8", "172.64.41.8", "2a06:98c1:52::8", "2803:f800:53::8"],
  "cloudflare-dns.com": [
    "104.16.248.249",
    "104.16.249.249",
    "2606:4700::6810:f8f9",
    "2606:4700::6810:f9f9",
  ],
  "engage.cloudflareclient.com": ["162.159.192.1", "2606:4700:d0::a29f:c001"],
  "doh.pub": ["1.12.12.12", "120.53.53.53"],
  "dot.pub": ["1.12.12.12", "120.53.53.53"],
  "dns.google": ["8.8.8.8", "8.8.4.4", "2001:4860:4860::8888", "2001:4860:4860::8844"],
  "dns.quad9.net": ["9.9.9.9", "149.112.112.112", "2620:fe::fe", "2620:fe::9"],
  "dns.sb": ["45.11.45.11", "185.222.222.222", "2a09::", "2a11::"],
  "common.dot.dns.yandex.net": [
    "77.88.8.8",
    "77.88.8.1",
    "2a02:6b8::feed:0ff",
    "2a02:6b8:0:1::feed:0ff",
  ],
  "npmjs.com": ["104.17.134.117", "104.17.135.117"],
};

function selectRandomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomString(length) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i += 1) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

function randomizeCase(value) {
  return String(value)
    .split("")
    .map((ch) => {
      if (ch >= "a" && ch <= "z") {
        return Math.random() < 0.5 ? ch.toUpperCase() : ch;
      }
      if (ch >= "A" && ch <= "Z") {
        return Math.random() < 0.5 ? ch.toLowerCase() : ch;
      }
      return ch;
    })
    .join("");
}

function generateWsPath() {
  return "/vl/" + randomString(16) + "?ed=2560";
}

function resolveWsPath(env) {
  if (typeof env.VLESS_WS_PATH === "string" && env.VLESS_WS_PATH.trim() !== "") {
    return env.VLESS_WS_PATH.trim();
  }
  return generateWsPath();
}

function buildConfig(env) {
  env = env || {};

  const hostname = String(env.VLESS_HOSTNAME || DEFAULT_HOSTNAME)
    .trim()
    .toLowerCase();
  const uuid = String(env.VLESS_UUID || DEFAULT_UUID).trim();

  const address = String(env.VLESS_CLEAN_ADDRESS || selectRandomItem(CLEAN_ADDRESSES)).trim();

  const rawPort = Number(env.VLESS_PORT || selectRandomItem(PORTS));
  const port =
    Number.isFinite(rawPort) && rawPort > 0 && rawPort <= 65535 ? Math.floor(rawPort) : 443;

  const wsPath = resolveWsPath(env);
  const remarks = String(env.VLESS_REMARKS || DEFAULT_REMARKS).trim() || DEFAULT_REMARKS;

  if (!hostname) throw new Error("Hostname is empty.");
  if (!uuid) throw new Error("UUID is empty.");
  if (!address) throw new Error("Clean address is empty.");

  const serverName = RANDOMIZE_SERVER_NAME_CASE ? randomizeCase(hostname) : hostname;

  const tlsSettings = {
    allowInsecure: false,
    alpn: ["http/1.1"],
    cipherSuites: CIPHER_SUITES,
    fingerprint: "unsafe",
    serverName: serverName,
  };

  return {
    remarks: remarks,
    log: { loglevel: "none" },
    dns: {
      hosts: DNS_HOSTS,
      servers: ["https://cloudflare-dns.com/dns-query"],
      tag: "dns-module",
    },
    inbounds: [
      {
        listen: "127.0.0.1",
        port: 10808,
        protocol: "socks",
        settings: { auth: "noauth", udp: true, userLevel: 8 },
        sniffing: {
          destOverride: ["http", "tls", "quic"],
          enabled: true,
          routeOnly: false,
        },
        tag: "socks",
      },
      {
        listen: "127.0.0.1",
        port: 10809,
        protocol: "http",
        settings: { userLevel: 8 },
        sniffing: {
          destOverride: ["http", "tls", "quic"],
          enabled: true,
          routeOnly: false,
        },
        tag: "http",
      },
    ],
    outbounds: [
      {
        mux: { concurrency: -1, enabled: false },
        protocol: "vless",
        settings: {
          address: address,
          encryption: "none",
          flow: "",
          id: uuid,
          level: 8,
          port: port,
        },
        streamSettings: {
          finalmask: {
            tcp: [
              {
                type: "fragment",
                settings: {
                  packets: "tlshello",
                  lengths: ["5", "94", "1"],
                  delays: ["0"],
                  maxSplit: "0",
                },
              },
              {
                type: "fragment",
                settings: {
                  packets: "1-1",
                  lengths: ["109", "1"],
                  delays: ["1"],
                  maxSplit: "355",
                },
              },
            ],
          },
          network: "ws",
          security: "tls",
          sockopt: {
            domainStrategy: "UseIP",
            happyEyeballs: {
              interleave: 2,
              maxConcurrentTry: 4,
              prioritizeIPv6: false,
              tryDelayMs: 250,
            },
          },
          tlsSettings: tlsSettings,
          wsSettings: {
            host: hostname,
            path: wsPath,
          },
        },
        tag: "proxy",
      },
      {
        protocol: "freedom",
        streamSettings: {
          network: "tcp",
          sockopt: { domainStrategy: "UseIP" },
        },
        tag: "direct",
      },
      {
        protocol: "blackhole",
        settings: {},
        tag: "block",
      },
    ],
    routing: {
      domainStrategy: "AsIs",
      rules: [
        {
          inboundTag: ["dns-module"],
          outboundTag: "proxy",
          type: "field",
        },
      ],
    },
  };
}

function jsonResponse(body, status) {
  return new Response(body, {
    status: status || 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      "Content-Type": "application/json;charset=utf-8",
    },
  });
}

function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function methodNotAllowedResponse() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "GET, OPTIONS",
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
}

async function handleRequest(request, env) {
  try {
    if (request.method === "OPTIONS") return optionsResponse();
    if (request.method !== "GET") return methodNotAllowedResponse();

    const config = buildConfig(env);
    return jsonResponse(JSON.stringify(config, null, 2), 200);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return jsonResponse(JSON.stringify({ error: "WorkerException", detail: detail }, null, 2), 500);
  }
}

export default { fetch: handleRequest };
