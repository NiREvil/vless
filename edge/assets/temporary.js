// @ts-nocheck
import { connect } from "cloudflare:sockets";
import init, { processVlessHeader } from "./pkg/zr_wasm.js";
import wasm from "./pkg/zr_wasm_bg.wasm";

const decodeSecure = (encoded) => atob(encoded);
const HTML_URL = "https://nscl5.github.io/zr/";

const Config = {
  userID: "be0ff9df-1468-41a0-8865-796d1c6800db",
  proxyIPs: ["nima.nscl.ir:443"],
  scamalytics: {
    username: "revilseptember",
    apiKey: "b2fc368184deb3d8ac914bd776b8215fe899dd8fef69fbaba77511acfbdeca0d",
    baseUrl: "https://api12.scamalytics.com/v3/",
  },

  fromEnv(env) {
    const selectedProxyIP =
      env.PROXYIP || this.proxyIPs[Math.floor(Math.random() * this.proxyIPs.length)];
    const [proxyHost, proxyPort = "443"] = selectedProxyIP.split(":");

    return {
      userID: env.UUID || this.userID,
      proxyIP: proxyHost,
      proxyPort: proxyPort,
      proxyAddress: selectedProxyIP,
      scamalytics: {
        username: env.SCAMALYTICS_USERNAME || this.scamalytics.username,
        apiKey: env.SCAMALYTICS_API_KEY || this.scamalytics.apiKey,
        baseUrl: env.SCAMALYTICS_BASEURL || this.scamalytics.baseUrl,
      },
    };
  },
};

