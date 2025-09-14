// @ts-nocheck

import { connect } from 'cloudflare:sockets';

// --- Configuration ---
const Config = {
  // User ID. Generate UUID at: https://www.uuidgenerator.net/
  userID: 'd342d11e-d424-4583-b36e-524ab1f0afa4',

  // Format: ['hostname:port', 'ip:port']
  // proxy-IP land: https://github.com/NiREvil/vless/blob/main/sub/ProxyIP.md
  proxyIPs: ['nima.nscl.ir:443'],

  scamalytics: {
    username: 'dianaclk01',
    apiKey: 'c57eb62bbde89f00742cb3f92d7127f96132c9cea460f18c08fd5e62530c5604',
    baseUrl: "https://api11.scamalytics.com/v3/",
  },

  socks5: {
    enabled: false,
    relayMode: false,
    address: '',
  },

  /**
   * Returns the final config object for the current request.
   * @param {object} env - Environment variables from fetch input.
   * @returns {object} Final configuration for request.
   */
  fromEnv(env) {
    const selectedProxyIP = env.PROXYIP || this.proxyIPs[Math.floor(Math.random() * this.proxyIPs.length)];
    const [proxyHost, proxyPort = '443'] = selectedProxyIP.split(':');

    return {
      userID: env.UUID || this.userID,
      proxyIP: proxyHost,
      proxyPort: proxyPort,
      proxyAddress: selectedProxyIP,
      scamalytics: {
        username: env.SCAMALYTICS_USERNAME || this.scamalytics.username,
        apiKey: env.SCAMALYTICS_API_KEY || this.scamalytics.apiKey,
        baseUrl: this.scamalytics.baseUrl,
      },
      socks5: {
        enabled: !!env.SOCKS5,
        relayMode: env.SOCKS5_RELAY === 'true' || this.socks5.relayMode,
        address: env.SOCKS5 || this.socks5.address,
      },
    };
  }
};

const CONSTANTS = {
  VLESS_PROTOCOL: 'vless',
  AT_SYMBOL: '@',
  URL_ED_PARAM: 'ed=2560',
  WS_READY_STATE_OPEN: 1,
  WS_READY_STATE_CLOSING: 2,
};

/**
 * Generates a random path string for WebSocket connection.
 * @param {number} length - Length of path.
 * @returns {string}
 */
function generateRandomPath(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `/${result}?${CONSTANTS.URL_ED_PARAM}`;
}

/**
 * Generates a unique configuration name.
 * @param {string} domain
 * @param {string} protocol
 * @param {number|string} port
 * @param {string|number} [index]
 * @returns {string}
 */
function generateConfigName(domain, protocol, port, index = '') {
  const domainShort = domain.split('.')[0].substring(0, 6);
  const protocolShort = protocol === 'https' ? 'TLS' : 'TCP';
  const suffix = index ? `-${index}` : '';
  return `${domainShort}-${protocolShort}-${port}${suffix}`;
}

/**
 * Creates a VLESS protocol link.
 * @param {object} options
 * @returns {string}
 */
function createVlessLink({ userID, address, port, host, path, security, sni, fp, alpn, name }) {
  const params = new URLSearchParams();
  params.set('type', 'ws');
  params.set('host', host);
  params.set('path', path);

  if (security) params.set('security', security);
  if (sni) params.set('sni', sni);
  if (fp) params.set('fp', fp);
  if (alpn) params.set('alpn', alpn);

  return `vless://${userID}@${address}:${port}?${params.toString()}#${encodeURIComponent(name)}`;
}

// --- Main Router ---
export default {
  /**
   * Main fetch handler for Worker.
   */
  async fetch(request, env, ctx) {
    try {
      const config = Config.fromEnv(env);
      const url = new URL(request.url);
      const userIDs = [config.userID];

      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader && upgradeHeader.toLowerCase() === 'websocket') {
        const requestConfig = {
          userID: config.userID,
          proxyIP: config.proxyIP,
          proxyPort: config.proxyPort,
          socks5Address: config.socks5.address,
          socks5Relay: config.socks5.relayMode,
          enableSocks: config.socks5.enabled,
          parsedSocks5Address: config.socks5.enabled ? socks5AddressParser(config.socks5.address) : {}
        };
        return ProtocolOverWSHandler(request, requestConfig);
      }
      
      const matchingUserID = userIDs.find(id => url.pathname.includes(`/${id}`));
      
      if (url.pathname === "/scamalytics-lookup") {
        return handleScamalyticsLookup(request, config);
      }

      if (!matchingUserID) {
        return new Response('404 — UUID Not Found. Peace & Love', { status: 404 });
      }

      if (url.pathname.startsWith(`/sub/${matchingUserID}`)) {
        return handleSubscription(config.userID, url.hostname);
      }
      if (url.pathname.startsWith(`/ipsub/${matchingUserID}`)) {
        return handleIpSubscription(matchingUserID, url.hostname);
      }
      if (url.pathname.startsWith(`/${matchingUserID}`)) {
        return handleConfigRequestPage(matchingUserID, url.hostname, config.proxyAddress);
      }

      return new Response('Not Found', { status: 404 });

    } catch (err) {
      console.error(err);
      return new Response(err.toString(), { status: 500 });
    }
  },
};

/**
 * Serve the configuration HTML page.
 * @param {string} userID
 * @param {string} hostName
 * @param {string} proxyAddress
 * @returns {Response}
 */
