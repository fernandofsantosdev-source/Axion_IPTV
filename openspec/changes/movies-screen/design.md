# Design

## Context

See [proposal.md](./proposal.md) for motivation and [specs/movie-catalog/spec.md](./specs/movie-catalog/spec.md) for observable behavior. AXION is a static HTML/CSS/JavaScript app with a single-page shell, a central remote-focus controller, and the live-TV view as the closest interaction and styling reference. The target remains older Tizen browsers and a 1920×1080 canvas with 5% safe margins.

## Goals / Non-Goals

**Goals:**
- Keep genre selection, movie browsing, and title details in one remote-friendly screen.
- Reuse the existing shell, focus behavior, and visual language without duplicating navigation infrastructure.
- Keep the initial catalog deliberately small and entirely local.

**Non-Goals:**
- Search, sorting, persistence, watchlists, or fetching a catalog from a service.
- Real movie posters, externally hosted images, media URLs, AVPlay, or browser video.

## Decisions

- **A genre rail, poster grid, and details panel.** Use a compact genre list on the left, a bounded grid of fictional movies in the center, and details for the selected title on the right. This preserves a clear browsing hierarchy while adapting the live-TV screen's dark panels and neon accents. A long horizontal carousel was rejected because it hides the catalog's breadth and makes focus navigation less predictable.
- **Local fictional catalog with CSS poster art.** Store a small fixed set of fictional titles, genres, durations, ratings, and synopses in the screen module. Render poster-like cards from local text and gradients, avoiding remote image requests, file-size variants, and copyrighted artwork.
- **Selection updates details, not playback.** OK on a movie selects it and updates the details panel. There is no play control or media element in this change, keeping the catalog separate from the future player.
- **Reuse central focus and screen history.** Wire the Filmes home card to the catalog module using the existing app shell. Mark genre and movie cards as focusable; keep arrow movement, OK, and Voltar centralized. When a genre filters out the focused movie, move focus to the selected genre or first visible movie deterministically.
- **Bounded initial rendering.** Start with a fixed set that fits the catalog viewport, so the complete small grid can remain mounted without virtualization. If the catalog later grows, virtualize before expanding the rendered list.
- **Animation and visual effects stay lightweight.** Any focus transition uses only `transform` and `opacity`; avoid `backdrop-filter`, blur filters, and motion over media.

## Risks / Trade-offs

- **Grid focus can move to an unexpected row or panel** → Keep DOM order aligned with visual order and validate all four directions, genre filtering, selection, and return using the existing focus module.
- **CSS poster art can be mistaken for real media artwork** → Use obvious fictional titles and typography-led decorative gradients, with no imported images.
- **The small initial set may not exercise long-list behavior** → Keep the screen layout bounded and document the threshold for introducing virtualization when the catalog grows.

## Migration Plan

No persisted data or external services are involved. Add the screen as a static view, connect the home entry, and verify browser navigation. Rollback consists of removing the catalog view and its entry-point wiring.
