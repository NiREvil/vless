/**
 * Last Update: 04:20 UTC - Sunday, 17 April 2024
 * @ts-ignore
 */

import { connect } from "cloudflare:sockets";

// How to generate your own UUID:
// [Windows] Press "Win + R", input cmd and run:  Powershell -NoExit -Command "[guid]::NewGuid()"
let userID = "515541fc-b97a-4aff-9542-ca738affae1f";
if (!isValidUUID(userID)) {
  throw new Error("uuid is not valid");
}

let parsedSocks5Address = {};
let enableSocks = false;

export default {
  /**
   * @param {import("@cloudflare/workers-types").Request} request
   * @param {{UUID: string, PROXYIP: string}} env
   * @param {import("@cloudflare/workers-types").ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    try {
      userID = env.UUID || userID;
      const upgradeHeader = request.headers.get("Upgrade");
      const url = new URL(request.url);
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        switch (url.pathname) {
          case "/":
            return new Response(JSON.stringify(request.cf), { status: 200 });
          case `/${userID}`: {
            const vlessConfig = await getAutoConfs(
              userID,
              request.headers.get("Host")
            );
            return new Response(`${vlessConfig}`, {
              status: 200,
              headers: {
                "Content-Type": "text/plain;charset=utf-8",
              },
            });
          }
          default:
            return new Response("Not found", { status: 404 });
        }
      } else {
        return await vlessOverWSHandler(request);
      }
    } catch (err) {
      /** @type {Error} */ let e = err;
      return new Response(e.toString());
    }
  },
};

/**
 *
 * @param {import("@cloudflare/workers-types").Request} request
 */
async function vlessOverWSHandler(request) {
  /** @type {import("@cloudflare/workers-types").WebSocket[]} */
  // @ts-ignore
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let address = "";
  let portWithRandomLog = "";
  const log = (
    /** @type {string} */ info,
    /** @type {string | undefined} */ event
  ) => {
    console.log(`[${address}:${portWithRandomLog}] ${info}`, event || "");
  };
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";

  const readableWebSocketStream = makeReadableWebSocketStream(
    webSocket,
    earlyDataHeader,
    log
  );

  /** @type {{ value: import("@cloudflare/workers-types").Socket | null}}*/
  let remoteSocketWapper = {
    value: null,
  };
  let isDns = false;

  // ws --> remote
  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDns) {
            return await handleDNSQuery(chunk, webSocket, null, log);
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
            addressType,
            portRemote = 443,
            addressRemote = "",
            rawDataIndex,
            vlessVersion = new Uint8Array([0, 0]),
            isUDP,
          } = processVlessHeader(chunk, userID);
          address = addressRemote;
          portWithRandomLog = `${portRemote}--${Math.random()} ${
            isUDP ? "udp " : "tcp "
          } `;
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
              throw new Error("UDP proxy only enable for DNS which is port 53"); // cf seems has bug, controller.error will not end stream
              return;
            }
          }
          // ["version", "附加信息长度 N"]
          const vlessResponseHeader = new Uint8Array([vlessVersion[0], 0]);
          const rawClientData = chunk.slice(rawDataIndex);

          if (isDns) {
            return handleDNSQuery(
              rawClientData,
              webSocket,
              vlessResponseHeader,
              log
            );
          }
          handleTCPOutBound(
            remoteSocketWapper,
            addressType,
            addressRemote,
            portRemote,
            rawClientData,
            webSocket,
            vlessResponseHeader,
            log
          );
        },
        close() {
          log(`readableWebSocketStream is close`);
        },
        abort(reason) {
          log(`readableWebSocketStream is abort`, JSON.stringify(reason));
        },
      })
    )
    .catch((err) => {
      log("readableWebSocketStream pipeTo error", err);
    });

  return new Response(null, {
    status: 101,
    // @ts-ignore
    webSocket: client,
  });
}

/**
 * Handles outbound TCP connections.
 *
 * @param {any} remoteSocket
 * @param {number} addressType The remote address type to connect to.
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
  addressType,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  vlessResponseHeader,
  log
) {
  async function connectAndWrite(address, port, socks = false) {
    /** @type {import("@cloudflare/workers-types").Socket} */
    const tcpSocket = socks
      ? await socks5Connect(addressType, address, port, log)
      : connect({
          hostname: address,
          port: port,
        });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData); // first write, normal is tls client hello
    writer.releaseLock();
    return tcpSocket;
  }

  // if the cf connect tcp socket have no incoming data, we retry to redirect ip
  async function retry() {
    if (enableSocks) {
      tcpSocket = await connectAndWrite(addressRemote, portRemote, true);
    } else {
      tcpSocket = await connectAndWrite(proxyIP || addressRemote, portRemote);
    }
    // no matter retry success or not, close websocket
    tcpSocket.closed
      .catch((error) => {
        console.log("retry tcpSocket closed error", error);
      })
      .finally(() => {
        safeCloseWebSocket(webSocket);
      });
    remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, null, log);
  }

  let tcpSocket = await connectAndWrite(addressRemote, portRemote);

  // when remoteSocket is ready, pass to websocket
  // remote--> ws
  remoteSocketToWS(tcpSocket, webSocket, vlessResponseHeader, retry, log);
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
      webSocketServer.addEventListener("message", (event) => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });

      // The event means that the client closed the client -> server stream.
      // However, the server -> client stream is still open until you call close() on the server side.
      // The WebSocket protocol says that a separate close message must be sent in each direction to fully close the socket.
      webSocketServer.addEventListener("close", () => {
        // client send close, need close server
        // if stream is cancel, skip controller.close
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) {
          return;
        }
        controller.close();
      });
      webSocketServer.addEventListener("error", (err) => {
        log("webSocketServer has error");
        controller.error(err);
      });
      // for ws 0rtt
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
function processVlessHeader(vlessBuffer, userID) {
  if (vlessBuffer.byteLength < 24) {
    return {
      hasError: true,
      message: "invalid data",
    };
  }
  const version = new Uint8Array(vlessBuffer.slice(0, 1));
  let isValidUser = false;
  let isUDP = false;
  if (stringify(new Uint8Array(vlessBuffer.slice(1, 17))) === userID) {
    isValidUser = true;
  }
  if (!isValidUser) {
    return {
      hasError: true,
      message: "invalid user",
    };
  }

  const optLength = new Uint8Array(vlessBuffer.slice(17, 18))[0];
  //skip opt for now

  const command = new Uint8Array(
    vlessBuffer.slice(18 + optLength, 18 + optLength + 1)
  )[0];

  // 0x01 TCP
  // 0x02 UDP
  // 0x03 MUX
  if (command === 1) {
  } else if (command === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${command} is not support, command 01-tcp,02-udp,03-mux`,
    };
  }
  const portIndex = 18 + optLength + 1;
  const portBuffer = vlessBuffer.slice(portIndex, portIndex + 2);
  // port is big-Endian in raw data etc 80 == 0x005d
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(
    vlessBuffer.slice(addressIndex, addressIndex + 1)
  );

  // 1--> ipv4  addressLength =4
  // 2--> domain name addressLength=addressBuffer[1]
  // 3--> ipv6  addressLength =16
  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";
  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = new Uint8Array(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      ).join(".");
      break;
    case 2:
      addressLength = new Uint8Array(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + 1)
      )[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      );
      break;
    case 3:
      addressLength = 16;
      const dataView = new DataView(
        vlessBuffer.slice(addressValueIndex, addressValueIndex + addressLength)
      );
      // 2001:0db8:85a3:0000:0000:8a2e:0370:7334
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      // seems no need add [] for ipv6
      break;
    default:
      return {
        hasError: true,
        message: `invild  addressType is ${addressType}`,
      };
  }
  if (!addressValue) {
    return {
      hasError: true,
      message: `addressValue is empty, addressType is ${addressType}`,
    };
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType,
    portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    vlessVersion: version,
    isUDP,
  };
}

/**
 *
 * @param {import("@cloudflare/workers-types").Socket} remoteSocket
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket
 * @param {ArrayBuffer} vlessResponseHeader
 * @param {(() => Promise<void>) | null} retry
 * @param {*} log
 */
async function remoteSocketToWS(
  remoteSocket,
  webSocket,
  vlessResponseHeader,
  retry,
  log
) {
  // remote--> ws
  let remoteChunkCount = 0;
  let chunks = [];
  /** @type {ArrayBuffer | null} */
  let vlessHeader = vlessResponseHeader;
  let hasIncomingData = false; // check if remoteSocket has incoming data
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        start() {},
        /**
         *
         * @param {Uint8Array} chunk
         * @param {*} controller
         */
        async write(chunk, controller) {
          hasIncomingData = true;
          // remoteChunkCount++;
          if (webSocket.readyState !== WS_READY_STATE_OPEN) {
            controller.error("webSocket.readyState is not open, maybe close");
          }
          if (vlessHeader) {
            webSocket.send(await new Blob([vlessHeader, chunk]).arrayBuffer());
            vlessHeader = null;
          } else {
            // seems no need rate limit this, CF seems fix this??..
            // if (remoteChunkCount > 20000) {
            // 	// cf one package is 4096 byte(4kb),  4096 * 20000 = 80M
            // 	await delay(1);
            // }
            webSocket.send(chunk);
          }
        },
        close() {
          log(
            `remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`
          );
          // safeCloseWebSocket(webSocket); // no need server close websocket frist for some case will casue HTTP ERR_CONTENT_LENGTH_MISMATCH issue, client will send close event anyway.
        },
        abort(reason) {
          console.error(`remoteConnection!.readable abort`, reason);
        },
      })
    )
    .catch((error) => {
      console.error(`remoteSocketToWS has exception `, error.stack || error);
      safeCloseWebSocket(webSocket);
    });

  // seems is cf connect socket have error,
  // 1. Socket.closed will have error
  // 2. Socket.readable will be close without any data coming
  if (hasIncomingData === false && retry) {
    log(`retry`);
    retry();
  }
}

/**
 *
 * @param {string} base64Str
 * @returns
 */
function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    // go use modified Base64 for URL rfc4648 which js atob not support
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * This is not real UUID validation
 * @param {string} uuid
 */
function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
/**
 * Normally, WebSocket will not has exceptions when close.
 * @param {import("@cloudflare/workers-types").WebSocket} socket
 */
function safeCloseWebSocket(socket) {
  try {
    if (
      socket.readyState === WS_READY_STATE_OPEN ||
      socket.readyState === WS_READY_STATE_CLOSING
    ) {
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
  if (!isValidUUID(uuid)) {
    throw TypeError("Stringified UUID is invalid");
  }
  return uuid;
}

/**
 *
 * @param {ArrayBuffer} udpChunk
 * @param {import("@cloudflare/workers-types").WebSocket} webSocket
 * @param {ArrayBuffer} vlessResponseHeader
 * @param {(string)=> void} log
 */
async function handleDNSQuery(udpChunk, webSocket, vlessResponseHeader, log) {
  // no matter which DNS server client send, we alwasy use hard code one.
  // beacsue someof DNS server is not support DNS over TCP
  try {
    const dnsServer = "8.8.4.4"; // change to 1.1.1.1 after cf fix connect own ip bug
    const dnsPort = 53;
    /** @type {ArrayBuffer | null} */
    let vlessHeader = vlessResponseHeader;
    /** @type {import("@cloudflare/workers-types").Socket} */
    const tcpSocket = connect({
      hostname: dnsServer,
      port: dnsPort,
    });

    log(`connected to ${dnsServer}:${dnsPort}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(udpChunk);
    writer.releaseLock();
    await tcpSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            if (vlessHeader) {
              webSocket.send(
                await new Blob([vlessHeader, chunk]).arrayBuffer()
              );
              vlessHeader = null;
            } else {
              webSocket.send(chunk);
            }
          }
        },
        close() {
          log(`dns server(${dnsServer}) tcp is close`);
        },
        abort(reason) {
          console.error(`dns server(${dnsServer}) tcp is abort`, reason);
        },
      })
    );
  } catch (error) {
    console.error(`handleDNSQuery have exception, error: ${error.message}`);
  }
}

