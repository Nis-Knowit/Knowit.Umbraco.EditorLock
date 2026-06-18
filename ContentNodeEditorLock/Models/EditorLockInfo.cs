namespace Knowit.Umbraco.EditorLock.Models;

/// <summary>
/// Represents the active editing lock held on a single content node.
/// </summary>
public sealed class EditorLockInfo
{
    public required Guid NodeKey { get; init; }

    public required Guid UserKey { get; set; }

    public required string UserName { get; set; }

    public required string ConnectionId { get; set; }

    public DateTime LastHeartbeatUtc { get; set; }
}
