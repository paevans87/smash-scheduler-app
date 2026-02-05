using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;

public interface IMatchScorer
{
    double CalculateScore(MatchCandidate candidate, List<Player> allPlayers, MatchScoringContext context);
}

public class MatchScoringContext
{
    public Dictionary<Guid, DateTime> LastMatchCompletionTimes { get; set; } = new();
    public List<Match> CompletedMatches { get; set; } = new();
}
