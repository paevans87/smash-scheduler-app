using FluentAssertions;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using Xunit;

namespace SmashScheduler.Tests.Matchmaking;

public class PlayStylePreferenceScorerTests
{
    private readonly PlayStylePreferenceScorer _scorer;

    public PlayStylePreferenceScorerTests()
    {
        _scorer = new PlayStylePreferenceScorer();
    }

    [Fact]
    public void CalculateScore_AllLevelPreference_ReturnsMaximumScore()
    {
        var players = CreatePlayersWithPreference(PlayStylePreference.Level, 4);
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(100);
    }

    [Fact]
    public void CalculateScore_AllOpenPreference_ReturnsHighScore()
    {
        var players = CreatePlayersWithPreference(PlayStylePreference.Open, 4);
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(90);
    }

    [Fact]
    public void CalculateScore_MixedPreferenceWithMixedGenders_ReturnsHighScore()
    {
        var players = new List<Player>
        {
            CreatePlayer(PlayStylePreference.Mixed, Gender.Male),
            CreatePlayer(PlayStylePreference.Mixed, Gender.Female),
            CreatePlayer(PlayStylePreference.Mixed, Gender.Male),
            CreatePlayer(PlayStylePreference.Mixed, Gender.Female)
        };
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(95);
    }

    [Fact]
    public void CalculateScore_MixedPreferenceWithSameGender_ReturnsLowerScore()
    {
        var players = CreatePlayersWithPreference(PlayStylePreference.Mixed, 4, Gender.Male);
        var candidate = new MatchCandidate
        {
            PlayerIds = players.Select(p => p.Id).ToList()
        };

        var score = _scorer.CalculateScore(candidate, players, new MatchScoringContext());

        score.Should().Be(60);
    }

    private List<Player> CreatePlayersWithPreference(PlayStylePreference preference, int count, Gender? gender = null)
    {
        return Enumerable.Range(1, count).Select(i => CreatePlayer(preference, gender ?? Gender.Male)).ToList();
    }

    private Player CreatePlayer(PlayStylePreference preference, Gender gender)
    {
        return new Player
        {
            Id = Guid.NewGuid(),
            Name = $"Player {Guid.NewGuid()}",
            SkillLevel = 5,
            Gender = gender,
            PlayStylePreference = preference,
            ClubId = Guid.NewGuid()
        };
    }
}
