// @ts-ignore
import { connect } from 'cloudflare:sockets';

/**
 * Default User ID.
 * To generate your own UUID: https://www.uuidgenerator.net/
 */
const DEFAULT_USER_ID = 'd342d11e-d424-4583-b36e-524ab1f0afa4';

/**
 * Default proxy server addresses with ports.
 * These are used if no PROXYIP is set in environment variables or URL parameters.
 */
const DEFAULT_PROXY_IPS = ['nima.nscl.ir:443'];

/**
 * Global constants to avoid "magic strings" and "magic numbers".
 */
const CONSTANTS = {
    // VLESS protocol related constants (decoded from base64)
    VLESS_PROTOCOL: "vless",
    AT_SYMBOL: "@",
    CUSTOM_SUFFIX: "diana",

    // Subscription generation constants
    HTTP_PORTS: new Set([80]),
    HTTPS_PORTS: new Set([443]),
    URL_ED_PARAM: 'ed=2560',

    // Protocol header processing offsets
    PROTOCOL_OFFSETS: {
        VERSION: 0,
        UUID: 1,
        OPT_LENGTH: 17,
        COMMAND: 18,
        PORT: 19, // Relative to command
        ADDR_TYPE: 21, // Relative to command
        ADDR_LEN: 22, // Relative to command (for domain type)
        ADDR_VAL: 22 // Relative to command
    },

    // WebSocket ready states
    WS_READY_STATE_OPEN: 1,
    WS_READY_STATE_CLOSING: 2,
};


// =================================================================================
// Main Worker Logic
// =================================================================================

export default {
  async fetch(request, env, ctx) {
    try {
      const config = createRequestConfig(request, env);   // بر اساس URL و ENV
      if (request.headers.get('Upgrade') !== 'websocket')
        return handleHttpRequest(request, config);        // HTTP End-points

      return await handleWebSocketRequest(request, config); // WebSocket (VLESS)
    } catch (err) {
      return new Response(err?.toString() ?? 'Internal Error', { status: 500 });
    }
  }
};

/**
 * Handles all incoming HTTP (non-WebSocket) requests.
 * @param {Request} request The incoming request object.
 * @param {object} config The configuration object for this request.
 * @returns {Promise<Response>} A Response object.
 */
