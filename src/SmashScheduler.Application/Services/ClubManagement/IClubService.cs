using SmashScheduler.Domain.Entities;
using SmashScheduler.Domain.Enums;

namespace SmashScheduler.Application.Services.ClubManagement;

public interface IClubService
{
    Task<Club?> GetByIdAsync(Guid id);
    Task<List<Club>> GetAllClubsAsync();
    Task<Club> CreateClubAsync(string name, int defaultCourtCount, GameType gameType);
    Task UpdateClubAsync(Club club);
    Task DeleteClubAsync(Guid id);
}
