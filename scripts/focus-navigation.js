(function (global) {
  "use strict";

  var KEY_CODES = {
    13: "ok",
    19: "ok",
    23: "ok",
    27: "back",
    8: "back",
    10009: "back",
    37: "left",
    38: "up",
    39: "right",
    40: "down"
  };

  function hasClass(element, name) {
    return (" " + element.className + " ").indexOf(" " + name + " ") !== -1;
  }

  function addClass(element, name) {
    if (!hasClass(element, name)) {
      element.className = element.className ? element.className + " " + name : name;
    }
  }

  function removeClass(element, name) {
    var classes = (" " + element.className + " ").replace(" " + name + " ", " ");
    element.className = classes.replace(/^\s+|\s+$/g, "");
  }

  function isAvailable(element, root) {
    var current = element;
    while (current && current !== root) {
      if (current.disabled || current.getAttribute("aria-disabled") === "true" ||
          current.getAttribute("aria-hidden") === "true" ||
          current.style.display === "none" || current.style.visibility === "hidden") {
        return false;
      }
      current = current.parentNode;
    }
    return current === root && element.getAttribute("data-focusable") !== null;
  }

  function createController(root, options) {
    var focused = null;
    var observer = null;
    var backHandler = options && options.onBack;

    function getCandidates() {
      var nodes = root.getElementsByTagName("*");
      var candidates = [];
      var i;
      for (i = 0; i < nodes.length; i += 1) {
        if (isAvailable(nodes[i], root)) {
          candidates.push(nodes[i]);
        }
      }
      return candidates;
    }

    function setFocus(element) {
      if (focused && focused !== element) {
        removeClass(focused, "is-focused");
        focused.removeAttribute("data-focused");
      }
      focused = element || null;
      if (focused) {
        addClass(focused, "is-focused");
        focused.setAttribute("data-focused", "true");
      }
    }

    function refresh() {
      var candidates = getCandidates();
      var i;
      if (focused && isAvailable(focused, root)) {
        return focused;
      }
      for (i = 0; i < candidates.length; i += 1) {
        if (hasClass(candidates[i], "is-focused")) {
          setFocus(candidates[i]);
          return focused;
        }
      }
      setFocus(candidates.length ? candidates[0] : null);
      return focused;
    }

    function move(direction) {
      var candidates = getCandidates();
      var source;
      var sourceRect;
      var sourceX;
      var sourceY;
      var best = null;
      var bestScore = Infinity;
      var i;
      var rect;
      var dx;
      var dy;
      var primary;
      var secondary;
      var score;

      refresh();
      source = focused;
      if (!source) {
        return;
      }
      sourceRect = source.getBoundingClientRect();
      sourceX = sourceRect.left + sourceRect.width / 2;
      sourceY = sourceRect.top + sourceRect.height / 2;

      for (i = 0; i < candidates.length; i += 1) {
        if (candidates[i] === source) {
          continue;
        }
        rect = candidates[i].getBoundingClientRect();
        dx = rect.left + rect.width / 2 - sourceX;
        dy = rect.top + rect.height / 2 - sourceY;
        primary = direction === "left" ? -dx :
          direction === "right" ? dx :
          direction === "up" ? -dy : dy;
        if (primary <= 0) {
          continue;
        }
        secondary = direction === "left" || direction === "right" ?
          Math.abs(dy) : Math.abs(dx);
        score = primary + secondary * 2;
        if (score < bestScore) {
          best = candidates[i];
          bestScore = score;
        }
      }
      if (best) {
        setFocus(best);
      }
    }

    function confirm() {
      refresh();
      if (focused && typeof focused.click === "function") {
        focused.click();
      }
    }

    function handleKeydown(event) {
      var action = KEY_CODES[event.keyCode];
      if (!action) {
        return;
      }
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (action === "back") {
        if (typeof backHandler === "function") {
          backHandler();
        }
      } else if (action === "ok") {
        confirm();
      } else {
        move(action);
      }
    }

    function handleMutation() {
      refresh();
    }

    global.document.addEventListener("keydown", handleKeydown, false);
    root.addEventListener("click", function (event) {
      var target = event.target;
      while (target && target !== root) {
        if (target.getAttribute && target.getAttribute("data-focusable") !== null) {
          if (isAvailable(target, root)) {
            setFocus(target);
          }
          return;
        }
        target = target.parentNode;
      }
    }, false);

    if (global.MutationObserver) {
      observer = new global.MutationObserver(handleMutation);
      observer.observe(root, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["aria-disabled", "aria-hidden", "disabled", "style"]
      });
    } else {
      root.addEventListener("DOMSubtreeModified", handleMutation, false);
    }

    refresh();
    return {
      refresh: refresh,
      move: move,
      confirm: confirm,
      setBackHandler: function (handler) {
        backHandler = handler;
      },
      destroy: function () {
        global.document.removeEventListener("keydown", handleKeydown, false);
        if (observer) {
          observer.disconnect();
        } else {
          root.removeEventListener("DOMSubtreeModified", handleMutation, false);
        }
        setFocus(null);
      }
    };
  }

  global.NexoraFocus = {
    create: createController
  };
}(window));
