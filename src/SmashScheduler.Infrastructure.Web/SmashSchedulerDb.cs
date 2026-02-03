using CloudNimble.BlazorEssentials.IndexedDb;
using Microsoft.JSInterop;

namespace SmashScheduler.Infrastructure.Web;

public class SmashSchedulerDb : IndexedDbDatabase
{
    [ObjectStore(AutoIncrementKeys = false, KeyPath = "id")]
    public IndexedDbObjectStore Clubs { get; set; } = null!;

    [ObjectStore(AutoIncrementKeys = false, KeyPath = "id")]
    [Index(Name = "clubId", Path = "clubId")]
    public IndexedDbObjectStore Players { get; set; } = null!;

    [ObjectStore(AutoIncrementKeys = false, KeyPath = "id")]
    [Index(Name = "clubId", Path = "clubId")]
    public IndexedDbObjectStore Sessions { get; set; } = null!;

    [ObjectStore(AutoIncrementKeys = false, KeyPath = "id")]
    [Index(Name = "sessionId", Path = "sessionId")]
    public IndexedDbObjectStore Matches { get; set; } = null!;

    [ObjectStore(AutoIncrementKeys = false, KeyPath = "id")]
    [Index(Name = "playerId", Path = "playerId")]
    public IndexedDbObjectStore PlayerBlacklists { get; set; } = null!;

    public SmashSchedulerDb(IJSRuntime jsRuntime) : base(jsRuntime)
    {
        Name = "SmashSchedulerDb";
        Version = 3;
    }
}
