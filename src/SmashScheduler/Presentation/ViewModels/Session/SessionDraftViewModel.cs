using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Session;

public partial class SessionDraftViewModel : ObservableObject
{
    private readonly ISessionService _sessionService;
    private readonly IPlayerService _playerService;
    private readonly ISessionStateManager _sessionStateManager;
    private readonly INavigationService _navigationService;

    private Guid _clubId;
    private Guid _sessionId;

    [ObservableProperty]
    private Domain.Entities.Session? _session;

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Player> _availablePlayers = new();

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Player> _selectedPlayers = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public SessionDraftViewModel(
        ISessionService sessionService,
        IPlayerService playerService,
        ISessionStateManager sessionStateManager,
        INavigationService navigationService)
    {
        _sessionService = sessionService;
        _playerService = playerService;
        _sessionStateManager = sessionStateManager;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId, Guid sessionId)
    {
        _clubId = clubId;
        _sessionId = sessionId;

        IsLoading = true;

        try
        {
            Session = await _sessionService.GetByIdAsync(sessionId);
            var allPlayers = await _playerService.GetByClubIdAsync(clubId);

            if (Session != null)
            {
                var sessionPlayerIds = Session.SessionPlayers.Select(sp => sp.PlayerId).ToHashSet();

                AvailablePlayers = new ObservableCollection<Domain.Entities.Player>(
                    allPlayers.Where(p => !sessionPlayerIds.Contains(p.Id))
                );

                var selectedPlayersList = allPlayers.Where(p => sessionPlayerIds.Contains(p.Id)).ToList();
                SelectedPlayers = new ObservableCollection<Domain.Entities.Player>(selectedPlayersList);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task AddPlayerAsync(Domain.Entities.Player player)
    {
        await _sessionService.AddPlayerToSessionAsync(_sessionId, player.Id);
        AvailablePlayers.Remove(player);
        SelectedPlayers.Add(player);
    }

    [RelayCommand]
    private async Task RemovePlayerAsync(Domain.Entities.Player player)
    {
        await _sessionService.RemovePlayerFromSessionAsync(_sessionId, player.Id);
        SelectedPlayers.Remove(player);
        AvailablePlayers.Add(player);
    }

    [RelayCommand]
    private async Task StartSessionAsync()
    {
        if (SelectedPlayers.Count == 0)
        {
            ErrorMessage = "Please add at least one player to the session";
            return;
        }

        IsLoading = true;
        ErrorMessage = string.Empty;

        try
        {
            await _sessionStateManager.ActivateSessionAsync(_sessionId);
            await _navigationService.NavigateToAsync($"clubs/{_clubId}/sessions/{_sessionId}");
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to start session: {ex.Message}";
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        await _navigationService.GoBackAsync();
    }
}