async function safeFetch(url, options = {}, timeout = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

const CONST = {
  ED_PARAMS: { ed: 2560, eh: "Sec-WebSocket-Protocol" },
  AT_SYMBOL: "@",
  VLESS_PROTOCOL: decodeSecure("dmxlc3M="),
  WS_READY_STATE_OPEN: 1,
  WS_READY_STATE_CLOSING: 2,
};

function generateRandomPath(length = 28, query = "") {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `/${result}${query ? `?${query}` : ""}`;
}

const CORE_PRESETS = {
  xray: {
    tls: { path: () => generateRandomPath(12, "ed=2048"), security: "tls", fp: "chrome", alpn: "http/1.1", extra: {} },
    tcp: { path: () => generateRandomPath(12, "ed=2560"), security: "none", fp: "chrome", extra: {} },
  },
  sb: {
    tls: { path: () => generateRandomPath(18), security: "tls", fp: "chrome", alpn: "http/1.1", extra: CONST.ED_PARAMS },
    tcp: { path: () => generateRandomPath(18), security: "none", fp: "chrome", extra: CONST.ED_PARAMS },
  },
};

function makeName(tag, proto) {
  return `${tag}-${proto.toUpperCase()}`;
}

function createVlessLink({ userID, address, port, host, path, security, sni, fp, alpn, extra = {}, name }) {
  const params = new URLSearchParams({ type: decodeSecure("d3M="), host, path });
  if (security) {
    params.set("security", security);
  }
  if (sni) params.set("sni", sni);
  if (fp) params.set("fp", fp);
  if (alpn) params.set("alpn", alpn);
  for (const [k, v] of Object.entries(extra)) params.set(k, v);
  return `${CONST.VLESS_PROTOCOL}://${userID}@${address}:${port}?${params.toString()}#${encodeURIComponent(name)}`;
}

function buildLink({ core, proto, userID, hostName, address, port, tag }) {
  const p = CORE_PRESETS[core][proto];
  return createVlessLink({
    userID,
    address,
    port,
    host: hostName,
    path: p.path(),
    security: p.security,
    sni: p.security === "tls" ? hostName : undefined,
    fp: p.fp,
    alpn: p.alpn,
    extra: p.extra,
    name: makeName(tag, proto),
  });
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function handleIpSubscription(request, core, userID, hostName, ctx) {
  const url = new URL(request.url);
  const subName = url.searchParams.get("name");
  const CAKE_INFO = { total_TB: 380, base_GB: 42000, daily_growth_GB: 250, expire_date: "2028-4-20" };

  const mainDomains = [
    hostName, "creativecommons.org", "www.speedtest.net", "sky.rethinkdns.com",
    "chat.openai.com", "cfip.xxxxxxxx.tk", "go.inmobi.com", "singapore.com",
    "www.visa.com", "www.wto.org", "chatgpt.com", "medium.com", "npmjs.com",
    "nodejs.org", "csgo.com", "harbor.io", "linkerd.io", "fbi.gov", "zula.ir"
  ];

  const httpsPorts = [443, 8443, 2053, 2083, 2087, 2096];
  const httpPorts = [80, 8080, 8880, 2052, 2082, 2086, 2095];
  let links = [];
  const isPagesDeployment = hostName.endsWith(".pages.dev");

  mainDomains.forEach((domain, i) => {
    links.push(buildLink({ core, proto: "tls", userID, hostName, address: domain, port: pick(httpsPorts), tag: `Domain${i + 1}` }));
    if (!isPagesDeployment) {
      links.push(buildLink({ core, proto: "tcp", userID, hostName, address: domain, port: pick(httpPorts), tag: `Domain${i + 1}` }));
    }
  });

  try {
    const cache = caches.default;
    const cacheKey = new Request("https://cf-ip-cache.local");
    let response = await cache.match(cacheKey);

    if (!response) {
      const r = await safeFetch("https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json", {}, 4000);
      if (r.ok) {
        response = new Response(await r.text(), { headers: { "Cache-Control": "public, max-age=86400" } });
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }
    }

    if (response) {
      const json = await response.json();
      const ips = [...(json.ipv4 || []), ...(json.ipv6 || [])].slice(0, 20).map((x) => x.ip);
      ips.forEach((ip, i) => {
        const formattedAddress = ip.includes(":") ? `[${ip}]` : ip;
        links.push(buildLink({ core, proto: "tls", userID, hostName, address: formattedAddress, port: pick(httpsPorts), tag: `IP${i + 1}` }));
        if (!isPagesDeployment) {
          links.push(buildLink({ core, proto: "tcp", userID, hostName, address: formattedAddress, port: pick(httpPorts), tag: `IP${i + 1}` }));
        }
      });
    }
  } catch (e) {
    console.error("Cached IP fetch failed", e);
  }

  const GB_in_bytes = 1024 * 1024 * 1024;
  const TB_in_bytes = 1024 * GB_in_bytes;
  const total_bytes = CAKE_INFO.total_TB * TB_in_bytes;
  const base_bytes = CAKE_INFO.base_GB * GB_in_bytes;
  const now = new Date();
  const hours_passed = now.getHours() + now.getMinutes() / 60;
  const daily_growth_bytes = (hours_passed / 24) * (CAKE_INFO.daily_growth_GB * GB_in_bytes);
  const cake_download = base_bytes + daily_growth_bytes / 2;
  const cake_upload = base_bytes + daily_growth_bytes / 2;
  const expire_timestamp = Math.floor(new Date(CAKE_INFO.expire_date).getTime() / 1000);
  const subInfo = `upload=${Math.round(cake_upload)}; download=${Math.round(cake_download)}; total=${total_bytes}; expire=${expire_timestamp}`;

  const headers = { "Content-Type": "text/plain;charset=utf-8", "Profile-Update-Interval": "6", "Subscription-Userinfo": subInfo };
  if (subName) headers["Profile-Title"] = subName;
  return new Response(btoa(links.join("\n")), { headers });
}

async function ProtocolOverWSHandler(request, config) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();

  let address = "";
  let portWithRandomLog = "";
  let udpStreamWriter = null;

  const log = (info, event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
  };

  const earlyDataHeader = request.headers.get("Sec-WebSocket-Protocol") || "";
  const readableWebSocketStream = MakeReadableWebSocketStream(webSocket, earlyDataHeader, log);
  let remoteSocketWapper = { value: null };

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (udpStreamWriter) return udpStreamWriter.write(chunk);
          if (remoteSocketWapper.value) {
            const writer = remoteSocketWapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const header = processVlessHeader(new Uint8Array(chunk), config.userID);
          if (header.has_error) throw new Error(header.message);

          address = header.address_remote;
          portWithRandomLog = `${header.port_remote}--${Math.random()} ${header.is_udp ? "udp" : "tcp"} `;

          const vlessResponseHeader = new Uint8Array([header.version, 0]);
          const rawClientData = chunk.slice(header.raw_data_index);

          if (header.is_udp) {
            if (header.port_remote === 53) {
              const dnsPipeline = await createDnsPipeline(webSocket, vlessResponseHeader, log);
              udpStreamWriter = dnsPipeline.write;
              udpStreamWriter(rawClientData);
            } else {
              throw new Error("UDP proxy is only enabled for DNS (port 53)");
            }
            return;
          }

          HandleTCPOutBound(
            remoteSocketWapper,
            header.address_remote,
            header.port_remote,
            rawClientData,
            webSocket,
            vlessResponseHeader,
            log,
            config,
          );
        },
        close() { log(`readableWebSocketStream closed`); },
        abort(err) { log(`readableWebSocketStream aborted`, err); },
      }),
    )
    .catch((err) => { console.error("Pipeline failed:", err.stack || err); });

  return new Response(null, { status: 101, webSocket: client });
}

