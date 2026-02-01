namespace SmashScheduler.Application.Services.Analytics.Models;

public class PlayerStatistics
{
    public Guid PlayerId { get; set; }
    public int TotalGamesPlayed { get; set; }
    public TimeSpan AveragePlayTimePerSession { get; set; }
    public List<PartnerStatistic> TopWinPartners { get; set; } = new();
    public List<PartnerStatistic> TopLossPartners { get; set; } = new();
    public List<PartnerStatistic> MostFrequentPartners { get; set; } = new();
}