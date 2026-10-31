(function (global) {
  "use strict";

  function hash(value, seed) {
    var result = seed >>> 0;
    var i;
    for (i = 0; i < value.length; i += 1) {
      result = Math.imul ? Math.imul(result ^ value.charCodeAt(i), 16777619) :
        ((result ^ value.charCodeAt(i)) * 16777619) >>> 0;
    }
    return ("00000000" + (result >>> 0).toString(16)).slice(-8);
  }

  function parseAttributes(line) {
    var attributes = {};
    var matcher = /([A-Za-z0-9_-]+)="([^"]*)"/g;
    var match;
    while ((match = matcher.exec(line))) {
      attributes[match[1].toLowerCase()] = match[2];
    }
    return attributes;
  }

  function formatDuration(seconds) {
    var minutes;
    if (!isFinite(seconds) || seconds <= 0) {
      return "—";
    }
    minutes = Math.round(seconds / 60);
    return Math.floor(minutes / 60) + "h " + ("0" + (minutes % 60)).slice(-2) + "min";
  }

  function normalizeLabel(value) {
    return String(value || "").toLowerCase()
      .replace(/[áàâãä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôõö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/ç/g, "c");
  }

  function classify(category, title, uri) {
    var labels = normalizeLabel(category + " " + title);
    var path = normalizeLabel(uri);
    if (/\/series\//.test(path) ||
        /\b(series|seriado|episodio|episode|temporada|season|tv shows?)\b/.test(labels)) {
      return "series";
    }
    if (/\/movie\//.test(path) ||
        /\b(movie|movies|filme|filmes|cinema|vod)\b/.test(labels)) {
      return "movie";
    }
    if (/\/live\//.test(path) ||
        /\b(live|ao vivo|canal|canais|channel|channels|tv)\b/.test(labels) ||
        /\.ts(?:$|[?#])/.test(path)) {
      return "live";
    }
    return "movie";
  }

  function parseEpisode(title, seriesName) {
    var match = title.match(/^(.*?)\s*(?:[-._ ]*)S(\d{1,2})\s*E(\d{1,3})(?:\s*[-._ ]*(.*))?$/i) ||
      title.match(/^(.*?)\s*(?:[-._ ]*)(\d{1,2})x(\d{1,3})(?:\s*[-._ ]*(.*))?$/i);
    if (!match) {
      return {
        seriesTitle: seriesName || title,
        episodeTitle: title,
        seasonNumber: 0,
        episodeNumber: 0
      };
    }
    return {
      seriesTitle: seriesName || match[1].replace(/[-._ ]+$/g, "") || title,
      episodeTitle: match[4] || title,
      seasonNumber: Number(match[2]),
      episodeNumber: Number(match[3])
    };
  }

  function parse(text, sourceUrl) {
    var normalized = String(text || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
    var lines = normalized.split("\n");
    var entries = [];
    var current = null;
    var headerFound = false;
    var i;
    var line;
    var match;
    var attributes;
    var uri;
    var title;
    var mediaType;
    var episode;

    for (i = 0; i < lines.length; i += 1) {
      line = lines[i].replace(/^\s+|\s+$/g, "");
      if (!line) {
        continue;
      }
      if (!headerFound) {
        if (line.indexOf("#EXTM3U") !== 0) {
          throw new Error("A resposta não é uma playlist M3U válida.");
        }
        headerFound = true;
        continue;
      }
      if (line.indexOf("#EXTINF:") === 0) {
        match = line.match(/^#EXTINF:\s*(-?\d+(?:\.\d+)?)(.*)$/);
        if (!match) {
          current = null;
          continue;
        }
        attributes = parseAttributes(match[2]);
        title = match[2].replace(/^\s*/, "");
        title = title.replace(/(?:^|\s)[A-Za-z0-9_-]+="[^"]*"/g, "").replace(/^\s*[:,]\s*/, "").replace(/^\s+|\s+$/g, "");
        current = {
          duration: formatDuration(Number(match[1])),
          title: title || attributes["tvg-name"] || "",
          category: attributes["group-title"] || "",
          url: ""
        };
        continue;
      }
      if (line.charAt(0) === "#") {
        continue;
      }
      if (current) {
        uri = line;
        if (!/^https?:\/\//i.test(uri)) {
          current = null;
          continue;
        }
        current.url = uri;
        current.title = current.title || "Sem título";
        current.category = current.category || "Sem categoria";
        mediaType = classify(current.category, current.title, uri);
        current.mediaType = mediaType;
        if (mediaType === "series") {
          episode = parseEpisode(current.title, attributes["tvg-series"] || "");
          current.seriesTitle = episode.seriesTitle;
          current.episodeTitle = episode.episodeTitle;
          current.seasonNumber = episode.seasonNumber;
          current.episodeNumber = episode.episodeNumber;
        }
        current.eyebrow = current.category.toUpperCase();
        current.rating = "—";
        current.synopsis = "";
        current.accent = ["cyan", "rose", "violet", "amber", "green", "blue", "gold", "teal"][entries.length % 8];
        current.genre = "custom";
        current.id = "entry-" + hash(sourceUrl + "\n" + uri, 2166136261) +
          hash(uri + "\n" + sourceUrl, 2246822519);
        entries.push(current);
        current = null;
      }
    }
    if (!headerFound || !entries.length) {
      throw new Error("A playlist não contém entradas válidas com endereço HTTP ou HTTPS.");
    }
    return entries;
  }

  var loadedEntries = null;

  function isTizenApp() {
    return !!(global.webapis && global.webapis.avplay);
  }

  function getWorkerSettings() {
    var config = global.AXION_CONFIG;
    var parsed;
    if (!config || typeof config.workerUrl !== "string" ||
        typeof config.workerToken !== "string" ||
        !config.workerUrl || !config.workerToken) {
      return null;
    }
    try {
      parsed = new global.URL(config.workerUrl);
    } catch (error) {
      return null;
    }
    if ((parsed.protocol !== "https:" &&
        !(parsed.protocol === "http:" &&
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"))) ||
        parsed.username || parsed.password || parsed.search || parsed.hash ||
        (parsed.pathname && parsed.pathname !== "/")) {
      return null;
    }
    return {
      workerUrl: parsed.origin,
      workerToken: config.workerToken
    };
  }

  function request(method, url, headers, body, callback) {
    var xhr;
    var completed = false;
    function finish(error, responseText, status) {
      if (completed) {
        return;
      }
      completed = true;
      callback(error, responseText, status);
    }
    try {
      xhr = new global.XMLHttpRequest();
      xhr.open(method, url, true);
      Object.keys(headers || {}).forEach(function (name) {
        xhr.setRequestHeader(name, headers[name]);
      });
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4 || completed) {
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300) {
          finish(new Error("HTTP " + xhr.status), xhr.responseText, xhr.status);
          return;
        }
        finish(null, xhr.responseText, xhr.status);
      };
      xhr.onerror = function () {
        finish(new Error("Falha de rede ou bloqueio CORS."));
      };
      xhr.ontimeout = function () {
        finish(new Error("A requisição expirou."));
      };
      xhr.timeout = 20000;
      xhr.send(body);
    } catch (error) {
      finish(error);
    }
  }

  function requestWorker(url, callback) {
    var settings = getWorkerSettings();
    if (!settings) {
      callback(new Error("O proxy remoto não está configurado."));
      return;
    }
    request("GET", settings.workerUrl + "/playlist", {
      Authorization: "Bearer " + settings.workerToken,
      "X-Playlist-URL": url
    }, null, function (error, responseText) {
      if (error) {
        callback(error);
        return;
      }
      callback(null, responseText);
    });
  }

  function load(url, callback) {
    var completed = false;
    var serverOrigin;
    var preferredRoute;
    var workerAvailable;

    function finish(error, entries) {
      if (completed) {
        return;
      }
      completed = true;
      callback(error, entries);
    }

    function parseResponse(responseText, route) {
      var entries;
      try {
        entries = parse(responseText, url);
      } catch (error) {
        finish(error);
        return;
      }
      try {
        global.NexoraMediaLibrary.savePreferredRoute(serverOrigin, route);
      } catch (error) {
        finish(error);
        return;
      }
      finish(null, entries);
    }

    function failedLoad() {
      finish(new Error("Não foi possível carregar a playlist. Verifique o endereço e a conexão e tente novamente."));
    }

    function tryRoute(route, allowAlternate) {
      var requestUrl = url;
      var headers = {};
      var nextRoute = route === "direct" ? "worker" : "direct";
      var requestCallback = function (error, responseText) {
        if (!error) {
          parseResponse(responseText, route);
          return;
        }
        if (allowAlternate && nextRoute !== route &&
            (nextRoute === "direct" || workerAvailable)) {
          tryRoute(nextRoute, false);
          return;
        }
        failedLoad();
      };

      if (route === "worker") {
        var settings = getWorkerSettings();
        if (!settings) {
          if (allowAlternate) {
            tryRoute("direct", false);
          } else {
            failedLoad();
          }
          return;
        }
        requestWorker(url, requestCallback);
      } else {
        request("GET", requestUrl, headers, null, requestCallback);
      }
    }

    try {
      url = global.NexoraMediaLibrary.normalizeUrl(url);
      if (!global.XMLHttpRequest) {
        throw new Error("Este dispositivo não permite acessar a playlist pela rede.");
      }
      serverOrigin = new global.URL(url).origin;
      preferredRoute = global.NexoraMediaLibrary.getPreferredRoute(serverOrigin);
      workerAvailable = !!getWorkerSettings();
      if (preferredRoute === "worker" && workerAvailable) {
        tryRoute("worker", true);
      } else {
        tryRoute("direct", true);
      }
    } catch (error) {
      finish(error);
    }
  }

  function setEntries(entries) {
    if (Object.prototype.toString.call(entries) !== "[object Array]") {
      throw new Error("A lista da fonte precisa ser um array.");
    }
    loadedEntries = entries.slice(0);
  }

  function getEntries() {
    return loadedEntries === null ? null : loadedEntries.slice(0);
  }

  function loadConfigured(callback) {
    var settings;
    var cached = getEntries();
    if (cached) {
      callback(null, cached);
      return;
    }
    try {
      settings = global.NexoraMediaLibrary.getSettings();
      if (!settings.playlistUrl) {
        callback(null, null);
        return;
      }
      load(settings.playlistUrl, function (error, entries) {
        if (error) {
          callback(error);
          return;
        }
        setEntries(entries);
        callback(null, getEntries());
      });
    } catch (error) {
      callback(error);
    }
  }

  global.NexoraMediaSource = {
    parse: parse,
    load: load,
    loadConfigured: loadConfigured,
    isTizenApp: isTizenApp,
    setEntries: setEntries,
    getEntries: getEntries
  };
}(window));
