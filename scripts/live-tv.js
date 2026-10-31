(function (global) {
  "use strict";

  var categories = [
    { id: "all", name: "Todos" },
    { id: "news", name: "Notícias" },
    { id: "cinema", name: "Cinema" },
    { id: "culture", name: "Cultura" }
  ];

  var channels = [
    {
      id: "aurora",
      category: "news",
      number: "01",
      name: "Aurora Notícias",
      tagline: "Informação em tempo real",
      programs: [
        { time: "20:30", title: "Panorama da Noite", state: "Agora" },
        { time: "21:30", title: "Conexão Global", state: "A seguir" },
        { time: "22:15", title: "Ponto de Vista", state: "Mais tarde" }
      ]
    },
    {
      id: "horizonte",
      category: "culture",
      number: "02",
      name: "Horizonte",
      tagline: "Histórias que inspiram",
      programs: [
        { time: "20:00", title: "Terras Distantes", state: "Agora" },
        { time: "21:10", title: "Mundos em Foco", state: "A seguir" },
        { time: "22:00", title: "Além do Mapa", state: "Mais tarde" }
      ]
    },
    {
      id: "orbita",
      category: "cinema",
      number: "03",
      name: "Órbita Filmes",
      tagline: "Uma história a cada sessão",
      programs: [
        { time: "19:50", title: "A Cidade de Cristal", state: "Agora" },
        { time: "21:35", title: "Rota das Estrelas", state: "A seguir" },
        { time: "23:05", title: "O Último Farol", state: "Mais tarde" }
      ]
    },
    {
      id: "viva",
      category: "culture",
      number: "04",
      name: "Viva Cultura",
      tagline: "Arte, música e encontros",
      programs: [
        { time: "20:15", title: "Palco Aberto", state: "Agora" },
        { time: "21:20", title: "Ateliê Urbano", state: "A seguir" },
        { time: "22:10", title: "Som da Cidade", state: "Mais tarde" }
      ]
    },
    {
      id: "cinemax",
      category: "cinema",
      number: "05",
      name: "Cine Neon",
      tagline: "Novos mundos no cinema",
      programs: [
        { time: "20:40", title: "Frequência Azul", state: "Agora" },
        { time: "22:00", title: "Entre Dois Sóis", state: "A seguir" },
        { time: "23:40", title: "Noite Elétrica", state: "Mais tarde" }
      ]
    },
    {
      id: "pulso",
      category: "news",
      number: "06",
      name: "Pulso Atual",
      tagline: "O mundo em perspectiva",
      programs: [
        { time: "20:45", title: "Resumo do Dia", state: "Agora" },
        { time: "21:25", title: "Debate em Pauta", state: "A seguir" },
        { time: "22:20", title: "Boletim Global", state: "Mais tarde" }
      ]
    }
  ];

  var sourceEntries = null;

  function setEntries(entries) {
    if (Object.prototype.toString.call(entries) !== "[object Array]") {
      throw new Error("A lista de canais precisa ser um array.");
    }
    sourceEntries = entries.slice(0);
    if (global.NexoraMediaSource) {
      global.NexoraMediaSource.setEntries(sourceEntries);
    }
  }

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
    var screen = createElement("section", "live-screen");
    var header = createElement("header", "live-header");
    var brand = createElement("div", "live-brand");
    var brandName = createElement("div", "live-brand-name");
    var brandX = createElement("span", "brand-x", "X");
    var brandSubtitle = createElement("div", "live-brand-subtitle", "IPTV PLAYER");
    var titleBlock = createElement("div", "live-title-block");
    var title = createElement("h1", "live-title", "TV AO VIVO");
    var status = createElement("span", "live-status", "SINAL DE DEMONSTRAÇÃO");
    var backButton = createElement("button", "live-back", "VOLTAR");
    var backArrow = createElement("span", "live-back-arrow", "‹");
    var content = createElement("div", "live-content");
    var browse = createElement("section", "live-browse");
    var categoryPanel = createElement("div", "live-category-panel");
    var categoryHeading = createElement("h2", "live-section-label", "CATEGORIAS");
    var categoryList = createElement("nav", "live-category-list");
    var channelPanel = createElement("div", "live-channel-panel");
    var channelHeading = createElement("h2", "live-section-label", "CANAIS");
    var channelList = createElement("div", "live-channel-list");
    var detail = createElement("section", "live-detail");
    var entries = global.NexoraMediaSource ?
      global.NexoraMediaSource.getEntries() : sourceEntries;
    if (entries) {
      sourceEntries = entries;
    }
    var activeChannels = entries ? createSourceChannels(entries) : channels;
    var activeCategories = createSourceCategories(activeChannels);
    var selectedChannel = activeChannels[0] || null;
    var activeCategory = "all";
    var favorites = [];
    var focusType = "category";
    var focusedCategoryId = "all";
    var focusedChannelId = null;
    var sourceLoadError = "";

    function withFavoritesCategory(items) {
      var result = items.slice(0);
      if (!result.some(function (item) { return item.id === "favorites"; })) {
        result.splice(1, 0, { id: "favorites", name: "Favoritos" });
      }
      return result;
    }

    function loadFavorites() {
      try {
        favorites = global.NexoraMediaLibrary ?
          global.NexoraMediaLibrary.getFavorites() : [];
      } catch (error) {
        status.textContent = error.message;
        status.className = "live-status is-error";
      }
    }

    function isFavorite(channel) {
      return favorites.indexOf(channel.id) !== -1;
    }

    screen.setAttribute("aria-label", "TV ao vivo");
    categoryList.setAttribute("aria-label", "Categorias de canais");
    channelList.setAttribute("aria-label", "Canais disponíveis");
    detail.setAttribute("aria-live", "polite");

    brandName.appendChild(createElement("span", "", "A"));
    brandName.appendChild(brandX);
    brandName.appendChild(createElement("span", "", "ION"));
    brand.appendChild(brandName);
    brand.appendChild(brandSubtitle);
    titleBlock.appendChild(title);
    status.textContent = entries ? "CANAIS DA PLAYLIST" : "SINAL DE DEMONSTRAÇÃO";
    titleBlock.appendChild(status);
    backArrow.setAttribute("aria-hidden", "true");
    backButton.insertBefore(backArrow, backButton.firstChild);
    backButton.setAttribute("type", "button");
    backButton.setAttribute("data-focusable", "true");
    backButton.setAttribute("aria-label", "Voltar para a tela inicial");
    backButton.addEventListener("click", function () {
      global.NexoraApp.goBack();
    });
    header.appendChild(brand);
    header.appendChild(titleBlock);
    header.appendChild(backButton);

    function renderDetail() {
      var preview = createElement("div", "live-preview");
      var previewArtwork = createElement("div", "live-preview-artwork");
      var previewOrb = createElement("span", "live-preview-orb");
      var previewMark = createElement("span", "live-preview-mark", "N");
      var previewCopy = createElement("div", "live-preview-copy");
      var previewLabel = createElement("span", "live-preview-label", "PRÉVIA");
      var previewTitle = createElement("strong", "live-preview-title", selectedChannel.name);
      var previewNote = createElement("span", "live-preview-note",
        selectedChannel.url ? "Canal da sua playlist" : "Prévia ilustrativa — sem reprodução");
      var channelMeta = createElement("div", "live-channel-meta");
      var channelNumber = createElement("span", "live-channel-number", "CANAL " + selectedChannel.number);
      var channelName = createElement("h2", "live-selected-name", selectedChannel.name);
      var channelTagline = createElement("p", "live-channel-tagline", selectedChannel.tagline);
      var guide = createElement("section", "live-guide");
      var guideHeader = createElement("div", "live-guide-header");
      var guideTitle = createElement("h2", "live-guide-title", "GUIA DE PROGRAMAÇÃO");
      var guideDate = createElement("span", "live-guide-date", "HOJE");
      var guideList = createElement("div", "live-guide-list");
      var i;
      var program;
      var row;
      var actions;
      var favoriteButton;
      var watchButton;

      previewArtwork.appendChild(previewOrb);
      previewArtwork.appendChild(previewMark);
      previewCopy.appendChild(previewLabel);
      previewCopy.appendChild(previewTitle);
      previewCopy.appendChild(previewNote);
      preview.appendChild(previewArtwork);
      preview.appendChild(previewCopy);
      channelMeta.appendChild(channelNumber);
      channelMeta.appendChild(channelName);
      channelMeta.appendChild(channelTagline);
      guideHeader.appendChild(guideTitle);
      guideHeader.appendChild(guideDate);
      for (i = 0; i < (selectedChannel.programs || []).length; i += 1) {
        program = selectedChannel.programs[i];
        row = createElement("div", "live-program");
        row.appendChild(createElement("span", "live-program-state", program.state));
        row.appendChild(createElement("time", "live-program-time", program.time));
        row.appendChild(createElement("span", "live-program-title", program.title));
        guideList.appendChild(row);
      }
      guide.appendChild(guideHeader);
      guide.appendChild(guideList);
      while (detail.firstChild) {
        detail.removeChild(detail.firstChild);
      }
      detail.appendChild(preview);
      detail.appendChild(channelMeta);
      detail.appendChild(guide);
      actions = createElement("div", "live-channel-actions");
      favoriteButton = createElement("button", "live-favorite-button",
        isFavorite(selectedChannel) ? "REMOVER DOS FAVORITOS" : "ADICIONAR AOS FAVORITOS");
      favoriteButton.setAttribute("type", "button");
      favoriteButton.setAttribute("data-focusable", "true");
      favoriteButton.setAttribute("aria-pressed", isFavorite(selectedChannel) ? "true" : "false");
      favoriteButton.addEventListener("click", function () {
        try {
          favorites = global.NexoraMediaLibrary.setFavorite(selectedChannel.id,
            !isFavorite(selectedChannel));
          status.className = "live-status";
          status.textContent = entries ? "CANAIS DA PLAYLIST" : "SINAL DE DEMONSTRAÇÃO";
          renderCategories();
          renderChannels();
        } catch (error) {
          status.className = "live-status is-error";
          status.textContent = error.message;
        }
      });
      actions.appendChild(favoriteButton);
      if (selectedChannel.url) {
        watchButton = createElement("button", "live-watch-button", "ASSISTIR CANAL");
        watchButton.setAttribute("type", "button");
        watchButton.setAttribute("data-focusable", "true");
        watchButton.addEventListener("click", function () {
          global.NexoraApp.mountScreen(global.NexoraPlayerScreen.createScreen(selectedChannel));
        });
        actions.appendChild(watchButton);
      }
      detail.appendChild(actions);
    }

    function renderChannels() {
      var visibleChannels = [];
      var i;
      var button;
      var channel;
      var badge;
      var copy;
      var name;
      var tagline;
      var number;

      for (i = 0; i < activeChannels.length; i += 1) {
        if (activeCategory === "favorites" ? isFavorite(activeChannels[i]) :
            activeCategory === "all" || activeChannels[i].categoryId === activeCategory ||
            activeChannels[i].category === activeCategory) {
          visibleChannels.push(activeChannels[i]);
        }
      }
      if (!visibleChannels.length) {
        selectedChannel = null;
        while (channelList.firstChild) {
          channelList.removeChild(channelList.firstChild);
        }
        while (detail.firstChild) {
          detail.removeChild(detail.firstChild);
        }
        if (sourceLoadError) {
          var errorMessage = createElement("p", "live-source-error", sourceLoadError);
          var retryButton = createElement("button", "live-watch-button", "TENTAR NOVAMENTE");
          retryButton.setAttribute("type", "button");
          retryButton.setAttribute("data-focusable", "true");
          retryButton.addEventListener("click", loadPlaylist);
          detail.appendChild(errorMessage);
          detail.appendChild(retryButton);
        } else {
          detail.textContent = activeCategory === "favorites" ?
            "Nenhum canal favorito nesta playlist." : "Nenhum canal nesta categoria.";
        }
        return;
      }

      if (!selectedChannel || activeCategory !== "all" && activeCategory !== "favorites" &&
          selectedChannel.categoryId !== activeCategory && selectedChannel.category !== activeCategory) {
        selectedChannel = visibleChannels[0];
      } else if (activeCategory === "favorites" &&
          (!selectedChannel || !isFavorite(selectedChannel))) {
        selectedChannel = visibleChannels[0];
      }

      while (channelList.firstChild) {
        channelList.removeChild(channelList.firstChild);
      }
      for (i = 0; i < visibleChannels.length; i += 1) {
        channel = visibleChannels[i];
        button = createElement("button", "live-channel");
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-channel-id", channel.id);
        button.setAttribute("aria-pressed", channel.id === selectedChannel.id ? "true" : "false");
        if (focusType === "channel" && channel.id === focusedChannelId) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        badge = createElement("span", "live-channel-badge", channel.number);
        copy = createElement("span", "live-channel-copy");
        name = createElement("strong", "live-channel-name", channel.name);
        tagline = createElement("span", "live-channel-description", channel.tagline);
        number = createElement("span", "live-channel-chevron", "›");
        if (isFavorite(channel)) {
          button.appendChild(createElement("span", "live-channel-favorite", "★"));
        }
        copy.appendChild(name);
        copy.appendChild(tagline);
        button.appendChild(badge);
        button.appendChild(copy);
        button.appendChild(number);
        button.addEventListener("click", (function (selected) {
          return function () {
            focusType = "channel";
            focusedChannelId = selected.id;
            selectedChannel = selected;
            renderChannels();
            renderDetail();
          };
        }(channel)));
        channelList.appendChild(button);
      }
      renderDetail();
    }

    function renderCategories() {
      var i;
      var button;
      while (categoryList.firstChild) {
        categoryList.removeChild(categoryList.firstChild);
      }
      activeCategories = withFavoritesCategory(activeCategories);
      for (i = 0; i < activeCategories.length; i += 1) {
        button = createElement("button", "live-category", activeCategories[i].name);
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-category-id", activeCategories[i].id);
        button.setAttribute("aria-pressed", activeCategories[i].id === activeCategory ? "true" : "false");
        if (focusType === "category" && activeCategories[i].id === focusedCategoryId) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        button.addEventListener("click", (function (category) {
          return function () {
            focusType = "category";
            focusedCategoryId = category.id;
            activeCategory = category.id;
            selectedChannel = null;
            renderCategories();
            renderChannels();
          };
        }(activeCategories[i])));
        categoryList.appendChild(button);
      }
    }

    function loadPlaylist() {
      status.className = "live-status";
      status.textContent = "CARREGANDO PLAYLIST";
      global.NexoraMediaSource.loadConfigured(function (error, loaded) {
        if (error) {
          sourceLoadError = error.message;
          activeChannels = [];
          activeCategories = [{ id: "all", name: "Todos" }];
          selectedChannel = null;
          status.className = "live-status is-error";
          status.textContent = "ERRO AO CARREGAR CANAIS";
          renderCategories();
          renderChannels();
          return;
        }
        if (loaded) {
          sourceLoadError = "";
          setEntries(loaded);
          activeChannels = createSourceChannels(loaded);
          activeCategories = withFavoritesCategory(createSourceCategories(activeChannels));
          selectedChannel = activeChannels[0] || null;
          activeCategory = "all";
          status.className = "live-status";
          status.textContent = "CANAIS DA PLAYLIST";
          renderCategories();
          renderChannels();
        }
      });
    }

    loadFavorites();
    activeCategories = withFavoritesCategory(activeCategories);
    categoryPanel.appendChild(categoryHeading);
    categoryPanel.appendChild(categoryList);
    channelPanel.appendChild(channelHeading);
    channelPanel.appendChild(channelList);
    browse.appendChild(categoryPanel);
    browse.appendChild(channelPanel);
    content.appendChild(browse);
    content.appendChild(detail);
    screen.appendChild(header);
    screen.appendChild(content);
    renderCategories();
    renderChannels();
    if (!entries && global.NexoraMediaSource && global.NexoraMediaLibrary) {
      loadPlaylist();
    }

    return screen;
  }

  function createSourceChannels(entries) {
    var liveEntries = entries.filter(function (entry) {
      return entry.mediaType === "live";
    });
    return liveEntries.map(function (entry, index) {
      return {
        id: entry.id,
        category: entry.category || "Sem categoria",
        categoryId: "source-" + (entry.category || "Sem categoria").toLowerCase(),
        number: ("0" + (index + 1)).slice(-2),
        name: entry.title || "Canal sem nome",
        tagline: entry.category || "Canal da playlist",
        url: entry.url,
        programs: []
      };
    });
  }

  function createSourceCategories(sourceChannels) {
    var result = sourceEntries ? [{ id: "all", name: "Todos" }] : categories;
    var i;
    var category;
    if (!sourceEntries) {
      return result;
    }
    for (i = 0; i < sourceChannels.length; i += 1) {
      category = sourceChannels[i].category || "Sem categoria";
      if (!result.some(function (item) { return item.name === category; })) {
        result.push({
          id: "source-" + category.toLowerCase(),
          name: category
        });
      }
    }
    return result;
  }

  global.NexoraLiveTv = {
    createScreen: createScreen,
    setEntries: setEntries
  };
}(window));
