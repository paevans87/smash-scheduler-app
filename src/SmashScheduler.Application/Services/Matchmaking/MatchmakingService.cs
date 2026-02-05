using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.Matchmaking;

public class MatchmakingService(
    ISessionRepository sessionRepository,
    IMatchRepository matchRepository,
    IPlayerRepository playerRepository) : IMatchmakingService
{
    private const double SkillBalanceWeight = 0.40;
    private const double MatchHistoryWeight = 0.35;
    private const double TimeOffCourtWeight = 0.25;

    public async Task<List<MatchCandidate>> GenerateMatchesAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var existingMatches = await matchRepository.GetBySessionIdAsync(sessionId);

        var playingPlayerIds = existingMatches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedSessionPlayers = session.SessionPlayers
            .Where(sp => sp.IsActive && !playingPlayerIds.Contains(sp.PlayerId))
            .ToList();

        var benchedPlayers = new List<Player>();
        foreach (var sp in benchedSessionPlayers)
        {
            var player = sp.Player ?? await playerRepository.GetByIdAsync(sp.PlayerId);
            if (player != null)
            {
                benchedPlayers.Add(player);
            }
        }

        var usedCourts = existingMatches
            .Where(m => m.State == MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, session.CourtCount)
            .Where(c => !usedCourts.Contains(c))
            .ToList();

        var completedMatches = existingMatches.Where(m => m.State == MatchState.Completed).ToList();
        var lastMatchTimes = BuildLastMatchCompletionTimes(completedMatches);

        return GenerateScoredMatches(benchedPlayers, availableCourts, completedMatches, lastMatchTimes);
    }

    public async Task<MatchCandidate?> GenerateSingleMatchAsync(Guid sessionId, int courtNumber)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var existingMatches = await matchRepository.GetBySessionIdAsync(sessionId);

        var playingPlayerIds = existingMatches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedSessionPlayers = session.SessionPlayers
            .Where(sp => sp.IsActive && !playingPlayerIds.Contains(sp.PlayerId))
            .ToList();

        var benchedPlayers = new List<Player>();
        foreach (var sp in benchedSessionPlayers)
        {
            var player = sp.Player ?? await playerRepository.GetByIdAsync(sp.PlayerId);
            if (player != null)
            {
                benchedPlayers.Add(player);
            }
        }

        if (benchedPlayers.Count < 4)
        {
            return null;
        }

        var completedMatches = existingMatches.Where(m => m.State == MatchState.Completed).ToList();
        var lastMatchTimes = BuildLastMatchCompletionTimes(completedMatches);
        var context = new MatchScoringContext
        {
            CompletedMatches = completedMatches,
            LastMatchCompletionTimes = lastMatchTimes
        };

        var bestCandidate = FindBestFoursomeWithScoring(benchedPlayers, context);
        if (bestCandidate == null) return null;

        bestCandidate.CourtNumber = courtNumber;
        return bestCandidate;
    }

    private List<MatchCandidate> GenerateScoredMatches(
        List<Player> players,
        List<int> availableCourts,
        List<Match> completedMatches,
        Dictionary<Guid, DateTime> lastMatchTimes)
    {
        var candidates = new List<MatchCandidate>();

        if (players.Count < 4 || !availableCourts.Any())
        {
            return candidates;
        }

        var context = new MatchScoringContext
        {
            CompletedMatches = completedMatches,
            LastMatchCompletionTimes = lastMatchTimes
        };

        var remainingPlayers = new List<Player>(players);
        var courtIndex = 0;

        while (remainingPlayers.Count >= 4 && courtIndex < availableCourts.Count)
        {
            var bestCandidate = FindBestFoursomeWithScoring(remainingPlayers, context);
            if (bestCandidate == null) break;

            bestCandidate.CourtNumber = availableCourts[courtIndex];
            candidates.Add(bestCandidate);

            remainingPlayers = remainingPlayers
                .Where(p => !bestCandidate.PlayerIds.Contains(p.Id))
                .ToList();

            courtIndex++;
        }

        return candidates;
    }

    private MatchCandidate? FindBestFoursomeWithScoring(List<Player> availablePlayers, MatchScoringContext context)
    {
        if (availablePlayers.Count < 4)
        {
            return null;
        }

        var allCombinations = GenerateFoursomeCombinations(availablePlayers);
        var skillScorer = new SkillBalanceScorer();
        var historyScorer = new MatchHistoryScorer();
        var timeScorer = new TimeOffCourtScorer();

        MatchCandidate? bestCandidate = null;
        var bestScore = double.MinValue;

        foreach (var combination in allCombinations)
        {
            var candidate = new MatchCandidate
            {
                PlayerIds = combination.Select(p => p.Id).ToList()
            };

            var skillScore = skillScorer.CalculateScore(candidate, availablePlayers, context);
            var historyScore = historyScorer.CalculateScore(candidate, availablePlayers, context);
            var timeScore = timeScorer.CalculateScore(candidate, availablePlayers, context);

            var totalScore = (skillScore * SkillBalanceWeight) +
                             (historyScore * MatchHistoryWeight) +
                             (timeScore * TimeOffCourtWeight);

            candidate.TotalScore = totalScore;

            if (totalScore > bestScore)
            {
                bestScore = totalScore;
                bestCandidate = candidate;
            }
        }

        return bestCandidate;
    }

    private List<List<Player>> GenerateFoursomeCombinations(List<Player> players)
    {
        var combinations = new List<List<Player>>();
        var count = players.Count;

        if (count > 12)
        {
            var sorted = players.OrderByDescending(p => p.SkillLevel).ToList();
            return GenerateLimitedCombinations(sorted, 100);
        }

        for (var i = 0; i < count - 3; i++)
        {
            for (var j = i + 1; j < count - 2; j++)
            {
                for (var k = j + 1; k < count - 1; k++)
                {
                    for (var l = k + 1; l < count; l++)
                    {
                        combinations.Add(new List<Player>
                        {
                            players[i], players[j], players[k], players[l]
                        });
                    }
                }
            }
        }

        return combinations;
    }

    private List<List<Player>> GenerateLimitedCombinations(List<Player> sortedPlayers, int maxCombinations)
    {
        var combinations = new List<List<Player>>();
        var count = sortedPlayers.Count;
        var random = new Random();

        for (var attempt = 0; attempt < maxCombinations && combinations.Count < maxCombinations; attempt++)
        {
            var indices = Enumerable.Range(0, count).OrderBy(_ => random.Next()).Take(4).OrderBy(x => x).ToList();
            var combination = indices.Select(idx => sortedPlayers[idx]).ToList();

            var alreadyExists = combinations.Any(c =>
                c.Select(p => p.Id).OrderBy(id => id).SequenceEqual(combination.Select(p => p.Id).OrderBy(id => id)));

            if (!alreadyExists)
            {
                combinations.Add(combination);
            }
        }

        return combinations;
    }

    private Dictionary<Guid, DateTime> BuildLastMatchCompletionTimes(List<Match> completedMatches)
    {
        var lastMatchTimes = new Dictionary<Guid, DateTime>();

        foreach (var match in completedMatches.Where(m => m.CompletedAt.HasValue).OrderBy(m => m.CompletedAt))
        {
            foreach (var playerId in match.PlayerIds)
            {
                lastMatchTimes[playerId] = match.CompletedAt!.Value;
            }
        }

        return lastMatchTimes;
    }
}
