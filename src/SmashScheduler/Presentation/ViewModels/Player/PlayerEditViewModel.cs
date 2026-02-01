using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Presentation.ViewModels.Player;

public partial class PlayerEditViewModel : ObservableObject
{
    private readonly IPlayerService _playerService;
    private readonly INavigationService _navigationService;

    private Guid _clubId;
    private Guid? _playerId;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private int _skillLevel = 5;

    [ObservableProperty]
    private Gender _gender = Gender.Male;

    [ObservableProperty]
    private PlayStylePreference _playStylePreference = PlayStylePreference.Open;

    [ObservableProperty]
    private bool _isNewPlayer = true;

    [ObservableProperty]
    private bool _isSaving;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public PlayerEditViewModel(IPlayerService playerService, INavigationService navigationService)
    {
        _playerService = playerService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId, Guid? playerId = null)
    {
        _clubId = clubId;
        _playerId = playerId;
        IsNewPlayer = playerId == null;

        if (playerId.HasValue)
        {
            var player = await _playerService.GetByIdAsync(playerId.Value);

            if (player != null)
            {
                Name = player.Name;
                SkillLevel = player.SkillLevel;
                Gender = player.Gender;
                PlayStylePreference = player.PlayStylePreference;
            }
        }
    }

    [RelayCommand]
    private async Task SaveAsync()
    {
        if (!ValidateInput())
        {
            return;
        }

        IsSaving = true;
        ErrorMessage = string.Empty;

        try
        {
            if (IsNewPlayer)
            {
                var player = await _playerService.CreatePlayerAsync(
                    _clubId,
                    Name,
                    SkillLevel,
                    Gender,
                    PlayStylePreference
                );

                await _navigationService.NavigateToAsync($"clubs/{_clubId}/players/{player.Id}");
            }
            else if (_playerId.HasValue)
            {
                var player = await _playerService.GetByIdAsync(_playerId.Value);

                if (player != null)
                {
                    player.Name = Name;
                    player.SkillLevel = SkillLevel;
                    player.Gender = Gender;
                    player.PlayStylePreference = PlayStylePreference;

                    await _playerService.UpdatePlayerAsync(player);
                    await _navigationService.GoBackAsync();
                }
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to save player: {ex.Message}";
        }
        finally
        {
            IsSaving = false;
        }
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        await _navigationService.GoBackAsync();
    }

    private bool ValidateInput()
    {
        if (string.IsNullOrWhiteSpace(Name))
        {
            ErrorMessage = "Player name is required";
            return false;
        }

        if (SkillLevel < 1 || SkillLevel > 10)
        {
            ErrorMessage = "Skill level must be between 1 and 10";
            return false;
        }

        return true;
    }
}
