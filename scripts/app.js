(function (global) {
  "use strict";

  var root = document.getElementById("app-root");
  var screenHistory = [];
  var currentScreen = null;
  var initialNode = root.firstChild;
  var focus = global.NexoraFocus.create(root, {
    onBack: function () {
      global.NexoraApp.goBack();
    }
  });

  while (initialNode && initialNode.nodeType !== 1) {
    initialNode = initialNode.nextSibling;
  }
  currentScreen = initialNode;

  function showScreen(element, keepHistory) {
    if (!element || !element.nodeType) {
      throw new Error("A tela precisa ser um elemento HTML.");
    }
    if (currentScreen && currentScreen !== element &&
        typeof currentScreen.onBeforeHide === "function") {
      currentScreen.onBeforeHide();
    }
    if (keepHistory && currentScreen) {
      screenHistory.push(currentScreen);
    }
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
    root.appendChild(element);
    currentScreen = element;
    if (typeof currentScreen.onAfterShow === "function") {
      currentScreen.onAfterShow();
    }
    focus.refresh();
  }

  global.NexoraApp = {
    mountScreen: function (element) {
      showScreen(element, true);
    },
    replaceScreen: function (element) {
      showScreen(element, false);
    },
    goBack: function () {
      if (screenHistory.length) {
        showScreen(screenHistory.pop(), false);
        return true;
      }
      return false;
    },
    getRoot: function () {
      return root;
    }
  };
}(window));
