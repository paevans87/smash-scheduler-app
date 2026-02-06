namespace SmashScheduler.Application.Services.Matchmaking.Models;

public record ManualMatchResult(int CourtNumber, List<Guid> PlayerIds, bool SaveAsDraft);
