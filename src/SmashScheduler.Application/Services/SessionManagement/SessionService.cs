using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.SessionManagement;

public class SessionService : ISessionService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IClubRepository _clubRepository;
    private readonly IMatchRepository _matchRepository;

    public SessionService(
        ISessionRepository sessionRepository,
        IClubRepository clubRepository,
        IMatchRepository matchRepository)
    {
        _sessionRepository = sessionRepository;
        _clubRepository = clubRepository;
        _matchRepository = matchRepository;
    }

    public async Task<Session?> GetByIdAsync(Guid id)
    {
        var session = await _sessionRepository.GetByIdAsync(id);

        if (session != null)
        {
            session.SessionPlayers = await _sessionRepository.GetSessionPlayersAsync(id);
            session.Matches = await _matchRepository.GetBySessionIdAsync(id);
        }

        return session;
    }

    public async Task<List<Session>> GetByClubIdAsync(Guid clubId)
    {
        return await _sessionRepository.GetByClubIdAsync(clubId);
    }

    public async Task<Session?> GetActiveSessionAsync(Guid clubId)
    {
        var session = await _sessionRepository.GetActiveSessionAsync(clubId);

        if (session != null)
        {
            session.SessionPlayers = await _sessionRepository.GetSessionPlayersAsync(session.Id);
            session.Matches = await _matchRepository.GetBySessionIdAsync(session.Id);
        }

        return session;
    }

    public async Task<Session> CreateSessionAsync(Guid clubId, DateTime scheduledDateTime, int? courtCountOverride)
    {
        var club = await _clubRepository.GetByIdAsync(clubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        var session = new Session
        {
            Id = Guid.NewGuid(),
            ClubId = clubId,
            ScheduledDateTime = scheduledDateTime,
            CourtCount = courtCountOverride ?? club.DefaultCourtCount,
            State = SessionState.Draft
        };

        await _sessionRepository.InsertAsync(session);
        return session;
    }

    public async Task AddPlayerToSessionAsync(Guid sessionId, Guid playerId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Session not found");
        }

        if (session.State != SessionState.Draft)
        {
            throw new InvalidOperationException("Can only add players to draft sessions");
        }

        var sessionPlayer = new SessionPlayer
        {
            SessionId = sessionId,
            PlayerId = playerId,
            IsActive = true
        };

        await _sessionRepository.AddPlayerToSessionAsync(sessionPlayer);
    }

    public async Task RemovePlayerFromSessionAsync(Guid sessionId, Guid playerId)
    {
        await _sessionRepository.RemovePlayerFromSessionAsync(sessionId, playerId);
    }

    public async Task MarkPlayerInactiveAsync(Guid sessionId, Guid playerId, bool isActive)
    {
        var sessionPlayers = await _sessionRepository.GetSessionPlayersAsync(sessionId);
        var sessionPlayer = sessionPlayers.FirstOrDefault(sp => sp.PlayerId == playerId);

        if (sessionPlayer == null)
        {
            throw new InvalidOperationException("Player not found in session");
        }

        sessionPlayer.IsActive = isActive;
        await _sessionRepository.UpdateSessionPlayerAsync(sessionPlayer);
    }

    public async Task DeleteSessionAsync(Guid id)
    {
        await _matchRepository.DeleteBySessionIdAsync(id);
        await _sessionRepository.DeleteAsync(id);
    }
}
