// @ts-nocheck
import { connect } from 'cloudflare:sockets';

// basic encoding/decoding utilities
function encodeSecure(str) {
  return btoa(str.split('').reverse().join(''));
}

function decodeSecure(encoded) {
  return atob(encoded).split('').reverse().join('');
}

// encoded constants
const ENCODED = {
  NETWORK: 'c3c=', // ws reversed + base64
  TYPE: 'YW5haWQ=', // diana reversed + base64
  STREAM: 'bWFlcnRz', // stream reversed + base64
  PROTOCOL: 'c3NlbHY=', // vless reversed + base64
};

//to generate your own UUID: https://www.uuidgenerator.net/
let userCode = '15553e19-982d-4202-bcc2-7a9fd530e9d1';

// to find proxyIP: https://github.com/NiREvil/vless/blob/main/sub/ProxyIP.md
let proxyIP = 'turk.radicalization.ir'; // Or use 'nima.nscl.ir

if (!isValidUserCode(userCode)) {
  throw new Error('user code is not valid');
}

export default {
  /**
   * @param {import("@cloudflare/workers-types").Request} request
   * @param {{UUID: string, PROXYIP: string}} env
   * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    try {
      userCode = env.UUID || userCode;
      proxyIP = env.PROXYIP || proxyIP;
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        const url = new URL(request.url);
        switch (url.pathname) {
          case '/':
            return new Response(JSON.stringify(request.cf, null, 4), {
              status: 200,
              headers: { 'Content-Type': 'application/json;charset=utf-8' },
            });
          case `/${userCode}`: {
            const streamConfig = getDianaConfig(userCode, request.headers.get('Host'));
            return new Response(`${streamConfig}`, {
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
      let e = err;
      return new Response(e.toString());
    }
  },
};

/**
 *
 * @param {import("@cloudflare/workers-types").Request} request
 */
async function streamOverWSHandler(request) {
  /** @type {import("@cloudflare/workers-types").WebSocket[]} */
  // @ts-ignore
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let address = '';
  let portWithRandomLog = '';
  const log = (/** @type {string} */ info, /** @type {string | undefined} */ event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || '');
  };
  const earlyDataHeader = request.headers.get('sec-websocket-protocol') || '';

  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

  /** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
  let remoteSocketWapper = {
    value: null,
  };
  let udpStreamWrite = null;
  let isDns = false;
  // ws --> remote
  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDns && udpStreamWrite) {
            return udpStreamWrite(chunk);
          }
          if (remoteSocketWapper.value) {
            const writer = remoteSocketWapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const {
            hasError,
            message,
            portRemote = 443,
            addressRemote = '',
            rawDataIndex,
            streamVersion = new Uint8Array([0, 0]),
            isUDP,
          } = processStreamHeader(chunk, userCode);

          address = addressRemote;
          portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? 'udp ' : 'tcp '}`;

          if (hasError) {
            // controller.error(message);
            throw new Error(message); // cf seems has bug, controller.error will not end stream
            // webSocket.close(1000, message);
            return;
          }
          // if UDP but port not DNS port, close it
          if (isUDP) {
            if (portRemote === 53) {
              isDns = true;
            } else {
              // controller.error('UDP proxy only enable for DNS which is port 53');
              throw new Error('UDP proxy only enable for DNS which is port 53'); // cf seems has bug, controller.error will not end stream
              return;
            }
          }

          const streamResponseHeader = new Uint8Array([streamVersion[0], 0]);
          const rawClientData = chunk.slice(rawDataIndex);

          // TODO: support udp here when cf runtime has udp support
          if (isDns) {
            const { write } = await handleUDPOutBound(webSocket, streamResponseHeader, log);
            udpStreamWrite = write;
            udpStreamWrite(rawClientData);
            return;
          }
          handleTCPOutBound(
            remoteSocketWapper,
            addressRemote,
            portRemote,
            rawClientData,
            webSocket,
            streamResponseHeader,
            log,
          );
        },
        close() {
          log('readableWebSocketStream is close');
        },
        abort(reason) {
          log('readableWebSocketStream is abort', JSON.stringify(reason));
        },
      }),
    )
    .catch(err => {
      log('readableWebSocketStream pipeTo error', err);
    });

  return new Response(null, {
    status: 101,
    // @ts-ignore
    webSocket: client,
  });
}

/**
 *
 * @param {import("@cloudflare/workers-types").WebSocket} webSocketServer
 * @param {string} earlyDataHeader for ws 0rtt
 * @param {(info: string)=> void} log for ws 0rtt
 */
function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener('message', event => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });

      // The event means that the client closed the client -> server stream.
      // However, the server -> client stream is still open until you call close() on the server side.
      // The WebSocket protocol says that a separate close message must be sent in each direction to fully close the socket.
      webSocketServer.addEventListener('close', () => {
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) {
          return;
        }
        controller.close();
      });
      // client send close, need close server
      // if stream is cancel, skip controller.close
      webSocketServer.addEventListener('error', err => {
        log('webSocketServer has error');
        controller.error(err);
      });

      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        controller.enqueue(earlyData);
      }
    },

    pull(controller) {
      // if ws can stop read if stream is full, we can implement backpressure
      // https://streams.spec.whatwg.org/#example-rs-push-backpressure
    },

    cancel(reason) {
      // 1. pipe WritableStream has error, this cancel will called, so ws handle server close into here
      // 2. if readableStream is cancel, all controller.close/enqueue need skip,
      // 3. but from testing controller.error still work even if readableStream is cancel
      if (readableStreamCancel) {
        return;
      }
      log(`ReadableStream was canceled, due to ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    },
  });

  return stream;
}

// https://xtls.github.io/development/protocols/vless.html
// https://github.com/zizifn/excalidraw-backup/blob/main/v2ray-protocol.excalidraw

/**
 *
 * @param { ArrayBuffer} vlessBuffer
 * @param {string} userID
 * @returns
 */
function processStreamHeader(chunk, userCode) {
  if (chunk.byteLength < 24) {
    return {
      hasError: true,
      message: 'invalid data',
    };
  }

  const version = new Uint8Array(chunk.slice(0, 1));
  let isValidUser = false;
  let isUDP = false;

  if (stringify(new Uint8Array(chunk.slice(1, 17))) === userCode) {
    isValidUser = true;
  }

  if (!isValidUser) {
    return {
      hasError: true,
      message: 'invalid user',
    };
  }

  const optLength = new Uint8Array(chunk.slice(17, 18))[0]; //skip opt for now
  const command = new Uint8Array(chunk.slice(18 + optLength, 18 + optLength + 1))[0];

  // 0x01 TCP
  // 0x02 UDP
  // 0x03 MUX
  if (command === 1) {
  } else if (command === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${command} is not supported`,
    };
  }

  const portIndex = 18 + optLength + 1;
  const portBuffer = chunk.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0); // port is big-Endian in raw data etc 80 == 0x005d

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(chunk.slice(addressIndex, addressIndex + 1));
  // 1--> ipv4  addressLength =4
  // 2--> domain name addressLength=addressBuffer[1]
  // 3--> ipv6  addressLength =16
  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = '';

  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = new Uint8Array(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      ).join('.');
      break;
    case 2:
      addressLength = new Uint8Array(chunk.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      );
      break;
    case 3:
      addressLength = 16;
      const dataView = new DataView(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      );
      const ipv6 = []; // 2001:0db8:85a3:0000:0000:8a2e:0370:7334
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(':');
      // seems no need add [] for ipv6
      break;
    default:
      return {
        hasError: true,
        message: `invalid addressType: ${addressType}`,
      };
  }

  if (!addressValue) {
    return {
      hasError: true,
      message: 'addressValue is empty',
    };
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
 * Handles outbound TCP connections.
 *
 * @param {any} remoteSocket
 * @param {string} addressRemote The remote address to connect to.
 * @param {number} portRemote The remote port to connect to.
 * @param {Uint8Array} rawClientData The raw client data to write.
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket The WebSocket to pass the remote socket to.
 * @param {Uint8Array} vlessResponseHeader The VLESS response header.
 * @param {function} log The logging function.
 * @returns {Promise<void>} The remote socket.
 */
async function handleTCPOutBound(
  remoteSocket,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  streamResponseHeader,
  log,
) {
  async function connectAndWrite(address, port) {
    /** @type {import("@cloudflare/workers-types").Socket} */
    const tcpSocket = connect({
      hostname: address,
      port: port,
    });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData); // first write, nomal is tls client hello
    writer.releaseLock();
    return tcpSocket;
  }
  // if the cf connect tcp socket have no incoming data, we retry to redirect ip
  async function retry() {
    const tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote);
    // no matter retry success or not, close websocket
    tcpSocket.closed
      .catch(error => {
        console.log('retry tcpSocket closed error', error);
      })
      .finally(() => {
        safeCloseWebSocket(webSocket);
      });
    remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, null, log);
  }
  // when remoteSocket is ready, pass to websocket
  // remote--> ws
  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, retry, log);
}

