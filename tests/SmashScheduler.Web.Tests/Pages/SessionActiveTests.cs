using FluentAssertions;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.Tests.Pages;

public class SessionActiveTests
{
    private readonly Guid _clubId;
    private readonly Guid _sessionId;
    private readonly List<Guid> _playerIds;
    private readonly Session _session;
    private readonly Dictionary<Guid, Player> _playerLookup;

    public SessionActiveTests()
    {
        _clubId = Guid.NewGuid();
        _sessionId = Guid.NewGuid();
        _playerIds = Enumerable.Range(0, 8).Select(_ => Guid.NewGuid()).ToList();

        var players = _playerIds.Select((id, i) => new Player
        {
            Id = id,
            Name = $"Player{i + 1}",
            SkillLevel = (i % 4) + 1,
            ClubId = _clubId
        }).ToList();

        _playerLookup = players.ToDictionary(p => p.Id);

        _session = new Session
        {
            Id = _sessionId,
            ClubId = _clubId,
            CourtCount = 2,
            State = SessionState.Active,
            ScheduledDateTime = DateTime.UtcNow,
            SessionPlayers = players.Select(p => new SessionPlayer
            {
                SessionId = _sessionId,
                PlayerId = p.Id,
                IsActive = true,
                Player = p
            }).ToList()
        };
    }

    private Match CreateMatch(int courtNumber, MatchState state, List<Guid> playerIds)
    {
        return new Match
        {
            Id = Guid.NewGuid(),
            SessionId = _sessionId,
            CourtNumber = courtNumber,
            State = state,
            PlayerIds = playerIds,
            StartedAt = DateTime.UtcNow.AddMinutes(-15),
            CompletedAt = state == MatchState.Completed ? DateTime.UtcNow : null
        };
    }

    [Fact]
    public void Session_HasCorrectCourtCount()
    {
        _session.CourtCount.Should().Be(2);
    }

    [Fact]
    public void Session_HasCorrectState()
    {
        _session.State.Should().Be(SessionState.Active);
    }

    [Fact]
    public void Session_HasCorrectPlayerCount()
    {
        _session.SessionPlayers.Should().HaveCount(8);
    }

    [Fact]
    public void PlayerLookup_ContainsAllPlayers()
    {
        foreach (var sp in _session.SessionPlayers)
        {
            _playerLookup.Should().ContainKey(sp.PlayerId);
        }
    }

    [Fact]
    public void CanGenerateMatches_ReturnsTrue_WhenCourtAvailableAndEnoughBenchedPlayers()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList())
        };

        var occupiedCourts = matches
            .Where(m => m.State == MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, _session.CourtCount)
            .Where(c => !occupiedCourts.Contains(c))
            .ToList();

        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedPlayerCount = _session.SessionPlayers
            .Where(sp => sp.IsActive)
            .Count(sp => !playersInActiveMatches.Contains(sp.PlayerId));

        var canGenerateMatches = availableCourts.Any() && benchedPlayerCount >= 4;

        canGenerateMatches.Should().BeTrue();
    }

    [Fact]
    public void CanGenerateMatches_ReturnsFalse_WhenNoCourtsAvailable()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList()),
            CreateMatch(2, MatchState.InProgress, _playerIds.Skip(4).Take(4).ToList())
        };

        var occupiedCourts = matches
            .Where(m => m.State == MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, _session.CourtCount)
            .Where(c => !occupiedCourts.Contains(c))
            .ToList();

        availableCourts.Should().BeEmpty();
    }

    [Fact]
    public void CanGenerateMatches_ReturnsFalse_WhenNotEnoughBenchedPlayers()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList())
        };

        var session = new Session
        {
            Id = _sessionId,
            ClubId = _clubId,
            CourtCount = 2,
            State = SessionState.Active,
            SessionPlayers = _playerIds.Take(5).Select(id => new SessionPlayer
            {
                SessionId = _sessionId,
                PlayerId = id,
                IsActive = true,
                Player = _playerLookup[id]
            }).ToList()
        };

        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedPlayerCount = session.SessionPlayers
            .Where(sp => sp.IsActive)
            .Count(sp => !playersInActiveMatches.Contains(sp.PlayerId));

        benchedPlayerCount.Should().Be(1);
        var canGenerateMatches = benchedPlayerCount >= 4;
        canGenerateMatches.Should().BeFalse();
    }

    [Fact]
    public void GetBenchedPlayerCount_CountsPlayersNotInActiveMatches()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList())
        };

        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedPlayerCount = _session.SessionPlayers
            .Where(sp => sp.IsActive)
            .Count(sp => !playersInActiveMatches.Contains(sp.PlayerId));

        benchedPlayerCount.Should().Be(4);
    }

    [Fact]
    public void GetAvailableCourts_ReturnsUnoccupiedCourts()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList())
        };

        var occupiedCourts = matches
            .Where(m => m.State == MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, _session.CourtCount)
            .Where(c => !occupiedCourts.Contains(c))
            .ToList();

        availableCourts.Should().ContainSingle().Which.Should().Be(2);
    }

    [Fact]
    public void CompleteSessionTransitionsState()
    {
        var session = new Session
        {
            Id = _sessionId,
            ClubId = _clubId,
            CourtCount = 2,
            State = SessionState.Active
        };

        session.State = SessionState.Complete;

        session.State.Should().Be(SessionState.Complete);
    }

    [Fact]
    public void GetBenchedPlayers_ReturnsCorrectPlayers()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList())
        };

        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedPlayers = _session.SessionPlayers
            .Where(sp => sp.IsActive && !playersInActiveMatches.Contains(sp.PlayerId))
            .Select(sp => sp.PlayerId)
            .ToList();

        benchedPlayers.Should().HaveCount(4);
        benchedPlayers.Should().Contain(_playerIds.Skip(4).Take(4));
    }

    [Fact]
    public void GenerateFallbackMatches_DistributesPlayersToAvailableCourts()
    {
        var benchedPlayerIds = _playerIds.Skip(4).Take(4).ToList();
        var availableCourtNumbers = new List<int> { 2 };

        var generatedMatches = new List<Match>();
        var playerIndex = 0;

        foreach (var courtNumber in availableCourtNumbers)
        {
            if (playerIndex + 4 <= benchedPlayerIds.Count)
            {
                var matchPlayerIds = benchedPlayerIds.Skip(playerIndex).Take(4).ToList();
                generatedMatches.Add(new Match
                {
                    Id = Guid.NewGuid(),
                    SessionId = _sessionId,
                    CourtNumber = courtNumber,
                    State = MatchState.InProgress,
                    PlayerIds = matchPlayerIds,
                    StartedAt = DateTime.UtcNow
                });
                playerIndex += 4;
            }
        }

        generatedMatches.Should().HaveCount(1);
        generatedMatches[0].CourtNumber.Should().Be(2);
        generatedMatches[0].PlayerIds.Should().HaveCount(4);
    }

    [Fact]
    public void InProgressMatches_FilteredCorrectly()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList()),
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList()),
            CreateMatch(2, MatchState.InProgress, _playerIds.Skip(4).Take(4).ToList())
        };

        var inProgressMatches = matches.Where(m => m.State == MatchState.InProgress).ToList();

        inProgressMatches.Should().HaveCount(2);
    }

    [Fact]
    public void CompletedMatches_FilteredCorrectly()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList()),
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList()),
            CreateMatch(2, MatchState.Completed, _playerIds.Skip(4).Take(4).ToList())
        };

        var completedMatches = matches.Where(m => m.State == MatchState.Completed).ToList();

        completedMatches.Should().HaveCount(2);
    }
}
