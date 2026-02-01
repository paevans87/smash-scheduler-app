using SmashScheduler.Presentation.Views.Analytics;
using SmashScheduler.Presentation.Views.Club;
using SmashScheduler.Presentation.Views.Match;
using SmashScheduler.Presentation.Views.Player;
using SmashScheduler.Presentation.Views.Session;

namespace SmashScheduler;

public partial class AppShell : Shell
{
    public AppShell()
    {
        try 
        {
            InitializeComponent();
            RegisterRoutes();
        }
        catch (Exception ex)
        {
            // This will print to your Rider 'Debug' console
            System.Diagnostics.Debug.WriteLine($"XAML CRASH: {ex.Message}");
            throw; 
        }
    }

    private void RegisterRoutes()
    {
        Routing.RegisterRoute("clubs/create", typeof(ClubEditPage));
        Routing.RegisterRoute("clubs/detail", typeof(ClubDetailPage));
        Routing.RegisterRoute("clubs/edit", typeof(ClubEditPage));

        Routing.RegisterRoute("players", typeof(PlayerListPage));
        Routing.RegisterRoute("players/create", typeof(PlayerEditPage));
        Routing.RegisterRoute("players/detail", typeof(PlayerDetailPage));
        Routing.RegisterRoute("players/edit", typeof(PlayerEditPage));

        Routing.RegisterRoute("sessions/create", typeof(SessionDraftPage));
        Routing.RegisterRoute("sessions/draft", typeof(SessionDraftPage));
        Routing.RegisterRoute("sessions/active", typeof(SessionActivePage));
        Routing.RegisterRoute("sessions/detail", typeof(SessionDetailPage));

        Routing.RegisterRoute("matches/detail", typeof(MatchDetailPage));

        Routing.RegisterRoute("analytics/session", typeof(SessionAnalyticsPage));
        Routing.RegisterRoute("analytics/player", typeof(PlayerAnalyticsPage));
    }
}
