using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Domain.ValueObjects;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.MatchManagement;

public class MatchService : IMatchService
{
    private readonly IMatchRepository _matchRepository;

    public MatchService(IMatchRepository matchRepository)
    {
        _matchRepository = matchRepository;
    }

    public async Task<Match?> GetByIdAsync(Guid id)
    {
        return await _matchRepository.GetByIdAsync(id);
    }

    public async Task<List<Match>> GetBySessionIdAsync(Guid sessionId)
    {
        return await _matchRepository.GetBySessionIdAsync(sessionId);
    }

    public async Task<Match> CreateMatchAsync(Guid sessionId, int courtNumber, List<Guid> playerIds, bool wasAutomated)
    {
        var match = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            CourtNumber = courtNumber,
            State = MatchState.InProgress,
            WasAutomated = wasAutomated,
            PlayerIds = playerIds
        };

        await _matchRepository.InsertAsync(match);
        return match;
    }

    public async Task CompleteMatchAsync(Guid matchId, List<Guid>? winningPlayerIds, MatchScore? score)
    {
        var match = await _matchRepository.GetByIdAsync(matchId);

        if (match == null)
        {
            throw new InvalidOperationException("Match not found");
        }

        match.State = MatchState.Completed;
        match.CompletedAt = DateTime.UtcNow;
        match.Score = score;

        if (winningPlayerIds != null)
        {
            match.WinningPlayerIds = winningPlayerIds;
        }

        await _matchRepository.UpdateAsync(match);
    }

    public async Task UpdateMatchPlayersAsync(Guid matchId, List<Guid> playerIds)
    {
        var match = await _matchRepository.GetByIdAsync(matchId);

        if (match == null)
        {
            throw new InvalidOperationException("Match not found");
        }

        match.PlayerIds = playerIds;
        match.WasAutomated = false;
        await _matchRepository.UpdateAsync(match);
    }

    public async Task DeleteMatchAsync(Guid id)
    {
        await _matchRepository.DeleteAsync(id);
    }
}
