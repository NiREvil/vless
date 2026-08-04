// @ts-nocheck
import { connect } from "cloudflare:sockets";

let workerKey = null;

async function getWorkerKey() {
  if (!workerKey) {
    workerKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, true, [
      "sign",
      "verify",
    ]);
  }
  return workerKey;
}

async function generateSecureToken(hostname, timestamp, ua) {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${hostname}|${timestamp}|${ua}`);
  const key = await getWorkerKey();
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isPrivateIP(ip) {
  const cleanIp = ip
    .replace(/[\[\]]/g, "")
    .trim()
    .toLowerCase();

  const parts = cleanIp.split(".");
  if (parts.length === 4) {
    const first = parseInt(parts[0], 10);
    const second = parseInt(parts[1], 10);

    if (first === 10) return true;
    if (first === 127) return true;
    if (first === 169 && second === 254) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 0) return true;
  }

  if (
    cleanIp === "::1" ||
    cleanIp.startsWith("fc00:") ||
    cleanIp.startsWith("fd00:") ||
    cleanIp.startsWith("fe80:")
  ) {
    return true;
  }

  return false;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "*";

    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const websiteIcon = env.ICO || "https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/cf.svg";
    const UA = request.headers.get("User-Agent") || "null";
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31));

    const temporaryTOKEN = await generateSecureToken(hostname, timestamp, UA);
    const permanentTOKEN = env.TOKEN || temporaryTOKEN;

    const scamalyticsUsername = env.SCAMALYTICS_USERNAME;
    const scamalyticsApiKey = env.SCAMALYTICS_API_KEY;
    const scamalyticsApiBaseUrl = env.SCAMALYTICS_API_BASE_URL || "https://api.scamalytics.com";

    const jsonResponse = (data, status = 200) => {
      return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          ...corsHeaders,
        },
      });
    };

    if (path.toLowerCase() === "/check") {
      if (!url.searchParams.has("proxyip") || url.searchParams.get("proxyip") === "") {
        return new Response("Invalid or missing proxyip parameter", {
          status: 400,
          headers: corsHeaders,
        });
      }

      if (env.TOKEN) {
        if (!url.searchParams.has("token") || url.searchParams.get("token") !== permanentTOKEN) {
          return jsonResponse(
            {
              status: "error",
              message: `ProxyIP Check Failed: Invalid TOKEN`,
              timestamp: new Date().toISOString(),
            },
            403,
          );
        }
      }

      const proxyIPInput = url.searchParams.get("proxyip").toLowerCase();

      const timeoutParam = parseInt(url.searchParams.get("timeout")) || 8000;

      const result = await CheckProxyIP(proxyIPInput, timeoutParam);
      return jsonResponse(result, result.success ? 200 : 502);
    } else if (path.toLowerCase() === "/debug-env") {
      const tokenParam = url.searchParams.get("token");
      if (!env.TOKEN || tokenParam !== env.TOKEN) {
        return new Response("Unauthorized", { status: 403, headers: corsHeaders });
      }

      const safeEnv = {};
      for (const [key, val] of Object.entries(env)) {
        if (typeof val === "string" && val.length > 6) {
          safeEnv[key] = `${val.substring(0, 3)}***${val.substring(val.length - 3)}`;
        } else {
          safeEnv[key] = "HIDDEN/SET";
        }
      }
      return jsonResponse(safeEnv);
    } else if (path.toLowerCase() === "/scamalytics-lookup") {
      if (
        !url.searchParams.has("token") ||
        (url.searchParams.get("token") !== temporaryTOKEN &&
          url.searchParams.get("token") !== permanentTOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: "error",
              message: `Lookup Failed: Invalid TOKEN`,
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 403,
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const ipToLookup = url.searchParams.get("ip");
      if (!ipToLookup) {
        return new Response(JSON.stringify({ error: "Missing IP parameter" }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      const cleanIP = ipToLookup.replace(/[\[\]]/g, "");
      const harmonicaUrl = `https://api.harmonica.workers.dev/api/${cleanIP}`;

      try {
        const response = await fetch(harmonicaUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ProxyIPScanner/1.0)",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const responseBody = await response.json();
        return new Response(JSON.stringify(responseBody), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to fetch from Custom Risk API",
            details: error.message,
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          },
        );
      }
    } else if (path.toLowerCase() === "/resolve") {
      const clientToken = url.searchParams.get("token");
      if (!clientToken || (clientToken !== temporaryTOKEN && clientToken !== permanentTOKEN)) {
        return jsonResponse(
          {
            status: "error",
            message: `Domain Resolve Failed: Invalid TOKEN`,
            timestamp: new Date().toISOString(),
          },
          403,
        );
      }

      if (!url.searchParams.has("domain")) {
        return new Response("Missing domain parameter", { status: 400, headers: corsHeaders });
      }
      const domain = url.searchParams.get("domain");

      try {
        const ips = await resolveDomain(domain);
        return jsonResponse({ success: true, domain, ips });
      } catch (error) {
        return jsonResponse({ success: false, error: error.message }, 500);
      }
    } else if (path.toLowerCase() === "/ip-info") {
      const clientToken = url.searchParams.get("token");
      if (!clientToken || (clientToken !== temporaryTOKEN && clientToken !== permanentTOKEN)) {
        return jsonResponse(
          {
            status: "error",
            message: `IP Info Failed: Invalid TOKEN`,
            timestamp: new Date().toISOString(),
          },
          403,
        );
      }

      let ip = url.searchParams.get("ip") || request.headers.get("CF-Connecting-IP");
      if (!ip) {
        return jsonResponse(
          {
            status: "error",
            message: "IP parameter not provided",
            code: "MISSING_PARAMETER",
            timestamp: new Date().toISOString(),
          },
          400,
        );
      }

      ip = ip.replace(/[\[\]]/g, "");

      if (isPrivateIP(ip)) {
        return jsonResponse({ error: "SSRF Protection: Private IP blocked" }, 403);
      }

      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=en`);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        data.timestamp = new Date().toISOString();
        return jsonResponse(data);
      } catch (error) {
        return jsonResponse(
          {
            status: "error",
            message: `IP Info Failed: ${error.message}`,
            code: "API_REQUEST_FAILED",
            query: ip,
            timestamp: new Date().toISOString(),
          },
          500,
        );
      }
    } else {
      const envKey = env.URL302 ? "URL302" : env.URL ? "URL" : null;
      if (envKey) {
        const URLs = await sanitizeURLs(env[envKey]);
        const URL = URLs[Math.floor(Math.random() * URLs.length)];
        return envKey === "URL302" ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
      } else if (env.TOKEN) {
        return new Response(await nginxWelcomePage(), {
          headers: { "Content-Type": "text/html; charset=UTF-8" },
        });
      } else if (path.toLowerCase() === "/favicon.ico") {
        return Response.redirect(websiteIcon, 302);
      }
      return await generateHTMLPage(hostname, websiteIcon, temporaryTOKEN);
    }
  },
};

async function resolveDomain(domain) {
  domain = domain.includes(":") ? domain.split(":")[0] : domain;
  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: { Accept: "application/dns-json", "Cache-Control": "no-cache" },
        cf: { cacheTtl: -1 },
      }),
      fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=AAAA`, {
        headers: { Accept: "application/dns-json", "Cache-Control": "no-cache" },
        cf: { cacheTtl: -1 },
      }),
    ]);

    if (!ipv4Response.ok || !ipv6Response.ok) {
      throw new Error(`DNS API HTTP Error`);
    }

    const [ipv4Data, ipv6Data] = await Promise.all([ipv4Response.json(), ipv6Response.json()]);

    const ips = [];
    if (ipv4Data.Answer) {
      const ipv4Addresses = ipv4Data.Answer.filter((record) => record.type === 1).map(
        (record) => record.data,
      );
      ips.push(...ipv4Addresses);
    }
    if (ipv6Data.Answer) {
      const ipv6Addresses = ipv6Data.Answer.filter((record) => record.type === 28).map(
        (record) => `[${record.data}]`,
      );
      ips.push(...ipv6Addresses);
    }
    if (ips.length === 0) {
      throw new Error("No DNS records found");
    }
    return ips;
  } catch (error) {
    throw new Error(`DNS resolution failed: ${error.message}`);
  }
}

