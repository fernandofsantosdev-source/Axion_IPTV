const MAX_PLAYLIST_BYTES = 8 * 1024 * 1024;
const MAX_URL_LENGTH = 4096;
const MAX_REDIRECTS = 4;
const encoder = new TextEncoder();

class ProxyError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function configuredList(value) {
  return String(value || "").split(",").map(function (item) {
    return item.trim();
  }).filter(Boolean);
}

function responseHeaders(request, env) {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer"
  });
  const origin = request.headers.get("Origin");
  if (origin && configuredList(env.APP_ORIGINS).includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }
  return headers;
}

function jsonResponse(request, env, status, message, extraHeaders) {
  const headers = responseHeaders(request, env);
  headers.set("Content-Type", "application/json; charset=utf-8");
  if (extraHeaders) {
    extraHeaders.forEach(function (value, name) {
      headers.set(name, value);
    });
  }
  return new Response(JSON.stringify({ error: message }), {
    status: status,
    headers: headers
  });
}

function isAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin");
  return !origin || configuredList(env.APP_ORIGINS).includes(origin);
}

function preflight(request, env) {
  const requestedMethod = request.headers.get("Access-Control-Request-Method");
  const requestedHeaders = configuredList(
    request.headers.get("Access-Control-Request-Headers")
  ).map(function (name) { return name.toLowerCase(); });
  const allowedHeaders = ["authorization", "x-playlist-url"];
  if (!isAllowedOrigin(request, env) || requestedMethod !== "GET" ||
      requestedHeaders.some(function (name) { return !allowedHeaders.includes(name); })) {
    return jsonResponse(request, env, 403, "Origem ou preflight não autorizado.");
  }
  const headers = responseHeaders(request, env);
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, X-Playlist-URL");
  headers.set("Access-Control-Max-Age", "600");
  return new Response(null, { status: 204, headers: headers });
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    difference |= (a[i] || 0) ^ (b[i] || 0);
  }
  return difference === 0;
}

function isIpLiteral(host) {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) ||
    host.indexOf(":") !== -1 || host.charAt(0) === "[" || host.charAt(host.length - 1) === "]";
}

function validateTarget(value, env) {
  let target;
  try {
    target = new URL(value);
  } catch (error) {
    throw new ProxyError(400, "O endereço da playlist é inválido.");
  }
  const host = target.hostname.toLowerCase().replace(/\.$/, "");
  const blockedSuffixes = [
    ".localhost", ".local", ".internal", ".lan", ".home",
    ".test", ".invalid", ".example", ".onion"
  ];
  if ((target.protocol !== "http:" && target.protocol !== "https:") ||
      target.username || target.password || !host || isIpLiteral(host) ||
      host === "localhost" || host.indexOf(".") === -1 ||
      blockedSuffixes.some(function (suffix) { return host.endsWith(suffix); })) {
    throw new ProxyError(403, "O destino da playlist não é permitido.");
  }
  const allowedHosts = configuredList(env.ALLOWED_HOSTS).map(function (item) {
    return item.toLowerCase().replace(/\.$/, "");
  });
  if (!allowedHosts.includes(host)) {
    throw new ProxyError(403, "O servidor da playlist não está autorizado.");
  }
  target.hash = "";
  return target;
}

function isAuthorized(request, env) {
  const configured = String(env.AXION_PROXY_TOKEN || "");
  const authorization = request.headers.get("Authorization") || "";
  const supplied = authorization.indexOf("Bearer ") === 0 ?
    authorization.slice(7) : "";
  return configured.length >= 32 && supplied.length > 0 &&
    constantTimeEqual(supplied, configured);
}

async function fetchPlaylist(target, env, redirects) {
  let response;
  try {
    response = await fetch(target.toString(), {
      method: "GET",
      headers: {
        Accept: "application/x-mpegURL, audio/x-mpegurl, text/plain, */*",
        "User-Agent": "AXION-Playlist-Proxy/1.0"
      },
      redirect: "manual"
    });
  } catch (error) {
    throw new ProxyError(502, "Não foi possível acessar o servidor da playlist.");
  }

  const location = response.headers.get("Location");
  if (response.status >= 300 && response.status < 400 && location) {
    await response.body?.cancel();
    if (redirects >= MAX_REDIRECTS) {
      throw new ProxyError(502, "O servidor da playlist redirecionou vezes demais.");
    }
    return fetchPlaylist(
      validateTarget(new URL(location, target).toString(), env),
      env,
      redirects + 1
    );
  }
  if (response.status < 200 || response.status >= 300) {
    await response.body?.cancel();
    throw new ProxyError(502, "O servidor da playlist retornou uma resposta inválida.");
  }
  return response;
}

async function readPlaylist(response) {
  if (!response.body) {
    return new Uint8Array(0);
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }
    size += result.value.byteLength;
    if (size > MAX_PLAYLIST_BYTES) {
      await reader.cancel();
      throw new ProxyError(413, "A playlist excede o limite permitido.");
    }
    chunks.push(result.value);
  }
  const playlist = new Uint8Array(size);
  let offset = 0;
  chunks.forEach(function (chunk) {
    playlist.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return playlist;
}

async function handlePlaylist(request, env) {
  const value = request.headers.get("X-Playlist-URL") || "";
  if (!value || value.length > MAX_URL_LENGTH) {
    return jsonResponse(request, env, 400, "Informe um endereço válido para a playlist.");
  }

  try {
    const target = validateTarget(value, env);
    const upstream = await fetchPlaylist(target, env, 0);
    const playlist = await readPlaylist(upstream);
    const headers = responseHeaders(request, env);
    headers.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");
    return new Response(playlist, { status: 200, headers: headers });
  } catch (error) {
    const status = error instanceof ProxyError ? error.status : 502;
    const message = error instanceof ProxyError ?
      error.message : "Não foi possível obter a playlist.";
    return jsonResponse(request, env, status, message);
  }
}

async function rateLimitResponse(request, env) {
  const limiter = env.RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== "function") {
    return jsonResponse(request, env, 503, "O limite de uso do Worker não está configurado.");
  }
  const clientIp = request.headers.get("CF-Connecting-IP");
  let limitResult;
  try {
    limitResult = await limiter.limit({ key: clientIp || "unknown-client" });
  } catch (error) {
    return jsonResponse(request, env, 503, "O Worker está temporariamente indisponível.");
  }
  if (!limitResult || !limitResult.success) {
    return jsonResponse(request, env, 429, "Limite de requisições atingido.", new Headers({
      "Retry-After": "60"
    }));
  }
  return null;
}

export default {
  async fetch(request, env) {
    const rateLimitError = await rateLimitResponse(request, env);
    if (rateLimitError) {
      return rateLimitError;
    }
    const pathname = new URL(request.url).pathname;
    if (pathname !== "/playlist") {
      return jsonResponse(request, env, 404, "Rota não encontrada.");
    }
    if (request.method === "OPTIONS") {
      return preflight(request, env);
    }
    if (request.method !== "GET") {
      return jsonResponse(request, env, 405, "Método não permitido.", new Headers({
        Allow: "GET, OPTIONS"
      }));
    }
    if (!isAllowedOrigin(request, env)) {
      return jsonResponse(request, env, 403, "Origem não autorizada.");
    }
    if (!isAuthorized(request, env)) {
      return jsonResponse(request, env, 401, "Acesso não autorizado.");
    }
    return handlePlaylist(request, env);
  }
};
