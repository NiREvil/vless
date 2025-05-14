/**
 * Cloudflare Worker for VLESS proxy with WebSocket and configuration UI.
 * @version 0.12.2
 */

// Constants for configuration
const CONSTANTS = {
  DEFAULT_PORT: 443,
  DNS_PORT: 53,
  API_PATHS: {
    SING_BOX: '/api/v2',
    XRAY: '/assets',
  },
  WS_PROTOCOL: 'ws',
  VLESS_PROTOCOL: 'vless',
  NETWORK_TYPE: 'websocket',
  DNS_RESOLVER: '1.1.1.1',
  MAX_RETRIES: 3,
  HTML_URL: '/index.html', // Use local index.html from Pages
};

// Default user UUID and proxy IP
let userCode = '15553e19-982d-4202-bcc2-7a9fd530e9d1';
let proxyIP = 'turk.radicalization.ir';
let dnsResolver = CONSTANTS.DNS_RESOLVER;

/**
 * Validates a UUIDv4 string.
 * @param {string} code - The UUID to validate.
 * @returns {boolean} True if valid, false otherwise.
 */
function isValidUserCode(code) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(code);
}

/**
 * Converts base64 to ArrayBuffer.
 * @param {string} base64Str - Base64 string.
 * @returns {{ earlyData?: ArrayBuffer, error?: Error }} Result or error.
 */
function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    const decode = atob(base64Str);
    const arrayBuffer = Uint8Array.from(decode, c => c.charCodeAt(0));
    return { earlyData: arrayBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Safely closes a WebSocket.
 * @param {WebSocket} socket - The WebSocket to close.
 */
function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error('safeCloseWebSocket error', error);
  }
}

/**
 * Converts bytes to UUID string.
 * @param {Uint8Array} arr - Byte array.
 * @param {number} offset - Starting offset.
 * @returns {string} UUID string.
 */
function stringify(arr, offset = 0) {
  const byteToHex = [];
  for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 256).toString(16).slice(1));
  }
  const uuid = (
    byteToHex[arr[offset + 0]] +
    byteToHex[arr[offset + 1]] +
    byteToHex[arr[offset + 2]] +
    byteToHex[arr[offset + 3]] +
    '-' +
    byteToHex[arr[offset + 4]] +
    byteToHex[arr[offset + 5]] +
    '-' +
    byteToHex[arr[offset + 6]] +
    byteToHex[arr[offset + 7]] +
    '-' +
    byteToHex[arr[offset + 8]] +
    byteToHex[arr[offset + 9]] +
    '-' +
    byteToHex[arr[offset + 10]] +
    byteToHex[arr[offset + 11]] +
    byteToHex[arr[offset + 12]] +
    byteToHex[arr[offset + 13]] +
    byteToHex[arr[offset + 14]] +
    byteToHex[arr[offset + 15]]
  ).toLowerCase();
  if (!isValidUserCode(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }
  return uuid;
}

/**
 * Main Worker fetch handler.
 * @param {Request} request - Incoming request.
 * @param {{UUID?: string, PROXYIP?: string, DNS_RESOLVER?: string}} env - Environment variables.
 * @param {ExecutionContext} ctx - Execution context.
 * @returns {Promise<Response>} Response.
 */
