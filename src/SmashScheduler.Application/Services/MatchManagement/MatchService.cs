using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Domain.ValueObjects;

namespace SmashScheduler.Application.Services.MatchManagement;

public class MatchService(IMatchRepository matchRepository) : IMatchService
{
    public async Task<Match?> GetByIdAsync(Guid id)
    {
        return await matchRepository.GetByIdAsync(id);
    }

    public async Task<List<Match>> GetBySessionIdAsync(Guid sessionId)
    {
        return await matchRepository.GetBySessionIdAsync(sessionId);
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
            StartedAt = DateTime.UtcNow
        };

        await matchRepository.InsertAsync(match);
        return match;
    }

    public async Task CompleteMatchAsync(Guid matchId, List<Guid>? winningPlayerIds, MatchScore? score)
    {
        var match = await matchRepository.GetByIdAsync(matchId);
        if (match == null) throw new InvalidOperationException("Match not found");

        match.State = MatchState.Completed;
        match.CompletedAt = DateTime.UtcNow;
        match.Score = score;

        await matchRepository.UpdateAsync(match);
    }

    public async Task UpdateMatchPlayersAsync(Guid matchId, List<Guid> playerIds)
    {
        var match = await matchRepository.GetByIdAsync(matchId);
        if (match == null) throw new InvalidOperationException("Match not found");

        await matchRepository.UpdateAsync(match);
    }

    public async Task DeleteMatchAsync(Guid id)
    {
        await matchRepository.DeleteAsync(id);
    }
}