async function remoteSocketToWS(remoteSocket, webSocket, streamResponseHeader, retry, log) {
  let remoteChunkCount = 0;
  let chunks = [];
  let vlessHeader = streamResponseHeader;
  let hasIncomingData = false;

  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        start() {},
        async write(chunk, controller) {
          hasIncomingData = true;
          if (webSocket.readyState !== WS_READY_STATE_OPEN) {
            controller.error('webSocket is not open');
          }
          if (vlessHeader) {
            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
            vlessHeader = null;
          } else {
            webSocket.send(chunk);
          }
        },
        close() {
          log('remoteConnection readable close');
        },
        abort(reason) {
          console.error('remoteConnection readable abort', reason);
        },
      }),
    )
    .catch(error => {
      console.error('remoteSocketToWS has error', error.stack || error);
      safeCloseWebSocket(webSocket);
    });

  if (hasIncomingData === false && retry) {
    log('retry connection');
    retry();
  }
}

/**
 *
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket
 * @param {ArrayBuffer} vlessResponseHeader
 * @param {(string)=> void} log
 */
async function handleUDPOutBound(webSocket, streamResponseHeader, log) {
  let isHeaderSent = false;

  const transformStream = new TransformStream({
    start(controller) {},
    transform(chunk, controller) {
      // udp message 2 byte is the the length of udp data
      // TODO: this should have bug, beacsue maybe udp chunk can be in two websocket message
      for (let index = 0; index < chunk.byteLength; ) {
        const lengthBuffer = chunk.slice(index, index + 2);
        const udpPakcetLength = new DataView(lengthBuffer).getUint16(0);
        const udpData = new Uint8Array(chunk.slice(index + 2, index + 2 + udpPakcetLength));
        index = index + 2 + udpPakcetLength;
        controller.enqueue(udpData);
      }
    },
    flush(controller) {},
  });

  // only handle dns udp for now
  transformStream.readable
    .pipeTo(
      new WritableStream({
        async write(chunk) {
          const resp = await fetch('https://1.1.1.1/dns-query', {
            method: 'POST',
            headers: {
              'content-type': 'application/dns-message',
            },
            body: chunk,
          });
          const dnsQueryResult = await resp.arrayBuffer();
          const udpSize = dnsQueryResult.byteLength;
          // console.log([...new Uint8Array(dnsQueryResult)].map((x) => x.toString(16)));
          const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);

          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            log(`dns query success, length: ${udpSize}`);
            if (isHeaderSent) {
              webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
            } else {
              webSocket.send(
                await new Blob([streamResponseHeader, udpSizeBuffer, dnsQueryResult]).arrayBuffer(),
              );
              isHeaderSent = true;
            }
          }
        },
      }),
    )
    .catch(error => {
      log('dns query error: ' + error);
    });

  const writer = transformStream.writable.getWriter();

  return {
    /**
     *
     * @param {Uint8Array} chunk
     */
    write(chunk) {
      writer.write(chunk);
    },
  };
}

