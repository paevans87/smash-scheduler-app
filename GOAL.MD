# App Goal: SmashScheduler

## 1. The Vision
SmashScheduler is a specialised club management tool designed to remove the manual effort from running badminton sessions. It empowers club organisers to manage their roster and automate the complex task of fair, skill-based matchmaking.

## 2. Problem Statement
- **Manual Matchmaking**: Organisers spend too much time manually assigning players to courts, leading to "cliques" or unfair skill gaps.
- **Dynamic Attendance**: Session capacity changes weekly based on court availability and player turnout.
- **Player Preferences**: Tracking gender-mix preferences and "avoid-player" lists is mentally taxing for organisers to do on the fly.

## 3. Core Features (High Level)
- **Club Management**: CRUD operations for a Club entity including default court capacity and singles/doubles toggle.
- **Player Profiles**: Management of players with attributes: Skill (1-10), Gender, Play-style preference (Level/Mixed/Open), and a "Blacklist" of excluded partners, and a "Blacklist" of excluded opponents.
- **Session Orchestration**: Create dated sessions. Ability to override court count per session.
- **Session Management**: Add players from the club roster to the session, stop the session.
- **Automated Matchmaker**: A weighted scoring algorithm that generates court assignments based on:
    1. Court capacity (Singles=2, Doubles=4).
    2. Player skill levels (balancing teams).
    3. Social constraints (avoiding blacklisted pairings).
    4. Format preferences (Mixed vs Level).
    5. Who has been sat off the longest.
- **Manual Matchmaking**: The admin must be able to override the automated matchmaking if desired, making changes such as replacing a single player or changing all the players.
- **Match Management**: Once a match has been made the players will go play their game, from here when they are finished the user can optionally mark the winners and stop the match.
- **Analytics**: Throughout the session and after the session we should have enough detail to determine approximate play time, number of games played, how many times a player has played with another player (most played with, plays well with, plays badly with, etc). 

## 4. User Personas
- **Club Organiser**: The primary administrator who manages the roster, marks attendance, and triggers the matchmaking algorithm.

## 5. Domain Model (Technical Context)
- **Club**: Name, Default Courts, Game Type (Singles/Doubles).
- **Player**: Profile (Skill 1-10, Gender, Preferences, Conflict List). Skill is admin-judged only.
- **Session**: Date/Time, Active Roster (Enrolled Players), Court Override, Match History.
- **Bench (Calculated)**: Players in Active Roster not currently assigned to a Match.
- **Court**: Physical resource within a Session.
- **Match**: Pairing (Players) + Status (In-Progress/Completed) + Results (Optional Score/Winner).

## 6. Known Constraints
- **Language**: English (UK) exclusively.
- **Tech Preference**: C#, Blazor (Web SPA), SQLite or browser-based storage.
- **Security**: Basic local storage; no PII (Personally Identifiable Information) or sensitive data encryption required.
- **UX/UI**: The app should be intuitive and with an attractive, modern look.

## 7. Out of Scope (For MVP)
- Online synchronisation or cloud backup.
- Tournament/League ladder tracking.
- Financial/Membership fee tracking.