using SmashScheduler.Application.Interfaces.Repositories;
using SmashScheduler.Domain.Entities;

namespace SmashScheduler.Infrastructure.Web;

public class IndexedDbPlayerRepository(SmashSchedulerDb database) : IPlayerRepository
{
    public async Task<Player?> GetByIdAsync(Guid id)
    {
        await database.OpenAsync();
        return await database.Players.GetAsync<string, Player>(id.ToString());
    }

    public async Task<List<Player>> GetAllAsync()
    {
        await database.OpenAsync();
        var players = await database.Players.GetAllAsync<Player>();
        return players?.ToList() ?? new List<Player>();
    }

    public async Task<List<Player>> GetByClubIdAsync(Guid clubId)
    {
        await database.OpenAsync();
        var allPlayers = await database.Players.GetAllAsync<Player>();
        return allPlayers?.Where(p => p.ClubId == clubId).ToList() ?? new List<Player>();
    }

    public async Task InsertAsync(Player player)
    {
        player.CreatedAt = DateTime.UtcNow;
        player.UpdatedAt = DateTime.UtcNow;
        await database.OpenAsync();
        await database.Players.AddAsync(player);
    }

    public async Task UpdateAsync(Player player)
    {
        player.UpdatedAt = DateTime.UtcNow;
        await database.OpenAsync();
        await database.Players.PutAsync(player);
    }

    public async Task DeleteAsync(Guid id)
    {
        await database.OpenAsync();
        await database.Players.DeleteAsync<string>(id.ToString());
    }

    public async Task<List<PlayerBlacklist>> GetBlacklistsByPlayerIdAsync(Guid playerId)
    {
        await database.OpenAsync();
        var allBlacklists = await database.PlayerBlacklists.GetAllAsync<PlayerBlacklist>();
        return allBlacklists?.Where(b => b.PlayerId == playerId).ToList() ?? new List<PlayerBlacklist>();
    }

    public async Task AddToBlacklistAsync(PlayerBlacklist blacklist)
    {
        blacklist.CreatedAt = DateTime.UtcNow;
        await database.OpenAsync();
        await database.PlayerBlacklists.AddAsync(blacklist);
    }

    public async Task RemoveFromBlacklistAsync(Guid playerId, Guid blacklistedPlayerId)
    {
        await database.OpenAsync();
        var allBlacklists = await database.PlayerBlacklists.GetAllAsync<PlayerBlacklist>();
        var toRemove = allBlacklists?.Where(b => b.PlayerId == playerId && b.BlacklistedPlayerId == blacklistedPlayerId).ToList();
        if (toRemove != null)
        {
            foreach (var blacklist in toRemove)
            {
                await database.PlayerBlacklists.DeleteAsync<string>(blacklist.Id);
            }
        }
    }
}
