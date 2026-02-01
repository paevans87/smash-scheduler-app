using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Application.Services.SessionManagement;

public interface ISessionService
{
    Task<Session?> GetByIdAsync(Guid id);
    Task<List<Session>> GetByClubIdAsync(Guid clubId);
    Task<Session> CreateSessionAsync(Guid clubId, DateTime scheduledDateTime, int? courtCountOverride);
    Task UpdateSessionAsync(Session session);
    Task AddPlayerToSessionAsync(Guid sessionId, Guid playerId);
    Task RemovePlayerFromSessionAsync(Guid sessionId, Guid playerId);
    Task MarkPlayerInactiveAsync(Guid sessionId, Guid playerId, bool isActive);
    Task DeleteSessionAsync(Guid id);
}
