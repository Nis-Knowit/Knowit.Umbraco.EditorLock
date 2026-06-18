namespace Knowit.Umbraco.EditorLock;

public static class Constants
{
    /// <summary>
    /// The route the SignalR hub is mapped to. Mapping under <c>/umbraco/</c> means the
    /// connection is authenticated against the backoffice user (bearer token).
    /// </summary>
    public const string HubRoute = "/umbraco/knowitEditorLockHub";

    /// <summary>
    /// A lock is considered stale (and auto-released) when no heartbeat has been received
    /// from its holder within this window. This is the timeout half of "auto-grant when the
    /// holder walks away"; ungraceful disconnects are also caught by the hub's OnDisconnected.
    /// </summary>
    public static readonly TimeSpan LockTimeout = TimeSpan.FromSeconds(60);

    /// <summary>
    /// How often the background service scans for and releases stale locks.
    /// </summary>
    public static readonly TimeSpan CleanupInterval = TimeSpan.FromSeconds(20);

    internal static string GroupName(Guid nodeKey) => $"node:{nodeKey}";
}
