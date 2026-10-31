# Proposal

## Why

The current Filmes screen only displays a small fictional catalog, so users cannot find or play titles from their own collection. AXION needs a user-configured media source, remote-friendly search and playback, plus persistent favorites and playback progress so users can return to a title later.

## What Changes

- Allow the user to configure and retain a URL for their own M3U playlist, then load and parse its movie entries with clear loading, empty, and error states.
- Search the configured catalog by title and show the selected entry's available metadata.
- Add a playback layer that uses Samsung AVPlay on Tizen and the browser `<video>` element for desktop preview, with remote-friendly controls and loading/error states.
- Persist favorites and playback positions on the device; provide Favorites and Continue Watching views and resume playback from saved progress.
- Keep the existing fictional catalog available when no user source is configured. AXION will not provide playlists, stream URLs, or media.

## Capabilities

### New Capabilities
- `movie-catalog`: Load a user-owned M3U movie catalog and search its titles, while retaining the existing local demonstration catalog.
- `media-playback`: Play user-provided catalog entries through AVPlay on Tizen or `<video>` in a desktop browser.
- `media-library`: Persist favorites and playback progress locally, and expose Favorites and Continue Watching collections.

### Modified Capabilities
- None. No main specs are currently present in `openspec/specs/`.

## Impact

- Extends the Filmes screen and adds source configuration, search, Favorites, Continue Watching, and player interfaces.
- Adds M3U parsing, device-local persistence, AVPlay and browser-video adapters, and Tizen packaging permissions if required by the existing project structure.
- Requires network access to the playlist and its user-provided media URLs; source loading and unsupported playback failures must be surfaced in the interface.
- Updates browser fixtures and README instructions. No external service, framework, or bundled media is introduced.
