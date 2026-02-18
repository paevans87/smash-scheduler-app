# SmashScheduler Matchmaking System Specification

This document provides a complete specification of the matchmaking algorithm for implementation in Next.js.

## Table of Contents
1. [Overview](#overview)
2. [Data Structures](#data-structures)
3. [Match Generation Flow](#match-generation-flow)
4. [Scoring Algorithm](#scoring-algorithm)
5. [Individual Scorers](#individual-scorers)
6. [Generation Options](#generation-options)
7. [UI Integration](#ui-integration)
8. [Edge Cases](#edge-cases)

---

## Overview

The matchmaking system automates badminton match creation by evaluating all possible foursome combinations from available (benched) players and selecting optimal groupings based on a weighted scoring algorithm.

### Key Characteristics
- **Game Type**: Doubles (4 players per match) || Singles (2 players per match)
- **Session State**: Only works in "Active" session state
- **Players Per Match**: Exactly 4 players for doubles || Exactly 2 players for Singles
- **Output**: Ordered player list where indices [0,1] = Team 1, indices [2,3] = Team 2

---

## Data Structures

### Player
```typescript
interface Player {
  id: string;
  clubId: string;
  name: string;  
  gender: 'male' | 'female';
  playStylePreference: 'level' | 'mixed' | 'open';
  createdAt: Date;
  updatedAt: Date;
}
```

### Session
```typescript
interface Session {
  id: string;
  clubId: string;
  scheduledDateTime: Date;
  courtCount: number;
  state: 'draft' | 'active' | 'complete';
  courtLabels?: Record<number, string>;  // Optional custom court names
}
```

### SessionPlayer
```typescript
interface SessionPlayer {
  sessionId: string;
  playerId: string;
  isActive: boolean;         // If false, excluded from matchmaking
  joinedAt: Date;
}
```

### Match
```typescript
interface Match {
  id: string;
  sessionId: string;
  courtNumber: number;       // 0 for draft matches
  state: 'inProgress' | 'completed' | 'draft';
  wasAutomated: boolean;
  startedAt: Date;
  completedAt?: Date;
  playerIds: string[];       // Ordered: [0,1] = Team 1, [2,3] = Team 2
  winningPlayerIds?: string[];
  score?: { team1Score: number; team2Score: number };
}
```

### PlayerBlacklist
```typescript
interface PlayerBlacklist {
  playerId: string;
  blacklistedPlayerId: string;
  blacklistType: 'partner' | 'opponent';  // Partner: avoid same team, Opponent: avoid playing against
  createdAt: Date;
}
```

### ScoringWeights
```typescript
interface ScoringWeights {
  skillBalance: number;      // Default: 40
  matchHistory: number;      // Default: 35
  timeOffCourt: number;      // Default: 25
  // Must sum to 100
}
```

### MatchCandidate (Output)
```typescript
interface MatchCandidate {
  courtNumber: number;
  playerIds: string[];       // Ordered for team assignment
  totalScore: number;
}
```

---

## Match Generation Flow

### Main Entry Point: `GenerateMatchesAsync`

```
INPUT: sessionId, excludePlayerIds (optional), generationOptions (optional)
OUTPUT: List<MatchCandidate>
```

#### Step 1: Load Session and Club Data
1. Fetch session by ID
2. Fetch club by session.clubId
3. Get scoring weights from club (or use defaults)
4. Get blacklist mode from club (`preferred` or `hardLimit`)

#### Step 2: Identify Committed Players
```
committedPlayerIds = existingMatches
  .where(match => match.state !== 'completed')
  .flatMap(match => match.playerIds)
```

#### Step 3: Identify Benched Players
```
benchedSessionPlayers = session.sessionPlayers
  .where(sp => sp.isActive === true)
  .where(sp => !committedPlayerIds.contains(sp.playerId))
  .where(sp => !excludePlayerIds?.contains(sp.playerId))
```

#### Step 4: Load Player Details and Blacklists
1. Load full Player objects for each benched session player
2. Load all blacklist entries for those players

#### Step 5: Identify Available Courts
```
usedCourts = existingMatches
  .where(match => match.state === 'inProgress')
  .map(match => match.courtNumber)

availableCourts = [1..session.courtCount]
  .where(court => !usedCourts.contains(court))
```

#### Step 6: Apply Generation Options (if provided)
- If `matchCount` is set: Use courts [1..matchCount]
- If `excludeCourtNumbers` is set: Remove those from availableCourts
- If `genderFilter` is set: Filter benched players by gender
- If `strategy` is set: Override scoring weights

#### Step 7: Build Scoring Context
```
completedMatches = existingMatches.where(m => m.state === 'completed')
lastMatchTimes = buildLastMatchCompletionTimes(completedMatches)
```

For each completed match (ordered by completedAt):
- Update lastMatchTimes[playerId] = match.completedAt

#### Step 8: Generate Scored Matches (Core Algorithm)
```
candidates = []
remainingPlayers = [...benchedPlayers]
courtIndex = 0

WHILE remainingPlayers.length >= 4 AND courtIndex < availableCourts.length:
    bestCandidate = findBestFoursomeWithScoring(remainingPlayers, context, weights, blacklistMode, blacklists)
    
    IF bestCandidate IS null:
        BREAK
    
    bestCandidate.courtNumber = availableCourts[courtIndex]
    candidates.add(bestCandidate)
    
    remainingPlayers = remainingPlayers
        .where(p => !bestCandidate.playerIds.contains(p.id))
    
    courtIndex++

RETURN candidates
```

---

## Scoring Algorithm

### Find Best Foursome

```
INPUT: availablePlayers, context, weights, blacklistMode, blacklists, genderFilter
OUTPUT: MatchCandidate or null
```

#### Step 1: Generate All Foursome Combinations
```
IF availablePlayers.length > 12:
    // Performance optimisation: sample combinations
    sorted = sort players by skillLevel (descending)
    combinations = generateLimitedCombinations(sorted, maxCount=100)
ELSE:
    combinations = generateAllFoursomeCombinations(availablePlayers)
```

**All Foursome Combinations** (for n ≤ 12):
```
for i = 0 to n-4:
    for j = i+1 to n-3:
        for k = j+1 to n-2:
            for l = k+1 to n-1:
                combinations.add([players[i], players[j], players[k], players[l]])
```

**Limited Combinations** (for n > 12):
```
combinations = []
attempts = 0

WHILE combinations.length < 100 AND attempts < 100:
    indices = shuffle([0..n-1]).take(4).sort()
    combination = indices.map(i => sortedPlayers[i])
    
    IF !combinations.contains(combination):
        combinations.add(combination)
    
    attempts++
```

#### Step 2: Score Each Combination

```
bestCandidate = null
bestScore = -Infinity

FOR each combination IN combinations:
    candidate = { playerIds: combination.map(p => p.id) }
    
    // Apply hard limit blacklist filter
    IF blacklistMode === 'hardLimit' AND hasBlacklistViolation(candidate.playerIds, blacklists):
        CONTINUE
    
    // Apply mixed-only gender filter
    IF genderFilter === 'mixedOnly' AND !isMixedGender(combination):
        CONTINUE
    
    // Calculate individual scores
    skillScore = skillBalanceScorer(candidate, combination, context)
    historyScore = matchHistoryScorer(candidate, combination, context)
    timeScore = timeOffCourtScorer(candidate, combination, context)
    
    // Calculate weighted total
    totalScore = (skillScore * weights.skillBalance / 100) +
                 (historyScore * weights.matchHistory / 100) +
                 (timeScore * weights.timeOffCourt / 100)
    
    // Apply preferred blacklist as multiplier
    IF blacklistMode === 'preferred' AND blacklists.length > 0:
        blacklistScore = blacklistAvoidanceScorer(candidate, combination, context)
        totalScore = totalScore * (blacklistScore / 100)
    
    candidate.totalScore = totalScore
    
    IF totalScore > bestScore:
        bestScore = totalScore
        bestCandidate = candidate

RETURN bestCandidate
```

### Final Score Formula
```
Total = (SkillBalance × skillWeight) + (MatchHistory × historyWeight) + (TimeOffCourt × timeWeight)

If blacklistMode === 'preferred' AND hasBlacklists:
    Total = Total × (BlacklistScore / 100)
```

---

## Individual Scorers

### 1. Skill Balance Scorer (40% default weight)

**Purpose**: Ensures teams are evenly matched by finding the optimal team pairing.

**Algorithm**:
1. For each foursome, evaluate all 3 possible team pairings:
   - [0,1] vs [2,3]
   - [0,2] vs [1,3]
   - [0,3] vs [1,2]

2. For each pairing:
   ```
   team1Total = player[indices[0]].skillLevel + player[indices[1]].skillLevel
   team2Total = player[indices[2]].skillLevel + player[indices[3]].skillLevel
   difference = abs(team1Total - team2Total)
   ```

3. Select the pairing with minimum difference

4. **Reorder player IDs** so that:
   - `candidate.playerIds[0,1]` = Team 1
   - `candidate.playerIds[2,3]` = Team 2

5. **Calculate score**:
   ```
   maxPossibleDifference = 18  // Two level-10 vs two level-1
   normalisedDifference = difference / maxPossibleDifference
   score = (1 - normalisedDifference) × 100
   ```

**Examples**:
- Skills [5,5,6,6] → Best pairing: (5+6) vs (5+6) = 11 vs 11 → Score: 100
- Skills [10,10,4,4] → Best pairing: (10+4) vs (10+4) = 14 vs 14 → Score: 100
- Skills [1,1,1,10] → Best pairing: (1+10) vs (1+1) = 11 vs 2 → Difference: 9 → Score: 50

---

### 2. Match History Scorer (35% default weight)

**Purpose**: Penalises repeated player pairings to encourage variety.

**Algorithm**:
1. Build a pair count lookup from all completed matches:
   ```
   pairCounts = {}
   FOR each match IN completedMatches:
       FOR i = 0 TO 3:
           FOR j = i+1 TO 3:
               pairKey = createPairKey(match.playerIds[i], match.playerIds[j])
               pairCounts[pairKey]++
   ```

2. For the candidate foursome, count total repeats:
   ```
   totalRepeatCount = 0
   FOR i = 0 TO 3:
       FOR j = i+1 TO 3:
           pairKey = createPairKey(candidate.playerIds[i], candidate.playerIds[j])
           IF pairCounts.contains(pairKey):
               totalRepeatCount += pairCounts[pairKey]
   ```

3. **Calculate score**:
   ```
   penaltyPerRepeat = 15
   maxPenalty = 90
   totalPenalty = min(totalRepeatCount × penaltyPerRepeat, maxPenalty)
   score = 100 - totalPenalty
   ```

**createPairKey**: Returns a deterministic string for any two player IDs:
```
IF id1 < id2: return "{id1}_{id2}"
ELSE: return "{id2}_{id1}"
```

**Examples**:
- No previous pairings: Score = 100
- 2 repeated pairings: Score = 100 - 30 = 70
- 6+ repeated pairings: Score = 100 - 90 = 10

---

### 3. Time Off Court Scorer (25% default weight)

**Purpose**: Prioritises players who have been waiting longest.

**Algorithm**:
1. Calculate minutes since last match for each player:
   ```
   totalMinutesOff = 0
   FOR each playerId IN candidate.playerIds:
       IF lastMatchCompletionTimes.contains(playerId):
           minutesOff = (now - lastMatchCompletionTimes[playerId]).totalMinutes
           totalMinutesOff += minutesOff
       ELSE:
           // New players get maximum consideration
           totalMinutesOff += 60
   ```

2. **Calculate score**:
   ```
   averageMinutesOff = totalMinutesOff / 4
   normalisedScore = min(averageMinutesOff / 30, 1.0)
   score = normalisedScore × 100
   ```

**Examples**:
- Average 30+ minutes wait: Score = 100
- Average 15 minutes wait: Score = 50
- Average 5 minutes wait: Score = 16.7

---

### 4. Blacklist Avoidance Scorer (applied as multiplier)

**Purpose**: Penalises matches containing blacklisted player pairings.

**Blacklist Types**:
- `partner`: Avoid being on the same team
- `opponent`: Avoid playing against each other

**Algorithm**:
```
penaltyCount = 0

FOR each playerId IN candidate.playerIds:
    playerBlacklists = blacklists.where(b => b.playerId === playerId)
    
    FOR each blacklist IN playerBlacklists:
        IF blacklist.type === 'partner' AND candidate.playerIds.contains(blacklist.blacklistedPlayerId):
            penaltyCount++
        
        IF blacklist.type === 'opponent' AND candidate.playerIds.contains(blacklist.blacklistedPlayerId):
            penaltyCount++

penaltyFactor = min(penaltyCount × 20, 100)
score = 100 - penaltyFactor
```

**Application**:
- **Preferred mode**: `totalScore = totalScore × (blacklistScore / 100)`
- **HardLimit mode**: Combination is completely excluded

**Examples**:
- No blacklist violations: Score = 100 (no penalty)
- 2 violations: Score = 60 (40% penalty)
- 5+ violations: Score = 0 (100% penalty, effectively excludes)

---

### 5. Play Style Preference Scorer (available but not in default weights)

**Purpose**: Considers player preferences for match types.

**Scoring**:
| Scenario | Score |
|----------|-------|
| All players prefer Level | 100 |
| All players prefer Open | 90 |
| Mixed preference + both genders present | 95 |
| Mixed preference + same gender only | 60 |
| Other combinations | 70 |

---

## Generation Options

```typescript
interface GenerationOptions {
  excludeCourtNumbers?: number[];           // Courts to skip
  strategy?: 'clubDefault' | 'equal' | 'strong' | 'leastGames';
  genderFilter?: 'any' | 'maleOnly' | 'femaleOnly' | 'mixedOnly';
  matchCount?: number;                      // For draft generation, ignore available courts
}
```

### Strategy Weights Override

| Strategy | SkillBalance | MatchHistory | TimeOffCourt |
|----------|--------------|--------------|--------------|
| clubDefault | (use club's weights) | (use club's weights) | (use club's weights) |
| equal | 33 | 34 | 33 |
| strong | 70 | 20 | 10 |
| leastGames | 15 | 15 | 70 |

### Gender Filter Behaviour

| Filter | Behaviour |
|--------|-----------|
| `any` | No filtering |
| `maleOnly` | Only male players considered |
| `femaleOnly` | Only female players considered |
| `mixedOnly` | Only combinations with both genders (hard filter) |

---

## UI Integration

### Active Session Page Flow

#### Generate Matches (Auto)
1. User clicks "Auto Generate" from FAB menu
2. Show GenerationOptionsDialog
3. Call `GenerateMatchesAsync(sessionId, options)`
4. If empty result, generate fallback matches (sequential bench order)
5. Show MatchPreviewDialog with proposed matches
6. On confirm: Create matches with `state = 'inProgress'`

#### Create Manual Match
1. User clicks "Add Manual" from FAB menu
2. Show court selection if multiple available
3. Show ManualMatchDialog with bench players
4. User selects 4 players and confirms
5. Create match with `wasAutomated = false`

#### Create Draft Match
1. User clicks "Manual Draft" from FAB menu
2. Show ManualMatchDialog (no court selection)
3. User selects 4 players and confirms
4. Create match with `state = 'draft'`, `courtNumber = 0`

#### Auto Generate Drafts
1. User clicks "Auto Draft" from FAB menu
2. Show GenerationOptionsDialog (no court selection, show match count)
3. Call `GenerateMatchesAsync` with `matchCount` option
4. Show MatchPreviewDialog in draft mode
5. On confirm: Create matches with `state = 'draft'`

#### Start Draft Match
1. User clicks "Start on Court" on a draft match
2. If multiple courts available: Show court selection
3. Update match: `state = 'inProgress'`, `courtNumber = selected`, `startedAt = now`

#### Complete Match
1. User clicks complete on an in-progress match
2. Show MatchResultDialog
3. Optionally record: winning team, score
4. Update match: `state = 'completed'`, `completedAt = now`

### Can Generate Matches Check
```
canGenerate = (availableCourts > 0) AND (benchedPlayersCount >= 4)
```

### Bench Calculation
```
benchedPlayers = sessionPlayers
  .where(sp => sp.isActive)
  .where(sp => !inProgressOrDraftMatches.flatMap(m => m.playerIds).contains(sp.playerId))
```

---

## Edge Cases

### Insufficient Players
- If `benchedPlayers < required number of players for court`: Return empty candidates list
- UI should disable generation controls

### All Courts in Use
- If `availableCourts.length === 0`: Return empty candidates list
- Use `matchCount` option to generate draft matches regardless

### No Valid Combinations
- If `blacklistMode === 'hardLimit'` and all combinations have violations: Return empty
- Fallback: Sequential bench order grouping

### Performance with Many Players
- 12 or fewer: Evaluate all C(n,4) combinations
- More than 12: Sample 100 random unique combinations
- Players sorted by skill (descending) before sampling

### Session State Validation
- Matchmaking only available when `session.state === 'active'`
- Players can only be marked inactive during active sessions

### Match Player Editing
- When editing an in-progress match, exclude players in other in-progress matches from bench
- Update `wasAutomated = false` on any manual edit

---


---

## Implementation Notes

### State Management
- Use React state or server-side fetching for session data
- Refresh data after any match operation
- Consider optimistic updates for better UX

### TypeScript Types
- All IDs should be strings (converted from UUIDs)
- Dates should be ISO strings in JSON, parsed to Date objects in code

### Real-time Updates
- Consider using Supabase real-time subscriptions for match state changes
- Broadcast when matches start/complete to update all clients

### Error Handling
- Handle case where session not found
- Handle case where player removed from session mid-generation
- Handle case where player added to session mid-generation
- Validate player availability before creating matches

---
