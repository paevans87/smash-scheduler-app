using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.ValueObjects;

namespace SmashScheduler.Application.Services.MatchManagement;

public interface IMatchService
{
    Task<Match?> GetByIdAsync(Guid id);
    Task<List<Match>> GetBySessionIdAsync(Guid sessionId);
    Task<Match> CreateMatchAsync(Guid sessionId, int courtNumber, List<Guid> playerIds, bool wasAutomated);
    Task CompleteMatchAsync(Guid matchId, List<Guid>? winningPlayerIds, MatchScore? score);
    Task UpdateMatchPlayersAsync(Guid matchId, List<Guid> playerIds);
    Task DeleteMatchAsync(Guid id);
}