async function CheckProxyIP(proxyIP, timeoutMs = 8000) {
  let portRemote = 443;
  let hostToCheck = proxyIP;
  if (proxyIP.includes(".tp")) {
    const portMatch = proxyIP.match(/\.tp(\d+)\./);
    if (portMatch) portRemote = parseInt(portMatch[1]);
    hostToCheck = proxyIP.split(".tp")[0];
  } else if (proxyIP.includes("[") && proxyIP.includes("]:")) {
    portRemote = parseInt(proxyIP.split("]:")[1]);
    hostToCheck = proxyIP.split("]:")[0] + "]";
  } else if (proxyIP.includes(":") && !proxyIP.startsWith("[")) {
    const parts = proxyIP.split(":");
    if (parts.length === 2 && parts[0].includes(".")) {
      hostToCheck = parts[0];
      portRemote = parseInt(parts[1]) || 443;
    }
  }

  if (isNaN(portRemote) || portRemote < 1 || portRemote > 65535) {
    portRemote = 443;
  }

  if (isPrivateIP(hostToCheck)) {
    return {
      success: false,
      proxyIP: hostToCheck,
      portRemote: portRemote,
      timestamp: new Date().toISOString(),
      error: "SSRF Protection: Private IP blocked.",
    };
  }

  const hostAddr = hostToCheck.includes(":") ? `[${hostToCheck}]` : hostToCheck;

  const probeTargets = [
    { host: "ipv4.090227.xyz", path: "/" },
    { host: "ipv6.090227.xyz", path: "/" },
  ];

  const HEADER_BODY_SEPARATOR = Uint8Array.of(13, 10, 13, 10);
  const HTTP_STATUS_RE = /^HTTP\/\d(?:\.\d)?\s+(\d{3})/;

  function indexOfBytes(haystack, needle, start = 0) {
    outer: for (let i = start; i <= haystack.length - needle.length; i++) {
      for (let j = 0; j < needle.length; j++) {
        if (haystack[i + j] !== needle[j]) continue outer;
      }
      return i;
    }
    return -1;
  }

  function concatBytes(chunks) {
    const merged = new Uint8Array(chunks.reduce((sum, { length }) => sum + length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }
    return merged;
  }

  let lastError = null;
  let latency = 0;

  for (const target of probeTargets) {
    let socket = null;
    let tlsClient = null;
    try {
      const startedAt = Date.now();
      socket = connect({ hostname: hostAddr, port: portRemote });
      await withTimeout(socket.opened, timeoutMs, "TCP Connect");

      tlsClient = new TlsClient(socket, { serverName: target.host, timeout: timeoutMs });
      await withTimeout(tlsClient.handshake(), timeoutMs, "TLS Handshake");

      const httpRequest =
        `GET ${target.path} HTTP/1.1\r\n` +
        `Host: ${target.host}\r\n` +
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0\r\n` +
        `Connection: close\r\n\r\n`;

      await tlsClient.write(new TextEncoder().encode(httpRequest));

      const chunks = [];
      while (true) {
        const chunk = await tlsClient.read();
        if (!chunk || chunk.length === 0) break;
        chunks.push(chunk);
      }
      const rawResponse = concatBytes(chunks);
      latency = Date.now() - startedAt;

      if (!rawResponse.length) throw new Error("Empty response");

      const splitIndex = indexOfBytes(rawResponse, HEADER_BODY_SEPARATOR);
      const [headerBytes] = splitIndex < 0 ? [rawResponse] : [rawResponse.subarray(0, splitIndex)];

      const headerText = new TextDecoder().decode(headerBytes);
      const statusCode = Number(headerText.match(HTTP_STATUS_RE)?.[1] ?? 0) || null;

      if (statusCode === 200) {
        return {
          success: true,
          proxyIP: hostToCheck,
          portRemote: portRemote,
          statusCode: statusCode,
          responseSize: rawResponse.length,
          latency: latency,
          timestamp: new Date().toISOString(),
        };
      } else {
        throw new Error(`Unexpected status code: ${statusCode}`);
      }
    } catch (error) {
      lastError = error.message || error.toString();
    } finally {
      try {
        tlsClient?.close();
      } catch {}
      try {
        if (!tlsClient) socket?.close();
      } catch {}
    }
  }

  return {
    success: false,
    proxyIP: hostToCheck,
    portRemote: portRemote,
    timestamp: new Date().toISOString(),
    error: lastError || "Connection failed.",
  };
}

function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} Timeout`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

async function sanitizeURLs(content) {
  const replacedContent = content.replace(/[\r\n]+/g, "|").replace(/\|+/g, "|");
  const addressArray = replacedContent.split("|");
  return addressArray.filter((item, index) => {
    return item !== "" && addressArray.indexOf(item) === index;
  });
}

async function nginxWelcomePage() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx</h1>
    <p>If you see this page, the nginx web server is successfully installed and
    working. Further configuration is required.</p>
    <p>For online documentation and support please refer to
    <a href="http://nginx.org/">nginx.org</a>.<br/>
    Commercial support is available at
    <a href="http://nginx.com/">nginx.com</a>.</p>
    <p><em>Thank you for using nginx.</em></p>
    </body>
    </html>
    `;
}

async function generateHTMLPage(_hostname, websiteIcon, token) {
  const html = `
    <!DOCTYPE html>
  <html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ProxyIP Checker - Advanced Risk Analysis</title>
    <link rel="icon" href="{{ICON_URL}}" type="image/x-icon" />
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
      :root {
        --canvas-default: #22272e;
        --canvas-subtle: #2d333b;
        --canvas-inset: #1c2128;
        --canvas-overlay: #2d333b;
        --border-default: #444c56;
        --border-muted: #373e47;
        --fg-default: #adbac7;
        --fg-muted: #768390;
        --fg-subtle: #636e7b;
        --fg-on-emphasis: #cdd9e5;
        --accent-fg: #539bf5;
        --accent-emphasis: #316dca;
        --accent-subtle: rgba(83, 155, 245, 0.1);
        --success-fg: #57ab5a;
        --success-emphasis: #347d39;
        --success-subtle: rgba(70, 149, 74, 0.15);
        --success-border: rgba(70, 149, 74, 0.4);
        --danger-fg: #e5534b;
        --danger-emphasis: #b62324;
        --danger-subtle: rgba(229, 83, 75, 0.15);
        --danger-border: rgba(229, 83, 75, 0.4);
        --attention-fg: #c69026;
        --attention-emphasis: #966600;
        --attention-subtle: rgba(197, 139, 33, 0.15);
        --attention-border: rgba(197, 139, 33, 0.4);
        --neutral-subtle: rgba(99, 110, 123, 0.15);
        --neutral-border: rgba(99, 110, 123, 0.4);
        --btn-bg: #373e47;
        --btn-hover-bg: #444c56;
        --btn-border: rgba(99, 110, 123, 0.4);
        --btn-primary-bg:#2d333b;
        --btn-primary-hover-bg:#373e47;
        --btn-primary-fg:#cdd9e5;
        --btn-primary-border:#545d68;
        --shadow-md: 0 3px 6px rgba(0, 0, 0, 0.4);
        --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
        --radius-sm: 6px;
        --radius-md: 8px;
        --radius-lg: 8px;
        --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        --font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        --success-color: var(--success-fg);
        --success-bg: var(--success-subtle);
        --error-color: var(--danger-fg);
        --error-bg: var(--danger-subtle);
        --error-border: var(--danger-border);
        --warning-color: var(--attention-fg);
        --warning-bg: var(--attention-subtle);
        --warning-border: var(--attention-border);
        --info-color: var(--accent-fg);
        --info-bg: var(--accent-subtle);
        --info-border: rgba(83, 155, 245, 0.4);
        --brass: var(--accent-fg);
        --brass-light: var(--accent-fg);
        --brass-dark: var(--accent-emphasis);
        --border-color: var(--border-default);
        --border-light: var(--border-muted);
        --ink: var(--fg-default);
        --ink-soft: var(--fg-muted);
        --paper: var(--canvas-inset);
        --paper-dark: var(--canvas-subtle);
        --text-primary: var(--fg-default);
        --text-secondary: var(--fg-muted);
        --text-muted: var(--fg-subtle);
        --text-light: var(--fg-muted);
        --accent-orange-light: var(--accent-fg);
        --status-success-icon: var(--success-fg);
        --status-error-icon: var(--danger-fg);
        --status-warning-icon: var(--attention-fg);
        --bg-primary: var(--canvas-default);
        --bg-secondary: var(--canvas-subtle);
        --bg-tertiary: var(--canvas-inset);
        --serif: var(--font-sans);
        --body-serif: var(--font-sans);
        --mono-sans: var(--font-mono);
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      html {
        scroll-behavior: smooth;
      }
      
      button,
      input {
        -webkit-tap-highlight-color: transparent;
      }
      
      button,
      input,
      textarea,
      select {
        font: inherit;
      }

      *::selection {
        background: rgba(83, 155, 245, 0.4);
      }

      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background-color: #545d68;
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: content-box;
      }
      
      ::-webkit-scrollbar-thumb:hover{
      background: #636e7b;
      background-clip: content-box;
      }

      body {
        font-family: var(--font-sans);
        background: var(--canvas-default);
        color: var(--fg-default);
        line-height: 1.5;
        min-height: 100vh;
        overflow-x: hidden;
        font-size: 14px;
      }

      a { color: var(--accent-fg); text-decoration: none; }
      a:hover { text-decoration: underline; }

      .container {
        max-width: 1160px;
        margin: 0 auto;
        padding: 2.5rem 1.5rem;
        position: relative;
        z-index: 1;
      }

      .header {
        text-align: center;
        margin-bottom: 16px;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 0.75rem;
      }

      .header-icon {
        font-family: var(--font-mono);
        font-size: 1rem;
        color: var(--accent-fg);
        line-height: 1;
      }

      .header-icon.spinning {
        display: inline-block;
        animation: spin 1.4s linear infinite;
      }

      .title-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        padding: 8px 0;
      }

      .main-title {
        font-family: var(--font-sans);
        font-size: clamp(1.75rem, 3.4vw, 2.25rem);
        font-weight: 600;
        color: var(--fg-default);
        letter-spacing: -0.01em;
      }

      .subtitle {
        font-family: var(--font-mono);
        font-size: 0.8rem;
        color: var(--fg-muted);
        letter-spacing: 0.04em;
        margin-top: 0.35rem;
      }

      .main-card {
        background: var(--canvas-subtle);
        border-radius: var(--radius-lg);
        padding: 2rem;
        box-shadow:none;
        border: 1px solid var(--border-muted);
        position: relative;
      }

      .form-section {
        display: grid;
        gap: 16px;
        margin-bottom: 16px;
      }

      .input-group {
        position: relative;
      }

      .input-label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-family: var(--font-sans);
        font-weight: 500;
        color: var(--fg-default);
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
      }

      .input-label svg {
        width: 16px;
        height: 16px;
        color: var(--fg-muted);
      }

      .input-wrapper {
        position: relative;
      }

      .form-input {
        width: 100%;
        padding: 0.5rem 0.75rem;
        font-family: var(--font-mono);
        font-size: 0.875rem;
        background: var(--canvas-inset);
        color: var(--fg-default);
        border: 1px solid var(--border-default);
        border-radius: var(--radius-sm);
        transition: border-color 0.15s ease, box-shadow 0.15s ease;
        outline: none;
      }
      
      .form-input:focus{
        border-color:var(--accent-fg);
        outline:2px solid var(--accent-fg);
        outline-offset:-2px;
        box-shadow:none;
      }

      .form-input::placeholder {
        color: var(--fg-subtle);
      }

      .btn-primary {
        background: var(--btn-primary-bg);
        color: var(--btn-primary-fg);
        border: 1px solid var(--btn-primary-border);
        padding: 0.42rem 0.9rem;
        border-radius: var(--radius-md);
        font-family: var(--font-sans);
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.12s ease;
        position: relative;
        box-shadow:none;
      }

      .btn-primary:hover {
        background: var(--btn-primary-hover-bg);
      }

      .btn-primary:active {
        background: var(--btn-hover-bg);
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .loading-spinner {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-left: 0.5rem;
        display: none;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
     @keyframes cursorBlink {
        0%,
        45% {
          opacity: 1;
        }
      
        50%,
        95% {
          opacity: 0;
        }
      
        100% {
          opacity: 1;
        }
      }
      
      .terminal-cursor {
        display: inline-block;
        animation: cursorBlink 1s step-end infinite;
      }
      
      .btn-primary.loading .terminal-cursor {
        display: none;
      }
      
      .btn-primary.loading #btn-text::after {
        content: "...";
      }

      .results-section {
        margin-top: 2rem;
      }

      .result-card {
        font-family: var(--font-sans);
        background: var(--canvas-subtle);
        color: var(--fg-default);
        border-radius: var(--radius-md);
        padding: 16px;
        margin-bottom: 16px;
        border: 1px solid var(--border-default);
        box-shadow: none;
        position: relative;
        overflow: hidden;
      }

      .result-card::before {
        content: none;
      }

      .result-header {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        gap: 8px;
      }

      .result-title {
        font-family: var(--font-sans);
        font-size: 16px;
        font-weight: 500;
        color: var(--fg-default);
      }

      .result-content {
        display: grid;
        gap: 0;
      }

      .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        background: transparent;
        border-radius: 0;
        border: none;
        border-bottom: 1px solid var(--border-muted);
      }

      .result-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
      }

      .result-icon {
        font-size: 16px;
        line-height: 1;
        display: flex;
        align-items: center;
      }

      .result-card.result-success,
      .result-card.success {
        background: var(--canvas-subtle);
        border-color: var(--success-fg);
        box-shadow: none;
      }

      .result-card.result-error,
      .result-card.error {
        background: var(--canvas-subtle);
        border-color: var(--danger-fg);
        box-shadow: none;
      }

      .result-card.result-warning,
      .result-card.warning {
        background: var(--canvas-subtle);
        border-color: var(--attention-fg);
        box-shadow: none;
      }

      .result-card.success::before,
      .result-card.error::before,
      .result-card.warning::before {
        content: none;
      }

      .result-label {
        font-weight: 400;
        color: var(--fg-muted);
      }

      .result-value {
        font-weight: 600;
        color: var(--fg-default);
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
      }

      .result-header, .result-content {
        position: relative;
        z-index: 2;
      }

      .flag-glow-overlay {
        position: absolute;
        top: -20px;
        right: -20px;
        width: 160px;
        height: 160px;
        border: none;
        opacity: 0.06;
        border-radius: 0;
        box-shadow: none;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        filter: blur(2px) saturate(0.8);
        pointer-events: none;
        user-select: none;
        z-index: 1;
      }

      .status-icon-prefix,
      .status-icon {
        font-size: 14px;
        font-style: normal;
      }

      .status-icon-prefix.success,
      .status-icon.success,
      .result-icon.success { color: var(--success-fg); }
      .status-icon-prefix.error,
      .status-icon.error,
      .result-icon.error { color: var(--danger-fg); }
      .status-icon-prefix.warning,
      .status-icon.warning,
      .result-icon.warning { color: var(--attention-fg); }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 0 8px;
        border-radius: 2em;
        font-family: var(--font-sans);
        font-size: 12px;
        font-weight: 500;
        line-height: 18px;
        text-transform: none;
        letter-spacing: normal;
        border: 1px solid transparent;
        white-space: nowrap;
      }
      .badge.success {
        background: var(--success-subtle);
        color: var(--success-fg);
        border-color: rgba(87, 171, 90, 0.25);
      }
      .badge.error {
        background: var(--danger-subtle);
        color: var(--danger-fg);
        border-color: rgba(229, 83, 75, 0.25);
      }
      .badge.warning {
        background: var(--attention-subtle);
        color: var(--attention-fg);
        border-color: rgba(218, 170, 63, 0.25);
      }
      .badge.info {
        background: var(--accent-subtle);
        color: var(--accent-fg);
        border-color: rgba(83, 155, 245, 0.25);
      }

      .copy-btn {
        background: var(--btn-bg);
        border: 1px solid var(--border-muted);
        color: var(--fg-default);
        height: 28px;
        padding: 0 10px;
        border-radius: var(--radius-sm);
        font-size: 0.72rem;
        font-family: var(--font-sans);
        cursor: pointer;
        transition: background-color 0.12s ease;
      }
      
      .copy-btn:hover{
        background: var(--btn-hover-bg);
        border-color: var(--border-default);
      }

      .toast {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        background: var(--canvas-overlay);
        color: var(--fg-default);
        padding: 0.75rem 1.1rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        border: 1px solid var(--border-default);
        font-family: var(--font-sans);
        font-size: 0.85rem;
        z-index: 1000;
        opacity: 0;
        transform: translateY(60px);
        transition: all 0.25s ease;
      }
      .toast.show {
        opacity: 1;
        transform: translateY(0);
      }

      .api-docs {
        margin-top: 2rem;
        background: var(--canvas-subtle);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        border: 1px solid var(--border-default);
      }

      .api-docs-header {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1.25rem;
      }

      .api-docs-header h3 {
        font-family: var(--font-sans);
        color: var(--fg-default);
        font-size: 1.15rem;
        font-weight: 500;
      }

      .api-docs-header svg {
        width: 20px;
        height: 20px;
        color: var(--fg-muted);
      }

      .api-endpoints {
        display: grid;
        gap: 8px;
      }

      .api-endpoint {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: var(--canvas-inset);
        padding: 8px 16px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-muted);
        transition: border-color 0.15s ease;
      }
      .api-endpoint:hover {
        border-color: var(--border-default);
      }

      .api-method {
        font-family: var(--font-mono);
        font-weight: 600;
        padding: 0.1rem 0.5rem;
        border-radius: 2em;
        font-size: 0.72rem;
        background: var(--success-subtle);
        color: var(--success-fg);
        border: 1px solid var(--success-border);
      }

      .api-endpoint code {
        font-family: var(--font-mono);
        font-size: 0.85rem;
        color: var(--fg-muted);
        flex-grow: 1;
      }

      .api-endpoint code span {
        color: var(--accent-fg);
      }

      .api-description {
        font-family: var(--font-sans);
        font-size: 0.8rem;
        font-style: normal;
        color: var(--fg-subtle);
        margin-left: auto;
        white-space: nowrap;
      }

      .footer {
        font-family: var(--font-sans);
        text-align: center;
        margin-top: 2rem;
        padding: 1.5rem;
        color: var(--fg-subtle);
        border-top: 1px solid var(--border-muted);
        font-size: 0.8rem;
      }
      .footer a {
        color: var(--accent-fg);
      }

      @media (max-width: 768px) {
        .container { padding: 1.5rem 1rem; }
        .main-card { padding: 1.25rem; }
        .header { flex-direction: column; gap: 1rem; }
        .result-item { flex-direction: column; align-items: flex-start; gap: 4px; }
        .api-endpoint { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
        .api-description { margin-left: 0; margin-top: 0.2rem; }
        .toast { left: 1rem; right: 1rem; bottom: 1rem; }
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      @media (max-width: 640px) {
        .grid-2 { grid-template-columns: 1fr; }
      }

      @media (max-width: 480px) {
        .main-card { padding: 1rem; }
        .main-title { font-size: 1.5rem; }
        .subtitle { font-size: 0.65rem; }
        .btn-primary { font-size: 0.85rem; }
      }

      .flex-center {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }
      .flex-center svg {
        width: 16px;
        height: 16px;
      }

      .range-results {
        margin-top: 16px;
      }
      .ip-grid {
        display: grid;
        gap: 4px;
        max-height: 500px;
        overflow-y: auto;
        padding: 8px;
        background: var(--canvas-inset);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-muted);
      }
      .ip-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 6px 8px;
        background: var(--canvas-default);
        color: var(--fg-default);
        border-radius: var(--radius-md);
        border: 1px solid var(--border-muted);
        font-family: var(--font-mono);
        font-size: 12px;
      }
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 8px;
      }
      .status-indicator.success { background: var(--success-fg); }
      .status-indicator.error { background: var(--danger-fg); }
      .status-indicator.warning { background: var(--attention-fg); }
    </style>
  </head>
  <body>
    <div class="container">
      <header class="header">
        <div class="title-group">
          <h1 class="main-title">ProxyIP Checker</h1>
          <p class="subtitle">Proxy IP Verification &amp; Risk Analysis</p>
        </div>
      </header>

      <div class="main-card">
        <div class="form-section">
          <div class="grid-2">
            <div class="input-group">
              <label for="proxyip" class="input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                </svg>
                Single IP / Domain
              </label>
              <div class="input-wrapper">
                <input type="text" id="proxyip" class="form-input" placeholder="127.0.0.1:443 or di.nscl.ir" autocomplete="off" />
              </div>
            </div>

            <div class="input-group">
              <label for="proxyipRange" class="input-label">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 1.5m1-1.5l1 1.5m0 0l.5 1.5m-2-3l2 3m4.5-3l-1.5 2.25m-1.5-2.25l1.5 2.25m3-3l-1.5 2.25m1.5-2.25l1.5 2.25M9 12l-1.5 2.25M15 12l1.5 2.25" />
                </svg>
                IP Range
              </label>
              <div class="input-wrapper">
                <input type="text" id="proxyipRange" class="form-input" placeholder="127.0.0.0/24" autocomplete="off" />
              </div>
            </div>
          </div>
          
          <button id="checkBtn" class="btn-primary" onclick="checkInputs()">
            <span class="flex-center">
              <span id="btn-icon" class="header-icon">
                &gt;<span id="btn-cursor" class="terminal-cursor">_</span>
              </span>
              <span class="loading-spinner"></span>
              <span id="btn-text" class="btn-text">
                Start Analysis
              </span>
            </span>
          </button>

        <div id="result" class="results-section"></div>
        <div id="rangeResult" class="range-results" style="display: none"></div>
      </div>

      <div class="api-docs">
        <div class="api-docs-header">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 00-1.242 7.244" />
          </svg>
          <h3>API Documentation</h3>
        </div>
        <div class="api-endpoints">
          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <code>/check?proxyip=<span>IP1,IP2,...</span></code>
            <span class="api-description">Check multiple IPs</span>
          </div>
          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <code>/check?iprange=<span>IP_RANGE</span></code>
            <span class="api-description">Check an IP range</span>
          </div>
          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <code>/resolve?domain=<span>YOUR_DOMAIN</span></code>
            <span class="api-description">Resolve domain to IP</span>
          </div>
          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <code>/ip-info?ip=<span>TARGET_IP</span></code>
            <span class="api-description">Get IP information</span>
          </div>
          <div class="api-endpoint">
            <span class="api-method">GET</span>
            <code>/scamalytics-lookup?ip=<span>TARGET_IP</span></code>
            <span class="api-description">Scamalytics score</span>
          </div>
        </div>
      </div>

      <footer class="footer">
        <p>
          <a href="https://github.com/NiREvil/vless/" target="_blank" rel="noopener noreferrer">
            © ${new Date().getFullYear()} <strong>Dìana</strong> – ProxyIP checker
          </a>
        </p>
      </footer>
      </div>

      <div id="toast" class="toast"></div>

      <script>
        let isChecking = false;
        const ipCheckResults = new Map();
        let pageLoadTimestamp;
        const TEMP_TOKEN = "${token}";
        let rangeChartInstance = null;
        let currentSuccessfulRangeIPs = [];

        function calculateTimestamp() {
          const currentDate = new Date();
          return Math.ceil(currentDate.getTime() / (1000 * 60 * 31));
        }

        document.addEventListener('DOMContentLoaded', function() {
          pageLoadTimestamp = calculateTimestamp();
          const singleIpInput = document.getElementById('proxyip');
          const rangeIpInput = document.getElementById('proxyipRange');
          singleIpInput.focus();

          const urlParams = new URLSearchParams(window.location.search);
          let autoCheckValue = urlParams.get('autocheck');
          if (!autoCheckValue) {
              const currentPath = window.location.pathname;
              if (currentPath.length > 1) {
                const pathContent = decodeURIComponent(currentPath.substring(1));
                if (isValidProxyIPFormat(pathContent)) {
                    autoCheckValue = pathContent;
                }
              }
          }

          if (autoCheckValue) {
            singleIpInput.value = autoCheckValue;
            const newUrl = new URL(window.location);
            newUrl.searchParams.delete('autocheck');
            newUrl.pathname = '/';
            window.history.replaceState({}, '', newUrl);
            setTimeout(() => { if (!isChecking) { checkInputs(); } }, 500);
          } else {
            try {
                const lastSearch = localStorage.getItem('lastProxyIP');
                if (lastSearch) singleIpInput.value = lastSearch;
            } catch (e) { console.error('localStorage read error:', e); }
          }

          singleIpInput.addEventListener('keypress', function(event) { if (event.key === 'Enter' && !isChecking) { checkInputs(); } });
          rangeIpInput.addEventListener('keypress', function(event) { if (event.key === 'Enter' && !isChecking) { checkInputs(); } });
          document.addEventListener('click', function(event) {
            if (event.target.classList.contains('copy-btn')) {
              const text = event.target.getAttribute('data-copy');
              if (text) copyToClipboard(text, event.target, "Copied!");
            }
          });
        });

        function showToast(message, duration = 3000) {
          const toast = document.getElementById('toast');
          toast.textContent = message;
          toast.classList.add('show');
          setTimeout(() => { toast.classList.remove('show'); }, duration);
        }

        function copyToClipboard(text, element, successMessage = "Copied!") {
          navigator.clipboard.writeText(text).then(() => {
            const originalText = element ? element.textContent : '';
            if(element) element.textContent = 'Copied ✓';
            showToast(successMessage);
            if(element) setTimeout(() => { element.textContent = originalText; }, 2000);
          }).catch(err => { showToast('Copy failed. Please copy manually.'); });
        }

        function createCopyButton(text) {
          return \`<span class="result-value">
            <span>\${text}</span>
            <button class="copy-btn" data-copy="\${text}">Copy</button>
          </span>\`;
        }

        function isValidProxyIPFormat(input) {
            const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?)*$/;
            const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
            const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
            const withPortRegex = /^.+:\\d+$/;
            const tpPortRegex = /^.+\\.tp\\d+\\./;
            return domainRegex.test(input) || ipv4Regex.test(input) || ipv6Regex.test(input) || withPortRegex.test(input) || tpPortRegex.test(input);
        }

        function isIPAddress(input) {
          const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
          const ipv6Regex = /^\\[?([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}\\]?$/;
          const ipv6WithPortRegex = /^\\[[0-9a-fA-F:]+\\]:\\d+$/;
          const ipv4WithPortRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\\d+$/;
          return ipv4Regex.test(input) || ipv6Regex.test(input) || ipv6WithPortRegex.test(input) || ipv4WithPortRegex.test(input);
        }

        function parseIPRange(rangeInput) {
            const ips = [];
            rangeInput = rangeInput.trim();
            if (/^(\\d{1,3}\\.){3}\\d{1,3}\\/24$/.test(rangeInput)) {
                const baseIp = rangeInput.split('/')[0];
                const baseParts = baseIp.split('.');
                if (baseParts.length === 4 ) {
                    for (let i = 1; i <= 255; i++) {
                        ips.push(baseParts[0] + "." + baseParts[1] + "." + baseParts[2] + "." + i);
                    }
                } else {
                     showToast('Invalid CIDR format. Expected x.x.x.0/24.');
                }
            }
            else if (/^(\\d{1,3}\\.){3}\\d{1,3}-\\d{1,3}$/.test(rangeInput)) {
                const parts = rangeInput.split('-');
                const baseIpWithLastOctet = parts[0];
                const endOctet = parseInt(parts[1]);

                const ipParts = baseIpWithLastOctet.split('.');
                if (ipParts.length === 4) {
                    const startOctet = parseInt(ipParts[3]);
                    const prefix = ipParts[0] + "." + ipParts[1] + "." + ipParts[2];
                    if (!isNaN(startOctet) && !isNaN(endOctet) && startOctet <= endOctet && startOctet >= 0 && endOctet <= 255) {
                        for (let i = startOctet; i <= endOctet; i++) {
                            ips.push(prefix + "." + i);
                        }
                    } else {
                        showToast('Invalid range in x.x.x.A-B format.');
                    }
                } else {
                     showToast('Invalid x.x.x.A-B range format.');
                }
            }
            return ips;
        }

        function preprocessInput(input) {
          if (!input) return input;
          let processed = input.trim();
          if (processed.includes(' ')) {
            processed = processed.split(' ')[0];
          }
          return processed;
        }

        async function fetchScamalyticsRiskInfo(ip) {
          if (!ip) return null;
          try {
            const cleanIP = ip.replace(/[\\[\\]]/g, '');
            const workerLookupUrl = \`./scamalytics-lookup?ip=\${encodeURIComponent(cleanIP)}&token=\${TEMP_TOKEN}\`;
            const response = await fetch(workerLookupUrl);

            if (!response.ok) {
               console.error('Scamalytics request failed via Worker:', response.status, response.statusText);
               return null;
            }

            const data = await response.json();

            if (data.status === 'error') {
              console.error('Scamalytics API error (from worker):', data.message || data.error);
              return null;
            }

            if (data.scamalytics && data.scamalytics.status === 'error') {
                console.error('Scamalytics API error (from Scamalytics):', data.scamalytics.error);
                return null;
            }

            return data;
          } catch (error) {
            console.error('Error fetching from Scamalytics via Worker:', error);
            return null;
          }
        }

        function formatScamalyticsRiskInfo(data) {
          if (!data || !data.info || data.info.success !== true) {
            return '<span class="badge info">Risk Unknown</span>';
          }

          const score = data.info.fraud_score;
          const risk = data.info.risk || 'unknown';
          const isVpn = data.details && data.details.vpn === "Yes" ? " | VPN" : "";

          let badgeClass = "info";
          if (risk === "low") badgeClass = "success";
          else if (risk === "medium") badgeClass = "warning";
          else if (risk === "high" || risk === "very high") badgeClass = "error";

          const riskText = score + " - " + risk.charAt(0).toUpperCase() + risk.slice(1) + isVpn;
          return \`<span class="badge \${badgeClass}">\${riskText}</span>\`;
        }

        async function checkInputs() {
          if (isChecking) return;
          const singleIpInputEl = document.getElementById('proxyip');
          const rangeIpInputEl = document.getElementById('proxyipRange');
          const resultDiv = document.getElementById('result');
          const rangeResultDiv = document.getElementById('rangeResult');

          const checkBtn = document.getElementById('checkBtn');
          const btnText = checkBtn.querySelector('.btn-text');
          const spinner = checkBtn.querySelector('.loading-spinner');
          const btnIcon = document.getElementById('btn-icon');

          const rawSingleInput = singleIpInputEl.value;
          let singleIpToTest = preprocessInput(rawSingleInput);

          const rawRangeInput = rangeIpInputEl.value;
          let rangeIpToTest = preprocessInput(rawRangeInput);

          if (singleIpToTest && singleIpToTest !== rawSingleInput) {
            singleIpInputEl.value = singleIpToTest;
            showToast('Single IP input auto-corrected.');
          }
          if (rangeIpToTest && rangeIpToTest !== rawRangeInput) {
            rangeIpInputEl.value = rangeIpToTest;
            showToast('IP Range input auto-corrected.');
          }

          if (!singleIpToTest && !rangeIpToTest) {
            showToast('Please enter a single IP/Domain or an IP Range.');
            singleIpInputEl.focus();
            return;
          }

          const currentTimestamp = calculateTimestamp();
          if (currentTimestamp !== pageLoadTimestamp) {
            const currentHost = window.location.host;
            const currentProtocol = window.location.protocol;
            let redirectPathVal = singleIpToTest || rangeIpToTest || '';
            const redirectUrl = \`\${currentProtocol}//\${currentHost}/\${encodeURIComponent(redirectPathVal)}\`;
            showToast('TOKEN expired, refreshing page...');
            setTimeout(() => { window.location.href = redirectUrl; }, 1000);
            return;
          }

          if (singleIpToTest) {
              try { localStorage.setItem('lastProxyIP', singleIpToTest);
              } catch (e) {}
          }

          isChecking = true;
          checkBtn.disabled = true;
          checkBtn.classList.add("loading");
          btnText.textContent = "Analyzing";
          spinner.style.display = "inline-block";

          resultDiv.innerHTML = '';
          rangeResultDiv.innerHTML = '';
          rangeResultDiv.style.display = 'none';
          currentSuccessfulRangeIPs = [];
          if (rangeChartInstance) {
              rangeChartInstance.destroy();
              rangeChartInstance = null;
          }

          try {
            if (singleIpToTest) {
                if (isIPAddress(singleIpToTest)) {
                    await checkAndDisplaySingleIP(singleIpToTest, resultDiv);
                } else {
                    await checkAndDisplayDomain(singleIpToTest, resultDiv);
                }
            }

            if (rangeIpToTest) {
                const ipsInRange = parseIPRange(rangeIpToTest);
                if (ipsInRange.length > 0) {
                    showToast(\`Starting test for \${ipsInRange.length} IPs in range... This may take a while.\`);
                    rangeResultDiv.style.display = 'block';
                    rangeResultDiv.innerHTML = \`
                      <div class="result-card warning">
                        <div class="result-header">
                          <div class="result-icon warning">⟳</div>
                          <h3 class="result-title">Testing IP Range...</h3>
                        </div>
                        <div class="result-content">
                          <div class="result-item">
                            <span class="result-label">Progress</span>
                            <span class="result-value" id="rangeProgress">0/\` + ipsInRange.length + \`</span>
                          </div>
                          <div class="result-item">
                            <span class="result-label">Successful IPs</span>
                            <span class="result-value" id="rangeSuccess">0</span>
                          </div>
                        </div>
                      </div>
                    \`;

                    let successCount = 0;
                    let checkedCount = 0;
                    currentSuccessfulRangeIPs = [];

                    const batchSize = 10;
                    for (let i = 0; i < ipsInRange.length; i += batchSize) {
                        const batch = ipsInRange.slice(i, i + batchSize);
                        const batchPromises = batch.map(ip =>

                            fetchSingleIPCheck(ip + ':443', 2500)
                                .then(data => {
                                    checkedCount++;
                                    if (data.success) {
                                        successCount++;
                                        currentSuccessfulRangeIPs.push(data.proxyIP);
                                    }
                                    return data;
                                })
                                .catch(err => {
                                    checkedCount++;
                                    console.error("Error checking IP in range:", ip, err);
                                    return {success: false, proxyIP: ip, error: err.message};
                                })
                        );
                        await Promise.all(batchPromises);

                        document.getElementById('rangeProgress').textContent = checkedCount + "/" + ipsInRange.length;
                        document.getElementById('rangeSuccess').textContent = successCount;

                        if (i + batchSize < ipsInRange.length) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }

                    const finalResultClass = successCount === ipsInRange.length ? 'success' :
                                           successCount > 0 ? 'warning' : 'error';
                    const finalIcon = successCount === ipsInRange.length ? '✓' :
                                    successCount > 0 ? '!!' : '✕';

                    rangeResultDiv.innerHTML = \`
                      <div class="result-card \${finalResultClass}">
                        <div class="result-header">
                          <div class="result-icon \${finalResultClass}">\${finalIcon}</div>
                          <h3 class="result-title">Range Test Complete</h3>
                        </div>
                        <div class="result-content">
                          <div class="result-item">
                            <span class="result-label">Total IPs Tested</span>
                            <span class="result-value">\${ipsInRange.length}</span>
                          </div>
                          <div class="result-item">
                            <span class="result-label">Successful IPs</span>
                            <span class="result-value">\${successCount}</span>
                          </div>
                          <div class="result-item">
                            <span class="result-label">Success Rate</span>
                            <span class="result-value">\${((successCount/ipsInRange.length)*100).toFixed(1)}%</span>
                          </div>
                        </div>
                        \${currentSuccessfulRangeIPs.length > 0 ? \`
                          <div class="ip-grid">
                            \${currentSuccessfulRangeIPs.map(ip => \`
                              <div class="ip-item">
                                <div style="display: flex; align-items: center;">
                                  <div class="status-indicator success"></div>
                                  <span>\${ip}</span>
                                </div>
                                <button class="copy-btn" data-copy="\${ip}">Copy</button>
                              </div>
                            \`).join('')}
                          </div>
                          <button class="btn-primary" onclick="copySuccessfulRangeIPs()" style="margin-top: 1rem;">
                            Copy All Successful IPs
                          </button>
                        \` : ''}
                      </div>
                    \`;
                } else if (rangeIpToTest) {
                     showToast('Invalid IP Range format or empty range.');
                     rangeResultDiv.style.display = 'block';
                     rangeResultDiv.innerHTML = \`
                       <div class="result-card error">
                         <div class="result-header">
                           <div class="result-icon error">✕</div>
                           <h3 class="result-title">Invalid Range Format</h3>
                         </div>
                         <div class="result-content">
                           <p>Please use format: 192.168.1.0/24 or 192.168.1.1-255</p>
                         </div>
                       </div>
                     \`;
                }
            }

          } catch (err) {
            const errorMsg = \`
              <div class="result-card error">
                <div class="result-header">
                  <div class="result-icon error">✕</div>
                  <h3 class="result-title">General Error</h3>
                </div>
                <div class="result-content">
                  <p>\${err.message}</p>
                </div>
              </div>
            \`;
            if(resultDiv.innerHTML === '') resultDiv.innerHTML = errorMsg;
            else {
                rangeResultDiv.innerHTML = errorMsg;
                rangeResultDiv.style.display = 'block';
            }
          } finally {
            isChecking = false;
            checkBtn.disabled = false;
            btnText.textContent = "Start Analysis";
            checkBtn.classList.remove("loading");
            spinner.style.display = "none";
          }
        }

        function copySuccessfulRangeIPs() {
            if (currentSuccessfulRangeIPs.length > 0) {
                const textToCopy = currentSuccessfulRangeIPs.join('\\n');
                copyToClipboard(textToCopy, null, "All successful IPs copied!");
            } else {
                showToast("No successful IPs to copy.");
            }
        }

        async function fetchSingleIPCheck(proxyipWithOptionalPort, timeout = 8000) {
            const requestUrl = \`./check?proxyip=\${encodeURIComponent(proxyipWithOptionalPort)}&token=\${TEMP_TOKEN}&timeout=\${timeout}&_t=\${Date.now()}\`;
            const response = await fetch(requestUrl, { cache: 'no-store' });
            return await response.json();
        }

        async function checkAndDisplaySingleIP(proxyip, resultDiv) {
            const [checkData, ipInfo, riskInfo] = await Promise.all([
              fetchSingleIPCheck(proxyip),
              getIPInfo(proxyip.split(':')[0]),
              fetchScamalyticsRiskInfo(proxyip.split(':')[0])
            ]);

            const resultClass = checkData.success ? 'success' : 'error';
            const resultIcon = checkData.success ? '✓' : '✕';
            const resultTitle = checkData.success ? 'ProxyIP Valid' : 'ProxyIP Invalid';

            const riskInfoHTML = formatScamalyticsRiskInfo(riskInfo);

            const flagUrl = ipInfo && ipInfo.status === 'success' && ipInfo.countryCode
              ? \`https://flagcdn.com/w160/\${ipInfo.countryCode.toLowerCase()}.png\`
              : '';

            resultDiv.innerHTML = \`
              <div class="result-card \${resultClass}">
                \${flagUrl ? \`<div class="flag-glow-overlay" style="background-image: url('\${flagUrl}');"></div>\` : ''}
                <div class="result-header">
                  <div class="result-icon \${resultClass}">\${resultIcon}</div>
                  <h3 class="result-title">\${resultTitle}</h3>
                </div>
                <div class="result-content">
                  <div class="result-item">
                    <span class="result-label">IP Address</span>
                    \${createCopyButton(checkData.proxyIP)}
                  </div>
                  <div class="result-item">
                    <span class="result-label">Port</span>
                    \${createCopyButton(checkData.portRemote.toString())}
                  </div>
                  \${checkData.success && checkData.latency ? \`
                  <div class="result-item">
                    <span class="result-label">Latency (Ping)</span>
                    <span class="result-value" style="color: var(--accent-orange-light);">\${checkData.latency} ms</span>
                  </div>
                  \` : ''}
                  <div class="result-item">
                    <span class="result-label">Security Risk</span>
                    <span class="result-value">\${riskInfoHTML}</span>
                  </div>

                  \${ipInfo && ipInfo.status === 'success' ? \`
                    <div class="result-item">
                      <span class="result-label">Location</span>
                      <span class="result-value">\${[ipInfo.city, ipInfo.regionName, ipInfo.country].filter(Boolean).join(', ')}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">ISP (Datacenter)</span>
                      <span class="result-value">\${ipInfo.isp || 'N/A'}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Network (ASN)</span>
                      <span class="result-value">\${ipInfo.as || 'N/A'}</span>
                    </div>
                  \` : ''}
                  <div class="result-item">
                    <span class="result-label">Time is</span>
                    <span class="result-value">\${new Date(checkData.timestamp).toLocaleString()}</span>
                  </div>
                  \${checkData.error ? \`
                    <div class="result-item">
                      <span class="result-label">Error</span>
                      <span class="result-value" style="color: var(--error-color);">\${checkData.error}</span>
                    </div>
                  \` : ''}
                </div>
              </div>
            \`;
          }

        async function checkAndDisplayDomain(domain, resultDiv) {
          let portRemote = 443;
          let cleanDomain = domain;

          if (domain.includes('.tp')) {
            const portMatch = domain.match(/\\.tp(\\d+)\\./);
            if (portMatch) portRemote = parseInt(portMatch[1]);
            cleanDomain = domain.split('.tp')[0];
          } else if (domain.includes('[') && domain.includes(']:')) {
            portRemote = parseInt(domain.split(']:')[1]) || 443;
            cleanDomain = domain.split(']:')[0] + ']';
          } else if (domain.includes(':') && !domain.startsWith('[')) {
             const parts = domain.split(':');
             if (parts.length === 2) {
                cleanDomain = parts[0];
                const parsedPort = parseInt(parts[1]);
                if (!isNaN(parsedPort)) portRemote = parsedPort;
             }
          }

          resultDiv.innerHTML = \`
            <div class="result-card warning">
              <div class="result-header">
                <div class="result-icon warning">⟳</div>
                <h3 class="result-title">Resolving Domain...</h3>
              </div>
              <div class="result-content">
                <div class="result-item">
                  <span class="result-label">Domain</span>
                  \${createCopyButton(cleanDomain)}
                </div>
                <div class="result-item">
                  <span class="result-label">Status</span>
                  <span class="result-value">Processing...</span>
                </div>
              </div>
            </div>
          \`;

          const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=\${TEMP_TOKEN}&_t=\${Date.now()}\`, { cache: 'no-store' });
          const resolveData = await resolveResponse.json();

          if (!resolveData.success) {
            resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">✕</span> Resolution Failed</h3><p>\${resolveData.error || 'Domain resolution failed for ' + createCopyButton(cleanDomain)}</p></div>\`;
            return;
          }
          const ips = resolveData.ips;
          if (!ips || ips.length === 0) {
            resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">✕</span> No IPs Found</h3><p>No IPs found for \${createCopyButton(cleanDomain)}.</p></div>\`;
            return;
          }

          ipCheckResults.clear();
          resultDiv.innerHTML = \`
            <div class="result-card result-warning" id="domain-result-card">
              <h3><span class="status-icon-prefix" id="domain-card-icon">⟳</span> Domain Resolution Results</h3>
              <p><strong>Domain:</strong> \${createCopyButton(cleanDomain)}</p>
              <p><strong>Default Port for Test:</strong> \${portRemote}</p>
              <p><strong>IPs Found:</strong> \${ips.length}</p>
              <div class="ip-grid" id="ip-grid" style="max-height: 450px; overflow-y: auto; margin-top:10px; padding:5px;">
                \${ips.map((ip, index) => \`
                  <div class="ip-item" id="ip-item-\${index}">
                    <div>
                      \${createCopyButton(ip)}
                      <span id="ip-info-\${index}" style="font-size:0.8em;"></span>
                    </div>
                    <span class="status-icon" id="status-icon-\${index}">⟳</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          \`;
          resultDiv.classList.add('show');

          const checkPromises = ips.map((ip, index) => checkDomainIPWithIndex(ip, portRemote, index));
          const ipInfoPromises = ips.map((ip, index) => getIPInfoWithIndex(ip, index));

          await Promise.all([...checkPromises, ...ipInfoPromises]);

          const domainResultCardEl = document.getElementById('domain-result-card');
          const domainCardIconEl = document.getElementById('domain-card-icon');
          const resultCardHeader = domainResultCardEl.querySelector('h3');

          const validCount = Array.from(ipCheckResults.values()).filter(r => r.success).length;

          domainResultCardEl.classList.remove('result-warning', 'result-success', 'result-error');

          if (validCount === ips.length && ips.length > 0) {
            resultCardHeader.childNodes[1].nodeValue = ' All Domain IPs Valid';
            domainCardIconEl.className = 'status-icon-prefix success';
            domainCardIconEl.textContent = '✓';
            domainResultCardEl.classList.add('result-success');
          } else if (validCount === 0) {
            resultCardHeader.childNodes[1].nodeValue = ' All Domain IPs Invalid';
            domainCardIconEl.className = 'status-icon-prefix error';
            domainCardIconEl.textContent = '✕';
            domainResultCardEl.classList.add('result-error');
          } else {
            resultCardHeader.childNodes[1].nodeValue = \` Some Domain IPs Valid (\${validCount}/\${ips.length})\`;
            domainCardIconEl.className = 'status-icon-prefix warning';
            domainCardIconEl.textContent = '!!';
            domainResultCardEl.classList.add('result-warning');
          }
        }

        async function checkDomainIPWithIndex(ip, port, index) {
          const statusIcon = document.getElementById(\`status-icon-\${index}\`);
          try {
            const ipToTest = ip.includes(':') || ip.includes(']:') ? ip : \`\${ip}:\${port}\`;
            const result = await fetchSingleIPCheck(ipToTest);
            ipCheckResults.set(ipToTest, result);

            if (statusIcon) {
                 statusIcon.textContent = result.success ? \`✓ (\${result.latency} ms)\` : '✕';
                 statusIcon.style.color = result.success ? 'var(--status-success-icon)' : 'var(--status-error-icon)';
            }
          } catch (error) {
            if (statusIcon) {
                statusIcon.textContent = '!!';
                statusIcon.style.color = 'var(--status-warning-icon)';
            }
            ipCheckResults.set(ip, { success: false, error: error.message });
          }
        }

        async function getIPInfoWithIndex(ip, index) {
          try {
            const cleanIP = ip.split(':')[0];
            const riskInfo = await fetchScamalyticsRiskInfo(cleanIP);
            const infoElement = document.getElementById(\`ip-info-\${index}\`);

            if (infoElement && riskInfo && riskInfo.info && riskInfo.info.success) {
                const country = riskInfo.details.country || 'N/A';
                const as = riskInfo.details.asn ? 'AS' + riskInfo.details.asn : 'N/A';
                const score = riskInfo.info.fraud_score !== undefined ? riskInfo.info.fraud_score : 0;
                const risk = riskInfo.info.risk || 'low';

                let badgeClass = 'success';
                if (risk === 'medium') badgeClass = 'warning';
                else if (risk === 'high' || risk === 'very high') badgeClass = 'error';

                infoElement.innerHTML = \` <span style="color: var(--text-light);">(\${country} - \${as})</span> <span class="badge \${badgeClass}" style="padding: 0.1rem 0.4rem; font-size: 0.72em; margin-left: 4px;">Score: \${score}</span>\`;
            }
          } catch (error) { }
        }

        async function getIPInfo(ip) {
          try {
            const cleanIP = ip.replace(/[\[\]]/g, '');
            const response = await fetch(\`./ip-info?ip=\${encodeURIComponent(cleanIP)}&token=\${TEMP_TOKEN}&_t=\${Date.now()}\`, { cache: 'no-store' });
            return await response.json();
          } catch (error) { return null; }
        }

        function formatIPInfo(ipInfo, isShort = false) {
          if (!ipInfo || ipInfo.status !== 'success') { return ''; }
          const country = ipInfo.country || 'N/A';
          const as = ipInfo.as || 'N/A';
          const colorStyle = \`color: var(--text-light);\`;
          if(isShort) return \`<span style="\${colorStyle}">(\${country} - \${as.substring(0,15)}...)</span>\`;
          return \`<span style="font-size:0.85em; \${colorStyle}">(\${country} - \${as})</span>\`;
        }
      </script>
    </body>
  </html>
  `;
  return new Response(html, {
    headers: { "content-type": "text/html;charset=UTF-8" },
  });
}

