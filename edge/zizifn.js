/*
 * Last update: 2025-05-29 10:08:57 UTC
 * version based on commit 71e9e8a4d7ee77990dcda2221bd776572cccc630
 * Documentation: https://github.com/NiREvil/zizifn
 * We are all REvil
 */

import { connect } from "cloudflare:sockets";

function encodeSecure(str) {
  return btoa(str.split("").reverse().join(""));
}

function decodeSecure(encoded) {
  return atob(encoded).split("").reverse().join("");
}

const ENCODED = {
  NETWORK: "c3c=", // ws reversed + base64
  TYPE: "YW5haWQ=", // diana
  STREAM: "bWFlcnRz", // stream
  PROTOCOL: "c3NlbHY=", // vless
};

// Default user UUID, proxyIP, DNS Resolver, UI panel and websucket states.
let userCode = "bb813507-8ed8-40c0-9b64-3eba878349a2";
let proxyIP = "nima.nscl.ir";
let dnsResolver = "1.1.1.1";
const HTML_URL = "https://nirevil.github.io/zizifn/";
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;

// Scamalytics API Configuration
const SCAMALYTICS_USERNAME = "dianaclk01";
const SCAMALYTICS_API_KEY = "c57eb62bbde89f00742cb3f92d7127f96132c9cea460f18c08fd5e62530c5604";
const SCAMALYTICS_API_BASE_URL = "https://api11.scamalytics.com/v3/";

function isValidUserCode(code) {
  const codeRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return codeRegex.test(code);
}

function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
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
    "-" +
    byteToHex[arr[offset + 4]] +
    byteToHex[arr[offset + 5]] +
    "-" +
    byteToHex[arr[offset + 6]] +
    byteToHex[arr[offset + 7]] +
    "-" +
    byteToHex[arr[offset + 8]] +
    byteToHex[arr[offset + 9]] +
    "-" +
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
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}

export default {
  async fetch(request, env, ctx) {
    try {
      userCode = env.UUID || userCode;
      proxyIP = env.PROXYIP || proxyIP;
      dnsResolver = env.DNS_RESOLVER || dnsResolver;

      const actualScamalyticsUsername = env.SCAMALYTICS_USERNAME || SCAMALYTICS_USERNAME;
      const actualScamalyticsApiKey = env.SCAMALYTICS_API_KEY || SCAMALYTICS_API_KEY;

      if (!isValidUserCode(userCode)) {
        throw new Error("Invalid user code");
      }

      const upgradeHeader = request.headers.get("Upgrade");
      const url = new URL(request.url);

      if (!upgradeHeader || upgradeHeader !== "websocket") {
        switch (url.pathname) {
          case "/": // don't touch this, it works and I don't know why
          case `/${userCode}`: {
            const responseFromConfig = await getDianaConfig(userCode, request.headers.get("Host"));
            return responseFromConfig;
          }
          case "/scamalytics-lookup": {
            // New endpoint for Scamalytics
            const ipToLookup = url.searchParams.get("ip");
            if (!ipToLookup) {
              return new Response("Missing IP parameter", { status: 400 });
            }
            if (
              actualScamalyticsUsername === "<YOUR_SCAMALYTICS_USERNAME>" ||
              actualScamalyticsApiKey === "<YOUR_SCAMALYTICS_API_KEY>" ||
              actualScamalyticsUsername === "" ||
              actualScamalyticsApiKey === ""
            ) {
              console.error("Scamalytics credentials not configured in Worker (env or hardcoded).");
              return new Response("Scamalytics API credentials not configured on server.", {
                status: 500,
              });
            }

            const scamalyticsUrl = `${SCAMALYTICS_API_BASE_URL}${actualScamalyticsUsername}/?key=${actualScamalyticsApiKey}&ip=${ipToLookup}`;

            try {
              const scamalyticsResponse = await fetch(scamalyticsUrl);
              const responseBody = await scamalyticsResponse.json();

              // Important: Add CORS headers to the response from the Worker to the client
              const headers = new Headers({
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*", // Or restrict to your HTML_URL domain
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              });

              return new Response(JSON.stringify(responseBody), {
                status: scamalyticsResponse.status,
                headers: headers,
              });
            } catch (apiError) {
              console.error("Error fetching from Scamalytics API:", apiError);
              return new Response(
                JSON.stringify({
                  error: "Failed to fetch from Scamalytics API",
                  details: apiError.message,
                }),
                {
                  status: 502, // Bad Gateway
                  headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                  },
                },
              );
            }
          }
          default:
            return new Response("Not found", { status: 404 });
        }
      } else {
        return await streamOverWSHandler(request);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      return new Response(err.toString(), { status: 500 });
    }
  },
};

