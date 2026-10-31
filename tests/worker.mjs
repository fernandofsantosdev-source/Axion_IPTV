import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker/src/index.mjs";

const sourceUrl = "https://playlist.example.com/list.m3u?user=fixture&password=not-real";
const token = "fixture-token-that-is-not-a-real-secret";
const env = {
  AXION_PROXY_TOKEN: token,
  ALLOWED_HOSTS: "playlist.example.com,redirect.example.com",
  APP_ORIGINS: "http://localhost:8000,null",
  RATE_LIMITER: { limit: async function () { return { success: true }; } }
};
const checks = [];
let upstreamCalls = [];
let rateLimitCalls = 0;
let rateAllowed = true;

function check(name, condition) {
  assert.ok(condition, name);
  checks.push(name);
}

function request(method, headers, path) {
  const values = new Headers(headers || {});
  values.set("CF-Connecting-IP", "203.0.113.8");
  return new Request("https://worker.example" + (path || "/playlist"), {
    method: method,
    headers: values
  });
}

function authorizedHeaders(extra) {
  return Object.assign({
    Origin: "http://localhost:8000",
    Authorization: "Bearer " + token,
    "X-Playlist-URL": sourceUrl
  }, extra || {});
}

function testEnvironment() {
  return Object.assign({}, env, {
    RATE_LIMITER: {
      limit: async function (input) {
        rateLimitCalls += 1;
        return { success: rateAllowed, key: input.key };
      }
    }
  });
}

const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url, options) {
  upstreamCalls.push({ url: String(url), options: options });
  return new Response("#EXTM3U\n#EXTINF:-1,Fixture\nhttps://media.example.com/item.mp4\n", {
    status: 200,
    headers: { "Content-Type": "text/plain" }
  });
};

try {
  let response = await worker.fetch(request("OPTIONS", {
    Origin: "http://localhost:8000",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization,x-playlist-url"
  }), testEnvironment());
  check("preflight permitida sem buscar a origem",
    response.status === 204 && upstreamCalls.length === 0);

  response = await worker.fetch(request("OPTIONS", {
    Origin: "http://localhost:8000",
    "Access-Control-Request-Method": "POST"
  }), testEnvironment());
  check("preflight de método arbitrário recusada", response.status === 403);

  rateAllowed = false;
  response = await worker.fetch(request("OPTIONS", {
    Origin: "http://localhost:8000",
    "Access-Control-Request-Method": "GET",
    "Access-Control-Request-Headers": "authorization,x-playlist-url"
  }), testEnvironment());
  check("preflight também passa pelo rate limit", response.status === 429);
  rateAllowed = true;

  response = await worker.fetch(request("POST", authorizedHeaders()), testEnvironment());
  check("método POST recusado", response.status === 405 && upstreamCalls.length === 0);

  response = await worker.fetch(request("GET", {
    Origin: "http://localhost:8000",
    "X-Playlist-URL": sourceUrl
  }), testEnvironment());
  check("token ausente recusado antes de buscar a origem",
    response.status === 401 && upstreamCalls.length === 0);

  response = await worker.fetch(request("GET", authorizedHeaders({
    Authorization: "Bearer token-invalido"
  })), testEnvironment());
  check("token inválido recusado", response.status === 401 && upstreamCalls.length === 0);

  response = await worker.fetch(request("GET", {
    Origin: "http://localhost:8000",
    Authorization: "Bearer " + token
  }), testEnvironment());
  check("URL ausente recusada", response.status === 400 && upstreamCalls.length === 0);

  for (const blockedUrl of [
    "http://127.0.0.1/private",
    "http://2130706433/private",
    "http://0x7f000001/private",
    "http://10.1.2.3/private",
    "http://192.168.1.1/private",
    "http://[::1]/private",
    "http://metadata.internal/latest"
  ]) {
    response = await worker.fetch(request("GET", authorizedHeaders({
      "X-Playlist-URL": blockedUrl
    })), testEnvironment());
    check("destino privado/local bloqueado: " + blockedUrl,
      response.status === 403 && upstreamCalls.length === 0);
  }

  response = await worker.fetch(request("GET", authorizedHeaders({
    "X-Playlist-URL": "https://other.example.com/playlist.m3u"
  })), testEnvironment());
  check("host fora da allowlist bloqueado", response.status === 403);

  response = await worker.fetch(request("GET", authorizedHeaders(), "/stream"), testEnvironment());
  check("rota de mídia não existe", response.status === 404 && upstreamCalls.length === 0);

  rateAllowed = false;
  const callsBeforeLimit = upstreamCalls.length;
  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  check("limite excedido não busca a origem",
    response.status === 429 && upstreamCalls.length === callsBeforeLimit &&
    rateLimitCalls > 0);
  rateAllowed = true;

  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  const playlist = await response.text();
  check("GET autorizado devolve a playlist sem transcodificação",
    response.status === 200 && playlist.indexOf("#EXTM3U") === 0);
  check("resposta CORS limita a origem permitida",
    response.headers.get("Access-Control-Allow-Origin") === "http://localhost:8000");
  check("pedido upstream não recebe token nem cabeçalhos arbitrários",
    upstreamCalls[0].options.method === "GET" &&
    upstreamCalls[0].options.headers.Authorization === undefined &&
    upstreamCalls[0].options.headers["X-Playlist-URL"] === undefined);
  check("resposta não reflete o URL ou token",
    playlist.indexOf(sourceUrl) === -1 && playlist.indexOf(token) === -1);

  globalThis.fetch = async function (url) {
    upstreamCalls.push({ url: String(url) });
    if (String(url).indexOf("playlist.example.com") !== -1) {
      return new Response(null, {
        status: 302,
        headers: { Location: "https://redirect.example.com/final.m3u" }
      });
    }
    return new Response("#EXTM3U\n#EXTINF:-1,Redirect\nhttps://media.example.com/1\n");
  };
  upstreamCalls = [];
  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  check("redirecionamento para host autorizado revalidado",
    response.status === 200 && upstreamCalls.length === 2);

  globalThis.fetch = async function () {
    upstreamCalls.push({});
    return new Response(null, {
      status: 302,
      headers: { Location: "http://127.0.0.1/private" }
    });
  };
  upstreamCalls = [];
  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  check("redirecionamento para IP privado bloqueado",
    response.status === 403 && upstreamCalls.length === 1);

  globalThis.fetch = async function () {
    return new Response("URL sensível " + sourceUrl + " token " + token, { status: 502 });
  };
  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  const sanitizedError = await response.text();
  check("erro upstream não revela URL, corpo nem token",
    response.status === 502 && sanitizedError.indexOf(sourceUrl) === -1 &&
    sanitizedError.indexOf(token) === -1);

  globalThis.fetch = async function () {
    return new Response(new Uint8Array(8 * 1024 * 1024 + 1));
  };
  response = await worker.fetch(request("GET", authorizedHeaders()), testEnvironment());
  check("playlist acima de 8 MiB recusada", response.status === 413);

  const workerSource = await readFile(new URL("../worker/src/index.mjs", import.meta.url), "utf8");
  check("implementação do Worker não contém chamadas de log",
    !/\bconsole\.[A-Za-z]+\s*\(/.test(workerSource));
  check("implementação não expõe rotas de ticket ou stream",
    !/stream-ticket|createTicket|\/stream\b/.test(workerSource));
} finally {
  globalThis.fetch = originalFetch;
}

console.log("PASSOU: " + checks.length + " verificações do Worker");
