# Spec Delta

## Purpose

Keeps the user's favorites and unfinished playback available across app sessions on the same device, without requiring an account or cloud service.

## ADDED Requirements

### Requirement: Persist favorite titles on the device
The app SHALL let the user add and remove titles from Favorites and retain those choices across app restarts.

#### Scenario: Add a favorite
- **WHEN** the user marks a catalog title as a favorite
- **THEN** the app stores the choice locally and shows the title in Favorites

#### Scenario: Remove a favorite
- **WHEN** the user removes a title from Favorites
- **THEN** the app removes it from the collection and persists that change

### Requirement: Persist unfinished playback progress
The app SHALL store playback position and duration locally for each user-provided title that has started playing.

#### Scenario: Save playback progress
- **WHEN** playback reports a valid position and duration
- **THEN** the app saves progress locally so it remains available after restart

#### Scenario: Playback is nearly complete
- **WHEN** a title reaches at least 90 percent of its known duration
- **THEN** the app removes it from Continue Watching

### Requirement: Resume an unfinished title
The app SHALL provide a Continue Watching collection for unfinished titles with a way to resume from saved progress.

#### Scenario: Resume a listed title
- **WHEN** the user confirms an available title in Continue Watching
- **THEN** playback starts at its saved position

#### Scenario: Saved title is no longer available
- **WHEN** a saved title cannot be matched to the currently loaded user catalog
- **THEN** the app keeps its saved library data but does not offer unplayable content as an available resume action

### Requirement: Surface local persistence failures
The app SHALL communicate when local storage is unavailable or cannot save library changes.

#### Scenario: A favorite or progress update cannot be saved
- **WHEN** the device rejects a local library update
- **THEN** the app displays an error and does not indicate that the change was saved