function handleConfigRequestPage(userID, hostName, proxyAddress) {
  const content = generateBeautifulConfigPage(userID, hostName, proxyAddress);
  return new Response(content, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/**
 * Generates domain-based subscription links.
 * @param {string} userID_path - Comma-separated user UUIDs.
 * @param {string} hostname
 * @returns {Response}
 */
function handleSubscription(userID_path, hostname) {
    const mainDomains = [
        hostname, 'creativecommons.org', 'www.speedtest.net', 'sky.rethinkdns.com', 
        'go.inmobi.com', 'zula.ir', 'ip.sb', 'cf.877771.xyz', 'cf.090227.xyz', 
        'cfip.1323123.xyz', 'cfip.xxxxxxxx.tk'
    ];
    
    const httpPorts = [80, 8080, 8880, 2052, 2082, 2086, 2095];
    const httpsPorts = [443, 8443, 2053, 2083, 2087, 2096];
    const userIDs = userID_path.split(',').map(id => id.trim());

    const configs = userIDs.flatMap(userID => {
        const allConfigs = [];
        let configIndex = 1;

        mainDomains.forEach(domain => {
            const httpPort = httpPorts[Math.floor(Math.random() * httpPorts.length)];
            allConfigs.push(createVlessLink({
                userID, 
                address: domain, 
                port: httpPort, 
                host: hostname, 
                path: generateRandomPath(), 
                security: 'none', 
                fp: 'chrome',
                name: generateConfigName(domain, 'http', httpPort, configIndex++)
            }));

            const httpsPort = httpsPorts[Math.floor(Math.random() * httpsPorts.length)];
            allConfigs.push(createVlessLink({
                userID, 
                address: domain, 
                port: httpsPort, 
                host: hostname, 
                path: generateRandomPath(), 
                security: 'tls', 
                sni: hostname, 
                fp: 'firefox',
                name: generateConfigName(domain, 'https', httpsPort, configIndex++)
            }));
        });

        return allConfigs;
    });

    return new Response(btoa(configs.join('\n')), {
        status: 200,
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
}

/**
 * Generates IP-based subscription links using Cloudflare IPs.
 * @param {string} matchingUserID
 * @param {string} hostName
 * @returns {Promise<Response>}
 */
async function handleIpSubscription(matchingUserID, hostName) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/NiREvil/vless/refs/heads/main/Cloudflare-IPs.json');
    if (!response.ok) throw new Error(`Failed to fetch IPs: ${response.status}`);
    
    const data = await response.json();
    const ips = [...(data.ipv4 || []), ...(data.ipv6 || [])].map(item => item.ip);
    if (ips.length === 0) return new Response('No IPs found.', { status: 404 });

    const selectedIps = ips.slice(0, 18);
    const httpsPorts = [443, 8443, 2053, 2083, 2087, 2096];
    const httpPorts = [80, 8080, 8880, 2052, 2082, 2086, 2095];

    const configs = selectedIps.flatMap((ip, index) => {
      const configIndex = index + 1;
      const configs = [];
      
      const httpPort = httpPorts[Math.floor(Math.random() * httpPorts.length)];
      configs.push(createVlessLink({
        userID: matchingUserID,
        address: ip,
        port: httpPort,
        host: hostName,
        path: generateRandomPath(),
        security: 'none',
        fp: 'chrome',
        name: generateConfigName(ip, 'http', httpPort, configIndex)
      }));

      const httpsPort = httpsPorts[Math.floor(Math.random() * httpsPorts.length)];
      configs.push(createVlessLink({
        userID: matchingUserID,
        address: ip,
        port: httpsPort,
        host: hostName,
        path: generateRandomPath(),
        security: 'tls',
        sni: hostName,
        fp: 'firefox',
        name: generateConfigName(ip, 'https', httpsPort, configIndex)
      }));

      return configs;
    });

    return new Response(btoa(configs.join('\n')), {
      status: 200,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
  } catch (error) {
    console.error(`Failed to generate IP subscription: ${error.message}`);
    return new Response(`Failed to generate IP subscription: ${error.message}`, { status: 500 });
  }
}

/**
 * Performs Scamalytics IP lookup using API.
 * @param {Request} request
 * @param {object} config
 * @returns {Promise<Response>}
 */
async function handleScamalyticsLookup(request, config) {
  const url = new URL(request.url);
  const ipToLookup = url.searchParams.get("ip");
  if (!ipToLookup) {
    return new Response(JSON.stringify({ error: "Missing IP parameter" }), { 
      status: 400, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const { username, apiKey, baseUrl } = config.scamalytics;
  if (!username || !apiKey) {
    return new Response(JSON.stringify({ error: "Scamalytics API credentials not configured." }), { 
      status: 500, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  const scamalyticsUrl = `${baseUrl}${username}/?key=${apiKey}&ip=${ipToLookup}`;
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*", 
  });

  try {
    const scamalyticsResponse = await fetch(scamalyticsUrl);
    const responseBody = await scamalyticsResponse.json();
    return new Response(JSON.stringify(responseBody), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.toString() }), { 
      status: 500, 
      headers 
    });
  }
}

/**
 * Generates the configuration HTML page.
 * @param {string} userID
 * @param {string} hostName
 * @param {string} proxyAddress
 * @returns {string} Full HTML string.
 */
function generateBeautifulConfigPage(userID, hostName, proxyAddress) {
  const subUrl = `https://${hostName}/ipsub/${userID}`;
  const subUrlEncoded = encodeURIComponent(subUrl);

  const configs = {
    dream: createVlessLink({
      userID, address: hostName, port: 443, path: '/assets?ed=2560',
      security: 'tls', sni: hostName, host: hostName, fp: 'chrome', alpn: 'http/1.1', name: 'Xray'
    }),
    freedom: createVlessLink({
      userID, address: hostName, port: 443, path: '/assets&ed=2560&eh=Sec-WebSocket-Protocol',
      security: 'tls', sni: hostName, host: hostName, fp: 'safari', alpn: 'h3', name: `${hostName}-Singbox`
    }),
  };

  const clientUrls = {
    clashMeta: `clash://install-config?url=https://revil-sub.pages.dev/sub/clash-meta?url=${subUrlEncoded}&remote_config=&udp=false&ss_uot=false&show_host=false&forced_ws0rtt=true`,
    hiddify: `hiddify://install-config?url=${subUrlEncoded}`,
    v2rayng: `v2rayng://install-config?url=${subUrlEncoded}`,
    exclave: `sn://subscription?url=${subUrlEncoded}`,
  };

  let finalHTML = `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VLESS Proxy Configuration</title>
    <link rel="icon" href="https://raw.githubusercontent.com/NiREvil/zizifn/refs/heads/Dev/assets/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&display=swap" rel="stylesheet">
    <style>${getPageCSS()}</style>
  </head>
  <body data-proxy-ip="${proxyAddress}">
    ${getPageHTML(configs, clientUrls)}
    <script>${getPageScript()}</script>
  </body>
  </html>`;
  
  return finalHTML;
}

// --- Utility & Helper Functions ---

/**
 * Validates UUID format.
 * @param {string} uuid
 * @returns {boolean}
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// --- Core VLESS Protocol Logic ---

/**
 * Handles VLESS protocol over WebSocket.
 * @param {Request} request
 * @param {object} config
 * @returns {Promise<Response>}
 */
async function ProtocolOverWSHandler(request, config) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();
  let address = '';
  let portWithRandomLog = '';
  let udpStreamWriter = null;
  const log = (info, event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
  };
  const earlyDataHeader = request.headers.get('Sec-WebSocket-Protocol') || '';
  const readableWebSocketStream = MakeReadableWebSocketStream(webSocket, earlyDataHeader, log);
  let remoteSocketWapper = { value: null };
  let isDns = false;

  readableWebSocketStream.pipeTo(new WritableStream({
    async write(chunk, controller) {
      if (udpStreamWriter) {
        return udpStreamWriter.write(chunk);
      }
    
      if (remoteSocketWapper.value) {
        const writer = remoteSocketWapper.value.writable.getWriter();
        await writer.write(chunk);
        writer.releaseLock();
        return;
      }
    
      const {
        hasError, message, addressType, portRemote = 443, addressRemote = '',
        rawDataIndex, ProtocolVersion = new Uint8Array([0, 0]), isUDP,
      } = ProcessProtocolHeader(chunk, config.userID);
      
      address = addressRemote;
      portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp' : 'tcp'} `;
      
      if (hasError) {
        throw new Error(message);
      }
    
      const vlessResponseHeader = new Uint8Array([ProtocolVersion[0], 0]);
      const rawClientData = chunk.slice(rawDataIndex);
    
      if (isUDP) {
        if (portRemote === 53) {
          const dnsPipeline = await createDnsPipeline(webSocket, vlessResponseHeader, log);
          udpStreamWriter = dnsPipeline.write;
          udpStreamWriter(rawClientData);
        } else {
          throw new Error('UDP proxy is only enabled for DNS (port 53)');
        }
        return;
      }
      
      HandleTCPOutBound(remoteSocketWapper, addressType, addressRemote, portRemote, rawClientData, webSocket, vlessResponseHeader, log, config);
    },
    close() {
        log(`readableWebSocketStream closed`);
    },
    abort(err) {
        log(`readableWebSocketStream aborted`, err);
    }
  })).catch(err => {
    console.error('Pipeline failed:', err.stack || err);
  });

  return new Response(null, { status: 101, webSocket: client });
}

/**
 * Handles TCP outbound logic for VLESS.
 */
async function HandleTCPOutBound(remoteSocket, addressType, addressRemote, portRemote, rawClientData, webSocket, protocolResponseHeader, log, config) {
  if (!config) {
    config = {
      userID: 'd342d11e-d424-4583-b36e-524ab1f0afa4',
      socks5Address: '',
      socks5Relay: false,
      proxyIP: 'nima.nscl.ir',
      proxyPort: '443',
      enableSocks: false,
      parsedSocks5Address: {}
    };
  }

  async function connectAndWrite(address, port, socks = false) {
    let tcpSocket;
    if (config.socks5Relay) {
      tcpSocket = await socks5Connect(addressType, address, port, log, config.parsedSocks5Address);
    } else {
      tcpSocket = socks ? await socks5Connect(addressType, address, port, log, config.parsedSocks5Address) :
        connect({ hostname: address, port: port });
    }
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }

  async function retry() {
    const tcpSocket = config.enableSocks ?
      await connectAndWrite(addressRemote, portRemote, true) :
      await connectAndWrite(config.proxyIP || addressRemote, config.proxyPort || portRemote, false);
    
    tcpSocket.closed.catch(error => {
      console.log('retry tcpSocket closed error', error);
    }).finally(() => {
      safeCloseWebSocket(webSocket);
    });
    RemoteSocketToWS(tcpSocket, webSocket, protocolResponseHeader, null, log);
  }

  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  RemoteSocketToWS(tcpSocket, webSocket, protocolResponseHeader, retry, log);
}

/**
 * Converts WebSocket messages to a readable stream.
 */
function MakeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  return new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener('message', (event) => controller.enqueue(event.data));
      webSocketServer.addEventListener('close', () => {
        safeCloseWebSocket(webSocketServer);
        controller.close();
      });
      webSocketServer.addEventListener('error', (err) => {
        log('webSocketServer has error');
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
    }
  });
}

/**
 * Parses and validates VLESS protocol header.
 */
function ProcessProtocolHeader(protocolBuffer, userID) {
  if (protocolBuffer.byteLength < 24) return { hasError: true, message: 'invalid data' };
  
  const dataView = new DataView(protocolBuffer);
  const version = dataView.getUint8(0);
  const slicedBufferString = stringify(new Uint8Array(protocolBuffer.slice(1, 17)));
  const uuids = userID.split(',').map(id => id.trim());
  const isValidUser = uuids.some(uuid => slicedBufferString === uuid);
  
  if (!isValidUser) return { hasError: true, message: 'invalid user' };
  
  const optLength = dataView.getUint8(17);
  const command = dataView.getUint8(18 + optLength);
  if (command !== 1 && command !== 2) return { hasError: true, message: `command ${command} is not supported` };
  
  const portIndex = 18 + optLength + 1;
  const portRemote = dataView.getUint16(portIndex);
  const addressType = dataView.getUint8(portIndex + 2);
  let addressValue, addressLength, addressValueIndex;

  switch (addressType) {
    case 1: // IPv4
      addressLength = 4;
      addressValueIndex = portIndex + 3;
      addressValue = new Uint8Array(protocolBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join('.');
      break;
    case 2: // Domain
      addressLength = dataView.getUint8(portIndex + 3);
      addressValueIndex = portIndex + 4;
      addressValue = new TextDecoder().decode(protocolBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 3: // IPv6
      addressLength = 16;
      addressValueIndex = portIndex + 3;
      addressValue = Array.from({ length: 8 }, (_, i) => dataView.getUint16(addressValueIndex + i * 2).toString(16)).join(':');
      break;
    default:
      return { hasError: true, message: `invalid addressType: ${addressType}` };
  }

  if (!addressValue) return { hasError: true, message: `addressValue is empty, addressType is ${addressType}` };
  
  return {
    hasError: false, addressRemote: addressValue, addressType, portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    ProtocolVersion: new Uint8Array([version]),
    isUDP: command === 2
  };
}

/**
 * Pipes remote socket data to WebSocket.
 */
async function RemoteSocketToWS(remoteSocket, webSocket, protocolResponseHeader, retry, log) {
  let hasIncomingData = false;
  try {
    await remoteSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState !== CONSTANTS.WS_READY_STATE_OPEN) throw new Error('WebSocket is not open');
          hasIncomingData = true;
          const dataToSend = protocolResponseHeader ? await new Blob([protocolResponseHeader, chunk]).arrayBuffer() : chunk;
          webSocket.send(dataToSend);
          protocolResponseHeader = null;
        },
        close() { log(`Remote connection readable closed. Had incoming data: ${hasIncomingData}`); },
        abort(reason) { console.error(`Remote connection readable aborted:`, reason); },
      })
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

/**
 * Decodes base64 string to ArrayBuffer.
 */
function base64ToArrayBuffer(base64Str) {
  if (!base64Str) return { earlyData: null, error: null };
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

/**
 * Safely closes a WebSocket connection.
 */
function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === CONSTANTS.WS_READY_STATE_OPEN || socket.readyState === CONSTANTS.WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error('safeCloseWebSocket error:', error);
  }
}

const byteToHex = Array.from({ length: 256 }, (_, i) => (i + 0x100).toString(16).slice(1));
function unsafeStringify(arr, offset = 0) {
  return (
    byteToHex[arr[offset]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' +
    byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' +
    byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' +
    byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' +
    byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]
  ).toLowerCase();
}
function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset);
  if (!isValidUUID(uuid)) throw new TypeError("Stringified UUID is invalid");
  return uuid;
}

