using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.SessionManagement;

public class SessionStateManager(ISessionRepository sessionRepository) : ISessionStateManager
{
    public async Task ActivateSessionAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        session.State = SessionState.Active;
        await sessionRepository.UpdateAsync(session);
    }

    public async Task CompleteSessionAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        session.State = SessionState.Complete;
        await sessionRepository.UpdateAsync(session);
    }

    public async Task<SessionState> GetSessionStateAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        return session.State;
    }
}
