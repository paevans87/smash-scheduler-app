using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }


    public Guid ClubId { get; set; }

    public DateTime ScheduledDateTime { get; set; }

    public int CourtCount { get; set; }

    public string? CourtLabelsJson { get; set; }


    public SessionState State { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Club? Club { get; set; }

    public List<SessionPlayer> SessionPlayers { get; set; } = new();

    public Dictionary<int, string> CourtLabels
    {
        get
        {
            if (string.IsNullOrEmpty(CourtLabelsJson))
            {
                return new Dictionary<int, string>();
            }

            return System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, string>>(CourtLabelsJson)
                   ?? new Dictionary<int, string>();
        }
        set
        {
            CourtLabelsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public string GetCourtLabel(int courtNumber)
    {
        return CourtLabels.TryGetValue(courtNumber, out var label) && !string.IsNullOrWhiteSpace(label)
            ? label
            : $"Court {courtNumber}";
    }

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