/**
 * DNS pipeline for UDP DNS requests, using DNS-over-HTTPS.
 * @param {WebSocket} webSocket
 * @param {Uint8Array} vlessResponseHeader
 * @param {Function} log
 * @returns {Promise<{write: Function}>}
 */
async function createDnsPipeline(webSocket, vlessResponseHeader, log) {
  let isHeaderSent = false;
  const transformStream = new TransformStream({
    transform(chunk, controller) {
      // Parse UDP packets from VLESS framing
      for (let index = 0; index < chunk.byteLength; ) {
        const lengthBuffer = chunk.slice(index, index + 2);
        const udpPacketLength = new DataView(lengthBuffer).getUint16(0);
        const udpData = new Uint8Array(chunk.slice(index + 2, index + 2 + udpPacketLength));
        index = index + 2 + udpPacketLength;
        controller.enqueue(udpData);
      }
    },
  });

  transformStream.readable.pipeTo(
    new WritableStream({
      async write(chunk) {
        try {
          // Send DNS query using DoH
          const resp = await fetch(`https://1.1.1.1/dns-query`, {
            method: "POST",
            headers: { "content-type": "application/dns-message" },
            body: chunk,
          });
          const dnsQueryResult = await resp.arrayBuffer();
          const udpSize = dnsQueryResult.byteLength;
          const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

          if (webSocket.readyState === CONSTANTS.WS_READY_STATE_OPEN) {
            log(`DNS query successful, length: ${udpSize}`);
            if (isHeaderSent) {
              webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
            } else {
              webSocket.send(await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer());
              isHeaderSent = true;
            }
          }
        } catch (error) { 
          log("DNS query error: " + error); 
        }
      },
    })
  ).catch(e => { 
    log("DNS stream error: " + e); 
  });

  const writer = transformStream.writable.getWriter();
  return {
    write: chunk => writer.write(chunk)
  };
}