// -------------------- TLS ENGINE --------------------
const e = 769,
  t = 771,
  n = 772,
  r = 20,
  i = 21,
  s = 22,
  a = 23,
  h = 1,
  c = 2,
  o = 4,
  l = 8,
  f = 11,
  u = 12,
  y = 13,
  p = 14,
  w = 15,
  d = 16,
  g = 20,
  k = 24,
  v = 0,
  A = 10,
  S = 11,
  m = 13,
  b = 16,
  C = 43,
  H = 45,
  T = 51,
  E = 0,
  L = new TextEncoder(),
  K = new TextDecoder(),
  P = new Uint8Array(0),
  U = new Map(
    Object.entries({
      TLS_AES_128_GCM_SHA256: { id: 4865, keyLen: 16, ivLen: 12, hash: "SHA-256", tls13: !0 },
      TLS_AES_256_GCM_SHA384: { id: 4866, keyLen: 32, ivLen: 12, hash: "SHA-384", tls13: !0 },
      TLS_CHACHA20_POLY1305_SHA256: {
        id: 4867,
        keyLen: 32,
        ivLen: 12,
        hash: "SHA-256",
        tls13: !0,
        chacha: !0,
      },
      TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256: {
        id: 49199,
        keyLen: 16,
        ivLen: 4,
        hash: "SHA-256",
        kex: "ECDHE",
      },
      TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384: {
        id: 49200,
        keyLen: 32,
        ivLen: 4,
        hash: "SHA-384",
        kex: "ECDHE",
      },
      TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: {
        id: 52392,
        keyLen: 32,
        ivLen: 12,
        hash: "SHA-256",
        kex: "ECDHE",
        chacha: !0,
      },
      TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: {
        id: 49195,
        keyLen: 16,
        ivLen: 4,
        hash: "SHA-256",
        kex: "ECDHE",
      },
      TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: {
        id: 49196,
        keyLen: 32,
        ivLen: 4,
        hash: "SHA-384",
        kex: "ECDHE",
      },
      TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: {
        id: 52393,
        keyLen: 32,
        ivLen: 12,
        hash: "SHA-256",
        kex: "ECDHE",
        chacha: !0,
      },
    }).map(([, e]) => [e.id, e]),
  ),
  I = new Map([
    [29, "X25519"],
    [23, "P-256"],
  ]),
  x = [2052, 2053, 2054, 1025, 1281, 1537, 1027, 1283, 1539],
  _ = (...e) => {
    const t = (e) => {
      const n = [];
      for (const r of e)
        r instanceof Uint8Array
          ? n.push(...r)
          : Array.isArray(r)
            ? n.push(...t(r))
            : "number" === typeof r && n.push(r);
      return n;
    };
    return new Uint8Array(t(e));
  },
  B = (e) => [(e >> 8) & 255, 255 & e],
  R = (e, t) => (e[t] << 8) | e[t + 1],
  M = (e, t) => (e[t] << 16) | (e[t + 1] << 8) | e[t + 2],
  W = (...e) => {
    const t = e.filter((e) => e && e.length > 0),
      n = t.reduce((e, t) => e + t.length, 0),
      r = new Uint8Array(n);
    let i = 0;
    for (const e of t) r.set(e, i), (i += e.length);
    return r;
  },
  D = (e) => crypto.getRandomValues(new Uint8Array(e)),
  N = (e, t) => {
    if (!e || !t || e.length !== t.length) return !1;
    let n = 0;
    for (let r = 0; r < e.length; r++) n |= e[r] ^ t[r];
    return 0 === n;
  },
  q = (e) => ("SHA-512" === e ? 64 : "SHA-384" === e ? 48 : 32);
