using Fluxor;
using Microsoft.AspNetCore.Components;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.Matchmaking;
using SmashScheduler.Application.Services.Matchmaking.Models;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Web.State.Store.SessionStore;

public class SessionEffects(
    ISessionService sessionService,
    ISessionStateManager sessionStateManager,
    IMatchService matchService,
    IMatchmakingService matchmakingService,
    NavigationManager navigationManager)
{
    [EffectMethod]
    public async Task HandleLoadSessionsAction(LoadSessionsAction action, IDispatcher dispatcher)
    {
        try
        {
            var sessions = await sessionService.GetByClubIdAsync(action.ClubId);
            dispatcher.Dispatch(new LoadSessionsSuccessAction(sessions));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleLoadSessionAction(LoadSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            var session = await sessionService.GetByIdAsync(action.SessionId);
            if (session == null)
            {
                dispatcher.Dispatch(new LoadSessionsFailureAction("Session not found"));
                return;
            }

            var matches = await matchService.GetBySessionIdAsync(action.SessionId);
            var playerLookup = session.SessionPlayers
                .Where(sp => sp.Player != null)
                .ToDictionary(sp => sp.PlayerId, sp => sp.Player!);

            dispatcher.Dispatch(new LoadSessionSuccessAction(session, matches, playerLookup));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleCreateSessionAction(CreateSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            var session = await sessionService.CreateSessionAsync(action.ClubId, DateTime.Now, null);
            dispatcher.Dispatch(new CreateSessionSuccessAction(session));
            navigationManager.NavigateTo($"/clubs/{action.ClubId}/sessions/{session.Id}/draft");
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleAddPlayerToSessionAction(AddPlayerToSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            await sessionService.AddPlayerToSessionAsync(action.SessionId, action.PlayerId);
            var session = await sessionService.GetByIdAsync(action.SessionId);
            if (session != null)
            {
                dispatcher.Dispatch(new AddPlayerSuccessAction(session));
            }
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleRemovePlayerFromSessionAction(RemovePlayerFromSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            await sessionService.RemovePlayerFromSessionAsync(action.SessionId, action.PlayerId);
            var session = await sessionService.GetByIdAsync(action.SessionId);
            if (session != null)
            {
                dispatcher.Dispatch(new RemovePlayerSuccessAction(session));
            }
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleActivateSessionAction(ActivateSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            await sessionStateManager.ActivateSessionAsync(action.SessionId);
            dispatcher.Dispatch(new ActivateSessionSuccessAction());
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleGenerateMatchesAction(GenerateMatchesAction action, IDispatcher dispatcher)
    {
        try
        {
            var candidates = await matchmakingService.GenerateMatchesAsync(action.SessionId);

            if (!candidates.Any())
            {
                candidates = await GenerateFallbackMatches(action.SessionId);
            }

            var matches = new List<Match>();
            foreach (var candidate in candidates)
            {
                var match = await matchService.CreateMatchAsync(
                    action.SessionId,
                    candidate.CourtNumber,
                    candidate.PlayerIds,
                    true);
                matches.Add(match);
            }

            dispatcher.Dispatch(new GenerateMatchesSuccessAction(matches));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    private async Task<List<MatchCandidate>> GenerateFallbackMatches(Guid sessionId)
    {
        var session = await sessionService.GetByIdAsync(sessionId);
        if (session == null) return new List<MatchCandidate>();

        var existingMatches = await matchService.GetBySessionIdAsync(sessionId);
        var playingPlayerIds = existingMatches
            .Where(m => m.State == Domain.Enums.MatchState.InProgress)
            .SelectMany(m => m.PlayerIds)
            .ToHashSet();

        var benchedPlayerIds = session.SessionPlayers
            .Where(sp => sp.IsActive && !playingPlayerIds.Contains(sp.PlayerId))
            .Select(sp => sp.PlayerId)
            .ToList();

        var usedCourts = existingMatches
            .Where(m => m.State == Domain.Enums.MatchState.InProgress)
            .Select(m => m.CourtNumber)
            .ToHashSet();

        var availableCourts = Enumerable.Range(1, session.CourtCount)
            .Where(c => !usedCourts.Contains(c))
            .ToList();

        var candidates = new List<MatchCandidate>();
        var playerIndex = 0;

        foreach (var courtNumber in availableCourts)
        {
            if (playerIndex + 4 > benchedPlayerIds.Count) break;

            candidates.Add(new MatchCandidate
            {
                CourtNumber = courtNumber,
                PlayerIds = benchedPlayerIds.Skip(playerIndex).Take(4).ToList()
            });
            playerIndex += 4;
        }

        return candidates;
    }

    [EffectMethod]
    public async Task HandleCompleteMatchAction(CompleteMatchAction action, IDispatcher dispatcher)
    {
        try
        {
            await matchService.CompleteMatchAsync(action.MatchId, null, null);
            dispatcher.Dispatch(new CompleteMatchSuccessAction(action.MatchId));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }

    [EffectMethod]
    public async Task HandleEndSessionAction(EndSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            await sessionStateManager.CompleteSessionAsync(action.SessionId);
            dispatcher.Dispatch(new EndSessionSuccessAction());
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionsFailureAction(ex.Message));
        }
    }
}
