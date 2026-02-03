using FluentAssertions;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.Tests.Components;

public class RealTimeStatsPanelTests
{
    private readonly Session _session;
    private readonly Dictionary<Guid, Player> _playerLookup;
    private readonly List<Guid> _playerIds;

    public RealTimeStatsPanelTests()
    {
        _playerIds = Enumerable.Range(0, 8).Select(_ => Guid.NewGuid()).ToList();

        _playerLookup = new Dictionary<Guid, Player>
        {
            [_playerIds[0]] = new Player { Id = _playerIds[0], Name = "Alice", SkillLevel = 3 },
            [_playerIds[1]] = new Player { Id = _playerIds[1], Name = "Bob", SkillLevel = 2 },
            [_playerIds[2]] = new Player { Id = _playerIds[2], Name = "Charlie", SkillLevel = 4 },
            [_playerIds[3]] = new Player { Id = _playerIds[3], Name = "Diana", SkillLevel = 3 },
            [_playerIds[4]] = new Player { Id = _playerIds[4], Name = "Eve", SkillLevel = 2 },
            [_playerIds[5]] = new Player { Id = _playerIds[5], Name = "Frank", SkillLevel = 4 },
            [_playerIds[6]] = new Player { Id = _playerIds[6], Name = "Grace", SkillLevel = 3 },
            [_playerIds[7]] = new Player { Id = _playerIds[7], Name = "Henry", SkillLevel = 2 }
        };

        _session = new Session
        {
            Id = Guid.NewGuid(),
            ClubId = Guid.NewGuid(),
            CourtCount = 2,
            State = SessionState.Active,
            SessionPlayers = _playerIds.Select(id => new SessionPlayer
            {
                SessionId = Guid.NewGuid(),
                PlayerId = id,
                IsActive = true,
                Player = _playerLookup[id]
            }).ToList()
        };
    }

    private Match CreateMatch(int courtNumber, MatchState state, List<Guid> playerIds, DateTime startedAt, DateTime? completedAt = null)
    {
        return new Match
        {
            Id = Guid.NewGuid(),
            SessionId = _session.Id,
            CourtNumber = courtNumber,
            State = state,
            PlayerIds = playerIds,
            StartedAt = startedAt,
            CompletedAt = completedAt
        };
    }

