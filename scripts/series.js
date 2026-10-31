(function (global) {
  "use strict";

  var sourceEntries = null;
  var accents = ["cyan", "rose", "violet", "amber", "green", "blue", "gold", "teal"];

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

  function normalize(value) {
    return String(value || "").toLowerCase()
      .replace(/[áàâãä]/g, "a")
      .replace(/[éèêë]/g, "e")
      .replace(/[íìîï]/g, "i")
      .replace(/[óòôõö]/g, "o")
      .replace(/[úùûü]/g, "u")
      .replace(/ç/g, "c");
  }

  function setEntries(entries) {
    if (Object.prototype.toString.call(entries) !== "[object Array]") {
      throw new Error("A lista de séries precisa ser um array.");
    }
    sourceEntries = entries.slice(0);
    if (global.NexoraMediaSource) {
      global.NexoraMediaSource.setEntries(sourceEntries);
    }
  }

  function getSeries(entries) {
    var episodes = entries.filter(function (entry) {
      return entry.mediaType === "series";
    });
    var series = [];
    var byTitle = {};
    var i;
    var entry;
    var key;
    var item;

    for (i = 0; i < episodes.length; i += 1) {
      entry = episodes[i];
      item = entry.seriesTitle || entry.title || "Série sem nome";
      key = normalize(item);
      if (!byTitle[key]) {
        byTitle[key] = {
          id: "series-" + key,
          title: item,
          category: entry.category || "Sem categoria",
          episodes: [],
          accent: accents[series.length % accents.length]
        };
        series.push(byTitle[key]);
      }
      byTitle[key].episodes.push(entry);
    }

    series.forEach(function (item) {
      item.episodes.sort(function (left, right) {
        return left.seasonNumber - right.seasonNumber ||
          left.episodeNumber - right.episodeNumber ||
          left.title.localeCompare(right.title);
      });
    });
    return series;
  }

  function createScreen() {
    var screen = createElement("section", "movies-screen series-screen");
    var header = createElement("header", "movies-header");
    var brand = createElement("div", "movies-brand");
    var brandName = createElement("div", "movies-brand-name");
    var titleBlock = createElement("div", "movies-title-block");
    var heading = createElement("h1", "movies-heading", "SÉRIES");
    var count = createElement("span", "movies-count", "CATÁLOGO");
    var back = createElement("button", "movies-back", "VOLTAR");
    var backArrow = createElement("span", "movies-back-arrow", "‹");
    var content = createElement("div", "movies-content");
    var genrePanel = createElement("section", "movies-genre-panel");
    var genreHeading = createElement("h2", "movies-section-heading", "GÊNEROS");
    var genreList = createElement("nav", "movies-genre-list");
    var catalog = createElement("section", "movies-catalog");
    var catalogHeading = createElement("div", "movies-catalog-heading");
    var catalogTitle = createElement("h2", "movies-section-heading", "EM DESTAQUE");
    var total = createElement("span", "movies-total");
    var search = createElement("input", "movies-search");
    var grid = createElement("div", "movies-grid");
    var pagination = createElement("div", "movies-pagination");
    var previous = createElement("button", "movies-page-button", "‹ ANTERIOR");
    var pageStatus = createElement("span", "movies-page-status", "1 / 1");
    var next = createElement("button", "movies-page-button", "PRÓXIMA ›");
    var details = createElement("section", "movies-details");
    var libraryStatus = createElement("p", "movies-library-status");
    var entries = global.NexoraMediaSource ?
      global.NexoraMediaSource.getEntries() : sourceEntries;
    var series = getSeries(entries || []);
    var categories = [{ id: "all", name: "Todos" }];
    var activeCategory = "all";
    var selectedSeries = null;
    var selectedEpisode = null;
    var favorites = [];
    var progress = {};
    var pageIndex = 0;
    var episodePage = 0;
    var pageSize = 8;
    var episodePageSize = 4;
    var sourceError = "";
    var sourceLoading = false;
    var focusedCard = "";
    var focusArea = "category";

    function updateCategories() {
      var i;
      var category;
      categories = [
        { id: "all", name: "Todos" },
        { id: "favorites", name: "Favoritos" },
        { id: "continue", name: "Continuar assistindo" }
      ];
      for (i = 0; i < series.length; i += 1) {
        category = series[i].category || "Sem categoria";
        if (!categories.some(function (item) { return item.name === category; })) {
          categories.push({ id: "series-category-" + (categories.length - 2), name: category });
        }
      }
      if (!categories.some(function (item) { return item.id === activeCategory; })) {
        activeCategory = "all";
      }
    }

    function isFavorite(item) {
      return favorites.indexOf(item.id) !== -1;
    }

    function seriesProgress(item) {
      var i;
      var saved;
      for (i = 0; i < item.episodes.length; i += 1) {
        saved = progress[item.episodes[i].id];
        if (saved && saved.position > 0 && saved.duration > 0 &&
            saved.position / saved.duration < 0.9) {
          return { episode: item.episodes[i], position: saved.position };
        }
      }
      return null;
    }

    function resumeEpisode(item) {
      var saved = seriesProgress(item);
      return saved ? saved.episode : item.episodes[0] || null;
    }

    function loadLibrary() {
      try {
        if (global.NexoraMediaLibrary) {
          favorites = global.NexoraMediaLibrary.getFavorites();
          progress = global.NexoraMediaLibrary.getProgress();
          libraryStatus.textContent = "";
          libraryStatus.className = "movies-library-status";
        }
      } catch (error) {
        libraryStatus.textContent = error.message;
        libraryStatus.className = "movies-library-status is-error";
      }
    }

    function matchingSeries() {
      var query = normalize(search.value);
      var categoryName = "";
      var i;
      for (i = 0; i < categories.length; i += 1) {
        if (categories[i].id === activeCategory) {
          categoryName = categories[i].name;
          break;
        }
      }
      return series.filter(function (item) {
        var saved = seriesProgress(item);
        var categoryMatches = activeCategory === "all" ||
          (activeCategory.indexOf("series-category-") === 0 && item.category === categoryName);
        var libraryMatches = activeCategory === "favorites" ? isFavorite(item) :
          activeCategory === "continue" ? !!saved : categoryMatches;
        return libraryMatches &&
          (!query || normalize(item.title).indexOf(query) !== -1);
      });
    }

    function renderCategories() {
      var i;
      var button;
      while (genreList.firstChild) {
        genreList.removeChild(genreList.firstChild);
      }
      for (i = 0; i < categories.length; i += 1) {
        button = createElement("button", "movies-genre", categories[i].name);
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-genre-id", categories[i].id);
        button.setAttribute("aria-pressed", categories[i].id === activeCategory ? "true" : "false");
        if (focusArea === "category" && categories[i].id === activeCategory) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        button.addEventListener("click", (function (category) {
          return function () {
            activeCategory = category.id;
            pageIndex = 0;
            focusedCard = "";
            focusArea = "category";
            selectedSeries = null;
            selectedEpisode = null;
            renderCategories();
            renderSeries();
          };
        }(categories[i])));
        genreList.appendChild(button);
      }
    }

    function renderDetails() {
      var poster;
      var meta;
      var episodeList;
      var episodePagination;
      var previousEpisode;
      var nextEpisode;
      var episodeStatus;
      var visibleEpisodes;
      var start;
      var i;
      var episode;
      var episodeButton;
      var actions;
      var favoriteButton;
      var playButton;
      var savedProgress;

      while (details.firstChild) {
        details.removeChild(details.firstChild);
      }
      details.appendChild(createElement("span", "movie-detail-label", "SELEÇÃO"));
      if (!selectedSeries) {
        details.appendChild(createElement("p", "movie-detail-synopsis",
          search.value ? "Nenhuma série corresponde à pesquisa." :
            "Nenhuma série encontrada nesta categoria."));
        return;
      }

      poster = createElement("div", "movie-feature-poster poster-" + selectedSeries.accent);
      poster.appendChild(createElement("span", "movie-poster-mark", "AX"));
      poster.appendChild(createElement("span", "movie-poster-eyebrow",
        selectedSeries.category.toUpperCase()));
      poster.appendChild(createElement("strong", "movie-poster-title", selectedSeries.title));
      details.appendChild(poster);
      details.appendChild(createElement("h2", "movie-detail-title", selectedSeries.title));

      meta = createElement("div", "movie-feature-meta");
      meta.appendChild(createElement("span", "movie-detail-genre",
        selectedSeries.category.toUpperCase()));
      meta.appendChild(createElement("span", "movie-detail-separator", "•"));
      meta.appendChild(createElement("span", "movie-detail-duration",
        selectedSeries.episodes.length + " EPISÓDIOS"));
      details.appendChild(meta);

      favoriteButton = createElement("button", "movie-favorite-button",
        isFavorite(selectedSeries) ? "REMOVER DOS FAVORITOS" : "ADICIONAR AOS FAVORITOS");
      favoriteButton.setAttribute("type", "button");
      favoriteButton.setAttribute("data-focusable", "true");
      favoriteButton.setAttribute("aria-pressed", isFavorite(selectedSeries) ? "true" : "false");
      favoriteButton.addEventListener("click", function () {
        try {
          favorites = global.NexoraMediaLibrary.setFavorite(selectedSeries.id,
            !isFavorite(selectedSeries));
          libraryStatus.textContent = "";
          libraryStatus.className = "movies-library-status";
          renderCategories();
          renderSeries();
        } catch (error) {
          libraryStatus.textContent = error.message;
          libraryStatus.className = "movies-library-status is-error";
        }
      });

      episodeList = createElement("div", "series-episode-list");
      start = episodePage * episodePageSize;
      visibleEpisodes = selectedSeries.episodes.slice(start, start + episodePageSize);
      for (i = 0; i < visibleEpisodes.length; i += 1) {
        episode = visibleEpisodes[i];
        episodeButton = createElement("button", "series-episode",
          episode.title || episode.episodeTitle || "Episódio");
        episodeButton.setAttribute("type", "button");
        episodeButton.setAttribute("data-focusable", "true");
        episodeButton.setAttribute("aria-pressed",
          selectedEpisode && episode.id === selectedEpisode.id ? "true" : "false");
        episodeButton.addEventListener("click", (function (selected) {
          return function () {
            selectedEpisode = selected;
            renderDetails();
          };
        }(episode)));
        episodeList.appendChild(episodeButton);
      }
      if (!visibleEpisodes.length) {
        episodeList.appendChild(createElement("p", "movie-detail-synopsis", "Nenhum episódio disponível."));
      }
      details.appendChild(episodeList);

      episodePagination = createElement("div", "series-episode-pagination");
      previousEpisode = createElement("button", "movies-page-button", "‹ EPISÓDIOS");
      previousEpisode.setAttribute("type", "button");
      previousEpisode.setAttribute("data-focusable", "true");
      previousEpisode.disabled = episodePage <= 0;
      episodeStatus = createElement("span", "movies-page-status",
        (episodePage + 1) + " / " + Math.max(1,
          Math.ceil(selectedSeries.episodes.length / episodePageSize)));
      nextEpisode = createElement("button", "movies-page-button", "EPISÓDIOS ›");
      nextEpisode.setAttribute("type", "button");
      nextEpisode.setAttribute("data-focusable", "true");
      nextEpisode.disabled = (episodePage + 1) * episodePageSize >= selectedSeries.episodes.length;
      previousEpisode.addEventListener("click", function () {
        episodePage = Math.max(0, episodePage - 1);
        renderDetails();
      });
      nextEpisode.addEventListener("click", function () {
        episodePage += 1;
        renderDetails();
      });
      episodePagination.appendChild(previousEpisode);
      episodePagination.appendChild(episodeStatus);
      episodePagination.appendChild(nextEpisode);
      details.appendChild(episodePagination);

      actions = createElement("div", "movie-detail-actions");
      actions.appendChild(favoriteButton);
      savedProgress = selectedEpisode && progress[selectedEpisode.id];
      playButton = createElement("button", "movie-play-button series-watch-button",
        selectedEpisode && selectedEpisode.url ?
          savedProgress && savedProgress.position > 0 ? "CONTINUAR ASSISTINDO" :
            "ASSISTIR EPISÓDIO" : "SELECIONE UM EPISÓDIO");
      playButton.setAttribute("type", "button");
      playButton.setAttribute("data-focusable", "true");
      playButton.disabled = !selectedEpisode || !selectedEpisode.url;
      playButton.addEventListener("click", function () {
        if (selectedEpisode && selectedEpisode.url) {
          global.NexoraApp.mountScreen(
            global.NexoraPlayerScreen.createScreen(selectedEpisode, {
              resumePosition: savedProgress ? savedProgress.position : 0
            }));
        }
      });
      actions.appendChild(playButton);
      details.appendChild(actions);
    }

    function renderSeries() {
      var filtered = sourceError || sourceLoading ? [] : matchingSeries();
      var pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
      var pageItems;
      var first;
      var i;
      var item;
      var button;
      var art;
      var copy;
      var savedProgress;
      if (pageIndex >= pageCount) {
        pageIndex = Math.max(0, pageCount - 1);
      }
      if (selectedSeries && !filtered.some(function (item) {
        return item.id === selectedSeries.id;
      })) {
        selectedSeries = null;
        selectedEpisode = null;
      }
      if (!selectedSeries && filtered.length) {
        selectedSeries = filtered[0];
        selectedEpisode = resumeEpisode(selectedSeries);
        episodePage = 0;
      }

      first = pageIndex * pageSize;
      pageItems = filtered.slice(first, first + pageSize);
      while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
      }
      total.textContent = sourceLoading ? "CARREGANDO" :
        sourceError ? "ERRO NA FONTE" : filtered.length + " SÉRIES";
      if (sourceLoading || sourceError || !filtered.length) {
        grid.appendChild(createElement("p", "movies-empty",
          sourceLoading ? "Carregando playlist..." : sourceError ||
            (search.value ? "Nenhuma série encontrada." : "Nenhuma série nesta categoria.")));
      }

      for (i = 0; i < pageItems.length; i += 1) {
        item = pageItems[i];
        button = createElement("button", "movie-card series-item");
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-series-id", item.id);
        button.setAttribute("aria-pressed", selectedSeries.id === item.id ? "true" : "false");
        if (focusArea === "series" && focusedCard === item.id) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        art = createElement("span", "movie-card-art poster-" + item.accent);
        art.appendChild(createElement("span", "movie-card-mark", "AX"));
        art.appendChild(createElement("span", "movie-card-art-title",
          (item.category || "SÉRIE").toUpperCase()));
        if (isFavorite(item)) {
          art.appendChild(createElement("span", "movie-card-favorite", "★ FAVORITO"));
        }
        savedProgress = seriesProgress(item);
        if (savedProgress) {
          art.appendChild(createElement("span", "movie-card-progress",
            "CONTINUAR · S" + ("0" + savedProgress.episode.seasonNumber).slice(-2) +
              "E" + ("0" + savedProgress.episode.episodeNumber).slice(-2)));
        }
        copy = createElement("span", "movie-card-copy");
        copy.appendChild(createElement("strong", "movie-card-title", item.title));
        copy.appendChild(createElement("span", "movie-card-genre",
          item.category + " · " + item.episodes.length + " EP."));
        button.appendChild(art);
        button.appendChild(copy);
        button.addEventListener("click", (function (selected) {
          return function () {
            selectedSeries = selected;
            selectedEpisode = resumeEpisode(selected);
            episodePage = 0;
            focusedCard = selected.id;
            focusArea = "series";
            renderSeries();
          };
        }(item)));
        grid.appendChild(button);
      }

      previous.disabled = pageIndex <= 0;
      next.disabled = pageIndex >= pageCount - 1;
      previous.setAttribute("aria-disabled", previous.disabled ? "true" : "false");
      next.setAttribute("aria-disabled", next.disabled ? "true" : "false");
      pageStatus.textContent = (pageIndex + 1) + " / " + pageCount;
      renderDetails();
    }

    function setPage(direction) {
      var pageCount = Math.ceil(matchingSeries().length / pageSize);
      pageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex + direction));
      selectedSeries = null;
      selectedEpisode = null;
      focusedCard = "";
      focusArea = "series";
      renderSeries();
    }

    screen.onAfterShow = function () {
      loadLibrary();
      renderCategories();
      renderSeries();
    };

    function showSourceError(error) {
      sourceLoading = false;
      sourceError = error.message + " Volte às Configurações para tentar novamente.";
      libraryStatus.textContent = sourceError;
      libraryStatus.className = "movies-library-status is-error";
      renderSeries();
    }

    screen.setAttribute("aria-label", "Catálogo de séries");
    genreList.setAttribute("aria-label", "Categorias de séries");
    grid.setAttribute("aria-label", "Séries disponíveis");
    details.setAttribute("aria-live", "polite");
    libraryStatus.setAttribute("role", "status");
    libraryStatus.setAttribute("aria-live", "polite");
    search.setAttribute("type", "search");
    search.setAttribute("placeholder", "PESQUISAR SÉRIE");
    search.setAttribute("aria-label", "Pesquisar séries por título");
    search.setAttribute("data-focusable", "true");
    back.setAttribute("type", "button");
    back.setAttribute("data-focusable", "true");
    back.setAttribute("aria-label", "Voltar para a tela inicial");
    backArrow.setAttribute("aria-hidden", "true");
    back.insertBefore(backArrow, back.firstChild);
    previous.setAttribute("type", "button");
    previous.setAttribute("data-focusable", "true");
    next.setAttribute("type", "button");
    next.setAttribute("data-focusable", "true");
    pageStatus.setAttribute("aria-live", "polite");
    back.addEventListener("click", function () {
      global.NexoraApp.goBack();
    });
    search.addEventListener("input", function () {
      pageIndex = 0;
      selectedSeries = null;
      selectedEpisode = null;
      focusedCard = "";
      focusArea = "search";
      renderSeries();
      search.className = "movies-search is-focused";
      search.setAttribute("data-focused", "true");
    });
    previous.addEventListener("click", function () { setPage(-1); });
    next.addEventListener("click", function () { setPage(1); });

    brandName.appendChild(createElement("span", "", "A"));
    brandName.appendChild(createElement("span", "brand-x", "X"));
    brandName.appendChild(createElement("span", "", "ION"));
    brand.appendChild(brandName);
    brand.appendChild(createElement("div", "movies-brand-subtitle", "IPTV PLAYER"));
    titleBlock.appendChild(heading);
    titleBlock.appendChild(count);
    header.appendChild(brand);
    header.appendChild(titleBlock);
    header.appendChild(back);

    genrePanel.appendChild(genreHeading);
    genrePanel.appendChild(genreList);
    genrePanel.appendChild(libraryStatus);
    catalogHeading.appendChild(catalogTitle);
    catalogHeading.appendChild(search);
    catalogHeading.appendChild(total);
    pagination.appendChild(previous);
    pagination.appendChild(pageStatus);
    pagination.appendChild(next);
    catalog.appendChild(catalogHeading);
    catalog.appendChild(grid);
    catalog.appendChild(pagination);
    content.appendChild(genrePanel);
    content.appendChild(catalog);
    content.appendChild(details);
    screen.appendChild(header);
    screen.appendChild(content);

    loadLibrary();
    updateCategories();
    renderCategories();
    renderSeries();

    if (!entries && global.NexoraMediaSource && global.NexoraMediaLibrary) {
      try {
        if (global.NexoraMediaLibrary.getSettings().playlistUrl) {
          sourceLoading = true;
          renderSeries();
          global.NexoraMediaSource.loadConfigured(function (error, loaded) {
            if (error) {
              showSourceError(error);
              return;
            }
            if (loaded) {
              setEntries(loaded);
              series = getSeries(loaded);
              updateCategories();
              renderCategories();
              renderSeries();
            }
          });
        }
      } catch (error) {
        showSourceError(error);
      }
    }
    return screen;
  }

  global.NexoraSeries = {
    createScreen: createScreen,
    setEntries: setEntries
  };
}(window));
