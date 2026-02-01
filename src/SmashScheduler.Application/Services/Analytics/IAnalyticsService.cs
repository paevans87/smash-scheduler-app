using SmashScheduler.Application.Services.Analytics.Models;

namespace SmashScheduler.Application.Services.Analytics;

public interface IAnalyticsService
{
    Task<SessionStatistics> GetSessionStatisticsAsync(Guid sessionId);
    Task<PlayerStatistics> GetPlayerStatisticsAsync(Guid playerId);
}
