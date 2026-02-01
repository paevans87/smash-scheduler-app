using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Session;

public partial class SessionDetailViewModel : ObservableObject
{
    private readonly ISessionService _sessionService;
    private readonly IMatchService _matchService;
    private readonly INavigationService _navigationService;

    private Guid _clubId;

    [ObservableProperty]
    private Domain.Entities.Session? _session;

    [ObservableProperty]
    private ObservableCollection<Match> _matches = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _totalMatches;

    [ObservableProperty]
    private int _completedMatches;

    public SessionDetailViewModel(
        ISessionService sessionService,
        IMatchService matchService,
        INavigationService navigationService)
    {
        _sessionService = sessionService;
        _matchService = matchService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId, Guid sessionId)
    {
        _clubId = clubId;
        IsLoading = true;

        try
        {
            Session = await _sessionService.GetByIdAsync(sessionId);

            if (Session != null)
            {
                var matches = await _matchService.GetBySessionIdAsync(sessionId);
                Matches = new ObservableCollection<Match>(matches);
                TotalMatches = matches.Count;
                CompletedMatches = matches.Count(m => m.State == MatchState.Completed);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToAnalyticsAsync()
    {
        if (Session != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{_clubId}/sessions/{Session.Id}/analytics");
        }
    }
}
