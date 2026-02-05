using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public class BlacklistAvoidanceScorer : IMatchScorer
{
    private readonly List<PlayerBlacklist> _blacklists;

    public BlacklistAvoidanceScorer(List<PlayerBlacklist> blacklists)
    {
        _blacklists = blacklists;
    }

    public double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, MatchScoringContext context)
    {
        var playerIds = candidate.PlayerIds;
        var penaltyCount = 0;

        foreach (var playerId in playerIds)
        {
            var playerBlacklists = _blacklists.Where(b => b.PlayerId == playerId).ToList();

            foreach (var blacklist in playerBlacklists)
            {
                if (blacklist.BlacklistType == BlacklistType.Partner && playerIds.Contains(blacklist.BlacklistedPlayerId))
                {
                    penaltyCount++;
                }

                if (blacklist.BlacklistType == BlacklistType.Opponent && playerIds.Contains(blacklist.BlacklistedPlayerId))
                {
                    penaltyCount++;
                }
            }
        }

        if (penaltyCount == 0)
        {
            return 100.0;
        }

        var penaltyFactor = Math.Min(penaltyCount * 20.0, 100.0);
        return 100.0 - penaltyFactor;
    }
}
