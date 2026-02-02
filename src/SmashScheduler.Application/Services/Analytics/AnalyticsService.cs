using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Application.Services.Analytics.Models;

namespace SmashScheduler.Application.Services.Analytics;

public class AnalyticsService(
    ISessionRepository sessionRepository,
    IMatchRepository matchRepository) : IAnalyticsService
{
    public async Task<SessionStatistics> GetSessionStatisticsAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var matches = await matchRepository.GetBySessionIdAsync(sessionId);

        return new SessionStatistics
        {
            SessionId = sessionId,
            TotalMatches = matches.Count,
            CompletedMatches = matches.Count(m => m.State == Domain.Enums.MatchState.Completed)
        };
    }

    public Task<PlayerStatistics> GetPlayerStatisticsAsync(Guid playerId)
    {
        return Task.FromResult(new PlayerStatistics
        {
            PlayerId = playerId,
            TotalGamesPlayed = 0
        });
    }
}
