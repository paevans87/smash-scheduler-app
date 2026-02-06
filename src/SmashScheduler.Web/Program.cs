using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using MudBlazor.Services;
using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Application.Services.ClubManagement;
using SmashScheduler.Application.Services.PlayerManagement;
using SmashScheduler.Application.Services.SessionManagement;
using SmashScheduler.Application.Services.MatchManagement;
using SmashScheduler.Application.Services.Matchmaking;
using SmashScheduler.Application.Services.Analytics;
using Fluxor;
using SmashScheduler.Infrastructure.Web;
using SmashScheduler.Web;
using SmashScheduler.Web.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddMudServices();

builder.Services.AddFluxor(options => options
    .ScanAssemblies(typeof(Program).Assembly));

builder.Services.AddSingleton<SmashSchedulerDb>();
builder.Services.AddSingleton<IClubRepository, IndexedDbClubRepository>();
builder.Services.AddSingleton<IPlayerRepository, IndexedDbPlayerRepository>();
builder.Services.AddSingleton<ISessionRepository, IndexedDbSessionRepository>();
builder.Services.AddSingleton<IMatchRepository, IndexedDbMatchRepository>();

builder.Services.AddScoped<IClubService, ClubService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IMatchmakingService, MatchmakingService>();
builder.Services.AddScoped<ISessionStateManager, SessionStateManager>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

builder.Services.AddSingleton<IBreadcrumbService, BreadcrumbService>();
builder.Services.AddSingleton<IThemeService, ThemeService>();

await builder.Build().RunAsync();