async function HandleTCPOutBound(remoteSocket, addressRemote, portRemote, rawClientData, webSocket, protocolResponseHeader, log, config) {
  async function connectAndWrite(address, port) {
    const tcpSocket = connect({ hostname: address, port: port });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }

  async function retry() {
    const tcpSocket = await connectAndWrite(config.proxyIP || addressRemote, config.proxyPort || portRemote);
    tcpSocket.closed
      .catch((error) => console.log("retry tcpSocket closed error", error))
      .finally(() => safeCloseWebSocket(webSocket));
    RemoteSocketToWS(tcpSocket, webSocket, protocolResponseHeader, null, log);
  }

  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  RemoteSocketToWS(tcpSocket, webSocket, protocolResponseHeader, retry, log);
}

function MakeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  return new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => controller.enqueue(event.data));
      webSocketServer.addEventListener("close", () => {
        safeCloseWebSocket(webSocketServer);
        controller.close();
      });
      webSocketServer.addEventListener("error", (err) => {
        log("webSocketServer has error");
        controller.error(err);
      });
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) controller.error(error);
      else if (earlyData) controller.enqueue(earlyData);
    },
    pull(_controller) {},
    cancel(reason) {
      log(`ReadableStream was canceled, due to ${reason}`);
      safeCloseWebSocket(webSocketServer);
    },
  });
}

async function RemoteSocketToWS(remoteSocket, webSocket, protocolResponseHeader, retry, log) {
  let hasIncomingData = false;
  try {
    await remoteSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState !== CONST.WS_READY_STATE_OPEN) throw new Error("WebSocket is not open");
          hasIncomingData = true;
          const dataToSend = protocolResponseHeader
            ? await new Blob([protocolResponseHeader, chunk]).arrayBuffer()
            : chunk;
          webSocket.send(dataToSend);
          protocolResponseHeader = null;
        },
        close() { log(`Remote connection readable closed.`); },
        abort(reason) { console.error(`Remote connection readable aborted:`, reason); },
      }),
    );
  } catch (error) {
    console.error(`RemoteSocketToWS error:`, error.stack || error);
    safeCloseWebSocket(webSocket);
  }
  if (!hasIncomingData && retry) {
    log(`No incoming data, retrying`);
    await retry();
  }
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) return { earlyData: null, error: null };
  try {
    const binaryStr = atob(base64Str.replace(/-/g, "+").replace(/_/g, "/"));
    const buffer = new ArrayBuffer(binaryStr.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < binaryStr.length; i++) view[i] = binaryStr.charCodeAt(i);
    return { earlyData: buffer, error: null };
  } catch (error) {
    return { earlyData: null, error };
  }
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === CONST.WS_READY_STATE_OPEN || socket.readyState === CONST.WS_READY_STATE_CLOSING)
      socket.close();
  } catch (error) {
    console.error("safeCloseWebSocket error:", error);
  }
}

async function createDnsPipeline(webSocket, vlessResponseHeader, log) {
  let isHeaderSent = false;
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      for (let index = 0; index < chunk.byteLength; ) {
        const lengthBuffer = chunk.slice(index, index + 2);
        const udpPacketLength = new DataView(lengthBuffer).getUint16(0);
        const udpData = new Uint8Array(chunk.slice(index + 2, index + 2 + udpPacketLength));
        index = index + 2 + udpPacketLength;
        controller.enqueue(udpData);
      }
    },
  });

  transformStream.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          try {
            const resp = await safeFetch(`https://1.1.1.1/dns-query`, {
              method: "POST",
              headers: { "content-type": "application/dns-message" },
              body: chunk,
            }, 3000);
            const dnsQueryResult = await resp.arrayBuffer();
            const udpSize = dnsQueryResult.byteLength;
            const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

            if (webSocket.readyState === CONST.WS_READY_STATE_OPEN) {
              if (isHeaderSent) {
                webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
              } else {
                webSocket.send(await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
                isHeaderSent = true;
              }
            }
          } catch (error) { log("DNS query error: " + error); }
        },
      }),
    )
    .catch((e) => log("DNS stream error: " + e));

  const writer = transformStream.writable.getWriter();
  return { write: (chunk) => writer.write(chunk) };
}

