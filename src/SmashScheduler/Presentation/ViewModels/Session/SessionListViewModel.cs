using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Session;

public partial class SessionListViewModel : ObservableObject
{
    private readonly ISessionService _sessionService;
    private readonly INavigationService _navigationService;

    private Guid _clubId;

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Session> _sessions = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isEmpty;

    public SessionListViewModel(ISessionService sessionService, INavigationService navigationService)
    {
        _sessionService = sessionService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId)
    {
        _clubId = clubId;
        await LoadSessionsAsync();
    }

    [RelayCommand]
    private async Task LoadSessionsAsync()
    {
        IsLoading = true;

        try
        {
            var sessions = await _sessionService.GetByClubIdAsync(_clubId);
            Sessions = new ObservableCollection<Domain.Entities.Session>(sessions);
            IsEmpty = Sessions.Count == 0;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToSessionDetailAsync(Guid sessionId)
    {
        await _navigationService.NavigateToAsync($"clubs/{_clubId}/sessions/{sessionId}");
    }

    [RelayCommand]
    private async Task NavigateToCreateSessionAsync()
    {
        await _navigationService.NavigateToAsync($"clubs/{_clubId}/sessions/create");
    }

    [RelayCommand]
    private async Task DeleteSessionAsync(Guid sessionId)
    {
        await _sessionService.DeleteSessionAsync(sessionId);
        await LoadSessionsAsync();
    }
}
