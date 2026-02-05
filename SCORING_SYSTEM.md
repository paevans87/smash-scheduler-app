# SmashScheduler Matchmaking Scoring System

This document explains how the matchmaking algorithm generates and scores match candidates.

## Overview

The matchmaking system evaluates all possible foursome combinations from available (benched) players and selects the optimal groupings based on a weighted scoring algorithm.

## Scoring Weights

The final score for each match candidate is calculated using three weighted components:

| Scorer | Weight | Purpose |
|--------|--------|---------|
| Skill Balance | 40% | Ensures teams are evenly matched |
| Match History | 35% | Promotes variety in player pairings |
| Time Off Court | 25% | Prioritises players waiting longest |

**Final Score Formula:**
```
Total = (Skill Balance × 0.40) + (Match History × 0.35) + (Time Off Court × 0.25)
```

## Scoring Components

### 1. Skill Balance Scorer (40%)

Evaluates all three possible team pairings from four players and selects the arrangement that minimises the skill difference between teams.

**Team Pairing Options:**
- Players [0,1] vs [2,3]
- Players [0,2] vs [1,3]
- Players [0,3] vs [1,2]

**Calculation:**
1. For each pairing option, sum the skill levels of each team
2. Calculate the absolute difference between team totals
3. Select the pairing with the smallest difference
4. Reorder player IDs so indices [0,1] form Team 1 and [2,3] form Team 2

**Score Formula:**
```
Score = (1 - (BestDifference / 18)) × 100
```
- Maximum possible difference is 18 (two level-10 players vs two level-1 players)
- A perfect balance (difference = 0) scores 100
- The worst balance (difference = 18) scores 0

**Example:**
- Players with skills: 10, 8, 6, 4
- Best pairing: (10 + 4) vs (8 + 6) = 14 vs 14 = difference of 0
- Score: 100

### 2. Match History Scorer (35%)

Penalises repeated player pairings to encourage variety across matches.

**Calculation:**
1. Count how many times each pair of players has previously played together
2. Apply a penalty of 15 points per repeated pairing
3. Maximum penalty capped at 90 points

**Score Formula:**
```
Score = 100 - min(RepeatCount × 15, 90)
```

**Example:**
- If players A and B have played together twice, and A and C have played once:
- Total repeats = 3
- Score = 100 - (3 × 15) = 55

### 3. Time Off Court Scorer (25%)

Prioritises players who have been waiting the longest since their last match.

**Calculation:**
1. For each player, calculate minutes since their last match completion
2. Players with no match history are assigned 60 minutes (maximum consideration)
3. Calculate the average waiting time across all four players
4. Normalise against a 30-minute baseline

**Score Formula:**
```
AverageWait = Sum(MinutesOff) / 4
Score = min(AverageWait / 30, 1.0) × 100
```

**Example:**
- Four players waited: 10, 15, 20, 25 minutes
- Average = 17.5 minutes
- Score = (17.5 / 30) × 100 = 58.3

## Additional Scorers (Available but not in default weights)

### Play Style Preference Scorer

Considers player preferences for match types:
- **Level Play (all players):** 100 points
- **Mixed Gender (achieved):** 95 points
- **Open Play (all players):** 90 points
- **Mixed preference but same gender:** 60 points
- **Other combinations:** 70 points

### Blacklist Avoidance Scorer

Penalises matches containing blacklisted player pairings:
- Each blacklisted pairing deducts 20 points
- Maximum penalty capped at 100 points

**Blacklist Types:**
- **Partner:** Avoid being on the same team
- **Opponent:** Avoid playing against each other

## Combination Generation

For performance reasons, the algorithm limits combination evaluation:

- **12 or fewer players:** All possible foursomes evaluated (C(n,4) combinations)
- **More than 12 players:** Randomly samples up to 100 unique combinations

This prevents exponential computation time while still finding quality matches.

## Match Generation Flow

1. Identify all benched (not currently playing) active players
2. Identify available courts (not hosting an in-progress match)
3. Generate all foursome combinations from benched players
4. Score each combination using the weighted algorithm
5. Select the highest-scoring combination for the first court
6. Remove those four players from the pool
7. Repeat steps 3-6 for remaining courts
8. Return the list of match candidates

## Team Assignment

After selecting the optimal four players, the Skill Balance Scorer also determines team assignments. The final `PlayerIds` list is ordered so that:
- Indices 0 and 1 = Team 1
- Indices 2 and 3 = Team 2

This ensures teams are balanced by cumulative skill level.
