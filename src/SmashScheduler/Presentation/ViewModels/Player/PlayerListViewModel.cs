using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Player;

public partial class PlayerListViewModel : ObservableObject
{
    private readonly IPlayerService _playerService;
    private readonly INavigationService _navigationService;

    private Guid _clubId;

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Player> _players = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isEmpty;

    [ObservableProperty]
    private string _searchText = string.Empty;

    public PlayerListViewModel(IPlayerService playerService, INavigationService navigationService)
    {
        _playerService = playerService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId)
    {
        _clubId = clubId;
        await LoadPlayersAsync();
    }

    [RelayCommand]
    private async Task LoadPlayersAsync()
    {
        IsLoading = true;

        try
        {
            var players = await _playerService.GetByClubIdAsync(_clubId);

            if (!string.IsNullOrWhiteSpace(SearchText))
            {
                players = players
                    .Where(p => p.Name.Contains(SearchText, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            Players = new ObservableCollection<Domain.Entities.Player>(
                players.OrderBy(p => p.Name)
            );

            IsEmpty = Players.Count == 0;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToPlayerDetailAsync(Guid playerId)
    {
        await _navigationService.NavigateToAsync($"clubs/{_clubId}/players/{playerId}");
    }

    [RelayCommand]
    private async Task NavigateToCreatePlayerAsync()
    {
        await _navigationService.NavigateToAsync($"clubs/{_clubId}/players/create");
    }

    [RelayCommand]
    private async Task DeletePlayerAsync(Guid playerId)
    {
        await _playerService.DeletePlayerAsync(playerId);
        await LoadPlayersAsync();
    }

    partial void OnSearchTextChanged(string value)
    {
        _ = LoadPlayersAsync();
    }
}
