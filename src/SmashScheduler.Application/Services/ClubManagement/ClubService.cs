using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.ClubManagement;

public class ClubService : IClubService
{
    private readonly IClubRepository _clubRepository;
    private readonly IPlayerRepository _playerRepository;
    private readonly ISessionRepository _sessionRepository;

    public ClubService(
        IClubRepository clubRepository,
        IPlayerRepository playerRepository,
        ISessionRepository sessionRepository)
    {
        _clubRepository = clubRepository;
        _playerRepository = playerRepository;
        _sessionRepository = sessionRepository;
    }

    public async Task<Club?> GetByIdAsync(Guid id)
    {
        return await _clubRepository.GetByIdAsync(id);
    }

    public async Task<List<Club>> GetAllClubsAsync()
    {
        return await _clubRepository.GetAllAsync();
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

        await _clubRepository.InsertAsync(club);
        return club;
    }

    public async Task UpdateClubAsync(Club club)
    {
        await _clubRepository.UpdateAsync(club);
    }

    public async Task DeleteClubAsync(Guid id)
    {
        var players = await _playerRepository.GetByClubIdAsync(id);
        foreach (var player in players)
        {
            await _playerRepository.DeleteAsync(player.Id);
        }

        var sessions = await _sessionRepository.GetByClubIdAsync(id);
        foreach (var session in sessions)
        {
            await _sessionRepository.DeleteAsync(session.Id);
        }

        await _clubRepository.DeleteAsync(id);
    }
}
