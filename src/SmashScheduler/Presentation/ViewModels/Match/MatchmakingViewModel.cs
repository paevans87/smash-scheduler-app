using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.Matchmaking;
using SmashScheduler.Application.Services.Matchmaking.Models;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Match;

public partial class MatchmakingViewModel : ObservableObject
{
    private readonly IMatchmakingService _matchmakingService;
    private readonly INavigationService _navigationService;

    private Guid _sessionId;

    [ObservableProperty]
    private ObservableCollection<MatchCandidate> _matchCandidates = new();

    [ObservableProperty]
    private bool _isGenerating;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public MatchmakingViewModel(
        IMatchmakingService matchmakingService,
        INavigationService navigationService)
    {
        _matchmakingService = matchmakingService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid sessionId)
    {
        _sessionId = sessionId;
        await GenerateMatchesAsync();
    }

    [RelayCommand]
    private async Task GenerateMatchesAsync()
    {
        IsGenerating = true;
        ErrorMessage = string.Empty;

        try
        {
            var candidates = await _matchmakingService.GenerateMatchesAsync(_sessionId);
            MatchCandidates = new ObservableCollection<MatchCandidate>(candidates);
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to generate matches: {ex.Message}";
        }
        finally
        {
            IsGenerating = false;
        }
    }

    [RelayCommand]
    private async Task AcceptMatchesAsync()
    {
        await _navigationService.GoBackAsync();
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        await _navigationService.GoBackAsync();
    }
}