export default {
  async fetch(request, env, ctx) {
    try {
      userCode = env.UUID || userCode;
      proxyIP = env.PROXYIP || proxyIP;
      dnsResolver = env.DNS_RESOLVER || dnsResolver;

      console.log('Environment variables:', { userCode, proxyIP, dnsResolver });

      if (!isValidUserCode(userCode)) {
        throw new Error('Invalid user code');
      }

      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== CONSTANTS.WS_PROTOCOL) {
        const url = new URL(request.url);
        switch (url.pathname) {
          case '/':
          case `/${userCode}`: {
            const streamConfig = await getDianaConfig(userCode, request.headers.get('Host'));
            return new Response(streamConfig, {
              status: 200,
              headers: { 'Content-Type': 'text/html;charset=utf-8' },
            });
          }
          default:
            return new Response('Not found', { status: 404 });
        }
      } else {
        return await streamOverWSHandler(request);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * Handles WebSocket streaming.
 * @param {Request} request - Incoming request.
 * @returns {Promise<Response>} WebSocket response.
 */
async function streamOverWSHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let address = '';
  let portWithRandomLog = '';
  const log = (info, event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
  };
  const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

  let remoteSocketWrapper = { value: null };
  let udpStreamWrite = null;
  let isDns = false;

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDns && udpStreamWrite) {
            return udpStreamWrite(chunk);
          }
          if (remoteSocketWrapper.value) {
            const writer = remoteSocketWrapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const {
            hasError,
            message,
            portRemote = CONSTANTS.DEFAULT_PORT,
            addressRemote = '',
            rawDataIndex,
            streamVersion = new Uint8Array([0, 0]),
            isUDP,
          } = processStreamHeader(chunk, userCode);

          address = addressRemote;
          portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp' : 'tcp'}`;

          if (hasError) {
            throw new Error(message);
          }

          if (isUDP) {
            if (portRemote === CONSTANTS.DNS_PORT) {
              isDns = true;
            } else {
              throw new Error('UDP proxy only enabled for DNS (port 53)');
            }
          }

          const streamResponseHeader = new Uint8Array([streamVersion[0], 0]);
          const rawClientData = chunk.slice(rawDataIndex);

          if (isDns) {
            const { write } = await handleUDPOutBound(webSocket, streamResponseHeader, log);
            udpStreamWrite = write;
            udpStreamWrite(rawClientData);
            return;
          }
          await handleTCPOutBound(
            remoteSocketWrapper,
            addressRemote,
            portRemote,
            rawClientData,
            webSocket,
            streamResponseHeader,
            log,
          );
        },
        close() {
          log('ReadableWebSocketStream closed');
        },
        abort(reason) {
          log('ReadableWebSocketStream aborted', JSON.stringify(reason));
        },
      }),
    )
    .catch(err => {
      log('ReadableWebSocketStream pipeTo error', err);
    });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

/**
 * Creates a readable WebSocket stream with backpressure.
 * @param {WebSocket} webSocketServer - Server WebSocket.
 * @param {string} earlyDataHeader - Early data header.
 * @param {(info: string, event?: string) => void} log - Logging function.
 * @returns {ReadableStream} Readable stream.
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const queue = [];
  const maxQueueSize = 1024 * 1024; // 1MB

  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener('message', event => {
        if (readableStreamCancel) return;
        const message = event.data;
        if (queue.length * message.byteLength < maxQueueSize) {
          queue.push(message);
          if (queue.length === 1) {
            controller.enqueue(message);
          }
        } else {
          log('Backpressure: queue full');
        }
      });

      webSocketServer.addEventListener('close', () => {
        safeCloseWebSocket(webSocketServer);
        if (!readableStreamCancel) controller.close();
      });

      webSocketServer.addEventListener('error', err => {
        log('WebSocketServer error');
        controller.error(err);
      });

      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        queue.push(earlyData);
        controller.enqueue(earlyData);
      }
    },
    async pull(controller) {
      if (queue.length > 1) {
        queue.shift();
        if (queue.length > 0) {
          controller.enqueue(queue[0]);
        }
      }
    },
    cancel(reason) {
      log(`ReadableStream canceled: ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    },
  });

  return stream;
}

/**
 * Processes VLESS header.
 * @param {ArrayBuffer} vlessBuffer - VLESS buffer.
 * @param {string} userID - User UUID.
 * @returns {Object} Processed header data.
 */