async function $(e, t, n) {
  const r = await crypto.subtle.importKey("raw", t, { name: "HMAC", hash: e }, !1, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", r, n));
}
async function G(e, t) {
  return new Uint8Array(await crypto.subtle.digest(e, t));
}
async function V(e, t, n, r, i = "SHA-256") {
  const s = W(L.encode(t), n);
  let a = new Uint8Array(0),
    h = s;
  for (; a.length < r; ) {
    h = await $(i, e, h);
    const t = await $(i, e, W(h, s));
    a = W(a, t);
  }
  return a.slice(0, r);
}
async function X(e, t, n) {
  return (t && t.length) || (t = new Uint8Array(q(e))), $(e, t, n);
}
async function O(e, t, n, r, i) {
  const s = L.encode("tls13 " + n);
  return (async function (e, t, n, r) {
    const i = q(e),
      s = Math.ceil(r / i);
    let a = new Uint8Array(0),
      h = new Uint8Array(0);
    for (let r = 1; r <= s; r++) (h = await $(e, t, W(h, n, [r]))), (a = W(a, h));
    return a.slice(0, r);
  })(e, t, _(B(i), s.length, s, r.length, r), i);
}
async function F(e = "P-256") {
  if ("X25519" === e) {
    const e = await crypto.subtle.generateKey({ name: "X25519" }, !0, ["deriveBits"]);
    return {
      keyPair: e,
      publicKeyRaw: new Uint8Array(await crypto.subtle.exportKey("raw", e.publicKey)),
    };
  }
  const t = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: e }, !0, ["deriveBits"]);
  return {
    keyPair: t,
    publicKeyRaw: new Uint8Array(await crypto.subtle.exportKey("raw", t.publicKey)),
  };
}
async function Y(e, t, n = "P-256") {
  if ("X25519" === n) {
    const n = await crypto.subtle.importKey("raw", t, { name: "X25519" }, !1, []);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: "X25519", public: n }, e, 256));
  }
  const r = await crypto.subtle.importKey("raw", t, { name: "ECDH", namedCurve: n }, !1, []),
    i = "P-384" === n ? 384 : "P-521" === n ? 528 : 256;
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: r }, e, i));
}
async function j(e, t, n, r) {
  const i = await crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, ["encrypt"]);
  return new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: t, additionalData: r, tagLength: 128 },
      i,
      n,
    ),
  );
}
async function z(e, t, n, r) {
  const i = await crypto.subtle.importKey("raw", e, { name: "AES-GCM" }, !1, ["decrypt"]);
  return new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: t, additionalData: r, tagLength: 128 },
      i,
      n,
    ),
  );
}
function J(e, t) {
  return ((e << t) | (e >>> (32 - t))) >>> 0;
}
function Q(e, t, n, r, i) {
  (e[t] = (e[t] + e[n]) >>> 0),
    (e[i] = J(e[i] ^ e[t], 16)),
    (e[r] = (e[r] + e[i]) >>> 0),
    (e[n] = J(e[n] ^ e[r], 12)),
    (e[t] = (e[t] + e[n]) >>> 0),
    (e[i] = J(e[i] ^ e[t], 8)),
    (e[r] = (e[r] + e[i]) >>> 0),
    (e[n] = J(e[n] ^ e[r], 7));
}
function Z(e, t, n) {
  const r = new Uint32Array(16);
  (r[0] = 1634760805), (r[1] = 857760878), (r[2] = 2036477234), (r[3] = 1797285236);
  const i = new DataView(e.buffer, e.byteOffset, e.byteLength);
  for (let e = 0; e < 8; e++) r[4 + e] = i.getUint32(4 * e, !0);
  r[12] = t;
  const s = new DataView(n.buffer, n.byteOffset, n.byteLength);
  (r[13] = s.getUint32(0, !0)), (r[14] = s.getUint32(4, !0)), (r[15] = s.getUint32(8, !0));
  const a = new Uint32Array(r);
  for (let e = 0; e < 10; e++)
    Q(a, 0, 4, 8, 12),
      Q(a, 1, 5, 9, 13),
      Q(a, 2, 6, 10, 14),
      Q(a, 3, 7, 11, 15),
      Q(a, 0, 5, 10, 15),
      Q(a, 1, 6, 11, 12),
      Q(a, 2, 7, 8, 13),
      Q(a, 3, 4, 9, 14);
  for (let e = 0; e < 16; e++) a[e] = (a[e] + r[e]) >>> 0;
  return new Uint8Array(a.buffer.slice(0));
}
function ee(e, t, n) {
  const r = new Uint8Array(n.length);
  let i = 1;
  for (let s = 0; s < n.length; s += 64) {
    const a = Z(e, i++, t),
      h = Math.min(64, n.length - s);
    for (let e = 0; e < h; e++) r[s + e] = n[s + e] ^ a[e];
  }
  return r;
}
function te(e, t) {
  const n = (function (e) {
      const t = new Uint8Array(e);
      return (
        (t[3] &= 15),
        (t[7] &= 15),
        (t[11] &= 15),
        (t[15] &= 15),
        (t[4] &= 252),
        (t[8] &= 252),
        (t[12] &= 252),
        t
      );
    })(e.slice(0, 16)),
    r = e.slice(16, 32);
  let i = [0n, 0n, 0n, 0n, 0n];
  const s = [
    0x3ffffffn & BigInt(n[0] | (n[1] << 8) | (n[2] << 16) | (n[3] << 24)),
    0x3ffffffn & BigInt((n[3] >> 2) | (n[4] << 6) | (n[5] << 14) | (n[6] << 22)),
    0x3ffffffn & BigInt((n[6] >> 4) | (n[7] << 4) | (n[8] << 12) | (n[9] << 20)),
    0x3ffffffn & BigInt((n[9] >> 6) | (n[10] << 2) | (n[11] << 10) | (n[12] << 18)),
    0x3ffffffn & BigInt(n[13] | (n[14] << 8) | (n[15] << 16)),
  ];
  for (let e = 0; e < t.length; e += 16) {
    const n = t.slice(e, e + 16),
      r = new Uint8Array(17);
    r.set(n),
      (r[n.length] = 1),
      (i[0] += BigInt(r[0] | (r[1] << 8) | (r[2] << 16) | ((3 & r[3]) << 24))),
      (i[1] += BigInt((r[3] >> 2) | (r[4] << 6) | (r[5] << 14) | ((15 & r[6]) << 22))),
      (i[2] += BigInt((r[6] >> 4) | (r[7] << 4) | (r[8] << 12) | ((63 & r[9]) << 20))),
      (i[3] += BigInt((r[9] >> 6) | (r[10] << 2) | (r[11] << 10) | (r[12] << 18))),
      (i[4] += BigInt(r[13] | (r[14] << 8) | (r[15] << 16) | (r[16] << 24)));
    const a = [0n, 0n, 0n, 0n, 0n];
    for (let e = 0; e < 5; e++)
      for (let t = 0; t < 5; t++) {
        const n = e + t;
        n < 5 ? (a[n] += i[e] * s[t]) : (a[n - 5] += i[e] * s[t] * 5n);
      }
    let h = 0n;
    for (let e = 0; e < 5; e++) (a[e] += h), (i[e] = 0x3ffffffn & a[e]), (h = a[e] >> 26n);
    (i[0] += 5n * h), (h = i[0] >> 26n), (i[0] &= 0x3ffffffn), (i[1] += h);
  }
  let a = i[0] | (i[1] << 26n) | (i[2] << 52n) | (i[3] << 78n) | (i[4] << 104n);
  a = (a + r.reduce((e, t, n) => e + (BigInt(t) << BigInt(8 * n)), 0n)) & ((1n << 128n) - 1n);
  const h = new Uint8Array(16);
  for (let e = 0; e < 16; e++) h[e] = Number((a >> BigInt(8 * e)) & 0xffn);
  return h;
}
function ne(e, t, n, r) {
  const i = Z(e, 0, t).slice(0, 32),
    s = ee(e, t, n),
    a = (16 - (r.length % 16)) % 16,
    h = (16 - (s.length % 16)) % 16,
    c = new Uint8Array(r.length + a + s.length + h + 16);
  c.set(r, 0), c.set(s, r.length + a);
  const o = new DataView(c.buffer, r.length + a + s.length + h);
  o.setBigUint64(0, BigInt(r.length), !0), o.setBigUint64(8, BigInt(s.length), !0);
  const l = te(i, c);
  return W(s, l);
}
function re(e, t, n, r) {
  if (n.length < 16) throw new Error("Ciphertext too short");
  const i = n.slice(-16),
    s = n.slice(0, -16),
    a = Z(e, 0, t).slice(0, 32),
    h = (16 - (r.length % 16)) % 16,
    c = (16 - (s.length % 16)) % 16,
    o = new Uint8Array(r.length + h + s.length + c + 16);
  o.set(r, 0), o.set(s, r.length + h);
  const l = new DataView(o.buffer, r.length + h + s.length + c);
  l.setBigUint64(0, BigInt(r.length), !0), l.setBigUint64(8, BigInt(s.length), !0);
  const f = te(a, o);
  let u = 0;
  for (let e = 0; e < 16; e++) u |= i[e] ^ f[e];
  if (0 !== u) throw new Error("ChaCha20-Poly1305 authentication failed");
  return ee(e, t, s);
}
function ie(e, n, r = t) {
  return _(e, B(r), B(n.length), n);
}
function se(e, t) {
  return _(e, ((e) => [(e >> 16) & 255, (e >> 8) & 255, 255 & e])(t.length), t);
}
class ae {
  constructor() {
    this.buffer = new Uint8Array(0);
  }
  feed(e) {
    this.buffer = W(this.buffer, e);
  }
  next() {
    if (this.buffer.length < 5) return null;
    const e = this.buffer[0],
      t = R(this.buffer, 1),
      n = R(this.buffer, 3);
    if (this.buffer.length < 5 + n) return null;
    const r = this.buffer.slice(5, 5 + n);
    return (
      (this.buffer = this.buffer.slice(5 + n)), { type: e, version: t, length: n, fragment: r }
    );
  }
}
class he {
  constructor() {
    this.buffer = new Uint8Array(0);
  }
  feed(e) {
    this.buffer = W(this.buffer, e);
  }
  next() {
    if (this.buffer.length < 4) return null;
    const e = this.buffer[0],
      t = M(this.buffer, 1);
    if (this.buffer.length < 4 + t) return null;
    const n = this.buffer.slice(4, 4 + t),
      r = this.buffer.slice(0, 4 + t);
    return (this.buffer = this.buffer.slice(4 + t)), { type: e, length: t, body: n, raw: r };
  }
}
function ce(e) {
  let t = 0;
  const r = R(e, t);
  t += 2;
  const i = e.slice(t, t + 32);
  t += 32;
  const s = e[t++],
    a = e.slice(t, t + s);
  t += s;
  const h = R(e, t);
  t += 2;
  const c = e[t++];
  let o = r,
    l = null,
    f = null;
  if (t < e.length) {
    const n = R(e, t);
    t += 2;
    const r = t + n;
    for (; t + 4 <= r; ) {
      const n = R(e, t);
      t += 2;
      const r = R(e, t);
      t += 2;
      const i = e.slice(t, t + r);
      if (((t += r), n === C && r >= 2)) o = R(i, 0);
      else if (n === T && r >= 4) {
        const e = R(i, 0),
          t = R(i, 2);
        l = { group: e, key: i.slice(4, 4 + t) };
      } else n === b && r >= 3 && (f = K.decode(i.slice(3, 3 + i[2])));
    }
  }
  const u = new Uint8Array([
    207, 33, 173, 116, 229, 154, 97, 17, 190, 29, 140, 2, 30, 101, 184, 145, 194, 162, 17, 22, 122,
    187, 140, 94, 7, 158, 9, 226, 200, 168, 51, 156,
  ]);
  return {
    version: r,
    serverRandom: i,
    sessionId: a,
    cipherSuite: h,
    compression: c,
    selectedVersion: o,
    keyShare: l,
    alpn: f,
    isHRR: N(i, u),
    isTls13: o === n,
  };
}
function oe(e) {
  let t = 0;
  t++;
  const n = R(e, t);
  t += 2;
  const r = e[t++];
  return { namedCurve: n, serverPublicKey: e.slice(t, t + r) };
}
function le(e, t = 0) {
  let n = 0;
  if (t) {
    const t = e[n++];
    n += t;
  }
  if (n + 3 > e.length) return null;
  const r = M(e, n);
  if (((n += 3), !r || n + 3 > e.length)) return null;
  const i = M(e, n);
  return (n += 3), i ? e.slice(n, n + i) : null;
}
function fe(e) {
  const t = { alpn: null };
  let n = 2;
  const r = 2 + R(e, 0);
  for (; n + 4 <= r; ) {
    const r = R(e, n);
    n += 2;
    const i = R(e, n);
    if (((n += 2), r === b && i >= 3)) {
      const r = e[n + 2];
      r > 0 && n + 3 + r <= n + i && (t.alpn = K.decode(e.slice(n + 3, n + 3 + r)));
    }
    n += i;
  }
  return t;
}
const F0 = (e) => {
    if (
      ((e = String(e ?? "").trim()),
      "[" === e[0] && "]" === e[e.length - 1] && (e = e.slice(1, -1)),
      !e || e.includes(":"))
    )
      return "";
    const t = e.split(".");
    if (4 !== t.length) return e;
    for (const n of t) {
      if ("" === n || n.length > 3) return e;
      let t = 0;
      for (let r = 0; r < n.length; r++) {
        const i = n.charCodeAt(r) - 48;
        if (i < 0 || i > 9) return e;
        t = 10 * t + i;
      }
      if (t > 255) return e;
    }
    return "";
  },
  Z0 = (e) => e && 1 === e[0] && 112 === e[1];
