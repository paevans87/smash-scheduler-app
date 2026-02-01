using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;
using SmashScheduler.Infrastructure.Data.Repositories;

namespace SmashScheduler.Application.Services.PlayerManagement;

public class PlayerService : IPlayerService
{
    private readonly IPlayerRepository _playerRepository;

    public PlayerService(IPlayerRepository playerRepository)
    {
        _playerRepository = playerRepository;
    }

    public async Task<Player?> GetByIdAsync(Guid id)
    {
        return await _playerRepository.GetByIdAsync(id);
    }

    public async Task<List<Player>> GetByClubIdAsync(Guid clubId)
    {
        return await _playerRepository.GetByClubIdAsync(clubId);
    }

    public async Task<Player> CreatePlayerAsync(
        Guid clubId,
        string name,
        int skillLevel,
        Gender gender,
        PlayStylePreference playStylePreference)
    {
        if (skillLevel < 1 || skillLevel > 10)
        {
            throw new ArgumentException("Skill level must be between 1 and 10");
        }

        var player = new Player
        {
            Id = Guid.NewGuid(),
            ClubId = clubId,
            Name = name,
            SkillLevel = skillLevel,
            Gender = gender,
            PlayStylePreference = playStylePreference
        };

        await _playerRepository.InsertAsync(player);
        return player;
    }

    public async Task UpdatePlayerAsync(Player player)
    {
        if (player.SkillLevel < 1 || player.SkillLevel > 10)
        {
            throw new ArgumentException("Skill level must be between 1 and 10");
        }

        await _playerRepository.UpdateAsync(player);
    }

    public async Task DeletePlayerAsync(Guid id)
    {
        await _playerRepository.DeleteAsync(id);
    }

    public async Task AddToBlacklistAsync(Guid playerId, Guid blacklistedPlayerId, BlacklistType blacklistType)
    {
        var existingBlacklists = await _playerRepository.GetBlacklistsByPlayerIdAsync(playerId);

        var isDuplicate = existingBlacklists.Any(b =>
            b.BlacklistedPlayerId == blacklistedPlayerId &&
            b.BlacklistType == blacklistType);

        if (isDuplicate)
        {
            return;
        }

        var blacklist = new PlayerBlacklist
        {
            PlayerId = playerId,
            BlacklistedPlayerId = blacklistedPlayerId,
            BlacklistType = blacklistType
        };

        await _playerRepository.AddToBlacklistAsync(blacklist);
    }

    public async Task RemoveFromBlacklistAsync(Guid playerId, Guid blacklistedPlayerId)
    {
        await _playerRepository.RemoveFromBlacklistAsync(playerId, blacklistedPlayerId);
    }

    public async Task<List<PlayerBlacklist>> GetBlacklistsAsync(Guid playerId)
    {
        return await _playerRepository.GetBlacklistsByPlayerIdAsync(playerId);
    }
}
