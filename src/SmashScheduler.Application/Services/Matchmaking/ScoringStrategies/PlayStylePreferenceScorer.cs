using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public class PlayStylePreferenceScorer : IMatchScorer
{
    public double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, Dictionary<Guid, DateTime> lastMatchCompletionTimes)
    {
        var players = allPlayers.Where(p => candidate.PlayerIds.Contains(p.Id)).ToList();

        if (players.Count == 0)
        {
            return 0;
        }

        var levelPreferenceCount = players.Count(p => p.PlayStylePreference == PlayStylePreference.Level);
        var mixedPreferenceCount = players.Count(p => p.PlayStylePreference == PlayStylePreference.Mixed);
        var openPreferenceCount = players.Count(p => p.PlayStylePreference == PlayStylePreference.Open);

        if (levelPreferenceCount == players.Count)
        {
            return 100.0;
        }

        if (openPreferenceCount == players.Count)
        {
            return 90.0;
        }

        if (mixedPreferenceCount > 0)
        {
            var genders = players.Select(p => p.Gender).Distinct().Count();

            if (genders > 1)
            {
                return 95.0;
            }

            return 60.0;
        }

        return 70.0;
    }
}
