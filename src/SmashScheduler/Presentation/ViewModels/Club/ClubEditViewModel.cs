using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.ClubManagement;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Presentation.ViewModels.Club;

public partial class ClubEditViewModel : ObservableObject
{
    private readonly IClubService _clubService;
    private readonly INavigationService _navigationService;

    private Guid? _clubId;

    [ObservableProperty]
    private string _name = string.Empty;

    [ObservableProperty]
    private int _defaultCourtCount = 4;

    [ObservableProperty]
    private GameType _gameType = GameType.Doubles;

    [ObservableProperty]
    private bool _isNewClub = true;

    [ObservableProperty]
    private bool _isSaving;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public ClubEditViewModel(IClubService clubService, INavigationService navigationService)
    {
        _clubService = clubService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid? clubId = null)
    {
        _clubId = clubId;
        IsNewClub = clubId == null;

        if (clubId.HasValue)
        {
            var club = await _clubService.GetByIdAsync(clubId.Value);

            if (club != null)
            {
                Name = club.Name;
                DefaultCourtCount = club.DefaultCourtCount;
                GameType = club.GameType;
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
            if (IsNewClub)
            {
                var club = await _clubService.CreateClubAsync(Name, DefaultCourtCount, GameType);
                await _navigationService.NavigateToAsync($"clubs/{club.Id}");
            }
            else if (_clubId.HasValue)
            {
                var club = await _clubService.GetByIdAsync(_clubId.Value);

                if (club != null)
                {
                    club.Name = Name;
                    club.DefaultCourtCount = DefaultCourtCount;
                    club.GameType = GameType;

                    await _clubService.UpdateClubAsync(club);
                    await _navigationService.GoBackAsync();
                }
            }
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to save club: {ex.Message}";
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
            ErrorMessage = "Club name is required";
            return false;
        }

        if (DefaultCourtCount < 1 || DefaultCourtCount > 20)
        {
            ErrorMessage = "Court count must be between 1 and 20";
            return false;
        }

        return true;
    }
}
