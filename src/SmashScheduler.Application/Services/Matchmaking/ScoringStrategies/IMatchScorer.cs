using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public interface IMatchScorer
{
    double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, Dictionary<Guid, DateTime> lastMatchCompletionTimes);
}
