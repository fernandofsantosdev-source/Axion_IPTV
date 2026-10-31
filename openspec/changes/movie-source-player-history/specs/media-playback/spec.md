# Spec Delta

## Purpose

Plays titles selected from a user-configured catalog on Samsung TVs and in a desktop browser, with remote-friendly controls and clear playback status.

## ADDED Requirements

### Requirement: Play a selected user-provided title on the current platform
The app SHALL use Samsung AVPlay on a supported Tizen TV and the browser video element for desktop preview.

#### Scenario: Start playback on a Tizen TV
- **WHEN** the user starts a catalog entry on a supported Samsung TV
- **THEN** the app opens that entry through AVPlay

#### Scenario: Start playback in a desktop browser
- **WHEN** the user starts a catalog entry in a desktop browser
- **THEN** the app plays that entry through an HTML video element

### Requirement: Provide remote-friendly playback controls
The player SHALL expose visible controls that can be operated with the existing remote-focus navigation.

#### Scenario: Pause and resume playback
- **WHEN** the user confirms the pause or play control
- **THEN** playback pauses or resumes and the displayed state updates

#### Scenario: Seek within supported media
- **WHEN** the user confirms a seek control
- **THEN** playback moves within the duration supported by the active player

#### Scenario: Return from playback
- **WHEN** the user sends Voltar
- **THEN** the app stops playback and returns to the previous screen

### Requirement: Show loading, playback, and error states
The player SHALL communicate its current state and surface errors from unsupported or failed media.

#### Scenario: Media is opening
- **WHEN** the selected media is being opened
- **THEN** the player shows a loading state until playback starts or fails

#### Scenario: Media cannot be played
- **WHEN** the platform cannot open or decode the selected media
- **THEN** the player displays an actionable error instead of appearing to play

### Requirement: Report playback progress for resume
The player SHALL make the current entry, playback position, and duration available to the app while media plays and when it pauses or stops.

#### Scenario: Playback progress changes
- **WHEN** the player reports a valid position for the current entry
- **THEN** the app can persist that progress and later offer to resume the same entry
