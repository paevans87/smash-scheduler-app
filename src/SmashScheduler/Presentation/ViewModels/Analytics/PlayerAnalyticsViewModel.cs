using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.Analytics;
using SmashScheduler.Application.Services.Analytics.Models;

namespace SmashScheduler.Presentation.ViewModels.Analytics;

public partial class PlayerAnalyticsViewModel : ObservableObject
{
    private readonly IAnalyticsService _analyticsService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private PlayerStatistics? _statistics;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _totalGamesPlayed;

    [ObservableProperty]
    private string _averagePlayTime = string.Empty;

    public PlayerAnalyticsViewModel(
        IAnalyticsService analyticsService,
        INavigationService navigationService)
    {
        _analyticsService = analyticsService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid playerId)
    {
        IsLoading = true;

        try
        {
            Statistics = await _analyticsService.GetPlayerStatisticsAsync(playerId);

            if (Statistics != null)
            {
                TotalGamesPlayed = Statistics.TotalGamesPlayed;
                AveragePlayTime = FormatTimeSpan(Statistics.AveragePlayTimePerSession);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CloseAsync()
    {
        await _navigationService.GoBackAsync();
    }

    private string FormatTimeSpan(TimeSpan timeSpan)
    {
        if (timeSpan.TotalHours >= 1)
        {
            return $"{(int)timeSpan.TotalHours}h {timeSpan.Minutes}m";
        }

        return $"{timeSpan.Minutes}m {timeSpan.Seconds}s";
    }
}
