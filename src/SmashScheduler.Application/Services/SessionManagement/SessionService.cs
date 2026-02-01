using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.SessionManagement;

public class SessionService(
    ISessionRepository sessionRepository,
    IClubRepository clubRepository,
    IMatchRepository matchRepository) : ISessionService
{
    public async Task<Session?> GetByIdAsync(Guid id)
    {
        var session = await sessionRepository.GetByIdAsync(id);
        if (session != null)
        {
            session.Matches = await matchRepository.GetBySessionIdAsync(session.Id);
        }
        return session;
    }

    public async Task<List<Session>> GetByClubIdAsync(Guid clubId)
    {
        return await sessionRepository.GetByClubIdAsync(clubId);
    }

    public async Task<Session> CreateSessionAsync(Guid clubId, DateTime scheduledDateTime, int? courtCountOverride)
    {
        var club = await clubRepository.GetByIdAsync(clubId);
        if (club == null) throw new InvalidOperationException("Club not found");

        var session = new Session
        {
            Id = Guid.NewGuid(),
            ClubId = clubId,
            ScheduledDateTime = scheduledDateTime,
            CourtCount = courtCountOverride ?? club.DefaultCourtCount,
            State = SessionState.Draft
        };

        await sessionRepository.InsertAsync(session);
        return session;
    }

    public async Task UpdateSessionAsync(Session session)
    {
        await sessionRepository.UpdateAsync(session);
    }

    public async Task DeleteSessionAsync(Guid id)
    {
        await sessionRepository.DeleteAsync(id);
    }

    public async Task MarkPlayerInactiveAsync(Guid sessionId, Guid playerId, bool isActive)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        await sessionRepository.UpdateAsync(session);
    }
}
