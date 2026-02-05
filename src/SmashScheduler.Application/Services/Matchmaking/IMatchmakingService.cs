using SmashScheduler.Application.Services.Matchmaking.Models;

namespace SmashScheduler.Application.Services.Matchmaking;

public interface IMatchmakingService
{
    Task<List<MatchCandidate>> GenerateMatchesAsync(Guid sessionId);
    Task<MatchCandidate?> GenerateSingleMatchAsync(Guid sessionId, int courtNumber);
}
