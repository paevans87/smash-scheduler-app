using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.Analytics;
using SmashScheduler.Application.Services.Analytics.Models;

namespace SmashScheduler.Presentation.ViewModels.Analytics;

public partial class SessionAnalyticsViewModel : ObservableObject
{
    private readonly IAnalyticsService _analyticsService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private SessionStatistics? _statistics;

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _totalMatches;

    [ObservableProperty]
    private int _automatedMatches;

    [ObservableProperty]
    private int _manualMatches;

    [ObservableProperty]
    private double _overrideRate;

    [ObservableProperty]
    private string _totalGameTime = string.Empty;

    public SessionAnalyticsViewModel(
        IAnalyticsService analyticsService,
        INavigationService navigationService)
    {
        _analyticsService = analyticsService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid sessionId)
    {
        IsLoading = true;

        try
        {
            Statistics = await _analyticsService.GetSessionStatisticsAsync(sessionId);

            if (Statistics != null)
            {
                TotalMatches = Statistics.TotalMatches;
                AutomatedMatches = Statistics.AutomatedMatches;
                ManualMatches = Statistics.ManualMatches;
                OverrideRate = Statistics.OverrideRate;
                TotalGameTime = FormatTimeSpan(Statistics.TotalGameTime);
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
