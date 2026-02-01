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
using SmashScheduler.Infrastructure.Web;
using SmashScheduler.Web;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddMudServices();

builder.Services.AddSingleton<IClubRepository, InMemoryClubRepository>();
builder.Services.AddSingleton<IPlayerRepository, InMemoryPlayerRepository>();
builder.Services.AddSingleton<ISessionRepository, InMemorySessionRepository>();
builder.Services.AddSingleton<IMatchRepository, InMemoryMatchRepository>();

builder.Services.AddScoped<IClubService, ClubService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IMatchmakingService, MatchmakingService>();
builder.Services.AddScoped<ISessionStateManager, SessionStateManager>();
builder.Services.AddScoped<IAnalyticsService, AnalyticsService>();

await builder.Build().RunAsync();
