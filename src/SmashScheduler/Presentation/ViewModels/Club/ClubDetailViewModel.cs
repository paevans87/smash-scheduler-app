using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.ClubManagement;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Club;

public partial class ClubDetailViewModel : ObservableObject
{
    private readonly IClubService _clubService;
    private readonly IPlayerService _playerService;
    private readonly ISessionService _sessionService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private Domain.Entities.Club? _club;

    [ObservableProperty]
    private ObservableCollection<Player> _players = new();

    [ObservableProperty]
    private ObservableCollection<Session> _recentSessions = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _playerCount;

    [ObservableProperty]
    private int _sessionCount;

    public ClubDetailViewModel(
        IClubService clubService,
        IPlayerService playerService,
        ISessionService sessionService,
        INavigationService navigationService)
    {
        _clubService = clubService;
        _playerService = playerService;
        _sessionService = sessionService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId)
    {
        IsLoading = true;

        try
        {
            Club = await _clubService.GetByIdAsync(clubId);

            if (Club != null)
            {
                var players = await _playerService.GetByClubIdAsync(clubId);
                Players = new ObservableCollection<Player>(players);
                PlayerCount = players.Count;

                var sessions = await _sessionService.GetByClubIdAsync(clubId);
                RecentSessions = new ObservableCollection<Session>(sessions.Take(5));
                SessionCount = sessions.Count;
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToEditClubAsync()
    {
        if (Club != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Club.Id}/edit");
        }
    }

    [RelayCommand]
    private async Task NavigateToPlayersAsync()
    {
        if (Club != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Club.Id}/players");
        }
    }

    [RelayCommand]
    private async Task NavigateToSessionsAsync()
    {
        if (Club != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Club.Id}/sessions");
        }
    }

    [RelayCommand]
    private async Task NavigateToCreatePlayerAsync()
    {
        if (Club != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Club.Id}/players/create");
        }
    }

    [RelayCommand]
    private async Task NavigateToCreateSessionAsync()
    {
        if (Club != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Club.Id}/sessions/create");
        }
    }
}
