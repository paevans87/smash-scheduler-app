using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public class TimeOffCourtScorer : IMatchScorer
{
    public double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, Dictionary<Guid, DateTime> lastMatchCompletionTimes)
    {
        var now = DateTime.UtcNow;
        var totalMinutesOff = 0.0;

        foreach (var playerId in candidate.PlayerIds)
        {
            if (lastMatchCompletionTimes.TryGetValue(playerId, out var lastCompletion))
            {
                var minutesOff = (now - lastCompletion).TotalMinutes;
                totalMinutesOff += minutesOff;
            }
            else
            {
                totalMinutesOff += 60.0;
            }
        }

        var averageMinutesOff = totalMinutesOff / candidate.PlayerIds.Count;
        var normalisedScore = Math.Min(averageMinutesOff / 30.0, 1.0);

        return normalisedScore * 100.0;
    }
}
