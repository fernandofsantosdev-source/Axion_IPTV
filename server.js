"use strict";

var dns = require("dns");
var fs = require("fs");
var http = require("http");
var https = require("https");
var net = require("net");
var path = require("path");
var ROOT = __dirname;
var MAX_REQUEST_BYTES = 8192;
var MAX_PLAYLIST_BYTES = 8 * 1024 * 1024;
var REQUEST_TIMEOUT_MS = 15000;
var MAX_REDIRECTS = 4;

function isPublicAddress(address) {
  var normalized = address.split("%")[0].toLowerCase();
  var family = net.isIP(normalized);
  var octets;
  var first;
  var second;
  var third;

  if (family === 4) {
    octets = normalized.split(".").map(Number);
    first = octets[0];
    second = octets[1];
    third = octets[2];
    if (first === 0 || first === 10 || first === 127 || first >= 224 ||
        (first === 100 && second >= 64 && second <= 127) ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && (second === 0 || second === 168)) ||
        (first === 192 && second === 88 && third === 99) ||
        (first === 198 && (second === 18 || second === 19 || second === 51)) ||
        (first === 203 && second === 0 && third === 113)) {
      return false;
    }
    return true;
  }

  if (family !== 6) {
    return false;
  }

  first = parseInt(normalized.split(":")[0] || "0", 16);
  second = parseInt(normalized.split(":")[1] || "0", 16);
  return first >= 0x2000 && first <= 0x3fff &&
    !(first === 0x2001 && (second === 0 || second === 0x0db8)) &&
    !(first === 0x2002) &&
    !(first === 0x3fff && second <= 0x0fff);
}

function resolvePublicHost(hostname, callback) {
  var normalized = hostname.toLowerCase().replace(/\.$/, "");
  var address = normalized.replace(/^\[|\]$/g, "");
  var family = net.isIP(address);
  if (family) {
    if (!isPublicAddress(address)) {
      callback(new Error("O endereço da playlist aponta para uma rede privada e não é permitido."));
      return;
    }
    callback(null, { address: address, family: family });
    return;
  }
  if (normalized === "localhost" || /\.localhost$/.test(normalized) ||
      /\.local$/.test(normalized)) {
    callback(new Error("O endereço da playlist aponta para uma rede privada e não é permitido."));
    return;
  }

  dns.lookup(normalized, { all: true, verbatim: true }, function (error, addresses) {
    var i;
    if (error || !addresses || !addresses.length) {
      callback(new Error("Não foi possível localizar o servidor da playlist."));
      return;
    }
    for (i = 0; i < addresses.length; i += 1) {
      if (!isPublicAddress(addresses[i].address)) {
        callback(new Error("O endereço da playlist aponta para uma rede privada e não é permitido."));
        return;
      }
    }
    callback(null, addresses[0]);
  });
}

