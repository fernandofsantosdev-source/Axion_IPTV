# Spec Delta

## Purpose

Lets users browse a fictional movie catalog, filter titles by genre, and inspect a selected title through AXION's remote-friendly interface.

## ADDED Requirements

### Requirement: Movie catalog follows the AXION visual identity
The movie catalog SHALL use the app's dark visual theme with restrained neon accents and readable content sized for viewing from a distance.

#### Scenario: Opening the movie catalog
- **WHEN** the user opens Filmes from the home screen
- **THEN** the app displays a movie catalog in the AXION visual identity

### Requirement: Genre filters the movie catalog
The movie catalog SHALL provide fictional genres that filter the displayed movies.

#### Scenario: Selecting a genre
- **WHEN** the user confirms a genre
- **THEN** the catalog displays only movies belonging to that genre

### Requirement: Selecting a movie displays its details
The movie catalog SHALL display fictional metadata and a synopsis for the selected movie.

#### Scenario: Selecting a movie
- **WHEN** the user confirms a movie
- **THEN** the catalog marks that movie as selected and displays its title, genre, duration, and synopsis

### Requirement: Movie catalog does not start playback
The movie catalog SHALL use fictional movie data and SHALL NOT load or play movie media.

#### Scenario: A movie is selected for details
- **WHEN** the user selects a movie
- **THEN** the app displays its details without requesting or playing media

### Requirement: Movie catalog supports remote navigation and return
The movie catalog SHALL expose its genres and movies to the existing focus navigation and SHALL return to the home screen when the user sends Voltar.

#### Scenario: Returning from the catalog
- **WHEN** the user sends Voltar while the movie catalog is active
- **THEN** the app restores the home screen
