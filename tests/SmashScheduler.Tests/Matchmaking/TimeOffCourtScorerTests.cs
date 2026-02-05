using FluentAssertions;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using Xunit;

namespace SmashScheduler.Tests.Matchmaking;

public class TimeOffCourtScorerTests
{
    private readonly TimeOffCourtScorer _scorer;

    public TimeOffCourtScorerTests()
    {
        _scorer = new TimeOffCourtScorer();
    }

    [Fact]
    public void CalculateScore_WithNoPlayHistory_ReturnsHighScore()
    {
        var players = CreatePlayers(4);
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().BeGreaterThan(50);
    }

    [Fact]
    public void CalculateScore_WithRecentPlay_ReturnsLowerScore()
    {
        var players = CreatePlayers(4);
        var lastMatchTimes = new Dictionary<Guid, DateTime>
        {
            { players[0].Id, DateTime.UtcNow.AddMinutes(-5) },
            { players[1].Id, DateTime.UtcNow.AddMinutes(-5) },
            { players[2].Id, DateTime.UtcNow.AddMinutes(-5) },
            { players[3].Id, DateTime.UtcNow.AddMinutes(-5) }
        };
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext { LastMatchCompletionTimes = lastMatchTimes });

        score.Should().BeLessThan(50);
    }

    [Fact]
    public void CalculateScore_WithLongTimeOff_ReturnsHighScore()
    {
        var players = CreatePlayers(4);
        var lastMatchTimes = new Dictionary<Guid, DateTime>
        {
            { players[0].Id, DateTime.UtcNow.AddMinutes(-60) },
            { players[1].Id, DateTime.UtcNow.AddMinutes(-60) },
            { players[2].Id, DateTime.UtcNow.AddMinutes(-60) },
            { players[3].Id, DateTime.UtcNow.AddMinutes(-60) }
        };
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext { LastMatchCompletionTimes = lastMatchTimes });

        score.Should().BeGreaterThan(80);
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