/**
 *
 * @param {number} addressType
 * @param {string} addressRemote
 * @param {number} portRemote
 * @param {function} log The logging function.
 */
async function socks5Connect(addressType, addressRemote, portRemote, log) {
  const { username, password, hostname, port } = parsedSocks5Address;
  // Connect to the SOCKS server
  const socket = connect({
    hostname,
    port,
  });

  // Request head format (Worker -> Socks Server):
  // +----+----------+----------+
  // |VER | NMETHODS | METHODS  |
  // +----+----------+----------+
  // | 1  |    1     | 1 to 255 |
  // +----+----------+----------+

  // https://en.wikipedia.org/wiki/SOCKS#SOCKS5
  // For METHODS:
  // 0x00 NO AUTHENTICATION REQUIRED
  // 0x02 USERNAME/PASSWORD https://datatracker.ietf.org/doc/html/rfc1929
  const socksGreeting = new Uint8Array([5, 2, 0, 2]);

  const writer = socket.writable.getWriter();

  await writer.write(socksGreeting);
  log("sent socks greeting");

  const reader = socket.readable.getReader();
  const encoder = new TextEncoder();
  let res = (await reader.read()).value;
  // Response format (Socks Server -> Worker):
  // +----+--------+
  // |VER | METHOD |
  // +----+--------+
  // | 1  |   1    |
  // +----+--------+
  if (res[0] !== 0x05) {
    log(`socks server version error: ${res[0]} expected: 5`);
    return;
  }
  if (res[1] === 0xff) {
    log("no acceptable methods");
    return;
  }

  // if return 0x0502
  if (res[1] === 0x02) {
    log("socks server needs auth");
    if (!username || !password) {
      log("please provide username/password");
      return;
    }
    // +----+------+----------+------+----------+
    // |VER | ULEN |  UNAME   | PLEN |  PASSWD  |
    // +----+------+----------+------+----------+
    // | 1  |  1   | 1 to 255 |  1   | 1 to 255 |
    // +----+------+----------+------+----------+
    const authRequest = new Uint8Array([
      1,
      username.length,
      ...encoder.encode(username),
      password.length,
      ...encoder.encode(password),
    ]);
    await writer.write(authRequest);
    res = (await reader.read()).value;
    // expected 0x0100
    if (res[0] !== 0x01 || res[1] !== 0x00) {
      log("fail to auth socks server");
      return;
    }
  }

  // Request data format (Worker -> Socks Server):
  // +----+-----+-------+------+----------+----------+
  // |VER | CMD |  RSV  | ATYP | DST.ADDR | DST.PORT |
  // +----+-----+-------+------+----------+----------+
  // | 1  |  1  | X'00' |  1   | Variable |    2     |
  // +----+-----+-------+------+----------+----------+
  // ATYP: address type of following address
  // 0x01: IPv4 address
  // 0x03: Domain name
  // 0x04: IPv6 address
  // DST.ADDR: desired destination address
  // DST.PORT: desired destination port in network octet order

  // addressType
  // 1--> ipv4  addressLength =4
  // 2--> domain name
  // 3--> ipv6  addressLength =16
  let DSTADDR; // DSTADDR = ATYP + DST.ADDR
  switch (addressType) {
    case 1:
      DSTADDR = new Uint8Array([1, ...addressRemote.split(".").map(Number)]);
      break;
    case 2:
      DSTADDR = new Uint8Array([
        3,
        addressRemote.length,
        ...encoder.encode(addressRemote),
      ]);
      break;
    case 3:
      DSTADDR = new Uint8Array([
        4,
        ...addressRemote
          .split(":")
          .flatMap((x) => [
            parseInt(x.slice(0, 2), 16),
            parseInt(x.slice(2), 16),
          ]),
      ]);
      break;
    default:
      log(`invild  addressType is ${addressType}`);
      return;
  }
  const socksRequest = new Uint8Array([
    5,
    1,
    0,
    ...DSTADDR,
    portRemote >> 8,
    portRemote & 0xff,
  ]);
  await writer.write(socksRequest);
  log("sent socks request");

  res = (await reader.read()).value;
  // Response format (Socks Server -> Worker):
  //  +----+-----+-------+------+----------+----------+
  // |VER | REP |  RSV  | ATYP | BND.ADDR | BND.PORT |
  // +----+-----+-------+------+----------+----------+
  // | 1  |  1  | X'00' |  1   | Variable |    2     |
  // +----+-----+-------+------+----------+----------+
  if (res[1] === 0x00) {
    log("socks connection opened");
  } else {
    log("fail to open socks connection");
    return;
  }
  writer.releaseLock();
  reader.releaseLock();
  return socket;
}

/**
 *
 * @param {string} userID
 * @param {string | null} hostName
 * @returns {string}
 */
function getAutoConfs(userID, hostName) {
  let vlessOutbound = {
    tag: "",
    protocol: "vless",
    streamSettings: {
      network: "ws",
      security: "tls",
      tlsSettings: {
        allowInsecure: false,
        serverName: hostName,
        alpn: ["http/1.1", "h2"],
        fingerprint: "chrome",
        show: false,
      },
      wsSettings: {
        path: "/assets/images?ed=2560",
        headers: {
          Host: hostName,
        },
      },
    },
    settings: {
      vnext: [
        {
          address: "",
          port: 443,
          users: [
            {
              encryption: "none",
              flow: "",
              id: userID,
              level: 8,
              security: "auto",
            },
          ],
        },
      ],
    },
  };
  let outs = [];
  for (let i = 0; i <= 50; i++) {
    let out = structuredClone(vlessOutbound);
    out.tag = `o${i}`;
    out.settings.vnext[0].address =
      cfIPs[Math.floor(Math.random() * cfIPs.length)];
    outs.push(out);
  }
  let res = [];
  for (let balancer of ["leastPing", "leastLoad"]) {
    for (let mux of [false, true]) {
      for (let frag of [false, true]) {
        let remarks = `🔹 ${balancer} 🔹 `;
        let tempBase = structuredClone(baseConfig);
        let tempOuts = structuredClone(outs);
        if (balancer == "leastPing") {
          tempBase["observatory"] = {
            subjectSelector: ["o"],
            probeURL: "http://www.google.com/gen_204",
            probeInterval: "3m",
            EnableConcurrency: true,
          };
        } else {
          tempBase["burstObservatory"] = {
            subjectSelector: ["o"],
            pingConfig: {
              destination: "https://clients3.google.com/generate_204",
              interval: "1h",
              connectivity: "https://clients3.google.com/generate_204",
              timeout: "3s",
              sampling: 5,
            },
          };
        }
        tempBase.routing.balancers = [
          {
            tag: "balancer",
            selector: ["o"],
            strategy: {
              type: balancer,
            },
          },
        ];
        if (mux) {
          remarks += "Mux: ✅";
          tempOuts = tempOuts.map(addMux);
        } else {
          remarks += "Mux: 🅾️";
        }
        if (frag) {
          remarks += " Frag: ✅";
          tempOuts = tempOuts.map(addFrag);
        } else {
          remarks += " Frag: 🅾️";
        }
        tempBase.remarks = remarks;
        tempBase.outbounds.push(...tempOuts);
        res.push(tempBase);
      }
    }
  }
  return JSON.stringify(res, null, 4);
}

function addMux(outBound) {
  outBound.mux = {
    concurrency: 8,
    enabled: false,
    xudpConcurrency: 8,
    xudpProxyUDP443: "",
  };
  return outBound;
}
function addFrag(outBound) {
  outBound.sockopt = {
    dialerProxy: "fragment",
    tcpKeepAliveIdle: 100,
    mark: 255,
    tcpNoDelay: true,
  };
  return outBound;
}

