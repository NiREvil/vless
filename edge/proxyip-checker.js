// @ts-nocheck
import { connect } from "cloudflare:sockets";

let temporaryTOKEN, permanentTOKEN;

export default {
  /**
   * @param {RequestInit<CfProperties<unknown>>} request
   * @param {{ [x: string]: any; ICO: string; TOKEN: string; SCAMALYTICS_USERNAME: any; SCAMALYTICS_API_KEY: any; SCAMALYTICS_API_BASE_URL: string; URL302: any; URL: any; }} env
   * @param {any} ctx
   */
  async fetch(request, env, ctx) {
    const websiteIcon = env.ICO || "https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/cf.svg";
    const url = new URL(request.url);
    const UA = request.headers.get("User-Agent") || "null";
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31));
    temporaryTOKEN = await doubleHash(url.hostname + timestamp + UA);
    permanentTOKEN = env.TOKEN || temporaryTOKEN;

    const scamalyticsUsername = env.SCAMALYTICS_USERNAME;
    const scamalyticsApiKey = env.SCAMALYTICS_API_KEY;
    const scamalyticsApiBaseUrl = env.SCAMALYTICS_API_BASE_URL || "https://api.scamalytics.com";

    if (path.toLowerCase() === "/check") {
      if (!url.searchParams.has("proxyip"))
        return new Response("Missing proxyip parameter", { status: 400 });
      if (url.searchParams.get("proxyip") === "")
        return new Response("Invalid proxyip parameter", { status: 400 });
      if (env.TOKEN) {
        if (!url.searchParams.has("token") || url.searchParams.get("token") !== permanentTOKEN) {
          return new Response(
            JSON.stringify(
              {
                status: "error",
                message: `ProxyIP Check Failed: Invalid TOKEN`,
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
      }
      const proxyIPInput = url.searchParams.get("proxyip").toLowerCase();
      const result = await CheckProxyIP(proxyIPInput);

      return new Response(JSON.stringify(result, null, 2), {
        status: result.success ? 200 : 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else if (path.toLowerCase() === "/debug-env") {
      return new Response(JSON.stringify(env, null, 2), {
        headers: { "Content-Type": "application/json" },
      });
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
              message: `Scamalytics Lookup Failed: Invalid TOKEN`,
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

      if (!scamalyticsUsername || !scamalyticsApiKey) {
        return new Response(
          JSON.stringify({
            error: "Scamalytics API credentials not configured on server.",
            message:
              "Please set SCAMALYTICS_USERNAME and SCAMALYTICS_API_KEY environment variables.",
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const cleanIP = ipToLookup.replace(/[\[\]]/g, "");
      const scamalyticsUrl = `${scamalyticsApiBaseUrl}/${scamalyticsUsername}/?key=${scamalyticsApiKey}&ip=${cleanIP}`;

      try {
        const scamalyticsResponse = await fetch(scamalyticsUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ProxyIPScanner/1.0)",
          },
        });

        if (!scamalyticsResponse.ok) {
          throw new Error(`HTTP ${scamalyticsResponse.status}: ${scamalyticsResponse.statusText}`);
        }

        const responseText = await scamalyticsResponse.text();
        let responseBody;
        try {
          responseBody = JSON.parse(responseText);
        } catch (parseError) {
          return new Response(
            JSON.stringify({
              error: "Invalid JSON response from Scamalytics API",
              details: `Response was not valid JSON: ${responseText.substring(0, 100)}...`,
            }),
            {
              status: 502,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            },
          );
        }

        return new Response(JSON.stringify(responseBody), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: "Failed to fetch from Scamalytics API",
            details: error.message,
          }),
          {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          },
        );
      }
    } else if (path.toLowerCase() === "/resolve") {
      if (
        !url.searchParams.has("token") ||
        (url.searchParams.get("token") !== temporaryTOKEN &&
          url.searchParams.get("token") !== permanentTOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: "error",
              message: `Domain Resolve Failed: Invalid TOKEN`,
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
      if (!url.searchParams.has("domain"))
        return new Response("Missing domain parameter", { status: 400 });
      const domain = url.searchParams.get("domain");

      try {
        const ips = await resolveDomain(domain);
        return new Response(JSON.stringify({ success: true, domain, ips }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    } else if (path.toLowerCase() === "/ip-info") {
      if (
        !url.searchParams.has("token") ||
        (url.searchParams.get("token") !== temporaryTOKEN &&
          url.searchParams.get("token") !== permanentTOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: "error",
              message: `IP Info Failed: Invalid TOKEN`,
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
      let ip = url.searchParams.get("ip") || request.headers.get("CF-Connecting-IP");
      if (!ip) {
        return new Response(
          JSON.stringify(
            {
              status: "error",
              message: "IP parameter not provided",
              code: "MISSING_PARAMETER",
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 400,
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      if (ip.includes("[")) {
        ip = ip.replace("[", "").replace("]", "");
      }

      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=en`);
        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();
        data.timestamp = new Date().toISOString();
        return new Response(JSON.stringify(data, null, 4), {
          headers: {
            "content-type": "application/json; charset=UTF-8",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        return new Response(
          JSON.stringify(
            {
              status: "error",
              message: `IP Info Failed: ${error.message}`,
              code: "API_REQUEST_FAILED",
              query: ip,
              timestamp: new Date().toISOString(),
              details: {
                errorType: error.name,
                stack: error.stack ? error.stack.split("\n")[0] : null,
              },
            },
            null,
            4,
          ),
          {
            status: 500,
            headers: {
              "content-type": "application/json; charset=UTF-8",
              "Access-Control-Allow-Origin": "*",
            },
          },
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
          headers: {
            "Content-Type": "text/html; charset=UTF-8",
          },
        });
      } else if (path.toLowerCase() === "/favicon.ico") {
        return Response.redirect(websiteIcon, 302);
      }
      return await generateHTMLPage(hostname, websiteIcon, temporaryTOKEN);
    }
  },
};

/**
 * DNS resolver
 * @param {string} domain
 */
async function resolveDomain(domain) {
  domain = domain.includes(":") ? domain.split(":")[0] : domain;
  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: {
          Accept: "application/dns-json",
          "Cache-Control": "no-cache",
        },
        cf: { cacheTtl: -1 },
      }),
      fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=AAAA`, {
        headers: {
          Accept: "application/dns-json",
          "Cache-Control": "no-cache",
        },
        cf: { cacheTtl: -1 },
      }),
    ]);

    if (!ipv4Response.ok || !ipv6Response.ok) {
      throw new Error(
        `DNS API HTTP Error: IPv4=${ipv4Response.status}, IPv6=${ipv6Response.status}`,
      );
    }

    const [ipv4Data, ipv6Data] = await Promise.all([ipv4Response.json(), ipv6Response.json()]);

    const ips = [];
    if (ipv4Data.Answer) {
      const ipv4Addresses = ipv4Data.Answer.filter(
        (/** @type {{ type: number; }} */ record) => record.type === 1,
      ).map((/** @type {{ data: any; }} */ record) => record.data);
      ips.push(...ipv4Addresses);
    }
    if (ipv6Data.Answer) {
      const ipv6Addresses = ipv6Data.Answer.filter(
        (/** @type {{ type: number; }} */ record) => record.type === 28,
      ).map((/** @type {{ data: any; }} */ record) => `[${record.data}]`);
      ips.push(...ipv6Addresses);
    }
    if (ips.length === 0) {
      throw new Error("No DNS records (A or AAAA) found for this domain");
    }
    return ips;
  } catch (error) {
    throw new Error(`DNS resolution failed: ${error.message}`);
  }
}

/**
 * Core ProxyIP Check logic adapted from Cmliu using a robust TLS client handshake over raw TCP sockets
 * @param {string} proxyIP
 */
async function CheckProxyIP(proxyIP) {
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

  const hostAddr = hostToCheck.includes(":") ? `[${hostToCheck}]` : hostToCheck;
  let socket = null;
  let tlsClient = null;
  const timeoutMs = 8000;

  try {
    const startedAt = Date.now();
    socket = connect({ hostname: hostAddr, port: portRemote });
    await withTimeout(socket.opened, timeoutMs, "TCP Connect");

    // Create custom TLS Client mimicking Cmliu's engine
    tlsClient = new TlsClient(socket, { serverName: "speed.cloudflare.com", timeout: timeoutMs });
    await withTimeout(tlsClient.handshake(), timeoutMs, "TLS Handshake");

    // Send HTTP GET request via TLS
    const httpRequest =
      "GET /cdn-cgi/trace HTTP/1.1\r\n" +
      "Host: speed.cloudflare.com\r\n" +
      "User-Agent: checkip/diana/\r\n" +
      "Connection: close\r\n\r\n";

    await tlsClient.write(new TextEncoder().encode(httpRequest));

    let responseData = new Uint8Array(0);
    while (true) {
      const chunk = await tlsClient.read();
      if (!chunk || chunk.length === 0) break;
      const nextData = new Uint8Array(responseData.length + chunk.length);
      nextData.set(responseData);
      nextData.set(chunk, responseData.length);
      responseData = nextData;
    }

    const responseText = new TextDecoder().decode(responseData);
    const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;

    const isSuccessful =
      statusCode === 200 && responseText.includes("cloudflare") && responseText.includes("colo=");
    const totalLatency = Date.now() - startedAt;

    const jsonResponse = {
      success: isSuccessful,
      proxyIP: hostToCheck,
      portRemote: portRemote,
      statusCode: statusCode || null,
      responseSize: responseData.length,
      latency: totalLatency,
      timestamp: new Date().toISOString(),
    };
    return jsonResponse;
  } catch (error) {
    return {
      success: false,
      proxyIP: hostToCheck,
      portRemote: portRemote,
      timestamp: new Date().toISOString(),
      error: error.message || error.toString(),
    };
  } finally {
    try {
      tlsClient?.close();
    } catch {}
    try {
      if (!tlsClient) socket?.close();
    } catch {}
  }
}

/**
 * @param {Promise<SocketInfo> | Promise<void>} promise
 * @param {number} timeoutMs
 * @param {string} label
 */
function withTimeout(promise, timeoutMs, label) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} Timeout`)), timeoutMs);
    }),
  ]).finally(() => clearTimeout(timer));
}

/**
 * @param {string} content
 */
async function sanitizeURLs(content) {
  var replacedContent = content.replace(/[\r\n]+/g, "|").replace(/\|+/g, "|");
  const addressArray = replacedContent.split("|");
  const sanitizedArray = addressArray.filter((item, index) => {
    return item !== "" && addressArray.indexOf(item) === index;
  });
  return sanitizedArray;
}

/**
 * @param {string} text
 */
async function doubleHash(text) {
  const encoder = new TextEncoder();
  const firstHash = await crypto.subtle.digest("MD5", encoder.encode(text));
  const firstHashArray = Array.from(new Uint8Array(firstHash));
  const firstHex = firstHashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const secondHash = await crypto.subtle.digest("MD5", encoder.encode(firstHex.slice(7, 27)));
  const secondHashArray = Array.from(new Uint8Array(secondHash));
  const secondHex = secondHashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return secondHex.toLowerCase();
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
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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

/**
 * @param {string} _hostname
 * @param {string} websiteIcon
 * @param {string} token
 */
async function generateHTMLPage(_hostname, websiteIcon, token) {
  const html = `
  <!DOCTYPE html>
  <html lang="en" dir="ltr">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>ProxyIP Checker - Advanced Risk Analysis</title>
      <link rel="icon" href="${websiteIcon}" type="image/x-icon" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <style>
        @font-face {
          font-family: "Styrene B LC";
          src: url("https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Regular.woff2")
            format("woff2");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
  
        @font-face {
          font-family: "Styrene B LC";
          src: url("https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Medium.woff2")
            format("woff2");
          font-weight: 500;
          font-style: normal;
          font-display: swap;
        }
  
        :root {
          --bg-primary: #0a0a0a;
          --bg-secondary: #1a1a1a;
          --bg-tertiary: #2a2a2a;
          --text-primary: #ffffff;
          --text-secondary: #b0b0b0;
          --text-muted: #666666;
          --accent-orange: #ff6b35;
          --accent-orange-dark: #e55a2b;
          --accent-orange-light: #ff8c5a;
          --border-color: #333333;
          --border-light: #444444;
          --success-color: #10b981;
          --success-bg: rgba(16, 185, 129, 0.1);
          --success-border: rgba(16, 185, 129, 0.3);
          --error-color: #ef4444;
          --error-bg: rgba(239, 68, 68, 0.1);
          --error-border: rgba(239, 68, 68, 0.3);
          --warning-color: #f59e0b;
          --warning-bg: rgba(245, 158, 11, 0.1);
          --warning-border: rgba(245, 158, 11, 0.3);
          --info-color: #3b82f6;
          --info-bg: rgba(59, 130, 246, 0.1);
          --info-border: rgba(59, 130, 246, 0.3);
          --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
          --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
          --shadow-lg: 0 8px 25px rgba(0, 0, 0, 0.25);
          --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.4);
          --radius-sm: 8px;
          --radius-md: 12px;
          --radius-lg: 16px;
          --radius-xl: 20px;
  
          --sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          --mono-sans: "Styrene B LC", monospace;
        }
  
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
  
        body {
          font-family: var(--sans);
          background: linear-gradient(135deg, var(--bg-primary) 0%, #1a1a1a 100%);
          color: var(--text-primary);
          line-height: 1.6;
          min-height: 100vh;
          overflow-x: hidden;
        }
  
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }
  
        .header {
          text-align: center;
          margin-bottom: 3rem;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.75rem;
        }
  
        .header-icon {
          font-size: clamp(1rem, 4vw, 0.6rem);
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .header-icon.spinning {
          display: inline-block;
          animation: spin 1s linear infinite;
        }
  
        .header::before {
          content: "";
          position: absolute;
          top: -50px;
          left: 50%;
          transform: translateX(-50%);
          width: 200px;
          height: 200px;
          background: radial-gradient(
            circle,
            var(--accent-orange) 0%,
            transparent 70%
          );
          opacity: 0.1;
          border-radius: 50%;
          z-index: -1;
        }
  
        .main-title {
          font-size: clamp(3rem, 5vw, 5rem);
          font-weight: 700;
          background: linear-gradient(
            135deg,
            var(--accent-orange) 0%,
            var(--accent-orange-light) 100%
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0;
          text-shadow: 0 0 30px rgba(255, 107, 53, 0.3);
        }
  
        .subtitle {
          font-family: var(--mono-sans);
          font-size: 1.2rem;
          color: var(--text-secondary);
          font-weight: 400;
          text-align: center;
          width: 100%;
        }
        
        .title-group {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
  
        .main-card {
          background: linear-gradient(145deg, var(--bg-secondary) 0%, #1f1f1f 100%);
          border-radius: var(--radius-xl);
          padding: 3rem;
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border-color);
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }
  
        .main-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--accent-orange),
            transparent
          );
          opacity: 0.5;
        }
  
        .form-section {
          display: grid;
          gap: 2rem;
          margin-bottom: 2rem;
        }
  
        .input-group {
          position: relative;
        }
  
        .input-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.75rem;
          font-size: 1.1rem;
        }
  
        .input-label svg {
          width: 20px;
          height: 20px;
          color: var(--accent-orange-light);
        }
  
        .input-wrapper {
          position: relative;
        }
  
        .form-input {
          width: 100%;
          padding: 1rem 1.25rem;
          font-family: var(--mono-sans);
          font-size: 1rem;
          background: var(--bg-tertiary);
          border: 2px solid var(--border-color);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          transition: all 0.3s ease;
          outline: none;
        }
  
        .form-input:focus {
          border-color: var(--accent-orange);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
          transform: translateY(-1px);
        }
  
        .form-input::placeholder {
          color: var(--text-muted);
        }
  
        .btn-primary {
          background: linear-gradient(
            135deg,
            var(--accent-orange) 0%,
            var(--accent-orange-dark) 100%
          );
          color: rgb(255, 255, 255);
          border: none;
          padding: 0.8rem 1.4rem;
          border-radius: var(--radius-md);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          align-items: baseline;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: var(--shadow-md);
        }
  
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
  
        .btn-primary:active {
          transform: translateY(0);
        }
  
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
  
        .btn-primary::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: left 0.5s;
        }
  
        .btn-primary:hover::before {
          left: 100%;
        }
  
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-left: 0.5rem;
          display: none;
        }
  
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
  
        .results-section {
          margin-top: 3rem;
        }
  
        .result-card {
          font-family: var(--mono-sans);
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: 2rem;
          margin-bottom: 1.5rem;
          border-left: 4px solid var(--border-color);
          box-shadow: var(--shadow-md);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
  
        .result-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          background: var(--border-color);
          transition: all 0.3s ease;
        }
  
        .result-card.success {
          border-left-color: var(--success-color);
          background: linear-gradient(
            145deg,
            var(--success-bg),
            var(--bg-secondary)
          );
        }
        .result-card.success::before {
          background: var(--success-color);
        }
        .result-card.error {
          border-left-color: var(--error-color);
          background: linear-gradient(
            145deg,
            var(--error-bg),
            var(--bg-secondary)
          );
        }
        .result-card.error::before {
          background: var(--error-color);
        }
        .result-card.warning {
          border-left-color: var(--warning-color);
          background: linear-gradient(
            145deg,
            var(--warning-bg),
            var(--bg-secondary)
          );
        }
        .result-card.warning::before {
          background: var(--warning-color);
        }
  
        .result-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 0.75rem;
        }
  
        .result-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }
  
        .result-content {
          display: grid;
          gap: 1rem;
        }
  
        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          transition: background 0.2s;
        }
        .result-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .result-label {
          font-weight: 500;
          color: var(--text-secondary);
        }
        .result-value {
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .result-card {
          position: relative;
          overflow: hidden;
        }
        
        .flag-glow-overlay {
          position: absolute;
          top: -20px;
          right: -30px;
          width: 180px;
          height: 120px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          filter: blur(25px) opacity(0.18);
          transform: rotate(8deg) scale(1.15);
          pointer-events: none;
          z-index: 1;
        }

        .result-header, .result-content {
          position: relative;
          z-index: 2;
        }
  
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }
        .badge.success {
          background: var(--success-bg);
          color: var(--success-color);
          border: 1px solid var(--success-border);
        }
        .badge.error {
          background: var(--error-bg);
          color: var(--error-color);
          border: 1px solid var(--error-border);
        }
        .badge.warning {
          background: var(--warning-bg);
          color: var(--warning-color);
          border: 1px solid var(--warning-border);
        }
        .badge.info {
          background: var(--info-bg);
          color: var(--info-color);
          border: 1px solid var(--info-border);
        }
  
        .copy-btn {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .copy-btn:hover {
          background: var(--accent-orange);
          color: white;
          border-color: var(--accent-orange);
        }
  
        .toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          padding: 1rem 1.5rem;
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          border: 1px solid var(--border-color);
          z-index: 1000;
          opacity: 0;
          transform: translateY(100px);
          transition: all 0.3s ease;
        }
        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        
        .api-docs {
          margin-top: 3rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid var(--border-color);
        }
  
        .api-docs-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        
        .api-docs-header h3 {
          color: var(--text-primary);
          font-size: 1.75rem;
          font-weight: 700;
        }
        
        .api-docs-header svg {
          width: 28px;
          height: 28px;
          color: var(--accent-orange);
        }
  
        .api-endpoints {
          display: grid;
          gap: 1rem;
        }
  
        .api-endpoint {
          display: flex;
          align-items: center;
          gap: 1rem;
          background-color: var(--bg-tertiary);
          padding: 1rem 1.2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          transition: all 0.2s ease;
        }
        .api-endpoint:hover {
          border-color: var(--accent-orange);
          transform: translateY(-2px);
        }
  
        .api-method {
          font-family: var(--mono-sans);
          font-weight: 700;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.9rem;
          background-color: var(--success-bg);
          color: var(--success-color);
          border: 1px solid var(--success-border);
        }
  
        .api-endpoint code {
          font-family: var(--mono-sans);
          font-size: 1rem;
          color: var(--text-secondary);
          flex-grow: 1;
        }
  
        .api-endpoint code span {
          color: var(--accent-orange-light);
        }
  
        .api-description {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-left: auto;
          white-space: nowrap;
        }
  
        .footer {
          font-family: var(--mono-sans);
          text-align: center;
          margin-top: 3rem;
          padding: 2rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-color);
        }
        .footer a {
          color: var(--accent-orange);
          text-decoration: none;
        }
        .footer a:hover {
          text-decoration: underline;
        }
  
        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }
          .main-card {
            padding: 2rem;
          }
          .header {
            flex-direction: column;
            gap: 1rem;
          }
          .result-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .api-endpoint {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
          .api-description {
              margin-left: 0;
              margin-top: 0.2rem;
          }
          .toast {
            left: 1rem;
            right: 1rem;
            bottom: 1rem;
          }
        }
  
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
  
        @media (max-width: 640px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
  
        @media (max-width: 480px) {
          .main-card {
            padding: 1.2rem;
          }
          .main-title {
            font-size: 1.8rem;
          }
          .subtitle {
            font-size: 0.8rem;
          }
          .btn-primary {
            font-size: 1rem;
          }
          .api-endpoint {
            gap: 0.1rem;
          }
          .api-method {
            font-weight: 600;
            padding: 0.15rem 0.5rem;
            font-size: 0.8rem;
          }
          .api-description {
            font-size: 0.9rem;
            margin-left: 0;
            margin-top: 0rem;
          }
          .api-endpoint code {
            font-size: 0.9rem;
          }
  
          .api-endpoint code span {
            font-size: 0.8rem;
          }
        }
  
        .flex-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }
        .flex-center svg {
          width: 22px;
          height: 22px;
        }
  
        .range-results {
          margin-top: 2rem;
        }
        .ip-grid {
          display: grid;
          gap: 0.5rem;
          max-height: 500px;
          overflow-y: auto;
          padding: 1rem;
          background: var(--bg-tertiary);
          border-radius: var(--radius-md);
          border: 1px solid var(--border-color);
        }
        .ip-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-light);
          transition: all 0.2s ease;
        }
        .ip-item:hover {
          background: rgba(255, 107, 53, 0.05);
          border-color: var(--accent-orange);
        }
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 0.5rem;
        }
        .status-indicator.success {
          background: var(--success-color);
          box-shadow: 0 0 8px var(--success-color);
        }
        .status-indicator.error {
          background: var(--error-color);
          box-shadow: 0 0 8px var(--error-color);
        }
        .status-indicator.warning {
          background: var(--warning-color);
          box-shadow: 0 0 8px var(--warning-color);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          <div class="title-group">
              <h1 class="main-title">ProxyIP Checker</h1>
              <p class="subtitle">Proxy IP Verification & Risk Analysis</p>
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
                  <input
                    type="text"
                    id="proxyip"
                    class="form-input"
                    placeholder="127.0.0.1:443 or di.nscl.ir"
                    autocomplete="off"
                  />
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
                  <input
                    type="text"
                    id="proxyipRange"
                    class="form-input"
                    placeholder="127.0.0.0/24"
                    autocomplete="off"
                  />
                </div>
              </div>
            </div>
  
            <button id="checkBtn" class="btn-primary" onclick="checkInputs()">
              <span class="flex-center">
                <span id="btn-icon" class="header-icon">&gt;_</span>
                <span class="btn-text">Start Analysis</span>
                <span class="loading-spinner"></span>
              </span>
            </button>
          </div>
  
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
                        ips.push(\"\${baseParts[0]}.\${baseParts[1]}.\${baseParts[2]}.\${i}\");
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
                    const prefix = \"\${ipParts[0]}.\${ipParts[1]}.\${ipParts[2]}\";
                    if (!isNaN(startOctet) && !isNaN(endOctet) && startOctet <= endOctet && startOctet >= 0 && endOctet <= 255) {
                        for (let i = startOctet; i <= endOctet; i++) {
                            ips.push(\"\${prefix}.\${i}\");
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
          if (!data || !data.scamalytics || data.scamalytics.status !== 'ok') {
            return '<span class="badge info">Risk Unknown</span>';
          }

          const sa = data.scamalytics;
          const score = sa.scamalytics_score;
          const risk = sa.scamalytics_risk;
          
          let riskText = "Unknown";
          let badgeClass = "info";

          if (risk !== undefined && score !== undefined && risk !== null && score !== null) {
            const riskCapitalized = risk.charAt(0).toUpperCase() + risk.slice(1);
            riskText = \`\${score} - \${riskCapitalized}\`;

            switch (risk.toLowerCase()) { 
              case "low": badgeClass = "success"; break;
              case "medium": badgeClass = "warning"; break;
              case "high": case "very high": badgeClass = "error"; break;
              default: 
                badgeClass = "info";
                riskText = \`Score \${score} - \${riskCapitalized || 'Status Unknown'}\`;
                break;
            }
          } else if (score !== undefined && score !== null) {
            riskText = \`Score \${score} - N/A\`; 
          } else if (risk) {
            const riskCapitalized = risk.charAt(0).toUpperCase() + risk.slice(1);
            riskText = riskCapitalized;
            switch (risk.toLowerCase()) {
              case "low": badgeClass = "success"; break;
              case "medium": badgeClass = "warning"; break;
              case "high": case "very high": badgeClass = "error"; break;
              default: badgeClass = "info"; riskText = "Status Unknown"; break;
            }
          }
          
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
            const redirectUrl = \`\${currentProtocol}//\${currentHost}/\text{\${encodeURIComponent(redirectPathVal)}}\`;
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
          btnText.textContent = "Analyzing...";
          btnIcon.classList.add("spinning");
          spinner.style.display = 'inline-block';
          
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
                            <span class="result-value" id="rangeProgress">0/\${ipsInRange.length}</span>
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
                            fetchSingleIPCheck(ip + ':443') 
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
                        
                        document.getElementById('rangeProgress').textContent = \`\${checkedCount}/\text{\${ipsInRange.length}}\`;
                        document.getElementById('rangeSuccess').textContent = successCount;
                        
                        if (i + batchSize < ipsInRange.length) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                    
                    const finalResultClass = successCount === ipsInRange.length ? 'success' : 
                                           successCount > 0 ? 'warning' : 'error';
                    const finalIcon = successCount === ipsInRange.length ? '✅' : 
                                    successCount > 0 ? '⚠️' : '❌';
                    
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
                           <div class="result-icon error">❌</div>
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
                  <div class="result-icon error">✗</div>
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
            btnIcon.classList.remove("spinning");
            spinner.style.display = 'none';
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

        async function fetchSingleIPCheck(proxyipWithOptionalPort) {
            const requestUrl = \`./check?proxyip=\${encodeURIComponent(proxyipWithOptionalPort)}&token=\${TEMP_TOKEN}&_t=\text{\${Date.now()}}\`;
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
            const resultIcon = checkData.success ? '✅' : '❌';
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

          const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=\${TEMP_TOKEN}&_t=\text{\text{\${Date.now()}}}\`, { cache: 'no-store' });
          const resolveData = await resolveResponse.json();
          
          if (!resolveData.success) { 
            resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">❌</span> Resolution Failed</h3><p>\${resolveData.error || 'Domain resolution failed for ' + createCopyButton(cleanDomain)}</p></div>\`;
            return;
          }
          const ips = resolveData.ips;
          if (!ips || ips.length === 0) { 
            resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">❌</span> No IPs Found</h3><p>No IPs found for \${createCopyButton(cleanDomain)}.</p></div>\`;
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
            domainCardIconEl.textContent = '✅';
            domainResultCardEl.classList.add('result-success');
          } else if (validCount === 0) {
            resultCardHeader.childNodes[1].nodeValue = ' All Domain IPs Invalid';
            domainCardIconEl.className = 'status-icon-prefix error';
            domainCardIconEl.textContent = '❌';
            domainResultCardEl.classList.add('result-error');
          } else {
            resultCardHeader.childNodes[1].nodeValue = \` Some Domain IPs Valid (\${validCount}/\${ips.length})\`;
            domainCardIconEl.className = 'status-icon-prefix warning';
            domainCardIconEl.textContent = '⚠️';
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
                 statusIcon.textContent = result.success ? \`✅ (\${result.latency} ms)\` : '❌';
                 statusIcon.style.color = result.success ? 'var(--status-success-icon)' : 'var(--status-error-icon)';
            }
          } catch (error) {
            if (statusIcon) {
                statusIcon.textContent = '⚠️';
                statusIcon.style.color = 'var(--status-warning-icon)';
            }
            ipCheckResults.set(ip, { success: false, error: error.message });
          }
        }
        
        async function getIPInfoWithIndex(ip, index) {
          try {
            const ipInfo = await getIPInfo(ip.split(':')[0]);
            const infoElement = document.getElementById(\`ip-info-\${index}\`);
            if (infoElement) infoElement.innerHTML = formatIPInfo(ipInfo, true);
          } catch (error) { }
        }

        async function getIPInfo(ip) {
          try {
            const cleanIP = ip.replace(/[\[\]]/g, '');
            const response = await fetch(\`./ip-info?ip=\${encodeURIComponent(cleanIP)}&token=\${TEMP_TOKEN}&_t=\text{\text{\${Date.now()}}}\`, { cache: 'no-store' });
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

// ==================== TLS ENGINE ====================
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
      this.recordParser.feed(i);
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
