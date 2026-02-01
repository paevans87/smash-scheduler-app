using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.Matchmaking;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Session;

public partial class SessionActiveViewModel : ObservableObject
{
    private readonly ISessionService _sessionService;
    private readonly IMatchmakingService _matchmakingService;
    private readonly IMatchService _matchService;
    private readonly ISessionStateManager _sessionStateManager;
    private readonly INavigationService _navigationService;

    private Guid _clubId;
    private Guid _sessionId;

    [ObservableProperty]
    private Domain.Entities.Session? _session;

    [ObservableProperty]
    private ObservableCollection<Match> _activeMatches = new();

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Player> _benchedPlayers = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private bool _isGeneratingMatches;

    [ObservableProperty]
    private string _errorMessage = string.Empty;

    public SessionActiveViewModel(
        ISessionService sessionService,
        IMatchmakingService matchmakingService,
        IMatchService matchService,
        ISessionStateManager sessionStateManager,
        INavigationService navigationService)
    {
        _sessionService = sessionService;
        _matchmakingService = matchmakingService;
        _matchService = matchService;
        _sessionStateManager = sessionStateManager;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid clubId, Guid sessionId)
    {
        _clubId = clubId;
        _sessionId = sessionId;
        await RefreshAsync();
    }

    [RelayCommand]
    private async Task RefreshAsync()
    {
        IsLoading = true;

        try
        {
            Session = await _sessionService.GetByIdAsync(_sessionId);

            if (Session != null)
            {
                var matches = await _matchService.GetBySessionIdAsync(_sessionId);
                ActiveMatches = new ObservableCollection<Match>(
                    matches.Where(m => m.State == MatchState.InProgress)
                );

                BenchedPlayers = new ObservableCollection<Domain.Entities.Player>(
                    Session.BenchedPlayers
                );
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task GenerateMatchesAsync()
    {
        IsGeneratingMatches = true;
        ErrorMessage = string.Empty;

        try
        {
            var matchCandidates = await _matchmakingService.GenerateMatchesAsync(_sessionId);

            foreach (var candidate in matchCandidates)
            {
                await _matchService.CreateMatchAsync(
                    _sessionId,
                    candidate.CourtNumber,
                    candidate.PlayerIds,
                    wasAutomated: true
                );
            }

            await RefreshAsync();
        }
        catch (Exception ex)
        {
            ErrorMessage = $"Failed to generate matches: {ex.Message}";
        }
        finally
        {
            IsGeneratingMatches = false;
        }
    }

    [RelayCommand]
    private async Task CompleteMatchAsync(Guid matchId)
    {
        await _matchService.CompleteMatchAsync(matchId, null, null);
        await RefreshAsync();
    }

    [RelayCommand]
    private async Task MarkPlayerInactiveAsync(Guid playerId)
    {
        await _sessionService.MarkPlayerInactiveAsync(_sessionId, playerId, false);
        await RefreshAsync();
    }

    [RelayCommand]
    private async Task CompleteSessionAsync()
    {
        IsLoading = true;

        try
        {
            await _sessionStateManager.CompleteSessionAsync(_sessionId);
            await _navigationService.NavigateToAsync($"clubs/{_clubId}/sessions/{_sessionId}/analytics");
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task NavigateToMatchDetailAsync(Guid matchId)
    {
        await _navigationService.NavigateToAsync($"matches/{matchId}");
    }
}
