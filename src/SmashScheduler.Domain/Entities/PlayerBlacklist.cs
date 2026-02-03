using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Domain.Entities;

public class PlayerBlacklist
{
    public string Id => $"{PlayerId}-{BlacklistedPlayerId}-{(int)BlacklistType}";

    public Guid PlayerId { get; set; }

    public Guid BlacklistedPlayerId { get; set; }

    public BlacklistType BlacklistType { get; set; }

    public DateTime CreatedAt { get; set; }

    public Player? Player { get; set; }

    public Player? BlacklistedPlayer { get; set; }
}