let baseConfig = {
  remarks: "",
  log: {
    loglevel: "warning",
  },
  inbounds: [
    {
      tag: "socks",
      port: 10808,
      listen: "127.0.0.1",
      protocol: "socks",
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls"],
        routeOnly: false,
      },
      settings: {
        auth: "noauth",
        udp: true,
        allowTransparent: false,
      },
    },
    {
      tag: "http",
      port: 10809,
      listen: "127.0.0.1",
      protocol: "http",
      sniffing: {
        enabled: true,
        destOverride: ["http", "tls"],
        routeOnly: false,
      },
      settings: {
        auth: "noauth",
        udp: true,
        allowTransparent: false,
      },
    },
  ],
  outbounds: [
    {
      tag: "direct",
      protocol: "freedom",
      settings: {},
    },
    {
      tag: "block",
      protocol: "blackhole",
      settings: {
        response: {
          type: "http",
        },
      },
    },
    {
      tag: "fragment",
      protocol: "freedom",
      settings: {
        domainStrategy: "AsIs",
        fragment: {
          packets: "tlshello",
          length: "10-30",
          interval: "1-2",
        },
      },
      streamSettings: {
        sockopt: {
          tcpNoDelay: true,
          tcpKeepAliveIdle: 100,
        },
      },
    },
  ],
  routing: {
    domainStrategy: "AsIs",
    rules: [
      {
        domain: ["geosite:private", "domain:.ir"],
        outboundTag: "direct",
        type: "field",
      },
      {
        ip: ["geoip:private", "geoip:ir"],
        outboundTag: "direct",
        type: "field",
      },
      {
        type: "field",
        network: "tcp,udp",
        balancerTag: "balancer",
      },
    ],
  },
};
let cfIPs = [
  "172.64.128.42",
  "185.193.28.55",
  "190.93.246.0",
  "162.159.240.3",
  "172.67.64.41",
  "45.131.209.50",
  "203.30.190.2",
  "188.114.97.160",
  "185.193.29.164",
  "203.24.103.75",
  "172.66.44.252",
  "172.64.128.51",
  "172.66.40.23",
  "185.201.139.38",
  "203.24.102.140",
  "203.29.52.23",
  "172.64.128.50",
  "162.159.192.6",
  "172.66.44.60",
  "45.159.218.29",
  "172.64.128.19",
  "203.34.80.48",
  "188.114.96.24",
  "203.24.103.77",
  "162.159.240.14",
  "172.64.192.47",
  "185.193.29.37",
  "190.93.244.56",
  "198.41.223.1",
  "172.64.128.55",
  "172.66.0.41",
  "185.193.31.34",
  "172.66.1.56",
  "198.41.222.55",
  "172.64.192.42",
  "203.30.189.38",
  "198.41.216.9",
  "203.30.188.60",
  "212.110.134.204",
  "172.64.192.66",
  "203.30.189.33",
  "141.101.120.47",
  "162.159.128.24",
  "172.66.41.33",
  "172.64.192.43",
  "198.41.215.155",
  "185.193.29.179",
  "203.55.107.164",
  "172.64.192.26",
  "203.29.53.166",
  "141.101.114.36",
  "172.66.44.64",
  "172.67.96.1",
  "172.67.96.41",
  "141.101.122.51",
  "172.66.43.58",
  "172.67.0.58",
  "198.41.221.41",
  "203.34.80.230",
  "172.66.3.142",
  "172.66.44.59",
  "190.93.246.35",
  "203.24.108.11",
  "172.66.44.31",
  "172.66.46.69",
  "162.159.128.3",
  "172.64.128.58",
  "172.66.40.54",
  "198.41.221.252",
  "185.72.49.70",
  "172.64.128.5",
  "172.67.64.29",
  "190.93.246.34",
  "172.67.128.33",
  "172.66.3.165",
  "172.67.160.12",
  "203.17.126.65",
  "203.34.80.190",
  "162.159.240.2",
  "172.67.96.36",
  "203.24.109.16",
  "154.84.175.141",
  "190.93.246.38",
  "45.131.209.7",
  "45.131.209.34",
  "162.159.128.6",
  "172.64.128.63",
  "172.67.127.254",
  "190.93.245.255",
  "185.109.21.233",
  "203.28.9.153",
  "104.30.2.194",
  "141.101.114.46",
  "172.66.1.26",
  "172.66.47.7",
  "185.238.228.46",
  "141.101.120.2",
  "172.67.224.59",
  "172.66.46.6",
  "172.67.192.32",
  "172.67.160.58",
  "212.110.134.64",
  "172.66.41.4",
  "172.66.42.28",
  "162.159.240.30",
  "172.64.192.8",
  "188.114.98.31",
  "162.159.160.2",
  "190.93.245.254",
  "162.159.40.47",
  "172.67.160.3",
  "104.24.0.22",
  "172.64.128.66",
  "172.64.128.2",
  "104.21.0.59",
  "104.24.0.14",
  "172.66.42.85",
  "172.67.192.24",
  "172.66.47.55",
  "162.159.192.26",
  "172.66.3.155",
  "104.22.0.0",
  "172.66.1.57",
  "172.66.3.179",
  "198.41.221.254",
  "141.101.114.35",
  "141.101.114.48",
  "141.101.122.38",
  "172.66.46.54",
  "172.66.2.177",
  "104.24.128.54",
  "172.66.3.177",
  "141.101.120.25",
  "108.162.192.48",
  "172.64.192.48",
  "203.23.103.190",
  "66.235.200.127",
  "104.24.128.32",
  "104.18.0.20",
  "203.30.189.40",
  "104.21.0.51",
  "172.64.128.68",
  "172.66.3.31",
  "188.114.98.190",
  "212.110.135.1",
  "162.159.160.21",
  "205.233.181.11",
  "141.101.122.10",
  "172.67.192.23",
  "198.41.222.255",
  "141.101.122.30",
  "104.18.0.44",
  "162.159.240.1",
  "104.16.0.6",
  "108.162.192.6",
  "172.66.42.11",
  "172.66.40.40",
  "198.41.220.7",
  "104.16.0.62",
  "104.24.128.7",
  "104.24.0.30",
  "172.66.45.30",
  "104.25.0.15",
  "141.101.122.16",
  "172.67.224.6",
  "104.30.2.64",
  "198.41.223.3",
  "141.101.122.22",
  "172.66.40.50",
  "141.101.122.44",
  "141.101.122.49",
  "172.67.64.47",
  "64.68.192.226",
  "172.67.192.30",
  "198.41.222.252",
  "172.66.2.153",
  "172.67.192.17",
  "172.64.128.21",
  "104.24.128.22",
  "172.66.3.37",
  "172.67.192.42",
  "205.233.181.109",
  "108.162.196.3",
  "162.159.128.1",
  "172.66.42.47",
  "172.67.224.62",
  "23.227.60.6",
  "104.24.128.30",
  "172.66.46.254",
  "203.29.52.21",
  "172.64.128.48",
  "104.18.0.8",
  "162.159.16.5",
  "104.18.0.41",
  "172.64.192.1",
  "104.22.0.32",
  "203.23.104.171",
  "172.66.43.3",
  "203.17.126.110",
  "172.66.44.40",
  "172.67.96.42",
  "162.159.0.10",
  "185.193.29.44",
  "141.101.114.42",
  "203.28.9.217",
  "141.101.120.0",
  "172.64.192.73",
  "172.66.41.9",
  "104.25.0.21",
  "188.114.98.169",
  "198.41.222.63",
  "23.227.39.76",
  "172.66.44.52",
  "172.66.46.14",
  "172.66.44.58",
  "198.41.221.49",
  "185.193.30.179",
  "104.30.2.65",
  "172.64.128.28",
  "162.159.192.34",
  "64.68.192.39",
  "104.17.0.15",
  "172.67.96.43",
  "198.41.222.6",
  "203.55.107.140",
  "172.67.128.24",
  "172.67.128.65",
  "185.193.29.59",
  "203.24.109.14",
  "141.101.123.251",
  "190.93.244.1",
  "190.93.246.61",
  "203.32.120.131",
  "162.159.8.31",
  "190.93.246.37",
  "104.25.0.23",
  "104.25.128.39",
  "185.72.49.96",
  "66.235.200.63",
  "203.34.28.187",
  "172.67.128.13",
  "162.159.240.15",
  "162.159.128.19",
  "172.66.1.33",
  "172.64.128.67",
  "172.66.0.192",
  "108.162.194.50",
  "194.152.44.224",
  "203.23.103.125",
  "203.30.190.127",
  "172.67.128.12",
  "172.66.2.23",
  "194.36.55.190",
  "172.67.0.66",
  "185.148.106.156",
  "104.18.0.12",
  "203.22.223.225",
  "203.30.191.24",
  "172.67.96.24",
  "185.193.31.39",
  "185.193.30.164",
  "203.32.120.158",
  "162.159.160.41",
  "172.64.128.39",
  "172.66.1.182",
  "190.93.247.254",
  "162.159.160.16",
  "104.20.0.10",
  "185.238.228.79",
  "198.41.222.254",
  "193.9.49.48",
  "104.20.0.46",
  "198.41.222.53",
  "162.159.128.26",
  "141.101.122.48",
  "141.101.122.32",
  "212.110.135.68",
  "160.153.0.136",
  "108.162.198.6",
  "172.64.128.70",
  "203.30.191.43",
  "104.30.2.71",
  "172.67.128.1",
  "203.32.121.22",
  "190.93.246.2",
  "172.66.3.168",
  "172.66.1.65",
  "190.93.244.13",
  "104.19.0.13",
  "172.67.223.254",
  "188.42.88.202",
  "203.24.108.3",
  "203.34.80.194",
  "104.26.0.16",
  "141.101.114.18",
  "212.110.134.142",
  "162.159.128.21",
  "190.93.244.16",
  "172.67.192.41",
  "141.101.122.8",
  "172.66.45.53",
  "198.41.221.8",
  "91.195.110.187",
  "172.67.0.36",
  "108.162.192.11",
  "172.66.1.185",
  "198.41.220.16",
  "141.101.120.44",
  "23.227.38.212",
  "104.22.0.15",
  "194.152.44.228",
  "23.227.60.97",
  "205.233.181.1",
  "162.159.192.18",
  "172.66.43.87",
  "185.193.31.127",
  "104.24.0.18",
  "188.114.96.143",
  "190.93.244.0",
  "172.67.64.21",
  "185.193.31.47",
  "104.26.0.11",
  "162.159.160.19",
  "162.159.192.31",
  "162.251.82.69",
  "104.17.0.49",
  "203.34.28.189",
  "172.67.224.23",
  "172.67.32.40",
  "162.251.82.5",
  "185.193.30.37",
  "198.41.216.5",
  "104.24.128.16",
  "162.159.8.33",
  "103.21.244.96",
  "172.66.45.39",
  "141.101.122.40",
  "203.29.55.44",
  "108.162.194.22",
  "162.159.192.37",
  "172.66.3.43",
  "108.162.192.46",
  "104.24.0.28",
  "141.101.122.2",
  "108.162.196.16",
  "172.66.41.90",
  "141.101.122.20",
  "185.193.29.47",
  "45.131.211.33",
  "203.22.223.129",
  "203.29.54.24",
  "203.24.103.20",
  "185.193.29.6",
  "203.30.188.16",
  "172.67.160.27",
  "203.28.9.26",
  "190.93.244.37",
  "108.162.196.4",
  "104.30.2.74",
  "162.159.192.27",
  "162.251.82.95",
  "172.66.42.35",
  "185.193.31.125",
  "162.159.240.4",
  "198.41.220.21",
  "104.17.0.25",
  "104.24.128.10",
  "141.101.114.41",
  "190.93.244.35",
  "108.162.198.47",
  "198.41.221.4",
  "172.66.45.68",
  "203.28.9.148",
  "203.29.52.147",
  "23.227.38.140",
  "45.87.175.46",
  "172.66.3.134",
  "172.66.1.171",
  "188.114.97.162",
  "203.30.191.127",
  "190.93.244.60",
  "212.110.134.11",
  "147.78.140.124",
  "185.201.139.31",
  "45.85.119.209",
  "45.85.118.185",
  "45.95.241.188",
  "45.95.241.134",
  "45.85.119.204",
  "45.85.119.144",
  "45.85.119.140",
  "192.65.217.6",
  "45.85.119.27",
  "45.85.119.40",
  "45.85.119.72",
  "45.95.241.81",
  "185.162.231.254",
  "141.193.213.202",
  "185.148.106.249",
  "185.148.107.231",
  "185.148.107.128",
  "104.254.140.207",
  "45.85.118.1",
  "185.170.166.128",
  "45.95.241.3",
  "199.181.197.219",
  "199.181.197.252",
  "199.181.197.212",
  "185.201.139.164",
  "141.193.213.32",
  "45.131.209.111",
  "185.238.228.14",
  "193.227.99.169",
  "108.165.216.88",
  "159.246.55.186",
  "203.32.120.176",
  "195.137.167.30",
  "159.112.235.30",
  "185.193.29.140",
  "195.137.167.17",
  "192.65.217.70",
  "203.32.120.17",
  "45.142.120.47",
  "147.78.140.25",
  "188.42.89.202",
  "45.85.118.224",
  "45.85.119.231",
  "45.85.118.133",
  "45.95.241.219",
  "45.85.118.120",
  "45.85.118.229",
  "192.65.217.10",
  "185.109.21.30",
  "185.109.21.50",
  "203.24.102.25",
  "203.29.53.175",
  "194.36.55.157",
  "203.30.191.74",
  "194.152.44.86",
  "194.53.53.237",
  "45.95.241.27",
  "195.85.59.99",
  "194.53.53.56",
  "203.28.8.158",
  "45.95.241.25",
  "193.9.49.13",
  "141.193.213.133",
  "147.185.161.110",
  "185.162.231.116",
  "185.148.107.214",
  "45.85.119.4",
  "199.181.197.164",
  "199.181.197.174",
  "185.148.107.223",
  "212.110.135.142",
  "212.110.135.172",
  "154.83.2.29",
  "185.238.228.213",
  "45.131.4.73",
  "159.112.235.45",
  "212.110.135.41",
  "191.101.251.31",
  "185.162.231.73",
  "185.174.138.30",
  "185.193.31.213",
  "141.193.213.12",
  "185.201.139.68",
  "203.24.108.237",
  "185.221.160.88",
  "193.227.99.172",
  "104.254.140.32",
  "203.32.120.121",
  "203.32.120.167",
  "212.110.134.18",
  "185.176.24.138",
  "203.24.103.145",
  "104.254.140.64",
  "205.233.181.20",
  "185.176.26.167",
  "45.159.216.219",
  "45.159.217.133",
  "185.148.107.10",
  "185.162.230.11",
  "185.162.228.88",
  "185.201.139.27",
  "45.159.219.229",
  "45.131.209.217",
  "203.32.120.188",
  "45.131.209.240",
  "199.181.197.25",
  "192.65.217.233",
  "170.114.46.81",
  "185.193.29.34",
  "188.42.88.241",
  "160.153.0.201",
  "193.227.99.21",
  "45.85.118.255",
  "203.24.109.94",
  "192.65.217.91",
  "203.24.108.48",
  "185.176.26.10",
  "203.23.104.32",
  "194.152.44.88",
  "185.176.24.25",
  "203.24.109.21",
  "194.152.44.31",
  "45.95.241.118",
  "203.30.188.21",
  "203.29.55.211",
  "168.100.6.114",
  "199.212.90.19",
  "91.195.110.33",
  "203.30.191.22",
  "193.227.99.15",
  "89.116.250.22",
  "203.24.102.42",
  "168.100.6.247",
  "154.85.99.17",
  "203.24.108.9",
  "147.78.140.1",
  "203.28.9.143",
  "203.34.28.41",
  "45.80.111.73",
  "203.28.8.169",
  "203.34.28.25",
  "45.131.7.225",
  "194.53.53.50",
  "45.131.6.200",
  "45.85.119.37",
  "203.28.9.146",
  "195.85.59.12",
  "185.162.231.146",
  "185.162.228.174",
  "141.193.213.247",
  "185.221.160.161",
  "159.112.235.128",
  "185.162.228.162",
  "212.110.134.152",
  "199.181.197.165",
  "199.181.197.134",
  "188.42.88.0",
  "188.42.89.3",
  "45.131.6.86",
  "195.137.167.213",
  "45.131.5.56",
  "199.181.197.249",
  "195.245.221.181",
  "194.152.44.134",
  "203.23.106.167",
  "45.142.120.163",
  "203.30.190.105",
  "185.201.139.16",
  "212.110.135.43",
  "203.55.107.163",
  "45.159.217.126",
  "185.176.24.173",
  "203.24.108.200",
  "185.201.139.70",
  "203.24.108.225",
  "185.193.29.144",
  "185.193.29.174",
  "185.148.106.27",
  "108.165.216.27",
  "203.23.104.198",
  "203.24.103.163",
  "108.165.216.52",
  "185.176.24.194",
  "203.32.120.189",
  "199.212.90.164",
  "45.131.210.123",
  "185.193.30.237",
  "193.227.99.179",
  "203.23.104.133",
  "195.137.167.44",
  "154.85.99.241",
  "203.24.108.23",
  "185.193.29.47",
  "185.193.30.41",
  "185.193.30.34",
  "160.153.0.173",
  "203.34.80.179",
  "194.152.44.12",
  "195.85.59.191",
  "203.24.109.46",
  "45.159.219.14",
  "203.24.102.55",
  "185.176.26.22",
  "203.24.102.13",
  "185.162.231.8",
  "185.59.218.30",
  "203.24.109.19",
  "159.246.55.85",
  "66.81.247.202",
  "203.17.126.24",
  "203.13.32.213",
  "203.30.188.11",
  "185.176.26.19",
  "199.212.90.24",
  "203.24.109.26",
  "185.193.28.44",
  "185.109.21.10",
  "170.114.45.34",
  "89.116.250.36",
  "203.24.103.11",
  "168.100.6.226",
  "194.36.55.22",
  "45.131.4.241",
  "203.29.52.10",
  "203.24.102.0",
  "203.29.53.98",
  "168.100.6.31",
  "203.13.32.33",
  "203.23.103.2",
  "193.9.49.181",
  "168.100.6.29",
  "203.28.8.170",
  "168.100.6.14",
  "188.42.88.10",
  "188.42.88.13",
  "188.42.88.59",
  "66.81.247.34",
  "203.28.9.221",
  "185.72.49.17",
  "185.72.49.21",
  "185.162.229.59",
  "45.131.208.114",
  "203.55.107.48",
  "203.17.126.22",
  "203.29.53.58",
  "45.131.6.202",
  "185.72.49.51",
  "203.28.8.50",
  "188.42.88.23",
  "185.174.138.154",
  "185.221.160.32",
  "45.133.247.182",
  "141.193.213.78",
  "185.238.228.182",
  "185.193.28.194",
  "45.133.247.170",
  "185.170.166.197",
  "185.221.160.121",
  "199.181.197.183",
  "45.131.208.71",
  "198.41.217.2",
  "203.24.102.159",
  "203.24.102.218",
  "203.28.9.152",
  "45.142.120.182",
  "45.80.111.16",
  "104.17.0.198",
  "104.22.0.118",
  "172.66.0.67",
  "203.24.108.128",
  "141.193.213.123",
  "104.19.128.214",
  "104.22.0.192",
  "104.19.128.134",
  "104.16.0.19",
  "141.101.120.253",
  "203.28.9.88",
  "23.227.38.223",
  "104.17.0.162",
  "45.12.30.158",
  "104.30.2.158",
  "185.176.26.154",
  "203.17.126.107",
  "190.93.244.2",
  "104.18.128.127",
  "104.17.0.170",
  "104.24.191.254",
  "203.55.107.226",
  "104.16.128.219",
  "104.17.128.28",
  "162.159.240.16",
  "45.131.210.249",
  "195.245.221.62",
  "64.68.192.76",
  "45.12.30.125",
  "45.12.30.2",
  "23.227.60.182",
  "104.22.0.121",
  "104.22.0.124",
  "104.22.0.131",
  "104.16.0.138",
  "104.21.0.125",
  "172.64.128.1",
  "104.19.128.131",
  "141.101.113.4",
  "185.221.160.1",
  "203.23.103.181",
  "23.227.60.92",
  "185.148.104.192",
  "190.93.246.0",
  "185.176.26.168",
  "185.221.160.227",
  "66.235.200.92",
  "104.20.128.129",
  "45.142.120.137",
  "173.245.58.156",
  "66.81.255.62",
  "203.13.32.181",
  "104.20.0.192",
  "104.18.128.151",
  "104.18.128.159",
  "45.12.30.221",
  "104.18.0.139",
  "173.245.59.148",
  "203.23.103.63",
  "104.31.16.2",
  "172.66.43.0",
  "203.34.80.124",
  "198.41.215.24",
  "104.17.128.160",
  "23.227.39.211",
  "104.20.0.165",
  "185.176.26.91",
  "195.85.23.170",
  "104.17.0.150",
  "185.170.166.152",
  "185.201.139.182",
  "104.17.128.128",
  "185.221.160.166",
  "104.18.0.25",
  "104.18.128.175",
  "104.19.128.22",
  "104.21.0.128",
  "188.114.99.56",
  "104.21.0.155",
  "45.131.210.121",
  "173.245.49.46",
  "104.18.0.175",
  "198.41.211.1",
  "104.17.0.155",
  "23.227.38.127",
  "104.19.128.182",
  "104.18.0.127",
  "104.25.127.251",
  "45.14.174.136",
  "45.131.209.2",
  "172.66.0.3",
  "45.133.247.2",
  "104.16.0.131",
  "104.21.0.112",
  "188.244.122.31",
  "104.17.0.126",
  "108.162.194.4",
  "198.41.211.137",
  "66.81.255.3",
  "185.193.29.186",
  "203.32.120.94",
  "104.19.0.131",
  "45.142.120.181",
  "64.68.192.17",
  "104.22.0.123",
  "104.19.128.126",
  "104.19.0.134",
  "203.29.52.64",
  "198.41.211.185",
  "172.64.32.9",
  "185.174.138.16",
  "195.85.23.137",
  "104.17.128.156",
  "45.142.120.123",
  "203.23.106.76",
  "212.110.135.120",
  "104.18.0.170",
  "104.21.0.160",
  "104.18.0.205",
  "203.17.126.121",
  "104.18.128.135",
  "154.83.2.228",
  "185.201.139.62",
  "203.23.106.62",
  "104.21.0.16",
  "104.16.0.147",
  "198.41.209.211",
  "203.23.103.198",
  "45.159.219.52",
  "193.227.99.212",
  "23.227.60.213",
  "104.16.128.21",
  "185.176.26.61",
  "193.227.99.76",
  "104.19.0.158",
  "104.23.128.162",
  "162.159.136.0",
  "203.22.223.167",
  "104.18.0.151",
  "104.16.128.195",
  "212.110.134.34",
  "23.227.60.61",
  "104.20.128.121",
  "104.17.0.168",
  "104.17.0.127",
  "104.16.0.185",
  "193.9.49.91",
  "199.212.90.196",
  "104.23.128.183",
  "185.176.26.31",
  "104.19.128.150",
  "104.16.128.168",
  "162.159.128.26",
  "173.245.49.212",
  "104.20.0.194",
  "104.18.128.143",
  "173.245.49.76",
  "64.68.192.121",
  "104.17.0.196",
  "185.170.166.196",
  "193.9.49.46",
  "104.21.0.168",
  "45.131.211.56",
  "193.227.99.197",
  "104.20.0.163",
  "172.66.1.186",
  "203.24.102.32",
  "23.227.60.153",
  "172.66.3.184",
  "203.55.107.122",
  "104.23.128.114",
  "172.66.45.118",
  "147.78.140.107",
  "104.21.0.136",
  "185.148.106.58",
  "198.41.211.211",
  "104.23.128.158",
  "104.18.0.183",
  "104.23.128.170",
  "104.23.128.186",
  "188.42.88.187",
  "104.21.0.120",
  "23.227.60.47",
  "198.41.211.197",
  "45.8.211.18",
  "104.18.0.15",
  "104.20.0.169",
  "104.22.0.3",
  "185.221.160.198",
  "203.17.126.3",
  "104.17.128.124",
  "104.30.2.95",
  "45.12.31.179",
  "104.18.0.199",
  "198.41.195.0",
  "203.55.107.2",
  "104.18.0.143",
  "104.19.0.188",
  "104.22.0.163",
  "173.245.49.47",
  "185.201.139.155",
  "104.19.0.174",
  "172.66.45.254",
  "198.41.215.118",
  "203.30.189.61",
  "203.34.28.16",
  "198.41.211.136",
  "45.80.111.93",
  "198.41.215.117",
  "104.16.0.181",
  "198.41.208.218",
  "104.20.128.201",
  "141.101.114.255",
  "66.235.200.196",
  "104.16.128.173",
  "104.17.0.156",
  "104.19.128.166",
  "172.66.0.195",
  "193.9.49.136",
  "31.43.179.2",
  "195.85.23.16",
  "203.23.104.137",
  "203.24.108.2",
  "104.18.0.23",
  "104.20.128.193",
  "195.85.59.32",
  "203.17.126.77",
  "45.142.120.121",
  "203.30.190.182",
  "172.67.223.245",
  "154.83.2.62",
  "104.16.0.173",
  "191.101.251.92",
  "45.142.120.78",
  "162.159.40.24",
  "104.19.128.178",
  "172.67.63.253",
  "104.22.0.147",
  "172.66.42.129",
  "104.18.128.134",
  "104.17.128.172",
  "188.114.98.57",
  "205.233.181.92",
  "104.19.0.190",
  "104.18.0.31",
  "104.20.0.177",
  "195.85.23.76",
  "104.19.0.14",
  "104.17.128.188",
  "162.159.247.243",
  "185.170.166.32",
  "104.17.0.124",
  "104.19.0.176",
  "104.21.0.184",
  "104.16.0.148",
  "104.17.128.180",
  "104.17.0.180",
  "23.227.38.63",
  "147.78.140.78",
  "162.159.0.32",
  "173.245.49.196",
  "104.17.0.184",
  "198.41.206.244",
  "173.245.49.228",
  "104.20.0.179",
  "104.19.128.142",
  "193.227.99.196",
  "203.23.104.17",
  "104.20.128.119",
  "104.19.128.144",
  "45.131.208.255",
  "104.16.128.204",
  "194.152.44.107",
  "199.181.197.2",
  "104.20.128.183",
  "104.19.0.178",
  "104.23.128.2",
  "45.142.120.166",
  "45.8.104.1",
  "185.148.106.56",
  "185.221.160.137",
  "185.221.160.77",
  "104.20.0.193",
  "198.41.208.65",
  "104.18.0.185",
  "203.28.8.63",
  "162.159.192.19",
  "154.85.99.94",
  "185.148.106.119",
  "185.221.160.212",
  "203.22.223.1",
  "194.53.53.183",
  "173.245.58.95",
  "141.193.213.196",
  "45.8.105.187",
  "194.53.53.31",
  "185.109.21.196",
  "104.16.128.200",
  "193.227.99.168",
  "104.25.191.251",
  "205.233.181.76",
  "104.24.128.0",
  "205.233.181.181",
  "198.41.212.107",
  "45.159.216.190",
  "45.131.211.180",
  "104.18.128.163",
  "104.19.0.151",
  "173.245.58.33",
  "104.17.128.105",
  "162.251.82.76",
  "203.29.53.1",
  "89.116.250.197",
  "188.114.99.117",
  "104.21.0.88",
  "162.159.12.12",
  "45.131.209.63",
  "191.101.251.1",
  "203.29.54.58",
  "104.20.0.166",
  "104.22.0.188",
  "45.159.216.128",
  "192.65.217.77",
  "185.176.24.2",
  "185.176.24.64",
  "104.24.64.1",
  "212.110.134.97",
  "185.176.26.32",
  "193.9.49.167",
  "190.93.244.3",
  "104.18.128.146",
  "45.142.120.33",
  "203.23.103.153",
  "45.80.111.77",
  "104.17.0.154",
  "198.41.212.62",
  "45.8.104.127",
  "185.238.228.16",
  "45.80.111.184",
  "185.146.173.118",
  "198.41.211.122",
  "31.43.179.139",
  "203.23.106.137",
  "104.19.128.151",
  "162.251.82.136",
  "89.116.250.1",
  "104.23.128.116",
  "104.23.128.159",
  "45.14.174.1",
  "104.19.128.196",
  "104.19.0.10",
  "104.16.0.135",
  "203.55.107.137",
  "104.17.0.129",
  "162.159.24.25",
  "104.23.128.111",
  "104.17.128.184",
  "185.174.138.107",
  "188.42.88.188",
  "199.212.90.107",
  "185.193.28.4",
  "203.32.121.118",
  "104.23.128.119",
  "191.101.251.33",
  "104.16.128.145",
  "108.162.198.253",
  "104.17.0.166",
  "203.23.106.107",
  "104.19.0.140",
  "172.66.43.129",
  "89.116.250.226",
  "188.42.88.249",
  "147.78.140.16",
  "23.227.60.214",
  "104.19.128.19",
  "188.114.97.186",
  "23.227.38.6",
  "104.18.128.133",
  "104.20.0.140",
  "104.18.0.164",
  "191.101.251.76",
  "203.23.103.1",
  "104.31.16.0",
  "203.13.32.226",
  "104.16.0.141",
  "193.227.99.2",
  "104.19.0.148",
  "173.245.49.3",
  "203.13.32.92",
  "203.22.223.106",
  "203.23.104.196",
  "203.24.108.159",
  "104.30.2.64",
  "91.195.110.151",
  "203.30.190.183",
  "66.235.200.63",
  "141.101.120.0",
  "45.8.105.250",
  "188.244.122.213",
  "195.245.221.167",
  "23.227.38.218",
  "104.19.0.136",
  "104.19.0.145",
  "104.17.0.160",
  "104.20.0.172",
  "45.8.106.248",
  "188.244.122.46",
  "104.23.128.109",
  "45.8.106.184",
  "66.235.200.181",
  "104.20.128.17",
  "104.17.128.209",
  "103.160.204.46",
  "203.34.28.2",
  "104.22.0.185",
  "154.83.2.31",
  "104.23.128.126",
  "104.21.0.174",
  "104.17.0.27",
  "104.20.128.204",
  "141.101.122.248",
  "203.28.9.58",
  "185.193.31.182",
  "193.227.99.121",
  "45.142.120.167",
  "147.185.161.16",
  "203.17.126.63",
  "104.16.0.128",
  "104.17.128.132",
  "185.193.28.193",
  "104.16.128.179",
  "198.41.221.247",
  "104.20.128.180",
  "104.16.0.210",
  "104.18.0.208",
  "45.142.120.212",
  "203.29.55.182",
  "104.17.128.19",
  "192.65.217.3",
  "199.181.197.182",
  "104.18.0.166",
  "104.19.0.169",
  "104.17.0.200",
  "172.67.79.253",
  "185.221.160.61",
  "104.31.16.4",
  "188.114.96.190",
  "198.41.217.129",
  "185.193.28.5",
  "185.193.28.71",
  "203.24.108.34",
  "104.20.0.134",
  "104.18.0.165",
  "104.19.128.158",
  "203.24.109.213",
  "104.16.128.135",
  "104.16.0.175",
  "203.23.106.16",
  "104.18.128.20",
  "104.16.0.155",
  "104.16.128.136",
  "198.41.214.187",
  "185.201.139.17",
  "203.23.104.2",
  "104.17.0.164",
  "162.251.82.46",
  "147.78.140.227",
  "195.85.59.181",
  "104.21.0.8",
  "203.29.54.56",
  "104.22.0.12",
  "104.21.0.119",
  "104.254.140.107",
  "104.17.0.163",
  "104.21.0.163",
  "45.133.247.92",
  "195.137.167.138",
  "104.18.128.26",
  "203.24.102.249",
  "104.16.128.19",
  "104.21.0.117",
  "104.19.0.187",
  "172.64.192.2",
  "193.227.99.211",
  "104.20.128.135",
  "104.23.128.137",
  "104.21.0.187",
  "31.43.179.181",
  "104.18.0.186",
  "198.41.223.116",
  "104.17.0.192",
  "104.17.128.223",
  "195.245.221.166",
  "66.81.255.106",
  "203.32.120.66",
  "203.34.28.1",
  "91.195.110.92",
  "104.21.0.193",
  "104.18.128.164",
  "104.22.0.157",
  "104.17.0.122",
  "104.16.128.163",
  "104.16.128.174",
  "185.146.173.86",
  "185.174.138.136",
  "185.176.26.226",
  "104.19.0.147",
  "203.24.108.94",
  "31.43.179.62",
  "104.21.0.147",
  "104.17.0.15",
  "104.20.128.194",
  "104.18.0.178",
  "170.114.45.168",
  "104.22.0.193",
  "45.133.247.155",
  "23.227.60.196",
  "66.235.200.211",
  "104.19.128.127",
  "104.20.0.154",
  "104.16.128.45",
  "91.195.110.212",
  "104.18.128.30",
  "104.18.0.153",
  "162.159.136.20",
  "23.227.38.158",
  "104.16.128.127",
  "185.193.28.254",
  "66.235.200.197",
  "104.22.0.7",
  "104.17.128.135",
  "80.94.83.109",
  "23.227.60.32",
  "104.17.128.133",
  "104.23.128.122",
  "104.18.128.190",
  "104.20.128.198",
  "104.19.128.120",
  "104.19.0.128",
  "104.20.128.158",
  "104.18.0.191",
  "104.20.0.143",
  "104.16.128.209",
  "104.20.128.123",
  "104.17.0.158",
  "147.185.161.77",
  "64.68.192.123",
  "203.24.102.219",
  "104.20.0.162",
  "173.245.49.151",
  "203.23.106.227",
  "64.68.192.182",
  "185.238.228.91",
  "104.17.128.34",
  "104.17.0.128",
  "104.19.0.152",
  "104.22.0.170",
  "104.19.128.209",
  "203.29.54.245",
  "104.20.0.14",
  "104.20.128.19",
  "104.19.0.141",
  "104.23.128.139",
  "104.16.0.197",
  "104.19.0.193",
  "104.24.191.255",
  "185.174.138.1",
  "203.22.223.226",
  "104.18.0.16",
  "141.101.123.249",
  "31.43.179.61",
  "45.142.120.63",
  "203.22.223.227",
  "203.23.104.197",
  "103.21.244.139",
  "104.17.128.30",
  "185.146.173.211",
  "91.195.110.3",
  "170.114.45.136",
  "203.22.223.107",
  "104.23.128.174",
  "172.66.3.57",
  "147.78.140.62",
  "104.19.0.139",
  "104.18.0.192",
  "198.41.216.131",
  "45.8.105.0",
  "185.174.138.47",
  "185.176.24.228",
  "104.22.0.115",
  "104.23.128.181",
  "203.22.223.196",
  "203.24.103.55",
  "104.21.0.127",
  "104.23.128.133",
  "203.24.108.95",
  "203.28.9.184",
  "104.16.128.150",
  "104.17.0.177",
  "45.12.30.65",
  "170.114.45.182",
  "203.23.103.197",
  "104.22.0.191",
  "190.93.246.254",
  "147.185.161.166",
  "104.19.128.130",
  "104.16.0.190",
  "45.14.174.211",
  "185.176.26.1",
  "104.22.0.139",
  "104.16.128.202",
  "31.43.179.166",
  "185.176.24.212",
  "104.17.0.19",
  "104.23.128.141",
  "80.94.83.31",
  "170.114.45.197",
  "195.85.59.16",
  "104.20.128.125",
  "104.16.0.144",
  "104.17.128.192",
  "104.17.128.131",
  "198.41.194.2",
  "45.133.247.46",
  "203.32.121.181",
  "173.245.59.89",
  "203.34.80.92",
  "198.41.194.3",
  "203.28.8.126",
  "103.21.244.155",
  "104.20.0.136",
  "173.245.58.63",
  "104.16.0.184",
  "45.133.247.107",
  "104.16.0.161",
  "104.18.0.206",
  "66.81.247.137",
  "103.160.204.211",
  "185.174.138.106",
  "104.20.0.123",
  "104.18.0.184",
  "141.193.213.228",
  "198.41.208.4",
  "188.42.88.219",
  "104.16.128.186",
  "173.245.49.17",
  "64.68.192.181",
  "104.23.128.12",
  "203.29.55.116",
  "104.20.0.149",
  "104.21.0.190",
  "188.244.122.167",
  "104.16.128.151",
  "104.17.0.121",
  "195.245.221.78",
  "195.137.167.32",
  "104.21.0.14",
  "104.18.128.154",
  "104.25.127.252",
  "199.181.197.92",
  "89.116.250.2",
  "104.17.0.147",
  "188.42.89.148",
  "104.18.128.150",
  "162.251.82.197",
  "147.185.161.197",
  "104.20.0.159",
  "104.19.0.194",
  "172.66.1.2",
  "185.148.106.250",
  "203.28.9.27",
  "104.22.0.172",
  "170.114.45.212",
  "104.18.0.144",
  "104.22.0.181",
  "172.67.0.2",
  "198.41.208.193",
  "104.25.63.252",
  "104.23.128.136",
  "185.135.9.182",
  "185.162.230.124",
  "203.28.8.2",
  "104.19.0.18",
  "104.19.0.144",
  "104.17.0.175",
  "104.19.128.204",
  "31.43.179.123",
  "104.20.0.7",
  "104.22.0.109",
  "104.16.0.170",
  "185.221.160.17",
  "185.170.166.109",
  "104.20.0.153",
  "198.41.212.121",
  "104.22.0.128",
  "173.245.58.249",
  "45.14.174.166",
  "45.142.120.48",
  "104.17.0.190",
  "104.24.255.253",
  "185.193.30.60",
  "23.227.38.188",
  "104.23.128.121",
  "203.23.103.123",
  "104.18.0.146",
  "147.78.140.63",
  "185.162.230.247",
  "185.238.228.78",
  "188.42.88.218",
  "104.19.0.186",
  "45.12.31.210",
  "185.193.29.188",
  "203.13.32.227",
  "104.23.128.150",
  "104.19.0.179",
  "45.14.174.151",
  "103.160.204.93",
  "104.20.0.1",
  "198.41.221.246",
  "191.101.251.197",
  "203.34.80.167",
  "104.20.128.140",
  "104.20.128.142",
  "173.245.59.117",
  "104.16.0.15",
  "91.195.110.107",
  "162.251.82.211",
  "203.17.126.17",
  "203.55.107.47",
  "185.146.173.179",
  "198.41.209.86",
  "104.254.140.167",
  "45.12.31.118",
  "195.85.59.137",
  "104.16.128.134",
  "203.23.106.182",
  "185.201.139.166",
  "203.32.120.158",
  "45.8.211.3",
  "104.21.0.121",
  "104.23.128.185",
  "185.162.230.184",
  "195.85.23.46",
  "203.28.8.220",
  "104.16.0.45",
  "154.83.2.46",
  "193.9.49.108",
  "203.22.223.47",
  "203.23.104.167",
  "104.20.0.168",
  "160.153.0.92",
  "195.245.221.5",
  "203.34.28.136",
  "45.14.174.152",
  "195.85.23.228",
  "193.227.99.122",
  "104.16.0.191",
  "104.22.0.108",
  "108.162.193.3",
  "45.159.216.1",
  "154.83.2.137",
  "203.24.103.25",
  "104.18.128.12",
  "203.17.126.123",
  "203.23.104.1",
  "45.8.106.58",
  "91.195.110.2",
  "199.212.90.76",
  "212.110.134.96",
  "104.20.128.144",
  "45.80.111.167",
  "45.142.120.197",
  "80.94.83.136",
  "91.195.110.227",
  "203.13.32.91",
  "66.235.200.137",
  "185.146.173.55",
  "185.176.24.196",
  "191.101.251.2",
  "199.181.197.62",
  "203.23.104.46",
  "203.22.223.17",
  "162.159.152.24",
  "154.85.99.211",
  "154.83.2.166",
  "104.17.128.146",
  "203.30.191.52",
  "104.20.128.134",
  "104.19.0.180",
  "185.201.139.196",
  "45.12.31.150",
  "80.94.83.122",
  "170.114.45.166",
  "185.109.21.93",
  "104.18.0.17",
  "172.67.111.250",
  "195.85.59.226",
  "203.32.120.126",
  "203.34.28.92",
  "80.94.83.48",
  "203.23.103.167",
  "80.94.83.196",
  "147.78.140.181",
  "185.135.9.106",
  "185.193.29.128",
  "104.17.0.183",
  "203.24.102.192",
  "188.114.97.125",
  "45.159.216.127",
  "162.251.82.62",
  "192.65.217.108",
  "104.16.0.152",
  "162.159.44.18",
  "45.159.216.64",
  "185.170.166.168",
  "212.110.135.212",
  "89.116.250.122",
  "103.160.204.198",
  "203.23.103.136",
  "162.251.82.31",
  "66.81.255.17",
  "104.22.0.190",
  "45.131.210.59",
  "147.185.161.182",
  "185.176.26.121",
  "203.29.53.253",
  "103.21.244.167",
  "104.16.0.149",
  "104.234.158.153",
  "104.17.0.13",
  "185.170.166.151",
  "192.65.217.78",
  "203.29.52.2",
  "104.16.128.149",
  "185.109.21.227",
  "195.245.221.46",
  "203.28.8.250",
  "104.20.128.167",
  "170.114.45.63",
  "198.41.212.77",
  "203.17.126.2",
  "104.22.0.153",
  "159.246.55.122",
  "185.162.230.56",
  "31.43.179.16",
  "64.68.192.61",
  "185.162.231.178",
  "89.116.250.182",
  "104.20.128.6",
  "104.18.0.180",
  "141.193.213.108",
  "185.176.26.47",
  "203.13.32.46",
  "203.23.106.211",
  "195.85.59.136",
  "104.16.0.189",
  "45.12.31.57",
  "147.78.140.212",
  "104.18.0.147",
  "193.9.49.196",
  "185.72.49.91",
  "185.176.26.136",
  "45.159.218.245",
  "193.9.49.151",
  "203.30.188.254",
  "66.235.200.227",
  "185.135.9.170",
  "45.80.111.121",
  "188.114.97.250",
  "203.55.107.181",
  "185.162.228.66",
  "188.114.98.121",
  "185.170.166.76",
  "104.20.128.124",
  "45.80.111.76",
  "45.133.247.106",
  "104.22.0.122",
  "198.41.208.63",
  "108.165.216.32",
  "193.227.99.17",
  "203.34.80.166",
  "45.80.111.151",
  "170.114.45.137",
  "203.55.107.107",
  "170.114.46.91",
  "173.245.59.179",
  "104.234.158.17",
  "185.135.9.18",
  "194.53.53.61",
  "104.16.128.130",
  "89.116.250.211",
  "198.41.214.218",
  "198.41.217.126",
  "45.133.247.226",
  "185.148.106.182",
  "104.18.128.32",
  "45.80.111.107",
  "193.227.99.182",
  "104.20.0.160",
  "91.195.110.196",
  "168.100.6.167",
  "104.20.0.141",
  "104.18.128.180",
  "141.193.213.167",
  "104.19.0.9",
  "104.18.128.37",
  "23.227.60.4",
  "104.17.0.135",
  "168.100.6.155",
  "198.41.215.55",
  "188.114.96.3",
  "198.41.222.119",
  "104.254.140.226",
  "172.66.2.57",
  "185.170.166.136",
  "194.53.53.211",
  "108.165.216.47",
  "104.17.128.48",
  "104.20.128.148",
  "173.245.49.121",
  "108.165.216.137",
  "198.41.211.226",
  "147.78.140.138",
  "191.101.251.212",
  "170.114.45.16",
  "104.18.128.96",
  "104.16.0.21",
  "185.221.160.92",
  "45.8.211.122",
  "104.22.0.91",
  "198.41.208.220",
  "198.41.222.117",
  "104.17.128.16",
  "198.41.197.253",
  "45.14.174.16",
  "108.162.198.1",
  "104.17.128.193",
  "104.17.128.219",
  "170.114.45.152",
  "45.8.105.124",
  "185.176.26.212",
  "104.254.140.181",
  "168.100.6.77",
  "45.8.211.166",
  "162.159.60.12",
  "198.41.212.167",
  "45.142.120.136",
  "173.245.58.1",
  "104.23.128.0",
  "104.22.0.158",
  "104.20.0.183",
  "104.19.128.28",
  "104.20.0.178",
  "104.21.0.91",
  "198.41.208.38",
  "170.114.46.1",
  "170.114.46.61",
  "104.21.0.178",
  "203.24.103.88",
  "173.245.49.167",
  "159.112.235.106",
  "104.16.0.157",
  "104.21.0.162",
  "91.195.110.123",
  "147.78.140.92",
  "185.238.228.166",
  "199.181.197.153",
  "203.32.121.87",
  "104.16.0.182",
  "198.41.209.123",
  "45.8.211.77",
  "185.174.138.61",
  "154.83.2.106",
  "203.34.28.181",
  "104.18.0.173",
  "104.20.128.122",
  "66.235.200.168",
  "205.233.181.151",
  "45.159.216.65",
  "185.193.29.252",
  "104.19.128.137",
  "104.17.128.171",
  "104.16.0.200",
  "104.21.0.18",
  "104.18.0.196",
  "104.22.0.143",
  "192.65.217.136",
  "104.23.128.149",
  "45.14.174.196",
  "170.114.46.109",
  "104.17.0.142",
  "104.21.0.134",
  "185.109.21.76",
  "23.227.39.86",
  "45.131.208.130",
  "80.94.83.94",
  "159.246.55.153",
  "64.68.192.16",
  "170.114.45.227",
  "104.18.0.182",
  "104.21.0.177",
  "104.16.128.146",
  "104.23.128.187",
  "203.30.188.127",
  "172.64.95.254",
  "168.100.6.91",
  "203.24.102.64",
  "203.22.223.183",
  "104.18.0.157",
  "198.41.211.61",
  "203.55.107.91",
  "159.112.235.121",
  "162.159.36.19",
  "104.23.128.154",
  "45.8.104.64",
  "159.112.235.137",
  "188.244.122.153",
  "185.176.24.181",
  "104.19.128.129",
  "104.17.0.143",
  "104.18.128.176",
  "194.152.44.211",
  "104.16.0.123",
  "104.18.0.195",
  "192.65.217.32",
  "203.29.52.4",
  "172.64.160.0",
  "162.159.24.24",
  "195.85.59.211",
  "203.23.106.32",
  "104.18.128.162",
  "104.31.16.7",
  "154.85.99.169",
  "104.19.128.8",
  "104.16.0.142",
  "195.85.59.121",
  "104.31.16.11",
  "45.8.104.193",
  "104.20.128.146",
  "160.153.0.166",
  "23.227.38.125",
  "104.18.128.157",
  "104.18.0.207",
  "198.41.215.25",
  "185.59.218.18",
  "104.20.0.37",
  "185.170.166.64",
  "64.68.192.137",
  "104.18.128.122",
  "104.16.0.172",
  "198.41.214.63",
  "104.20.128.160",
  "104.17.0.172",
  "104.19.0.22",
  "104.20.128.128",
  "170.114.46.167",
  "185.135.9.122",
  "104.16.128.147",
  "104.22.0.14",
  "104.17.128.186",
  "104.18.128.166",
  "45.8.104.3",
  "203.34.28.108",
  "205.233.181.214",
  "104.19.0.150",
  "203.32.121.212",
  "104.17.0.144",
  "104.20.0.205",
  "185.176.24.106",
  "104.22.0.6",
  "104.19.0.153",
  "104.16.128.207",
  "185.238.228.46",
  "203.29.53.62",
  "66.235.200.16",
  "104.19.128.188",
  "185.238.228.106",
  "185.148.105.127",
  "104.17.128.14",
  "104.254.140.1",
  "64.68.192.93",
  "45.14.174.181",
  "159.246.55.211",
  "205.233.181.5",
  "104.17.0.102",
  "66.81.247.18",
  "64.68.192.2",
  "104.16.0.202",
  "162.159.16.24",
  "45.142.120.4",
  "66.81.255.167",
  "108.162.194.255",
  "104.19.0.177",
  "203.23.104.47",
  "104.17.0.131",
  "104.17.0.136",
  "104.21.0.179",
  "91.195.110.108",
  "194.152.44.169",
  "198.41.211.16",
  "66.81.255.61",
  "104.17.128.136",
  "104.16.128.222",
  "104.234.158.137",
  "23.227.39.119",
  "104.18.128.178",
  "104.18.128.123",
  "104.19.128.180",
  "185.174.138.91",
  "173.245.58.218",
  "198.41.195.253",
  "198.41.211.121",
  "104.234.158.121",
  "185.238.228.167",
  "190.93.247.251",
  "198.41.217.254",
  "192.65.217.46",
  "31.43.179.47",
  "188.42.89.180",
  "104.16.0.186",
  "192.65.217.151",
  "104.20.128.151",
  "104.19.0.120",
  "104.19.128.206",
  "104.16.128.177",
  "188.114.98.182",
  "45.12.31.25",
  "104.17.128.149",
  "104.23.128.160",
  "104.17.128.215",
  "31.43.179.80",
  "185.174.138.213",
  "203.28.8.254",
  "104.17.0.8",
  "104.22.0.177",
  "104.17.0.195",
  "104.16.128.121",
  "104.23.128.175",
  "198.41.196.255",
  "45.131.209.253",
  "104.18.0.128",
  "104.17.0.165",
  "23.227.39.25",
  "104.19.128.132",
  "104.20.0.155",
  "45.159.218.119",
  "66.81.255.32",
  "203.23.104.213",
  "104.17.128.130",
  "104.16.0.166",
  "104.24.0.1",
  "203.34.80.136",
  "104.23.128.14",
  "104.20.128.118",
  "195.85.59.61",
  "203.28.9.215",
  "185.72.49.212",
  "185.174.138.17",
  "104.19.128.118",
  "104.23.128.184",
  "104.17.0.199",
  "172.66.41.127",
  "185.72.49.77",
  "195.245.221.185",
  "198.41.209.26",
  "185.109.21.197",
  "195.245.221.94",
  "23.227.39.212",
  "104.16.0.129",
  "104.16.128.170",
  "104.20.0.174",
  "203.34.80.79",
  "104.20.128.172",
  "104.22.0.187",
  "203.22.223.31",
  "104.20.0.12",
  "104.19.128.172",
  "104.30.2.219",
  "188.244.122.181",
  "104.22.0.176",
  "104.18.128.199",
  "185.221.160.106",
  "104.16.0.198",
  "154.83.2.77",
  "203.24.108.190",
  "104.20.0.125",
  "172.64.128.42",
  "185.193.28.55",
  "162.159.240.3",
  "172.67.64.41",
  "45.131.209.50",
  "203.30.190.2",
  "188.114.97.160",
  "185.193.29.164",
  "203.24.103.75",
  "172.66.44.252",
  "172.64.128.51",
  "172.66.40.23",
  "185.201.139.38",
  "203.24.102.140",
  "203.29.52.23",
  "172.64.128.50",
  "162.159.192.6",
  "172.66.44.60",
  "45.159.218.29",
  "172.64.128.19",
  "203.34.80.48",
  "188.114.96.24",
  "203.24.103.77",
  "162.159.240.14",
  "172.64.192.47",
  "185.193.29.37",
  "190.93.244.56",
  "198.41.223.1",
  "172.64.128.55",
  "172.66.0.41",
  "185.193.31.34",
  "172.66.1.56",
  "198.41.222.55",
  "172.64.192.42",
  "203.30.189.38",
  "198.41.216.9",
  "203.30.188.60",
  "212.110.134.204",
  "172.64.192.66",
  "203.30.189.33",
  "141.101.120.47",
  "162.159.128.24",
  "172.66.41.33",
  "172.64.192.43",
  "198.41.215.155",
  "185.193.29.179",
  "203.55.107.164",
  "172.64.192.26",
  "203.29.53.166",
  "141.101.114.36",
  "172.66.44.64",
  "172.67.96.1",
  "172.67.96.41",
  "141.101.122.51",
  "172.66.43.58",
  "172.67.0.58",
  "198.41.221.41",
  "203.34.80.230",
  "172.66.3.142",
  "172.66.44.59",
  "190.93.246.35",
  "203.24.108.11",
  "172.66.44.31",
  "172.66.46.69",
  "162.159.128.3",
  "172.64.128.58",
  "172.66.40.54",
  "198.41.221.252",
  "185.72.49.70",
  "172.64.128.5",
  "172.67.64.29",
  "190.93.246.34",
  "172.67.128.33",
  "172.66.3.165",
  "172.67.160.12",
  "203.17.126.65",
  "203.34.80.190",
  "162.159.240.2",
  "172.67.96.36",
  "203.24.109.16",
  "154.84.175.141",
  "190.93.246.38",
  "45.131.209.7",
  "45.131.209.34",
  "162.159.128.6",
  "172.64.128.63",
  "172.67.127.254",
  "190.93.245.255",
  "185.109.21.233",
  "203.28.9.153",
  "104.30.2.194",
  "141.101.114.46",
  "172.66.1.26",
  "172.66.47.7",
  "141.101.120.2",
  "172.67.224.59",
  "172.66.46.6",
  "172.67.192.32",
  "172.67.160.58",
  "212.110.134.64",
  "172.66.41.4",
  "172.66.42.28",
  "162.159.240.30",
  "172.64.192.8",
  "188.114.98.31",
  "162.159.160.2",
  "190.93.245.254",
  "162.159.40.47",
  "172.67.160.3",
  "104.24.0.22",
  "172.64.128.66",
  "172.64.128.2",
  "104.21.0.59",
  "104.24.0.14",
  "172.66.42.85",
  "172.67.192.24",
  "172.66.47.55",
  "162.159.192.26",
  "172.66.3.155",
  "104.22.0.0",
  "172.66.1.57",
  "172.66.3.179",
  "198.41.221.254",
  "141.101.114.35",
  "141.101.114.48",
  "141.101.122.38",
  "172.66.46.54",
  "172.66.2.177",
  "104.24.128.54",
  "172.66.3.177",
  "141.101.120.25",
  "108.162.192.48",
  "172.64.192.48",
  "203.23.103.190",
  "66.235.200.127",
  "104.24.128.32",
  "104.18.0.20",
  "203.30.189.40",
  "104.21.0.51",
  "172.64.128.68",
  "172.66.3.31",
  "188.114.98.190",
  "212.110.135.1",
  "162.159.160.21",
  "205.233.181.11",
  "141.101.122.10",
  "172.67.192.23",
  "198.41.222.255",
  "141.101.122.30",
  "104.18.0.44",
  "162.159.240.1",
  "104.16.0.6",
  "108.162.192.6",
  "172.66.42.11",
  "172.66.40.40",
  "198.41.220.7",
  "104.16.0.62",
  "104.24.128.7",
  "104.24.0.30",
  "172.66.45.30",
  "104.25.0.15",
  "141.101.122.16",
  "172.67.224.6",
  "198.41.223.3",
  "141.101.122.22",
  "172.66.40.50",
  "141.101.122.44",
  "141.101.122.49",
  "172.67.64.47",
  "64.68.192.226",
  "172.67.192.30",
  "198.41.222.252",
  "172.66.2.153",
  "172.67.192.17",
  "172.64.128.21",
  "104.24.128.22",
  "172.66.3.37",
  "172.67.192.42",
  "205.233.181.109",
  "108.162.196.3",
  "162.159.128.1",
  "172.66.42.47",
  "172.67.224.62",
  "23.227.60.6",
  "104.24.128.30",
  "172.66.46.254",
  "203.29.52.21",
  "172.64.128.48",
  "104.18.0.8",
  "162.159.16.5",
  "104.18.0.41",
  "172.64.192.1",
  "104.22.0.32",
  "203.23.104.171",
  "172.66.43.3",
  "203.17.126.110",
  "172.66.44.40",
  "172.67.96.42",
  "162.159.0.10",
  "185.193.29.44",
  "141.101.114.42",
  "203.28.9.217",
  "172.64.192.73",
  "172.66.41.9",
  "104.25.0.21",
  "188.114.98.169",
  "198.41.222.63",
  "23.227.39.76",
  "172.66.44.52",
  "172.66.46.14",
  "172.66.44.58",
  "198.41.221.49",
  "185.193.30.179",
  "104.30.2.65",
  "172.64.128.28",
  "162.159.192.34",
  "64.68.192.39",
  "172.67.96.43",
  "198.41.222.6",
  "203.55.107.140",
  "172.67.128.24",
  "172.67.128.65",
  "185.193.29.59",
  "203.24.109.14",
  "141.101.123.251",
  "190.93.244.1",
  "190.93.246.61",
  "203.32.120.131",
  "162.159.8.31",
  "190.93.246.37",
  "104.25.0.23",
  "104.25.128.39",
  "185.72.49.96",
  "203.34.28.187",
  "172.67.128.13",
  "162.159.240.15",
  "162.159.128.19",
  "172.66.1.33",
  "172.64.128.67",
  "172.66.0.192",
  "108.162.194.50",
  "194.152.44.224",
  "203.23.103.125",
  "203.30.190.127",
  "172.67.128.12",
  "172.66.2.23",
  "194.36.55.190",
  "172.67.0.66",
  "185.148.106.156",
  "104.18.0.12",
  "203.22.223.225",
  "203.30.191.24",
  "172.67.96.24",
  "185.193.31.39",
  "185.193.30.164",
  "162.159.160.41",
  "172.64.128.39",
  "172.66.1.182",
  "190.93.247.254",
  "162.159.160.16",
  "104.20.0.10",
  "185.238.228.79",
  "198.41.222.254",
  "193.9.49.48",
  "104.20.0.46",
  "198.41.222.53",
  "141.101.122.48",
  "141.101.122.32",
  "212.110.135.68",
  "160.153.0.136",
  "108.162.198.6",
  "172.64.128.70",
  "203.30.191.43",
  "104.30.2.71",
  "172.67.128.1",
  "203.32.121.22",
  "190.93.246.2",
  "172.66.3.168",
  "172.66.1.65",
  "190.93.244.13",
  "104.19.0.13",
  "172.67.223.254",
  "188.42.88.202",
  "203.24.108.3",
  "203.34.80.194",
  "104.26.0.16",
  "141.101.114.18",
  "212.110.134.142",
  "162.159.128.21",
  "190.93.244.16",
  "172.67.192.41",
  "141.101.122.8",
  "172.66.45.53",
  "198.41.221.8",
  "91.195.110.187",
  "172.67.0.36",
  "108.162.192.11",
  "172.66.1.185",
  "198.41.220.16",
  "141.101.120.44",
  "23.227.38.212",
  "104.22.0.15",
  "194.152.44.228",
  "23.227.60.97",
  "205.233.181.1",
  "162.159.192.18",
  "172.66.43.87",
  "185.193.31.127",
  "104.24.0.18",
  "188.114.96.143",
  "190.93.244.0",
  "172.67.64.21",
  "185.193.31.47",
  "104.26.0.11",
  "162.159.160.19",
  "162.159.192.31",
  "162.251.82.69",
  "104.17.0.49",
  "203.34.28.189",
  "172.67.224.23",
  "172.67.32.40",
  "162.251.82.5",
  "185.193.30.37",
  "198.41.216.5",
  "104.24.128.16",
  "162.159.8.33",
  "103.21.244.96",
  "172.66.45.39",
  "141.101.122.40",
  "203.29.55.44",
  "108.162.194.22",
  "162.159.192.37",
  "172.66.3.43",
  "108.162.192.46",
  "104.24.0.28",
  "141.101.122.2",
  "108.162.196.16",
  "172.66.41.90",
  "141.101.122.20",
  "45.131.211.33",
  "203.22.223.129",
  "203.29.54.24",
  "203.24.103.20",
  "185.193.29.6",
  "203.30.188.16",
  "172.67.160.27",
  "203.28.9.26",
  "190.93.244.37",
  "108.162.196.4",
  "104.30.2.74",
  "162.159.192.27",
  "162.251.82.95",
  "172.66.42.35",
  "185.193.31.125",
  "162.159.240.4",
  "198.41.220.21",
  "104.17.0.25",
  "104.24.128.10",
  "141.101.114.41",
  "190.93.244.35",
  "108.162.198.47",
  "198.41.221.4",
  "172.66.45.68",
  "203.28.9.148",
  "203.29.52.147",
  "23.227.38.140",
  "45.87.175.46",
  "172.66.3.134",
  "172.66.1.171",
  "188.114.97.162",
  "203.30.191.127",
  "190.93.244.60",
];
