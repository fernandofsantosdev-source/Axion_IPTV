(function (global) {
  "use strict";

  var sampleGenreNames = {
    adventure: "Aventura",
    scifi: "Ficção científica",
    drama: "Drama",
    mystery: "Mistério"
  };

  var movies = [
    {
      id: "crystal-city",
      genre: "scifi",
      title: "A Cidade de Cristal",
      eyebrow: "UM HORIZONTE DISTANTE",
      duration: "1h 48min",
      rating: "10",
      synopsis: "Em uma metrópole que reflete as estrelas, uma jovem cartógrafa encontra um mapa que muda tudo o que sabia sobre seu lar.",
      accent: "cyan"
    },
    {
      id: "last-lighthouse",
      genre: "drama",
      title: "O Último Farol",
      eyebrow: "UMA LUZ NA TEMPESTADE",
      duration: "1h 56min",
      rating: "12",
      synopsis: "Uma antiga guardiã do litoral e seu neto tentam manter acesa a luz que orienta os viajantes durante a noite mais longa do ano.",
      accent: "rose"
    },
    {
      id: "star-route",
      genre: "adventure",
      title: "Rota das Estrelas",
      eyebrow: "A VIAGEM COMEÇA AQUI",
      duration: "2h 04min",
      rating: "10",
      synopsis: "Dois amigos partem em busca de uma estação esquecida e descobrem que a maior aventura pode estar no caminho de volta.",
      accent: "violet"
    },
    {
      id: "electric-night",
      genre: "mystery",
      title: "Noite Elétrica",
      eyebrow: "A CIDADE GUARDA SEGREDOS",
      duration: "1h 42min",
      rating: "14",
      synopsis: "Durante uma queda de energia, uma restauradora de letreiros encontra pistas escondidas nas fachadas iluminadas da cidade.",
      accent: "amber"
    },
    {
      id: "beyond-the-map",
      genre: "adventure",
      title: "Além do Mapa",
      eyebrow: "NENHUM CAMINHO É IGUAL",
      duration: "1h 51min",
      rating: "10",
      synopsis: "Uma equipe de exploradores segue coordenadas desenhadas à mão até um vale que não aparece em nenhum atlas.",
      accent: "green"
    },
    {
      id: "between-two-suns",
      genre: "scifi",
      title: "Entre Dois Sóis",
      eyebrow: "DOIS MUNDOS, UMA ESCOLHA",
      duration: "2h 01min",
      rating: "12",
      synopsis: "Uma engenheira recebe mensagens de uma estação remota e precisa decidir qual futuro merece ser lembrado.",
      accent: "blue"
    },
    {
      id: "quiet-signal",
      genre: "drama",
      title: "Sinal Silencioso",
      eyebrow: "OUÇA O QUE NÃO FOI DITO",
      duration: "1h 38min",
      rating: "Livre",
      synopsis: "Uma jovem radialista cria um programa noturno que aproxima vizinhos e transforma pequenas histórias em grandes encontros.",
      accent: "gold"
    },
    {
      id: "glass-key",
      genre: "mystery",
      title: "A Chave de Vidro",
      eyebrow: "CADA PORTA TEM UMA HISTÓRIA",
      duration: "1h 47min",
      rating: "12",
      synopsis: "Ao organizar o arquivo de um antigo hotel, um bibliotecário encontra uma chave que abre uma sala ausente das plantas.",
      accent: "teal"
    }
  ];

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

  function normalizeSearch(value) {
    var normalized = String(value || "").toLowerCase();
    var accents = { "áàâãä": "a", "éèêë": "e", "íìîï": "i", "óòôõö": "o", "úùûü": "u", "ç": "c" };
    var key;
    for (key in accents) {
      if (Object.prototype.hasOwnProperty.call(accents, key)) {
        normalized = normalized.replace(new RegExp("[" + key + "]", "g"), accents[key]);
      }
    }
    return normalized;
  }

  function formatPlaybackTime(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    var minutes = Math.floor(value / 60);
    return minutes + ":" + ("0" + (value % 60)).slice(-2);
  }

  var loadedEntries = null;

  function setEntries(entries) {
    if (Object.prototype.toString.call(entries) !== "[object Array]") {
      throw new Error("A lista de filmes precisa ser um array.");
    }
    loadedEntries = entries.slice(0);
    if (global.NexoraMediaSource) {
      global.NexoraMediaSource.setEntries(loadedEntries);
    }
  }

  function createScreen() {
    var screen = createElement("section", "movies-screen");
    var header = createElement("header", "movies-header");
    var brand = createElement("div", "movies-brand");
    var brandName = createElement("div", "movies-brand-name");
    var titleBlock = createElement("div", "movies-title-block");
    var heading = createElement("h1", "movies-heading", "FILMES");
    var count = createElement("span", "movies-count", "CATÁLOGO");
    var backButton = createElement("button", "movies-back", "VOLTAR");
    var backArrow = createElement("span", "movies-back-arrow", "‹");
    var content = createElement("div", "movies-content");
    var genrePanel = createElement("section", "movies-genre-panel");
    var genreHeading = createElement("h2", "movies-section-heading", "GÊNEROS");
    var genreList = createElement("nav", "movies-genre-list");
    var catalog = createElement("section", "movies-catalog");
    var catalogHeading = createElement("div", "movies-catalog-heading");
    var catalogTitle = createElement("h2", "movies-section-heading", "EM DESTAQUE");
    var catalogTotal = createElement("span", "movies-total");
    var searchInput = createElement("input", "movies-search");
    var grid = createElement("div", "movies-grid");
    var pagination = createElement("div", "movies-pagination");
    var previousPage = createElement("button", "movies-page-button", "‹ ANTERIOR");
    var pageStatus = createElement("span", "movies-page-status");
    var nextPage = createElement("button", "movies-page-button", "PRÓXIMA ›");
    var details = createElement("section", "movies-details");
    var libraryStatus = createElement("p", "movies-library-status");
    var activeGenre = "all";
    var selectedMovie = null;
    var focusArea = "genre";
    var focusedGenre = "all";
    var focusedMovie = "";
    var pageIndex = 0;
    var pageSize = 8;
    var currentGenres = [];
    var sourceError = "";
    var sourceLoading = false;
    var favorites = [];
    var progress = {};

    screen.setAttribute("aria-label", "Catálogo de filmes");
    genreList.setAttribute("aria-label", "Gêneros de filmes");
    grid.setAttribute("aria-label", "Filmes disponíveis");
    details.setAttribute("aria-live", "polite");
    libraryStatus.setAttribute("role", "status");
    libraryStatus.setAttribute("aria-live", "polite");
    searchInput.setAttribute("type", "search");
    searchInput.setAttribute("placeholder", "PESQUISAR FILME");
    searchInput.setAttribute("aria-label", "Pesquisar filmes por título");
    searchInput.setAttribute("data-focusable", "true");
    previousPage.setAttribute("type", "button");
    previousPage.setAttribute("data-focusable", "true");
    nextPage.setAttribute("type", "button");
    nextPage.setAttribute("data-focusable", "true");
    pageStatus.setAttribute("aria-live", "polite");

    brandName.appendChild(createElement("span", "", "A"));
    brandName.appendChild(createElement("span", "brand-x", "X"));
    brandName.appendChild(createElement("span", "", "ION"));
    brand.appendChild(brandName);
    brand.appendChild(createElement("div", "movies-brand-subtitle", "IPTV PLAYER"));
    titleBlock.appendChild(heading);
    titleBlock.appendChild(count);
    backArrow.setAttribute("aria-hidden", "true");
    backButton.insertBefore(backArrow, backButton.firstChild);
    backButton.setAttribute("type", "button");
    backButton.setAttribute("data-focusable", "true");
    backButton.setAttribute("aria-label", "Voltar para a tela inicial");
    backButton.addEventListener("click", function () {
      global.NexoraApp.goBack();
    });

    function catalogEntries() {
      var sourceEntries = global.NexoraMediaSource ?
        global.NexoraMediaSource.getEntries() : loadedEntries;
      if (sourceEntries === null || sourceEntries === undefined) {
        return movies;
      }
      return sourceEntries.filter(function (entry) {
        return !entry.mediaType || entry.mediaType === "movie";
      });
    }

    function showLibraryError(message) {
      libraryStatus.textContent = message;
      libraryStatus.className = "movies-library-status is-error";
    }

    function loadFavorites() {
      try {
        favorites = global.NexoraMediaLibrary.getFavorites();
        progress = global.NexoraMediaLibrary.getProgress();
        libraryStatus.textContent = "";
        libraryStatus.className = "movies-library-status";
      } catch (error) {
        favorites = [];
        progress = {};
        showLibraryError(error.message);
      }
    }

    function isFavorite(id) {
      return favorites.indexOf(id) !== -1;
    }

    function progressFor(id) {
      return progress[id] || null;
    }

    function updateGenres() {
      var entries = catalogEntries();
      var result = [
        { id: "all", name: "Todos" },
        { id: "favorites", name: "Favoritos" },
        { id: "continue", name: "Continuar assistindo" }
      ];
      var i;
      var category;
      if (global.NexoraMediaSource && global.NexoraMediaSource.getEntries() !== null ||
          loadedEntries !== null) {
        for (i = 0; i < entries.length; i += 1) {
          category = entries[i].category || "Sem categoria";
          if (!result.some(function (item) { return item.name === category; })) {
            result.push({ id: "source-" + (result.length - 2), name: category });
          }
        }
      }
      currentGenres = result;
      if (!currentGenres.some(function (genre) { return genre.id === activeGenre; })) {
        activeGenre = "all";
      }
    }

    function matchingMovies() {
      var entries = catalogEntries();
      var query = normalizeSearch(searchInput.value);
      var results = [];
      var i;
      var item;
      var category;
      var activeCategory;
      var itemProgress;
      if (activeGenre.indexOf("source-") === 0) {
        for (i = 0; i < currentGenres.length; i += 1) {
          if (currentGenres[i].id === activeGenre) {
            activeCategory = currentGenres[i];
            break;
          }
        }
      }
      for (i = 0; i < entries.length; i += 1) {
        item = entries[i];
        category = item.category || "Sem categoria";
        itemProgress = progressFor(item.id);
        if ((activeGenre === "favorites" ? isFavorite(item.id) :
            activeGenre === "continue" ? !!itemProgress && itemProgress.position > 0 &&
              itemProgress.position / itemProgress.duration < 0.9 :
            activeGenre === "all" ||
            activeCategory && activeCategory.name === category) &&
            (!query || normalizeSearch(item.title).indexOf(query) !== -1)) {
          results.push(item);
        }
      }
      return results;
    }

    function renderDetails() {
      var poster;
      var meta;
      var genreName = "";
      var i;
      var playButton;
      var favoriteButton;
      var actions;
      var savedProgress;
      while (details.firstChild) {
        details.removeChild(details.firstChild);
      }
      details.appendChild(createElement("span", "movie-detail-label", "SELEÇÃO"));
      if (!selectedMovie) {
        details.appendChild(createElement("p", "movie-detail-synopsis", "Nenhum filme encontrado."));
        return;
      }
      poster = createElement("div", "movie-feature-poster poster-" + (selectedMovie.accent || "cyan"));
      poster.appendChild(createElement("span", "movie-poster-mark", "AX"));
      poster.appendChild(createElement("span", "movie-poster-eyebrow",
        selectedMovie.eyebrow || selectedMovie.category || "CATÁLOGO DA SUA FONTE"));
      poster.appendChild(createElement("strong", "movie-poster-title", selectedMovie.title || "Sem título"));
      meta = createElement("div", "movie-feature-meta");
      for (i = 0; i < currentGenres.length; i += 1) {
        if (currentGenres[i].id === selectedMovie.genre) {
          genreName = currentGenres[i].name;
          break;
        }
      }
      genreName = selectedMovie.category || genreName ||
        sampleGenreNames[selectedMovie.genre] || "Sem categoria";
      meta.appendChild(createElement("span", "movie-detail-genre", genreName.toUpperCase()));
      meta.appendChild(createElement("span", "movie-detail-separator", "•"));
      meta.appendChild(createElement("span", "movie-detail-duration", selectedMovie.duration || "—"));
      meta.appendChild(createElement("span", "movie-detail-rating", selectedMovie.rating || "—"));
      details.appendChild(poster);
      details.appendChild(createElement("h2", "movie-detail-title", selectedMovie.title || "Sem título"));
      details.appendChild(meta);
      details.appendChild(createElement("p", "movie-detail-synopsis",
        selectedMovie.synopsis || "Detalhes não fornecidos na playlist."));
      actions = createElement("div", "movie-detail-actions");
      favoriteButton = createElement("button", "movie-favorite-button",
        isFavorite(selectedMovie.id) ? "REMOVER DOS FAVORITOS" : "ADICIONAR AOS FAVORITOS");
      favoriteButton.setAttribute("type", "button");
      favoriteButton.setAttribute("data-focusable", "true");
      favoriteButton.setAttribute("aria-pressed", isFavorite(selectedMovie.id) ? "true" : "false");
      favoriteButton.addEventListener("click", function () {
        try {
          favorites = global.NexoraMediaLibrary.setFavorite(selectedMovie.id,
            !isFavorite(selectedMovie.id));
          libraryStatus.textContent = "";
          libraryStatus.className = "movies-library-status";
          renderGenres();
          renderMovies();
        } catch (error) {
          showLibraryError(error.message);
        }
      });
      actions.appendChild(favoriteButton);
      if (selectedMovie.url) {
        savedProgress = progressFor(selectedMovie.id);
        playButton = createElement("button", "movie-play-button",
          savedProgress && savedProgress.position > 0 ? "CONTINUAR ASSISTINDO" : "ASSISTIR");
        playButton.setAttribute("type", "button");
        playButton.setAttribute("data-focusable", "true");
        playButton.setAttribute("aria-label",
          (savedProgress ? "Continuar assistindo " : "Assistir ") + (selectedMovie.title || "filme"));
        playButton.addEventListener("click", function () {
          global.NexoraApp.mountScreen(global.NexoraPlayerScreen.createScreen(selectedMovie, {
            resumePosition: savedProgress ? savedProgress.position : 0
          }));
        });
        actions.appendChild(playButton);
      }
      details.appendChild(createElement("span", "movie-detail-note",
        selectedMovie.url ? "FONTE DO USUÁRIO" : "DETALHES ILUSTRATIVOS · SEM REPRODUÇÃO"));
      details.appendChild(actions);
    }

    function renderPagination(pageCount) {
      previousPage.disabled = pageIndex <= 0;
      nextPage.disabled = pageIndex >= pageCount - 1;
      previousPage.setAttribute("aria-disabled", previousPage.disabled ? "true" : "false");
      nextPage.setAttribute("aria-disabled", nextPage.disabled ? "true" : "false");
      pageStatus.textContent = (pageIndex + 1) + " / " + Math.max(1, pageCount);
    }

    function renderMovies() {
      var filtered = sourceError || sourceLoading ? [] : matchingMovies();
      var pageCount = Math.ceil(filtered.length / pageSize);
      var first;
      var last;
      var pageMovies;
      var i;
      var movie;
      var button;
      var art;
      var copy;
      var category;
      var itemProgress;
      if (pageIndex >= pageCount) {
        pageIndex = Math.max(0, pageCount - 1);
      }
      if (selectedMovie && !filtered.some(function (item) { return item.id === selectedMovie.id; })) {
        selectedMovie = null;
      }
      if (!selectedMovie && filtered.length) {
        selectedMovie = filtered[0];
      }
      first = pageIndex * pageSize;
      last = Math.min(first + pageSize, filtered.length);
      pageMovies = filtered.slice(first, last);
      while (grid.firstChild) {
        grid.removeChild(grid.firstChild);
      }
      catalogTotal.textContent = sourceLoading ? "CARREGANDO" :
        sourceError ? "ERRO NA FONTE" : filtered.length + " TÍTULOS";
      if (sourceLoading || sourceError || !filtered.length) {
        grid.appendChild(createElement("p", "movies-empty",
          sourceLoading ? "Carregando playlist..." : sourceError ||
            (searchInput.value ? "Nenhum filme encontrado." :
              activeGenre === "favorites" ? "Nenhum título favorito disponível nesta lista." :
                activeGenre === "continue" ? "Nenhum título disponível para continuar assistindo." :
                "Nenhum filme nesta categoria.")));
      }
      for (i = 0; i < pageMovies.length; i += 1) {
        movie = pageMovies[i];
        button = createElement("button", "movie-card");
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-movie-id", movie.id);
        button.setAttribute("aria-pressed", movie.id === selectedMovie.id ? "true" : "false");
        if (focusArea === "movie" && movie.id === focusedMovie) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        category = movie.category || "";
        for (var j = 0; !category && j < currentGenres.length; j += 1) {
          if (currentGenres[j].id === movie.genre) {
            category = currentGenres[j].name;
          }
        }
        art = createElement("span", "movie-card-art poster-" + (movie.accent || "cyan"));
        art.appendChild(createElement("span", "movie-card-mark", "AX"));
        art.appendChild(createElement("span", "movie-card-art-title", movie.eyebrow || category));
        if (isFavorite(movie.id)) {
          art.appendChild(createElement("span", "movie-card-favorite", "★ FAVORITO"));
        }
        itemProgress = progressFor(movie.id);
        if (itemProgress && itemProgress.position > 0) {
          art.appendChild(createElement("span", "movie-card-progress",
            "CONTINUAR · " + formatPlaybackTime(itemProgress.position)));
        }
        copy = createElement("span", "movie-card-copy");
        copy.appendChild(createElement("strong", "movie-card-title", movie.title || "Sem título"));
        copy.appendChild(createElement("span", "movie-card-genre", category || "Sem categoria"));
        button.appendChild(art);
        button.appendChild(copy);
        button.addEventListener("click", (function (selected) {
          return function () {
            focusArea = "movie";
            focusedMovie = selected.id;
            selectedMovie = selected;
            renderMovies();
          };
        }(movie)));
        grid.appendChild(button);
      }
      renderPagination(pageCount);
      renderDetails();
    }

    function renderGenres() {
      var i;
      var button;
      updateGenres();
      while (genreList.firstChild) {
        genreList.removeChild(genreList.firstChild);
      }
      for (i = 0; i < currentGenres.length; i += 1) {
        button = createElement("button", "movies-genre", currentGenres[i].name);
        button.setAttribute("type", "button");
        button.setAttribute("data-focusable", "true");
        button.setAttribute("data-genre-id", currentGenres[i].id);
        button.setAttribute("aria-pressed", currentGenres[i].id === activeGenre ? "true" : "false");
        if (focusArea === "genre" && focusedGenre === currentGenres[i].id) {
          button.className += " is-focused";
          button.setAttribute("data-focused", "true");
        }
        button.addEventListener("click", (function (genre) {
          return function () {
            focusArea = "genre";
            focusedGenre = genre.id;
            activeGenre = genre.id;
            selectedMovie = null;
            pageIndex = 0;
            renderGenres();
            renderMovies();
          };
        }(currentGenres[i])));
        genreList.appendChild(button);
      }
    }

    screen.onAfterShow = function () {
      loadFavorites();
      renderGenres();
      renderMovies();
    };

    function setPage(direction) {
      var pageCount = Math.ceil(matchingMovies().length / pageSize);
      pageIndex = Math.max(0, Math.min(pageCount - 1, pageIndex + direction));
      selectedMovie = null;
      focusArea = "movie";
      focusedMovie = "";
      searchInput.className = "movies-search";
      searchInput.removeAttribute("data-focused");
      renderMovies();
    }

    searchInput.addEventListener("input", function () {
      focusArea = "search";
      pageIndex = 0;
      selectedMovie = null;
      focusedMovie = "";
      renderMovies();
      searchInput.className = "movies-search is-focused";
      searchInput.setAttribute("data-focused", "true");
    });
    previousPage.addEventListener("click", function () { setPage(-1); });
    nextPage.addEventListener("click", function () { setPage(1); });

    header.appendChild(brand);
    header.appendChild(titleBlock);
    header.appendChild(backButton);

    genrePanel.appendChild(genreHeading);
    genrePanel.appendChild(genreList);
    genrePanel.appendChild(libraryStatus);
    catalogHeading.appendChild(catalogTitle);
    catalogHeading.appendChild(searchInput);
    catalogHeading.appendChild(catalogTotal);
    pagination.appendChild(previousPage);
    pagination.appendChild(pageStatus);
    pagination.appendChild(nextPage);
    catalog.appendChild(catalogHeading);
    catalog.appendChild(grid);
    catalog.appendChild(pagination);
    content.appendChild(genrePanel);
    content.appendChild(catalog);
    content.appendChild(details);
    screen.appendChild(header);
    screen.appendChild(content);
    loadFavorites();
    renderGenres();
    renderMovies();
    try {
      if (global.NexoraMediaLibrary && global.NexoraMediaSource &&
          global.NexoraMediaLibrary.getSettings().playlistUrl && loadedEntries === null) {
        sourceLoading = true;
        renderMovies();
        global.NexoraMediaSource.loadConfigured(
          function (error, entries) {
            sourceLoading = false;
            if (error) {
              sourceError = error.message + " Volte às Configurações para tentar novamente.";
            } else {
              sourceError = "";
              setEntries(entries);
              renderGenres();
            }
            renderMovies();
          });
      }
    } catch (error) {
      sourceError = error.message;
      renderMovies();
    }

    return screen;
  }

  global.NexoraMovies = {
    createScreen: createScreen,
    setEntries: setEntries
  };
}(window));
