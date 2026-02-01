using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Player;

public partial class PlayerDetailViewModel : ObservableObject
{
    private readonly IPlayerService _playerService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private Domain.Entities.Player? _player;

    [ObservableProperty]
    private ObservableCollection<PlayerBlacklist> _blacklists = new();

    [ObservableProperty]
    private bool _isLoading;

    public PlayerDetailViewModel(IPlayerService playerService, INavigationService navigationService)
    {
        _playerService = playerService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId, Guid playerId)
    {
        IsLoading = true;

        try
        {
            Player = await _playerService.GetByIdAsync(playerId);

            if (Player != null)
            {
                var blacklists = await _playerService.GetBlacklistsAsync(playerId);
                Blacklists = new ObservableCollection<PlayerBlacklist>(blacklists);
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToEditPlayerAsync()
    {
        if (Player != null)
        {
            await _navigationService.NavigateToAsync($"clubs/{Player.ClubId}/players/{Player.Id}/edit");
        }
    }

    [RelayCommand]
    private async Task RemoveFromBlacklistAsync(Guid blacklistedPlayerId)
    {
        if (Player != null)
        {
            await _playerService.RemoveFromBlacklistAsync(Player.Id, blacklistedPlayerId);
            await InitialiseAsync(Player.ClubId, Player.Id);
        }
    }
}
