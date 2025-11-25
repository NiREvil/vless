import { connect } from "cloudflare:sockets";

const TTL = 120 * 24 * 60 * 60;
const ORIGINS = [
  "https://smbcryp.github.io",
  "https://v2v-vercel.vercel.app",
  "https://v2v-data.s3-website.ir-thr-at1.arvanstorage.ir",
];

const cors = (o) =>
  ORIGINS.includes(o)
    ? {
        "Access-Control-Allow-Origin": o,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        Vary: "Origin",
      }
    : { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS" };
const json = (d, s, h) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "Content-Type": "application/json", ...h },
  });
const text = (t, c, h, f) =>
  new Response(t, {
    status: 200,
    headers: {
      "Content-Type": `${c}; charset=utf-8`,
      ...(f ? { "Content-Disposition": `attachment; filename="${f}"` } : {}),
      ...h,
    },
  });

const genV2VId = () => {
  const timestamp = Date.now().toString(36);
  const random = Array.from(
    { length: 6 },
    () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)],
  ).join("");
  return `v2v${timestamp}${random}`;
};

const uid = (p, s, i) =>
  `${p}${Math.abs((s + i).split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))
    .toString(36)
    .slice(0, 6)}`;

const b64e = (str) => {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
};

const b64d = (s) => {
  try {
    return atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  } catch {
    return null;
  }
};

const sanitize = (str) =>
  str
    ? String(str)
        .replace(/[^\x20-\x7E]/g, "")
        .trim()
    : "";

const parseVmess = (cfg) => {
  try {
    if (!cfg?.startsWith("vmess://")) return null;
    const d = b64d(cfg.slice(8));
    if (!d) return null;
    const j = JSON.parse(d);
    if (!j.add || !j.port || !j.id) return null;
    return {
      s: j.add,
      p: parseInt(j.port),
      u: j.id,
      a: parseInt(j.aid) || 0,
      c: j.scy || "auto",
      n: j.net || "tcp",
      t: j.tls === "tls",
      sni: j.sni || j.host || j.add,
      path: j.path || "/",
      host: j.host || j.add,
    };
  } catch {
    return null;
  }
};

const parseVless = (cfg) => {
  try {
    if (!cfg?.startsWith("vless://")) return null;
    const u = new URL(cfg);
    if (!u.hostname || !u.port || !u.username) return null;
    const q = new URLSearchParams(u.search);
    return {
      s: u.hostname,
      p: parseInt(u.port),
      u: decodeURIComponent(u.username),
      n: q.get("type") || "tcp",
      t: q.get("security") === "tls",
      sni: q.get("sni") || u.hostname,
      path: decodeURIComponent(q.get("path") || "/"),
      host: q.get("host") || u.hostname,
      flow: q.get("flow") || "",
    };
  } catch {
    return null;
  }
};

const parseTrojan = (cfg) => {
  try {
    if (!cfg?.startsWith("trojan://")) return null;
    const u = new URL(cfg);
    if (!u.hostname || !u.port || !u.username) return null;
    const q = new URLSearchParams(u.search);
    return {
      s: u.hostname,
      p: parseInt(u.port),
      pw: decodeURIComponent(u.username),
      sni: q.get("sni") || u.hostname,
    };
  } catch {
    return null;
  }
};

const parseSs = (cfg) => {
  try {
    if (!cfg?.startsWith("ss://")) return null;
    const u = new URL(cfg);
    if (!u.hostname || !u.port) return null;
    let method, password;
    if (u.password) {
      method = u.username;
      password = u.password;
    } else {
      const d = b64d(u.username);
      if (!d || !d.includes(":")) return null;
      const i = d.indexOf(":");
      method = d.slice(0, i);
      password = d.slice(i + 1);
    }

    return {
      s: u.hostname,
      p: parseInt(u.port),
      m: decodeURIComponent(method), // حذف کاراکترهای درصد دار احتمالی
      pw: decodeURIComponent(password),
    };
  } catch {
    return null;
  }
};