/**
 *
 * we are all REvil
 * @version 0.11.0 ()
 * @description This code is based on the js-sha256 project, with the addition of the SHA-224 hash algorithm implementation.
 * @author Chen, Yi-Cyuan [emn178@gmail.com][js-sha256]{@link https://github.com/emn178/js-sha256}
 */

function getDianaConfig(userCode, hostName) {
  const protocol = decodeSecure(ENCODED.PROTOCOL);
  const networkType = decodeSecure(ENCODED.NETWORK);

  const baseUrl = `${protocol}://${userCode}@${hostName}:443`;
  const commonParams =
    `encryption=none&host=${hostName}&type=${networkType}` + `&security=tls&sni=${hostName}`;

  // Configuration for Sing-Box core clients
  const freedomConfig =
    `${baseUrl}?path=/api/v4&eh=Sec-WebSocket-Protocol` +
    `&ed=2560&${commonParams}&fp=chrome&alpn=h3#${hostName}`;

  // Configuration for Xray core clients
  const dreamConfig =
    `${baseUrl}?path=/api/v2?ed=2048&${commonParams}` +
    `&fp=randomized&alpn=h2,http/1.1#${hostName}`;

  // URL for Clash Meta subscription import
  const clashMetaFullUrl = `clash://install-config?url=${encodeURIComponent(
    `https://sub.victoriacross.ir/sub/clash-meta?url=${encodeURIComponent(freedomConfig)}&remote_config=&udp=true&ss_uot=false&show_host=false&forced_ws0rtt=false`,
  )}`; // for using v2ray to clash-meta converter visit here: https://sub.victoriacross.ir/

  // create a URL for NekoBox
  const nekoBoxImportUrl = `https://sahar-km.github.io/arcane/${btoa(freedomConfig)}`;

  // HTML content
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link
        href="https://fonts.googleapis.com/css2?family=Cantarell&family=Courier+Prime&family=Fira+Code&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Roboto+Mono:wght@100..700&display=swap"
        rel="stylesheet"
      />
      <title>VLESS Proxy Configuration</title>
      <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
  
              @font-face {
                  font-family: 'Aldine401 Mersedeh';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/Aldine401_Mersedeh.woff2') format('woff2'),
                    url('https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/Aldine401_Mersedeh.ttf') format('truetype');
                  font-weight: normal; font-style: normal; font-display: swap;
              }
            
               @font-face {
                  font-family: 'Aldine 401';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/Aldine401BT-RomanA.woff2') format('woff2');
                  font-weight: 500; font-style: normal; font-display: swap;
              }
             
              @font-face {
                  font-family: 'Aldine721 BdCn BT';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/Aldine721BT-BoldCondensed.woff2') format('woff2');
                  font-weight: bold; font-style: normal; font-display: swap;
              }
             
              @font-face {
                  font-family: 'Anthropic Sans 20250417e Text400';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/AnthropicSans20250417e-Text400.woff2') format('woff2');
                  font-weight: 100 900; font-style: normal; font-display: swap;
              }
             
              @font-face {
                  font-family: 'Anthropic Serif 20250417e Text400';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/AnthropicSerif20250417e-Text400.woff2') format('woff2');
                  font-weight: 100 900; font-style: normal; font-display: swap;
              }
             
              @font-face {
                  font-family: 'Styrene B LC;
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Medium.woff2') format('woff2');
                  font-weight: 500; font-style: normal; font-display: swap;
              }
             
              @font-face {
                  font-family: 'Styrene B LC';
                  src:
                    url('https://pub-7a3b428c76aa411181a0f4dd7fa9064b.r2.dev/StyreneBLC-Regular.woff2') format('woff2'),
                    url('https://pub-b3ab4c8172fb44e29854df3435aa223d.r2.dev/StyreneBLC-Regular.ttf') format('truetype');
                  font-weight: normal; font-style: normal; font-display: swap;
              }
  
              @font-face {
                font-family: 'MONO';
                src:
                  url('https://pub-e9cd5dd357214439993a02fd0684592e.r2.dev/1047a18a743f1fb96de17bffe2242740.woff2') format('woff2');
                font-display: swap; font-weight: 400; font-style: normal;
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
  
                --aldine-roman: 'Aldine401 Mersedeh';
                --aldine-bold: 'Aldine721 BdCn BT';
                --aldine: 'Aldine401';
                --font-mono: 'MONO';
                --font-styrb: 'Styrene B LC';
                --font-a-Sans: 'Anthropic Sans 20250417e Text400';
                --font-a-Serif: 'Anthropic Serif 20250417e Text400';
  
                --serif: var(--aldine-roman), ui-serif, Georgia, 'Times New Roman', Times, serif;
                --sans-serif: var(--font-styrb), 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Roboto, Arial, 'Segoe UI Symbol', 'Noto Color Emoji', sans-serif;
                --mono-serif: 'MONO', 'Roboto Mono', 'Cantarell', 'Courier Prime', SFMono-Regular, 'Fira Code', monospace;
              }
  
              body {
                font-family: var(--sans-serif);
                font-size: 16px;
                font-weight: 400;
                font-style: normal;
                background-color: var(--background-primary);
                color: var(--text-primary);
                padding: 24px;
                line-height: 1.6;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
  
              .container {
                max-width: 800px;
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
                font-size: 32px;
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
                font-size: 0.9em;
                font-style: normal;
                line-height: 1.5;
                color: var(--text-primary);
                margin: 0;
                white-space: pre-wrap;
                word-break: break-all;
                padding-right: 70px;
              }
  
              .attributes {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 10px;
              }
  
              .attribute {
                display: flex;
                flex-direction: column;
                gap: 4px;
              }
  
              .attribute span {
                font-size: 13px;
                font-weight: 400;
                color: var(--text-secondary);
              }
  
              .attribute strong {
                font-family: 'Aldine 401';
                font-size: 16px;
                font-weight: 400;
                color: var(--accent-secondary);
                word-break: break-all;
              }
  
              .button {
                display: inline-flex;
                position: relative;
                overflow: hidden;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 10px 16px;
                border-radius: var(--border-radius);
                font-style: normal;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
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
                user-select: none;
                text-decoration: none;
                -webkit-user-select: none;
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
                position: absolute;
                top: 12px;
                right: 12px;
                padding: 6px 12px;
                font-size: 13px;
                font-weight: 600;
                background-color: var(--background-tertiary);
                color: var(--accent-secondary);
                border-color: var(--border-color);
                transition:
                  background-color var(--transition-speed) ease,
                  border-color var(--transition-speed) ease,
                  color var(--transition-speed) ease,
                  transform var(--transition-speed) ease,
                  box-shadow var(--transition-speed) ease;
              }
  
              .copy-buttons::before,
              .client-btn::before {
                content: '';
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
                color: var(--accent-primary);
                border-color: var(--border-color-hover);
                transform: translateY(-2px);
                box-shadow: 0 4px 8px var(--shadow-color);
              }
  
              .copy-buttons:active {
                transform-origin: center;
                transform: translateY(0px) scale(0.98);
                transition: transform var(--transition-speed-fast) ease-in-out;
                box-shadow: none;
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
                color: var(--button-text-primary);
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
                content: '';
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
                transition: letter-spacing 0.3s ease;
              }
  
              .client-btn:hover .button-text {
                letter-spacing: 0.5px;
              }
  
              .client-icon {
                display: flex;
                width: 18px;
                height: 18px;
                border-radius: 6px;
                background-color: var(--background-secondary);
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
              }
  
              .client-icon svg {
                width: 14px;
                height: 14px;
                fill: currentColor;
                fill: var(--accent-secondary);
              }
  
              .button.copied {
                background-color: var(--accent-secondary) !important;
                border-color: var(--border-color) !important;
                color: var(--background-tertiary) !important;
              }
  
              .button.error {
                background-color: #c74a3b !important;
                border-color: #a13b2f !important;
                color: var(--text-accent) !important;
              }
  
              .footer {
                text-align: center;
                margin-top: 30px;
                padding-bottom: 40px;
                color: var(--text-secondary);
                font-size: 12px;
              }
  
              .footer p {
                margin-bottom: 0px;
              }
  
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: var(--background-primary);
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb {
                background: var(--border-color);
                border-radius: 4px;
                border: 2px solid var(--background-primary);
              }
              ::-webkit-scrollbar-thumb:hover {
                background: var(--border-color-hover);
              }
  
              * {
                scrollbar-width: thin;
                scrollbar-color: var(--border-color) var(--background-primary);
              }
  
              @media (max-width: 768px) {
                body { padding: 20px; }
                .container { padding: 0 14px; width: min(100%, 768px); }
                .header h1 { font-size: 28px; }
                .header p { font-size: 12px; }
                .config-card { padding: 16px; }
                .config-title { font-size: 18px; }
                .config-content pre { font-size: 12px; padding-right: 65px; }
                .attributes { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; }
                .client-buttons { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
                .button { padding: 8px 12px; font-size: 12px; }
                .copy-buttons { top: 10px; right: 10px; }
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-thumb { border-width: 1px; }
              }
  
              @media (max-width: 480px) {
                body { padding: 16px; }
                .container { padding: 0 12px; width: min(100%, 480px); }
                .header h1 { font-size: 22px; }
                .header p { font-size: 9px; }
                .config-card { padding: 10px; }
                .config-title { font-size: 18px; }
                .config-content { padding: 12px; }
                .config-content pre { font-size: 11px; padding-right: 60px; }
                .attributes { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 15px; }
                .attribute strong { font-size: 13px; }
                .attribute span { font-size: 11px; }
                .client-buttons { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
                .button { padding: 10px 14px; font-size: 12px; }
                .copy-buttons { top: 8px; right: 8px; padding: 5px 10px; }
              }
  
              @media (max-width: 359px) {
                body { padding: 12px; font-size: 14px; }
                .container { max-width: 100%; padding: 8px; }
                .header h1 { font-size: 20px; }
                .header p { font-size: 8px; }
                .config-card { padding: 8px; }
                .config-title { font-size: 14px; }
                .config-content { padding: 8px; }
                .config-content pre { font-size: 10px; padding-right: 50px; }
                .attributes { gap: 8px; }
                .attribute strong { font-size: 13px; }
                .client-buttons { grid-template-columns: 1fr; }
                .button { padding: 6px 10px; font-size: 11px; }
                .copy-buttons { top: 6px; right: 6px; padding: 4px 8px; font-size: 10px; }
                ::-webkit-scrollbar { width: 4px; height: 4px; }
              }
  
              @media (min-width: 360px) { .container { max-width: 95%; } }
              @media (min-width: 480px) { .container { max-width: 90%; } }
              @media (min-width: 640px) { .container { max-width: 600px; } }
              @media (min-width: 768px) { .container { max-width: 720px; } }
              @media (min-width: 1024px) { .container { max-width: 800px; } }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>VLESS Proxy Configuration</h1>
          <p>Copy the configuration or import directly into your client</p>
        </div>
  
        <!-- Proxy Info Card -->
        <div class="config-card">
          <div class="config-title">Proxy Information</div>
          <div class="attributes">
            <div class="attribute">
              <span>Proxy IP / Host:</span>
              <strong id="proxy-ip-display">${proxyIP}</strong>
            </div>
            <div class="attribute">
              <span>Status:</span>
              <strong>Active</strong>
            </div>
          </div>
        </div>
  
        <!-- Xray Core Clients -->
        <div class="config-card">
          <div class="config-title">Xray Core Clients</div>
          <div class="config-content">
            <button
              class="button copy-buttons"
              onclick="copyToClipboard(this, '${dreamConfig}')"
              aria-label="Copy Xray Core configuration"
            >
              Copy
            </button>
            <pre>${dreamConfig}</pre>
          </div>
          <div class="client-buttons">
            <!-- Hiddify -->
            <a
              href="hiddify://install-config?url=${encodeURIComponent(freedomConfig)}"
              class="button client-btn"
            >
              <span class="client-icon">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <!-- Hiddify Logo - Stylized H with Shield -->
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              <span class="button-text">Import to Hiddify</span>
            </a>
  
            <!-- V2rayNG -->
            <a
              href="v2rayng://install-config?url=${encodeURIComponent(dreamConfig)}"
              class="button client-btn"
            >
              <span class="client-icon">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <!-- V2rayNG Logo - V2 with Network -->
                  <path d="M12 2L4 5v6c0 5.5 3.5 10.7 8 12.3 4.5-1.6 8-6.8 8-12.3V5l-8-3z" />
                </svg>
              </span>
              <span class="button-text">Import to V2rayNG</span>
            </a>
          </div>
        </div>
  
        <!-- Sing-Box Core Clients -->
        <div class="config-card">
          <div class="config-title">Sing-Box Core Clients</div>
          <div class="config-content">
            <button
              class="button copy-buttons"
              onclick="copyToClipboard(this, '${freedomConfig}')"
              aria-label="Copy Xray Core configuration"
            >
              Copy
            </button>
            <pre>${freedomConfig}</pre>
          </div>
          <div class="client-buttons">
            <!-- Clash Meta -->
            <a href="${clashMetaFullUrl}" class="button client-btn">
              <span class="client-icon">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <!-- Clash Meta Logo - Stylized C with network nodes -->
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                  />
                </svg>
              </span>
              <span class="button-text">Import to Clash Meta</span>
            </a>
  
            <!-- NekoBox -->
            <a href="${nekoBoxImportUrl}" class="button client-btn">
              <span class="client-icon">
                <svg
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <!-- NekoBox Logo - Cat/Box stylized -->
                  <path
                    d="M20,8h-3V6c0-1.1-0.9-2-2-2H9C7.9,4,7,4.9,7,6v2H4C2.9,8,2,8.9,2,10v9c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2v-9 C22,8.9,21.1,8,20,8z M9,6h6v2H9V6z M20,19H4v-2h16V19z M20,15H4v-5h3v1c0,0.55,0.45,1,1,1h1.5c0.28,0,0.5-0.22,0.5-0.5v-0.5h4v0.5 c0,0.28,0.22,0.5,0.5,0.5H16c0.55,0,1-0.45,1-1v-1h3V15z"
                  />
                  <circle cx="8.5" cy="13.5" r="1" />
                  <circle cx="15.5" cy="13.5" r="1" />
                  <path d="M12,15.5c-0.55,0-1-0.45-1-1h2C13,15.05,12.55,15.5,12,15.5z" />
                </svg>
              </span>
              <span class="button-text">Import to NekoBox</span>
            </a>
          </div>
        </div>
        <div class="footer">
          <p>© <span id="current-year"></span> REvil - All Rights Reserved</p>
          <p>Secure. Private. Fast.</p>
        </div>
      </div>
      <script>
        function copyToClipboard(button, text) {
          const originalText = button.textContent;
          const isClientBtn = button.classList.contains('client-btn');
          const originalIconHTML = isClientBtn
            ? button.querySelector('.client-icon')?.innerHTML
            : null;
  
          button.disabled = true;
          button.classList.remove('copied', 'error');
  
          if (isClientBtn && button.querySelector('.client-icon')) {
            button.querySelector('.client-icon').style.display = 'none';
          }
          if (isClientBtn && button.querySelector('.button-text')) {
            button.querySelector('.button-text').style.fontWeight = '500';
          }
  
          navigator.clipboard
            .writeText(text)
            .then(() => {
              button.textContent = 'Copied!';
              button.classList.add('copied');
  
              setTimeout(() => {
                if (isClientBtn && originalIconHTML) {
                  const textSpan =
                    button.querySelector('.button-text') || document.createElement('span');
                  textSpan.className = 'button-text';
                  textSpan.textContent = originalText;
  
                  const iconSpan = document.createElement('span');
                  iconSpan.className = 'client-icon';
                  iconSpan.innerHTML = originalIconHTML;
                  iconSpan.style.display = '';
  
                  button.innerHTML = '';
                  button.appendChild(iconSpan);
                  button.appendChild(textSpan);
                } else {
                  button.textContent = originalText;
                }
                button.classList.remove('copied');
                button.disabled = false;
                if (isClientBtn && button.querySelector('.button-text')) {
                  button.querySelector('.button-text').style.fontWeight = '';
                }
              }, 1200);
            })
            .catch(err => {
              console.error('Failed to copy text: ', err);
              button.textContent = 'Error';
              button.classList.add('error');
  
              setTimeout(() => {
                if (isClientBtn && originalIconHTML) {
                  const textSpan =
                    button.querySelector('.button-text') || document.createElement('span');
                  textSpan.className = 'button-text';
                  textSpan.textContent = originalText;
  
                  const iconSpan = document.createElement('span');
                  iconSpan.className = 'client-icon';
                  iconSpan.innerHTML = originalIconHTML;
                  iconSpan.style.display = '';
  
                  button.innerHTML = '';
                  button.appendChild(iconSpan);
                  button.appendChild(textSpan);
                } else {
                  button.textContent = originalText;
                }
                button.classList.remove('error');
                button.disabled = false;
                if (isClientBtn && button.querySelector('.button-text')) {
                  button.querySelector('.button-text').style.fontWeight = '';
                }
              }, 1500);
            });
        }
  
        document.getElementById('current-year').textContent = new Date().getFullYear();
      </script>
    </body>
  </html>  
`;
}

/**
 * this is not real UUID validation
 * @param {string} uuid
 */
function isValidUserCode(code) {
  const codeRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return codeRegex.test(code);
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, c => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
/**
 * normally, webSocket will not has exceptions when close.
 * @param {import("@cloudflare/workers-types").WebSocket} socket
 */
function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error('safeCloseWebSocket error', error);
  }
}

const byteToHex = [];
for (let i = 0; i < 256; ++i) {
  byteToHex.push((i + 256).toString(16).slice(1));
}

function unsafeStringify(arr, offset = 0) {
  return (
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
}

function stringify(arr, offset = 0) {
  const uuid = unsafeStringify(arr, offset);
  if (!isValidUserCode(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }
  return uuid;
}
