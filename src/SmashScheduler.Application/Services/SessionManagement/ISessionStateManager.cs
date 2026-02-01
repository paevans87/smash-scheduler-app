using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.SessionManagement;

public interface ISessionStateManager
{
    Task ActivateSessionAsync(Guid sessionId);
    Task CompleteSessionAsync(Guid sessionId);
    Task<SessionState> GetSessionStateAsync(Guid sessionId);
}
