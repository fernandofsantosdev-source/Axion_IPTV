# Design

## Context

See [proposal.md](./proposal.md) for motivation and the capability specs for observable behavior. The app is a static single-page HTML/CSS/JavaScript application with ES5-style global modules, a central spatial focus controller, and an eight-title local demo catalog. There is currently no settings screen, M3U loader, player, persistent library, or Tizen package manifest. The target includes older Tizen browsers, a 1920×1080 canvas, 5% safe margins, and lightweight transitions.

## Goals / Non-Goals

**Goals:**
- Keep the app usable without a configured source and without a network connection.
- Make playlist loading, search, player state, and library operations testable in a desktop browser without real streams.
- Keep media playback behind a small platform adapter and keep remote navigation in the shared focus system.
- Bound catalog DOM size for older TV hardware.

**Non-Goals:**
- Account registration, cloud synchronization, playlist hosting, provider discovery, or supplying any media.
- General-purpose browsing of USB or device folders; the selected source is a user-provided M3U URL.
- Guaranteeing playback of formats unsupported by the target TV or browser.

## Decisions

- **Configure the M3U URL through the existing Settings entry.** The home screen already exposes Configurações, but it is not wired to a screen. Reusing that entry provides a predictable place to save and reload the source instead of adding a URL field to the movie catalog.
- **Load playlists with legacy-compatible XMLHttpRequest and parse M3U/EXTINF records locally.** This avoids relying on newer `fetch` support in older Tizen browsers. A request is made only after the user saves or reloads a URL; errors, malformed input, and browser cross-origin restrictions are shown instead of silently falling back to an old result. No server proxy is introduced.
- **Keep source and library state in versioned device-local storage.** Persist the configured URL, favorite identifiers, and resume records in `localStorage`; validate stored data on read and report storage failures. Favorites and progress remain on that device and are not synced.
- **Use stable source-scoped entry identifiers.** Build an entry identity from the configured playlist identity and the entry URI, with title metadata retained for display. This lets a refresh reconcile saved items while avoiding accidental collisions between different playlists.
- **Select the player by feature detection.** A player adapter exposes open, play/pause, seek, progress, and close operations. Use AVPlay when the Samsung Tizen API is available and the browser video element otherwise. Stop and close the adapter when leaving playback; report progress on periodic updates and on pause/exit. Tizen packaging permissions are added only if needed by the target app package.
- **Keep large catalogs bounded with page-based rendering.** Parse and search the complete in-memory catalog, but mount only one small page of cards at a time, with remote-focusable previous/next controls. This preserves the existing geometric focus controller and avoids mounting thousands of nodes; full virtual scrolling was rejected because it would require a more invasive focus-controller redesign on legacy browsers.
- **Test media integrations without real streams.** Browser fixtures use a local sample M3U string, mocked XHR and player adapters, and fake media progress. Manual Tizen verification is needed for AVPlay permissions and device-supported formats.

## Risks / Trade-offs

- **Playlist host blocks cross-origin requests** → Show the network error and explain that the playlist host must permit access from the app; do not add an unrequested backend proxy.
- **Playlist URLs or stream URIs contain credentials** → Keep them on-device, never log or transmit them to an AXION service, and document that browser local storage is not encrypted.
- **AVPlay and browser video support different codecs and protocols** → Detect platform errors, keep the player in an explicit error state, and test with media the user is authorized to access.
- **M3U entry identities change when providers rotate stream URLs** → Keep unavailable library records locally but omit them from actionable resume results until a matching entry is loaded again.
- **A legacy TV has limited memory or storage** → Bound rendered cards, validate saved JSON before use, and surface local-storage quota or access errors.

## Migration Plan

There is no existing user library to migrate. Add the source settings, catalog loading, player adapters, and local library incrementally behind the existing app shell. If the feature must be rolled back, remove the new entry points and modules while leaving the fictional catalog available; do not clear user storage automatically.
