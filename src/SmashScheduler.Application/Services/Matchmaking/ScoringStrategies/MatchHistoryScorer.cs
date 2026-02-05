using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public class MatchHistoryScorer : IMatchScorer
{
    public double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, MatchScoringContext context)
    {
        if (context.CompletedMatches.Count == 0)
        {
            return 100.0;
        }

        var pairCounts = BuildPairCountLookup(context.CompletedMatches);
        var candidatePlayerIds = candidate.PlayerIds;
        var totalRepeatCount = 0;

        for (var i = 0; i < candidatePlayerIds.Count; i++)
        {
            for (var j = i + 1; j < candidatePlayerIds.Count; j++)
            {
                var pairKey = GetPairKey(candidatePlayerIds[i], candidatePlayerIds[j]);
                if (pairCounts.TryGetValue(pairKey, out var count))
                {
                    totalRepeatCount += count;
                }
            }
        }

        if (totalRepeatCount == 0)
        {
            return 100.0;
        }

        var penaltyPerRepeat = 15.0;
        var totalPenalty = Math.Min(totalRepeatCount * penaltyPerRepeat, 90.0);

        return 100.0 - totalPenalty;
    }

    private Dictionary<string, int> BuildPairCountLookup(List<Match> completedMatches)
    {
        var pairCounts = new Dictionary<string, int>();

        foreach (var match in completedMatches)
        {
            var playerIds = match.PlayerIds;
            for (var i = 0; i < playerIds.Count; i++)
            {
                for (var j = i + 1; j < playerIds.Count; j++)
                {
                    var pairKey = GetPairKey(playerIds[i], playerIds[j]);
                    pairCounts.TryGetValue(pairKey, out var count);
                    pairCounts[pairKey] = count + 1;
                }
            }
        }

        return pairCounts;
    }

    private string GetPairKey(Guid id1, Guid id2)
    {
        return id1.CompareTo(id2) < 0
            ? $"{id1}_{id2}"
            : $"{id2}_{id1}";
    }
}
