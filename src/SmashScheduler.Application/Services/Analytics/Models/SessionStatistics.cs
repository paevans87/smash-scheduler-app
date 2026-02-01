namespace SmashScheduler.Application.Services.Analytics.Models;

public class SessionStatistics
{
    public Guid SessionId { get; set; }
    public int TotalMatches { get; set; }
    public int CompletedMatches { get; set; }
    public int AutomatedMatches { get; set; }
    public int ManualMatches { get; set; }
    public double OverrideRate { get; set; }
    public TimeSpan TotalGameTime { get; set; }
    public Dictionary<Guid, int> GamesPlayedPerPlayer { get; set; } = new();
    public Dictionary<Guid, TimeSpan> PlayTimePerPlayer { get; set; } = new();
}
