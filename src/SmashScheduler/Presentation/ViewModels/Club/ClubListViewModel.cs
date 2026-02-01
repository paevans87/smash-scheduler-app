using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.ClubManagement;
using SmashScheduler.Domain.Entities;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Club;

public partial class ClubListViewModel : ObservableObject
{
    private readonly IClubService _clubService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Club> _clubs = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isEmpty;

    public ClubListViewModel(IClubService clubService, INavigationService navigationService)
    {
        _clubService = clubService;
        _navigationService = navigationService;
    }

    [RelayCommand]
    private async Task LoadClubsAsync()
    {
        IsLoading = true;

        try
        {
            var clubs = await _clubService.GetAllClubsAsync();
            Clubs = new ObservableCollection<Domain.Entities.Club>(clubs);
            IsEmpty = Clubs.Count == 0;
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToClubDetailAsync(Guid clubId)
    {
        await _navigationService.NavigateToAsync($"clubs/{clubId}");
    }

    [RelayCommand]
    private async Task NavigateToCreateClubAsync()
    {
        await _navigationService.NavigateToAsync("clubs/create");
    }

    [RelayCommand]
    private async Task DeleteClubAsync(Guid clubId)
    {
        await _clubService.DeleteClubAsync(clubId);
        await LoadClubsAsync();
    }
}
