using FluentAssertions;
using Moq;
using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Domain.ValueObjects;
using DomainMatch = SmashScheduler.Domain.Entities.Match;
using Xunit;

namespace SmashScheduler.Tests.Services;

public class MatchServiceTests
{
    private readonly Mock<IMatchRepository> _matchRepositoryMock;
    private readonly MatchService _matchService;

    public MatchServiceTests()
    {
        _matchRepositoryMock = new Mock<IMatchRepository>();
        _matchService = new MatchService(_matchRepositoryMock.Object);
    }

    [Fact]
    public async Task UpdateMatchPlayersAsync_WithValidData_UpdatesPlayersAndSetsManualFlag()
    {
        var matchId = Guid.NewGuid();
        var originalPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var newPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        var existingMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            PlayerIds = originalPlayerIds,
            State = MatchState.InProgress,
            WasAutomated = true
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(existingMatch);

        await _matchService.UpdateMatchPlayersAsync(matchId, newPlayerIds);

        existingMatch.PlayerIds.Should().BeEquivalentTo(newPlayerIds);
        existingMatch.WasAutomated.Should().BeFalse();
        _matchRepositoryMock.Verify(r => r.UpdateAsync(existingMatch), Times.Once);
    }

    [Fact]
    public async Task UpdateMatchPlayersAsync_WithNonExistentMatch_ThrowsException()
    {
        var matchId = Guid.NewGuid();
        var newPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync((DomainMatch?)null);

        var act = async () => await _matchService.UpdateMatchPlayersAsync(matchId, newPlayerIds);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Match not found");
    }

    [Fact]
    public async Task UpdateMatchPlayersAsync_PreservesOtherMatchProperties()
    {
        var matchId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var startedAt = DateTime.UtcNow.AddMinutes(-10);
        var originalPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var newPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        var existingMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = sessionId,
            CourtNumber = 2,
            PlayerIds = originalPlayerIds,
            State = MatchState.InProgress,
            WasAutomated = true,
            StartedAt = startedAt
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(existingMatch);

        await _matchService.UpdateMatchPlayersAsync(matchId, newPlayerIds);

        existingMatch.Id.Should().Be(matchId);
        existingMatch.SessionId.Should().Be(sessionId);
        existingMatch.CourtNumber.Should().Be(2);
        existingMatch.State.Should().Be(MatchState.InProgress);
        existingMatch.StartedAt.Should().Be(startedAt);
    }

    [Fact]
    public async Task CreateMatchAsync_WithValidData_CreatesMatch()
    {
        var sessionId = Guid.NewGuid();
        var courtNumber = 1;
        var playerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var wasAutomated = true;

        var result = await _matchService.CreateMatchAsync(sessionId, courtNumber, playerIds, wasAutomated);

        result.Should().NotBeNull();
        result.SessionId.Should().Be(sessionId);
        result.CourtNumber.Should().Be(courtNumber);
        result.PlayerIds.Should().BeEquivalentTo(playerIds);
        result.WasAutomated.Should().Be(wasAutomated);
        result.State.Should().Be(MatchState.InProgress);
        _matchRepositoryMock.Verify(r => r.InsertAsync(It.IsAny<DomainMatch>()), Times.Once);
    }

    [Fact]
    public async Task CreateMatchAsync_WithWasAutomatedFalse_CreatesManualMatch()
    {
        var sessionId = Guid.NewGuid();
        var courtNumber = 1;
        var playerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var wasAutomated = false;

        var result = await _matchService.CreateMatchAsync(sessionId, courtNumber, playerIds, wasAutomated);

        result.WasAutomated.Should().BeFalse();
    }

    [Fact]
    public async Task CreateDraftMatchAsync_CreatesDraftMatch()
    {
        var sessionId = Guid.NewGuid();
        var playerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };

        var result = await _matchService.CreateDraftMatchAsync(sessionId, playerIds);