function handleHttpRequest(request, config) {
  const { url, host, proxyIP, proxyPort, userID } = config;
  const { pathname } = url;

  /* 1) Health-check */
  if (pathname === '/probe') {
    const cf = request.cf || {};
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For')   || '';
    return new Response(JSON.stringify({
      ip,
      asn     : cf.asn            || '',
      isp     : cf.asOrganization || cf.asnOrganization || '',
      city    : cf.city           || '',
      country : cf.country        || '',
      colo    : cf.colo           || ''
    }, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  }

  /* 2) Scamalytics */
  if (pathname === '/scamalytics-lookup') {
    const ip = url.searchParams.get('ip');
    if (!ip) return new Response('Missing ip param', { status: 400 });
    return fetchScamalyticsData(ip, config.scamalytics);
  }

    // Check if the path matches a valid user ID pattern
const matchedUUID = findMatchingUserID(pathname, userID);
if (matchedUUID) {
	if (pathname === `/${matchedUUID}`)
		return new Response(
			getBeautifulConfig(matchedUUID, host, `${proxyIP}:${proxyPort}`),
			{ status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8'} });

	if (pathname === `/sub/${matchedUUID}`) {
		const proxyPool = config.env.PROXYIP
			? config.env.PROXYIP.split(',').map(x=>x.trim())
			: [`${proxyIP}:${proxyPort}`];
		return new Response(
			GenSub(matchedUUID, host, proxyPool),
			{ status: 200, headers: { 'Content-Type': 'text/plain;charset=utf-8'} });
	}

	if (pathname === `/ipsub/${matchedUUID}`)
      return generateIpSubscription(matchedUUID, host);
  }

    // Fallback to a helpful message if no other route matches
    const fallbackHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Worker Instructions</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; background-color: #1a1a1a; color: #e0e0e0; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
            .container { text-align: left; padding: 2rem; border-radius: 8px; background-color: #2a2a2a; box-shadow: 0 4px 15px rgba(0,0,0,0.5); max-width: 700px; width: 100%; }
            h1 { text-align: center; color: #80bfff; margin-top: 0; }
            h2 { text-align: center; color: #57a6ff; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #444; padding-bottom: 0.5rem; }
            p { font-size: 1rem; line-height: 1.6; margin: 0.8rem 0; }
            code { display: block; background-color: #333; padding: 0.8rem; border-radius: 4px; font-family: "Courier New", Courier, monospace; font-size: 0.9rem; word-break: break-all; margin-top: 0.5rem; color: #a5d6ff; }
            strong { color: #ffffff; }
            hr { border: none; height: 1px; background-color: #444; margin: 1.5rem 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>How to Use This Worker</h1>
            <p>Please provide your User ID (UUID) in the URL to access the endpoints. Replace <code>${config.userID.split(',')[0]}</code> with your own UUID.</p>

            <hr>

            <p><strong>1. Main Configuration Page</strong><br>View individual configs and network info.</p>
            <code>https://${url.hostname}/${config.userID.split(',')[0]}</code>

            <p><strong>2. Standard Subscription Link</strong><br>A general-purpose subscription with multiple domains.</p>
            <code>https://${url.hostname}/sub/${config.userID.split(',')[0]}</code>

            <p><strong>3. Clean IP Subscription Link</strong><br>A subscription using a curated list of clean Cloudflare IPs.</p>
            <code>https://${url.hostname}/ipsub/${config.userID.split(',')[0]}</code>

            <h2>Optional Environment Variables</h2>
            <p>You can set these in your Cloudflare Worker's dashboard (Settings > Variables) to override the default configuration.</p>

            <p><strong>UUID</strong><br>Sets the user ID(s). Separate multiple UUIDs with a comma.</p>
            <code>d342d11e-d424-4583-b36e-524ab1f0afa4</code>

            <p><strong>PROXYIP</strong><br>Specifies backend proxy IPs/domains. Separate multiple with a comma.</p>
            <code>cdn.cloudflare.com:8443,104.16.132.229:443</code>

            <p><strong>SOCKS5</strong><br>Routes traffic through a SOCKS5 proxy (advanced).</p>
            <code>user:pass@1.2.3.4:1080</code>

            <p><strong>SCAMALYTICS_USERNAME</strong><br>Your username for the Scamalytics API service.</p>
            <code>your_username</code>

            <p><strong>SCAMALYTICS_API_KEY</strong><br>Your API key for the Scamalytics service.</p>
            <code>your_api_key_here</code>
        </div>
    </body>
    </html>
    `;
    return new Response(fallbackHtml, {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
    });
}

/**
 * Handles all incoming WebSocket requests.
 * @param {Request} request The incoming request object.
 * @param {object} config The configuration object for this request.
 * @returns {Promise<Response>} A Response object with WebSocket handlers.
 */
async function handleWebSocketRequest(request, config) {
  const pair = new WebSocketPair();
  const [ client, ws ] = Object.values(pair);
  ws.accept();

  let remoteWrapper = { value: null };
  let isDns = false;
  let target = '';

  const log = (...args)=>console.log('[WS]', ...args);
  const early = request.headers.get('sec-websocket-protocol') || '';

  const readable = MakeReadableWebSocketStream(ws, early, log);

  readable.pipeTo(new WritableStream({
    async write(chunk) {
      if (isDns) return;

      if (remoteWrapper.value) {
        const w = remoteWrapper.value.writable.getWriter();
        await w.write(chunk); w.releaseLock(); return;
      }

      const parsed = ProcessProtocolHeader(chunk, config.userID);
      if (parsed.hasError) throw new Error(parsed.message);
      if (parsed.isUDP)   throw new Error('UDP not supported');

      const { addressRemote, portRemote, addressType, rawDataIndex } = parsed;
      target = `${addressRemote}:${portRemote}`;
      const remain = chunk.slice(rawDataIndex);

      await HandleTCPOutBound(
        remoteWrapper, addressType, addressRemote, portRemote,
        remain, ws, log, config
      );
    },
    close() { log('readable closed'); },
    abort(r){ log('readable abort', r); }
  })).catch(e => { log('pipeTo err', e); safeCloseWebSocket(ws); });

  return new Response(null, { status:101, webSocket: client });
}

/**
 * Creates a unified configuration object for a single request.
 * It merges defaults, environment variables, and URL parameters in a specific order of precedence:
 * URL Parameters > Environment Variables > Defaults.
 * @param {Request} request The incoming request object.
 * @param {object} env The environment variables.
 * @returns {object} A comprehensive configuration object.
 */
function createRequestConfig(request, env) {
    const url = new URL(request.url);

function createRequestConfig(request, env) {
  const url = new URL(request.url);
  const cfg = {
    userID        : DEFAULT_USER_ID,
    proxyIPs      : DEFAULT_PROXY_IPS,
    socks5Address : '',
    socks5Relay   : false,
    scamalytics   : {
      username: env.SCAMALYTICS_USERNAME ?? 'dianaclk01',
      apiKey  : env.SCAMALYTICS_API_KEY  ?? 'c57eb62bbde89f00742cb3f92d7127f96132c9cea460f18c08fd5e62530c5604',
      baseUrl : 'https://api11.scamalytics.com/v3/'
    },
    env, url, host: url.hostname
  };

  if (env.UUID)    cfg.userID   = env.UUID;
  if (env.PROXYIP) cfg.proxyIPs = env.PROXYIP.split(',').map(x=>x.trim());
  if (env.SOCKS5)  cfg.socks5Address = env.SOCKS5;
  if (env.SOCKS5_RELAY) cfg.socks5Relay = env.SOCKS5_RELAY === 'true';

  const qs = url.searchParams;
  if (qs.get('proxyip'))  cfg.proxyIPs = qs.get('proxyip').split(',').map(x=>x.trim());
  if (qs.get('socks5'))   cfg.socks5Address = qs.get('socks5');
  if (qs.get('socks5_relay')) cfg.socks5Relay = qs.get('socks5_relay')==='true';

  if (!isValidUUID(cfg.userID.split(',')[0]))
    throw new Error('UUID format invalid');

  const selProxy = selectRandomAddress(cfg.proxyIPs);
  [cfg.proxyIP, cfg.proxyPort='443'] = selProxy.split(':');
  cfg.enableSocks = !!cfg.socks5Address;
  if (cfg.enableSocks) cfg.parsedSocks5Address = socks5AddressParser(cfg.socks5Address);
  return cfg;
}

/**
 * Generates the beautiful configuration UI.
 * @param {string} userID - The user's UUID.
 * @param {string} hostName - The hostname of the worker.
 * @param {string} proxyIPWithPort - The selected proxy IP with port (e.g., '1.2.3.4:443').
 * @returns {string} The full HTML for the configuration page.
 */
function getBeautifulConfig(userID, hostName, proxyIPWithPort) {
    const vlessPath = `/?${CONSTANTS.URL_ED_PARAM}`;
    const dreamConfig = `vless://${userID}@${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=chrome&type=ws&host=${hostName}&path=${encodeURIComponent(vlessPath)}#${hostName}-Xray`;
    const freedomConfig = `vless://${userID}@${hostName}:443?encryption=none&security=tls&sni=${hostName}&fp=firefox&type=ws&host=${hostName}&path=${encodeURIComponent(vlessPath)}#${hostName}-Singbox`;

    const subUrl = `https://${hostName}/ipsub/${userID}`;
    const subUrlEncoded = encodeURIComponent(subUrl);
    const clashMetaFullUrl = `clash://install-config?url=https://revil-sub.pages.dev/sub/clash-meta?url=${subUrlEncoded}&remote_config=&udp=false&ss_uot=false&show_host=false&forced_ws0rtt=true`;

  let html = `
	<!doctype html>
	<html lang="en">
	<head>
	  <meta charset="UTF-8" />
	  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
	  <title>VLESS Proxy Configuration</title>
	  <link rel="preconnect" href="https://fonts.googleapis.com">
	  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	  <link href="https.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap" rel="stylesheet">
	  <style>
	    * {
	      margin: 0;
	      padding: 0;
	      box-sizing: border-box;
	    }
	
	    @font-face {
	      font-family: "Aldine 401 BT Web";
	      src: url("https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/Aldine401_Mersedeh.woff2") format("woff2");
	      font-weight: 400; font-style: normal; font-display: swap;
	    }
	
	    @font-face {
	      font-family: "Styrene B LC";
	      src: url("https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Regular.woff2") format("woff2");
	      font-weight: 400; font-style: normal; font-display: swap;
	    }
	
	    @font-face {
	      font-family: "Styrene B LC";
	      src: url("https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Medium.woff2") format("woff2");
	      font-weight: 500; font-style: normal; font-display: swap;
	    }
	
	    :root {
	      --background-primary: #2a2421;
	      --background-secondary: #35302c;
	      --background-tertiary: #413b35;
	      --border-color: #5a4f45;
	      --border-color-hover: #766a5f;
	      --text-primary: #e5dfd6;
	      --text-secondary: #b3a89d;
	      --text-accent: #ffffff;
	      --accent-primary: #be9b7b;
	      --accent-secondary: #d4b595;
	      --accent-tertiary: #8d6e5c;
	      --accent-primary-darker: #8a6f56;
	      --button-text-primary: #2a2421;
	      --button-text-secondary: var(--text-primary);
	      --shadow-color: rgba(0, 0, 0, 0.35);
	      --shadow-color-accent: rgba(190, 155, 123, 0.4);
	      --border-radius: 8px;
	      --transition-speed: 0.2s;
	      --transition-speed-fast: 0.1s;
	      --transition-speed-medium: 0.3s;
	      --transition-speed-long: 0.6s;
	      --status-success: #70b570;
	      --status-error: #e05d44;
	      --status-warning: #e0bc44; 
	      --status-info: #4f90c4;
	
	      --serif: "Aldine 401 BT Web", "Times New Roman", Times, Georgia, ui-serif, serif;
	      --sans-serif: "Styrene B LC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, "Noto Color Emoji", sans-serif;
	      --mono-serif: "Fira Code", "Courier New", Courier, monospace;
	    }
	
	    body {
	      font-family: var(--sans-serif);
	      font-size: 16px;
	      font-weight: 400;
	      font-style: normal;
	      background-color: var(--background-primary);
	      color: var(--text-primary);
	      padding: 3rem;
	      line-height: 1.5;
	      -webkit-font-smoothing: antialiased;
	      -moz-osx-font-smoothing: grayscale;
	    }
	
	    .container {
	      max-width: 768;
	      margin: 20px auto;
	      padding: 0 12px;
	      border-radius: var(--border-radius);
	      box-shadow:
	        0 6px 15px rgba(0, 0, 0, 0.2),
	        0 0 25px 8px var(--shadow-color-accent);
	      transition: box-shadow var(--transition-speed-medium) ease;
	    }
	
	    .container:hover {
	      box-shadow:
	        0 8px 20px rgba(0, 0, 0, 0.25),
	        0 0 35px 10px var(--shadow-color-accent);
	    }
	
	    .header {
	      text-align: center;
	      margin-bottom: 40px;
	      padding-top: 30px;
	    }
	
	    .header h1 {
	      font-family: var(--serif);
	      font-weight: 400;
	      font-size: 2rem;
	      color: var(--text-accent);
	      margin-top: 0px;
	      margin-bottom: 2px;
	    }
	
	    .header p {
	      color: var(--text-secondary);
	      font-size: 12px;
	      font-weight: 400;
	    }
	
	    .config-card {
	      background: var(--background-secondary);
	      border-radius: var(--border-radius);
	      padding: 20px;
	      margin-bottom: 24px;
	      border: 1px solid var(--border-color);
	      transition:
	        border-color var(--transition-speed) ease,
	        box-shadow var(--transition-speed) ease;
	    }
	    
	    .config-card:hover {
	      border-color: var(--border-color-hover);
	      box-shadow: 0 4px 8px var(--shadow-color);
	    }
	
	    .config-title {
	      font-family: var(--serif);
	      font-size: 22px;
	      font-weight: 400;
	      color: var(--accent-secondary);
	      margin-bottom: 16px;
	      padding-bottom: 12px;
	      border-bottom: 1px solid var(--border-color);
	      display: flex;
	      align-items: center;
	      justify-content: space-between;
	    }
	
	    .config-title .refresh-btn {
	      position: relative;
	      overflow: hidden;
	      display: flex;
	      align-items: center;
	      gap: 4px;
	      font-family: var(--serif);
	      font-size: 12px;
	      padding: 6px 12px;
	      border-radius: 6px;
	      color: var(--accent-secondary);
	      background-color: var(--background-tertiary);
	      border: 1px solid var(--border-color);
	      cursor: pointer;
	      
	      transition:
	        background-color var(--transition-speed) ease,
	        border-color var(--transition-speed) ease,
	        color var(--transition-speed) ease,
	        transform var(--transition-speed) ease,
	        box-shadow var(--transition-speed) ease;
	    }
	    
	    .config-title .refresh-btn::before {
	      content: "";
	      position: absolute;
	      top: 0;
	      left: 0;
	      width: 100%;
	      height: 100%;
	      background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	      transform: translateX(-100%);
	      transition: transform var(--transition-speed-long) ease;
	      z-index: -1;
	    }
	    
	    .config-title .refresh-btn:hover {
	      letter-spacing: 0.5px;
	      font-weight: 600;
	      background-color: #4d453e;
	      color: var(--accent-primary);
	      border-color: var(--border-color-hover);
	      transform: translateY(-2px);
	      box-shadow: 0 4px 8px var(--shadow-color);
	    }
	    
	    .config-title .refresh-btn:hover::before {
	      transform: translateX(100%);
	    }
	    
	    .config-title .refresh-btn:active {
	      transform: translateY(0px) scale(0.98);
	      box-shadow: none;
	    }
	        
	    .refresh-icon {
	      width: 12px;
	      height: 12px;
	      stroke: currentColor;
	    }
	
	    .config-content {
	      position: relative;
	      background: var(--background-tertiary);
	      border-radius: var(--border-radius);
	      padding: 16px;
	      margin-bottom: 20px;
	      border: 1px solid var(--border-color);
	    }
	
	    .config-content pre {
	      overflow-x: auto;
	      font-family: var(--mono-serif);
	      font-size: 12px;
	      color: var(--text-primary);
	      margin: 0;
	      white-space: pre-wrap;
	      word-break: break-all;
	    }
	
	    .button {
	      display: inline-flex;
	      align-items: center;
	      justify-content: center;
	      gap: 8px;
	      padding: 8px 16px;
	      border-radius: var(--border-radius);
	      font-size: 13px;
	      font-weight: 500;
	      cursor: pointer;
	      border: 1px solid var(--border-color);
	      background-color: var(--background-tertiary);
	      color: var(--button-text-secondary);
	      transition:
	        background-color var(--transition-speed) ease,
	        border-color var(--transition-speed) ease,
	        color var(--transition-speed) ease,
	        transform var(--transition-speed) ease,
	        box-shadow var(--transition-speed) ease;
	      -webkit-tap-highlight-color: transparent;
	      touch-action: manipulation;
	      text-decoration: none;
	      overflow: hidden;
	      z-index: 1;
	    }
	
	    .button:focus-visible {
	      outline: 2px solid var(--accent-primary);
	      outline-offset: 2px;
	    }
	
	    .button:disabled {
	      opacity: 0.6;
	      cursor: not-allowed;
	      transform: none;
	      box-shadow: none;
	      transition: opacity var(--transition-speed) ease;
	    }
	
	    .button:not(.copy-buttons):not(.client-btn):hover {
	      background-color: #4d453e;
	      border-color: var(--border-color-hover);
	      transform: translateY(-1px);
	      box-shadow: 0 2px 4px var(--shadow-color);
	    }
	
	    .button:not(.copy-buttons):not(.client-btn):active {
	      transform: translateY(0px) scale(0.98);
	      box-shadow: none;
	    }
	
	    .copy-buttons {
	      position: relative;
	      display: flex;
	      gap: 4px;
	      overflow: hidden;
	      align-self: center;
	      font-family: var(--serif);
	      font-size: 12px;
	      padding: 6px 12px;
	      border-radius: 6px;
	      color: var(--accent-secondary);
	      border: 1px solid var(--border-color);
	      transition:
	        background-color var(--transition-speed) ease,
	        border-color var(--transition-speed) ease,
	        color var(--transition-speed) ease,
	        transform var(--transition-speed) ease,
	        box-shadow var(--transition-speed) ease;
	    }
	    
	    .copy-buttons::before,
	    .client-btn::before {
	      content: "";
	      position: absolute;
	      top: 0;
	      left: 0;
	      width: 100%;
	      height: 100%;
	      background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
	      transform: translateX(-100%);
	      transition: transform var(--transition-speed-long) ease;
	      z-index: -1;
	    }
	
	    .copy-buttons:hover::before,
	    .client-btn:hover::before {
	      transform: translateX(100%);
	    }
	
	    .copy-buttons:hover {
	      background-color: #4d453e;
	      letter-spacing: 0.5px;
	      font-weight: 600;
	      border-color: var(--border-color-hover);
	      transform: translateY(-2px);
	      box-shadow: 0 4px 8px var(--shadow-color);
	    }
	
	    .copy-buttons:active {
	      transform: translateY(0px) scale(0.98);
	      box-shadow: none;
	    }
	    
	    .copy-icon {
	      width: 12px;
	      height: 12px;
	      stroke: currentColor;
	    }
	    
	    .client-buttons {
	      display: grid;
	      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
	      gap: 12px;
	      margin-top: 16px;
	    }
	
	    .client-btn {
	      width: 100%;
	      background-color: var(--accent-primary);
	      color: var(--background-tertiary);
	      border-radius: 6px;
	      border-color: var(--accent-primary-darker);
	      position: relative;
	      overflow: hidden;
	      transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
	      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
	    }
	
	    .client-btn::before {
	      left: -100%;
	      transition: transform 0.6s ease;
	      z-index: 1;
	    }
	
	    .client-btn::after {
	      content: "";
	      position: absolute;
	      bottom: -5px;
	      left: 0;
	      width: 100%;
	      height: 5px;
	      background: linear-gradient(90deg, var(--accent-tertiary), var(--accent-secondary));
	      opacity: 0;
	      transition: all 0.3s ease;
	      z-index: 0;
	    }
	
	    .client-btn:hover {
	      text-transform: uppercase; 
	      letter-spacing: 0.3px;
	      transform: translateY(-3px);
	      background-color: var(--accent-secondary);
	      color: var(--button-text-primary);
	      box-shadow: 0 5px 15px rgba(190, 155, 123, 0.5);
	      border-color: var(--accent-secondary);
	    }
	
	    .client-btn:hover::before {
	      transform: translateX(100%);
	    }
	
	    .client-btn:hover::after {
	      opacity: 1;
	      bottom: 0;
	    }
	
	    .client-btn:active {
	      transform: translateY(0) scale(0.98);
	      box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2);
	      background-color: var(--accent-primary-darker);
	    }
	
	    .client-btn .client-icon {
	      position: relative;
	      z-index: 2;
	      transition: transform 0.3s ease;
	    }
	
	    .client-btn:hover .client-icon {
	      transform: rotate(15deg) scale(1.1);
	    }
	
	    .client-btn .button-text {
	      position: relative;
	      z-index: 2;
	      transition: letter-spacing: 0.3s ease;
	    }
	
	    .client-btn:hover .button-text { letter-spacing: 0.5px; }
	    .client-icon { width: 18px; height: 18px; border-radius: 6px; background-color: var(--background-secondary); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
	    .client-icon svg { width: 14px; height: 14px; fill: var(--accent-secondary); }
	
	    .button.copied { background-color: var(--accent-secondary) !important; color: var(--background-tertiary) !important; }
	    .button.error { background-color: #c74a3b !important; color: var(--text-accent) !important; }
	
	    .footer { text-align: center; margin-top: 20px; padding-bottom: 40px; color: var(--text-secondary); font-size: 12px; }
	    .footer p { margin-bottom: 0px; }
	    
	    ::-webkit-scrollbar { width: 8px; height: 8px; }
	    ::-webkit-scrollbar-track { background: var(--background-primary); border-radius: 4px; }
	    ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; border: 2px solid var(--background-primary); }
	    ::-webkit-scrollbar-thumb:hover { background: var(--border-color-hover); }
	    * { scrollbar-width: thin; scrollbar-color: var(--border-color) var(--background-primary); }
	
	    .ip-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 24px; }
	    .ip-info-section { background-color: var(--background-tertiary); border-radius: var(--border-radius); padding: 16px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 20px; }
	    .ip-info-header { display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; }
	    .ip-info-header svg { width: 20px; height: 20px; stroke: var(--accent-secondary); }
	    .ip-info-header h3 { font-family: var(--serif); font-size: 18px; font-weight: 400; color: var(--accent-secondary); margin: 0; }
	    .ip-info-content { display: flex; flex-direction: column; gap: 10px; }
	    .ip-info-item { display: flex; flex-direction: column; gap: 2px; }
	    .ip-info-item .label { font-size: 11px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
	    .ip-info-item .value { font-size: 14px; color: var(--text-primary); word-break: break-all; line-height: 1.4; }
	
	    .badge { display: inline-flex; align-items: center; justify-content: center; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
	    .badge-yes { background-color: rgba(112, 181, 112, 0.15); color: var(--status-success); border: 1px solid rgba(112, 181, 112, 0.3); }
	    .badge-no { background-color: rgba(224, 93, 68, 0.15); color: var(--status-error); border: 1px solid rgba(224, 93, 68, 0.3); }
	    .badge-neutral { background-color: rgba(79, 144, 196, 0.15); color: var(--status-info); border: 1px solid rgba(79, 144, 196, 0.3); }
	    .badge-warning { background-color: rgba(224, 188, 68, 0.15); color: var(--status-warning); border: 1px solid rgba(224, 188, 68, 0.3); }
	
	    .skeleton { display: block; background: linear-gradient(90deg, var(--background-tertiary) 25%, var(--background-secondary) 50%, var(--background-tertiary) 75%); background-size: 200% 100%; animation: loading 1.5s infinite; border-radius: 4px; height: 16px; }
	    @keyframes loading { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
	    .country-flag { display: inline-block; width: 18px; height: auto; max-height: 14px; margin-right: 6px; vertical-align: middle; border-radius: 2px; }
	
	     @media (max-width: 768px) {
	      body { padding: 20px; }
	      .container { padding: 0 14px; width: min(100%, 768px); }
	      .ip-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 18px; }
	      .header h1 { font-size: 1.8rem; }
	      .header p { font-size: 0.7rem }
	      .ip-info-section { padding: 14px; gap: 18px; }
	      .ip-info-header h3 { font-size: 16px; }
	      .ip-info-header { gap: 8px; }
	      .ip-info-content { gap: 8px; }
	      .ip-info-item .label { font-size: 11px; }
	      .ip-info-item .value { font-size: 13px; }
	      .config-card { padding: 16px; }
	      .config-title { font-size: 18px; }
	      .config-title .refresh-btn { font-size: 11px; }
	      .config-content pre { font-size: 12px; }
	      .client-buttons { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
	      .button { font-size: 12px; }
	       .copy-buttons { font-size: 11px; }
	    }
	
	    @media (max-width: 480px) {
	      body { padding: 16px; }
	      .container { padding: 0 12px; width: min(100%, 390px); }
	      .header h1 { font-size: 20px; }
	      .header p { font-size: 8px; }
	      .ip-info-section { padding: 14px; gap: 16px; }
	      .ip-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
	      .ip-info-header h3 { font-size: 14px; }
	      .ip-info-header { gap: 6px; }
	      .ip-info-content { gap: 6px; }
	      .ip-info-header svg { width: 18px; height: 18px; }
	      .ip-info-item .label { font-size: 9px; }
	      .ip-info-item .value { font-size: 11px; }
	      .badge { padding: 2px 6px; font-size: 10px; border-radius: 10px; }
	      .config-card { padding: 10px; }
	      .config-title { font-size: 16px; }
	      .config-title .refresh-btn { font-size: 10px; }
	      .config-content { padding: 12px; }
	      .config-content pre { font-size: 10px; }
	      .client-buttons { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
	      .button { padding: 4px 8px; font-size: 11px; }
	      .copy-buttons { font-size: 10px; }
	      .footer { font-size: 10px; }
	    }
	
	    @media (max-width: 359px) {
	      body { padding: 12px; font-size: 14px; }
	      .container { max-width: 100%; padding: 8px; }
	      .header h1 { font-size: 16px; }
	      .header p { font-size: 6px; }
	      .ip-info-section { padding: 12px; gap: 12px; }
	      .ip-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
	      .ip-info-header h3 { font-size: 13px; }
	      .ip-info-header { gap: 4px; }
	      .ip-info-content { gap: 4px; }
	      .ip-info-header svg { width: 16px; height: 16px; }
	      .ip-info-item .label { font-size: 8px; }
	      .ip-info-item .value { font-size: 10px; }
	      .badge { padding: 1px 4px; font-size: 9px; border-radius: 8px; }
	      .config-card { padding: 8px; }
	      .config-title { font-size: 13px; }
	      .config-title .refresh-btn { font-size: 9px; }
	      .config-content { padding: 8px; }
	      .config-content pre { font-size: 8px; }
	      .client-buttons { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
	      .button { padding: 3px 6px; font-size: 10px; }
	      .copy-buttons { font-size: 9px; }
	      .footer { font-size: 8px; }
	    }
	
	    @media (min-width: 360px) { .container { max-width: 95%; } }
	    @media (min-width: 480px) { .container { max-width: 90%; } }
	    @media (min-width: 640px) { .container { max-width: 600px; } }
	    @media (min-width: 768px) { .container { max-width: 720px; } }
	    @media (min-width: 1024px) { .container { max-width: 800px; } }
	  </style>
	</head>
	<body data-proxy-ip="${proxyIPWithPort}">
	  <div class="container">
	    <div class="header">
	      <h1>VLESS Proxy Configuration</h1>
	      <p>Copy the configuration or import directly into your client</p>
	    </div>
	
	    <div class="config-card">
	      <div class="config-title">
	        <span>Network Information</span>
	        <button id="refresh-ip-info" class="refresh-btn" aria-label="Refresh IP information">
	          <svg class="refresh-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
	            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
	          </svg>
	          Refresh
	        </button>
	      </div>
	
	      <div class="ip-info-grid">
	        <div class="ip-info-section">
	          <div class="ip-info-header">
	            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	              <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v16.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h6.9c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V3.6c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5z"/>
	              <circle cx="12" cy="18" r="1"/>
	            </svg>
	            <h3>Proxy Server</h3>
	          </div>
	          <div class="ip-info-content">
	            <div class="ip-info-item"> 
	              <span class="label">Proxy Host</span>
	              <span class="value" id="proxy-host"><span class="skeleton" style="width: 150px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">IP Address</span>
	              <span class="value" id="proxy-ip"><span class="skeleton" style="width: 120px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">Location</span>
	              <span class="value" id="proxy-location"><span class="skeleton" style="width: 100px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">ISP Provider</span>
	              <span class="value" id="proxy-isp"><span class="skeleton" style="width: 140px;"></span></span>
	            </div>
	          </div>
	        </div>
	
	        <div class="ip-info-section">
	          <div class="ip-info-header">
	            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	              <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>
	            </svg>
	            <h3>Your Connection</h3>
	          </div>
	          <div class="ip-info-content">
	            <div class="ip-info-item">
	              <span class="label">Your IP</span>
	              <span class="value" id="client-ip"><span class="skeleton" style="width: 110px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">Location</span>
	              <span class="value" id="client-location"><span class="skeleton" style="width: 90px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">ISP Provider</span>
	              <span class="value" id="client-isp"><span class="skeleton" style="width: 130px;"></span></span>
	            </div>
	            <div class="ip-info-item">
	              <span class="label">Risk Score</span> 
	              <span class="value" id="client-proxy"> 
	                <span class="skeleton" style="width: 100px;"></span> 
	              </span>
	            </div>
	          </div>
	        </div>
	      </div>
	    </div>
	
	    <div class="config-card">
	      <div class="config-title">
	        <span>Xray Core Clients</span>
	        <button class="button copy-buttons" onclick="copyToClipboard(this, '{{DREAM_CONFIG}}')">
	          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
	          Copy
	        </button>
	      </div>
	      <div class="config-content">
	        <pre id="xray-config">{{DREAM_CONFIG}}</pre>
	      </div>
	      <div class="client-buttons">
	        <a href="hiddify://install-config?url={{SUB_URL_ENCODED}}" class="button client-btn">
	          <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></span>
	          <span class="button-text">Import to Hiddify</span>
	        </a>
	        <a href="v2rayng://install-config?url={{SUB_URL_ENCODED}}" class="button client-btn">
	          <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2L4 5v6c0 5.5 3.5 10.7 8 12.3 4.5-1.6 8-6.8 8-12.3V5l-8-3z" /></svg></span>
	          <span class="button-text">Import to V2rayNG</span>
	        </a>
	      </div>
	    </div>
	
	    <div class="config-card">
	      <div class="config-title">
	        <span>Sing-Box Core Clients</span>
	        <button class="button copy-buttons" onclick="copyToClipboard(this, '{{FREEDOM_CONFIG}}')">
	          <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
	          Copy
	        </button>
	      </div>
	      <div class="config-content">
	        <pre id="singbox-config">{{FREEDOM_CONFIG}}</pre>
	      </div>
	      <div class="client-buttons">
	        <a href="{{CLASH_META_URL}}" class="button client-btn">
	          <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg></span>
	          <span class="button-text">Import to Clash Meta</span>
	        </a>
	        <a href="sn://subscription?url={{SUB_URL_ENCODED}}" class="button client-btn">
	          <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M20,8h-3V6c0-1.1-0.9-2-2-2H9C7.9,4,7,4.9,7,6v2H4C2.9,8,2,8.9,2,10v9c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-9 C22,8.9,21.1,8,20,8z M9,6h6v2H9V6z M20,19H4v-2h16V19z M20,15H4v-5h3v1c0,0.55,0.45,1,1,1h1.5c0.28,0,0.5-0.22,0.5-0.5v-0.5h4v0.5 c0,0.28,0.22,0.5,0.5,0.5H16c0.55,0,1-0.45,1-1v-1h3V15z" /><circle cx="8.5" cy="13.5" r="1" /><circle cx="15.5" cy="13.5" r="1" /><path d="M12,15.5c-0.55,0-1-0.45-1-1h2C13,15.05,12.55,15.5,12,15.5z" /></svg></span>
	          <span class="button-text">Import to NekoBox</span>
	        </a>
	      </div>
	    </div>
	
	    <div class="footer">
	      <p>© <span id="current-year">{{YEAR}}</span> REvil - All Rights Reserved</p>
	      <p>Secure. Private. Fast.</p>
	    </div>
	  </div>
	
	  <script>
	    function copyToClipboard(button, text) {
	      const originalHTML = button.innerHTML;
	      navigator.clipboard.writeText(text).then(() => {
	        button.innerHTML = 'Copied!';
	        button.classList.add("copied");
	        button.disabled = true;
	        setTimeout(() => {
	          button.innerHTML = originalHTML;
	          button.classList.remove("copied");
	          button.disabled = false;
	        }, 1200);
	      }).catch(err => {
	        console.error("Failed to copy text: ", err);
	        button.innerHTML = 'Error';
	        button.classList.add("error");
	        button.disabled = true;
	        setTimeout(() => {
	          button.innerHTML = originalHTML;
	          button.classList.remove("error");
	          button.disabled = false;
	        }, 1500);
	      });
	    }
	
	    async function fetchClientPublicIP() {
	      try {
	        const response = await fetch('https://api.ipify.org?format=json');
	        if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
	        const data = await response.json();
	        return data.ip;
	      } catch (error) {
	        console.error('Error fetching client IP:', error);
	        return null;
	      }
	    }
	    
	    async function fetchScamalyticsClientInfo(clientIp) {
	      if (!clientIp) return null;
	      try {
	        const workerLookupUrl = \`/scamalytics-lookup?ip=\${encodeURIComponent(clientIp)}\`; 
	        const response = await fetch(workerLookupUrl);
	        if (!response.ok) {
	          let errorDetail = \`Worker request failed: \${response.status}\`;
	          try {
	            const errorData = await response.json();
	            errorDetail = errorData.error || errorData.scamalytics?.error || response.statusText;
	          } catch (e) { /* Ignore parsing error */ }
	          throw new Error(errorDetail);
	        }
	        const data = await response.json();
	        if (data.scamalytics?.status === 'error') {
	            throw new Error(data.scamalytics.error || 'Scamalytics API error via Worker');
	        }
	        return data;
	      } catch (error) {
	        console.error('Error fetching from Scamalytics via Worker:', error);
	        return null;
	      }
	    }
	    
	    function updateScamalyticsClientDisplay(data) {
	      const prefix = 'client';
	      if (!data?.scamalytics || data.scamalytics.status !== 'ok') {
	        showError(prefix, data?.scamalytics?.error || 'Could not load client data from Scamalytics');
	        return;
	      }
	    
	      const sa = data.scamalytics;
	      const dbip = data.external_datasources?.dbip;
	      const elements = {
	        ip: document.getElementById(\`\${prefix}-ip\`),
	        location: document.getElementById(\`\${prefix}-location\`),
	        isp: document.getElementById(\`\${prefix}-isp\`),
	        proxy: document.getElementById(\`\${prefix}-proxy\`)
	      };
	    
	      if (elements.ip) elements.ip.textContent = sa.ip || "N/A";
	      if (elements.isp) elements.isp.textContent = sa.scamalytics_isp || dbip?.isp_name || "N/A";

	      if (elements.location) {
	        const city = dbip?.ip_city || ''; 
	        const countryName = dbip?.ip_country_name || ''; 
	        const countryCode = dbip?.ip_country_code?.toLowerCase() || '';
	        let flagHtml = countryCode ? \`<img src="https://flagcdn.com/w20/\${countryCode}.png" srcset="https://flagcdn.com/w40/\${countryCode}.png 2x" alt="\${dbip.ip_country_code}" class="country-flag"> \` : '';
	        let textPart = [city, countryName].filter(Boolean).join(', ');
	        elements.location.innerHTML = (flagHtml || textPart) ? \`\${flagHtml}\${textPart}\`.trim() : "N/A";
	      }
	    
	      if (elements.proxy) { 
	        const score = sa.scamalytics_score; 
	        const risk = sa.scamalytics_risk;   
	        let riskText = "Unknown";
	        let badgeClass = "badge-neutral";
	        if (typeof score !== 'undefined' && score !== null) {
	            riskText = \`Score \${score} - \${risk ? risk.charAt(0).toUpperCase() + risk.slice(1) : 'N/A'}\`;
	            switch (risk?.toLowerCase()) {
	                case "low": badgeClass = "badge-yes"; break;
	                case "medium": badgeClass = "badge-warning"; break;
	                case "high": case "very high": badgeClass = "badge-no"; break;
	            }
	        }
	        elements.proxy.innerHTML = \`<span class="badge \${badgeClass}">\${riskText}</span>\`;
	      }
	    }
	    
        async function fetchProxyGeoInfo(ip) {
            if (!ip) return null;
            try {
                const response = await fetch(\`https://ip-api.io/json/\${ip}\`);
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(\`HTTP error! status: \${response.status}, message: \${errorText}\`);
                }
                const data = await response.json();
                // Basic validation of the response
                if (data && (data.ip || data.country_code)) {
                    return data;
                }
                return null;
            } catch (error) {
                console.error('IP API Error (ip-api.io):', error);
                return null;
            }
        }
	    
	    function updateProxyDisplay(geo, originalHost) {
	      const hostElement = document.getElementById('proxy-host');
	      if (hostElement) hostElement.textContent = originalHost || "N/A";

	      const ipElement = document.getElementById('proxy-ip');
	      const locationElement = document.getElementById('proxy-location');
	      const ispElement = document.getElementById('proxy-isp');
	    
	      if (!geo) { 
	        showError('proxy', 'Geo data is null or invalid.', originalHost);
	        return;
	      }
	    
	      if (ipElement) ipElement.textContent = geo.ip || "N/A";
	      if (ispElement) ispElement.textContent = geo.isp || geo.organisation || geo.org || geo.as_name || geo.as || 'N/A';

	      if (locationElement) {
	        const city = geo.city || '';
	        const countryName = geo.country_name || '';
	        const countryCode = geo.country_code?.toLowerCase() || '';
	        let flagHtml = countryCode ? \`<img src="https://flagcdn.com/w20/\${countryCode}.png" srcset="https://flagcdn.com/w40/\${countryCode}.png 2x" alt="\${geo.country_code}" class="country-flag"> \` : '';
	        let textPart = [city, countryName].filter(Boolean).join(', ');
	        locationElement.innerHTML = (flagHtml || textPart) ? \`\${flagHtml}\${textPart}\`.trim() : "N/A";
	      }
	    }
	    
	    function showError(prefix, message = "Could not load data", originalHostForProxy = null) {
	      console.warn(\`\${prefix} data loading failed: \${message}\`);
	      const elements = {
	        'proxy-host': originalHostForProxy || "N/A",
	        'proxy-ip': "N/A", 'proxy-location': "N/A", 'proxy-isp': "N/A",
	        'client-ip': "N/A", 'client-location': "N/A", 'client-isp': "N/A",
	        'client-proxy': '<span class="badge badge-neutral">N/A</span>'
	      };
          Object.keys(elements).forEach(id => {
              if (id.startsWith(prefix)) {
                  const el = document.getElementById(id);
                  if (el) el.innerHTML = elements[id];
              }
          });
	    }
	    
	    async function loadNetworkInfo() {
            const proxyHostVal = document.body.getAttribute('data-proxy-ip') || "N/A";
            document.getElementById('proxy-host').textContent = proxyHostVal;

            // --- Load Proxy Server Info ---
            if (proxyHostVal !== "N/A") {
                try {
                    // Simple regex for an IP address
                    const isIpAddress = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(proxyHostVal.split(':')[0]);
                    let resolvedProxyIp = proxyHostVal.split(':')[0];

                    // If it's not an IP address, resolve it using a reliable DoH provider
                    if (!isIpAddress) {
                        const dnsRes = await fetch(\`https://dns.google/resolve?name=\${encodeURIComponent(resolvedProxyIp)}&type=A\`);
                        if (dnsRes.ok) {
                            const dnsData = await dnsRes.json();
                            if (dnsData.Answer && dnsData.Answer.length > 0) {
                                resolvedProxyIp = dnsData.Answer[0].data;
                            } else {
                                console.warn('DNS lookup had no A records for proxy domain:', resolvedProxyIp);
                            }
                        } else {
                            console.error(\`DNS lookup failed for \${resolvedProxyIp}: \${dnsRes.status}\`);
                        }
                    }

                    const proxyGeoData = await fetchProxyGeoInfo(resolvedProxyIp);
                    if (proxyGeoData) {
                        updateProxyDisplay(proxyGeoData, proxyHostVal);
                    } else {
                        showError('proxy', \`Could not load proxy geo data for \${resolvedProxyIp}.\`, proxyHostVal);
                    }
                } catch (e) {
                    showError('proxy', \`Error processing proxy info: \${e.message}\`, proxyHostVal);
                }
            } else {
                showError('proxy', 'Proxy Host not available', "N/A");
            }

            // --- Load Client Info ---
            try {
                const clientIp = await fetchClientPublicIP();
                if (clientIp) {
                    document.getElementById('client-ip').textContent = clientIp;
                    const scamalyticsData = await fetchScamalyticsClientInfo(clientIp);
                    if (scamalyticsData) {
                        updateScamalyticsClientDisplay(scamalyticsData);
                    } else {
                        showError('client', 'Failed to get full details from Scamalytics.');
                    }
                } else {
                    showError('client', 'Could not determine your IP address.');
                }
            } catch (e) {
                showError('client', \`Error processing client info: \${e.message}\`);
            }
	    }
	    
	    document.getElementById('refresh-ip-info')?.addEventListener('click', function() {
	      const button = this;
	      const icon = button.querySelector('.refresh-icon');
	      button.disabled = true;
	      if (icon) icon.style.animation = 'spin 1s linear infinite';
	    
	      const resetToSkeleton = (prefix) => {
	        const elementsToReset = ['host', 'ip', 'location', 'isp', 'proxy'];
	        elementsToReset.forEach(elemKey => {
	          const element = document.getElementById(\`\${prefix}-\${elemKey}\`);
	          if (element) {
	            element.innerHTML = '<span class="skeleton" style="width: 80%;"></span>';
	          }
	        });
	      };
	    
	      resetToSkeleton('proxy');
	      resetToSkeleton('client');
	      loadNetworkInfo().finally(() => setTimeout(() => {
	        button.disabled = false; if (icon) icon.style.animation = '';
	      }, 500));
	    });
	    
	    const style = document.createElement('style');
	    style.textContent = \`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\`;
	    document.head.appendChild(style);
	    
	    document.addEventListener('DOMContentLoaded', () => {
	      loadNetworkInfo();
	    });
	</script>
	</body>
	</html>
	`;
	
    html = html
      .replace(/{{PROXY_IP}}/g, proxyIPWithPort)
      .replace(/{{DREAM_CONFIG}}/g, dreamConfig)
      .replace(/{{FREEDOM_CONFIG}}/g, freedomConfig)
      .replace(/{{CLASH_META_URL}}/g, clashMetaFullUrl)
      .replace(/{{SUB_URL_ENCODED}}/g, subUrlEncoded)
      .replace(/{{YEAR}}/g, new Date().getFullYear().toString());

    return html;
}

/**
 * Generates a standard subscription link with various domains and ports.
 * @param {string} userID_path The user ID(s).
 * @param {string} hostname The worker hostname.
 * @param {string[]} proxyIPArray Array of proxy IPs.
 * @returns {string} Base64 encoded subscription content.
 */
function GenSub(userID_path, hostname, proxyIPArray) {
    const mainDomains = new Set([
        hostname, 'creativecommons.org', 'sky.rethinkdns.com', 'www.speedtest.net', 'cfip.1323123.xyz', 'cfip.xxxxxxxx.tk', 'cf.090227.xyz', 'go.inmobi.com', 'cf.877771.xyz', 'www.wto.org', 'cdn.tzpro.xyz', 'fbi.gov', 'time.is', 'zula.ir', 'ip.sb', ...DEFAULT_PROXY_IPS,
    ]);

    const userIDArray = userID_path.includes(',') ? userID_path.split(",") : [userID_path];

    const randomPath = () => `/?${CONSTANTS.URL_ED_PARAM}`;
    const commonUrlPartHttp = `?encryption=none&security=none&fp=firefox&type=ws&host=${hostname}&path=${encodeURIComponent(randomPath())}#`;
    const commonUrlPartHttps = `?encryption=none&security=tls&sni=${hostname}&fp=chrome&type=ws&host=${hostname}&path=${encodeURIComponent(randomPath())}#`;

    const allUrls = [];

    userIDArray.forEach(userID => {
        if (!hostname.includes('pages.dev')) {
            mainDomains.forEach(domain => {
                CONSTANTS.HTTP_PORTS.forEach(port => {
                    const urlPart = `${hostname.split('.')[0]}-${domain}-HTTP-${port}`;
                    const mainProtocolHttp = `${CONSTANTS.VLESS_PROTOCOL}://${userID}${CONSTANTS.AT_SYMBOL}${domain}:${port}${commonUrlPartHttp}${urlPart}`;
                    allUrls.push(mainProtocolHttp);
                });
            });
        }
        mainDomains.forEach(domain => {
            CONSTANTS.HTTPS_PORTS.forEach(port => {
                const urlPart = `${hostname.split('.')[0]}-${domain}-HTTPS-${port}`;
                const mainProtocolHttps = `${CONSTANTS.VLESS_PROTOCOL}://${userID}${CONSTANTS.AT_SYMBOL}${domain}:${port}${commonUrlPartHttps}${urlPart}`;
                allUrls.push(mainProtocolHttps);
            });
        });
        proxyIPArray.forEach(proxyAddr => {
            const [proxyHost, proxyPort = '443'] = proxyAddr.split(':');
            const urlPart = `${hostname.split('.')[0]}-${proxyHost}-HTTPS-${proxyPort}`;
            const secondaryProtocolHttps = `${CONSTANTS.VLESS_PROTOCOL}://${userID}${CONSTANTS.AT_SYMBOL}${proxyHost}:${proxyPort}${commonUrlPartHttps}${urlPart}-${CONSTANTS.CUSTOM_SUFFIX}`;
            allUrls.push(secondaryProtocolHttps);
        });
    });

    return btoa(allUrls.join('\n'));
}


/**
 * Generates a subscription link from a list of clean IPs.
 * @param {string} userID - The user's UUID.
 * @param {string} hostname - The hostname of the worker.
 * @param {string[]} ips - An array of IP addresses.
 * @returns {string} Base64 encoded subscription content.
 */
function GenIpSub(userID, hostname, ips) {
    const configs = [];
    const vlessPath = `/?${CONSTANTS.URL_ED_PARAM}`;
    const commonUrlPart = `?encryption=none&security=tls&sni=${hostname}&fp=chrome&type=ws&host=${hostname}&path=${encodeURIComponent(vlessPath)}#`;

    ips.forEach(ip => {
        const configName = `REvil-${ip}`;
        const vlessUrl = `${CONSTANTS.VLESS_PROTOCOL}://${userID}${CONSTANTS.AT_SYMBOL}${ip}:443${commonUrlPart}${encodeURIComponent(configName)}`;
        configs.push(vlessUrl);
    });

    return btoa(configs.join('\n'));
}

/**
 * Fetches clean IPs and generates a subscription response.
 * @param {string} matchingUserID The user ID.
 * @param {string} host The worker hostname.
 * @returns {Promise<Response>}
 */
async function generateIpSubscription(matchingUserID, host) {
    try {
        const response = await fetch('https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch IPs: ${response.status}`);
        }
        const data = await response.json();
        const ips = [...(data.ipv4 || []), ...(data.ipv6 || [])].map(item => item.ip);

        if (ips.length === 0) {
            return new Response("No IPs found in the source.", { status: 404 });
        }

        const content = GenIpSub(matchingUserID, host, ips);
        return new Response(content, {
            status: 200,
            headers: { "Content-Type": "text/plain;charset=utf-8" },
        });
    } catch (error) {
        console.error("Error in /ipsub endpoint:", error);
        return new Response(`Failed to generate IP subscription: ${error.message}`, { status: 500 });
    }
}

/**
 * Handles the TCP outbound connection for a WebSocket stream.
 * @param {{value: any}} remoteSocketWrapper - Wrapper object to hold the remote socket.
 * @param {number} addressType - The type of the address (1 for IPv4, 2 for domain, 3 for IPv6).
 * @param {string} addressRemote - The remote address.
 * @param {number} portRemote - The remote port.
 * @param {Uint8Array} rawClientData - The initial data from the client.
 * @param {WebSocket} webSocket - The client's WebSocket.
 * @param {function} log - The logging function.
 * @param {object} config - The request configuration object.
 */
async function HandleTCPOutBound(remoteSocketWrapper, addressType, addressRemote, portRemote, rawClientData, webSocket, protocolResponseHeader, log, config) {
    async function connectAndWrite(address, port, useSocks = false) {
        log(`Attempting to connect to ${address}:${port}` + (useSocks ? " via SOCKS5" : ""));

        const connectOptions = {
            hostname: address,
            port: port,
        };

        if (port === 443) {
            connectOptions.secureTransport = "on";
        }

        const tcpSocket = useSocks ?
            await socks5Connect(addressType, address, port, log, config.parsedSocks5Address) :
            connect(connectOptions);

        remoteSocketWrapper.value = tcpSocket;
        log(`Connected to ${address}:${port}`);

        const writer = tcpSocket.writable.getWriter();
        await writer.write(rawClientData);
        writer.releaseLock();
        return tcpSocket;
    }

    try {
        let tcpSocket;
        // If SOCKS5 is enabled, all traffic goes through it.
        if (config.enableSocks) {
             tcpSocket = await connectAndWrite(addressRemote, portRemote, true);
        } else {
            // Otherwise, connect directly or through the proxyIP.
            const isCloudflareIP = await isCloudflare(addressRemote);
            if(isCloudflareIP) {
                 tcpSocket = await connectAndWrite(addressRemote, portRemote, false);
            } else {
                 tcpSocket = await connectAndWrite(config.proxyIP, config.proxyPort, false);
            }
        }

        if (tcpSocket) {
             RemoteSocketToWS(tcpSocket, webSocket, protocolResponseHeader, log);
        } else {
            throw new Error("Failed to establish TCP socket.");
        }
    } catch (error) {
        log(`HandleTCPOutBound error: ${error.message}`);
        safeCloseWebSocket(webSocket);
    }
}

/**
 * Processes the initial VLESS protocol header from the client.
 * @param {ArrayBuffer} protocolBuffer - The incoming data chunk.
 * @param {string} configuredUserID - The configured UUID(s) for the worker.
 * @returns {object} Parsed protocol information or an error.
 */

function ProcessProtocolHeader(buffer, configuredIDs) {
  if (buffer.byteLength < 24) return {hasError:true, message:'buffer too short'};
  const dv = new DataView(buffer);
  const off = CONSTANTS.PROTOCOL_OFFSETS;

  const ver = dv.getUint8(off.VERSION);
  if (ver !== 1) return {hasError:true, message:'Unsupported VLESS ver'};

	const recvUUID = stringify(new Uint8Array(buffer.slice(off.UUID, off.UUID+16)));

	const allowed = configuredIDs.split(',').map(s=>s.trim().toLowerCase());
	if (!allowed.includes(recvUUID.toLowerCase()))
  	return {hasError:true, message:`Invalid user ${recvUUID}`};

	const optLen  = dv.getUint8(off.OPT_LENGTH);
	const cmd     = dv.getUint8(off.COMMAND + optLen);
	const port    = dv.getUint16(off.COMMAND + optLen + 1);
	const aType   = dv.getUint8(off.COMMAND + optLen + 3);
	const addrIdx = off.COMMAND + optLen + 4;

	let addr = '', aLen=0;
	switch (aType) {
		case 1: aLen=4; addr=Array.from(new Uint8Array(buffer.slice(addrIdx,addrIdx+4))).join('.'); break;
		case 2: aLen=dv.getUint8(addrIdx-1); addr=new TextDecoder().decode(buffer.slice(addrIdx, addrIdx+aLen)); break;
		case 3: aLen=16; addr=[...new Uint16Array(buffer.slice(addrIdx,addrIdx+16))].map(x=>x.toString(16).padStart(4,'0')).join(':'); break;
		default: return {hasError:true,message:`Bad ATYP ${aType}`};
	}

	return {
		hasError:false, addressRemote:addr, portRemote:port,
		addressType:aType, rawDataIndex: addrIdx+aLen,
		isUDP: cmd===2
  };
}

/**
 * Pipes data from a remote TCP socket to the client's WebSocket.
 * @param {any} remoteSocket - The remote TCP socket.
 * @param {WebSocket} webSocket - The client's WebSocket.
 * @param {function} log - Logging function.
 */
async function RemoteSocketToWS(remoteSocket, webSocket, protocolResponseHeader, log) {
    // Create a new AbortController for this connection
    const abortController = new AbortController();
    const { signal } = abortController;

    try {
        await remoteSocket.readable.pipeTo(new WritableStream({
            async write(chunk) {
                if (webSocket.readyState === CONSTANTS.WS_READY_STATE_OPEN) {
                    // Prepend the protocol response header if it exists
                    if (protocolResponseHeader) {
                        const newChunk = new Uint8Array(protocolResponseHeader.length + chunk.length);
                        newChunk.set(protocolResponseHeader);
                        newChunk.set(chunk, protocolResponseHeader.length);
                        webSocket.send(newChunk);
                        protocolResponseHeader = null;
                    } else {
                        webSocket.send(chunk);
                    }
                } else {
                    // If the WebSocket is not open, abort the stream
                    abortController.abort();
                    throw new Error('WebSocket is not open, aborting pipe.');
                }
            },
            close() {
                log(`Remote connection readable is closed.`);
            },
            abort(reason) {
                console.error(`Remote connection readable aborted:`, reason);
            },
        }), { signal });
    } catch (error) {
        if (signal.aborted) {
            log('Pipe aborted intentionally.');
        } else {
            console.error(`RemoteSocketToWS error:`, error.stack || error);
        }
    } finally {
        safeCloseWebSocket(webSocket);
    }
}

/**
 * Creates a ReadableStream from a WebSocket connection.
 * @param {WebSocket} webSocketServer The WebSocket instance.
 * @param {string} earlyDataHeader The early data header from the request.
 * @param {function} log Logging function.
 * @returns {ReadableStream}
 */
function MakeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
    return new ReadableStream({
        start(controller) {
            webSocketServer.addEventListener('message', (event) => {
                controller.enqueue(event.data);
            });
            webSocketServer.addEventListener('close', () => {
                controller.close();
            });
            webSocketServer.addEventListener('error', (err) => {
                log('WebSocket error', err);
                controller.error(err);
            });
            const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
            if (error) {
                controller.error(error);
            } else if (earlyData) {
                controller.enqueue(earlyData);
            }
        },
        cancel(reason) {
            log(`ReadableStream was canceled, reason: ${reason}`);
            safeCloseWebSocket(webSocketServer);
        }
    });
}

/**
 * Fetches data from the Scamalytics API.
 * @param {string} ipToLookup The IP to check.
 * @param {object} scamalyticsConfig The Scamalytics configuration.
 * @returns {Promise<Response>}
 */
async function fetchScamalyticsData(ipToLookup, scamalyticsConfig) {
    const { username, apiKey, baseUrl } = scamalyticsConfig;
    if (!username || !apiKey) {
        console.error("Scamalytics credentials not configured.");
        return new Response("Scamalytics API credentials not configured on server.", { status: 500 });
    }

    const scamalyticsUrl = `${baseUrl}${username}/?key=${apiKey}&ip=${ipToLookup}`;

    try {
        const scamalyticsResponse = await fetch(scamalyticsUrl);
        const responseBody = await scamalyticsResponse.json();
        const headers = new Headers({
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        });
        return new Response(JSON.stringify(responseBody), {
            status: scamalyticsResponse.status,
            headers: headers
        });
    } catch (apiError) {
        console.error("Error fetching from Scamalytics API:", apiError);
        return new Response(JSON.stringify({ error: "Failed to fetch from Scamalytics API", details: apiError.message }), {
            status: 502,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }
}


// isValidUUID, safeCloseWebSocket, stringify, etc.
// They are omitted for brevity in this response but are required for the script to work.

function stringify(arr, offset=0){
  const b2h = i=>(i+0x100).toString(16).slice(1);
  const uuid = [
    b2h(arr[offset]),b2h(arr[offset+1]),b2h(arr[offset+2]),b2h(arr[offset+3]),'-',
    b2h(arr[offset+4]),b2h(arr[offset+5]),'-',
    b2h(arr[offset+6]),b2h(arr[offset+7]),'-',
    b2h(arr[offset+8]),b2h(arr[offset+9]),'-',
    b2h(arr[offset+10]),b2h(arr[offset+11]),b2h(arr[offset+12]),b2h(arr[offset+13]),b2h(arr[offset+14]),b2h(arr[offset+15])
  ].join('');
  return uuid.toLowerCase();
}
function isValidUUID(u){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(u);}
function safeCloseWebSocket(s){try{if(s.readyState===1||s.readyState===2) s.close();}catch{}}
function selectRandomAddress(a){const arr=typeof a==='string'?a.split(',').map(s=>s.trim()):a;return arr[Math.floor(Math.random()*arr.length)];}

function stringify(arr, offset = 0) {
    const uuid = unsafeStringify(arr, offset);
    if (!isValidUUID(uuid)) {
        throw new TypeError("Stringified UUID is invalid");
    }
    return uuid;
}

function base64ToArrayBuffer(base64Str) {
    if (!base64Str) {
        return { earlyData: null, error: null };
    }
    try {
        const binaryStr = atob(base64Str.replace(/-/g, '+').replace(/_/g, '/'));
        const buffer = new ArrayBuffer(binaryStr.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binaryStr.length; i++) {
            view[i] = binaryStr.charCodeAt(i);
        }
        return { earlyData: buffer, error: null };
    } catch (error) {
        return { earlyData: null, error };
    }
}

function findMatchingUserID(pathname, configuredUserIDs) {
    const userIDs = configuredUserIDs.split(',').map(id => id.trim());
    const requestedPath = pathname.substring(1);

    return userIDs.find(id => {
        return requestedPath.startsWith(id) ||
               requestedPath.startsWith(`sub/${id}`) ||
               requestedPath.startsWith(`ipsub/${id}`);
    });
}

async function isCloudflare(domain) {
    try {
        const response = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(domain)}&type=A`, {
            headers: { 'accept': 'application/dns-json' },
        });
        if (!response.ok) return false;
        const data = await response.json();
        // A simple check could be to see if the authoritative name server includes 'cloudflare'.
        // This is not foolproof but works for many cases.
        return data?.Authority?.some(auth => auth.data.includes('cloudflare.com'));
    } catch {
        return false; // If DNS query fails, assume it's not a direct CF domain
    }
}

function socks5AddressParser(address) {
	let [latter, former] = address.split("@").reverse();
	let username, password, hostname, port;
	if (former) {
		const formers = former.split(":");
		if (formers.length !== 2) throw new Error('Invalid SOCKS address format');
		[username, password] = formers;
	}
	const latters = latter.split(":");
	port = Number(latters.pop());
	if (isNaN(port)) throw new Error('Invalid SOCKS address format');
	hostname = latters.join(":");
	if (hostname.includes(":") && !/^\[.*\]$/.test(hostname)) {
		throw new Error('Invalid SOCKS address format for IPv6');
	}
	return { username, password, hostname, port };
}

async function socks5Connect(addressType, addressRemote, portRemote, log, parsedSocks5Addr) {
	const { username, password, hostname, port } = parsedSocks5Addr;
	const socket = connect({ hostname, port });
	const writer = socket.writable.getWriter();
	const reader = socket.readable.getReader();

	await writer.write(new Uint8Array([5, 1, 0])); // Version 5, 1 auth method, No-Auth
	let res = (await reader.read()).value;
	if (res[0] !== 0x05 || res[1] !== 0x00) {
		throw new Error('SOCKS5 greeting failed');
	}

    const encoder = new TextEncoder();
  	let DSTADDR;
	  switch (addressType) {
		case 1: DSTADDR = new Uint8Array([1, ...addressRemote.split('.').map(Number)]); break;
		case 2: DSTADDR = new Uint8Array([3, addressRemote.length, ...encoder.encode(addressRemote)]); break;
		case 3: DSTADDR = new Uint8Array([4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]); break;
		default: throw new Error(`Invalid addressType: ${addressType}`);
	}

	const request = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]);
	await writer.write(request);
	res = (await reader.read()).value;
	if (res[1] !== 0x00) {
		throw new Error(`SOCKS5 connection failed with code: ${res[1]}`);
	}

	writer.releaseLock();
	reader.releaseLock();
	return socket;
}
