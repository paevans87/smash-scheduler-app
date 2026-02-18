// ─── Public types ─────────────────────────────────────────────────────────────

export type AlgorithmPlayer = {
  id: string;
  name: string;
  gender: number;
  skillLevel: number; // Resolved numeric level (1-10)
};

export type CompletedMatchRecord = {
  playerIds: string[];
  completedAt: string | null;
};

export type ScoringWeights = {
  skillBalance: number; // 0-100 (must sum to 100 with others)
  matchHistory: number;
  timeOffCourt: number;
};

export type MatchCandidate = {
  courtNumber: number;
  playerIds: string[]; // Ordered: [0,1]=Team1, [2,3]=Team2 (or [0]=T1,[1]=T2 for singles)
  totalScore: number; // 0-100
};

// ─── Internal context builders ────────────────────────────────────────────────

export function buildPairCounts(
  matches: CompletedMatchRecord[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const match of matches) {
    for (let i = 0; i < match.playerIds.length - 1; i++) {
      for (let j = i + 1; j < match.playerIds.length; j++) {
        const key = pairKey(match.playerIds[i], match.playerIds[j]);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }
  return counts;
}

export function buildLastMatchTimes(
  matches: CompletedMatchRecord[]
): Map<string, number> {
  const times = new Map<string, number>();
  const sorted = [...matches]
    .filter((m) => m.completedAt != null)
    .sort((a, b) => a.completedAt!.localeCompare(b.completedAt!));
  for (const match of sorted) {
    const t = new Date(match.completedAt!).getTime();
    for (const id of match.playerIds) times.set(id, t);
  }
  return times;
}

// ─── Pair key (deterministic) ─────────────────────────────────────────────────

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

// ─── Scorers ──────────────────────────────────────────────────────────────────

const DOUBLE_PAIRINGS = [
  { t1: [0, 1] as const, t2: [2, 3] as const },
  { t1: [0, 2] as const, t2: [1, 3] as const },
  { t1: [0, 3] as const, t2: [1, 2] as const },
];

function skillBalanceScorer(group: AlgorithmPlayer[]): {
  score: number;
  orderedIds: string[];
} {
  if (group.length === 2) {
    // Singles
    const diff = Math.abs(group[0].skillLevel - group[1].skillLevel);
    return {
      score: (1 - diff / 9) * 100, // maxDiff = 9 (level 10 vs 1)
      orderedIds: [group[0].id, group[1].id],
    };
  }

  // Doubles — find team pairing that minimises skill difference
  let best = -Infinity;
  let bestIds = group.map((p) => p.id);

  for (const { t1, t2 } of DOUBLE_PAIRINGS) {
    const t1Sum = t1.reduce<number>((s, i) => s + group[i].skillLevel, 0);
    const t2Sum = t2.reduce<number>((s, i) => s + group[i].skillLevel, 0);
    const diff = Math.abs(t1Sum - t2Sum);
    const score = (1 - diff / 18) * 100; // maxDiff = 18 (10+10 vs 1+1)
    if (score > best) {
      best = score;
      bestIds = [
        ...t1.map((i) => group[i].id),
        ...t2.map((i) => group[i].id),
      ];
    }
  }

  return { score: best, orderedIds: bestIds };
}

function matchHistoryScorer(
  playerIds: string[],
  pairCounts: Map<string, number>
): number {
  let repeats = 0;
  for (let i = 0; i < playerIds.length - 1; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      repeats += pairCounts.get(pairKey(playerIds[i], playerIds[j])) ?? 0;
    }
  }
  return 100 - Math.min(repeats * 15, 90);
}

function timeOffCourtScorer(
  playerIds: string[],
  lastMatchTimes: Map<string, number>,
  now: number
): number {
  let totalMins = 0;
  for (const id of playerIds) {
    const last = lastMatchTimes.get(id);
    totalMins += last != null ? (now - last) / 60_000 : 60;
  }
  const avg = totalMins / playerIds.length;
  return Math.min(avg / 30, 1.0) * 100;
}

export function scoreGroup(
  group: AlgorithmPlayer[],
  pairCounts: Map<string, number>,
  lastMatchTimes: Map<string, number>,
  weights: ScoringWeights,
  now: number
): { score: number; orderedIds: string[] } {
  const { score: skill, orderedIds } = skillBalanceScorer(group);
  const history = matchHistoryScorer(orderedIds, pairCounts);
  const time = timeOffCourtScorer(orderedIds, lastMatchTimes, now);

  const total =
    (skill * weights.skillBalance) / 100 +
    (history * weights.matchHistory) / 100 +
    (time * weights.timeOffCourt) / 100;

  return { score: total, orderedIds };
}

// ─── Combination generators ───────────────────────────────────────────────────

function generateAllGroups(
  players: AlgorithmPlayer[],
  groupSize: number
): AlgorithmPlayer[][] {
  const results: AlgorithmPlayer[][] = [];
  function recurse(start: number, current: AlgorithmPlayer[]) {
    if (current.length === groupSize) {
      results.push([...current]);
      return;
    }
    const need = groupSize - current.length;
    for (let i = start; i <= players.length - need; i++) {
      recurse(i + 1, [...current, players[i]]);
    }
  }
  recurse(0, []);
  return results;
}

function generateLimitedGroups(
  sortedPlayers: AlgorithmPlayer[],
  groupSize: number,
  maxCount: number
): AlgorithmPlayer[][] {
  const results: AlgorithmPlayer[][] = [];
  const seen = new Set<string>();
  let attempts = 0;
  const n = sortedPlayers.length;

  while (results.length < maxCount && attempts < maxCount) {
    const indices = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < groupSize; i++) {
      const j = i + Math.floor(Math.random() * (n - i));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const selected = indices.slice(0, groupSize).sort((a, b) => a - b);
    const key = selected.join(",");
    if (!seen.has(key)) {
      seen.add(key);
      results.push(selected.map((i) => sortedPlayers[i]));
    }
    attempts++;
  }

  return results;
}

// ─── Core: find best group ────────────────────────────────────────────────────

function findBestGroup(
  players: AlgorithmPlayer[],
  pairCounts: Map<string, number>,
  lastMatchTimes: Map<string, number>,
  weights: ScoringWeights,
  groupSize: number,
  now: number
): { playerIds: string[]; score: number } | null {
  if (players.length < groupSize) return null;

  const combinations =
    players.length > 12
      ? generateLimitedGroups(
          [...players].sort((a, b) => b.skillLevel - a.skillLevel),
          groupSize,
          100
        )
      : generateAllGroups(players, groupSize);

  let bestScore = -Infinity;
  let bestIds: string[] = [];

  for (const group of combinations) {
    const { score, orderedIds } = scoreGroup(
      group,
      pairCounts,
      lastMatchTimes,
      weights,
      now
    );
    if (score > bestScore) {
      bestScore = score;
      bestIds = orderedIds;
    }
  }

  return bestIds.length > 0 ? { playerIds: bestIds, score: bestScore } : null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Main entry point. Generates the best match for each requested court in order.
 * Players committed to an earlier court are excluded from later courts.
 */
export function generateMatches(
  benchPlayers: AlgorithmPlayer[],
  completedMatches: CompletedMatchRecord[],
  selectedCourts: number[],
  weights: ScoringWeights,
  playersPerMatch: number
): MatchCandidate[] {
  const pairCounts = buildPairCounts(completedMatches);
  const lastMatchTimes = buildLastMatchTimes(completedMatches);
  const now = Date.now();

  const candidates: MatchCandidate[] = [];
  let remaining = [...benchPlayers];

  for (const court of selectedCourts) {
    if (remaining.length < playersPerMatch) break;

    const result = findBestGroup(
      remaining,
      pairCounts,
      lastMatchTimes,
      weights,
      playersPerMatch,
      now
    );
    if (!result) break;

    candidates.push({
      courtNumber: court,
      playerIds: result.playerIds,
      totalScore: result.score,
    });

    const chosen = new Set(result.playerIds);
    remaining = remaining.filter((p) => !chosen.has(p.id));
  }

  return candidates;
}

/**
 * Finds the single best replacement player from `pool` to fill the
 * remaining empty slot(s), keeping `fixedPlayerIds` in their current positions.
 * Returns null if no valid replacement exists.
 */
export function findBestReplacement(
  fixedPlayerIds: string[],
  pool: AlgorithmPlayer[],
  completedMatches: CompletedMatchRecord[],
  weights: ScoringWeights,
  playersPerMatch: number
): string | null {
  const pairCounts = buildPairCounts(completedMatches);
  const lastMatchTimes = buildLastMatchTimes(completedMatches);
  const now = Date.now();

  const fixedPlayers = pool.filter((p) => fixedPlayerIds.includes(p.id));
  const candidates = pool.filter((p) => !fixedPlayerIds.includes(p.id));

  let bestScore = -Infinity;
  let bestId: string | null = null;

  for (const candidate of candidates) {
    const group = [...fixedPlayers, candidate];
    if (group.length < playersPerMatch) continue;
    const { score } = scoreGroup(
      group,
      pairCounts,
      lastMatchTimes,
      weights,
      now
    );
    if (score > bestScore) {
      bestScore = score;
      bestId = candidate.id;
    }
  }

  return bestId;
}
