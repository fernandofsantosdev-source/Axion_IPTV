# Design

## Context

See [proposal.md](./proposal.md) for motivation and [specs/live-tv/spec.md](./specs/live-tv/spec.md) for observable behavior. The app is a static HTML/CSS/JavaScript page with a central focus controller and screen history. The live-TV screen must preserve the reference's dark neon look, 5% safe area at 1920×1080, and compatibility with older Tizen browsers.

## Goals / Non-Goals

**Goals:**
- Integrate the live-TV view into the existing single-page shell and remote-focus model.
- Keep category, channel, and guide interactions deterministic with fictional local data.
- Keep the preview inert and the view lightweight on TV hardware.

**Non-Goals:**
- Decode playlists, contact a backend, load stream URLs, or start AVPlay or browser video.
- Add a player, real channel metadata, or remote image dependencies.

## Decisions

- **A two-column browse-and-preview layout.** Keep categories and channels together on the left, with the selected channel's inert preview and program guide on the right. This makes selection and guide information visible together and adapts the home screen's dark panels and neon accents without copying its menu-card layout.
- **Reuse the existing screen and focus APIs.** Mount the view through `NexoraApp` and mark only visible category/channel controls as focusable. Keep directional movement and Voltar in the central focus controller rather than adding screen-specific key handlers.
- **Keep demonstration data local and text-first.** Define fictional categories, channels, and programs in the screen module; use initials or simple inline artwork instead of remote logos. Selecting a channel updates the guide and placeholder only.
- **Bound rendering and motion.** Render only the visible portion of channel and program lists if their data outgrows the viewport. Any transitions use only `transform` and `opacity`; avoid `backdrop-filter`, `filter: blur`, and effects layered over the preview.
- **Preserve screen history by element.** The current shell saves `root.firstChild`, which can be a whitespace text node from the initial HTML. The integration must retain the active screen element, not a text node, so Voltar reliably restores the home screen.

## Risks / Trade-offs

- **Spatial focus can jump between columns in an unexpected order** → Keep controls grouped in visual/document order and verify every direction, category filtering, and return flow with the existing focus fixture and browser.
- **A preview may be mistaken for real playback** → Label it clearly as a demonstration placeholder and never attach a media source or playback adapter.
- **Large guide data can affect older TVs** → Keep the initial fictional catalog small and render only visible rows if the list grows.
- **The shell history currently includes initial-document whitespace** → Fix the element selection as part of this integration and cover opening/returning to the home screen.

## Migration Plan

No persisted data or external services are involved. Add the screen as a static view, connect the home entry, and verify browser navigation; rollback consists of removing that view and its entry-point wiring.
