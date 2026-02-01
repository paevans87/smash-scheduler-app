using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;
using SmashScheduler.Application.Interfaces;
using SmashScheduler.Application.Services.Analytics;
using SmashScheduler.Application.Services.ClubManagement;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.Matchmaking;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Infrastructure.Data;
using SmashScheduler.Infrastructure.Data.Repositories;
using SmashScheduler.Infrastructure.Persistence;
using SmashScheduler.Presentation.ViewModels.Analytics;
using SmashScheduler.Presentation.ViewModels.Club;
using SmashScheduler.Presentation.ViewModels.Match;
using SmashScheduler.Presentation.ViewModels.Player;
using SmashScheduler.Presentation.ViewModels.Session;
using SmashScheduler.Presentation.Views.Analytics;
using SmashScheduler.Presentation.Views.Club;
using SmashScheduler.Presentation.Views.Match;
using SmashScheduler.Presentation.Views.Player;
using SmashScheduler.Presentation.Views.Session;

namespace SmashScheduler;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();

        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        builder.Services.AddSingleton(GetDatabasePath());
        builder.Services.AddSingleton<SmashSchedulerDbContext>();
        builder.Services.AddSingleton<DatabaseInitialiser>();

        RegisterRepositories(builder.Services);
        RegisterServices(builder.Services);
        RegisterViewModels(builder.Services);
        RegisterViews(builder.Services);

#if DEBUG
        //builder.Logging.AddDebug();
#endif

        return builder.Build();
    }

    private static string GetDatabasePath()
    {
        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "smashscheduler.db3");
        return dbPath;
    }

    private static void RegisterRepositories(IServiceCollection services)
    {
        services.AddSingleton<IClubRepository, ClubRepository>();
        services.AddSingleton<IPlayerRepository, PlayerRepository>();
        services.AddSingleton<ISessionRepository, SessionRepository>();
        services.AddSingleton<IMatchRepository, MatchRepository>();
    }

    private static void RegisterServices(IServiceCollection services)
    {
        services.AddSingleton<INavigationService, NavigationService>();
        services.AddSingleton<IClubService, ClubService>();
        services.AddSingleton<IPlayerService, PlayerService>();
        services.AddSingleton<ISessionService, SessionService>();
        services.AddSingleton<ISessionStateManager, SessionStateManager>();
        services.AddSingleton<IMatchService, MatchService>();
        services.AddSingleton<IMatchmakingService, MatchmakingService>();
        services.AddSingleton<IAnalyticsService, AnalyticsService>();
    }

    private static void RegisterViewModels(IServiceCollection services)
    {
        services.AddTransient<ClubListViewModel>();
        services.AddTransient<ClubDetailViewModel>();
        services.AddTransient<ClubEditViewModel>();

        services.AddTransient<PlayerListViewModel>();
        services.AddTransient<PlayerDetailViewModel>();
        services.AddTransient<PlayerEditViewModel>();

        services.AddTransient<SessionListViewModel>();
        services.AddTransient<SessionDraftViewModel>();
        services.AddTransient<SessionActiveViewModel>();
        services.AddTransient<SessionDetailViewModel>();

        services.AddTransient<MatchmakingViewModel>();
        services.AddTransient<MatchDetailViewModel>();

        services.AddTransient<SessionAnalyticsViewModel>();
        services.AddTransient<PlayerAnalyticsViewModel>();
    }

    private static void RegisterViews(IServiceCollection services)
    {
        services.AddTransient<ClubListPage>();
        services.AddTransient<ClubDetailPage>();
        services.AddTransient<ClubEditPage>();

        services.AddTransient<PlayerListPage>();
        services.AddTransient<PlayerDetailPage>();
        services.AddTransient<PlayerEditPage>();

        services.AddTransient<SessionListPage>();
        services.AddTransient<SessionDraftPage>();
        services.AddTransient<SessionActivePage>();
        services.AddTransient<SessionDetailPage>();

        services.AddTransient<MatchDetailPage>();

        services.AddTransient<SessionAnalyticsPage>();
        services.AddTransient<PlayerAnalyticsPage>();
    }
}