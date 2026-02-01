
namespace SmashScheduler.Domain.Entities;

public class SessionPlayer
{
    public Guid SessionId { get; set; }

    public Guid PlayerId { get; set; }

    public bool IsActive { get; set; }

    public DateTime JoinedAt { get; set; }

    public Session? Session { get; set; }

    public Player? Player { get; set; }
}