function processStreamHeader(chunk, userCode) {
  if (chunk.byteLength < 24) {
    return { hasError: true, message: 'Invalid data' };
  }

  const version = new Uint8Array(chunk.slice(0, 1));
  let isValidUser = false;
  let isUDP = false;

  if (stringify(new Uint8Array(chunk.slice(1, 17))) === userCode) {
    isValidUser = true;
  }

  if (!isValidUser) {
    return { hasError: true, message: 'Invalid user' };
  }

  const optLength = new Uint8Array(chunk.slice(17, 18))[0];
  const command = new Uint8Array(chunk.slice(18 + optLength, 18 + optLength + 1))[0];

  if (command === 1) {
    // TCP
  } else if (command === 2) {
    isUDP = true;
  } else {
    return { hasError: true, message: `Command ${command} not supported` };
  }

  const portIndex = 18 + optLength + 1;
  const portBuffer = chunk.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(chunk.slice(addressIndex, addressIndex + 1));
  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = '';

  switch (addressType) {
    case 1: // IPv4
      addressLength = 4;
      addressValue = new Uint8Array(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      ).join('.');
      break;
    case 2: // Domain
      addressLength = new Uint8Array(chunk.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      );
      break;
    case 3: // IPv6
      addressLength = 16;
      const dataView = new DataView(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      );
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(':');
      break;
    default:
      return { hasError: true, message: `Invalid addressType: ${addressType}` };
  }

  if (!addressValue) {
    return { hasError: true, message: 'Address value is empty' };
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType,
    portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    streamVersion: version,
    isUDP,
  };
}

/**
 * Handles TCP outbound connections.
 * @param {Object} remoteSocket - Remote socket wrapper.
 * @param {string} addressRemote - Remote address.
 * @param {number} portRemote - Remote port.
 * @param {Uint8Array} rawClientData - Client data.
 * @param {WebSocket} webSocket - WebSocket.
 * @param {Uint8Array} vlessResponseHeader - VLESS response header.
 * @param {(info: string, event?: string) => void} log - Logging function.
 */
async function handleTCPOutBound(
  remoteSocket,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  vlessResponseHeader,
  log,
) {
  async function connectAndWrite(address, port, attempt = 1) {
    try {
      const tcpSocket = connect({ hostname: address, port });
      remoteSocket.value = tcpSocket;
      log(`Connected to ${address}:${port}`);
      const writer = tcpSocket.writable.getWriter();
      await writer.write(rawClientData);
      writer.releaseLock();
      return tcpSocket;
    } catch (error) {
      if (attempt < CONSTANTS.MAX_RETRIES) {
        log(`Connection failed, retrying (${attempt + 1}/${CONSTANTS.MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return connectAndWrite(address, port, attempt + 1);
      }
      throw error;
    }
  }

  async function retry() {
    try {
      const tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote);
      tcpSocket.closed
        .catch(error => {
          log('Retry tcpSocket closed error', error);
        })
        .finally(() => {
          safeCloseWebSocket(webSocket);
        });
      remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null, log);
    } catch (error) {
      log('Retry failed', error);
      safeCloseWebSocket(webSocket);
    }
  }

  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry, log);
}

/**
 * Pipes remote socket to WebSocket.
 * @param {Socket} remoteSocket - Remote socket.
 * @param {WebSocket} webSocket - WebSocket.
 * @param {Uint8Array} vlessResponseHeader - VLESS response header.
 * @param {Function | null} retry - Retry function.
 * @param {(info: string, event?: string) => void} log - Logging function.
 */
async function remoteSocketToWS(remoteSocket, webSocket, vlessResponseHeader, retry, log) {
  let remoteChunkCount = 0;
  let vlessHeader = vlessResponseHeader;
  let hasIncomingData = false;

  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          hasIncomingData = true;
          if (webSocket.readyState !== WebSocket.OPEN) {
            controller.error('WebSocket not open');
            return;
          }
          if (vlessHeader) {
            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
            vlessHeader = null;
          } else {
            webSocket.send(chunk);
          }
        },
        close() {
          log('Remote connection closed');
        },
        abort(reason) {
          log('Remote connection aborted', reason);
        },
      }),
    )
    .catch(error => {
      log('remoteSocketToWS error', error);
      safeCloseWebSocket(webSocket);
    });

  if (!hasIncomingData && retry) {
    log('No incoming data, retrying');
    retry();
  }
}

/**
 * Handles UDP outbound (DNS only).
 * @param {WebSocket} webSocket - WebSocket.
 * @param {ArrayBuffer} vlessResponseHeader - VLESS response header.
 * @param {(info: string, event?: string) => void} log - Logging function.
 * @returns {Object} Write function.
 */
async function handleUDPOutBound(webSocket, vlessResponseHeader, log) {
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
            const resp = await fetch(`https://${dnsResolver}/dns-query`, {
              method: 'POST',
              headers: { 'content-type': 'application/dns-message' },
              body: chunk,
            });
            const dnsQueryResult = await resp.arrayBuffer();
            const udpSize = dnsQueryResult.byteLength;
            const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

            if (webSocket.readyState === WebSocket.OPEN) {
              log(`DNS query success, length: ${udpSize}`);
              if (isHeaderSent) {
                webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
              } else {
                webSocket.send(
                  await new Blob([vlessResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer(),
                );
                isHeaderSent = true;
              }
            }
          } catch (error) {
            log('DNS query error', error);
          }
        },
      }),
    )
    .catch(error => {
      log('DNS stream error', error);
    });

  const writer = transformStream.writable.getWriter();
  return { write: chunk => writer.write(chunk) };
}

