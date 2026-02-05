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

    public async Task SeedTestPlayersAsync(Guid clubId, int count = 26)
    {
        var random = new Random();

        var maleNames = new[]
        {
            "James", "Oliver", "William", "Henry", "George", "Charlie", "Thomas", "Jack",
            "Harry", "Oscar", "Leo", "Archie", "Joshua", "Max", "Ethan", "Lucas",
            "Jacob", "Alexander", "Daniel", "Sebastian", "Adam", "Edward", "Samuel", "Joseph",
            "David", "Benjamin", "Noah", "Liam"
        };

        var femaleNames = new[]
        {
            "Olivia", "Emma", "Charlotte", "Amelia", "Isla", "Ava", "Mia", "Grace",
            "Freya", "Emily", "Sophia", "Lily", "Isabella", "Evie", "Poppy", "Ella",
            "Sophie", "Jessica", "Alice", "Florence", "Daisy", "Matilda", "Rosie", "Eva",
            "Lucy", "Hannah", "Chloe", "Ruby"
        };

        var playStyles = Enum.GetValues<PlayStylePreference>();
        var maleIndex = 0;
        var femaleIndex = 0;

        for (var i = 0; i < count; i++)
        {
            var gender = random.Next(2) == 0 ? Gender.Male : Gender.Female;
            var name = gender == Gender.Male
                ? maleNames[maleIndex++ % maleNames.Length]
                : femaleNames[femaleIndex++ % femaleNames.Length];

            var skillLevel = random.Next(1, 11);
            var playStyle = playStyles[random.Next(playStyles.Length)];

            await CreatePlayerAsync(clubId, name, skillLevel, gender, playStyle);
        }
    }
}
