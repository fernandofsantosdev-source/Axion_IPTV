(function (global) {
  "use strict";

  function createElement(tagName, className, text) {
    var element = global.document.createElement(tagName);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function createScreen() {
    var screen = createElement("section", "settings-screen");
    var header = createElement("header", "settings-header");
    var brand = createElement("div", "settings-brand", "AXION");
    var title = createElement("h1", "settings-title", "CONFIGURAÇÕES");
    var back = createElement("button", "settings-back", "‹  VOLTAR");
    var panel = createElement("section", "settings-panel");
    var heading = createElement("h2", "settings-panel-title", "SUA PLAYLIST");
    var description = createElement("p", "settings-description",
      "Informe o endereço da sua playlist M3U. O AXION salva o endereço somente neste dispositivo.");
    var label = createElement("label", "settings-label", "ENDEREÇO DA PLAYLIST");
    var urlField = createElement("div", "settings-url-field");
    var input = createElement("input", "settings-input");
    var toggleUrl = createElement("button", "settings-url-toggle", "MOSTRAR");
    var actions = createElement("div", "settings-actions");
    var save = createElement("button", "settings-action settings-save", "SALVAR ENDEREÇO");
    var reload = createElement("button", "settings-action settings-reload", "CARREGAR LISTA");
    var status = createElement("p", "settings-status", "");

    screen.setAttribute("aria-label", "Configurações do AXION");
    input.setAttribute("type", "password");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-label", "Endereço da playlist M3U");
    input.setAttribute("data-focusable", "true");
    input.setAttribute("autocapitalize", "off");
    toggleUrl.setAttribute("type", "button");
    toggleUrl.setAttribute("class", "settings-action settings-url-toggle");
    toggleUrl.setAttribute("data-focusable", "true");
    toggleUrl.setAttribute("aria-label", "Mostrar endereço da playlist");
    save.setAttribute("type", "button");
    reload.setAttribute("type", "button");
    back.setAttribute("type", "button");
    back.setAttribute("data-focusable", "true");
    save.setAttribute("data-focusable", "true");
    reload.setAttribute("data-focusable", "true");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");

    function showStatus(message, failed) {
      status.textContent = message;
      status.className = failed ? "settings-status is-error" : "settings-status";
    }

    toggleUrl.addEventListener("click", function () {
      var isHidden = input.type === "password";
      input.type = isHidden ? "text" : "password";
      toggleUrl.textContent = isHidden ? "OCULTAR" : "MOSTRAR";
      toggleUrl.setAttribute("aria-label",
        isHidden ? "Ocultar endereço da playlist" : "Mostrar endereço da playlist");
    });

    back.addEventListener("click", function () {
      global.NexoraApp.goBack();
    });

    save.addEventListener("click", function () {
      try {
        input.value = global.NexoraMediaLibrary.savePlaylistUrl(input.value);
        showStatus("Endereço salvo neste dispositivo.", false);
      } catch (error) {
        showStatus(error.message, true);
      }
    });

    reload.addEventListener("click", function () {
      var source;
      try {
        source = global.NexoraMediaLibrary.savePlaylistUrl(input.value);
      } catch (error) {
        showStatus(error.message, true);
        return;
      }
      if (!global.NexoraMediaSource) {
        showStatus("O carregador da playlist ainda não está disponível.", true);
        return;
      }
      showStatus("Carregando playlist...", false);
      global.NexoraMediaSource.load(source, function (error, entries) {
        if (error) {
          showStatus(error.message, true);
          return;
        }
        global.NexoraMovies.setEntries(entries);
        showStatus(entries.length + " entradas carregadas.", false);
      });
    });

    try {
      var savedSettings = global.NexoraMediaLibrary.getSettings();
      input.value = savedSettings.playlistUrl;
    } catch (error) {
      showStatus(error.message, true);
    }

    brand.setAttribute("aria-label", "AXION");
    back.setAttribute("aria-label", "Voltar para a tela inicial");
    label.setAttribute("for", "playlist-url");
    input.id = "playlist-url";
    header.appendChild(brand);
    header.appendChild(title);
    header.appendChild(back);
    panel.appendChild(heading);
    panel.appendChild(description);
    panel.appendChild(label);
    urlField.appendChild(input);
    urlField.appendChild(toggleUrl);
    panel.appendChild(urlField);
    actions.appendChild(save);
    actions.appendChild(reload);
    panel.appendChild(actions);
    panel.appendChild(status);
    screen.appendChild(header);
    screen.appendChild(panel);
    return screen;
  }

  global.NexoraSettings = {
    createScreen: createScreen
  };
}(window));
