using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Domain.Entities;

public class Player
{
    public Guid Id { get; set; }

    
    public Guid ClubId { get; set; }

    public string Name { get; set; } = string.Empty;

    public int SkillLevel { get; set; }

    public Gender Gender { get; set; }

    public PlayStylePreference PlayStylePreference { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public Club? Club { get; set; }

    public List<PlayerBlacklist> PartnerBlacklist { get; set; } = new();

    public List<PlayerBlacklist> OpponentBlacklist { get; set; } = new();

    public List<SessionPlayer> SessionPlayers { get; set; } = new();
}
