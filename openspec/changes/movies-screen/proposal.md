# Proposal

## Why

The AXION home screen exposes a Filmes entry, but it does not yet lead to a movie catalog. A dedicated browsing screen will make that entry useful while extending the app's dark neon identity to another section.

## What Changes

- Add a remote-friendly movie catalog with genre filters and a bounded collection of fictional titles.
- Show the selected movie's fictional metadata and synopsis without starting playback.
- Connect the Filmes home card to the catalog and support returning through the existing screen history.
- Keep the design compatible with the existing static HTML/CSS/JavaScript app and older Tizen browsers.

## Capabilities

### New Capabilities
- `movie-catalog`: Browsing and filtering fictional movies and inspecting a selected title.

### Modified Capabilities
- None.

## Impact

- Adds a movie catalog screen, styles, local demonstration data, browser fixture, and home-card integration.
- Reuses the AXION app shell and central remote-focus navigation.
- Adds no frameworks, packages, remote artwork, media streams, or player integration.