/**
 * Fetches and processes VLESS configuration HTML from external source.
 * @param {string} userCode - User UUID.
 * @param {string} hostName - Hostname.
 * @returns {Promise<string>} Processed HTML content.
 */
async function getDianaConfig(userCode, hostName) {
  try {
    console.log(`Fetching HTML from: ${CONSTANTS.HTML_URL}`);
    const protocol = CONSTANTS.VLESS_PROTOCOL;
    const networkType = CONSTANTS.WS_PROTOCOL;

    const baseUrl = `${protocol}://${userCode}@${hostName}:${CONSTANTS.DEFAULT_PORT}`;
    const commonParams = `encryption=none&host=${hostName}&type=${networkType}&security=tls&sni=${hostName}`;

    const freedomConfig =
      `${baseUrl}?path=${CONSTANTS.API_PATHS.SING_BOX}&eh=Sec-WebSocket-Protocol` +
      `&ed=2560&${commonParams}&fp=chrome&alpn=h3#${hostName}`;

    const dreamConfig =
      `${baseUrl}?path=${CONSTANTS.API_PATHS.XRAY}?ed=2048&${commonParams}` +
      `&fp=randomized&alpn=h2,http/1.1#${hostName}`;

    const clashMetaFullUrl = `clash://install-config?url=${encodeURIComponent(
      `https://sub.victoriacross.ir/sub/clash-meta?url=${encodeURIComponent(freedomConfig)}&remote_config=&udp=true&ss_uot=false&show_host=false&forced_ws0rtt=false`,
    )}`;

    const nekoBoxImportUrl = `https://sahar-km.github.io/arcane/${btoa(freedomConfig)}`;

    // Fetch HTML template from Pages
    const response = await fetch(CONSTANTS.HTML_URL, { cache: 'default' });
    if (!response.ok) {
      throw new Error(`Failed to fetch HTML: ${response.statusText}`);
    }
    let html = await response.text();

    // Replace placeholders with dynamic values
    html = html
      .replace(/{{PROXY_IP}}/g, proxyIP)
      .replace(/{{LAST_UPDATED}}/g, new Date().toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }))
      .replace(/{{FREEDOM_CONFIG}}/g, freedomConfig)
      .replace(/{{DREAM_CONFIG}}/g, dreamConfig)
      .replace(/{{FREEDOM_CONFIG_ENCODED}}/g, encodeURIComponent(freedomConfig))
      .replace(/{{DREAM_CONFIG_ENCODED}}/g, encodeURIComponent(dreamConfig))
      .replace(/{{CLASH_META_URL}}/g, clashMetaFullUrl)
      .replace(/{{NEKOBOX_URL}}/g, nekoBoxImportUrl)
      .replace(/<span>-</span>/g, `<span id="current-year">${new Date().getFullYear()}</span>`);

    return html;
  } catch (error) {
    console.error('Error fetching HTML template:', error);
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Error</title>
    </head>
    <body>
      <h1>Error</h1>
      <p>Failed to load configuration page. Please try again later.</p>
    </body>
    </html>
      `;
  }
}
