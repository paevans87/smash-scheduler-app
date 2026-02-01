using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.PlayerManagement;

public class PlayerService(
    IPlayerRepository playerRepository) : IPlayerService
{
    public async Task<Player?> GetByIdAsync(Guid id)
    {
        return await playerRepository.GetByIdAsync(id);
    }

    public async Task<List<Player>> GetPlayersByClubIdAsync(Guid clubId)
    {
        return await playerRepository.GetByClubIdAsync(clubId);
    }

    public async Task<Player> CreatePlayerAsync(
        Guid clubId,
        string name,
        int skillLevel,
        Gender gender,
        PlayStylePreference playStylePreference)
    {
        var player = new Player
        {
            Id = Guid.NewGuid(),
            ClubId = clubId,
            Name = name,
            SkillLevel = skillLevel,
            Gender = gender,
            PlayStylePreference = playStylePreference
        };

        await playerRepository.InsertAsync(player);
        return player;
    }

    public async Task UpdatePlayerAsync(Player player)
    {
        await playerRepository.UpdateAsync(player);
    }

    public async Task DeletePlayerAsync(Guid id)
    {
        await playerRepository.DeleteAsync(id);
    }
}
