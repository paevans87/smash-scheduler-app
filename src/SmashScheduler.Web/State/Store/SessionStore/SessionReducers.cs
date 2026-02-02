using Fluxor;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Web.State.Store.SessionStore;

public static class SessionReducers
{
    [ReducerMethod]
    public static SessionStoreState ReduceLoadSessionsAction(SessionStoreState state, LoadSessionsAction action)
        => state with { IsLoading = true, ErrorMessage = null };

    [ReducerMethod]
    public static SessionStoreState ReduceLoadSessionsSuccessAction(SessionStoreState state, LoadSessionsSuccessAction action)
        => state with { Sessions = action.Sessions, IsLoading = false };

    [ReducerMethod]
    public static SessionStoreState ReduceLoadSessionsFailureAction(SessionStoreState state, LoadSessionsFailureAction action)
        => state with { IsLoading = false, ErrorMessage = action.Error };

    [ReducerMethod]
    public static SessionStoreState ReduceLoadSessionAction(SessionStoreState state, LoadSessionAction action)
        => state with { IsLoading = true, ErrorMessage = null };

    [ReducerMethod]
    public static SessionStoreState ReduceLoadSessionSuccessAction(SessionStoreState state, LoadSessionSuccessAction action)
        => state with
        {
            CurrentSession = action.Session,
            ActiveMatches = action.Matches,
            PlayerLookup = action.PlayerLookup,
            IsLoading = false
        };

    [ReducerMethod]
    public static SessionStoreState ReduceCreateSessionSuccessAction(SessionStoreState state, CreateSessionSuccessAction action)
        => state with { Sessions = state.Sessions.Append(action.Session), CurrentSession = action.Session };

    [ReducerMethod]
    public static SessionStoreState ReduceAddPlayerSuccessAction(SessionStoreState state, AddPlayerSuccessAction action)
        => state with { CurrentSession = action.Session };

    [ReducerMethod]
    public static SessionStoreState ReduceRemovePlayerSuccessAction(SessionStoreState state, RemovePlayerSuccessAction action)
        => state with { CurrentSession = action.Session };

    [ReducerMethod]
    public static SessionStoreState ReduceGenerateMatchesAction(SessionStoreState state, GenerateMatchesAction action)
        => state with { IsGeneratingMatches = true };

    [ReducerMethod]
    public static SessionStoreState ReduceGenerateMatchesSuccessAction(SessionStoreState state, GenerateMatchesSuccessAction action)
        => state with { ActiveMatches = state.ActiveMatches.Concat(action.Matches), IsGeneratingMatches = false };

    [ReducerMethod]
    public static SessionStoreState ReduceCompleteMatchSuccessAction(SessionStoreState state, CompleteMatchSuccessAction action)
        => state with
        {
            ActiveMatches = state.ActiveMatches.Select(m =>
                m.Id == action.MatchId
                    ? new Domain.Entities.Match
                    {
                        Id = m.Id,
                        SessionId = m.SessionId,
                        CourtNumber = m.CourtNumber,
                        PlayerIds = m.PlayerIds,
                        State = MatchState.Completed,
                        WasAutomated = m.WasAutomated,
                        StartedAt = m.StartedAt,
                        CompletedAt = DateTime.UtcNow
                    }
                    : m)
        };

    [ReducerMethod]
    public static SessionStoreState ReduceSetSessionFilterAction(SessionStoreState state, SetSessionFilterAction action)
        => state with { FilterState = action.Filter };

    [ReducerMethod]
    public static SessionStoreState ReduceActivateSessionSuccessAction(SessionStoreState state, ActivateSessionSuccessAction action)
    {
        if (state.CurrentSession == null) return state;
        state.CurrentSession.State = SessionState.Active;
        return state with { CurrentSession = state.CurrentSession };
    }

    [ReducerMethod]
    public static SessionStoreState ReduceEndSessionSuccessAction(SessionStoreState state, EndSessionSuccessAction action)
    {
        if (state.CurrentSession == null) return state;
        state.CurrentSession.State = SessionState.Complete;
        return state with { CurrentSession = state.CurrentSession };
    }
}
