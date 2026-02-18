import {
  generateMatches,
  type AlgorithmPlayer,
  type CompletedMatchRecord,
  type ScoringWeights,
  type MatchConfig,
} from "./matchmaking";

export type SimulatorPlayer = {
  id: string;
  name: string;
  gender: number; // 0=male, 1=female
  skillLevel: number; // 1-10
  playStylePreference: number; // 0=open, 1=mix, 2=level
};

export type SimulationConfig = {
  players: SimulatorPlayer[];
  courts: number;
  rounds: number;
  avgGameDurationMinutes: number;
  weights: ScoringWeights;
  matchConfig: MatchConfig;
  playersPerMatch: number; // 2=singles, 4=doubles
};

export type SimulationResults = {
  totalGames: number;
  mixGames: number; // 1M+1F vs 1M+1F (doubles only)
  levelGames: number; // same-gender teams (or same-gender in singles)
  funnyMixGames: number; // asymmetric gender, only when preferred mode is on
  duplicateGames: number; // sum of (count-1) for repeated exact groupings
  duplicatePartners: number; // sum of (count-1) for repeated partner pairs (doubles)
  duplicateOpponents: number; // sum of (count-1) for repeated opponent face-offs
  maxGames: number;
  minGames: number;
  avgGames: number;
  playerStats: Array<{ id: string; name: string; games: number }>;
};

/**
 * Mirrors matchmaking.ts computeMatchStyle (not exported there).
 * Returns: 2=level (same-gender teams), 1=mix (gender-balanced teams), 0=asymmetric
 */
function computeStyle(t1: SimulatorPlayer[], t2: SimulatorPlayer[]): number {
  const t1Males = t1.filter((p) => p.gender === 0).length;
  const t2Males = t2.filter((p) => p.gender === 0).length;
  if (t1Males !== t2Males) return 0;
  if (t1Males === 0 || t1Males === t1.length) return 2;
  return 1;
}

function analyzeMatches(
  players: SimulatorPlayer[],
  completedMatches: CompletedMatchRecord[],
  matchConfig: MatchConfig,
  playersPerMatch: number
): SimulationResults {
  const playerById = new Map(players.map((p) => [p.id, p]));
  const gamesPerPlayer = new Map<string, number>(players.map((p) => [p.id, 0]));

  const groupingCounts = new Map<string, number>();
  const partnerPairCounts = new Map<string, number>();
  const opponentPairCounts = new Map<string, number>();

  let totalGames = 0;
  let mixGames = 0;
  let levelGames = 0;
  let funnyMixGames = 0;

  for (const match of completedMatches) {
    totalGames++;

    for (const id of match.playerIds) {
      gamesPerPlayer.set(id, (gamesPerPlayer.get(id) ?? 0) + 1);
    }

    const groupKey = [...match.playerIds].sort().join("|");
    groupingCounts.set(groupKey, (groupingCounts.get(groupKey) ?? 0) + 1);

    if (playersPerMatch === 4) {
      const [t1p0, t1p1, t2p0, t2p1] = match.playerIds;
      const t1 = [playerById.get(t1p0)!, playerById.get(t1p1)!].filter(Boolean);
      const t2 = [playerById.get(t2p0)!, playerById.get(t2p1)!].filter(Boolean);

      // Partner pairs
      const pk1 = [t1p0, t1p1].sort().join("|");
      const pk2 = [t2p0, t2p1].sort().join("|");
      partnerPairCounts.set(pk1, (partnerPairCounts.get(pk1) ?? 0) + 1);
      partnerPairCounts.set(pk2, (partnerPairCounts.get(pk2) ?? 0) + 1);

      // Opponent pairs (cross-team)
      for (const a of [t1p0, t1p1]) {
        for (const b of [t2p0, t2p1]) {
          const ok = [a, b].sort().join("|");
          opponentPairCounts.set(ok, (opponentPairCounts.get(ok) ?? 0) + 1);
        }
      }

      if (t1.length === 2 && t2.length === 2) {
        const style = computeStyle(t1, t2);
        if (style === 1) mixGames++;
        else if (style === 2) levelGames++;
        else if (
          style === 0 &&
          matchConfig.applyGenderMatching &&
          matchConfig.genderMatchingMode === 0
        ) {
          funnyMixGames++;
        }
      }
    } else {
      // Singles
      const [p1id, p2id] = match.playerIds;
      const ok = [p1id, p2id].sort().join("|");
      opponentPairCounts.set(ok, (opponentPairCounts.get(ok) ?? 0) + 1);

      const p1 = playerById.get(p1id);
      const p2 = playerById.get(p2id);
      if (p1 && p2) {
        const style = computeStyle([p1], [p2]);
        if (style === 2) levelGames++;
        else if (
          style === 0 &&
          matchConfig.applyGenderMatching &&
          matchConfig.genderMatchingMode === 0
        ) {
          funnyMixGames++;
        }
      }
    }
  }

  const countExtra = (map: Map<string, number>) =>
    [...map.values()].filter((v) => v > 1).reduce((s, v) => s + (v - 1), 0);

  const gameCounts = [...gamesPerPlayer.values()];

  return {
    totalGames,
    mixGames,
    levelGames,
    funnyMixGames,
    duplicateGames: countExtra(groupingCounts),
    duplicatePartners: countExtra(partnerPairCounts),
    duplicateOpponents: countExtra(opponentPairCounts),
    maxGames: gameCounts.length > 0 ? Math.max(...gameCounts) : 0,
    minGames: gameCounts.length > 0 ? Math.min(...gameCounts) : 0,
    avgGames:
      gameCounts.length > 0
        ? gameCounts.reduce((a, b) => a + b, 0) / gameCounts.length
        : 0,
    playerStats: players.map((p) => ({
      id: p.id,
      name: p.name,
      games: gamesPerPlayer.get(p.id) ?? 0,
    })),
  };
}

export function runSimulation(config: SimulationConfig): SimulationResults {
  const {
    players,
    courts,
    rounds,
    avgGameDurationMinutes,
    weights,
    matchConfig,
    playersPerMatch,
  } = config;

  if (players.length < playersPerMatch) {
    return {
      totalGames: 0,
      mixGames: 0,
      levelGames: 0,
      funnyMixGames: 0,
      duplicateGames: 0,
      duplicatePartners: 0,
      duplicateOpponents: 0,
      maxGames: 0,
      minGames: 0,
      avgGames: 0,
      playerStats: players.map((p) => ({ id: p.id, name: p.name, games: 0 })),
    };
  }

  const avgDurationMs = avgGameDurationMinutes * 60_000;
  const baseTime = Date.now() - rounds * avgDurationMs;
  const selectedCourts = Array.from({ length: courts }, (_, i) => i + 1);

  const algPlayers: AlgorithmPlayer[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    gender: p.gender,
    skillLevel: p.skillLevel,
    playStylePreference: p.playStylePreference,
  }));

  const completedMatches: CompletedMatchRecord[] = [];

  for (let round = 0; round < rounds; round++) {
    const roundTime = baseTime + round * avgDurationMs;

    const matches = generateMatches(
      algPlayers,
      completedMatches,
      selectedCourts,
      weights,
      playersPerMatch,
      matchConfig
    );

    for (const match of matches) {
      completedMatches.push({
        playerIds: match.playerIds,
        completedAt: new Date(roundTime).toISOString(),
      });
    }
  }

  return analyzeMatches(players, completedMatches, matchConfig, playersPerMatch);
}
