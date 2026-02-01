using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Domain.Entities;

public class Club
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DefaultCourtCount { get; set; }
    public GameType GameType { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<Player> Players { get; set; } = new();
    public List<Session> Sessions { get; set; } = new();
}
