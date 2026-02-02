using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.Matchmaking;

public class MatchmakingService(
    ISessionRepository sessionRepository,
    IMatchRepository matchRepository,
    IPlayerRepository playerRepository) : IMatchmakingService
{
    public async Task<List<MatchCandidate>> GenerateMatchesAsync(Guid sessionId)
    {
        var session = await sessionRepository.GetByIdAsync(sessionId);
        if (session == null) throw new InvalidOperationException("Session not found");

        var existingMatches = await matchRepository.GetBySessionIdAsync(sessionId);

        var playingPlayerIds = existingMatches
            .Where(m => m.State == MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedSessionPlayers = session.SessionPlayers
            .Where(sp => sp.IsActive && !playingPlayerIds.Contains(sp.PlayerId))
            .ToList();

        var benchedPlayers = new List<Player>();
        foreach (var sp in benchedSessionPlayers)
        {
            var player = sp.Player ?? await playerRepository.GetByIdAsync(sp.PlayerId);
            if (player != null)
            {
                benchedPlayers.Add(player);
            }
        }

        var usedCourts = existingMatches
            .Where(m => m.State == MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, session.CourtCount)
            .Where(c => !usedCourts.Contains(c))
            .ToList();

        return GenerateSkillBalancedMatches(benchedPlayers, availableCourts);
    }

    private List<MatchCandidate> GenerateSkillBalancedMatches(List<Player> players, List<int> availableCourts)
    {
        var candidates = new List<MatchCandidate>();

        if (players.Count < 4 || !availableCourts.Any())
        {
            return candidates;
        }

        var sortedPlayers = players.OrderByDescending(p => p.SkillLevel).ToList();
        var usedPlayerIds = new HashSet<Guid>();
        var courtIndex = 0;

        while (usedPlayerIds.Count + 4 <= sortedPlayers.Count && courtIndex < availableCourts.Count)
        {
            var available = sortedPlayers.Where(p => !usedPlayerIds.Contains(p.Id)).ToList();

            if (available.Count < 4)
            {
                break;
            }

            var matchPlayers = SelectBalancedFoursome(available);

            candidates.Add(new MatchCandidate
            {
                CourtNumber = availableCourts[courtIndex],
                PlayerIds = matchPlayers.Select(p => p.Id).ToList(),
                TotalScore = CalculateMatchBalance(matchPlayers)
            });

            foreach (var player in matchPlayers)
            {
                usedPlayerIds.Add(player.Id);
            }

            courtIndex++;
        }

        return candidates;
    }

    private List<Player> SelectBalancedFoursome(List<Player> available)
    {
        var sorted = available.OrderByDescending(p => p.SkillLevel).ToList();

        if (sorted.Count == 4)
        {
            return sorted;
        }

        var p1 = sorted[0];
        var p4 = sorted[sorted.Count - 1];

        var remaining = sorted.Skip(1).Take(sorted.Count - 2).ToList();
        var midIndex = remaining.Count / 2;
        var p2 = remaining.Count > 0 ? remaining[midIndex] : sorted[1];
        var p3 = remaining.Count > 1 ? remaining[remaining.Count - 1 - (midIndex > 0 ? 1 : 0)] : sorted[2];

        if (p2 == p3 && remaining.Count > 1)
        {
            p3 = remaining.FirstOrDefault(p => p.Id != p2.Id) ?? sorted[2];
        }

        return new List<Player> { p1, p4, p2, p3 };
    }

    private double CalculateMatchBalance(List<Player> players)
    {
        if (players.Count != 4) return 0;

        var team1Skill = players[0].SkillLevel + players[1].SkillLevel;
        var team2Skill = players[2].SkillLevel + players[3].SkillLevel;

        return 100 - Math.Abs(team1Skill - team2Skill) * 10;
    }
}