function fetchPlaylist(urlValue, redirectCount, callback) {
  var target;
  var transport;

  try {
    target = new URL(urlValue);
  } catch (error) {
    callback(new Error("Informe uma URL HTTP ou HTTPS válida para a playlist."));
    return;
  }

  if ((target.protocol !== "http:" && target.protocol !== "https:") ||
      target.username || target.password) {
    callback(new Error("A playlist precisa usar HTTP ou HTTPS e não pode ter credenciais no domínio."));
    return;
  }
  if (redirectCount > MAX_REDIRECTS) {
    callback(new Error("O servidor da playlist redirecionou vezes demais."));
    return;
  }

  resolvePublicHost(target.hostname, function (lookupError, resolvedAddress) {
    var completed = false;
    var options;
    var request;

    function finish(error, body) {
      if (completed) {
        return;
      }
      completed = true;
      callback(error, body);
    }

    if (lookupError) {
      finish(lookupError);
      return;
    }

    transport = target.protocol === "https:" ? https : http;
    options = {
      hostname: target.hostname,
      port: target.port || (target.protocol === "https:" ? 443 : 80),
      method: "GET",
      path: target.pathname + target.search,
      headers: {
        Accept: "application/x-mpegURL, audio/x-mpegurl, text/plain, */*",
        "User-Agent": "AXION-Playlist-Proxy/1.0"
      },
      lookup: function (hostname, lookupOptions, lookupCallback) {
        if (lookupOptions && lookupOptions.all) {
          lookupCallback(null, [resolvedAddress]);
        } else {
          lookupCallback(null, resolvedAddress.address, resolvedAddress.family);
        }
      }
    };
    options.hostname = target.hostname.replace(/^\[|\]$/g, "");
    if (target.protocol === "https:" && net.isIP(options.hostname) === 0) {
      options.servername = options.hostname;
    }

    request = transport.request(options, function (response) {
      var chunks = [];
      var size = 0;
      var location = response.headers.location;

      if (response.statusCode >= 300 && response.statusCode < 400 && location) {
        response.resume();
        fetchPlaylist(new URL(location, target).toString(), redirectCount + 1, function (error, body) {
          finish(error, body);
        });
        return;
      }
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        finish(new Error("O servidor da playlist respondeu HTTP " + response.statusCode + "."));
        return;
      }

      response.on("data", function (chunk) {
        size += chunk.length;
        if (size > MAX_PLAYLIST_BYTES) {
          response.destroy();
          request.destroy();
          finish(new Error("A playlist excede o limite de 8 MB."));
          return;
        }
        chunks.push(chunk);
      });
      response.on("end", function () {
        finish(null, Buffer.concat(chunks).toString("utf8"));
      });
      response.on("error", function () {
        finish(new Error("A conexão foi interrompida durante o download da playlist."));
      });
    });

    request.setTimeout(REQUEST_TIMEOUT_MS, function () {
      request.destroy(new Error("A conexão com o servidor da playlist expirou."));
    });
    request.on("error", function (error) {
      finish(error.message.indexOf("excede o limite") !== -1 ||
        error.message.indexOf("expirou") !== -1 ? error :
        new Error("Não foi possível conectar ao servidor da playlist."));
    });
    request.end();
  });
}

function sendJson(response, status, value) {
  response.writeHead(status, {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(JSON.stringify(value));
}

function handlePlaylistApi(request, response, playlistLoader) {
  var origin = request.headers.origin;
  var originUrl;
  var body = "";
  var receivedBytes = 0;
  var tooLarge = false;
  var contentType = String(request.headers["content-type"] || "").toLowerCase();

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Use POST para carregar uma playlist." });
    return;
  }
  try {
    originUrl = new URL(origin);
  } catch (error) {
    sendJson(response, 403, { error: "A solicitação precisa vir do app AXION servido por este servidor." });
    return;
  }
  if (originUrl.protocol !== "http:" || originUrl.host.toLowerCase() !==
      String(request.headers.host || "").toLowerCase()) {
    sendJson(response, 403, { error: "A origem da solicitação não corresponde ao servidor AXION." });
    return;
  }
  if (contentType.indexOf("application/json") !== 0) {
    sendJson(response, 415, { error: "O pedido da playlist precisa usar JSON." });
    return;
  }

  request.on("data", function (chunk) {
    receivedBytes += chunk.length;
    if (receivedBytes > MAX_REQUEST_BYTES && !tooLarge) {
      tooLarge = true;
      body = "";
      return;
    }
    if (tooLarge) {
      return;
    }
    body += chunk.toString("utf8");
  });
  request.on("end", function () {
    var payload;
    if (tooLarge) {
      sendJson(response, 413, { error: "O pedido da playlist excede o limite permitido." });
      return;
    }
    try {
      payload = JSON.parse(body);
    } catch (error) {
      sendJson(response, 400, { error: "O pedido da playlist está malformado." });
      return;
    }
    if (!payload || typeof payload.url !== "string" || payload.url.length > 4096) {
      sendJson(response, 400, { error: "Informe uma URL válida para a playlist." });
      return;
    }
    playlistLoader(payload.url, 0, function (error, playlist) {
      if (error) {
        sendJson(response, 502, { error: error.message });
        return;
      }
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
        "X-Content-Type-Options": "nosniff"
      });
      response.end(playlist);
    });
  });
}

