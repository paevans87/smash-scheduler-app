using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public class SkillBalanceScorer : IMatchScorer
{
    public double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, Dictionary<Guid, DateTime> lastMatchCompletionTimes)
    {
        var players = allPlayers.Where(p => candidate.PlayerIds.Contains(p.Id)).ToList();

        if (players.Count == 0)
        {
            return 0;
        }

        var skillLevels = players.Select(p => p.SkillLevel).ToList();
        var average = skillLevels.Average();
        var variance = skillLevels.Select(s => Math.Pow(s - average, 2)).Average();
        var standardDeviation = Math.Sqrt(variance);

        var maxDeviation = 9.0;
        var normalisedDeviation = standardDeviation / maxDeviation;

        return (1.0 - normalisedDeviation) * 100.0;
    }
}