/**
 * SOCKS5 TCP connection logic.
 */
async function socks5Connect(addressType, addressRemote, portRemote, log, parsedSocks5Addr) {
  const { username, password, hostname, port } = parsedSocks5Addr;
  const socket = connect({ hostname, port });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();

  await writer.write(new Uint8Array([5, 2, 0, 2])); // SOCKS5 greeting
  let res = (await reader.read()).value;
  if (res[0] !== 0x05 || res[1] === 0xff) throw new Error("SOCKS5 server connection failed.");

  if (res[1] === 0x02) { // Auth required
    if (!username || !password) throw new Error("SOCKS5 auth credentials not provided.");
    const authRequest = new Uint8Array([1, username.length, ...encoder.encode(username), password.length, ...encoder.encode(password)]);
    await writer.write(authRequest);
    res = (await reader.read()).value;
    if (res[0] !== 0x01 || res[1] !== 0x00) throw new Error("SOCKS5 authentication failed.");
  }

  let DSTADDR;
  switch (addressType) {
    case 1: DSTADDR = new Uint8Array([1, ...addressRemote.split('.').map(Number)]); break;
    case 2: DSTADDR = new Uint8Array([3, addressRemote.length, ...encoder.encode(addressRemote)]); break;
    case 3: DSTADDR = new Uint8Array([4, ...addressRemote.split(':').flatMap(x => [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2), 16)])]); break;
    default: throw new Error(`Invalid addressType for SOCKS5: ${addressType}`);
  }
  
  const socksRequest = new Uint8Array([5, 1, 0, ...DSTADDR, portRemote >> 8, portRemote & 0xff]);
  await writer.write(socksRequest);
  res = (await reader.read()).value;
  if (res[1] !== 0x00) throw new Error("Failed to open SOCKS5 connection.");

  writer.releaseLock();
  reader.releaseLock();
  return socket;
}

/**
 * Parses SOCKS5 address string.
 * @param {string} address
 * @returns {object}
 */
