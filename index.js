
const { WebSocketServer } = require('ws');
const net = require('net');
const http = require('http');
const validator = require('./validator');
const _server = require('./server');
const event = require('./event'); 


function config(data) {
    global.log = function (...mess) {
        if (data.debug) {
            console.log(...mess)
        }
    }
    validator.init(data.users)
    if (data.network == "ws") {
        const wss = new WebSocketServer({ port: data.port, host: data.address });
        wss.on('connection', function connection(ws) {
            _server.connect(ws, ws._socket.remoteAddress)
            ws.write = ws.send
            ws.on("close", _server.close)
            ws.on('message', _server.message);
        });
        log("ws server is running on port", data.port)

    } else if (data.network == "tcp") {
        var server = net.createServer(function (localsocket) {
            _server.connect(localsocket, localsocket.remoteAddress)
            localsocket.on("error", function () { })
            localsocket.on("close", _server.close)
            localsocket.on('data', _server.message);
        });
        server.listen(data.port, data.address);
        log("tcp server is running on port", data.port)

    } else if (data.network == "http") {
        const HTTP_HEADER = "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: keep-alive\r\n\r\n";
        var server = net.createServer(function (localsocket) {
            _server.connect(localsocket, localsocket.remoteAddress)
            localsocket.on("error", function () { })
            // localsocket.on("close", _server.close)
            localsocket.on('data', function (buffer) {
                console.log(buffer + "")
                var indhttp = buffer.indexOf('\r\n\r\n')
                if (indhttp != -1 && (buffer.subarray(0, 3) == "GET" || buffer.subarray(0, 4) == "POST")) {
                    this.write(HTTP_HEADER)
                    if (buffer.length != indhttp + 4) {
                        return _server.message.call(this, buffer.subarray(indhttp + 4))
                    } else {
                        return
                    }
                } else {
                    _server.message.call(this, buffer)
                }
            });
        });
        server.listen(data.port, data.address);
        log("http server is running on port", data.port)

    } else if (data.network == "httpAlt") {
        const HTTP_HEADER = "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: keep-alive\r\n\r\n";
        var server = http.createServer()
        server.on('connection', function (localsocket) {
            _server.connect(localsocket, localsocket.remoteAddress)
            localsocket.on("error", function () { })
            localsocket.on('data', function (buffer) {
                if (buffer.includes("keep-alive")) {
                    buffer.write(replace(buffer, "keep-alive", "close") + "", 0)
                } 
                var indhttp = buffer.indexOf('\r\n\r\n')
                if (indhttp != -1 && (buffer.subarray(0, 3) == "GET" || buffer.subarray(0, 4) == "POST")) {
                    this.write(HTTP_HEADER)
                    if (buffer.length != indhttp + 4) {
                        return _server.message.call(this, buffer.subarray(indhttp + 4))
                    } else {
                        return
                    }
                } else {
                    _server.message.call(this, buffer)
                }
            });
        })
        server.listen(data.port, data.address);
        log("http2 server is running on port", data.port)
    }
    return event;
}

function replace(buf, a, b) {
    if (!Buffer.isBuffer(buf)) buf = Buffer.from(buf);
    const idx = buf.indexOf(a);
    if (idx === -1) return buf;
    if (!Buffer.isBuffer(b)) b = Buffer.from(b);

    const before = buf.slice(0, idx);
    const after = replace(buf.slice(idx + a.length), a, b);
    const len = idx + b.length + after.length;
    return Buffer.concat([before, b, after], len);
}
module.exports = {
    config,
} 