const parseHysteria2 = (cfg) => {
  try {
    if (!cfg?.startsWith("hysteria2://") && !cfg?.startsWith("hy2://")) return null;
    const u = new URL(cfg);
    if (!u.hostname || !u.port) return null;
    const q = new URLSearchParams(u.search);

    const rawPassword = u.username || q.get("password") || q.get("auth") || "";

    return {
      s: u.hostname,
      p: parseInt(u.port),
      pw: decodeURIComponent(rawPassword),
      sni: q.get("sni") || u.hostname,
      obfs: q.get("obfs") || null,
      obfsPw: q.get("obfs-password") || "",
    };
  } catch {
    return null;
  }
};

const parseTuic = (cfg) => {
  try {
    if (!cfg?.startsWith("tuic://")) return null;
    const u = new URL(cfg);
    if (!u.hostname || !u.port) return null;
    const q = new URLSearchParams(u.search);

    let uuid = u.username;
    let password = u.password;

    if (!password && uuid && uuid.includes(":")) {
      [uuid, password] = uuid.split(":", 2);
    }

    if (!uuid) uuid = q.get("uuid") || q.get("user") || "";
    if (!password) password = q.get("password") || q.get("pass") || "";

    return {
      s: u.hostname,
      p: parseInt(u.port),
      u: decodeURIComponent(uuid),
      pw: decodeURIComponent(password),
      sni: q.get("sni") || u.hostname,
      cc: q.get("congestion_control") || "bbr",
      alpn: q.get("alpn") || "h3",
    };
  } catch {
    return null;
  }
};

const genXraySubscription = (cfgs) => {
  const valid = [];
  const seen = new Set();
  for (const cfg of cfgs) {
    try {
      const u = new URL(cfg);
      const k = `${u.protocol}//${u.hostname}:${u.port}:${u.username}`;
      if (!seen.has(k) && ["vmess:", "vless:", "trojan:", "ss:"].includes(u.protocol)) {
        seen.add(k);
        valid.push(cfg);
      }
    } catch {}
  }
  return b64e(valid.join("\n"));
};

