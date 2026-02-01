using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.PlayerManagement;

public interface IPlayerService
{
    Task<Player?> GetByIdAsync(Guid id);
    Task<List<Player>> GetByClubIdAsync(Guid clubId);
    Task<Player> CreatePlayerAsync(Guid clubId, string name, int skillLevel, Gender gender, PlayStylePreference playStylePreference);
    Task UpdatePlayerAsync(Player player);
    Task DeletePlayerAsync(Guid id);
    Task AddToBlacklistAsync(Guid playerId, Guid blacklistedPlayerId, BlacklistType blacklistType);
    Task RemoveFromBlacklistAsync(Guid playerId, Guid blacklistedPlayerId);
    Task<List<PlayerBlacklist>> GetBlacklistsAsync(Guid playerId);
}