function socks5AddressParser(address) {
  try {
    const [authPart, hostPart] = address.includes('@') ? address.split('@') : [null, address];
    const [hostname, portStr] = hostPart.split(':');
    const port = parseInt(portStr, 10);
    if (!hostname || isNaN(port)) throw new Error();
    
    let username, password;
    if (authPart) {
      [username, password] = authPart.split(':');
      if (!username) throw new Error();
    }
    return { username, password, hostname, port };
  } catch {
    throw new Error('Invalid SOCKS5 address format. Expected [user:pass@]host:port');
  }
}

/**
 * @returns {string} CSS content of the page.
 */
function getPageCSS() {
  return `
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
        --background-primary: #2a2421; --background-secondary: #35302c; --background-tertiary: #413b35;
        --border-color: #5a4f45; --border-color-hover: #766a5f; --text-primary: #e5dfd6; --text-secondary: #b3a89d;
        --text-accent: #ffffff; --accent-primary: #be9b7b; --accent-secondary: #d4b595; --accent-tertiary: #8d6e5c;
        --accent-primary-darker: #8a6f56; --button-text-primary: #2a2421; --button-text-secondary: var(--text-primary);
        --shadow-color: rgba(0, 0, 0, 0.35); --shadow-color-accent: rgba(190, 155, 123, 0.4);
        --border-radius: 8px; --transition-speed: 0.2s; --transition-speed-fast: 0.1s; --transition-speed-medium: 0.3s; --transition-speed-long: 0.6s;
        --status-success: #70b570; --status-error: #e05d44; --status-warning: #e0bc44; --status-info: #4f90c4;
        --serif: "Aldine 401 BT Web", "Times New Roman", Times, Georgia, ui-serif, serif;
	      --sans-serif: "Styrene B LC", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, "Noto Color Emoji", sans-serif;
	      --mono-serif: "Fira Code", Cantarell, "Courier Prime", monospace;
	    }
      body {
        font-family: var(--sans-serif); font-size: 16px; font-weight: 400; font-style: normal;
        background-color: var(--background-primary); color: var(--text-primary);
        padding: 3rem; line-height: 1.5; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      }
      .container {
        max-width: 768px; margin: 20px auto; padding: 0 12px; border-radius: var(--border-radius);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2), 0 0 25px 8px var(--shadow-color-accent);
        transition: box-shadow var(--transition-speed-medium) ease;
      }
      .container:hover { box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25), 0 0 35px 10px var(--shadow-color-accent); }
      .header { text-align: center; margin-bottom: 40px; padding-top: 30px; }
      .header h1 { font-family: var(--serif); font-weight: 400; font-size: 2rem; color: var(--text-accent); margin-top: 0px; margin-bottom: 2px; }
      .header p { color: var(--text-secondary); font-size: 12px; font-weight: 400; }
      .config-card {
        background: var(--background-secondary); border-radius: var(--border-radius); padding: 20px; margin-bottom: 24px;
        border: 1px solid var(--border-color);
        transition: border-color var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
      }
      .config-card:hover { border-color: var(--border-color-hover); box-shadow: 0 4px 8px var(--shadow-color); }
      .config-title {
        font-family: var(--serif); font-size: 22px; font-weight: 400; color: var(--accent-secondary);
        margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);
        display: flex; align-items: center; justify-content: space-between;
      }
      .config-title .refresh-btn {
        position: relative; overflow: hidden; display: flex; align-items: center; gap: 4px;
        font-family: var(--serif); font-size: 12px; padding: 6px 12px; border-radius: 6px;
        color: var(--accent-secondary); background-color: var(--background-tertiary); border: 1px solid var(--border-color);
        cursor: pointer;
        transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease, color var(--transition-speed) ease, transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
      }
      .config-title .refresh-btn::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transform: translateX(-100%); transition: transform var(--transition-speed-long) ease; z-index: 1;
      }
      .config-title .refresh-btn:hover {
        letter-spacing: 0.5px; font-weight: 600; background-color: #4d453e; color: var(--accent-primary);
        border-color: var(--border-color-hover); transform: translateY(-2px); box-shadow: 0 4px 8px var(--shadow-color);
      }
      .config-title .refresh-btn:hover::before { transform: translateX(100%); }
      .config-title .refresh-btn:active { transform: translateY(0px) scale(0.98); box-shadow: none; }
      .refresh-icon { width: 12px; height: 12px; stroke: currentColor; }
      .config-content {
        position: relative; background: var(--background-tertiary); border-radius: var(--border-radius);
        padding: 16px; margin-bottom: 20px; border: 1px solid var(--border-color);
      }
      .config-content pre {
        overflow-x: auto; font-family: var(--mono-serif); font-size: 12px; color: var(--text-primary);
        margin: 0; white-space: pre-wrap; word-break: break-all;
      }
      .button {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        padding: 8px 16px; border-radius: var(--border-radius); font-size: 13px; font-weight: 500;
        cursor: pointer; border: 1px solid var(--border-color); background-color: var(--background-tertiary);
        color: var(--button-text-secondary);
        transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease, color var(--transition-speed) ease, transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation; text-decoration: none; overflow: hidden; z-index: 1;
      }
      .button:focus-visible { outline: 2px solid var(--accent-primary); outline-offset: 2px; }
      .button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; transition: opacity var(--transition-speed) ease; }
      .copy-buttons {
        position: relative; display: flex; gap: 4px; overflow: hidden; align-self: center;
        font-family: var(--serif); font-size: 12px; padding: 6px 12px; border-radius: 6px;
        color: var(--accent-secondary); border: 1px solid var(--border-color);
        transition: background-color var(--transition-speed) ease, border-color var(--transition-speed) ease, color var(--transition-speed) ease, transform var(--transition-speed) ease, box-shadow var(--transition-speed) ease;
      }
      .copy-buttons::before, .client-btn::before {
        content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transform: translateX(-100%); transition: transform var(--transition-speed-long) ease; z-index: -1;
      }
      .copy-buttons:hover::before, .client-btn:hover::before { transform: translateX(100%); }
      .copy-buttons:hover {
        background-color: #4d453e; letter-spacing: 0.5px; font-weight: 600;
        border-color: var(--border-color-hover); transform: translateY(-2px); box-shadow: 0 4px 8px var(--shadow-color);
      }
      .copy-buttons:active { transform: translateY(0px) scale(0.98); box-shadow: none; }
      .copy-icon { width: 12px; height: 12px; stroke: currentColor; }
      .client-buttons { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-top: 16px; }
      .client-btn {
        width: 100%; background-color: var(--accent-primary); color: var(--background-tertiary);
        border-radius: 6px; border-color: var(--accent-primary-darker); position: relative; overflow: hidden;
        transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
      }
      .client-btn::after {
        content: ''; position: absolute; bottom: -5px; left: 0; width: 100%; height: 5px;
        background: linear-gradient(90deg, var(--accent-tertiary), var(--accent-secondary));
        opacity: 0; transition: all 0.3s ease; z-index: 0;
      }
      .client-btn:hover {
        text-transform: uppercase; letter-spacing: 0.3px; transform: translateY(-3px);
        background-color: var(--accent-secondary); color: var(--button-text-primary);
        box-shadow: 0 5px 15px rgba(190, 155, 123, 0.5); border-color: var(--accent-secondary);
      }
      .client-btn:hover::after { opacity: 1; bottom: 0; }
      .client-btn:active { transform: translateY(0) scale(0.98); box-shadow: 0 2px 3px rgba(0, 0, 0, 0.2); background-color: var(--accent-primary-darker); }
      .client-btn .client-icon { position: relative; z-index: 2; transition: transform 0.3s ease; }
      .client-btn:hover .client-icon { transform: rotate(15deg) scale(1.1); }
      .client-btn .button-text { position: relative; z-index: 2; transition: letter-spacing 0.3s ease; }
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
	      body { padding: 20px; } .container { padding: 0 14px; width: min(100%, 768px); }
	      .ip-info-grid { grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 18px; }
	      .header h1 { font-size: 1.8rem; } .header p { font-size: 0.7rem }
	      .ip-info-section { padding: 14px; gap: 18px; } .ip-info-header h3 { font-size: 16px; }
	      .ip-info-header { gap: 8px; } .ip-info-content { gap: 8px; }
	      .ip-info-item .label { font-size: 11px; } .ip-info-item .value { font-size: 13px; }
	      .config-card { padding: 16px; } .config-title { font-size: 18px; }
	      .config-title .refresh-btn { font-size: 11px; } .config-content pre { font-size: 12px; }
	      .client-buttons { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
	      .button { font-size: 12px; } .copy-buttons { font-size: 11px; }
	    }
	    @media (max-width: 480px) {
	      body { padding: 16px; } .container { padding: 0 12px; width: min(100%, 390px); }
	      .header h1 { font-size: 20px; } .header p { font-size: 8px; }
	      .ip-info-section { padding: 14px; gap: 16px; }
	      .ip-info-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
	      .ip-info-header h3 { font-size: 14px; } .ip-info-header { gap: 6px; }
	      .ip-info-content { gap: 6px; } .ip-info-header svg { width: 18px; height: 18px; }
	      .ip-info-item .label { font-size: 9px; } .ip-info-item .value { font-size: 11px; }
	      .badge { padding: 2px 6px; font-size: 10px; border-radius: 10px; }
	      .config-card { padding: 10px; } .config-title { font-size: 16px; }
	      .config-title .refresh-btn { font-size: 10px; } .config-content { padding: 12px; }
	      .config-content pre { font-size: 10px; }
	      .client-buttons { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
	      .button { padding: 4px 8px; font-size: 11px; } .copy-buttons { font-size: 10px; }
	      .footer { font-size: 10px; }
	    }
      @media (min-width: 1024px) { .container { max-width: 800px; } }
  `;
}