function contentTypeFor(filePath) {
  var extension = path.extname(filePath).toLowerCase();
  return {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp4": "video/mp4",
    ".png": "image/png",
    ".svg": "image/svg+xml"
  }[extension] || "application/octet-stream";
}

function parseByteRange(value, size) {
  var match = /^bytes=(\d*)-(\d*)$/.exec(value || "");
  var start;
  var end;
  if (!match || (!match[1] && !match[2])) {
    return false;
  }
  if (!match[1]) {
    if (Number(match[2]) <= 0 || size <= 0) {
      return false;
    }
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Number(match[2]) : size - 1;
    if (start >= size || end < start) {
      return false;
    }
    end = Math.min(end, size - 1);
  }
  return { start: start, end: end };
}

function createServer(options) {
  var root = path.resolve(options && options.root ? options.root : ROOT);
  var playlistLoader = options && options.fetchPlaylist ? options.fetchPlaylist : fetchPlaylist;
  return http.createServer(function (request, response) {
    var requestUrl;
    var pathname;
    var filePath;
    var relativePath;
    var pathParts;
    var method = request.method;

    try {
      requestUrl = new URL(request.url, "http://localhost");
      pathname = decodeURIComponent(requestUrl.pathname);
    } catch (error) {
      response.writeHead(400);
      response.end("Bad request");
      return;
    }

    pathParts = pathname.split(/[\\/]/);
    if (pathParts.some(function (part) { return part.charAt(0) === "."; })) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    if (pathname === "/api/playlist") {
      handlePlaylistApi(request, response, playlistLoader);
      return;
    }
    if (method !== "GET" && method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" });
      response.end();
      return;
    }

    filePath = path.resolve(root, "." + (pathname === "/" ? "/index.html" : pathname));
    relativePath = path.relative(root, filePath);
    if (relativePath.indexOf("..") === 0 || path.isAbsolute(relativePath)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    fs.stat(filePath, function (error, stats) {
      var stream;
      var rangeHeader;
      var range;
      var responseHeaders;
      if (error || !stats.isFile()) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      rangeHeader = request.headers.range;
      range = rangeHeader ? parseByteRange(rangeHeader, stats.size) : null;
      if (range === false) {
        response.writeHead(416, {
          "Accept-Ranges": "bytes",
          "Content-Range": "bytes */" + stats.size
        });
        response.end();
        return;
      }
      responseHeaders = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
        "Content-Type": contentTypeFor(filePath),
        "X-Content-Type-Options": "nosniff"
      };
      if (range) {
        responseHeaders["Content-Length"] = range.end - range.start + 1;
        responseHeaders["Content-Range"] = "bytes " + range.start + "-" +
          range.end + "/" + stats.size;
        response.writeHead(206, responseHeaders);
      } else {
        responseHeaders["Content-Length"] = stats.size;
        response.writeHead(200, responseHeaders);
      }
      if (method === "HEAD") {
        response.end();
        return;
      }
      stream = range ?
        fs.createReadStream(filePath, { start: range.start, end: range.end }) :
        fs.createReadStream(filePath);
      stream.on("error", function () {
        if (!response.headersSent) {
          response.writeHead(500);
        }
        response.end();
      });
      stream.pipe(response);
    });
  });
}

function argumentValue(name, fallback) {
  var index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1] || fallback;
}

if (require.main === module) {
  var host = argumentValue("--host", "127.0.0.1");
  var port = Number(argumentValue("--port", "8000"));
  var server = createServer();
  server.listen(port, host, function () {
    console.log("AXION disponível em http://" + host + ":" + server.address().port);
  });
}

module.exports = {
  createServer: createServer,
  isPublicAddress: isPublicAddress
};