function ue(e, n, r, { tls13: i = !0, tls12: s = !0, alpn: a = null } = {}) {
  n = F0(n);
  const c = [];
  i && c.push(4865, 4866, 4867), s && c.push(49199, 49200, 52392, 49195, 49196, 52393);
  const o = _(...c.flatMap(B)),
    l = [_(255, 1, 0, 1, 0)];
  if (n) {
    const e = L.encode(n),
      t = _(0, B(e.length), e);
    l.push(_(B(v), B(t.length + 2), B(t.length), t));
  }
  l.push(_(B(S), 0, 2, 1, 0)), l.push(_(B(A), 0, 6, 0, 4, 0, 29, 0, 23));
  const f = _(...x.flatMap(B));
  l.push(_(B(m), B(f.length + 2), B(f.length), f));
  const u = Array.isArray(a) ? a.filter(Boolean) : a ? [a] : [];
  if (u.length) {
    const e = W(
      ...u.map((e) => {
        const t = L.encode(e);
        return _(t.length, t);
      }),
    );
    l.push(_(B(b), B(e.length + 2), B(e.length), e));
  }
  if (i && r) {
    let e;
    if (
      (l.push(s ? _(B(C), 0, 5, 4, 3, 4, 3, 3) : _(B(C), 0, 3, 2, 3, 4)),
      l.push(_(B(H), 0, 2, 1, 1)),
      r?.x25519 && r?.p256)
    )
      e = W(_(0, 29, B(r.x25519.length), r.x25519), _(0, 23, B(r.p256.length), r.p256));
    else if (r?.x25519) e = _(0, 29, B(r.x25519.length), r.x25519);
    else if (r?.p256) e = _(0, 23, B(r.p256.length), r.p256);
    else {
      if (!(r instanceof Uint8Array)) throw new Error("Invalid keyShares");
      e = _(0, 23, B(r.length), r);
    }
    l.push(_(B(T), B(e.length + 2), B(e.length), e));
  }
  const y = W(...l);
  return se(h, _(B(t), e, 0, B(o.length), o, 1, 0, B(y.length), y));
}
const ye = (e) => {
    const t = new Uint8Array(8);
    return new DataView(t.buffer).setBigUint64(0, e, !1), t;
  },
  pe = (e, t) => {
    const n = e.slice(),
      r = ye(t);
    for (let e = 0; e < 8; e++) n[n.length - 8 + e] ^= r[e];
    return n;
  },
  we = (e, t, n, r) => Promise.all([O(e, t, "key", P, n), O(e, t, "iv", P, r)]);
