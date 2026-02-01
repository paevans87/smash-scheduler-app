namespace SmashScheduler.Application.Services.Analytics.Models;

public class PartnerStatistic
{
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public int GamesPlayed { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
}