const genSingboxSubscription = (cfgs) => {
  const out = [];
  const seen = new Set();

  for (let i = 0; i < cfgs.length; i++) {
    try {
      let o = null;
      let k = null;

      if (cfgs[i].startsWith("vmess://")) {
        const v = parseVmess(cfgs[i]);
        if (!v) continue;
        k = `vm${v.s}${v.p}${v.u}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("vm", v.s, i),
          type: "vmess",
          server: sanitize(v.s),
          server_port: v.p,
          uuid: sanitize(v.u),
          alter_id: v.a,
          security: sanitize(v.c),
        };
        if (v.n === "ws") {
          o.transport = {
            type: "ws",
            path: sanitize(v.path),
            headers: { Host: sanitize(v.host) },
          };
        }
        if (v.t) {
          o.tls = {
            enabled: true,
            server_name: sanitize(v.sni),
            insecure: true,
          };
        }
      } else if (cfgs[i].startsWith("vless://")) {
        const v = parseVless(cfgs[i]);
        if (!v) continue;
        k = `vl${v.s}${v.p}${v.u}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("vl", v.s, i),
          type: "vless",
          server: sanitize(v.s),
          server_port: v.p,
          uuid: sanitize(v.u),
        };
        if (v.n === "ws") {
          o.transport = {
            type: "ws",
            path: sanitize(v.path),
            headers: { Host: sanitize(v.host) },
          };
        }
        if (v.t) {
          o.tls = {
            enabled: true,
            server_name: sanitize(v.sni),
            insecure: true,
          };
          if (v.flow) o.flow = sanitize(v.flow);
        }
      } else if (cfgs[i].startsWith("trojan://")) {
        const v = parseTrojan(cfgs[i]);
        if (!v) continue;
        k = `tr${v.s}${v.p}${v.pw}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("tr", v.s, i),
          type: "trojan",
          server: sanitize(v.s),
          server_port: v.p,
          password: sanitize(v.pw),
          tls: {
            enabled: true,
            server_name: sanitize(v.sni),
            insecure: true,
          },
        };
      } else if (cfgs[i].startsWith("ss://")) {
        const v = parseSs(cfgs[i]);
        if (!v) continue;
        k = `ss${v.s}${v.p}${v.m}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("ss", v.s, i),
          type: "shadowsocks",
          server: sanitize(v.s),
          server_port: v.p,
          method: sanitize(v.m),
          password: sanitize(v.pw),
        };
      } else if (cfgs[i].startsWith("hysteria2://") || cfgs[i].startsWith("hy2://")) {
        const v = parseHysteria2(cfgs[i]);
        if (!v) continue;
        k = `hy2${v.s}${v.p}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("hy2", v.s, i),
          type: "hysteria2",
          server: sanitize(v.s),
          server_port: v.p,
          password: sanitize(v.pw),
          tls: {
            enabled: true,
            server_name: sanitize(v.sni),
            insecure: true,
          },
        };
        if (v.obfs) {
          o.obfs = {
            type: v.obfs,
            password: sanitize(v.obfsPw),
          };
        }
      } else if (cfgs[i].startsWith("tuic://")) {
        const v = parseTuic(cfgs[i]);
        if (!v || !v.u) continue;
        k = `tuic${v.s}${v.p}${v.u}`;
        if (seen.has(k)) continue;
        o = {
          tag: uid("tuic", v.s, i),
          type: "tuic",
          server: sanitize(v.s),
          server_port: v.p,
          uuid: sanitize(v.u),
          password: sanitize(v.pw),
          congestion_control: v.cc,
          udp_relay_mode: "native",
          tls: {
            enabled: true,
            server_name: sanitize(v.sni),
            insecure: true,
            alpn: [v.alpn],
          },
        };
      }

      if (o && k) {
        seen.add(k);
        out.push(o);
      }
    } catch {}
  }

  if (!out.length) return null;
  const tags = out.map((x) => x.tag);

  return JSON.stringify(
    {
      log: {
        level: "error",
        timestamp: true,
      },
      dns: {
        servers: [
          {
            type: "tcp",
            tag: "direct-dns",
            server: "8.8.8.8",
          },
          {
            type: "tcp",
            tag: "proxy-dns",
            detour: "select",
            server: "8.8.8.8",
          },
          {
            type: "local",
            tag: "local-dns",
            detour: "direct",
          },
        ],
        rules: [
          { clash_mode: "Global", server: "proxy-dns" },
          {
            source_ip_cidr: ["172.19.0.0/30", "fdfe:dcba:9876::1/126"],
            server: "direct-dns",
          },
          { clash_mode: "Direct", server: "direct-dns" },
          {
            rule_set: ["geosite-ir", "geoip-ir"],
            server: "direct-dns",
          },
          { domain_suffix: ".ir", server: "direct-dns" },
        ],
        final: "local-dns",
        strategy: "prefer_ipv4",
        independent_cache: true,
      },
      inbounds: [
        {
          type: "tun",
          tag: "tun-in",
          mtu: 9000,
          address: ["172.19.0.1/30", "fdfe:dcba:9876::1/126"],
          auto_route: true,
          stack: "system",
          platform: {
            http_proxy: {
              enabled: true,
              server: "127.0.0.1",
              server_port: 2080,
            },
          },
        },
        {
          type: "mixed",
          listen: "127.0.0.1",
          listen_port: 2080,
        },
      ],
      outbounds: [
        {
          type: "selector",
          tag: "select",
          outbounds: ["auto", "direct", ...tags],
          default: "auto",
        },
        {
          type: "urltest",
          tag: "auto",
          outbounds: tags,
          url: "http://www.gstatic.com/generate_204",
          interval: "10m",
          tolerance: 50,
        },
        ...out,
        { type: "direct", tag: "direct" },
        { type: "block", tag: "block" },
      ],
      route: {
        rules: [
          { action: "sniff" },
          { clash_mode: "Direct", outbound: "direct" },
          { clash_mode: "Global", outbound: "select" },
          { protocol: "dns", action: "hijack-dns" },
          {
            rule_set: ["geoip-private", "geosite-private", "geosite-ir", "geoip-ir"],
            outbound: "direct",
          },
          {
            rule_set: "geosite-ads",
            action: "reject",
          },
        ],
        rule_set: [
          {
            type: "remote",
            tag: "geosite-ads",
            url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ads-all.srs",
            download_detour: "direct",
          },
          {
            type: "remote",
            tag: "geosite-private",
            url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/private.srs",
            download_detour: "direct",
          },
          {
            type: "remote",
            tag: "geosite-ir",
            url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geosite/category-ir.srs",
            download_detour: "direct",
          },
          {
            type: "remote",
            tag: "geoip-private",
            url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/private.srs",
            download_detour: "direct",
          },
          {
            type: "remote",
            tag: "geoip-ir",
            url: "https://testingcf.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@sing/geo/geoip/ir.srs",
            download_detour: "direct",
          },
        ],
        final: "select",
        auto_detect_interface: true,
        default_domain_resolver: "local-dns",
      },
    },
    null,
    2,
  );
};

const genClashConfig = (cfgs) => {
  const prx = [];
  const seen = new Set();

  for (let i = 0; i < cfgs.length; i++) {
    try {
      let p = null;
      let k = null;

      if (cfgs[i].startsWith("vmess://")) {
        const v = parseVmess(cfgs[i]);
        if (!v) continue;
        k = `vm${v.s}${v.p}${v.u}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("vm", v.s, i),
          type: "vmess",
          server: sanitize(v.s),
          port: v.p,
          uuid: sanitize(v.u),
          alterId: v.a,
          cipher: sanitize(v.c),
          udp: true,
          "skip-cert-verify": true,
        };
        if (v.n === "ws") {
          p.network = "ws";
          p["ws-opts"] = { path: sanitize(v.path), headers: { Host: sanitize(v.host) } };
        }
        if (v.t) {
          p.tls = true;
          p.servername = sanitize(v.sni);
        }
      } else if (cfgs[i].startsWith("vless://")) {
        const v = parseVless(cfgs[i]);
        if (!v) continue;
        k = `vl${v.s}${v.p}${v.u}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("vl", v.s, i),
          type: "vless",
          server: sanitize(v.s),
          port: v.p,
          uuid: sanitize(v.u),
          udp: true,
          "skip-cert-verify": true,
        };
        if (v.n === "ws") {
          p.network = "ws";
          p["ws-opts"] = { path: sanitize(v.path), headers: { Host: sanitize(v.host) } };
        } else if (v.n === "grpc") {
          p.network = "grpc";
          p["grpc-opts"] = { "grpc-service-name": sanitize(v.path) };
        }
        if (v.sec === "tls" || v.sec === "reality") {
          p.tls = true;
          p.servername = sanitize(v.sni);
          if (v.flow && v.flow.includes("vision")) p.flow = "xtls-rprx-vision";
          if (v.sec === "reality") {
            p["client-fingerprint"] = v.fp;
            p["reality-opts"] = { "public-key": v.pbk, "short-id": v.sid };
          }
        }
      } else if (cfgs[i].startsWith("trojan://")) {
        const v = parseTrojan(cfgs[i]);
        if (!v) continue;
        k = `tr${v.s}${v.p}${v.pw}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("tr", v.s, i),
          type: "trojan",
          server: sanitize(v.s),
          port: v.p,
          password: sanitize(v.pw),
          udp: true,
          sni: sanitize(v.sni),
          "skip-cert-verify": true,
        };
      } else if (cfgs[i].startsWith("ss://")) {
        const v = parseSs(cfgs[i]);
        if (!v) continue;
        k = `ss${v.s}${v.p}${v.m}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("ss", v.s, i),
          type: "ss",
          server: sanitize(v.s),
          port: v.p,
          cipher: sanitize(v.m),
          password: sanitize(v.pw),
          udp: true,
        };
      } else if (cfgs[i].startsWith("hysteria2://") || cfgs[i].startsWith("hy2://")) {
        const v = parseHysteria2(cfgs[i]);
        if (!v) continue;
        k = `hy2${v.s}${v.p}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("hy2", v.s, i),
          type: "hysteria2",
          server: sanitize(v.s),
          port: v.p,
          password: sanitize(v.pw),
          sni: sanitize(v.sni),
          "skip-cert-verify": true,
        };
        if (v.obfs) {
          p.obfs = v.obfs;
          p["obfs-password"] = v.obfsPw;
        }
      } else if (cfgs[i].startsWith("tuic://")) {
        const v = parseTuic(cfgs[i]);
        if (!v) continue;
        k = `tuic${v.s}${v.p}`;
        if (seen.has(k)) continue;
        p = {
          name: uid("tuic", v.s, i),
          type: "tuic",
          server: sanitize(v.s),
          port: v.p,
          uuid: sanitize(v.u),
          password: sanitize(v.pw),
          "server-name": sanitize(v.sni),
          "congestion-controller": v.cc,
          "udp-relay-mode": "native",
          "skip-cert-verify": true,
          "disable-sni": false,
          alpn: [v.alpn],
        };
      }

      if (p && k) {
        seen.add(k);
        prx.push(p);
      }
    } catch {}
  }

  if (!prx.length) return null;
  const names = prx.map((x) => x.name);

  let y = `mixed-port: 7890
http-port: 7891
socks-port: 7892
ipv6: true
allow-lan: true
mode: rule
log-level: warning
disable-keep-alive: false
keep-alive-idle: 10
keep-alive-interval: 15
unified-delay: true
geo-auto-update: true
external-controller: 127.0.0.1:9090
external-ui-url: https://github.com/MetaCubeX/metacubexd/archive/refs/heads/gh-pages.zip
external-ui: ui
external-controller-cors:
  allow-origins:
    - '*'
  allow-private-network: true
profile:
  store-selected: true
  store-fake-ip: true
dns:
  enable: true
  listen: 0.0.0.0:1053
  ipv6: true
  respect-rules: true
  use-system-hosts: false
  nameserver:
    - https://8.8.8.8/dns-query#⚪ REvil
    - https://208.67.222.222/dns-query
  proxy-server-nameserver:
    - 8.8.8.8#DIRECT
  nameserver-policy:
    raw.githubusercontent.com: 8.8.8.8#DIRECT
    time.apple.com: 8.8.8.8#DIRECT
    www.gstatic.com: system
    rule-set:ir:
      - 8.8.8.8#DIRECT
  fallback:
    - tls://1.1.1.1
    - tcp://8.8.8.8
    - tls://dns.quad9.net
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  fake-ip-filter:
    - geosite:private
tun:
  enable: true
  stack: system
  auto-route: true
  strict-route: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
    - tcp://any:53
  mtu: 9000
sniffer:
  enable: true
  force-dns-mapping: true
  parse-pure-ip: true
  override-destination: false
  sniff:
    HTTP:
      ports:
        - 80
        - 8080
        - 8880
        - 2052
        - 2082
        - 2086
        - 2095
    TLS:
      ports:
        - 443
        - 8443
        - 2053
        - 2083
        - 2087
        - 2096
proxies:
`;

  for (const x of prx) {
    y += `  - name: "${x.name}"\n`;
    y += `    type: ${x.type}\n`;
    y += `    server: ${x.server}\n`;
    y += `    port: ${x.port}\n`;
    y += `    udp: true\n`;
    y += `    skip-cert-verify: true\n`;

    for (const [key, value] of Object.entries(x)) {
      if (["name", "type", "server", "port", "udp", "skip-cert-verify"].includes(key)) continue;
      if (typeof value === "object" && !Array.isArray(value)) {
        y += `    ${key}:\n`;
        for (const [k, v] of Object.entries(value)) y += `      ${k}: ${v}\n`;
      } else if (Array.isArray(value)) {
        y += `    ${key}: [${value.join(", ")}]\n`;
      } else {
        y += `    ${key}: ${value}\n`;
      }
    }
  }

  y += `
proxy-groups:
  - name: ⚪ REvil
    type: select
    proxies:
      - 🟢 AUTO
      - DIRECT
`;
  for (const name of names) y += `      - "${name}"\n`;

  y += `
  - name: 🟢 AUTO
    type: url-test
    url: https://www.gstatic.com/generate_204
    interval: 180
    tolerance: 50
    proxies:
`;
  for (const name of names) y += `      - "${name}"\n`;

  y += `
rule-providers:
  phishing:
    type: http
    format: text
    behavior: domain
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/phishing.txt"
    path: ./ruleset/phishing.txt
    interval: 86400
  malware:
    type: http
    format: text
    behavior: domain
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/malware.txt"
    path: ./ruleset/malware.txt
    interval: 86400
  cryptominers:
    type: http
    format: text
    behavior: domain
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/cryptominers.txt"
    path: ./ruleset/cryptominers.txt
    interval: 86400
  category-ads-all:
    type: http
    format: text
    behavior: domain
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/category-ads-all.txt"
    path: ./ruleset/category-ads-all.txt
    interval: 86400
  private:
    type: http
    format: yaml
    behavior: domain
    url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.yaml"
    path: ./ruleset/private.yaml
    interval: 86400
  private-cidr:
    type: http
    format: yaml
    behavior: ipcidr
    url: "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/private.yaml"
    path: ./ruleset/private-cidr.yaml
    interval: 86400
  ir:
    type: http
    format: text
    behavior: domain
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ir.txt"
    path: ./ruleset/ir.txt
    interval: 86400
  ir-cidr:
    type: http
    format: text
    behavior: ipcidr
    url: "https://raw.githubusercontent.com/Chocolate4U/Iran-clash-rules/release/ircidr.txt"
    path: ./ruleset/ir-cidr.txt
    interval: 86400
rules:
  - RULE-SET,phishing,REJECT
  - RULE-SET,malware,REJECT
  - RULE-SET,cryptominers,REJECT
  - RULE-SET,category-ads-all,REJECT
  - RULE-SET,private,DIRECT
  - RULE-SET,private-cidr,DIRECT
  - RULE-SET,ir,DIRECT
  - RULE-SET,ir-cidr,DIRECT
  - MATCH,⚪ REvil
ntp:
  enable: true
  server: time.apple.com
  port: 123
  interval: 30
`;
  return y;
};

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const o = req.headers.get("Origin");
    const h = cors(o);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    try {
      if (u.pathname === "/" && req.method === "GET") {
        return json(
          {
            status: "V2V Pro v13 - Complete & Fast",
            signature: "V2V Signature System Active",
            features: [
              "Client-Side Real Testing",
              "All Protocols Support (VMess, VLESS, Trojan, SS, Hy2, TUIC)",
              "Smart Deduplication",
              "Zero Errors Guaranteed",
              "Batch Processing 50x",
              "UUID V2V Signature",
            ],
            endpoints: {
              xray: "/sub/xray/{id}",
              "xray-clash": "/sub/xray-clash/{id}",
              singbox: "/sub/singbox/{id}",
              "singbox-clash": "/sub/singbox-clash/{id}",
            },
          },
          200,
          h,
        );
      }
      if (u.pathname === "/create-sub" && req.method === "POST") {
        const { configs, format } = await req.json();
        if (!Array.isArray(configs) || !configs.length) {
          return json({ error: "Invalid configs array" }, 400, h);
        }
        const validFormats = ["xray", "xray-clash", "singbox", "singbox-clash"];
        if (!validFormats.includes(format)) {
          return json({ error: `Invalid format. Valid: ${validFormats.join(", ")}` }, 400, h);
        }
        const id = genV2VId();
        await env.v2v_kv.put(
          `sub:${id}`,
          JSON.stringify({ configs, format, created: Date.now() }),
          { expirationTtl: TTL },
        );
        return json(
          {
            success: true,
            id,
            url: `${u.origin}/sub/${format}/${id}`,
            total_configs: configs.length,
            expires_in_days: 120,
          },
          200,
          h,
        );
      }
      const m = u.pathname.match(
        /^\/sub\/(xray|xray-clash|singbox|singbox-clash)\/(v2v[a-z0-9]+)$/,
      );
      if (m && req.method === "GET") {
        const [, fmt, id] = m;
        const d = await env.v2v_kv.get(`sub:${id}`, { type: "json" });
        if (!d?.configs) {
          return new Response("Subscription not found or expired", { status: 404, headers: h });
        }
        const { configs } = d;
        if (fmt === "xray") {
          const content = genXraySubscription(configs);
          return text(content, "text/plain", h, `V2V-Xray-${id}.txt`);
        }
        if (fmt === "xray-clash") {
          const content = genClashConfig(configs);
          if (!content) return json({ error: "No valid configs" }, 500, h);
          return text(content, "text/yaml", h, `V2V-Xray-Clash-${id}.yaml`);
        }
        if (fmt === "singbox") {
          const content = genSingboxSubscription(configs);
          if (!content) return json({ error: "No valid configs" }, 500, h);
          return text(content, "application/json", h, `V2V-Singbox-${id}.json`);
        }
        if (fmt === "singbox-clash") {
          const content = genClashConfig(configs);
          if (!content) return json({ error: "No valid configs" }, 500, h);
          return text(content, "text/yaml", h, `V2V-Singbox-Clash-${id}.yaml`);
        }
      }
      return new Response("Not Found", { status: 404, headers: h });
    } catch (e) {
      console.error("Worker Error:", e);
      return json({ error: e.message, stack: e.stack }, 500, h);
    }
  },
};
