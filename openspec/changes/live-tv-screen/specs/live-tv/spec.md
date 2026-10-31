# Spec Delta

## Purpose

Lets users browse fictional live-TV channels, filter them by category, and inspect current and upcoming programs using the NEXORA remote-friendly interface.

## ADDED Requirements

### Requirement: Live-TV screen follows the NEXORA visual identity
The live-TV screen SHALL use the app's dark visual theme with restrained neon accents and readable content sized for viewing from a distance.

#### Scenario: Opening the live-TV screen
- **WHEN** the user opens TV ao vivo from the home screen
- **THEN** the app displays the channel browser and a preview area in the NEXORA visual identity

### Requirement: Categories filter the channel list
The live-TV screen SHALL provide fictional channel categories that filter the displayed channels.

#### Scenario: Selecting a category
- **WHEN** the user confirms a category
- **THEN** the channel list displays only channels belonging to that category

### Requirement: Selecting a channel shows its program guide
The live-TV screen SHALL display fictional current and upcoming program information for the selected channel.

#### Scenario: Selecting a channel
- **WHEN** the user confirms a channel
- **THEN** the screen marks that channel as selected and displays its current and upcoming programs

### Requirement: Channel preview does not start real playback
The live-TV screen SHALL use fictional channel and program data and SHALL NOT load or play real streams.

#### Scenario: A channel is selected for preview
- **WHEN** the user selects a channel
- **THEN** the preview remains a non-playing demonstration placeholder and no stream is requested

### Requirement: Live-TV screen supports remote navigation and return
The live-TV screen SHALL expose its categories and channels to the existing focus navigation and SHALL return to the home screen when the user sends Voltar.

#### Scenario: Returning from live TV
- **WHEN** the user sends Voltar while the live-TV screen is active
- **THEN** the app restores the home screen
