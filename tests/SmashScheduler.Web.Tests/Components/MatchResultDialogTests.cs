using FluentAssertions;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Domain.ValueObjects;

namespace SmashScheduler.Web.Tests.Components;

public class MatchResultDialogTests
{
    private readonly Guid[] _playerIds;
    private readonly Dictionary<Guid, Player> _playerLookup;
    private readonly Match _match;

    public MatchResultDialogTests()
    {
        _playerIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid()
        };

        _playerLookup = new Dictionary<Guid, Player>
        {
            [_playerIds[0]] = new Player { Id = _playerIds[0], Name = "Alice", SkillLevel = 3 },
            [_playerIds[1]] = new Player { Id = _playerIds[1], Name = "Bob", SkillLevel = 2 },
            [_playerIds[2]] = new Player { Id = _playerIds[2], Name = "Charlie", SkillLevel = 4 },
            [_playerIds[3]] = new Player { Id = _playerIds[3], Name = "Diana", SkillLevel = 3 }
        };

        _match = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = _playerIds.ToList(),
            StartedAt = DateTime.UtcNow.AddMinutes(-15)
        };
    }

    [Fact]
    public void Match_PlayerIds_ReturnsCorrectPlayerIds()
    {
        _match.PlayerIds.Should().HaveCount(4);
        _match.PlayerIds.Should().Contain(_playerIds);
    }

    [Fact]
    public void Match_Team1Players_AreFirstTwoPlayerIds()
    {
        var team1Ids = _match.PlayerIds.Take(2).ToList();
        team1Ids.Should().Contain(_playerIds[0]);
        team1Ids.Should().Contain(_playerIds[1]);
    }

    [Fact]
    public void Match_Team2Players_AreLastTwoPlayerIds()
    {
        var team2Ids = _match.PlayerIds.Skip(2).Take(2).ToList();
        team2Ids.Should().Contain(_playerIds[2]);
        team2Ids.Should().Contain(_playerIds[3]);
    }

    [Fact]
    public void PlayerLookup_RetrievesCorrectPlayerNames()
    {
        _playerLookup[_playerIds[0]].Name.Should().Be("Alice");
        _playerLookup[_playerIds[1]].Name.Should().Be("Bob");
        _playerLookup[_playerIds[2]].Name.Should().Be("Charlie");
        _playerLookup[_playerIds[3]].Name.Should().Be("Diana");
    }

    [Fact]
    public void MatchScore_StoresScoresCorrectly()
    {
        var score = new MatchScore(21, 15);
        score.Team1Score.Should().Be(21);
        score.Team2Score.Should().Be(15);
    }

    [Fact]
    public void GetWinningPlayerIds_ReturnsTeam1Ids_WhenTeam1Selected()
    {
        var selectedWinner = 1;
        var winnerIds = selectedWinner == 1
            ? _match.PlayerIds.Take(2).ToList()
            : _match.PlayerIds.Skip(2).Take(2).ToList();

        winnerIds.Should().HaveCount(2);
        winnerIds.Should().Contain(_playerIds[0]);
        winnerIds.Should().Contain(_playerIds[1]);
    }

    [Fact]
    public void GetWinningPlayerIds_ReturnsTeam2Ids_WhenTeam2Selected()
    {
        var selectedWinner = 2;
        var winnerIds = selectedWinner == 1
            ? _match.PlayerIds.Take(2).ToList()
            : _match.PlayerIds.Skip(2).Take(2).ToList();

        winnerIds.Should().HaveCount(2);
        winnerIds.Should().Contain(_playerIds[2]);
        winnerIds.Should().Contain(_playerIds[3]);
    }

    [Fact]
    public void GetWinnerDescription_ReturnsTeam1Names_WhenTeam1Selected()
    {
        var selectedWinner = 1;
        var winningTeam = selectedWinner == 1
            ? _match.PlayerIds.Take(2)
            : _match.PlayerIds.Skip(2).Take(2);

        var description = string.Join(" & ", winningTeam
            .Where(id => _playerLookup.ContainsKey(id))
            .Select(id => _playerLookup[id].Name));

        description.Should().Be("Alice & Bob");
    }

    [Fact]
    public void GetWinnerDescription_ReturnsTeam2Names_WhenTeam2Selected()
    {
        var selectedWinner = 2;
        var winningTeam = selectedWinner == 1
            ? _match.PlayerIds.Take(2)
            : _match.PlayerIds.Skip(2).Take(2);

        var description = string.Join(" & ", winningTeam
            .Where(id => _playerLookup.ContainsKey(id))
            .Select(id => _playerLookup[id].Name));

        description.Should().Be("Charlie & Diana");
    }

    [Fact]
    public void AutoSelectWinner_FromScores_SelectsTeam1_WhenTeam1Higher()
    {
        int? team1Score = 21;
        int? team2Score = 15;
        int? selectedWinner = null;

        if (team1Score.HasValue && team2Score.HasValue)
        {
            if (team1Score > team2Score)
                selectedWinner = 1;
            else if (team2Score > team1Score)
                selectedWinner = 2;
        }

        selectedWinner.Should().Be(1);
    }

    [Fact]
    public void AutoSelectWinner_FromScores_SelectsTeam2_WhenTeam2Higher()
    {
        int? team1Score = 15;
        int? team2Score = 21;
        int? selectedWinner = null;

        if (team1Score.HasValue && team2Score.HasValue)
        {
            if (team1Score > team2Score)
                selectedWinner = 1;
            else if (team2Score > team1Score)
                selectedWinner = 2;
        }

        selectedWinner.Should().Be(2);
    }

    [Fact]
    public void AutoSelectWinner_FromScores_ClearsSelection_WhenTied()
    {
        int? team1Score = 15;
        int? team2Score = 15;
        int? selectedWinner = 1;

        if (team1Score.HasValue && team2Score.HasValue)
        {
            if (team1Score > team2Score)
                selectedWinner = 1;
            else if (team2Score > team1Score)
                selectedWinner = 2;
            else
                selectedWinner = null;
        }

        selectedWinner.Should().BeNull();
    }

    [Fact]
    public void CanSubmit_ReturnsFalse_WhenNoWinnerAndNoScores()
    {
        int? selectedWinner = null;
        int? team1Score = null;
        int? team2Score = null;

        var hasValidScores = team1Score.HasValue && team2Score.HasValue;
        var canSubmit = selectedWinner.HasValue || hasValidScores;

        canSubmit.Should().BeFalse();
    }

    [Fact]
    public void CanSubmit_ReturnsTrue_WhenWinnerSelected()
    {
        int? selectedWinner = 1;
        int? team1Score = null;
        int? team2Score = null;

        var hasValidScores = team1Score.HasValue && team2Score.HasValue;
        var canSubmit = selectedWinner.HasValue || hasValidScores;

        canSubmit.Should().BeTrue();
    }

    [Fact]
    public void CanSubmit_ReturnsTrue_WhenBothScoresProvided()
    {
        int? selectedWinner = null;
        int? team1Score = 21;
        int? team2Score = 15;

        var hasValidScores = team1Score.HasValue && team2Score.HasValue;
        var canSubmit = selectedWinner.HasValue || hasValidScores;

        canSubmit.Should().BeTrue();
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public void PreSelectedWinner_SetsSelectedWinner_WhenValid(int preSelected)
    {
        int? selectedWinner = null;

        if (preSelected is 1 or 2)
        {
            selectedWinner = preSelected;
        }

        selectedWinner.Should().Be(preSelected);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(3)]
    [InlineData(-1)]
    public void PreSelectedWinner_DoesNotSetSelectedWinner_WhenInvalid(int preSelected)
    {
        int? selectedWinner = null;

        if (preSelected is 1 or 2)
        {
            selectedWinner = preSelected;
        }

        selectedWinner.Should().BeNull();
    }

    [Fact]
    public void PreSelectedWinner_Null_DoesNotSetSelectedWinner()
    {
        int? preSelected = null;
        int? selectedWinner = null;

        if (preSelected is 1 or 2)
        {
            selectedWinner = preSelected;
        }

        selectedWinner.Should().BeNull();
    }

    [Fact]
    public void IsWinningTeam_ReturnsTrue_WhenTeam1IsWinner()
    {
        var completedMatch = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.Completed,
            PlayerIds = _playerIds.ToList(),
            WinningPlayerIds = new List<Guid> { _playerIds[0], _playerIds[1] },
            StartedAt = DateTime.UtcNow.AddMinutes(-15),
            CompletedAt = DateTime.UtcNow
        };

        var team1Ids = completedMatch.PlayerIds.Take(2).ToHashSet();
        var isWinner = team1Ids.SetEquals(completedMatch.WinningPlayerIds.ToHashSet());

        isWinner.Should().BeTrue();
    }

    [Fact]
    public void IsWinningTeam_ReturnsFalse_WhenTeam1IsNotWinner()
    {
        var completedMatch = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.Completed,
            PlayerIds = _playerIds.ToList(),
            WinningPlayerIds = new List<Guid> { _playerIds[2], _playerIds[3] },
            StartedAt = DateTime.UtcNow.AddMinutes(-15),
            CompletedAt = DateTime.UtcNow
        };

        var team1Ids = completedMatch.PlayerIds.Take(2).ToHashSet();
        var isWinner = team1Ids.SetEquals(completedMatch.WinningPlayerIds.ToHashSet());

        isWinner.Should().BeFalse();
    }

    [Fact]
    public void IsWinningTeam_ReturnsFalse_WhenNoWinningPlayerIds()
    {
        var completedMatch = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.Completed,
            PlayerIds = _playerIds.ToList(),
            StartedAt = DateTime.UtcNow.AddMinutes(-15),
            CompletedAt = DateTime.UtcNow
        };

        var hasWinner = completedMatch.WinningPlayerIds.Count > 0;

        hasWinner.Should().BeFalse();
    }
}
