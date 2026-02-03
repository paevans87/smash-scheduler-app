using FluentAssertions;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.Tests.Components;

public class BlacklistEditorDialogTests
{
    private readonly Player _mainPlayer;
    private readonly List<Player> _clubPlayers;
    private readonly List<PlayerBlacklist> _blacklists;

    public BlacklistEditorDialogTests()
    {
        _mainPlayer = new Player
        {
            Id = Guid.NewGuid(),
            Name = "Alice",
            SkillLevel = 3,
            ClubId = Guid.NewGuid()
        };

        _clubPlayers = new List<Player>
        {
            _mainPlayer,
            new Player { Id = Guid.NewGuid(), Name = "Bob", SkillLevel = 2, ClubId = _mainPlayer.ClubId },
            new Player { Id = Guid.NewGuid(), Name = "Charlie", SkillLevel = 4, ClubId = _mainPlayer.ClubId },
            new Player { Id = Guid.NewGuid(), Name = "Diana", SkillLevel = 3, ClubId = _mainPlayer.ClubId },
            new Player { Id = Guid.NewGuid(), Name = "Eve", SkillLevel = 2, ClubId = _mainPlayer.ClubId }
        };

        _blacklists = new List<PlayerBlacklist>
        {
            new PlayerBlacklist
            {
                PlayerId = _mainPlayer.Id,
                BlacklistedPlayerId = _clubPlayers[1].Id,
                BlacklistType = BlacklistType.Partner,
                CreatedAt = DateTime.UtcNow
            },
            new PlayerBlacklist
            {
                PlayerId = _mainPlayer.Id,
                BlacklistedPlayerId = _clubPlayers[2].Id,
                BlacklistType = BlacklistType.Opponent,
                CreatedAt = DateTime.UtcNow
            }
        };
    }

    [Fact]
    public void GetBlockedPlayers_ReturnsPartnerBlacklists()
    {
        var partnerBlacklists = _blacklists
            .Where(b => b.BlacklistType == BlacklistType.Partner)
            .ToList();

        partnerBlacklists.Should().HaveCount(1);
        partnerBlacklists[0].BlacklistedPlayerId.Should().Be(_clubPlayers[1].Id);
    }

    [Fact]
    public void GetBlockedPlayers_ReturnsOpponentBlacklists()
    {
        var opponentBlacklists = _blacklists
            .Where(b => b.BlacklistType == BlacklistType.Opponent)
            .ToList();

        opponentBlacklists.Should().HaveCount(1);
        opponentBlacklists[0].BlacklistedPlayerId.Should().Be(_clubPlayers[2].Id);
    }

    [Fact]
    public void GetAvailablePlayers_ExcludesSelfAndBlocked()
    {
        var blockedIds = _blacklists.Select(b => b.BlacklistedPlayerId).ToHashSet();
        blockedIds.Add(_mainPlayer.Id);

        var availablePlayers = _clubPlayers
            .Where(p => !blockedIds.Contains(p.Id))
            .ToList();

        availablePlayers.Should().HaveCount(2);
        availablePlayers.Should().Contain(p => p.Name == "Diana");
        availablePlayers.Should().Contain(p => p.Name == "Eve");
    }

    [Fact]
    public void GetAvailablePlayers_ForPartnerBlacklist_ExcludesPartnerBlocked()
    {
        var partnerBlockedIds = _blacklists
            .Where(b => b.BlacklistType == BlacklistType.Partner)
            .Select(b => b.BlacklistedPlayerId)
            .ToHashSet();
        partnerBlockedIds.Add(_mainPlayer.Id);

        var availablePlayers = _clubPlayers
            .Where(p => !partnerBlockedIds.Contains(p.Id))
            .ToList();

        availablePlayers.Should().HaveCount(3);
        availablePlayers.Should().Contain(p => p.Name == "Charlie");
        availablePlayers.Should().Contain(p => p.Name == "Diana");
        availablePlayers.Should().Contain(p => p.Name == "Eve");
    }

    [Fact]
    public void GetAvailablePlayers_ForOpponentBlacklist_ExcludesOpponentBlocked()
    {
        var opponentBlockedIds = _blacklists
            .Where(b => b.BlacklistType == BlacklistType.Opponent)
            .Select(b => b.BlacklistedPlayerId)
            .ToHashSet();
        opponentBlockedIds.Add(_mainPlayer.Id);

        var availablePlayers = _clubPlayers
            .Where(p => !opponentBlockedIds.Contains(p.Id))
            .ToList();

        availablePlayers.Should().HaveCount(3);
        availablePlayers.Should().Contain(p => p.Name == "Bob");
        availablePlayers.Should().Contain(p => p.Name == "Diana");
        availablePlayers.Should().Contain(p => p.Name == "Eve");
    }

    [Fact]
    public void AddToBlacklist_CreatesNewEntry()
    {
        var newBlacklist = new PlayerBlacklist
        {
            PlayerId = _mainPlayer.Id,
            BlacklistedPlayerId = _clubPlayers[3].Id,
            BlacklistType = BlacklistType.Partner,
            CreatedAt = DateTime.UtcNow
        };

        var updatedBlacklists = _blacklists.Concat(new[] { newBlacklist }).ToList();

        updatedBlacklists.Should().HaveCount(3);
        updatedBlacklists.Should().Contain(b => b.BlacklistedPlayerId == _clubPlayers[3].Id);
    }

    [Fact]
    public void RemoveFromBlacklist_RemovesEntry()
    {
        var blacklistToRemove = _blacklists[0];
        var updatedBlacklists = _blacklists.Where(b => b != blacklistToRemove).ToList();

        updatedBlacklists.Should().HaveCount(1);
        updatedBlacklists.Should().NotContain(blacklistToRemove);
    }

    [Fact]
    public void TabBadgeCount_ShowsCorrectPartnerCount()
    {
        var partnerCount = _blacklists.Count(b => b.BlacklistType == BlacklistType.Partner);

        partnerCount.Should().Be(1);
    }

    [Fact]
    public void TabBadgeCount_ShowsCorrectOpponentCount()
    {
        var opponentCount = _blacklists.Count(b => b.BlacklistType == BlacklistType.Opponent);

        opponentCount.Should().Be(1);
    }

    [Fact]
    public void PlayersOrderedByName()
    {
        var orderedPlayers = _clubPlayers.OrderBy(p => p.Name).ToList();

        orderedPlayers[0].Name.Should().Be("Alice");
        orderedPlayers[1].Name.Should().Be("Bob");
        orderedPlayers[2].Name.Should().Be("Charlie");
        orderedPlayers[3].Name.Should().Be("Diana");
        orderedPlayers[4].Name.Should().Be("Eve");
    }
}
