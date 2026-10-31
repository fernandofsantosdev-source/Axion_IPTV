(function () {
  "use strict";

  var timeElement = document.getElementById("clock-time");
  var dateElement = document.getElementById("clock-date");
  var liveCard = document.querySelector(".menu-card-live");
  var moviesCard = document.querySelector(".menu-card-movies");
  var seriesCard = document.querySelector(".menu-card-series");
  var settingsCard = document.querySelector(".menu-card-settings");
  var months = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  function updateClock() {
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();

    timeElement.textContent =
      (hours < 10 ? "0" : "") + hours + ":" +
      (minutes < 10 ? "0" : "") + minutes;
    timeElement.setAttribute("datetime",
      now.getFullYear() + "-" +
      (now.getMonth() + 1 < 10 ? "0" : "") + (now.getMonth() + 1) + "-" +
      (now.getDate() < 10 ? "0" : "") + now.getDate() + "T" +
      (hours < 10 ? "0" : "") + hours + ":" +
      (minutes < 10 ? "0" : "") + minutes);
    dateElement.textContent =
      now.getDate() + " de " + months[now.getMonth()] + " de " + now.getFullYear();
  }

  updateClock();
  window.setInterval(updateClock, 60000);

  liveCard.addEventListener("click", function () {
    window.NexoraApp.mountScreen(window.NexoraLiveTv.createScreen());
  });

  moviesCard.addEventListener("click", function () {
    window.NexoraApp.mountScreen(window.NexoraMovies.createScreen());
  });

  seriesCard.addEventListener("click", function () {
    window.NexoraApp.mountScreen(window.NexoraSeries.createScreen());
  });

  settingsCard.addEventListener("click", function () {
    window.NexoraApp.mountScreen(window.NexoraSettings.createScreen());
  });
}());
