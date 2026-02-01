using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }

    
    public Guid ClubId { get; set; }

    public DateTime ScheduledDateTime { get; set; }

    public int CourtCount { get; set; }

    
    public SessionState State { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Club? Club { get; set; }

    public List<SessionPlayer> SessionPlayers { get; set; } = new();

    public List<Match> Matches { get; set; } = new();

    public IEnumerable<Player> BenchedPlayers
    {
        get
        {
            var activePlayers = SessionPlayers
                .Where(sp => sp.IsActive)
                .Select(sp => sp.PlayerId)
                .ToHashSet();

            var playersInMatches = Matches
                .Where(m => m.State == MatchState.InProgress)
                .SelectMany(m => m.PlayerIds)
                .ToHashSet();

            return SessionPlayers
                .Where(sp => sp.IsActive && !playersInMatches.Contains(sp.PlayerId))
                .Select(sp => sp.Player!)
                .Where(p => p != null);
        }
    }

    public IEnumerable<Player> ActivePlayers => SessionPlayers
        .Where(sp => sp.IsActive)
        .Select(sp => sp.Player!)
        .Where(p => p != null);
}
