using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.SessionManagement;

public class SessionStateManager : ISessionStateManager
{
    private readonly ISessionRepository _sessionRepository;

    public SessionStateManager(ISessionRepository sessionRepository)
    {
        _sessionRepository = sessionRepository;
    }

    public async Task ActivateSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Session not found");
        }

        if (session.State != SessionState.Draft)
        {
            throw new InvalidOperationException("Can only activate draft sessions");
        }

        session.State = SessionState.Active;
        await _sessionRepository.UpdateAsync(session);
    }

    public async Task CompleteSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Session not found");
        }

        if (session.State != SessionState.Active)
        {
            throw new InvalidOperationException("Can only complete active sessions");
        }

        session.State = SessionState.Complete;
        await _sessionRepository.UpdateAsync(session);
    }

    public async Task<SessionState> GetSessionStateAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Session not found");
        }

        return session.State;
    }
}
