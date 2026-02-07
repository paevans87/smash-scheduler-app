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
            PlayerIds = playerIds,
            State = MatchState.InProgress,
            WasAutomated = wasAutomated,
            StartedAt = DateTime.UtcNow
        };

        await matchRepository.InsertAsync(match);
        return match;
    }

    public async Task<Match> CreateDraftMatchAsync(Guid sessionId, List<Guid> playerIds)
    {
        var match = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            CourtNumber = 0,
            PlayerIds = playerIds,
            State = MatchState.Draft,
            WasAutomated = true
        };

        await matchRepository.InsertAsync(match);
        return match;
    }

    public async Task StartDraftMatchAsync(Guid matchId, int courtNumber)
    {
        var match = await matchRepository.GetByIdAsync(matchId);
        if (match == null) throw new InvalidOperationException("Match not found");
        if (match.State != MatchState.Draft) throw new InvalidOperationException("Match is not a draft");

        match.State = MatchState.InProgress;
        match.CourtNumber = courtNumber;
        match.StartedAt = DateTime.UtcNow;

        await matchRepository.UpdateAsync(match);
    }

    public async Task CompleteMatchAsync(Guid matchId, List<Guid>? winningPlayerIds, MatchScore? score)
    {
        var match = await matchRepository.GetByIdAsync(matchId);
        if (match == null) throw new InvalidOperationException("Match not found");

        match.State = MatchState.Completed;
        match.CompletedAt = DateTime.UtcNow;
        match.Score = score;
        if (winningPlayerIds != null)
            match.WinningPlayerIds = winningPlayerIds;

        await matchRepository.UpdateAsync(match);
    }

    public async Task UpdateMatchPlayersAsync(Guid matchId, List<Guid> playerIds)
    {
        var match = await matchRepository.GetByIdAsync(matchId);
        if (match == null) throw new InvalidOperationException("Match not found");

        match.PlayerIds = playerIds;
        match.WasAutomated = false;

        await matchRepository.UpdateAsync(match);
    }

    public async Task DeleteMatchAsync(Guid id)
    {
        await matchRepository.DeleteAsync(id);
    }
}
