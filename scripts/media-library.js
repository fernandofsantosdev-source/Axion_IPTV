(function (global) {
  "use strict";

  var SETTINGS_KEY = "axion.media.settings.v1";
  var LIBRARY_KEY = "axion.media.library.v1";
  var ROUTES_KEY = "axion.media.routes.v1";

  function read(key, fallback) {
    var raw;
    try {
      raw = global.localStorage.getItem(key);
    } catch (error) {
      throw new Error("O armazenamento local não está disponível neste dispositivo.");
    }
    if (raw === null) {
      return fallback;
    }
    try {
      return JSON.parse(raw);
    } catch (error) {
      throw new Error("Os dados locais do AXION estão inválidos. Remova os dados do app e tente novamente.");
    }
  }

  function write(key, value) {
    try {
      global.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      throw new Error("Não foi possível salvar no armazenamento local do dispositivo.");
    }
  }

  function normalizeUrl(value) {
    var trimmed = String(value || "").replace(/^\s+|\s+$/g, "");
    if (!/^https?:\/\/[^/\s?#]+(?:[/?#][^\s]*)?$/i.test(trimmed)) {
      throw new Error("Informe um endereço completo começando com http:// ou https://.");
    }
    return trimmed;
  }

  function getSettings() {
    var settings = read(SETTINGS_KEY, {});
    if (!settings || typeof settings !== "object" || settings.constructor !== Object) {
      throw new Error("As configurações locais do AXION estão inválidas.");
    }
    return {
      playlistUrl: typeof settings.playlistUrl === "string" ? settings.playlistUrl : ""
    };
  }

  function savePlaylistUrl(value) {
    var url = normalizeUrl(value);
    var settings = getSettings();
    settings.playlistUrl = url;
    write(SETTINGS_KEY, settings);
    return url;
  }

  function normalizeServerOrigin(value) {
    var parsed;
    try {
      parsed = new URL(value);
    } catch (error) {
      throw new Error("Não foi possível identificar o servidor da playlist.");
    }
    if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
        parsed.username || parsed.password) {
      throw new Error("Não foi possível identificar o servidor da playlist.");
    }
    return parsed.origin;
  }

  function getPreferredRoute(serverOrigin) {
    var routes = read(ROUTES_KEY, {});
    var origin = normalizeServerOrigin(serverOrigin);
    if (!routes || typeof routes !== "object" ||
        Object.prototype.toString.call(routes) !== "[object Object]") {
      throw new Error("As preferências de conexão do AXION estão inválidas.");
    }
    if (routes[origin] !== undefined &&
        routes[origin] !== "direct" && routes[origin] !== "worker") {
      throw new Error("As preferências de conexão do AXION estão inválidas.");
    }
    return routes[origin] || "";
  }

  function savePreferredRoute(serverOrigin, route) {
    var routes = read(ROUTES_KEY, {});
    var origin = normalizeServerOrigin(serverOrigin);
    var origins;
    if (!routes || typeof routes !== "object" ||
        Object.prototype.toString.call(routes) !== "[object Object]" ||
        (route !== "direct" && route !== "worker")) {
      throw new Error("Não foi possível salvar a preferência de conexão.");
    }
    routes[origin] = route;
    origins = Object.keys(routes);
    while (origins.length > 32) {
      delete routes[origins.shift()];
    }
    write(ROUTES_KEY, routes);
  }

  function getLibrary() {
    var library = read(LIBRARY_KEY, { favorites: [], progress: {} });
    var i;
    if (!library || typeof library !== "object" ||
        Object.prototype.toString.call(library.favorites) !== "[object Array]" ||
        !library.progress ||
        Object.prototype.toString.call(library.progress) !== "[object Object]") {
      throw new Error("A biblioteca local do AXION está inválida.");
    }
    for (i = 0; i < library.favorites.length; i += 1) {
      if (typeof library.favorites[i] !== "string" || !library.favorites[i]) {
        throw new Error("A biblioteca local do AXION está inválida.");
      }
    }
    for (var id in library.progress) {
      if (Object.prototype.hasOwnProperty.call(library.progress, id) &&
          (!library.progress[id] || typeof library.progress[id] !== "object" ||
          !isFinite(Number(library.progress[id].position)) ||
          !isFinite(Number(library.progress[id].duration)) ||
          Number(library.progress[id].position) < 0 ||
          Number(library.progress[id].duration) <= 0)) {
        throw new Error("A biblioteca local do AXION está inválida.");
      }
    }
    return library;
  }

  function saveLibrary(library) {
    write(LIBRARY_KEY, library);
  }

  function getFavorites() {
    return getLibrary().favorites.slice(0);
  }

  function setFavorite(id, isFavorite) {
    var library;
    var index;
    if (typeof id !== "string" || !id) {
      throw new Error("Não foi possível identificar este título favorito.");
    }
    library = getLibrary();
    index = library.favorites.indexOf(id);
    if (isFavorite && index === -1) {
      library.favorites.push(id);
    } else if (!isFavorite && index !== -1) {
      library.favorites.splice(index, 1);
    }
    saveLibrary(library);
    return library.favorites.slice(0);
  }

  function getProgress() {
    var stored = getLibrary().progress;
    var progress = {};
    var id;
    for (id in stored) {
      if (Object.prototype.hasOwnProperty.call(stored, id)) {
        progress[id] = {
          position: Number(stored[id].position),
          duration: Number(stored[id].duration)
        };
      }
    }
    return progress;
  }

  function saveProgress(id, position, duration) {
    var library;
    if (typeof id !== "string" || !id || !isFinite(Number(position)) ||
        !isFinite(Number(duration)) || Number(position) < 0 || Number(duration) <= 0) {
      throw new Error("Não foi possível salvar o progresso deste título.");
    }
    library = getLibrary();
    if (Number(position) / Number(duration) >= 0.9) {
      delete library.progress[id];
    } else {
      library.progress[id] = {
        position: Number(position),
        duration: Number(duration)
      };
    }
    saveLibrary(library);
    return library.progress[id] || null;
  }

  global.NexoraMediaLibrary = {
    getSettings: getSettings,
    normalizeUrl: normalizeUrl,
    savePlaylistUrl: savePlaylistUrl,
    getPreferredRoute: getPreferredRoute,
    savePreferredRoute: savePreferredRoute,
    getLibrary: getLibrary,
    saveLibrary: saveLibrary,
    getFavorites: getFavorites,
    setFavorite: setFavorite,
    getProgress: getProgress,
    saveProgress: saveProgress
  };
}(window));
