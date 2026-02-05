using FluentAssertions;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using Xunit;

namespace SmashScheduler.Tests.Matchmaking;

public class BlacklistAvoidanceScorerTests
{
    [Fact]
    public void CalculateScore_WithNoBlacklists_ReturnsMaximumScore()
    {
        var players = CreatePlayers(4);
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };
        var scorer = new BlacklistAvoidanceScorer(new List<PlayerBlacklist>());

        var score = scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(100);
    }

    [Fact]
    public void CalculateScore_WithPartnerBlacklist_ReducesScore()
    {
        var players = CreatePlayers(4);
        var blacklists = new List<PlayerBlacklist>
        {
            new PlayerBlacklist
            {
                PlayerId = players[0].Id,
                BlacklistedPlayerId = players[1].Id,
                BlacklistType = BlacklistType.Partner
            }
        };
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };
        var scorer = new BlacklistAvoidanceScorer(blacklists);

        var score = scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().BeLessThan(100);
        score.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void CalculateScore_WithMultipleBlacklists_FurtherReducesScore()
    {
        var players = CreatePlayers(4);
        var blacklists = new List<PlayerBlacklist>
        {
            new PlayerBlacklist
            {
                PlayerId = players[0].Id,
                BlacklistedPlayerId = players[1].Id,
                BlacklistType = BlacklistType.Partner
            },
            new PlayerBlacklist
            {
                PlayerId = players[2].Id,
                BlacklistedPlayerId = players[3].Id,
                BlacklistType = BlacklistType.Opponent
            }
        };
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };
        var scorer = new BlacklistAvoidanceScorer(blacklists);

        var score = scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().BeLessThan(80);
    }

    private List<Player> CreatePlayers(int count)
    {
        return Enumerable.Range(1, count).Select(i => new Player
        {
            Id = Guid.NewGuid(),
            Name = $"Player {i}",
            SkillLevel = 5,
            Gender = Gender.Male,
            PlayStylePreference = PlayStylePreference.Open,
            ClubId = Guid.NewGuid()
        }).ToList();
    }
}