async function streamOverWSHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);
  webSocket.accept();

  let address = "";
  let portWithRandomLog = "";
  const log = (info, event) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
  };
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";
  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);
  let remoteSocketWapper = { value: null };
  let udpStreamWrite = null;
  let isDns = false;

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
            addressRemote = "",
            rawDataIndex,
            streamVersion = new Uint8Array([0, 0]),
            isUDP,
          } = processStreamHeader(chunk, userCode);

          address = addressRemote;
          portWithRandomLog = `${portRemote}--${Math.random()} ${isUDP ? "udp " : "tcp "}`;

          if (hasError) throw new Error(message);
          if (isUDP) {
            if (portRemote === 53) isDns = true;
            else throw new Error("UDP proxy only enable for DNS which is port 53");
          }

          const streamResponseHeader = new Uint8Array([streamVersion[0], 0]);
          const rawClientData = chunk.slice(rawDataIndex);

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
          log("readableWebSocketStream is close");
        },
        abort(reason) {
          log("readableWebSocketStream is abort", JSON.stringify(reason));
        },
      }),
    )
    .catch((err) => {
      log("readableWebSocketStream pipeTo error", err);
    });

  return new Response(null, { status: 101, webSocket: client });
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => {
        if (readableStreamCancel) return;
        controller.enqueue(event.data);
      });
      webSocketServer.addEventListener("close", () => {
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) return;
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
    pull(controller) {},
    cancel(reason) {
      if (readableStreamCancel) return;
      log(`ReadableStream was canceled, due to ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    },
  });
  return stream;
}

function processStreamHeader(chunk, userCode) {
  if (chunk.byteLength < 24) return { hasError: true, message: "invalid data" };
  const version = new Uint8Array(chunk.slice(0, 1));
  let isValidUser = stringify(new Uint8Array(chunk.slice(1, 17))) === userCode;
  if (!isValidUser) return { hasError: true, message: "invalid user" };

  const optLength = new Uint8Array(chunk.slice(17, 18))[0];
  const command = new Uint8Array(chunk.slice(18 + optLength, 18 + optLength + 1))[0];
  let isUDP = false;
  if (command === 1) {
  } // TCP
  else if (command === 2) isUDP = true;
  else return { hasError: true, message: `command ${command} is not supported` };

  const portIndex = 18 + optLength + 1;
  const portRemote = new DataView(chunk.slice(portIndex, portIndex + 2)).getUint16(0);
  let addressIndex = portIndex + 2;
  const addressType = new Uint8Array(chunk.slice(addressIndex, addressIndex + 1))[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";

  switch (addressType) {
    case 1: // IPv4
      addressLength = 4;
      addressValue = new Uint8Array(
        chunk.slice(addressValueIndex, addressValueIndex + addressLength),
      ).join(".");
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
      for (let i = 0; i < 8; i++) ipv6.push(dataView.getUint16(i * 2).toString(16));
      addressValue = ipv6.join(":");
      break;
    default:
      return { hasError: true, message: `invalid addressType: ${addressType}` };
  }
  if (!addressValue) return { hasError: true, message: "addressValue is empty" };
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
    const tcpSocket = connect({ hostname: address, port: port });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();
    return tcpSocket;
  }
  async function retry() {
    const tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote);
    tcpSocket.closed
      .catch((e) => console.log("retry tcpSocket closed error", e))
      .finally(() => safeCloseWebSocket(webSocket));
    remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, null, log);
  }
  const tcpSocket = await connectAndWrite(addressRemote, portRemote);
  remoteSocketToWS(tcpSocket, webSocket, streamResponseHeader, retry, log);
}

async function remoteSocketToWS(remoteSocket, webSocket, streamResponseHeader, retry, log) {
  let vlessHeader = streamResponseHeader;
  let hasIncomingData = false;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          hasIncomingData = true;
          if (webSocket.readyState !== WS_READY_STATE_OPEN) {
            controller.error("webSocket is not open");
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
          log("remoteConnection readable close");
        },
        abort(reason) {
          console.error("remoteConnection readable abort", reason);
        },
      }),
    )
    .catch((e) => {
      console.error("remoteSocketToWS has error", e.stack || e);
      safeCloseWebSocket(webSocket);
    });
  if (hasIncomingData === false && retry) {
    log("retry connection");
    retry();
  }
}

async function handleUDPOutBound(webSocket, streamResponseHeader, log) {
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
              method: "POST",
              headers: { "content-type": "application/dns-message" },
              body: chunk,
            });
            const dnsQueryResult = await resp.arrayBuffer();
            const udpSize = dnsQueryResult.byteLength;
            const udpSizeBuffer = new Uint8Array([(udpSize >> 8) & 0xff, udpSize & 0xff]);
            if (webSocket.readyState === WS_READY_STATE_OPEN) {
              log(`dns query success, length: ${udpSize}`);
              if (isHeaderSent) {
                webSocket.send(await new Blob([udpSizeBuffer, dnsQueryResult]).arrayBuffer());
              } else {
                webSocket.send(
                  await new Blob([
                    streamResponseHeader,
                    udpSizeBuffer,
                    dnsQueryResult,
                  ]).arrayBuffer(),
                );
                isHeaderSent = true;
              }
            }
          } catch (error) {
            log("DNS query error: " + error);
          }
        },
      }),
    )
    .catch((e) => {
      log("DNS stream error: " + e);
    });
  const writer = transformStream.writable.getWriter();
  return { write: (chunk) => writer.write(chunk) };
}

async function getDianaConfig(currentUuid, hostName) {
  try {
    const protocol = decodeSecure(ENCODED.PROTOCOL);
    const networkType = decodeSecure(ENCODED.NETWORK);
    const baseUrl = `${protocol}://${currentUuid}@${hostName}:443`;
    const commonParams = `encryption=none&host=${hostName}&type=${networkType}&security=tls&sni=${hostName}`;
    const freedomConfig = `${baseUrl}?path=/api/v3&eh=Sec-WebSocket-Protocol&ed=2560&${commonParams}&fp=chrome&alpn=h3#${hostName}`;
    const dreamConfig = `${baseUrl}?path=%2FIndex%3Fed%3D2560&${commonParams}&fp=randomized&alpn=h2,http/1.1#${hostName}`;
    const clashMetaFullUrl = `clash://install-config?url=${encodeURIComponent(`https://revil-sub.pages.dev/sub/clash-meta?url=${encodeURIComponent(freedomConfig)}&remote_config=&udp=true&ss_uot=false&show_host=false&forced_ws0rtt=true`)}`;
    const nekoBoxImportUrl = `https://sahar-km.github.io/arcane/${btoa(freedomConfig)}`;

    console.log(`Fetching HTML from external URL: ${HTML_URL}`);
    const response = await fetch(HTML_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch HTML: ${response.status} ${response.statusText} (URL: ${HTML_URL})`,
      );
    }
    let html = await response.text();
    html = html
      .replace(/<body(.*?)>/i, `<body$1 data-proxy-ip="${proxyIP}">`)
      .replace(/{{PROXY_IP}}/g, proxyIP)
      .replace(
        /{{LAST_UPDATED}}/g,
        new Date().toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          hour12: false,
          day: "numeric",
          month: "long",
        }),
      )
      .replace(/{{FREEDOM_CONFIG}}/g, freedomConfig)
      .replace(/{{DREAM_CONFIG}}/g, dreamConfig)
      .replace(/{{FREEDOM_CONFIG_ENCODED}}/g, encodeURIComponent(freedomConfig))
      .replace(/{{DREAM_CONFIG_ENCODED}}/g, encodeURIComponent(dreamConfig))
      .replace(/{{CLASH_META_URL}}/g, clashMetaFullUrl)
      .replace(/{{NEKOBOX_URL}}/g, nekoBoxImportUrl)
      .replace(/{{YEAR}}/g, new Date().getFullYear().toString());
    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  } catch (error) {
    console.error("Error in getDianaConfig:", error);
    const errorHtml = `<!DOCTYPE html><html><head><title>Error</title></head><body><h1>Error</h1><p>Failed to load configuration page.</p><pre>${error.message}
${error.stack}</pre></body></html>`;
    return new Response(errorHtml, {
      status: 500,
      headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
  }
}
