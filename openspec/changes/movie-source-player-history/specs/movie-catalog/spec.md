# Spec Delta

## Purpose

Lets users load their own movie catalog from a configured M3U playlist and find titles through an accessible, remote-friendly search while retaining a local demonstration catalog.

## ADDED Requirements

### Requirement: Configure and load a user-owned M3U playlist
The app SHALL let the user save a playlist URL on the device and load its movie entries into the catalog.

#### Scenario: Loading a valid playlist
- **WHEN** the user saves or reloads a reachable M3U playlist URL
- **THEN** the app requests that configured URL and displays the parsed movie entries

#### Scenario: Playlist cannot be loaded
- **WHEN** the URL is invalid, unreachable, blocked by the browser's network policy, or does not contain a valid playlist
- **THEN** the app displays an actionable error and allows retry without silently replacing the saved source

### Requirement: Parse movie titles and available metadata
The app SHALL display each playlist movie using its available title and metadata without inventing missing values.

#### Scenario: Playlist entry contains metadata
- **WHEN** a playlist entry provides a title or group metadata
- **THEN** the catalog displays the available values with the corresponding entry

#### Scenario: Playlist entry lacks optional metadata
- **WHEN** an entry omits optional metadata
- **THEN** the app keeps the entry searchable and displays a neutral fallback for the missing value

### Requirement: Search the loaded movie catalog
The catalog SHALL filter loaded entries by title using a case-insensitive, accent-insensitive query.

#### Scenario: Search finds matching titles
- **WHEN** the user enters a query matching one or more titles
- **THEN** the catalog displays only matching entries and keeps them navigable with the remote

#### Scenario: Search has no matches
- **WHEN** no loaded title matches the query
- **THEN** the catalog displays an explicit empty-result state

### Requirement: Use the demonstration catalog without a configured source
The app SHALL keep the existing fictional catalog available when no user playlist URL has been configured.

#### Scenario: No playlist is configured
- **WHEN** the user opens Filmes without a saved playlist URL
- **THEN** the app displays the local fictional demonstration catalog and does not request media

### Requirement: Keep large catalogs responsive
The catalog SHALL render only visible entries and a limited buffer while keeping the full result set navigable.

#### Scenario: Navigate a long result set
- **WHEN** the user moves through entries beyond the currently rendered area
- **THEN** the catalog renders the newly visible entries without mounting the entire result set
