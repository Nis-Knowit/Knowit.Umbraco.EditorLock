using Knowit.Umbraco.EditorLock.Models;

namespace Knowit.Umbraco.EditorLock.Services;

/// <summary>
/// Tracks which backoffice user currently has each content node open for editing.
/// The default implementation is an in-memory singleton: locks are lost on app restart and
/// are not shared across load-balanced servers.
/// </summary>
public interface IEditorLockService
{
    /// <summary>
    /// Acquire the lock for <paramref name="nodeKey"/> on behalf of the caller, or — if it is
    /// already held by someone else — return the current holder so the caller goes read-only.
    /// The same user re-opening the node always keeps the lock.
    /// </summary>
    EditorLockStatus AcquireOrObserve(Guid nodeKey, Guid userKey, string userName, string connectionId);

    /// <summary>Get the current lock for a node, or null if none.</summary>
    EditorLockInfo? Get(Guid nodeKey);

    /// <summary>Release the lock if it is held by the given connection. Returns true if released.</summary>
    bool Release(Guid nodeKey, string connectionId);

    /// <summary>Release every lock held by a connection (e.g. on disconnect). Returns the released locks.</summary>
    IReadOnlyCollection<EditorLockInfo> ReleaseAllForConnection(string connectionId);

    /// <summary>Refresh the heartbeat timestamp for a lock held by the given connection.</summary>
    void Heartbeat(Guid nodeKey, string connectionId);

    /// <summary>
    /// Transfer the lock for a node from the current holder (identified by connection) to a new user.
    /// Returns false if the caller no longer holds the lock.
    /// </summary>
    bool TryTransfer(Guid nodeKey, string currentConnectionId, Guid newUserKey, string newUserName, string newConnectionId);

    /// <summary>Unconditionally make the given user the lock holder (used by Force access).</summary>
    void ForceAcquire(Guid nodeKey, Guid userKey, string userName, string connectionId);

    /// <summary>Remove and return locks whose last heartbeat is older than <paramref name="timeout"/>.</summary>
    IReadOnlyCollection<EditorLockInfo> RemoveStale(TimeSpan timeout);

    /// <summary>Associate a connection id with the user behind it (used to resolve takeover requesters).</summary>
    void RegisterConnection(string connectionId, Guid userKey, string userName);

    /// <summary>Look up the user behind a connection id.</summary>
    (Guid UserKey, string UserName)? GetConnectionUser(string connectionId);

    /// <summary>Forget a connection (on disconnect).</summary>
    void RemoveConnection(string connectionId);
}