        result.Should().NotBeNull();
        result.SessionId.Should().Be(sessionId);
        result.State.Should().Be(MatchState.Draft);
        result.CourtNumber.Should().Be(0);
        result.PlayerIds.Should().BeEquivalentTo(playerIds);
        _matchRepositoryMock.Verify(r => r.InsertAsync(It.IsAny<DomainMatch>()), Times.Once);
    }

    [Fact]
    public async Task StartDraftMatchAsync_TransitionsToDraftToInProgress()
    {
        var matchId = Guid.NewGuid();
        var draftMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 0,
            State = MatchState.Draft,
            PlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() }
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(draftMatch);

        await _matchService.StartDraftMatchAsync(matchId, 3);

        draftMatch.State.Should().Be(MatchState.InProgress);
        draftMatch.CourtNumber.Should().Be(3);
        draftMatch.StartedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        _matchRepositoryMock.Verify(r => r.UpdateAsync(draftMatch), Times.Once);
    }

    [Fact]
    public async Task StartDraftMatchAsync_WithNonDraftMatch_ThrowsException()
    {
        var matchId = Guid.NewGuid();
        var inProgressMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() }
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(inProgressMatch);

        var act = async () => await _matchService.StartDraftMatchAsync(matchId, 2);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("Match is not a draft");
    }

    [Fact]
    public void ManualMatchResult_WithSaveAsDraftTrue_StoresCorrectly()
    {
        var playerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var result = new ManualMatchResult(3, playerIds, true);

        result.CourtNumber.Should().Be(3);
        result.PlayerIds.Should().BeEquivalentTo(playerIds);
        result.SaveAsDraft.Should().BeTrue();
    }

    [Fact]
    public void ManualMatchResult_WithSaveAsDraftFalse_StoresCorrectly()
    {
        var playerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() };
        var result = new ManualMatchResult(1, playerIds, false);

        result.CourtNumber.Should().Be(1);
        result.PlayerIds.Should().BeEquivalentTo(playerIds);
        result.SaveAsDraft.Should().BeFalse();
    }

    [Fact]
    public async Task CompleteMatchAsync_WithWinningPlayerIds_SetsWinningPlayerIds()
    {
        var matchId = Guid.NewGuid();
        var winningPlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        var score = new MatchScore(21, 15);

        var existingMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = new List<Guid> { winningPlayerIds[0], winningPlayerIds[1], Guid.NewGuid(), Guid.NewGuid() },
            StartedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(existingMatch);

        await _matchService.CompleteMatchAsync(matchId, winningPlayerIds, score);

        existingMatch.WinningPlayerIds.Should().BeEquivalentTo(winningPlayerIds);
        _matchRepositoryMock.Verify(r => r.UpdateAsync(existingMatch), Times.Once);
    }

    [Fact]
    public async Task CompleteMatchAsync_WithNullWinningPlayerIds_DoesNotSetWinningPlayerIds()
    {
        var matchId = Guid.NewGuid();

        var existingMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() },
            StartedAt = DateTime.UtcNow.AddMinutes(-10)
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(existingMatch);

        await _matchService.CompleteMatchAsync(matchId, null, null);

        existingMatch.WinningPlayerIds.Should().BeEmpty();
        _matchRepositoryMock.Verify(r => r.UpdateAsync(existingMatch), Times.Once);
    }

    [Fact]
    public async Task CompleteMatchAsync_SetsCompletedState()
    {
        var matchId = Guid.NewGuid();
        var score = new MatchScore(21, 18);

        var existingMatch = new DomainMatch
        {
            Id = matchId,
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = new List<Guid> { Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid() },
            StartedAt = DateTime.UtcNow.AddMinutes(-15)
        };

        _matchRepositoryMock.Setup(r => r.GetByIdAsync(matchId)).ReturnsAsync(existingMatch);

        await _matchService.CompleteMatchAsync(matchId, null, score);

        existingMatch.State.Should().Be(MatchState.Completed);
        existingMatch.CompletedAt.Should().NotBeNull();
        existingMatch.CompletedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        existingMatch.Score.Should().NotBeNull();
        existingMatch.Score!.Team1Score.Should().Be(21);
        existingMatch.Score!.Team2Score.Should().Be(18);
    }
}
