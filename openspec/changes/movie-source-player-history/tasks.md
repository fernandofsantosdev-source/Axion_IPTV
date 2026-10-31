# Tasks

## 1. User playlist source

- [x] 1.1 Add a Settings screen to enter, validate, save, and reload the user's M3U URL; verify persisted settings, invalid input, storage failures, and the no-source startup state in a browser fixture.
- [x] 1.2 Implement legacy-compatible playlist requests and M3U/EXTINF parsing; verify metadata, malformed input, network/CORS errors, and retry behavior with mocked requests, and document source setup and local-storage limitations in README.md.

## 2. Searchable movie catalog

- [x] 2.1 Connect loaded entries to Filmes, add case- and accent-insensitive title search with the fictional fallback, and render large results in bounded pages; verify match/no-match states, metadata, page controls, and remote focus in a browser fixture.

## 3. Cross-platform player

- [x] 3.1 Implement AVPlay and browser-video adapters with feature detection and a shared state/progress API; verify start, pause, seek, error, and close behavior using mocked adapters, and add Tizen package permissions only if the target package requires them.
- [x] 3.2 Add the remote-operable player screen and wire title selection to playback; verify loading/error states, control focus, Voltar cleanup, and browser playback with a local test fixture, and document desktop and Tizen validation.

## 4. Favorites and resume

- [x] 4.1 Add device-persistent Favorites and add/remove controls; verify that changes survive reload, unavailable entries remain non-actionable, and storage errors are visible in a browser fixture.
- [x] 4.2 Save player progress and add Continue Watching/resume behavior; verify position restoration, updates on pause/exit, removal at 90 percent completion, and unavailable-source handling in a browser fixture.

## 5. End-to-end verification

- [x] 5.1 Verify the remote flow from configuring a mocked playlist through search, favoriting, playback, resume, and return; update README status and documented project structure and confirm no fixture requests real media.

## Workflow follow-up

- Archive the change after implementation and verification, creating the requested local commit.
