using SmashScheduler.Application.Services.Analytics.Models;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.Analytics;

public class AnalyticsService : IAnalyticsService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IMatchRepository _matchRepository;
    private readonly IPlayerRepository _playerRepository;

    public AnalyticsService(
        ISessionRepository sessionRepository,
        IMatchRepository matchRepository,
        IPlayerRepository playerRepository)
    {
        _sessionRepository = sessionRepository;
        _matchRepository = matchRepository;
        _playerRepository = playerRepository;
    }

    public async Task<SessionStatistics> GetSessionStatisticsAsync(Guid sessionId)
    {
        var matches = await _matchRepository.GetBySessionIdAsync(sessionId);
        var statistics = new SessionStatistics
        {
            TotalMatches = matches.Count,
            CompletedMatches = matches.Count(m => m.State == MatchState.Completed),
            AutomatedMatches = matches.Count(m => m.WasAutomated),
            ManualMatches = matches.Count(m => !m.WasAutomated)
        };

        if (statistics.TotalMatches > 0)
        {
            statistics.OverrideRate = (double)statistics.ManualMatches / statistics.TotalMatches * 100.0;
        }

        var completedMatches = matches.Where(m => m.State == MatchState.Completed && m.CompletedAt.HasValue).ToList();

        if (completedMatches.Any())
        {
            var totalMinutes = completedMatches.Sum(m => (m.CompletedAt!.Value - m.StartedAt).TotalMinutes);
            statistics.TotalGameTime = TimeSpan.FromMinutes(totalMinutes);
        }

        var gamesPerPlayer = new Dictionary<Guid, int>();
        var playTimePerPlayer = new Dictionary<Guid, TimeSpan>();

        foreach (var match in matches)
        {
            foreach (var playerId in match.PlayerIds)
            {
                if (!gamesPerPlayer.ContainsKey(playerId))
                {
                    gamesPerPlayer[playerId] = 0;
                    playTimePerPlayer[playerId] = TimeSpan.Zero;
                }

                gamesPerPlayer[playerId]++;

                if (match.State == MatchState.Completed && match.CompletedAt.HasValue)
                {
                    var matchDuration = match.CompletedAt.Value - match.StartedAt;
                    playTimePerPlayer[playerId] = playTimePerPlayer[playerId].Add(matchDuration);
                }
            }
        }

        statistics.GamesPlayedPerPlayer = gamesPerPlayer;
        statistics.PlayTimePerPlayer = playTimePerPlayer;

        return statistics;
    }

    public async Task<PlayerStatistics> GetPlayerStatisticsAsync(Guid playerId)
    {
        var statistics = new PlayerStatistics
        {
            PlayerId = playerId
        };

        var allMatches = await _matchRepository.GetAllAsync();
        var playerMatches = allMatches.Where(m => m.PlayerIds.Contains(playerId)).ToList();

        statistics.TotalGamesPlayed = playerMatches.Count;

        var completedMatches = playerMatches.Where(m => m.State == MatchState.Completed && m.CompletedAt.HasValue).ToList();

        if (completedMatches.Any())
        {
            var totalPlayTime = completedMatches.Sum(m => (m.CompletedAt!.Value - m.StartedAt).TotalMinutes);
            var sessionCount = completedMatches.Select(m => m.SessionId).Distinct().Count();

            if (sessionCount > 0)
            {
                statistics.AveragePlayTimePerSession = TimeSpan.FromMinutes(totalPlayTime / sessionCount);
            }
        }

        return statistics;
    }
}