/**
 * @param {object} configs - Object containing configuration links.
 * @param {object} clientUrls - Object containing client URLs.
 * @returns {string} The HTML body content of the page.
 */
function getPageHTML(configs, clientUrls) {
  return `
    <div class="container">
      <div class="header">
        <h1>VLESS Proxy Configuration</h1>
        <p>Copy the configuration or import directly into your client</p>
      </div>

      <div class="config-card">
        <div class="config-title">
          <span>Network Information</span>
          <button id="refresh-ip-info" class="refresh-btn" aria-label="Refresh IP information">
            <svg class="refresh-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
            </svg>
            Refresh
          </button>
        </div>
        <div class="ip-info-grid">
          <div class="ip-info-section">
            <div class="ip-info-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M15.5 2H8.6c-.4 0-.8.2-1.1.5-.3.3-.5.7-.5 1.1v16.8c0 .4.2.8.5 1.1.3.3.7.5 1.1.5h6.9c.4 0 .8-.2 1.1-.5.3-.3.5-.7.5-1.1V3.6c0-.4-.2-.8-.5-1.1-.3-.3-.7-.5-1.1-.5z" />
                <circle cx="12" cy="18" r="1" />
              </svg>
              <h3>Proxy Server</h3>
            </div>
            <div class="ip-info-content">
              <div class="ip-info-item"><span class="label">Proxy Host</span><span class="value" id="proxy-host"><span class="skeleton" style="width: 150px"></span></span></div>
              <div class="ip-info-item"><span class="label">IP Address</span><span class="value" id="proxy-ip"><span class="skeleton" style="width: 120px"></span></span></div>
              <div class="ip-info-item"><span class="label">Location</span><span class="value" id="proxy-location"><span class="skeleton" style="width: 100px"></span></span></div>
              <div class="ip-info-item"><span class="label">ISP Provider</span><span class="value" id="proxy-isp"><span class="skeleton" style="width: 140px"></span></span></div>
            </div>
          </div>
          <div class="ip-info-section">
            <div class="ip-info-header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
              </svg>
              <h3>Your Connection</h3>
            </div>
            <div class="ip-info-content">
              <div class="ip-info-item"><span class="label">Your IP</span><span class="value" id="client-ip"><span class="skeleton" style="width: 110px"></span></span></div>
              <div class="ip-info-item"><span class="label">Location</span><span class="value" id="client-location"><span class="skeleton" style="width: 90px"></span></span></div>
              <div class="ip-info-item"><span class="label">ISP Provider</span><span class="value" id="client-isp"><span class="skeleton" style="width: 130px"></span></span></div>
              <div class="ip-info-item"><span class="label">Risk Score</span><span class="value" id="client-proxy"><span class="skeleton" style="width: 100px"></span></span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="config-card">
        <div class="config-title">
          <span>Xray Core Clients</span>
          <button class="button copy-buttons" onclick="copyToClipboard(this, '${configs.dream}')">
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
        </div>
        <div class="config-content"><pre id="xray-config">${configs.dream}</pre></div>
        <div class="client-buttons">
          <a href="${clientUrls.hiddify}" class="button client-btn">
            <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg></span>
            <span class="button-text">Import to Hiddify</span>
          </a>
          <a href="${clientUrls.v2rayng}" class="button client-btn">
            <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2L4 5v6c0 5.5 3.5 10.7 8 12.3 4.5-1.6 8-6.8 8-12.3V5l-8-3z" /></svg></span>
            <span class="button-text">Import to V2rayNG</span>
          </a>
        </div>
      </div>

      <div class="config-card">
        <div class="config-title">
          <span>Sing-Box Core Clients</span>
          <button class="button copy-buttons" onclick="copyToClipboard(this, '${configs.freedom}')">
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
        </div>
        <div class="config-content"><pre id="singbox-config">${configs.freedom}</pre></div>
        <div class="client-buttons">
          <a href="${clientUrls.clashMeta}" class="button client-btn">
            <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg></span>
            <span class="button-text">Import to Clash Meta</span>
          </a>
          <a href="${clientUrls.exclave}" class="button client-btn">
            <span class="client-icon"><svg viewBox="0 0 24 24"><path d="M20,8h-3V6c0-1.1-0.9-2-2-2H9C7.9,4,7,4.9,7,6v2H4C2.9,8,2,8.9,2,10v9c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-9 C22,8.9,21.1,8,20,8z M9,6h6v2H9V6z M20,19H4v-2h16V19z M20,15H4v-5h3v1c0,0.55,0.45,1,1,1h1.5c0.28,0,0.5-0.22,0.5-0.5v-0.5h4v0.5 c0,0.28,0.22,0.5,0.5,0.5H16c0.55,0,1-0.45,1-1v-1h3V15z" /><circle cx="8.5" cy="13.5" r="1" /><circle cx="15.5" cy="13.5" r="1" /><path d="M12,15.5c-0.55,0-1-0.45-1-1h2C13,15.05,12.55,15.5,12,15.5z" /></svg></span>
            <span class="button-text">Import to Exclavex</span>
          </a>
        </div>
      </div>

      <div class="footer">
        <p>© <span id="current-year">${new Date().getFullYear()}</span> REvil - All Rights Reserved</p>
        <p>Secure. Private. Fast.</p>
      </div>
    </div>
  `;
}


 // --- @returns {string} Client-side JavaScript. ---