async function handleScamalyticsLookup(request, config) {
  const url = new URL(request.url);
  const ipToLookup = url.searchParams.get("ip");
  if (!ipToLookup) return new Response(JSON.stringify({ error: "Missing IP" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const cache = caches.default;
  const cacheKey = new Request(`https://scam-cache.local/${ipToLookup}`);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const { username, apiKey, baseUrl } = config.scamalytics;
  if (!username || !apiKey) return new Response(JSON.stringify({ error: "Scamalytics API not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });

  const scamalyticsUrl = `${baseUrl}${username}/?key=${apiKey}&ip=${ipToLookup}`;
  const headers = new Headers({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": "public, max-age=43200" });

  try {
    const scamalyticsResponse = await fetch(scamalyticsUrl);
    const body = await scamalyticsResponse.text();
    const response = new Response(body, { headers });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return new Response(JSON.stringify({ error: error.toString() }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function handleResolveDomain(request) {
  const url = new URL(request.url);
  const domain = url.searchParams.get("domain");
  if (!domain) return new Response(JSON.stringify({ error: "Missing domain" }), { status: 400, headers: { "Content-Type": "application/json" } });

  const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    return new Response(JSON.stringify({ ip: domain }), { headers });
  }

  try {
    const dnsRes = await safeFetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
      headers: { accept: "application/dns-json" },
    }, 4000);
    const dnsData = await dnsRes.json();
    const ipAnswer = dnsData.Answer?.find((a) => a.type === 1);
    return new Response(JSON.stringify({ ip: ipAnswer ? ipAnswer.data : null }), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ ip: null, error: error.toString() }), { headers });
  }
}

async function handleConfigPage(userID, hostName, proxyAddress) {
  const dream = buildLink({ core: "xray", proto: "tls", userID, hostName, address: hostName, port: 443, tag: `${hostName}-Xray` });
  const freedom = buildLink({ core: "sb", proto: "tls", userID, hostName, address: hostName, port: 443, tag: `${hostName}-Singbox` });
  const encodedSubName = encodeURIComponent("INDEX");
  const subXrayUrl = `https://${hostName}/xray/${userID}?name=${encodedSubName}`;
  const subSbUrl = `https://${hostName}/sb/${userID}?name=${encodedSubName}`;

  try {
    const response = await safeFetch(HTML_URL);
    if (!response.ok) throw new Error(`Failed to load HTML from GitHub Pages: ${response.status}`);

    let finalHTML = await response.text();
    finalHTML = finalHTML
      .replace(/{{PROXY_ADDRESS}}/g, proxyAddress)
      .replace(/{{CONFIG_DREAM}}/g, dream)
      .replace(/{{CONFIG_FREEDOM}}/g, freedom)
      .replace(/{{URL_HIDDIFY}}/g, `hiddify://install-config?url=${encodeURIComponent(subXrayUrl)}`)
      .replace(/{{URL_V2RAYNG}}/g, `v2rayng://install-config?url=${encodeURIComponent(subXrayUrl)}#${encodedSubName}`)
      .replace(/{{URL_CLASH}}/g, `clash://install-config?url=${encodeURIComponent(`https://revil-sub.pages.dev/sub/clash-meta?url=${subSbUrl}`)}`)
      .replace(/{{URL_EXCLAVE}}/g, `sn://subscription?url=${encodeURIComponent(subSbUrl)}&name=${encodedSubName}`);

    return new Response(finalHTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  } catch (error) {
    return new Response(`Error rendering panel: ${error.message}`, { status: 500, headers: { "Content-Type": "text/plain" } });
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const cfg = Config.fromEnv(env);
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get("Upgrade");

      if (upgradeHeader && upgradeHeader.toLowerCase() === "websocket") {
        await init(wasm);

        const requestConfig = {
          userID: cfg.userID,
          proxyIP: cfg.proxyIP,
          proxyPort: cfg.proxyPort,
        };
        return ProtocolOverWSHandler(request, requestConfig);
      }

      if (url.pathname === "/resolve-domain") return handleResolveDomain(request);
      if (url.pathname === "/scamalytics-lookup") return handleScamalyticsLookup(request, cfg);
      if (url.pathname.startsWith(`/xray/${cfg.userID}`)) return handleIpSubscription(request, "xray", cfg.userID, url.hostname, ctx);
      if (url.pathname.startsWith(`/sb/${cfg.userID}`)) return handleIpSubscription(request, "sb", cfg.userID, url.hostname, ctx);
      if (url.pathname.startsWith(`/${cfg.userID}`)) return handleConfigPage(cfg.userID, url.hostname, cfg.proxyAddress);

      return new Response("UUID not found. Please set the UUID environment variable.", { status: 404 });
    } catch (err) {
      return new Response(`Worker Logic Error: ${err.message}\n${err.stack}`, { status: 500, headers: { "Content-Type": "text/plain" } });
    }
  },
};
