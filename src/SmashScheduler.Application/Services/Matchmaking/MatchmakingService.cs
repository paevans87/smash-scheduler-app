using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Application.Services.Matchmaking.ScoringStrategies;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.Matchmaking;

public class MatchmakingService : IMatchmakingService
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IPlayerRepository _playerRepository;
    private readonly IMatchRepository _matchRepository;
    private readonly IClubRepository _clubRepository;

    private const double SkillBalanceWeight = 0.4;
    private const double PlayStyleWeight = 0.3;
    private const double BlacklistWeight = 0.2;
    private const double TimeOffCourtWeight = 0.1;

    public MatchmakingService(
        ISessionRepository sessionRepository,
        IPlayerRepository playerRepository,
        IMatchRepository matchRepository,
        IClubRepository clubRepository)
    {
        _sessionRepository = sessionRepository;
        _playerRepository = playerRepository;
        _matchRepository = matchRepository;
        _clubRepository = clubRepository;
    }

    public async Task<List<MatchCandidate>> GenerateMatchesAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);

        if (session == null)
        {
            throw new InvalidOperationException("Session not found");
        }

        var club = await _clubRepository.GetByIdAsync(session.ClubId);

        if (club == null)
        {
            throw new InvalidOperationException("Club not found");
        }

        var sessionPlayers = await _sessionRepository.GetSessionPlayersAsync(sessionId);
        var activePlayers = sessionPlayers.Where(sp => sp.IsActive).ToList();

        var playerIds = activePlayers.Select(sp => sp.PlayerId).ToList();
        var players = new List<Player>();

        foreach (var playerId in playerIds)
        {
            var player = await _playerRepository.GetByIdAsync(playerId);

            if (player != null)
            {
                players.Add(player);
            }
        }

        var allBlacklists = new List<PlayerBlacklist>();

        foreach (var player in players)
        {
            var blacklists = await _playerRepository.GetBlacklistsByPlayerIdAsync(player.Id);
            allBlacklists.AddRange(blacklists);
        }

        var completedMatches = await _matchRepository.GetBySessionIdAsync(sessionId);
        var lastMatchCompletionTimes = BuildLastMatchCompletionTimes(completedMatches);

        var playersPerCourt = club.GameType == GameType.Singles ? 2 : 4;
        var matches = GenerateOptimalMatches(players, session.CourtCount, playersPerCourt, allBlacklists, lastMatchCompletionTimes);

        return matches;
    }

    private Dictionary<Guid, DateTime> BuildLastMatchCompletionTimes(List<Match> matches)
    {
        var times = new Dictionary<Guid, DateTime>();

        foreach (var match in matches.Where(m => m.State == MatchState.Completed && m.CompletedAt.HasValue))
        {
            foreach (var playerId in match.PlayerIds)
            {
                if (!times.ContainsKey(playerId) || match.CompletedAt!.Value > times[playerId])
                {
                    times[playerId] = match.CompletedAt.Value;
                }
            }
        }

        return times;
    }

    private List<MatchCandidate> GenerateOptimalMatches(
        List<Player> availablePlayers,
        int courtCount,
        int playersPerCourt,
        List<PlayerBlacklist> blacklists,
        Dictionary<Guid, DateTime> lastMatchCompletionTimes)
    {
        var candidates = GenerateCandidates(availablePlayers, courtCount, playersPerCourt);
        var scoredCandidates = ScoreCandidates(candidates, availablePlayers, blacklists, lastMatchCompletionTimes);

        var bestCombination = FindBestCombination(scoredCandidates, courtCount, availablePlayers.Count);

        return bestCombination;
    }

    private List<MatchCandidate> GenerateCandidates(List<Player> players, int courtCount, int playersPerCourt)
    {
        var candidates = new List<MatchCandidate>();
        var playerIds = players.Select(p => p.Id).ToList();

        var combinations = GetCombinations(playerIds, playersPerCourt);

        var courtNumber = 1;

        foreach (var combination in combinations)
        {
            candidates.Add(new MatchCandidate
            {
                CourtNumber = courtNumber,
                PlayerIds = combination
            });

            courtNumber++;

            if (courtNumber > courtCount * 10)
            {
                break;
            }
        }

        return candidates;
    }

    private List<MatchCandidate> ScoreCandidates(
        List<MatchCandidate> candidates,
        List<Player> allPlayers,
        List<PlayerBlacklist> blacklists,
        Dictionary<Guid, DateTime> lastMatchCompletionTimes)
    {
        var skillBalanceScorer = new SkillBalanceScorer();
        var playStyleScorer = new PlayStylePreferenceScorer();
        var blacklistScorer = new BlacklistAvoidanceScorer(blacklists);
        var timeOffCourtScorer = new TimeOffCourtScorer();

        foreach (var candidate in candidates)
        {
            var skillScore = skillBalanceScorer.CalculateScore(candidate, allPlayers, lastMatchCompletionTimes);
            var playStyleScore = playStyleScorer.CalculateScore(candidate, allPlayers, lastMatchCompletionTimes);
            var blacklistScore = blacklistScorer.CalculateScore(candidate, allPlayers, lastMatchCompletionTimes);
            var timeOffScore = timeOffCourtScorer.CalculateScore(candidate, allPlayers, lastMatchCompletionTimes);

            candidate.TotalScore =
                (skillScore * SkillBalanceWeight) +
                (playStyleScore * PlayStyleWeight) +
                (blacklistScore * BlacklistWeight) +
                (timeOffScore * TimeOffCourtWeight);
        }

        return candidates.OrderByDescending(c => c.TotalScore).ToList();
    }

    private List<MatchCandidate> FindBestCombination(List<MatchCandidate> scoredCandidates, int courtCount, int totalPlayers)
    {
        var result = new List<MatchCandidate>();
        var usedPlayerIds = new HashSet<Guid>();
        var courtNumber = 1;

        foreach (var candidate in scoredCandidates)
        {
            if (result.Count >= courtCount)
            {
                break;
            }

            var hasOverlap = candidate.PlayerIds.Any(id => usedPlayerIds.Contains(id));

            if (!hasOverlap)
            {
                candidate.CourtNumber = courtNumber;
                result.Add(candidate);

                foreach (var playerId in candidate.PlayerIds)
                {
                    usedPlayerIds.Add(playerId);
                }

                courtNumber++;
            }
        }

        return result;
    }

    private List<List<Guid>> GetCombinations(List<Guid> items, int count)
    {
        var results = new List<List<Guid>>();

        if (count == 0 || items.Count < count)
        {
            return results;
        }

        if (count == items.Count)
        {
            results.Add(new List<Guid>(items));
            return results;
        }

        GetCombinationsRecursive(items, count, 0, new List<Guid>(), results);
        return results;
    }

    private void GetCombinationsRecursive(List<Guid> items, int count, int start, List<Guid> current, List<List<Guid>> results)
    {
        if (current.Count == count)
        {
            results.Add(new List<Guid>(current));
            return;
        }

        for (var i = start; i < items.Count; i++)
        {
            current.Add(items[i]);
            GetCombinationsRecursive(items, count, i + 1, current, results);
            current.RemoveAt(current.Count - 1);
        }
    }
}
