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

  function formatTime(seconds) {
    var value = Math.max(0, Math.floor(Number(seconds) || 0));
    var hours = Math.floor(value / 3600);
    var minutes = Math.floor((value % 3600) / 60);
    var remaining = value % 60;
    if (hours) {
      return hours + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + remaining).slice(-2);
    }
    return minutes + ":" + ("0" + remaining).slice(-2);
  }

  function createScreen(entry, options) {
    options = options || {};
    if (!entry || !entry.url || !/^https?:\/\//i.test(entry.url)) {
      throw new Error("Este título não tem um endereço de reprodução válido.");
    }

    var screen = createElement("section", "player-screen");
    var header = createElement("header", "player-header");
    var brand = createElement("div", "player-brand", "AXION");
    var heading = createElement("h1", "player-title", entry.title || "Sem título");
    var stage = createElement("div", "player-stage");
    var status = createElement("div", "player-status", "Preparando reprodução...");
    var controls = createElement("div", "player-controls");
    var seekBack = createElement("button", "player-control", "−10 s");
    var playPause = createElement("button", "player-control player-play", "CARREGANDO");
    var seekForward = createElement("button", "player-control", "+10 s");
    var back = createElement("button", "player-control player-back", "VOLTAR");
    var progress = createElement("div", "player-progress");
    var progressFill = createElement("span", "player-progress-fill");
    var time = createElement("span", "player-time", "0:00 / 0:00");
    var video = null;
    var adapter;
    var currentState = "loading";
    var closed = false;
    var resumePosition = Math.max(0, Number(options.resumePosition) || 0);
    var lastPosition = 0;
    var lastDuration = 0;
    var lastAttemptedPosition = -1;
    var lastAttemptedDuration = 0;
    var persistenceError = false;

    screen.setAttribute("aria-label", "Reprodutor de " + (entry.title || "filme"));
    heading.setAttribute("id", "player-title");
    screen.setAttribute("aria-labelledby", "player-title");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-label", "Progresso do filme");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");
    progressFill.setAttribute("aria-hidden", "true");

    function setButton(button, label, enabled) {
      button.textContent = label;
      button.disabled = !enabled;
      button.setAttribute("aria-disabled", enabled ? "false" : "true");
    }

    function updateProgress(position, duration) {
      var percentage = duration > 0 ? Math.max(0, Math.min(100, position / duration * 100)) : 0;
      progressFill.style.width = percentage + "%";
      progress.setAttribute("aria-valuenow", String(Math.round(percentage)));
      time.textContent = formatTime(position) + " / " + formatTime(duration);
    }

    function updateState(state) {
      var previousMessage = status.textContent;
      var retainPersistenceError = persistenceError;
      currentState = state;
      status.className = "player-status";
      if (state === "loading") {
        status.textContent = "Carregando vídeo...";
        status.className += " is-visible";
        setButton(playPause, "CARREGANDO", false);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      } else if (state === "buffering") {
        status.textContent = "Aguardando transmissão...";
        status.className += " is-visible";
        setButton(playPause, "PAUSAR", true);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      } else if (state === "error") {
        status.textContent = "Não foi possível reproduzir este vídeo. Verifique a conexão e o formato da mídia.";
        status.className += " is-visible is-error";
        setButton(playPause, "TENTAR NOVAMENTE", true);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      } else if (state === "playing") {
        status.textContent = "";
        setButton(playPause, "PAUSAR", true);
        setButton(seekBack, "−10 s", true);
        setButton(seekForward, "+10 s", true);
      } else if (state === "paused") {
        status.textContent = "Reprodução pausada.";
        status.className += " is-visible";
        setButton(playPause, "CONTINUAR", true);
        setButton(seekBack, "−10 s", true);
        setButton(seekForward, "+10 s", true);
      } else if (state === "ended") {
        status.textContent = "Reprodução concluída.";
        status.className += " is-visible";
        setButton(playPause, "REPRODUZIR NOVAMENTE", true);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      } else if (state === "closed") {
        setButton(playPause, "CARREGANDO", false);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      } else {
        status.textContent = "Preparando reprodução...";
        status.className += " is-visible";
        setButton(playPause, "CARREGANDO", false);
        setButton(seekBack, "−10 s", false);
        setButton(seekForward, "+10 s", false);
      }
      if (retainPersistenceError && state !== "error" && state !== "closed") {
        status.textContent = previousMessage;
        status.className = "player-status is-visible is-error";
      }
    }

    function onError(error) {
      updateState("error");
      if (error && error.message) {
        status.textContent = error.message;
      }
    }

    function showPersistenceError(error) {
      persistenceError = true;
      status.textContent = error.message;
      status.className = "player-status is-visible is-error";
    }

    function persistProgress(position, duration, force) {
      var completed;
      var reachedCompletion;
      if (!isFinite(Number(position)) || !isFinite(Number(duration)) ||
          Number(position) < 0 || Number(duration) <= 0 ||
          (!force && Number(position) < 1)) {
        return;
      }
      completed = Number(position) / Number(duration) >= 0.9;
      reachedCompletion = completed && (lastAttemptedPosition < 0 ||
        lastAttemptedPosition / lastAttemptedDuration < 0.9);
      if (!force && !reachedCompletion && lastAttemptedPosition >= 0 &&
          Math.abs(Number(position) - lastAttemptedPosition) < 5 &&
          Number(duration) === lastAttemptedDuration) {
        return;
      }
      lastAttemptedPosition = Number(position);
      lastAttemptedDuration = Number(duration);
      try {
        global.NexoraMediaLibrary.saveProgress(entry.id, Number(position), Number(duration));
        if (persistenceError && (currentState === "playing" || currentState === "paused")) {
          persistenceError = false;
          updateState(currentState);
        }
      } catch (error) {
        showPersistenceError(error);
      }
    }

    function onProgress(position, duration) {
      lastPosition = position;
      lastDuration = duration;
      updateProgress(position, duration);
      persistProgress(position, duration, false);
    }

    function persistCurrentProgress(force) {
      try {
        lastPosition = adapter.getPosition();
        lastDuration = adapter.getDuration();
        updateProgress(lastPosition, lastDuration);
        persistProgress(lastPosition, lastDuration, force);
      } catch (error) {
        showPersistenceError(error);
      }
    }

    function onState(state) {
      updateState(state);
      if (state === "playing" && resumePosition > 0) {
        adapter.seek(resumePosition);
        resumePosition = 0;
      }
    }

    if (!(global.webapis && global.webapis.avplay)) {
      video = options.videoElement || global.document.createElement("video");
      video.className = "player-video";
      video.setAttribute("aria-label", "Vídeo em reprodução");
      video.setAttribute("playsinline", "playsinline");
      stage.appendChild(video);
    }

    seekBack.setAttribute("type", "button");
    playPause.setAttribute("type", "button");
    seekForward.setAttribute("type", "button");
    back.setAttribute("type", "button");
    seekBack.setAttribute("data-focusable", "true");
    playPause.setAttribute("data-focusable", "true");
    seekForward.setAttribute("data-focusable", "true");
    back.setAttribute("data-focusable", "true");
    playPause.setAttribute("data-focused", "true");
    playPause.className += " is-focused";
    seekBack.setAttribute("aria-label", "Voltar dez segundos");
    playPause.setAttribute("aria-label", "Reproduzir ou pausar");
    seekForward.setAttribute("aria-label", "Avançar dez segundos");
    back.setAttribute("aria-label", "Voltar ao catálogo");

    controls.appendChild(seekBack);
    controls.appendChild(playPause);
    controls.appendChild(seekForward);
    controls.appendChild(back);
    progress.appendChild(progressFill);
    header.appendChild(brand);
    header.appendChild(heading);
    stage.appendChild(status);
    screen.appendChild(header);
    screen.appendChild(stage);
    screen.appendChild(progress);
    screen.appendChild(time);
    screen.appendChild(controls);

    adapter = options.adapterFactory ? options.adapterFactory({
      onState: onState,
      onProgress: onProgress,
      onError: onError,
      onEnded: function () {
        updateState("ended");
        persistCurrentProgress(true);
      }
    }, video) : global.NexoraPlayer.createAdapter({
      videoElement: video,
      handlers: {
        onState: onState,
        onProgress: onProgress,
        onError: onError,
        onEnded: function () {
          updateState("ended");
          persistCurrentProgress(true);
        }
      }
    });

    playPause.addEventListener("click", function () {
      if (currentState === "error" || currentState === "ended") {
        adapter.close();
        adapter.open(entry.url);
      } else if (currentState === "playing" || currentState === "buffering") {
        adapter.pause();
        persistCurrentProgress(true);
      } else if (currentState === "paused") {
        adapter.play();
      }
    });
    seekBack.addEventListener("click", function () {
      adapter.seek(adapter.getPosition() - 10);
    });
    seekForward.addEventListener("click", function () {
      adapter.seek(adapter.getPosition() + 10);
    });
    back.addEventListener("click", function () {
      global.NexoraApp.goBack();
    });

    screen.onBeforeHide = function () {
      if (!closed) {
        closed = true;
        persistCurrentProgress(true);
        adapter.close();
      }
    };

    adapter.open(entry.url);
    return screen;
  }

  global.NexoraPlayerScreen = {
    createScreen: createScreen
  };
}(window));
