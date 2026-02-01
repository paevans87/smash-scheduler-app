using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.ValueObjects;
using System.Collections.ObjectModel;

namespace SmashScheduler.Presentation.ViewModels.Match;

public partial class MatchDetailViewModel : ObservableObject
{
    private readonly IMatchService _matchService;
    private readonly IPlayerService _playerService;
    private readonly INavigationService _navigationService;

    [ObservableProperty]
    private Domain.Entities.Match? _match;

    [ObservableProperty]
    private ObservableCollection<Domain.Entities.Player> _players = new();

    [ObservableProperty]
    private bool _isLoading;

    [ObservableProperty]
    private int _team1Score;

    [ObservableProperty]
    private int _team2Score;

    public MatchDetailViewModel(
        IMatchService matchService,
        IPlayerService playerService,
        INavigationService navigationService)
    {
        _matchService = matchService;
        _playerService = playerService;
        _navigationService = navigationService;
    }

    public async Task InitialiseAsync(Guid matchId)
    {
        IsLoading = true;

        try
        {
            Match = await _matchService.GetByIdAsync(matchId);

            if (Match != null)
            {
                var playerTasks = Match.PlayerIds.Select(id => _playerService.GetByIdAsync(id));
                var playerResults = await Task.WhenAll(playerTasks);
                Players = new ObservableCollection<Domain.Entities.Player>(
                    playerResults.Where(p => p != null).Cast<Domain.Entities.Player>()
                );

                if (Match.Score != null)
                {
                    Team1Score = Match.Score.Team1Score;
                    Team2Score = Match.Score.Team2Score;
                }
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CompleteMatchAsync()
    {
        if (Match == null)
        {
            return;
        }

        var score = new MatchScore(Team1Score, Team2Score);
        var winningPlayerIds = Team1Score > Team2Score
            ? Match.PlayerIds.Take(2).ToList()
            : Match.PlayerIds.Skip(2).ToList();

        await _matchService.CompleteMatchAsync(Match.Id, winningPlayerIds, score);
        await _navigationService.GoBackAsync();
    }

    [RelayCommand]
    private async Task CancelAsync()
    {
        await _navigationService.GoBackAsync();
    }
}