class TlsClient {
  constructor(e, t = {}) {
    if (
      ((this.socket = e),
      (this.serverName = t.serverName || ""),
      (this.supportTls13 = !1 !== t.tls13),
      (this.supportTls12 = !1 !== t.tls12),
      !this.supportTls13 && !this.supportTls12)
    )
      throw new Error("At least one TLS version must be enabled");
    (this.alpnProtocols = Array.isArray(t.alpn) ? t.alpn : t.alpn ? [t.alpn] : null),
      (this.timeout = t.timeout ?? 3e4),
      (this.clientRandom = D(32)),
      (this.serverRandom = null),
      (this.handshakeChunks = []),
      (this.handshakeComplete = !1),
      (this.negotiatedAlpn = null),
      (this.cipherSuite = null),
      (this.cipherConfig = null),
      (this.isTls13 = !1),
      (this.masterSecret = null),
      (this.handshakeSecret = null),
      (this.clientWriteKey = null),
      (this.serverWriteKey = null),
      (this.clientWriteIv = null),
      (this.serverWriteIv = null),
      (this.clientHandshakeKey = null),
      (this.serverHandshakeKey = null),
      (this.clientHandshakeIv = null),
      (this.serverHandshakeIv = null),
      (this.clientAppKey = null),
      (this.serverAppKey = null),
      (this.clientAppIv = null),
      (this.serverAppIv = null),
      (this.clientSeqNum = 0n),
      (this.serverSeqNum = 0n),
      (this.recordParser = new ae()),
      (this.handshakeParser = new he()),
      (this.keyPairs = new Map()),
      (this.ecdhKeyPair = null),
      (this.sawCert = !1);
  }
  recordHandshake(e) {
    this.handshakeChunks.push(e);
  }
  transcript() {
    return 1 === this.handshakeChunks.length ? this.handshakeChunks[0] : W(...this.handshakeChunks);
  }
  getCipherConfig(e) {
    return U.get(e) || null;
  }
  async readChunk(e) {
    if (!this.timeout) return e.read();
    let t;
    const n = e.read(),
      r = await Promise.race([n, new Promise((e) => (t = setTimeout(e, this.timeout, 0)))]).finally(
        () => clearTimeout(t),
      );
    if (r) return r;
    try {
      await e.cancel("TLS read timeout");
    } catch {}
    try {
      await n;
    } catch {}
    throw new Error("TLS read timeout");
  }
  async pr(e, t, n) {
    for (;;) {
      let r;
      for (; (r = this.recordParser.next()); ) if (await t(r)) return;
      const { value: i, done: s } = await this.readChunk(e);
      if (s) throw new Error(n);
      this.recordParser.feed(e);
    }
  }
  async ph(e, t, n) {
    for (let e; (e = this.handshakeParser.next()); ) if (await t(e)) return;
    return this.pr(
      e,
      async (e) => {
        if (e.type === i) {
          if (Z0(e.fragment)) return;
          throw new Error(`TLS Alert: ${e.fragment[1]}`);
        }
        if (e.type === s) {
          this.handshakeParser.feed(e.fragment);
          for (let e; (e = this.handshakeParser.next()); ) if (await t(e)) return 1;
        }
      },
      n,
    );
  }
  async acceptCertificate(e) {
    if (!e?.length) throw new Error("Empty certificate");
    this.sawCert = !0;
  }
  async handshake() {
    const [t, n] = await Promise.all([F("P-256"), F("X25519")]);
    (this.keyPairs = new Map([
      [23, t],
      [29, n],
    ])),
      (this.ecdhKeyPair = t.keyPair);
    const r = this.socket.readable.getReader(),
      i = this.socket.writable.getWriter();
    try {
      const a = ue(
        this.clientRandom,
        this.serverName,
        { x25519: n.publicKeyRaw, p256: t.publicKeyRaw },
        { tls13: this.supportTls13, tls12: this.supportTls12, alpn: this.alpnProtocols },
      );
      this.recordHandshake(a), await i.write(ie(s, a, e));
      const h = await this.receiveServerHello(r);
      if (h.isHRR) throw new Error("HelloRetryRequest is not supported by TLSClientMini");
      if (h.keyShare?.group && this.keyPairs.has(h.keyShare.group)) {
        const e = this.keyPairs.get(h.keyShare.group);
        this.ecdhKeyPair = e.keyPair;
      }
      h.isTls13 ? await this.handshakeTls13(r, i, h) : await this.handshakeTls12(r, i),
        (this.handshakeComplete = !0);
    } finally {
      r.releaseLock(), i.releaseLock();
    }
  }
  async receiveServerHello(e) {
    for (;;) {
      const { value: t, done: n } = await this.readChunk(e);
      if (n) throw new Error("Connection closed waiting for ServerHello");
      let r;
      for (this.recordParser.feed(t); (r = this.recordParser.next()); ) {
        if (r.type === i) {
          if (Z0(r.fragment)) continue;
          throw new Error(`TLS Alert: level=${r.fragment[0]}, desc=${r.fragment[1]}`);
        }
        if (r.type !== s) continue;
        let e;
        for (this.handshakeParser.feed(r.fragment); (e = this.handshakeParser.next()); ) {
          if (e.type !== c) continue;
          this.recordHandshake(e.raw);
          const t = ce(e.body);
          if (
            ((this.serverRandom = t.serverRandom),
            (this.cipherSuite = t.cipherSuite),
            (this.cipherConfig = this.getCipherConfig(t.cipherSuite)),
            (this.isTls13 = t.isTls13),
            (this.negotiatedAlpn = t.alpn || null),
            !this.cipherConfig)
          )
            throw new Error(`Unsupported cipher suite: 0x${t.cipherSuite.toString(16)}`);
          return t;
        }
      }
    }
  }
  async handshakeTls12(e, t) {
    let n = null,
      a = !1;
    if (
      (await this.ph(
        e,
        async (e) => {
          switch (e.type) {
            case f: {
              this.recordHandshake(e.raw);
              const t = le(e.body, 1);
              if (!t) throw new Error("Missing TLS 1.2 certificate");
              await this.acceptCertificate(t);
              break;
            }
            case u:
              this.recordHandshake(e.raw), (n = oe(e.body));
              break;
            case p:
              return this.recordHandshake(e.raw), (a = !0), 1;
            case y:
              throw new Error("Client certificate is not supported");
            default:
              this.recordHandshake(e.raw);
          }
        },
        "Connection closed during TLS 1.2 handshake",
      ),
      !this.sawCert)
    )
      throw new Error("Missing TLS 1.2 leaf certificate");
    if (!n) throw new Error("Missing TLS 1.2 ServerKeyExchange");
    const h = I.get(n.namedCurve);
    if (!h) throw new Error(`Unsupported named curve: 0x${n.namedCurve.toString(16)}`);
    const c = this.keyPairs.get(n.namedCurve);
    if (!c) throw new Error(`Missing key pair for curve: 0x${n.namedCurve.toString(16)}`);
    const o = await Y(c.keyPair.privateKey, n.serverPublicKey, h),
      l = se(d, _(c.publicKeyRaw.length, c.publicKeyRaw));
    this.recordHandshake(l);
    const w = this.cipherConfig.hash;
    this.masterSecret = await V(o, "master secret", W(this.clientRandom, this.serverRandom), 48, w);
    const k = this.cipherConfig.keyLen,
      v = this.cipherConfig.ivLen,
      A = await V(
        this.masterSecret,
        "key expansion",
        W(this.serverRandom, this.clientRandom),
        2 * k + 2 * v,
        w,
      );
    (this.clientWriteKey = A.slice(0, k)),
      (this.serverWriteKey = A.slice(k, 2 * k)),
      (this.clientWriteIv = A.slice(2 * k, 2 * k + v)),
      (this.serverWriteIv = A.slice(2 * k + v, 2 * k + 2 * v)),
      await t.write(ie(s, l)),
      await t.write(ie(r, _(1)));
    const S = await V(this.masterSecret, "client finished", await G(w, this.transcript()), 12, w),
      m = se(g, S);
    this.recordHandshake(m), await t.write(ie(s, await this.encryptTls12(m, s)));
    let b = !1;
    await this.pr(
      e,
      async (e) => {
        if (e.type === i) {
          if (Z0(e.fragment)) return;
          throw new Error(`TLS Alert: ${e.fragment[1]}`);
        }
        if (e.type === r) return void (b = !0);
        if (e.type !== s || !b) return;
        const t = await this.decryptTls12(e.fragment, s);
        if (t[0] !== g) return;
        const n = M(t, 1),
          a = t.slice(4, 4 + n),
          h = await V(this.masterSecret, "server finished", await G(w, this.transcript()), 12, w);
        if (!N(a, h)) throw new Error("TLS 1.2 server Finished verify failed");
        return 1;
      },
      "Connection closed waiting for TLS 1.2 Finished",
    );
  }
  async handshakeTls13(e, t, n) {
    const h = I.get(n.keyShare?.group);
    if (!h || !n.keyShare?.key?.length) throw new Error("Missing TLS 1.3 key_share");
    const c = this.cipherConfig.hash,
      o = q(c),
      u = this.cipherConfig.keyLen,
      p = this.cipherConfig.ivLen,
      d = await Y(this.ecdhKeyPair.privateKey, n.keyShare.key, h),
      k = await X(c, null, new Uint8Array(o)),
      v = await O(c, k, "derived", await G(c, P), o);
    this.handshakeSecret = await X(c, v, d);
    const A = await G(c, this.transcript()),
      S = await O(c, this.handshakeSecret, "c hs traffic", A, o),
      m = await O(c, this.handshakeSecret, "s hs traffic", A, o);
    ([this.clientHandshakeKey, this.clientHandshakeIv] = await we(c, S, u, p)),
      ([this.serverHandshakeKey, this.serverHandshakeIv] = await we(c, m, u, p));
    const b = await O(c, m, "finished", P, o);
    let C = !1;
    const H = async (e) => {
      switch (e.type) {
        case l: {
          const t = fe(e.body);
          t.alpn && (this.negotiatedAlpn = t.alpn), this.recordHandshake(e.raw);
          break;
        }
        case f: {
          const t = le(e.body);
          if (!t) throw new Error("Missing TLS 1.3 certificate");
          await this.acceptCertificate(t), this.recordHandshake(e.raw);
          break;
        }
        case y:
          throw new Error("Client certificate is not supported");
        case w:
          this.recordHandshake(e.raw);
          break;
        case g: {
          const t = await $(c, b, await G(c, this.transcript()));
          if (!N(t, e.body)) throw new Error("TLS 1.3 server Finished verify failed");
          this.recordHandshake(e.raw), (C = !0);
          break;
        }
        default:
          this.recordHandshake(e.raw);
      }
    };
    await this.pr(
      e,
      async (e) => {
        if (e.type === r || e.type === s) return;
        if (e.type === i) {
          if (Z0(e.fragment)) return;
          throw new Error(`TLS Alert: ${e.fragment[1]}`);
        }
        if (e.type !== a) return;
        const t = await this.decryptTls13Handshake(e.fragment),
          n = t[t.length - 1],
          h = t.slice(0, -1);
        if (n === s) {
          this.handshakeParser.feed(h);
          for (let e; (e = this.handshakeParser.next()); ) if ((await H(e), C)) return 1;
        }
      },
      "Connection closed during TLS 1.3 handshake",
    );
    const T = await G(c, this.transcript()),
      E = await O(c, this.handshakeSecret, "derived", await G(c, P), o),
      L = await X(c, E, new Uint8Array(o)),
      K = await O(c, L, "c ap traffic", T, o),
      U = await O(c, L, "s ap traffic", T, o);
    ([this.clientAppKey, this.clientAppIv] = await we(c, K, u, p)),
      ([this.serverAppKey, this.serverAppIv] = await we(c, U, u, p));
    const x = await O(c, S, "finished", P, o),
      _ = await $(c, x, await G(c, this.transcript())),
      B = se(g, _);
    this.recordHandshake(B),
      await t.write(ie(a, await this.encryptTls13Handshake(W(B, [s])))),
      (this.clientSeqNum = 0n),
      (this.serverSeqNum = 0n);
  }
  async encryptTls12(e, n) {
    const r = this.clientSeqNum++,
      i = ye(r),
      s = W(i, [n], B(t), B(e.length));
    if (this.cipherConfig.chacha) {
      const t = pe(this.clientWriteIv, r);
      return ne(this.clientWriteKey, t, e, s);
    }
    const a = D(8);
    return W(a, await j(this.clientWriteKey, W(this.clientWriteIv, a), e, s));
  }
  async decryptTls12(e, n) {
    const r = this.serverSeqNum++,
      i = ye(r);
    if (this.cipherConfig.chacha) {
      const s = pe(this.serverWriteIv, r);
      return re(this.serverWriteKey, s, e, W(i, [n], B(t), B(e.length - 16)));
    }
    const s = e.slice(0, 8),
      a = e.slice(8);
    return z(this.serverWriteKey, W(this.serverWriteIv, s), a, W(i, [n], B(t), B(a.length - 16)));
  }
  async encryptTls13Handshake(e) {
    const t = pe(this.clientHandshakeIv, this.clientSeqNum++),
      n = _(a, 3, 3, B(e.length + 16));
    return this.cipherConfig.chacha
      ? ne(this.clientHandshakeKey, t, e, n)
      : j(this.clientHandshakeKey, t, e, n);
  }
  async decryptTls13Handshake(e) {
    const t = pe(this.serverHandshakeIv, this.serverSeqNum++),
      n = _(a, 3, 3, B(e.length)),
      r = await (this.cipherConfig.chacha
        ? re(this.serverHandshakeKey, t, e, n)
        : z(this.serverHandshakeKey, t, e, n));
    let i = r.length - 1;
    for (; i >= 0 && !r[i]; ) i--;
    return i < 0 ? P : r.slice(0, i + 1);
  }
  async encryptTls13(e) {
    const t = W(e, [a]),
      n = pe(this.clientAppIv, this.clientSeqNum++),
      r = _(a, 3, 3, B(t.length + 16));
    return this.cipherConfig.chacha
      ? ne(this.clientAppKey, n, t, r)
      : j(this.clientAppKey, n, t, r);
  }
  async decryptTls13(e) {
    const t = pe(this.serverAppIv, this.serverSeqNum++),
      n = _(a, 3, 3, B(e.length)),
      r = this.cipherConfig.chacha
        ? await re(this.serverAppKey, t, e, n)
        : await z(this.serverAppKey, t, e, n);
    let i = r.length - 1;
    for (; i >= 0 && !r[i]; ) i--;
    return i < 0 ? { data: P, type: 0 } : { data: r.slice(0, i), type: r[i] };
  }
  async write(e) {
    if (!this.handshakeComplete) throw new Error("Handshake not complete");
    const t = this.socket.writable.getWriter();
    try {
      this.isTls13
        ? await t.write(ie(a, await this.encryptTls13(e)))
        : await t.write(ie(a, await this.encryptTls12(e, a)));
    } finally {
      t.releaseLock();
    }
  }
  async read() {
    for (;;) {
      let e;
      for (; (e = this.recordParser.next()); ) {
        if (e.type === i) {
          if (e.fragment[1] === E) return null;
          throw new Error(`TLS Alert: ${e.fragment[1]}`);
        }
        if (e.type !== a) continue;
        if (!this.isTls13) return this.decryptTls12(e.fragment, a);
        const { data: t, type: n } = await this.decryptTls13(e.fragment);
        if (n === a) return t;
        if (n === i) {
          if (t[1] === E) return null;
          throw new Error(`TLS Alert: ${t[1]}`);
        }
        if (n !== s) continue;
        let r;
        for (this.handshakeParser.feed(t); (r = this.handshakeParser.next()); )
          if (r.type !== o && r.type === k)
            throw new Error("TLS 1.3 KeyUpdate is not supported by TLSClientMini");
      }
      const t = this.socket.readable.getReader();
      try {
        const { value: e, done: n } = await this.readChunk(t);
        if (n) return null;
        this.recordParser.feed(e);
      } finally {
        t.releaseLock();
      }
    }
  }
  close() {
    this.socket.close();
  }
}
