(function (global) {
  "use strict";

  function createAdapter(options) {
    options = options || {};
    var avplay = options.avplay || (global.webapis && global.webapis.avplay);
    if (avplay) {
      return createAvplayAdapter(avplay, options.handlers || {});
    }
    return createVideoAdapter(options.videoElement || global.document.createElement("video"),
      options.handlers || {});
  }

  function createAvplayAdapter(avplay, handlers) {
    var state = "idle";
    var listener;

    function notifyState(nextState) {
      state = nextState;
      if (typeof handlers.onState === "function") {
        handlers.onState(state);
      }
    }

    function notifyError(error) {
      var failure = error instanceof Error ? error : new Error("O AVPlay não conseguiu reproduzir este conteúdo.");
      notifyState("error");
      if (typeof handlers.onError === "function") {
        handlers.onError(failure);
      }
    }

    function reportProgress(positionMilliseconds) {
      if (typeof handlers.onProgress === "function") {
        handlers.onProgress(Math.max(0, positionMilliseconds / 1000), adapter.getDuration());
      }
    }

    var adapter = {
      getPlatform: function () { return "avplay"; },
      getState: function () { return state; },
      open: function (url) {
        notifyState("loading");
        listener = {
          onbufferingstart: function () { notifyState("buffering"); },
          onbufferingcomplete: function () { notifyState("playing"); },
          oncurrentplaytime: reportProgress,
          onstreamcompleted: function () {
            notifyState("ended");
            if (typeof handlers.onEnded === "function") {
              handlers.onEnded();
            }
          },
          onerror: notifyError
        };
        try {
          avplay.setListener(listener);
          avplay.open(url);
          if (typeof avplay.setDisplayRect === "function") {
            avplay.setDisplayRect(0, 0, global.innerWidth, global.innerHeight);
          }
          avplay.prepareAsync(function () {
            try {
              avplay.play();
              notifyState("playing");
            } catch (error) {
              notifyError(error);
            }
          }, notifyError);
        } catch (error) {
          notifyError(error);
        }
      },
      play: function () {
        try {
          avplay.play();
          notifyState("playing");
        } catch (error) {
          notifyError(error);
        }
      },
      pause: function () {
        try {
          avplay.pause();
          notifyState("paused");
          reportProgress(adapter.getPosition() * 1000);
        } catch (error) {
          notifyError(error);
        }
      },
      seek: function (seconds) {
        var target = Math.max(0, Math.min(Number(seconds) || 0, adapter.getDuration()));
        try {
          avplay.seekTo(Math.round(target * 1000));
          reportProgress(target * 1000);
        } catch (error) {
          notifyError(error);
        }
      },
      getPosition: function () {
        if (state === "idle" || state === "loading" || state === "closed") {
          return 0;
        }
        return Math.max(0, avplay.getCurrentTime() / 1000);
      },
      getDuration: function () {
        if (state === "idle" || state === "loading" || state === "closed") {
          return 0;
        }
        return Math.max(0, avplay.getDuration() / 1000);
      },
      close: function () {
        try {
          if (typeof avplay.stop === "function") {
            avplay.stop();
          }
        } catch (error) {
          notifyError(error);
        }
        try {
          avplay.close();
          notifyState("closed");
        } catch (error) {
          notifyError(error);
        }
      }
    };
    return adapter;
  }

  function createVideoAdapter(video, handlers) {
    var state = "idle";
    var closed = false;

    function notifyState(nextState) {
      state = nextState;
      if (typeof handlers.onState === "function") {
        handlers.onState(state);
      }
    }

    function notifyError(error) {
      var failure = error instanceof Error ? error : new Error("O navegador não conseguiu reproduzir este conteúdo.");
      notifyState("error");
      if (typeof handlers.onError === "function") {
        handlers.onError(failure);
      }
    }

    function reportProgress() {
      var duration = Number(video.duration);
      var position = Number(video.currentTime);
      if (typeof handlers.onProgress === "function" && isFinite(position)) {
        handlers.onProgress(Math.max(0, position), isFinite(duration) ? Math.max(0, duration) : 0);
      }
    }

    function startPlayback() {
      var result;
      if (closed) {
        return;
      }
      try {
        result = video.play();
        if (result && typeof result.then === "function") {
          result.then(function () {
            if (!closed && !video.paused) {
              notifyState("playing");
            }
          }, function (error) {
            if (!closed) {
              notifyError(error);
            }
          });
        } else {
          notifyState("playing");
        }
      } catch (error) {
        notifyError(error);
      }
    }

    video.addEventListener("loadstart", function () { notifyState("loading"); });
    video.addEventListener("waiting", function () { notifyState("buffering"); });
    video.addEventListener("playing", function () { notifyState("playing"); });
    video.addEventListener("pause", function () {
      if (!closed && !video.ended) {
        notifyState("paused");
        reportProgress();
      }
    });
    video.addEventListener("timeupdate", reportProgress);
    video.addEventListener("ended", function () {
      notifyState("ended");
      if (typeof handlers.onEnded === "function") {
        handlers.onEnded();
      }
      reportProgress();
    });
    video.addEventListener("error", function () {
      notifyError(new Error("O navegador não conseguiu abrir o endereço de mídia. Verifique o formato e a conexão."));
    });

    return {
      getPlatform: function () { return "video"; },
      getState: function () { return state; },
      getVideoElement: function () { return video; },
      open: function (url) {
        closed = false;
        notifyState("loading");
        video.preload = "auto";
        video.src = url;
        video.load();
        startPlayback();
      },
      play: startPlayback,
      pause: function () {
        try {
          video.pause();
          notifyState("paused");
          reportProgress();
        } catch (error) {
          notifyError(error);
        }
      },
      seek: function (seconds) {
        var duration = Number(video.duration);
        var target = Math.max(0, Number(seconds) || 0);
        if (isFinite(duration) && duration > 0) {
          target = Math.min(target, duration);
        }
        try {
          video.currentTime = target;
          reportProgress();
        } catch (error) {
          notifyError(error);
        }
      },
      getPosition: function () {
        return isFinite(Number(video.currentTime)) ? Math.max(0, Number(video.currentTime)) : 0;
      },
      getDuration: function () {
        return isFinite(Number(video.duration)) ? Math.max(0, Number(video.duration)) : 0;
      },
      close: function () {
        closed = true;
        var closeError = null;
        try {
          video.pause();
        } catch (error) {
          closeError = error;
        }
        video.removeAttribute("src");
        try {
          video.load();
        } catch (error) {
          closeError = closeError || error;
        }
        if (closeError) {
          notifyError(closeError);
        } else {
          notifyState("closed");
        }
      }
    };
  }

  global.NexoraPlayer = {
    createAdapter: createAdapter
  };
}(window));
