using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.ClubManagement;

public class ClubService(
    IClubRepository clubRepository,
    IPlayerRepository playerRepository,
    ISessionRepository sessionRepository) : IClubService
{
    public async Task<Club?> GetByIdAsync(Guid id)
    {
        return await clubRepository.GetByIdAsync(id);
    }

    public async Task<List<Club>> GetAllClubsAsync()
    {
        return await clubRepository.GetAllAsync();
    }

    public async Task<Club> CreateClubAsync(string name, int defaultCourtCount, GameType gameType)
    {
        var club = new Club
        {
            Id = Guid.NewGuid(),
            Name = name,
            DefaultCourtCount = defaultCourtCount,
            GameType = gameType
        };

        await clubRepository.InsertAsync(club);
        return club;
    }

    public async Task UpdateClubAsync(Club club)
    {
        await clubRepository.UpdateAsync(club);
    }

    public async Task DeleteClubAsync(Guid id)
    {
        var players = await playerRepository.GetByClubIdAsync(id);
        foreach (var player in players)
        {
            await playerRepository.DeleteAsync(player.Id);
        }

        var sessions = await sessionRepository.GetByClubIdAsync(id);
        foreach (var session in sessions)
        {
            await sessionRepository.DeleteAsync(session.Id);
        }

        await clubRepository.DeleteAsync(id);
    }
}
