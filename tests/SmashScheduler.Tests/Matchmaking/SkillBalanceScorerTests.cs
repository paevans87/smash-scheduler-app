using FluentAssertions;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using Xunit;

namespace SmashScheduler.Tests.Matchmaking;

public class SkillBalanceScorerTests
{
    private readonly SkillBalanceScorer _scorer;

    public SkillBalanceScorerTests()
    {
        _scorer = new SkillBalanceScorer();
    }

    [Fact]
    public void CalculateScore_WithBalancedSkills_ReturnsHighScore()
    {
        var players = CreatePlayers(new[] { 5, 5, 6, 6 });
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().BeGreaterThan(80);
    }

    [Fact]
    public void CalculateScore_WithImbalancedSkills_ReturnsLowerScore()
    {
        var players = CreatePlayers(new[] { 1, 1, 10, 10 });
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().BeLessOrEqualTo(50);
    }

    [Fact]
    public void CalculateScore_WithIdenticalSkills_ReturnsMaximumScore()
    {
        var players = CreatePlayers(new[] { 7, 7, 7, 7 });
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(100);
    }

    [Fact]
    public void CalculateScore_WithEmptyPlayerList_ReturnsZero()
    {
        var candidate = new MatchCandidate
        {
            PlayerIds = new List<Guid>()
        };

        var score = _scorer.CalculateScore(candidate, new List<Player>(), new MatchScoringContext());

        score.Should().Be(0);
    }

    private List<Player> CreatePlayers(int[] skillLevels)
    {
        return skillLevels.Select((skill, index) => new Player
        {
            Id = Guid.NewGuid(),
            Name = $"Player {index + 1}",
            SkillLevel = skill,
            Gender = Gender.Male,
            PlayStylePreference = PlayStylePreference.Open,
            ClubId = Guid.NewGuid()
        }).ToList();
    }
}
