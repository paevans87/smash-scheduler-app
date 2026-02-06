using System.Net.Http.Json;
using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.PlayerManagement;

public class PlayerService(IPlayerRepository playerRepository, HttpClient client) : IPlayerService
{
    public async Task<Player?> GetByIdAsync(Guid id)
    {
        return await playerRepository.GetByIdAsync(id);
    }

    public async Task<List<Player>> GetByClubIdAsync(Guid clubId)
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

    public async Task<List<PlayerBlacklist>> GetBlacklistsAsync(Guid playerId)
    {
        return await playerRepository.GetBlacklistsByPlayerIdAsync(playerId);
    }

    public async Task AddToBlacklistAsync(Guid playerId, Guid blacklistedPlayerId, BlacklistType blacklistType)
    {
        if (playerId == blacklistedPlayerId)
            return;

        var existingBlacklists = await playerRepository.GetBlacklistsByPlayerIdAsync(playerId);
        var alreadyExists = existingBlacklists.Any(b =>
            b.BlacklistedPlayerId == blacklistedPlayerId && b.BlacklistType == blacklistType);

        if (alreadyExists)
            return;

        var blacklist = new PlayerBlacklist
        {
            PlayerId = playerId,
            BlacklistedPlayerId = blacklistedPlayerId,
            BlacklistType = blacklistType
        };

        await playerRepository.AddToBlacklistAsync(blacklist);
    }

    public async Task RemoveFromBlacklistAsync(Guid playerId, Guid blacklistedPlayerId, BlacklistType blacklistType)
    {
        await playerRepository.RemoveFromBlacklistAsync(playerId, blacklistedPlayerId);
    }
    
    public async Task SeedPlayersFromFileAsync(Guid clubId)
    {
        var relativePath = "SundayCharters.json";
        var data = await client.GetFromJsonAsync<PlayerFileImportWrapperDto>(relativePath);
        if (data == null || data.Players.Count == 0)
        {
            throw new FileNotFoundException("The seed file could not be parsed or there are no players listed.");
        }
        
        foreach (var p in data.Players)
        {
            var gender = (Gender)p.Gender;

            var playStyle = (PlayStylePreference)p.PlayStylePreference;

            await CreatePlayerAsync(clubId, p.Name, p.SkillLevel, gender, playStyle);
        }
    }

    private class PlayerFileImportWrapperDto
    {
        public List<PlayerFileImportDto> Players { get; set; } = new();
    }
    
    private class PlayerFileImportDto
    {
        public string Name { get; set; }
        public int SkillLevel { get; set; }
        public int Gender { get; set; }
        public int PlayStylePreference { get; set; }
    }
}