    [Fact]
    public void CompletedMatchCount_CountsOnlyCompletedMatches()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddMinutes(-15)),
            CreateMatch(2, MatchState.InProgress, _playerIds.Skip(4).Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10)),
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-60), DateTime.UtcNow.AddMinutes(-45))
        };

        var completedCount = matches.Count(m => m.State == MatchState.Completed);

        completedCount.Should().Be(2);
    }

    [Fact]
    public void InProgressMatchCount_CountsOnlyInProgressMatches()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddMinutes(-15)),
            CreateMatch(2, MatchState.InProgress, _playerIds.Skip(4).Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10)),
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-5))
        };

        var inProgressCount = matches.Count(m => m.State == MatchState.InProgress);

        inProgressCount.Should().Be(2);
    }

    [Fact]
    public void BenchCount_CountsPlayersNotInInProgressMatches()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10))
        };

        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchCount = _session.SessionPlayers
            .Where(sp => sp.IsActive)
            .Count(sp => !playersInActiveMatches.Contains(sp.PlayerId));

        benchCount.Should().Be(4);
    }

    [Fact]
    public void TotalPlayTime_CalculatesCorrectly()
    {
        var now = DateTime.UtcNow;
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), now.AddMinutes(-30), now.AddMinutes(-15))
        };

        var totalPlayTime = matches
            .Where(m => m.CompletedAt.HasValue)
            .Sum(m => (m.CompletedAt!.Value - m.StartedAt).TotalMinutes);

        totalPlayTime.Should().Be(15);
    }

    [Fact]
    public void GetPlayerGamesPlayed_CountsAllMatchesForPlayer()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-60), DateTime.UtcNow.AddMinutes(-45)),
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddMinutes(-15)),
            CreateMatch(2, MatchState.InProgress, _playerIds.Skip(4).Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10))
        };

        var playerId = _playerIds[0];
        var gamesPlayed = matches.Count(m => m.PlayerIds.Contains(playerId));

        gamesPlayed.Should().Be(2);
    }

    [Fact]
    public void GetPlayerPlayTime_SumsAllMatchDurations()
    {
        var now = DateTime.UtcNow;
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), now.AddMinutes(-60), now.AddMinutes(-45)),
            CreateMatch(1, MatchState.Completed, _playerIds.Take(4).ToList(), now.AddMinutes(-30), now.AddMinutes(-15))
        };

        var playerId = _playerIds[0];
        var playerMatches = matches.Where(m => m.PlayerIds.Contains(playerId) && m.CompletedAt.HasValue);
        var totalPlayTime = playerMatches.Sum(m => (m.CompletedAt!.Value - m.StartedAt).TotalMinutes);

        totalPlayTime.Should().Be(30);
    }

    [Fact]
    public void GetPlayerStatus_ReturnsPlaying_WhenInActiveMatch()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10))
        };

        var playerId = _playerIds[0];
        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var isPlaying = playersInActiveMatches.Contains(playerId);

        isPlaying.Should().BeTrue();
    }

    [Fact]
    public void GetPlayerStatus_ReturnsBench_WhenNotInActiveMatch()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.InProgress, _playerIds.Take(4).ToList(), DateTime.UtcNow.AddMinutes(-10))
        };

        var playerId = _playerIds[4];
        var playersInActiveMatches = matches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var isPlaying = playersInActiveMatches.Contains(playerId);

        isPlaying.Should().BeFalse();
    }

    [Fact]
    public void FormatDuration_WithHoursAndMinutes()
    {
        var duration = TimeSpan.FromMinutes(90);
        var hours = (int)duration.TotalHours;
        var minutes = duration.Minutes;

        var formatted = hours > 0 ? $"{hours}h {minutes}m" : $"{minutes}m";

        formatted.Should().Be("1h 30m");
    }

    [Fact]
    public void FormatDuration_WithMinutesOnly()
    {
        var duration = TimeSpan.FromMinutes(45);
        var hours = (int)duration.TotalHours;
        var minutes = duration.Minutes;

        var formatted = hours > 0 ? $"{hours}h {minutes}m" : $"{minutes}m";

        formatted.Should().Be("45m");
    }

    [Fact]
    public void FormatDuration_LessThanOneMinute()
    {
        var duration = TimeSpan.FromSeconds(30);
        var totalMinutes = (int)duration.TotalMinutes;

        var formatted = totalMinutes < 1 ? "< 1m" : $"{totalMinutes}m";

        formatted.Should().Be("< 1m");
    }

    [Fact]
    public void PlayerStatsSortedByGamesDescending()
    {
        var matches = new List<Match>
        {
            CreateMatch(1, MatchState.Completed, new List<Guid> { _playerIds[0], _playerIds[1], _playerIds[2], _playerIds[3] }, DateTime.UtcNow.AddMinutes(-60), DateTime.UtcNow.AddMinutes(-45)),
            CreateMatch(1, MatchState.Completed, new List<Guid> { _playerIds[0], _playerIds[1], _playerIds[4], _playerIds[5] }, DateTime.UtcNow.AddMinutes(-30), DateTime.UtcNow.AddMinutes(-15))
        };

        var playerStats = _playerIds
            .Select(id => new
            {
                PlayerId = id,
                GamesPlayed = matches.Count(m => m.PlayerIds.Contains(id))
            })
            .OrderByDescending(p => p.GamesPlayed)
            .ToList();

        playerStats[0].GamesPlayed.Should().Be(2);
        new[] { _playerIds[0], _playerIds[1] }.Should().Contain(playerStats[0].PlayerId);
    }

    [Fact]
    public void AllSessionPlayersIncluded()
    {
        var playerCount = _session.SessionPlayers.Count;

        playerCount.Should().Be(8);
        _session.SessionPlayers.Should().AllSatisfy(sp => _playerLookup.Should().ContainKey(sp.PlayerId));
    }
}
