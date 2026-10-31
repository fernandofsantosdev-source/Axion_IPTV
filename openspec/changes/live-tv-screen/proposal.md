# Proposal

## Why

The NEXORA home screen offers a TV ao vivo entry, but there is no live-TV screen for users to browse channels and see what is on. A dedicated screen completes that path while carrying the reference's dark neon identity into the app.

## What Changes

- Add a remote-friendly live-TV screen with channel categories, a channel list, and a program guide.
- Use fictional channel names and program data only; do not add real streams or playback URLs.
- Keep the screen integrated with the existing single-page app and central focus navigation.
- Provide a clear preview placeholder rather than starting real playback.

## Capabilities

### New Capabilities
- `live-tv`: Browsing fictional channels by category and viewing their program guide from the live-TV screen.

### Modified Capabilities
- None.

## Impact

- Adds a live-TV screen and its styles/scripts, and connects it to the existing home entry and screen history.
- Reuses the existing remote-focus module and single-page app shell.
- Adds no frameworks, packages, real content, streams, or player integration.
