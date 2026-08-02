/**
 * Last update: Sunday, 4:20 UTC, 2 Aug 2026
 * - VLESS fragment config generator (Cypher-style) using dual-layer finalmask fragmentation + unsafe fingerprint + custom cipherSuites.
 * - Replace DOMAIN, USER_UUID, and CLEAN_IP with your own Worker hostname, UUID, and preferred Cloudflare clean IP/domain.
 * - Fragment layers are tuned per patterniha's config; adjust lengths/delays/maxSplit in finalmask.tcp if DPI patterns change.
 * - Requires xray-core with finalmask support — test against your client's core version before deploying.
 */

const PORTS = [443, 8443, 2053, 2096, 2087, 2083];
const DOMAIN = "in-god-we-trust.mathematical.workers.dev";
const USER_UUID = "c84b1d08-1e9e-4e1c-977a-c7fff6ccb8ec";
const CLEAN_IP = "188.114.97.6";
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const CIPHER_SUITES = [
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_AES_128_GCM_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA",
  "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
  "TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256",
].join(":");

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
};

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomString(length) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return out;
}

function randomizeCase(str) {
  return str
    .split("")
    .map((c) => (Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()))
    .join("");
}

function buildDnsHosts() {
  return { ...DNS_HOSTS, [`full:${CLEAN_IP}`]: [CLEAN_IP] };
}

function buildConfig() {
  const port = pickRandom(PORTS);
  const sniHost = randomizeCase(DOMAIN);
  const wsPath = `/vl/${randomString(12)}?ed=2048`;

  return {
    remarks: "Cypherand",
    log: { loglevel: "none" },
    dns: {
      tag: "dns-module",
      hosts: buildDnsHosts(),
      servers: [
        "https://cloudflare-dns.com/dns-query",
        {
          address: "223.5.5.5",
          domains: ["geosite:private"],
          skipFallback: true,
          tag: "domestic-dns_0_0",
        },
        {
          address: "223.5.5.5",
          domains: ["domain:ir", "geosite:category-ir"],
          skipFallback: true,
          tag: "domestic-dns_1_0",
        },
      ],
    },
    inbounds: [
      {
        listen: "127.0.0.1",
        port: 10808,
        protocol: "socks",
        settings: { auth: "noauth", udp: true, userLevel: 8 },
        sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] },
        tag: "socks",
      },
      {
        listen: "127.0.0.1",
        port: 10809,
        protocol: "http",
        settings: { userLevel: 8 },
        sniffing: { enabled: true, routeOnly: false, destOverride: ["http", "tls", "quic"] },
        tag: "http",
      },
    ],
    outbounds: [
      {
        protocol: "vless",
        tag: "proxy",
        mux: { enabled: false, concurrency: -1 },
        settings: {
          address: CLEAN_IP,
          port,
          id: USER_UUID,
          encryption: "none",
          flow: "",
          level: 8,
        },
        streamSettings: {
          network: "ws",
          security: "tls",
          wsSettings: { host: DOMAIN, path: wsPath },
          tlsSettings: {
            allowInsecure: false,
            fingerprint: "unsafe",
            serverName: sniHost,
            alpn: ["http/1.1"],
            cipherSuites: CIPHER_SUITES,
          },
          sockopt: {
            domainStrategy: "UseIP",
            happyEyeballs: {
              tryDelayMs: 250,
              prioritizeIPv6: false,
              interleave: 2,
              maxConcurrentTry: 4,
            },
          },
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
                settings: { packets: "1-1", lengths: ["109", "1"], delays: ["1"], maxSplit: "355" },
              },
            ],
          },
        },
      },
      {
        protocol: "freedom",
        tag: "direct",
        streamSettings: { network: "tcp", sockopt: { domainStrategy: "UseIP" } },
      },
      { protocol: "blackhole", tag: "block", settings: {} },
    ],
    routing: {
      domainStrategy: "IPIfNonMatch",
      rules: [
        { type: "field", network: "udp", port: "443", outboundTag: "block" },
        { type: "field", ip: ["ext:geoip-only-cn-private.dat:private"], outboundTag: "direct" },
        { type: "field", domain: ["geosite:private"], outboundTag: "direct" },
        { type: "field", domain: ["domain:ir", "geosite:category-ir"], outboundTag: "direct" },
        { type: "field", ip: ["geoip:ir"], outboundTag: "direct" },
        {
          type: "field",
          inboundTag: ["domestic-dns_0_0", "domestic-dns_1_0"],
          outboundTag: "direct",
        },
        { type: "field", inboundTag: ["dns-module"], outboundTag: "proxy" },
      ],
    },
  };
}

export default {
  async fetch() {
    try {
      const config = buildConfig();
      return new Response(JSON.stringify(config, null, 2), {
        headers: { "content-type": "application/json;charset=utf-8" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "content-type": "application/json;charset=utf-8" },
      });
    }
  },
};
