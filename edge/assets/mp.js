import { connect } from 'cloudflare:sockets';
let temporaryTOKEN, permanentTOKEN;

export default {
  async fetch(request, env, ctx) {
    const websiteIcon =
      env.ICO || 'https://github.com/user-attachments/assets/31a6ced0-62b8-429f-a98e-082ea5ac1990';
    const url = new URL(request.url);
    const UA = request.headers.get('User-Agent') || 'null';
    const path = url.pathname;
    const hostname = url.hostname;
    const currentDate = new Date();
    const timestamp = Math.ceil(currentDate.getTime() / (1000 * 60 * 31));
    temporaryTOKEN = await doubleHash(url.hostname + timestamp + UA);
    permanentTOKEN = env.TOKEN || temporaryTOKEN;
    if (path.toLowerCase() === '/check') {
      if (!url.searchParams.has('proxyip'))
        return new Response('Missing proxyip parameter', { status: 400 });
      if (url.searchParams.get('proxyip') === '')
        return new Response('Invalid proxyip parameter', { status: 400 });
      if (env.TOKEN) {
        if (!url.searchParams.has('token') || url.searchParams.get('token') !== permanentTOKEN) {
          return new Response(
            JSON.stringify(
              {
                status: 'error',
                message: `ProxyIP Check Failed: Invalid TOKEN`,
                timestamp: new Date().toISOString(),
              },
              null,
              4,
            ),
            {
              status: 403,
              headers: {
                'content-type': 'application/json; charset=UTF-8',
                'Access-Control-Allow-Origin': '*',
              },
            },
          );
        }
      }
      const proxyIPInput = url.searchParams.get('proxyip').toLowerCase();
      const result = await CheckProxyIP(proxyIPInput);

      return new Response(JSON.stringify(result, null, 2), {
        status: result.success ? 200 : 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else if (path.toLowerCase() === '/resolve') {
      if (
        !url.searchParams.has('token') ||
        (url.searchParams.get('token') !== temporaryTOKEN &&
          url.searchParams.get('token') !== permanentTOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `Domain Resolve Failed: Invalid TOKEN`,
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 403,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
      if (!url.searchParams.has('domain'))
        return new Response('Missing domain parameter', { status: 400 });
      const domain = url.searchParams.get('domain');

      try {
        const ips = await resolveDomain(domain);
        return new Response(JSON.stringify({ success: true, domain, ips }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } else if (path.toLowerCase() === '/ip-info') {
      if (
        !url.searchParams.has('token') ||
        (url.searchParams.get('token') !== temporaryTOKEN &&
          url.searchParams.get('token') !== permanentTOKEN)
      ) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP Info Failed: Invalid TOKEN`,
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 403,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
      let ip = url.searchParams.get('ip') || request.headers.get('CF-Connecting-IP');
      if (!ip) {
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: 'IP parameter not provided',
              code: 'MISSING_PARAMETER',
              timestamp: new Date().toISOString(),
            },
            null,
            4,
          ),
          {
            status: 400,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }

      if (ip.includes('[')) {
        ip = ip.replace('[', '').replace(']', '');
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
            'content-type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        console.error('IP Info Fetch Error:', error);
        return new Response(
          JSON.stringify(
            {
              status: 'error',
              message: `IP Info Fetch Error: ${error.message}`,
              code: 'API_REQUEST_FAILED',
              query: ip,
              timestamp: new Date().toISOString(),
              details: {
                errorType: error.name,
                stack: error.stack ? error.stack.split('\n')[0] : null,
              },
            },
            null,
            4,
          ),
          {
            status: 500,
            headers: {
              'content-type': 'application/json; charset=UTF-8',
              'Access-Control-Allow-Origin': '*',
            },
          },
        );
      }
    } else {
      const envKey = env.URL302 ? 'URL302' : env.URL ? 'URL' : null;
      if (envKey) {
        const URLs = await sanitizeURLs(env[envKey]);
        const URL = URLs[Math.floor(Math.random() * URLs.length)];
        return envKey === 'URL302' ? Response.redirect(URL, 302) : fetch(new Request(URL, request));
      } else if (env.TOKEN) {
        return new Response(await nginxWelcomePage(), {
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
          },
        });
      } else if (path.toLowerCase() === '/favicon.ico') {
        return Response.redirect(websiteIcon, 302);
      }
      return await generateHTMLPage(hostname, websiteIcon, temporaryTOKEN);
    }
  },
};
async function resolveDomain(domain) {
  domain = domain.includes(':') ? domain.split(':')[0] : domain;
  try {
    const [ipv4Response, ipv6Response] = await Promise.all([
      fetch(`https://1.1.1.1/dns-query?name=${domain}&type=A`, {
        headers: { Accept: 'application/dns-json' },
      }),
      fetch(`https://1.1.1.1/dns-query?name=${domain}&type=AAAA`, {
        headers: { Accept: 'application/dns-json' },
      }),
    ]);
    const [ipv4Data, ipv6Data] = await Promise.all([ipv4Response.json(), ipv6Response.json()]);

    const ips = [];
    if (ipv4Data.Answer) {
      const ipv4Addresses = ipv4Data.Answer.filter(record => record.type === 1).map(
        record => record.data,
      );
      ips.push(...ipv4Addresses);
    }
    if (ipv6Data.Answer) {
      const ipv6Addresses = ipv6Data.Answer.filter(record => record.type === 28).map(
        record => `[${record.data}]`,
      );
      ips.push(...ipv6Addresses);
    }
    if (ips.length === 0) {
      throw new Error('No A or AAAA records found');
    }
    return ips;
  } catch (error) {
    throw new Error(`DNS resolution failed: ${error.message}`);
  }
}

async function CheckProxyIP(proxyIP) {
  let portRemote = 443;
  let hostToCheck = proxyIP;
  if (proxyIP.includes('.tp')) {
    const portMatch = proxyIP.match(/\.tp(\d+)\./);
    if (portMatch) portRemote = parseInt(portMatch[1]);
    hostToCheck = proxyIP.split('.tp')[0];
  } else if (proxyIP.includes('[') && proxyIP.includes(']:')) {
    portRemote = parseInt(proxyIP.split(']:')[1]);
    hostToCheck = proxyIP.split(']:')[0] + ']';
  } else if (proxyIP.includes(':') && !proxyIP.startsWith('[')) {
    const parts = proxyIP.split(':');
    if (parts.length === 2 && parts[0].includes('.')) {
      hostToCheck = parts[0];
      portRemote = parseInt(parts[1]) || 443;
    }
  }

  const tcpSocket = connect({
    hostname: hostToCheck,
    port: portRemote,
  });
  try {
    const httpRequest =
      'GET /cdn-cgi/trace HTTP/1.1\r\n' +
      'Host: speed.cloudflare.com\r\n' +
      'User-Agent: checkip/diana/\r\n' +
      'Connection: close\r\n\r\n';
    const writer = tcpSocket.writable.getWriter();
    await writer.write(new TextEncoder().encode(httpRequest));
    writer.releaseLock();

    const reader = tcpSocket.readable.getReader();
    let responseData = new Uint8Array(0);
    while (true) {
      const { value, done } = await Promise.race([
        reader.read(),
        new Promise(resolve => setTimeout(() => resolve({ done: true }), 5000)),
      ]);
      if (done) break;
      if (value) {
        const newData = new Uint8Array(responseData.length + value.length);
        newData.set(responseData);
        newData.set(value, responseData.length);
        responseData = newData;
        const responseText = new TextDecoder().decode(responseData);
        if (
          responseText.includes('\r\n\r\n') &&
          (responseText.includes('Connection: close') || responseText.includes('content-length'))
        ) {
          break;
        }
      }
    }
    reader.releaseLock();

    const responseText = new TextDecoder().decode(responseData);
    const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
    const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
    function isValidProxyResponse(responseText, responseData) {
      const statusMatch = responseText.match(/^HTTP\/\d\.\d\s+(\d+)/i);
      const statusCode = statusMatch ? parseInt(statusMatch[1]) : null;
      const looksLikeCloudflare = responseText.includes('cloudflare');
      const isExpectedError =
        responseText.includes('plain HTTP request') || responseText.includes('400 Bad Request');
      const hasBody = responseData.length > 100;
      return statusCode !== null && looksLikeCloudflare && isExpectedError && hasBody;
    }
    const isSuccessful = isValidProxyResponse(responseText, responseData);

    const jsonResponse = {
      success: isSuccessful,
      proxyIP: hostToCheck,
      portRemote: portRemote,
      statusCode: statusCode || null,
      responseSize: responseData.length,
      timestamp: new Date().toISOString(),
    };
    await tcpSocket.close();
    return jsonResponse;
  } catch (error) {
    return {
      success: false,
      proxyIP: hostToCheck,
      portRemote: portRemote,
      timestamp: new Date().toISOString(),
      error: error.message || error.toString(),
    };
  }
}

async function sanitizeURLs(content) {
  var replacedContent = content.replace(/[\r\n]+/g, '|').replace(/\|+/g, '|');
  const addressArray = replacedContent.split('|');
  const sanitizedArray = addressArray.filter((item, index) => {
    return item !== '' && addressArray.indexOf(item) === index;
  });
  return sanitizedArray;
}

async function doubleHash(text) {
  const encoder = new TextEncoder();
  const firstHash = await crypto.subtle.digest('MD5', encoder.encode(text));
  const firstHashArray = Array.from(new Uint8Array(firstHash));
  const firstHex = firstHashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  const secondHash = await crypto.subtle.digest('MD5', encoder.encode(firstHex.slice(7, 27)));
  const secondHashArray = Array.from(new Uint8Array(secondHash));
  const secondHex = secondHashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  return secondHex.toLowerCase();
}

async function nginxWelcomePage() {
  const text = `
    <!DOCTYPE html>
    <html>
    <head>
    <title>Welcome to nginx!</title>
    <style>
        body {
            width: 35em;
            margin: 0 auto;
            font-family: Tahoma, Verdana, Arial, sans-serif;
        }
    </style>
    </head>
    <body>
    <h1>Welcome to nginx!</h1>
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
  return text;
}

async function generateHTMLPage(hostname, websiteIcon, token) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Check ProxyIP Service</title>
  <link rel="icon" href="${websiteIcon}" type="image/x-icon">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-primary: oklch(0.10 0.01 240);
      --bg-secondary: oklch(0.15 0.01 240);
      --text-primary: oklch(0.95 0.005 240);
      --text-light: oklch(0.65 0.01 240);
      --border-color: oklch(0.25 0.01 240);
      --accent-orange: oklch(0.70 0.19 45);
      --accent-orange-dark: oklch(0.65 0.18 43);
      
      --primary-color: var(--accent-orange);
      --primary-dark: var(--accent-orange-dark);
      
      --status-success-icon: oklch(0.80 0.20 150);
      --status-success-border: oklch(0.70 0.18 150);
      --status-success-bg: oklch(0.28 0.07 150);
      --status-success-text: oklch(0.92 0.02 150);

      --status-warning-icon: oklch(0.85 0.22 85);
      --status-warning-border: oklch(0.75 0.20 85);
      --status-warning-bg: oklch(0.30 0.08 85);
      --status-warning-text: oklch(0.92 0.02 85);
      
      --status-error-icon: oklch(0.70 0.25 28);
      --status-error-border: oklch(0.60 0.23 28);
      --status-error-bg: oklch(0.25 0.09 28);
      --status-error-text: oklch(0.92 0.02 28);
      
      --border-radius: 12px;
      --border-radius-sm: 8px;
    }
    body { 
      font-family: 'Inter', sans-serif; 
      background: var(--bg-primary);
      color: var(--text-primary); 
      line-height: 1.6; 
      margin:0; 
      padding:0; 
      min-height: 100vh; 
      display: flex; 
      flex-direction: column; 
      align-items: center;
    }
    .container { 
      max-width: 800px; 
      width: 100%; 
      margin: 20px auto; 
      padding: 20px; 
      box-sizing: border-box;
    }
    .header { 
      text-align: center; 
      margin-bottom: 30px;
    }
    .main-title { 
      font-size: 2.5rem; 
      font-weight: 900; 
      color: var(--text-primary);
    }
    .accent-orange-text {
      color: var(--accent-orange);
    }
    .card { 
      background: var(--bg-secondary); 
      border-radius: var(--border-radius); 
      padding: 25px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.25); 
      margin-bottom: 25px; 
    }
    .form-section { 
      display: flex; 
      flex-direction: column;
      align-items: center; 
    }
    .form-label { 
      display: block; 
      font-weight: 500; 
      margin-bottom: 8px; 
      color: var(--text-light); 
      width: 100%; 
      max-width: 400px;
      text-align: left;
    }
    .input-wrapper { 
      width: 100%; 
      max-width: 400px; 
      margin-bottom: 15px;
    }
    .form-input { 
      width: 100%; 
      padding: 12px; 
      border: 1px solid var(--border-color); 
      border-radius: var(--border-radius-sm); 
      font-size: 0.95rem; 
      box-sizing: border-box;
      background-color: oklch(0.12 0.01 240);
      color: var(--text-primary);
    }
    .form-input::placeholder {
      color: oklch(0.4 0.01 240);
    }
    .btn-primary { 
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)); 
      color: white; 
      padding: 12px 25px;
      border: none; 
      border-radius: var(--border-radius-sm); 
      font-size: 1rem; 
      font-weight: 500; 
      cursor: pointer; 
      width: 100%; 
      max-width: 400px; 
      box-sizing: border-box;
      transition: background 0.3s ease;
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-dark), var(--primary-color)); 
    }
    .btn-primary:disabled { 
      background: oklch(0.3 0.01 240); 
      cursor: not-allowed;
    }
    .btn-secondary { 
      background-color: var(--bg-primary); 
      color: var(--text-light); 
      padding: 8px 15px; 
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm); 
      font-size: 0.9rem; 
      cursor: pointer; 
      margin-top: 15px; 
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    .btn-secondary:hover {
      background-color: var(--border-color);
      color: var(--text-primary);
    }
    .loading-spinner { 
      width: 16px; 
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3); 
      border-top-color: white; 
      border-radius: 50%; 
      animation: spin 1s linear infinite; 
      display: none; 
      margin-left: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .result-section { 
      margin-top: 25px;
    }
    .result-card { 
      padding: 18px; 
      border-radius: var(--border-radius-sm); 
      margin-bottom: 12px;
    }
    .result-card h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
    }
    .status-icon-prefix {
      margin-right: 0.5em;
      font-size: 1.1em;
    }
    .result-success { 
      background-color: var(--status-success-bg); 
      border-left: 4px solid var(--status-success-border); 
      color: var(--status-success-text);
    }
    .result-success .status-icon-prefix { color: var(--status-success-icon); }

    .result-error { 
      background-color: var(--status-error-bg); 
      border-left: 4px solid var(--status-error-border); 
      color: var(--status-error-text);
    }
    .result-error .status-icon-prefix { color: var(--status-error-icon); }
    
    .result-warning { 
      background-color: var(--status-warning-bg); 
      border-left: 4px solid var(--status-warning-border);
      color: var(--status-warning-text);
    }
    .result-warning .status-icon-prefix { color: var(--status-warning-icon); }

    .result-card p {
      color: var(--status-success-text);
    }
    .result-error p { color: var(--status-error-text); }
    .result-warning p { color: var(--status-warning-text); }
    .result-card p strong {
        color: var(--text-primary);
    }


    .copy-btn { 
      background: var(--bg-primary); 
      border: 1px solid var(--border-color); 
      color: var(--text-light);
      padding: 4px 8px; 
      border-radius: 4px;
      font-size: 0.85em; 
      cursor: pointer; 
      margin-left: 8px;
      transition: background-color 0.2s ease;
    }
    .copy-btn:hover {
      background-color: var(--border-color);
      color: var(--text-primary);
    }
    .toast { 
      position: fixed; 
      bottom: 20px; 
      right: 20px;
      background: oklch(0.2 0.02 250); 
      color: var(--text-primary); 
      padding: 12px 20px; 
      border-radius:var(--border-radius-sm); 
      z-index:1000; 
      opacity:0; 
      transition: opacity 0.3s ease;
      box-sizing: border-box;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .toast.show { opacity:1; }
    #rangeResultChartContainer { 
      margin-top: 15px; 
      padding:10px; 
      background-color: var(--bg-secondary); 
      border-radius: var(--border-radius-sm);
    }
    .api-docs { 
      margin-top: 30px; 
      padding: 25px; 
      background: var(--bg-secondary); 
      border-radius: var(--border-radius);
    }
     .api-docs h3 {
        color: var(--text-primary);
     }
     .api-docs p code {
        display: inline-block;
        background-color: oklch(0.1 0.01 240);
        color: var(--text-light);
        padding: 3px 6px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9em;
    }
    .footer { 
      text-align: center; 
      padding: 20px;
      margin-top: 30px; 
      color: var(--text-light); 
      font-size: 0.85em; 
      border-top: 1px solid var(--border-color); 
    }
    .footer a {
      color: var(--accent-orange);
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .flex-align-center { 
      display: flex;
      align-items: center; 
      justify-content: center; 
    }
    .ip-item { 
        padding:8px 5px;
        border-bottom:1px solid var(--border-color); 
        display:flex; 
        justify-content:space-between; 
        align-items:center;
        flex-wrap: wrap;
    }
    .ip-item:last-child {
        border-bottom: none;
    }
    .ip-item > div:first-child { 
        flex-grow: 1;
        margin-right: 10px;
    }
     .ip-item .status-icon {
        flex-shrink: 0;
        font-size:1.2em;
    }
    .ip-grid {
      border:1px solid var(--border-color) !important;
      background-color: var(--bg-primary);
      border-radius: var(--border-radius-sm);
    }
    #ip-info- { 
      color: var(--text-light) !important;
    }

    @media (max-width: 600px) {
      .container {
        padding: 10px;
        margin: 10px auto;
      }
      .header {
        margin-bottom: 15px;
      }
      .main-title {
        font-size: 1.8rem;
      }
      .card, .api-docs {
        padding: 15px;
        margin-bottom: 20px;
      }
      .form-label {
        font-size: 0.9rem;
        margin-bottom: 6px;
      }
      .form-input {
        padding: 10px;
        font-size: 0.9rem;
      }
      .btn-primary {
        padding: 10px 15px;
        font-size: 0.95rem;
      }
      .btn-secondary {
         padding: 7px 12px;
         font-size: 0.8rem;
      }
      .api-docs p code {
        word-break: break-all;
      }
      .toast {
        left: 10px;
        right: 10px;
        bottom: 10px;
        width: auto;
        max-width: calc(100% - 20px);
        text-align: center;
      }
      .ip-grid {
         font-size: 0.9em;
      }
      .ip-item {
        flex-direction: column;
        align-items: flex-start;
      }
      .ip-item > div:first-child {
        margin-bottom: 5px;
        margin-right: 0;
      }
       .ip-item .copy-btn {
        margin-left: 0;
        margin-right: 5px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1 class="main-title">proxyIP <span class="accent-orange-text">verifier</span></h1>
    </header>

    <div class="card">
      <div class="form-section">
        <label for="proxyip" class="form-label">Enter single IP / Domain:</label>
        <div class="input-wrapper">
          <input type="text" id="proxyip" class="form-input" placeholder="127.0.0.1:443 or nima.nscl.ir" autocomplete="off">
        </div>
        
        <label for="proxyipRange" class="form-label">Enter IP range :</label>
        <div class="input-wrapper">
          <input type="text" id="proxyipRange" class="form-input" placeholder="127.0.0.0/24 OR 127.0.0.1-255" autocomplete="off">
        </div>

        <button id="checkBtn" class="btn-primary" onclick="checkInputs()">
          <span class="flex-align-center">
            <span class="btn-text">Check</span>
            <span class="loading-spinner"></span>
          </span>
        </button>
      </div>
      
      <div id="result" class="result-section"></div>
      <div id="rangeResultCard" class="result-card result-section" style="display:none;">
         <h3><span id="rangeResultIcon" class="status-icon-prefix"></span>Successful IPs in Range:</h3>
         <div id="rangeResultChartContainer" style="width:100%; max-height:400px; margin: 15px auto; overflow-x: auto;">
            <canvas id="rangeSuccessChart"></canvas>
         </div>
         <div id="rangeResultSummary" style="margin-bottom: 10px;"></div>
         <button id="copyRangeBtn" class="btn-secondary" onclick="copySuccessfulRangeIPs()" style="display:none;">Copy Successful IPs</button>
      </div>
    </div>
    
    <div class="api-docs">
       <h3>API Documentation</h3>
       <p><code>GET /check?proxyip=YOUR_PROXY_IP&token=YOUR_TOKEN_IF_SET</code></p>
       <p><code>GET /resolve?domain=YOUR_DOMAIN&token=YOUR_TOKEN_IF_SET</code></p>
       <p><code>GET /ip-info?ip=TARGET_IP&token=YOUR_TOKEN_IF_SET</code></p>
    </div>
     <footer class="footer">
       <p>© ${new Date().getFullYear()} <strong>REvil - All Rights Reserved</strong> - <strong><a href="https://github.com/Diana-Cl" target="_blank">Dìana</a></strong></p>
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
      return Math.ceil(currentDate.getTime() / (1000 * 60 * 13));
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
    
    function createCopyButton(text) { return \`<span class="copy-btn" data-copy="\${text}">\${text}</span>\`; }

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
                    ips.push(\`\${baseParts[0]}.\${baseParts[1]}.\${baseParts[2]}.\${i}\`);
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
                const prefix = \`\${ipParts[0]}.\${ipParts[1]}.\${ipParts[2]}\`;
                if (!isNaN(startOctet) && !isNaN(endOctet) && startOctet <= endOctet && startOctet >= 0 && endOctet <= 255) {
                    for (let i = startOctet; i <= endOctet; i++) {
                        ips.push(\`\${prefix}.\${i}\`);
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

    async function checkInputs() {
      if (isChecking) return;
      const singleIpInputEl = document.getElementById('proxyip');
      const rangeIpInputEl = document.getElementById('proxyipRange');
      const resultDiv = document.getElementById('result');
      const rangeResultCard = document.getElementById('rangeResultCard');
      const rangeResultSummary = document.getElementById('rangeResultSummary');
      const copyRangeBtn = document.getElementById('copyRangeBtn');
      const rangeResultIconEl = document.getElementById('rangeResultIcon');


      const checkBtn = document.getElementById('checkBtn');
      const btnText = checkBtn.querySelector('.btn-text');
      const spinner = checkBtn.querySelector('.loading-spinner');
      
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
      btnText.style.display = 'none';
      spinner.style.display = 'inline-block';
      
      resultDiv.innerHTML = '';
      resultDiv.classList.remove('show');
      rangeResultCard.style.display = 'none';
      rangeResultCard.className = 'result-card result-section';
      if(rangeResultIconEl) rangeResultIconEl.textContent = '';


      rangeResultSummary.innerHTML = '';
      copyRangeBtn.style.display = 'none';
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
                rangeResultCard.style.display = 'block';
                rangeResultCard.classList.add('result-warning');
                if(rangeResultIconEl) rangeResultIconEl.innerHTML = '⟳';


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
                    rangeResultSummary.innerHTML = \`Tested: \${checkedCount}/\${ipsInRange.length} | Successful: \${successCount}\`;
                    
                    if (currentSuccessfulRangeIPs.length > 0) {
                         updateRangeSuccessChart(currentSuccessfulRangeIPs);
                         copyRangeBtn.style.display = 'inline-block';
                    } else {
                         copyRangeBtn.style.display = 'none';
                    }
                    if (i + batchSize < ipsInRange.length) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                rangeResultSummary.innerHTML = \`Range test complete. \${successCount} of \${ipsInRange.length} IPs were successful.\`;
                rangeResultCard.classList.remove('result-warning');
                if (successCount === ipsInRange.length && ipsInRange.length > 0) {
                    rangeResultCard.classList.add('result-success');
                    if(rangeResultIconEl) rangeResultIconEl.innerHTML = '<span class="status-icon-prefix success">✔</span>';
                } else if (successCount > 0) {
                    rangeResultCard.classList.add('result-warning');
                     if(rangeResultIconEl) rangeResultIconEl.innerHTML = '<span class="status-icon-prefix warning">⚠</span>';
                } else {
                    rangeResultCard.classList.add('result-error');
                    if(rangeResultIconEl) rangeResultIconEl.innerHTML = '<span class="status-icon-prefix error">✖</span>';
                    showToast('No successful IPs found in the range.');
                }


            } else if (rangeIpToTest) { 
                 showToast('Invalid IP Range format or empty range.');
                 rangeResultCard.style.display = 'block';
                 rangeResultCard.classList.add('result-error');
                 if(rangeResultIconEl) rangeResultIconEl.innerHTML = '<span class="status-icon-prefix error">✖</span>';
                 rangeResultSummary.innerHTML = 'Invalid IP Range format provided.';
            }
        }

      } catch (err) {
        const errorMsg = \`<div class="result-card result-error"><h3><span class="status-icon-prefix error">✖</span> General Error</h3><p>\${err.message}</p></div>\`;
        if(resultDiv.innerHTML === '') resultDiv.innerHTML = errorMsg;
        else {
            rangeResultSummary.innerHTML = \`<p>Error during range test: \${err.message}</p>\`;
            rangeResultCard.className = 'result-card result-section result-error';
            if(rangeResultIconEl) rangeResultIconEl.innerHTML = '<span class="status-icon-prefix error">✖</span>';
        }
        if (resultDiv.innerHTML !== '') resultDiv.classList.add('show');
        if (rangeIpToTest) rangeResultCard.style.display = 'block';
      } finally {
        isChecking = false;
        checkBtn.disabled = false;
        btnText.style.display = 'inline-block';
        spinner.style.display = 'none';
      }
    }
    
    function updateRangeSuccessChart(successfulIPs) {
        const ctx = document.getElementById('rangeSuccessChart').getContext('2d');
        if (rangeChartInstance) {
            rangeChartInstance.destroy();
        }
        
        const labels = successfulIPs;
        const dataPoints = successfulIPs.map(() => 1); 
        
        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-light').trim() || '#adb5bd';
        const gridBorderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim() || '#3c3e45';
        const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent-orange').trim() || '#F97316';
        const accentColorBg = accentColor + '99';

        rangeChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Successful IPs',
                    data: dataPoints,
                    backgroundColor: accentColorBg, 
                    borderColor: accentColor,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) { if (value === 1) return 'Success'; return ''; },
                            color: textColor
                        },
                        title: { display: false },
                        grid: { color: gridBorderColor }
                    },
                    y: {
                         ticks: {
                            autoSkip: false, 
                            color: textColor
                         },
                         title: {
                             display: true,
                             text: 'IP Addresses',
                             color: textColor
                         },
                         grid: { color: gridBorderColor }
                    }
                },
                plugins: {
                    legend: {
                        display: false,
                        labels: { color: textColor }
                    },
                    tooltip: {
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
                        bodyColor: textColor,
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim(),
                        borderColor: gridBorderColor,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return \`IP: \${context.label} - Status: Successful\`;
                            },
                             title: function() { return ''; }
                        }
                    }
                }
            }
        });
        const canvas = document.getElementById('rangeSuccessChart');
        const barHeight = 25;
        const newHeight = Math.max(200, labels.length * barHeight);
        canvas.style.height = \`\${newHeight}px\`;
        if(rangeChartInstance) rangeChartInstance.resize();
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
        const requestUrl = \`./check?proxyip=\${encodeURIComponent(proxyipWithOptionalPort)}&token=\${TEMP_TOKEN}\`;
        const response = await fetch(requestUrl);
        return await response.json();
    }

    async function checkAndDisplaySingleIP(proxyip, resultDiv) {
      const data = await fetchSingleIPCheck(proxyip);
      if (data.success) {
        const ipInfo = await getIPInfo(data.proxyIP);
        const ipInfoHTML = formatIPInfo(ipInfo);
        resultDiv.innerHTML = \` 
          <div class="result-card result-success">
            <h3><span class="status-icon-prefix">✔</span> ProxyIP Valid</h3>
            <p><strong>ProxyIP Address:</strong> \${createCopyButton(data.proxyIP)} \${ipInfoHTML}</p>
            <p><strong>Port:</strong> \${createCopyButton(data.portRemote.toString())}</p>
            <p><strong>Check Time:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        \`;
      } else {
        resultDiv.innerHTML = \`
          <div class="result-card result-error">
            <h3><span class="status-icon-prefix">✖</span> ProxyIP Invalid</h3>
            <p><strong>IP Address:</strong> \${createCopyButton(proxyip)}</p>
            \${data.error ? \`<p><strong>Error:</strong> \${data.error}</p>\` : ''}
            <p><strong>Check Time:</strong> \${new Date(data.timestamp).toLocaleString()}</p>
          </div>
        \`;
      }
      resultDiv.classList.add('show');
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
      
      resultDiv.innerHTML = \`<div class="result-card result-warning"><h3><span class="status-icon-prefix">⟳</span> Resolving Domain...</h3><p>Processing \${createCopyButton(cleanDomain)}...</p></div>\`;
      resultDiv.classList.add('show');


      const resolveResponse = await fetch(\`./resolve?domain=\${encodeURIComponent(cleanDomain)}&token=\${TEMP_TOKEN}\`);
      const resolveData = await resolveResponse.json();
      
      if (!resolveData.success) { 
        resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">✖</span> Resolution Failed</h3><p>\${resolveData.error || 'Domain resolution failed for ' + createCopyButton(cleanDomain)}</p></div>\`;
        return;
      }
      const ips = resolveData.ips;
      if (!ips || ips.length === 0) { 
        resultDiv.innerHTML = \`<div class="result-card result-error"><h3><span class="status-icon-prefix">✖</span> No IPs Found</h3><p>No IPs found for \${createCopyButton(cleanDomain)}.</p></div>\`;
        return;
      }
      
      ipCheckResults.clear();
      resultDiv.innerHTML = \`
        <div class="result-card result-warning" id="domain-result-card">
          <h3><span class="status-icon-prefix" id="domain-card-icon">⟳</span> Domain Resolution Results</h3>
          <p><strong>Domain:</strong> \${createCopyButton(cleanDomain)}</p>
          <p><strong>Default Port for Test:</strong> \${portRemote}</p>
          <p><strong>IPs Found:</strong> \${ips.length}</p>
          <div class="ip-grid" id="ip-grid" style="max-height: 200px; overflow-y: auto; margin-top:10px; padding:5px;">
            \${ips.map((ip, index) => \`
              <div class="ip-item" id="ip-item-\${index}">
                <div>\${createCopyButton(ip)} <span id="ip-info-\${index}" style="font-size:0.8em;"></span></div>
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
        domainCardIconEl.textContent = '✔';
        domainResultCardEl.classList.add('result-success');
      } else if (validCount === 0) {
        resultCardHeader.childNodes[1].nodeValue = ' All Domain IPs Invalid';
        domainCardIconEl.className = 'status-icon-prefix error';
        domainCardIconEl.textContent = '✖';
        domainResultCardEl.classList.add('result-error');
      } else {
        resultCardHeader.childNodes[1].nodeValue = \` Some Domain IPs Valid (\${validCount}/\${ips.length})\`;
        domainCardIconEl.className = 'status-icon-prefix warning';
        domainCardIconEl.textContent = '⚠';
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
             statusIcon.textContent = result.success ? '✔' : '✖';
             statusIcon.style.color = result.success ? 'var(--status-success-icon)' : 'var(--status-error-icon)';
        }
      } catch (error) {
        if (statusIcon) {
            statusIcon.textContent = '⚠';
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
        const cleanIP = ip.replace(/[\\[\\]]/g, '');
        const response = await fetch(\`./ip-info?ip=\${encodeURIComponent(cleanIP)}&token=\${TEMP_TOKEN}\`);
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
    headers: { 'content-type': 'text/html;charset=UTF-8' },
  });
}
