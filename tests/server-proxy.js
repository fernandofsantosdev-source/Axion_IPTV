"use strict";

var assert = require("assert");
var http = require("http");
var path = require("path");
var serverModule = require("../server");

function request(port, method, route, origin, payload, extraHeaders) {
  return new Promise(function (resolve, reject) {
    var body = payload ? JSON.stringify(payload) : "";
    extraHeaders = extraHeaders || {};
    var headers = {
      "Content-Length": Buffer.byteLength(body),
      "Content-Type": "application/json",
      Origin: origin
    };
    var key;
    for (key in extraHeaders) {
      if (Object.prototype.hasOwnProperty.call(extraHeaders, key)) {
        headers[key] = extraHeaders[key];
      }
    }
    var request = http.request({
      hostname: "127.0.0.1",
      port: port,
      method: method,
      path: route,
      headers: headers
    }, function (response) {
      var chunks = [];
      response.on("data", function (chunk) { chunks.push(chunk); });
      response.on("end", function () {
        var buffer = Buffer.concat(chunks);
        resolve({
          status: response.statusCode,
          body: buffer.toString("utf8"),
          size: buffer.length,
          headers: response.headers
        });
      });
    });
    request.on("error", reject);
    request.end(body);
  });
}

async function run() {
  var requestedPlaylistUrl = "";
  var server = serverModule.createServer({
    root: path.resolve(__dirname, ".."),
    fetchPlaylist: function (url, redirects, callback) {
      requestedPlaylistUrl = url;
      callback(null, "#EXTM3U\n#EXTINF:-1,Fixture\nhttps://media.example.test/1.mp4");
    }
  });
  await new Promise(function (resolve) {
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    var port = server.address().port;
    var origin = "http://127.0.0.1:" + port;
    var page = await request(port, "GET", "/", origin);
    var playlist = await request(port, "POST", "/api/playlist", origin,
      { url: "https://playlist.example.test/list.m3u" });
    var wrongOrigin = await request(port, "POST", "/api/playlist",
      "http://other.example", { url: "http://localhost/" });
    var videoRange = await request(port, "GET", "/tests/fixtures/axion-player-test.mp4",
      origin, null, { Range: "bytes=0-9" });
    var invalidRange = await request(port, "GET", "/tests/fixtures/axion-player-test.mp4",
      origin, null, { Range: "bytes=-0" });
    var hiddenFile = await request(port, "GET", "/.git/config", origin);

    assert.strictEqual(serverModule.isPublicAddress("8.8.8.8"), true);
    assert.strictEqual(serverModule.isPublicAddress("2001:4860:4860::8888"), true);
    assert.strictEqual(serverModule.isPublicAddress("127.0.0.1"), false);
    assert.strictEqual(serverModule.isPublicAddress("::1"), false);
    assert.strictEqual(page.status, 200);
    assert.strictEqual(playlist.status, 200);
    assert.strictEqual(playlist.body.indexOf("#EXTM3U"), 0);
    assert.strictEqual(requestedPlaylistUrl, "https://playlist.example.test/list.m3u");
    assert.strictEqual(wrongOrigin.status, 403);
    assert.strictEqual(videoRange.status, 206);
    assert.strictEqual(videoRange.size, 10);
    assert.strictEqual(videoRange.headers["content-range"], "bytes 0-9/8873");
    assert.strictEqual(invalidRange.status, 416);
    assert.strictEqual(hiddenFile.status, 404);
    console.log("PASSOU: 14 verificações do servidor local e do proxy");
  } finally {
    await new Promise(function (resolve, reject) {
      server.close(function (error) {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  var protectedServer = serverModule.createServer({ root: path.resolve(__dirname, "..") });
  await new Promise(function (resolve) {
    protectedServer.listen(0, "127.0.0.1", resolve);
  });
  try {
    var protectedPort = protectedServer.address().port;
    var privateTarget = await request(protectedPort, "POST", "/api/playlist",
      "http://127.0.0.1:" + protectedPort, { url: "http://127.0.0.1/private" });
    assert.strictEqual(privateTarget.status, 502);
    assert.ok(JSON.parse(privateTarget.body).error.indexOf("rede privada") !== -1);
    console.log("PASSOU: 16 verificações do servidor local e do proxy");
  } finally {
    await new Promise(function (resolve, reject) {
      protectedServer.close(function (error) {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

run().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
