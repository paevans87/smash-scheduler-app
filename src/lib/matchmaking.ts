// ─── Public types ─────────────────────────────────────────────────────────────

export type AlgorithmPlayer = {
  id: string;
  name: string;
  gender: number;
  skillLevel: number; // Resolved numeric level (1-10)
  playStylePreference?: number; // 0=Open, 1=Mix, 2=Level
  opponentBlacklist?: string[]; // player IDs they won't play against
  partnerBlacklist?: string[]; // player IDs they won't partner with
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

export type MatchConfig = {
  applyGenderMatching: boolean; // Whether gender matching is enabled at all
  genderMatchingMode: number; // 0=preferred (soft 0.5× penalty), 1=strict (hard filter)
  blacklistMode: number; // 0=off, 1=hard constraints applied
};

export type MatchCandidate = {
  courtNumber: number;
  playerIds: string[]; // Ordered: [0,1]=Team1, [2,3]=Team2 (or [0]=T1,[1]=T2 for singles)
  totalScore: number; // 0–120 (can exceed 100 when play-style multiplier fires)
};

// ─── Context builders ─────────────────────────────────────────────────────────

/**
 * Counts how many times each exact group of players has appeared in the same
 * completed match. Key = sorted player IDs joined by '|'.
 */
export function buildGroupCounts(
  matches: CompletedMatchRecord[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const match of matches) {
    const key = [...match.playerIds].sort().join("|");
    counts.set(key, (counts.get(key) ?? 0) + 1);
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

// ─── Hard constraint checkers ─────────────────────────────────────────────────

/**
 * Returns true when both teams have the same gender composition.
 * Allows [2M vs 2M], [2F vs 2F], and [1M+1F vs 1M+1F] (the two intended
 * match types), while rejecting asymmetric arrangements like [2M vs 1M+1F].
 */
function isGenderSymmetric(
  t1: AlgorithmPlayer[],
  t2: AlgorithmPlayer[]
): boolean {
  const t1Males = t1.filter((p) => p.gender === 0).length;
  const t2Males = t2.filter((p) => p.gender === 0).length;
  return t1Males === t2Males;
}

function hasBlacklistViolation(
  t1: AlgorithmPlayer[],
  t2: AlgorithmPlayer[]
): boolean {
  // Opponent blacklist: players on opposite teams
  for (const p1 of t1) {
    for (const p2 of t2) {
      if (p1.opponentBlacklist?.includes(p2.id)) return true;
      if (p2.opponentBlacklist?.includes(p1.id)) return true;
    }
  }
  // Partner blacklist: players on the same team
  for (const team of [t1, t2]) {
    for (let i = 0; i < team.length - 1; i++) {
      for (let j = i + 1; j < team.length; j++) {
        if (team[i].partnerBlacklist?.includes(team[j].id)) return true;
        if (team[j].partnerBlacklist?.includes(team[i].id)) return true;
      }
    }
  }
  return false;
}

function isValidArrangement(
  t1: AlgorithmPlayer[],
  t2: AlgorithmPlayer[],
  config: MatchConfig
): boolean {
  // Gender strict mode: only allow gender-symmetric arrangements —
  // same-gender-per-team (2M vs 2M or 2F vs 2F) OR gender-balanced-per-team
  // (1M+1F vs 1M+1F). Asymmetric arrangements (2M vs 1M+1F) are rejected.
  if (config.applyGenderMatching && config.genderMatchingMode === 1) {
    if (!isGenderSymmetric(t1, t2)) return false;
  }
  if (config.blacklistMode === 1 && hasBlacklistViolation(t1, t2)) return false;
  return true;
}

// ─── Soft multipliers ─────────────────────────────────────────────────────────

/**
 * Returns the style of the resulting match arrangement:
 *   2 = Level — all same gender per team (2M vs 2M, or 2F vs 2F)
 *   1 = Mix   — gender-balanced per team (1M+1F vs 1M+1F)
 *   0 = Asymmetric — teams have different gender compositions (undesirable)
 */
function computeMatchStyle(
  t1: AlgorithmPlayer[],
  t2: AlgorithmPlayer[]
): number {
  const t1Males = t1.filter((p) => p.gender === 0).length;
  const t2Males = t2.filter((p) => p.gender === 0).length;
  // Symmetric arrangements only — teams must have the same gender composition
  if (t1Males !== t2Males) return 0; // Asymmetric
  // Both teams all-same-gender → Level
  if (t1Males === 0 || t1Males === t1.length) return 2;
  // Both teams mixed → Mix
  return 1;
}

/**
 * Computes a combined soft multiplier for a proposed match arrangement.
 *
 * 1. Play-style preference nudge: fires when every player's
 *    `playStylePreference` is satisfied by the resulting match style.
 *    Preference semantics:
 *      0 = Open  → satisfied by any match style
 *      1 = Mix   → satisfied when both teams are gender-balanced (style = 1)
 *      2 = Level → satisfied when both teams are all same-gender (style = 2)
 *    Level games receive a larger nudge (×1.12) than Mix (×1.04) because
 *    Level is the natural default preference — most players are Open but
 *    Level games are generally preferred when there's no strong preference.
 *
 * 2. Soft asymmetric-arrangement nudge (×0.9): fires when gender matching is
 *    enabled in "Preferred" mode and the arrangement is gender-asymmetric
 *    (one team mixed, the other same-gender). Does not penalise valid Level
 *    or Mix games.
 */
function computeSoftMultiplier(
  t1: AlgorithmPlayer[],
  t2: AlgorithmPlayer[],
  config?: MatchConfig
): number {
  let multiplier = 1.0;

  // Play-style preference nudge
  const matchStyle = computeMatchStyle(t1, t2);
  const all = [...t1, ...t2];
  const allSatisfied = all.every((p) => {
    const pref = p.playStylePreference ?? 0;
    if (pref === 0) return true;          // Open: happy with anything
    if (pref === 1) return matchStyle === 1; // Mix: wants gender-balanced teams
    if (pref === 2) return matchStyle === 2; // Level: wants same-gender teams
    return true;
  });
  if (allSatisfied) {
    // Level games are the preferred default; give them a slightly larger nudge
    multiplier *= matchStyle === 2 ? 1.12 : 1.04;
  }

  // Soft asymmetric-arrangement nudge (preferred mode only)
  if (
    config?.applyGenderMatching &&
    config.genderMatchingMode === 0 &&
    !isGenderSymmetric(t1, t2)
  ) {
    multiplier *= 0.9;
  }

  return multiplier;
}

// ─── Scorers ──────────────────────────────────────────────────────────────────

const DOUBLE_PAIRINGS = [
  { t1: [0, 1] as const, t2: [2, 3] as const },
  { t1: [0, 2] as const, t2: [1, 3] as const },
  { t1: [0, 3] as const, t2: [1, 2] as const },
];

type ArrangementResult = {
  score: number;
  orderedIds: string[];
  t1: AlgorithmPlayer[];
  t2: AlgorithmPlayer[];
};

/**
 * Phase 1 + Skill score.
 *
 * For doubles: tries all 3 team arrangements, filters by hard constraints,
 * then picks the arrangement that minimises (team imbalance + intra-team drift).
 *
 * Scoring formula (doubles):
 *   Δ_teams = |sum(T1) − sum(T2)|          max = 18
 *   Δ_drift = |T1[0]−T1[1]| + |T2[0]−T2[1]| max = 18
 *   S = (1 − (Δ_teams + Δ_drift) / 36) × 100
 *
 * Returns null when no valid team arrangement exists (all violate constraints).
 */
function skillBalanceScorer(
  group: AlgorithmPlayer[],
  config?: MatchConfig
): ArrangementResult | null {
  if (group.length === 2) {
    const t1 = [group[0]];
    const t2 = [group[1]];
    if (config && !isValidArrangement(t1, t2, config)) return null;
    const diff = Math.abs(group[0].skillLevel - group[1].skillLevel);
    return {
      score: (1 - diff / 9) * 100,
      orderedIds: [group[0].id, group[1].id],
      t1,
      t2,
    };
  }

  // Doubles
  let best: ArrangementResult | null = null;
  for (const { t1: t1Idx, t2: t2Idx } of DOUBLE_PAIRINGS) {
    const t1 = t1Idx.map((i) => group[i]);
    const t2 = t2Idx.map((i) => group[i]);

    if (config && !isValidArrangement(t1, t2, config)) continue;

    const t1Sum = t1.reduce((s, p) => s + p.skillLevel, 0);
    const t2Sum = t2.reduce((s, p) => s + p.skillLevel, 0);
    const teamImbalance = Math.abs(t1Sum - t2Sum); // max 18
    const intraDrift =
      Math.abs(t1[0].skillLevel - t1[1].skillLevel) +
      Math.abs(t2[0].skillLevel - t2[1].skillLevel); // max 18
    const score = (1 - (teamImbalance + intraDrift) / 36) * 100;

    if (!best || score > best.score) {
      best = {
        score,
        orderedIds: [...t1.map((p) => p.id), ...t2.map((p) => p.id)],
        t1,
        t2,
      };
    }
  }

  return best;
}

/**
 * Phase 2B — Match History score.
 *
 * H = 1 / (N + 1) × 100
 * where N = number of completed matches this exact group has played together.
 */
function matchHistoryScorer(
  playerIds: string[],
  groupCounts: Map<string, number>
): number {
  const key = [...playerIds].sort().join("|");
  const n = groupCounts.get(key) ?? 0;
  return (1 / (n + 1)) * 100;
}

/**
 * Phase 2C — Court Rotation score.
 *
 * When maxWaitMs is provided (relative mode):
 *   T_i = (now − lastMatch_i) / maxWaitMs  (capped at 1.0)
 *   Players who have never played get T_i = 1.0.
 *
 * Without maxWaitMs (absolute fallback):
 *   T_i = min((now − lastMatch_i) / 30min, 1.0)
 */
function timeOffCourtScorer(
  playerIds: string[],
  lastMatchTimes: Map<string, number>,
  now: number,
  maxWaitMs?: number
): number {
  if (!maxWaitMs || maxWaitMs <= 0) {
    // Absolute fallback: 30 minutes = full score
    let totalMins = 0;
    for (const id of playerIds) {
      const last = lastMatchTimes.get(id);
      totalMins += last != null ? (now - last) / 60_000 : 60;
    }
    return Math.min(totalMins / playerIds.length / 30, 1.0) * 100;
  }

  // Relative: 1.0 = longest-waiting player in this session
  let totalNorm = 0;
  for (const id of playerIds) {
    const last = lastMatchTimes.get(id);
    const waitMs = last != null ? now - last : maxWaitMs;
    totalNorm += Math.min(waitMs / maxWaitMs, 1.0);
  }
  return (totalNorm / playerIds.length) * 100;
}

/**
 * Scores a group of players.
 *
 * When `config` is provided, Phase 1 hard constraints are enforced and Phase 3
 * soft multipliers are applied. When omitted, only the base score is returned
 * (useful for the interactive preview dialog).
 *
 * Returns `{ score: 0, orderedIds: [] }` when no valid team arrangement exists.
 */
export function scoreGroup(
  group: AlgorithmPlayer[],
  groupCounts: Map<string, number>,
  lastMatchTimes: Map<string, number>,
  weights: ScoringWeights,
  now: number,
  maxWaitMs?: number,
  config?: MatchConfig
): { score: number; orderedIds: string[] } {
  const arrangement = skillBalanceScorer(group, config);
  if (!arrangement) return { score: 0, orderedIds: [] };

  const { score: skill, orderedIds, t1, t2 } = arrangement;
  const history = matchHistoryScorer(orderedIds, groupCounts);
  const time = timeOffCourtScorer(orderedIds, lastMatchTimes, now, maxWaitMs);

  const baseScore =
    (skill * weights.skillBalance) / 100 +
    (history * weights.matchHistory) / 100 +
    (time * weights.timeOffCourt) / 100;

  const softMult = config ? computeSoftMultiplier(t1, t2, config) : 1.0;

  return { score: baseScore * softMult, orderedIds };
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

  while (results.length < maxCount && attempts < maxCount * 3) {
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
  groupCounts: Map<string, number>,
  lastMatchTimes: Map<string, number>,
  weights: ScoringWeights,
  groupSize: number,
  now: number,
  maxWaitMs: number,
  config?: MatchConfig
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
      groupCounts,
      lastMatchTimes,
      weights,
      now,
      maxWaitMs,
      config
    );
    if (orderedIds.length === 0) continue; // constraint violation, skip
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
  playersPerMatch: number,
  config?: MatchConfig
): MatchCandidate[] {
  const groupCounts = buildGroupCounts(completedMatches);
  const lastMatchTimes = buildLastMatchTimes(completedMatches);
  const now = Date.now();

  // Relative normalization: longest-waiting bench player = 1.0
  const maxWaitMs = benchPlayers.reduce((max, p) => {
    const last = lastMatchTimes.get(p.id);
    const waitMs = last != null ? now - last : 3_600_000; // default 1 hour
    return Math.max(max, waitMs);
  }, 0);

  const candidates: MatchCandidate[] = [];
  let remaining = [...benchPlayers];

  for (const court of selectedCourts) {
    if (remaining.length < playersPerMatch) break;

    const result = findBestGroup(
      remaining,
      groupCounts,
      lastMatchTimes,
      weights,
      playersPerMatch,
      now,
      maxWaitMs,
      config
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
  playersPerMatch: number,
  config?: MatchConfig
): string | null {
  const groupCounts = buildGroupCounts(completedMatches);
  const lastMatchTimes = buildLastMatchTimes(completedMatches);
  const now = Date.now();

  const maxWaitMs = pool.reduce((max, p) => {
    const last = lastMatchTimes.get(p.id);
    const waitMs = last != null ? now - last : 3_600_000;
    return Math.max(max, waitMs);
  }, 0);

  const fixedPlayers = pool.filter((p) => fixedPlayerIds.includes(p.id));
  const candidates = pool.filter((p) => !fixedPlayerIds.includes(p.id));

  let bestScore = -Infinity;
  let bestId: string | null = null;

  for (const candidate of candidates) {
    const group = [...fixedPlayers, candidate];
    if (group.length < playersPerMatch) continue;
    const { score, orderedIds } = scoreGroup(
      group,
      groupCounts,
      lastMatchTimes,
      weights,
      now,
      maxWaitMs,
      config
    );
    if (orderedIds.length === 0) continue; // constraint violation
    if (score > bestScore) {
      bestScore = score;
      bestId = candidate.id;
    }
  }

  return bestId;
}
