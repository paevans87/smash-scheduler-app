using SmashScheduler.Domain.Enums;
using SmashScheduler.Domain.ValueObjects;

namespace SmashScheduler.Domain.Entities;

public class Match
{
    public Guid Id { get; set; }

    
    public Guid SessionId { get; set; }

    public int CourtNumber { get; set; }

    
    public MatchState State { get; set; }

    public bool WasAutomated { get; set; }

    public long StartedAtTicks { get; set; }

    public long? CompletedAtTicks { get; set; }

    public DateTime StartedAt
    {
        get => new DateTime(StartedAtTicks, DateTimeKind.Utc);
        set => StartedAtTicks = value.Ticks;
    }

    public DateTime? CompletedAt
    {
        get => CompletedAtTicks.HasValue ? new DateTime(CompletedAtTicks.Value, DateTimeKind.Utc) : null;
        set => CompletedAtTicks = value?.Ticks;
    }

    public string? ScoreJson { get; set; }

    public string? PlayerIdsJson { get; set; }

    public string? WinningPlayerIdsJson { get; set; }

    public Session? Session { get; set; }

    public List<Player> Players { get; set; } = new();

    public List<Player> WinningPlayers { get; set; } = new();

    public List<Guid> PlayerIds
    {
        get
        {
            if (string.IsNullOrEmpty(PlayerIdsJson))
            {
                return new List<Guid>();
            }

            return System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(PlayerIdsJson) ?? new List<Guid>();
        }
        set
        {
            PlayerIdsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public List<Guid> WinningPlayerIds
    {
        get
        {
            if (string.IsNullOrEmpty(WinningPlayerIdsJson))
            {
                return new List<Guid>();
            }

            return System.Text.Json.JsonSerializer.Deserialize<List<Guid>>(WinningPlayerIdsJson) ?? new List<Guid>();
        }
        set
        {
            WinningPlayerIdsJson = System.Text.Json.JsonSerializer.Serialize(value);
        }
    }

    public MatchScore? Score
    {
        get
        {
            if (string.IsNullOrEmpty(ScoreJson))
            {
                return null;
            }

            return System.Text.Json.JsonSerializer.Deserialize<MatchScore>(ScoreJson);
        }
        set
        {
            ScoreJson = value == null ? null : System.Text.Json.JsonSerializer.Serialize(value);
        }
    }
}
