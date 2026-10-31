# Design

## Context

The app is plain JavaScript with classic script tags and XHR. `index.html` currently loads the media source without a local configuration module; `media-library.js` persists the Worker URL/token, `settings.js` renders and saves them, and `player-screen.js` can request a media ticket after playback errors. `config.xml` already contains `<access origin="*" subdomains="true"/>`. The previous Worker under `cloudflare-worker/` supports POST playlist and ticket endpoints plus media streaming, so it is broader than this change.

## Goals / Non-Goals

**Goals:**
- Keep the new path compatible with the project's classic-script approach and older Tizen WebViews.
- Store only the successful route per server in local app storage; do not copy credentials or playlist URLs into route history.
- Make the new `worker/` deployment the single documented playlist fallback.

**Non-Goals:**
- Proxying or transcoding video, hiding the client-configured token from users who can inspect the app package, publishing the Worker, or validating behavior on a physical Samsung TV.
- Fixing a provider's CORS policy or changing the origin's own response headers.

## Decisions

1. **Optional local JavaScript configuration**
   - Add a versioned `config.example.js` containing only placeholder values and load `config.local.js` before the media-source module. Add the latter to `.gitignore`; a missing or incomplete object means direct-only operation. Keep values in a small namespaced object rather than persisting the token in `localStorage`.
   - Alternative considered: retain the editable settings screen. Rejected because it leaves proxy details visible and stores the token in normal app storage.
   - The example is a template, not runtime fallback data; copying example values must not silently activate a fake proxy.

2. **Remember the successful route by server**
   - On first use of a server, direct is attempted first. After a successful load, store only the server origin and route name (direct or worker). On later loads, try the remembered route first and make at most one attempt through the other route if transport/access fails. Malformed M3U content is not retried as a transport failure.
   - Alternative considered: always start direct. Rejected for this change after the user selected the last-known-good route as the first attempt on subsequent loads.

3. **Direct video path**
   - Remove worker-ticket fallback from playback and leave AVPlay and browser video pointed at the original media URL. The new Worker exposes only the playlist endpoint.
   - Alternative considered: retain the old media proxy for playback failures. Rejected because the requested proxy scope is playlist-only and video must remain direct.

4. **CORS and Tizen access declaration**
   - Keep the existing wildcard `<access>` declaration: it permits the widget to make requests to external origins, but cannot make a provider grant JavaScript permission to read its response. Cross-origin response access remains subject to the server's CORS response headers; therefore a Worker fallback is still required for providers that block direct playlist reads.
   - Samsung's current [Smart TV Developer portal](https://developer.samsung.com/smarttv/develop) is the official platform entry point, but the prior deep-link documentation pages for manifest/network behavior returned 404 during this research. For the distinction between widget network access and browser CORS, use the [W3C Widget Access Request Policy](https://www.w3.org/TR/widgets-access/) and the [WHATWG Fetch CORS protocol](https://fetch.spec.whatwg.org/#http-cors-protocol) as normative references. The existing permission alone is not evidence that a provider's CORS response policy is bypassed.
   - Alternative considered: remove the proxy because `<access>` is wildcard. Rejected: the declaration cannot modify provider response headers.

5. **Playlist-only Worker request protocol**
   - Use a GET route with the configured bearer token in `Authorization` and the upstream playlist address in a dedicated request header, not in the Worker URL or logs. Support only CORS preflight OPTIONS as a non-fetch control response; it must never contact the upstream. Reject every other method. Return bounded playlist content and sanitized errors.
   - Alternative considered: put the source URL in the query string. Rejected because request URLs are more likely to appear in access logs, diagnostics, and copied links.

6. **Worker boundary and abuse controls**
   - Create `worker/` as the canonical Wrangler project. Require exact configured upstream host allowlisting, HTTPS for the Worker endpoint, safe HTTP(S) destination validation, denial of IP literals and local/private hostnames, redirect revalidation, bounded body size, bearer auth, and a Cloudflare rate-limit binding. Do not log request headers, source URLs, tokens, response bodies, or raw upstream errors. Ensure the route cannot issue tickets or proxy video.
   - Use Cloudflare's request source address as the rate-limit key; configure a conservative limit and describe how to tune it. A token embedded in a client app can be extracted, so host restrictions and rate limits remain necessary.
   - Alternative considered: generic URL proxy with only an authorization token. Rejected because it permits arbitrary forwarding and expands SSRF and abuse risks.

## Risks / Trade-offs

- [The provider may still reject a direct request even with the Tizen access declaration] → Try direct first and fall back once to the authenticated Worker.
- [A token shipped in a Tizen package is recoverable by a determined user] → Do not call it a server-held secret; keep host allowlisting and rate limits, and document personal-use limitations.
- [A remembered route can become stale] → On failure, try the other route once and replace the saved preference only after successful playlist parsing.
- [Cloudflare analytics or externally enabled diagnostics may capture request metadata] → The Worker itself emits no logs, keeps the playlist URL out of the request URL, and documentation must warn against enabling header/body logging or sharing diagnostic traces.
- [Older TV web engines may handle custom request headers/preflight inconsistently] → Test XHR CORS preflight locally and on the target Samsung TV; if device behavior differs, adjust the protocol without placing the token or playlist URL in a query string.

## Migration Plan

1. Add the local-config template and ignore rule, then change playlist loading and route persistence.
2. Remove Worker URL/token controls and remove video-ticket/proxy calls.
3. Add and test the playlist-only Worker in `worker/`; update root and Worker documentation to identify it as canonical and remove contradictory setup guidance for `cloudflare-worker/`.
4. Run Node syntax checks, local Worker security/rate-limit tests, and browser fixtures. Publish and TV-test only after the user configures and deploys the Worker.
5. Rollback by removing the local configuration include and disabling/removing the Worker setting; direct playlist loading and direct video playback remain functional.
