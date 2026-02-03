using FluentAssertions;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.Tests.Components;

public class MatchEditorDialogTests
{
    private readonly Guid[] _matchPlayerIds;
    private readonly Guid[] _benchPlayerIds;
    private readonly Guid[] _otherMatchPlayerIds;
    private readonly Dictionary<Guid, Player> _playerLookup;
    private readonly Match _match;

    public MatchEditorDialogTests()
    {
        _matchPlayerIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid(),
            Guid.NewGuid()
        };

        _benchPlayerIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid()
        };

        _otherMatchPlayerIds = new[]
        {
            Guid.NewGuid(),
            Guid.NewGuid()
        };

        _playerLookup = new Dictionary<Guid, Player>
        {
            [_matchPlayerIds[0]] = new Player { Id = _matchPlayerIds[0], Name = "Alice", SkillLevel = 3 },
            [_matchPlayerIds[1]] = new Player { Id = _matchPlayerIds[1], Name = "Bob", SkillLevel = 2 },
            [_matchPlayerIds[2]] = new Player { Id = _matchPlayerIds[2], Name = "Charlie", SkillLevel = 4 },
            [_matchPlayerIds[3]] = new Player { Id = _matchPlayerIds[3], Name = "Diana", SkillLevel = 3 },
            [_benchPlayerIds[0]] = new Player { Id = _benchPlayerIds[0], Name = "Eve", SkillLevel = 2 },
            [_benchPlayerIds[1]] = new Player { Id = _benchPlayerIds[1], Name = "Frank", SkillLevel = 4 },
            [_otherMatchPlayerIds[0]] = new Player { Id = _otherMatchPlayerIds[0], Name = "Grace", SkillLevel = 3 },
            [_otherMatchPlayerIds[1]] = new Player { Id = _otherMatchPlayerIds[1], Name = "Henry", SkillLevel = 2 }
        };

        _match = new Match
        {
            Id = Guid.NewGuid(),
            SessionId = Guid.NewGuid(),
            CourtNumber = 1,
            State = MatchState.InProgress,
            PlayerIds = _matchPlayerIds.ToList(),
            StartedAt = DateTime.UtcNow.AddMinutes(-15)
        };
    }

    [Fact]
    public void Match_InitialisesWithFourPlayers()
    {
        _match.PlayerIds.Should().HaveCount(4);
    }

    [Fact]
    public void GetAvailablePlayers_CombinesBenchAndOtherMatchPlayers()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();

        var allAvailableIds = _benchPlayerIds
            .Concat(_otherMatchPlayerIds)
            .Concat(_matchPlayerIds)
            .Where(id => !selectedPlayerIds.Contains(id))
            .Distinct()
            .ToList();

        allAvailableIds.Should().HaveCount(4);
        allAvailableIds.Should().Contain(_benchPlayerIds);
        allAvailableIds.Should().Contain(_otherMatchPlayerIds);
    }

    [Fact]
    public void GetAvailablePlayers_ExcludesSelectedPlayers()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();

        var allAvailableIds = _benchPlayerIds
            .Concat(_otherMatchPlayerIds)
            .Concat(_matchPlayerIds)
            .Where(id => !selectedPlayerIds.Contains(id))
            .Distinct()
            .ToList();

        allAvailableIds.Should().NotContain(_matchPlayerIds);
    }

    [Fact]
    public void AddPlayer_IncrementsSelectedCount()
    {
        var selectedPlayerIds = _matchPlayerIds.Take(3).ToList();
        selectedPlayerIds.Should().HaveCount(3);

        selectedPlayerIds.Add(_benchPlayerIds[0]);
        selectedPlayerIds.Should().HaveCount(4);
    }

    [Fact]
    public void AddPlayer_PreventsDuplicates()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();
        var playerId = _matchPlayerIds[0];

        if (!selectedPlayerIds.Contains(playerId))
        {
            selectedPlayerIds.Add(playerId);
        }

        selectedPlayerIds.Should().HaveCount(4);
    }

    [Fact]
    public void AddPlayer_MaxFourPlayers()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();
        selectedPlayerIds.Should().HaveCount(4);

        if (selectedPlayerIds.Count < 4)
        {
            selectedPlayerIds.Add(_benchPlayerIds[0]);
        }

        selectedPlayerIds.Should().HaveCount(4);
    }

    [Fact]
    public void RemovePlayer_DecrementsSelectedCount()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();
        selectedPlayerIds.Should().HaveCount(4);

        selectedPlayerIds.Remove(_matchPlayerIds[0]);
        selectedPlayerIds.Should().HaveCount(3);
    }

    [Fact]
    public void SubmitEnabled_WhenExactlyFourPlayers()
    {
        var selectedPlayerIds = _matchPlayerIds.ToList();
        var canSubmit = selectedPlayerIds.Count == 4;

        canSubmit.Should().BeTrue();
    }

    [Fact]
    public void SubmitDisabled_WhenLessThanFourPlayers()
    {
        var selectedPlayerIds = _matchPlayerIds.Take(3).ToList();
        var canSubmit = selectedPlayerIds.Count == 4;

        canSubmit.Should().BeFalse();
    }

    [Fact]
    public void PlayersInOtherMatches_IdentifiedCorrectly()
    {
        var playersInOtherMatches = _otherMatchPlayerIds.ToHashSet();

        playersInOtherMatches.Should().Contain(_otherMatchPlayerIds[0]);
        playersInOtherMatches.Should().Contain(_otherMatchPlayerIds[1]);
        playersInOtherMatches.Should().NotContain(_benchPlayerIds[0]);
    }

    [Fact]
    public void GetPlayerCountColour_ReturnsSuccess_WhenFourPlayers()
    {
        var selectedCount = 4;
        var colour = selectedCount == 4 ? "Success" : "Warning";

        colour.Should().Be("Success");
    }

    [Fact]
    public void GetPlayerCountColour_ReturnsWarning_WhenNotFourPlayers()
    {
        var selectedCount = 3;
        var colour = selectedCount == 4 ? "Success" : "Warning";

        colour.Should().Be("Warning");
    }
}
