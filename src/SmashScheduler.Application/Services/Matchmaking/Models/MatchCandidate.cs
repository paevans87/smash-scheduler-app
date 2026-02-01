namespace SmashScheduler.Application.Services.Matchmaking.Models;

public class MatchCandidate
{
    public int CourtNumber { get; set; }
    public List<Guid> PlayerIds { get; set; } = new();
    public double TotalScore { get; set; }
}
