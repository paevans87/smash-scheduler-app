using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.SessionManagement;

public class SessionService(
    ISessionRepository sessionRepository,
    IClubRepository clubRepository,
    IMatchRepository matchRepository,
    IPlayerRepository playerRepository) : ISessionService
{
    public async Task<Session?> GetByIdAsync(Guid id)
    {
        var session = await sessionRepository.GetByIdAsync(id);
        if (session != null)
        {
            session.Matches = await matchRepository.GetBySessionIdAsync(session.Id);
            foreach (var sp in session.SessionPlayers)
            {
                sp.Player = await playerRepository.GetByIdAsync(sp.PlayerId);
            }
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

    public async Task AddPlayerToSessionAsync(Guid sessionId, Guid playerId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        if (session.SessionPlayers.Any(sp => sp.PlayerId == playerId))
            return;

        var player = await playerRepository.GetByIdAsync(playerId);
        session.SessionPlayers.Add(new SessionPlayer
        {
            SessionId = sessionId,
            PlayerId = playerId,
            IsActive = true,
            JoinedAt = DateTime.UtcNow,
            Player = player
        });

        await sessionRepository.UpdateAsync(session);
    }

    public async Task RemovePlayerFromSessionAsync(Guid sessionId, Guid playerId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var sessionPlayer = session.SessionPlayers.FirstOrDefault(sp => sp.PlayerId == playerId);
        if (sessionPlayer != null)
        {
            session.SessionPlayers.Remove(sessionPlayer);
            await sessionRepository.UpdateAsync(session);
        }
    }

    public async Task MarkPlayerInactiveAsync(Guid sessionId, Guid playerId, bool isActive)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var sessionPlayer = session.SessionPlayers.FirstOrDefault(sp => sp.PlayerId == playerId);
        if (sessionPlayer != null)
        {
            sessionPlayer.IsActive = isActive;
            await sessionRepository.UpdateAsync(session);
        }
    }
}