function getPageScript() {
  // This function is self-contained and doesn't need template literals from the server.
  // Using a template literal here is just for multi-line string formatting.
  return `
      function copyToClipboard(button, text) {
        const originalHTML = button.innerHTML;
        navigator.clipboard.writeText(text).then(() => {
          button.innerHTML = \`<svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copied!\`;
          button.classList.add("copied");
          button.disabled = true;
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove("copied");
            button.disabled = false;
          }, 1200);
        }).catch(err => {
          console.error("Failed to copy text: ", err);
        });
      }

      async function fetchClientPublicIP() {
        try {
          const response = await fetch('https://api.ipify.org?format=json');
          if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
          return (await response.json()).ip;
        } catch (error) {
          console.error('Error fetching client IP:', error);
          return null;
        }
      }

      async function fetchScamalyticsClientInfo(clientIp) {
        if (!clientIp) return null;
        try {
          const response = await fetch(\`/scamalytics-lookup?ip=\${encodeURIComponent(clientIp)}\`);
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(\`Worker request failed! status: \${response.status}, details: \${errorText}\`);
          }
          const data = await response.json();
          if (data.scamalytics && data.scamalytics.status === 'error') {
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
        if (!data || !data.scamalytics || data.scamalytics.status !== 'ok') {
          showError(prefix, (data && data.scamalytics && data.scamalytics.error) || 'Could not load client data from Scamalytics');
          return;
        }
        const sa = data.scamalytics;
        const dbip = data.external_datasources?.dbip;
        const elements = {
          ip: document.getElementById(\`\${prefix}-ip\`), location: document.getElementById(\`\${prefix}-location\`),
          isp: document.getElementById(\`\${prefix}-isp\`), proxy: document.getElementById(\`\${prefix}-proxy\`)
        };
        if (elements.ip) elements.ip.textContent = sa.ip || "N/A";
        if (elements.location) {
          const city = dbip?.ip_city || '';
          const countryName = dbip?.ip_country_name || '';
          const countryCode = dbip?.ip_country_code ? dbip.ip_country_code.toLowerCase() : '';
          let locationString = 'N/A';
          let flagElementHtml = countryCode ? \`<img src="https://flagcdn.com/w20/\${countryCode}.png" srcset="https://flagcdn.com/w40/\${countryCode}.png 2x" alt="\${dbip.ip_country_code}" class="country-flag"> \` : '';
          let textPart = [city, countryName].filter(Boolean).join(', ');
          if (flagElementHtml || textPart) locationString = \`\${flagElementHtml}\${textPart}\`.trim();
          elements.location.innerHTML = locationString || "N/A";
        }
        if (elements.isp) elements.isp.textContent = sa.scamalytics_isp || dbip?.isp_name || "N/A";
        if (elements.proxy) {
          const score = sa.scamalytics_score;
          const risk = sa.scamalytics_risk;
          let riskText = "Unknown";
          let badgeClass = "badge-neutral";
          if (risk && score !== undefined) {
              riskText = \`\${score} - \${risk.charAt(0).toUpperCase() + risk.slice(1)}\`;
              switch (risk.toLowerCase()) {
                  case "low": badgeClass = "badge-yes"; break;
                  case "medium": badgeClass = "badge-warning"; break;
                  case "high": case "very high": badgeClass = "badge-no"; break;
              }
          }
          elements.proxy.innerHTML = \`<span class="badge \${badgeClass}">\${riskText}</span>\`;
        }
      }

      function updateIpApiIoDisplay(geo, prefix, originalHost) {
        const hostElement = document.getElementById(\`\${prefix}-host\`);
        if (hostElement) hostElement.textContent = originalHost || "N/A";
        const elements = {
          ip: document.getElementById(\`\${prefix}-ip\`), location: document.getElementById(\`\${prefix}-location\`),
          isp: document.getElementById(\`\${prefix}-isp\`)
        };
        if (!geo) {
          Object.values(elements).forEach(el => { if(el) el.innerHTML = "N/A"; });
          return;
        }
        if (elements.ip) elements.ip.textContent = geo.ip || "N/A";
        if (elements.location) {
          const city = geo.city || '';
          const countryName = geo.country_name || '';
          const countryCode = geo.country_code ? geo.country_code.toLowerCase() : '';
          let flagElementHtml = countryCode ? \`<img src="https://flagcdn.com/w20/\${countryCode}.png" srcset="https://flagcdn.com/w40/\${countryCode}.png 2x" alt="\${geo.country_code}" class="country-flag"> \` : '';
          let textPart = [city, countryName].filter(Boolean).join(', ');
          elements.location.innerHTML = (flagElementHtml || textPart) ? \`\${flagElementHtml}\${textPart}\`.trim() : "N/A";
        }
        if (elements.isp) elements.isp.textContent = geo.isp || geo.organisation || geo.as_name || geo.as || 'N/A';
      }

      async function fetchIpApiIoInfo(ip) {
        try {
          const response = await fetch(\`https://ip-api.io/json/\${ip}\`);
          if (!response.ok) throw new Error(\`HTTP error! status: \${response.status}\`);
          return await response.json();
        } catch (error) {
          console.error('IP API Error (ip-api.io):', error);
          return null;
        }
      }

      function showError(prefix, message = "Could not load data", originalHostForProxy = null) {
        const errorMessage = "N/A";
        const elements = (prefix === 'proxy') 
          ? ['host', 'ip', 'location', 'isp']
          : ['ip', 'location', 'isp', 'proxy'];
        
        elements.forEach(key => {
          const el = document.getElementById(\`\${prefix}-\${key}\`);
          if (!el) return;
          if (key === 'host' && prefix === 'proxy') el.textContent = originalHostForProxy || errorMessage;
          else if (key === 'proxy' && prefix === 'client') el.innerHTML = \`<span class="badge badge-neutral">N/A</span>\`;
          else el.innerHTML = errorMessage;
        });
        console.warn(\`\${prefix} data loading failed: \${message}\`);
      }

      async function loadNetworkInfo() {
        try {
          const proxyIpWithPort = document.body.getAttribute('data-proxy-ip') || "N/A";
          const proxyDomainOrIp = proxyIpWithPort.split(':')[0];
          const proxyHostEl = document.getElementById('proxy-host');
          if(proxyHostEl) proxyHostEl.textContent = proxyIpWithPort;

          if (proxyDomainOrIp && proxyDomainOrIp !== "N/A") {
            let resolvedProxyIp = proxyDomainOrIp;
            if (!/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(proxyDomainOrIp)) {
              try {
                const dnsRes = await fetch(\`https://dns.google/resolve?name=\${encodeURIComponent(proxyDomainOrIp)}&type=A\`);
                if (dnsRes.ok) {
                    const dnsData = await dnsRes.json();
                    const ipAnswer = dnsData.Answer?.find(a => a.type === 1);
                    if (ipAnswer) resolvedProxyIp = ipAnswer.data;
                }
              } catch (e) { console.error('DNS resolution for proxy failed:', e); }
            }
            const proxyGeoData = await fetchIpApiIoInfo(resolvedProxyIp);
            updateIpApiIoDisplay(proxyGeoData, 'proxy', proxyIpWithPort);
          } else {
            showError('proxy', 'Proxy Host not available', proxyIpWithPort);
          }

          const clientIp = await fetchClientPublicIP();
          if (clientIp) {
            const clientIpElement = document.getElementById('client-ip');
            if(clientIpElement) clientIpElement.textContent = clientIp;
            const scamalyticsData = await fetchScamalyticsClientInfo(clientIp);
            updateScamalyticsClientDisplay(scamalyticsData);
          } else {
            showError('client', 'Could not determine your IP address.');
          }
        } catch (error) {
          console.error('Overall network info loading failed:', error);
          showError('proxy', \`Error: \${error.message}\`, document.body.getAttribute('data-proxy-ip') || "N/A");
          showError('client', \`Error: \${error.message}\`);
        }
      }

      document.getElementById('refresh-ip-info')?.addEventListener('click', function() {
        const button = this;
        const icon = button.querySelector('.refresh-icon');
        button.disabled = true;
        if (icon) icon.style.animation = 'spin 1s linear infinite';

        const resetToSkeleton = (prefix) => {
          const elementsToReset = ['ip', 'location', 'isp'];
          if (prefix === 'proxy') elementsToReset.push('host');
          if (prefix === 'client') elementsToReset.push('proxy');
          elementsToReset.forEach(key => {
            const element = document.getElementById(\`\${prefix}-\${key}\`);
            if (element) element.innerHTML = \`<span class="skeleton" style="width: 120px;"></span>\`;
          });
        };

        resetToSkeleton('proxy');
        resetToSkeleton('client');
        loadNetworkInfo().finally(() => setTimeout(() => {
          button.disabled = false; if (icon) icon.style.animation = '';
        }, 1000));
      });

      const style = document.createElement('style');
      style.textContent = \`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\`;
      document.head.appendChild(style);

      document.addEventListener('DOMContentLoaded', () => {
        loadNetworkInfo();
      });
  `;
}
