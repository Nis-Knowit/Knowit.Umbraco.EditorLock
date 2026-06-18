using System.Collections.Concurrent;
using Knowit.Umbraco.EditorLock.Models;

namespace Knowit.Umbraco.EditorLock.Services;

/// <inheritdoc />
public sealed class EditorLockService : IEditorLockService
{
    // Keyed by node key.
    private readonly ConcurrentDictionary<Guid, EditorLockInfo> _locks = new();

    // Connection id -> the user behind it. Lets us resolve a takeover requester by their connection.
    private readonly ConcurrentDictionary<string, (Guid UserKey, string UserName)> _connections = new();

    // Guards the small read-modify-write sequences below so two clients can't both win a free node.
    private readonly object _gate = new();

    public EditorLockStatus AcquireOrObserve(Guid nodeKey, Guid userKey, string userName, string connectionId)
    {
        lock (_gate)
        {
            if (_locks.TryGetValue(nodeKey, out EditorLockInfo? existing))
            {
                if (existing.UserKey == userKey)
                {
                    // Same user (re-open, second tab, or reconnect) keeps the lock.
                    existing.ConnectionId = connectionId;
                    existing.UserName = userName;
                    existing.LastHeartbeatUtc = DateTime.UtcNow;
                    return new EditorLockStatus { IsEditor = true };
                }

                // Held by someone else -> the caller observes read-only.
                return new EditorLockStatus
                {
                    IsEditor = false,
                    HolderUserKey = existing.UserKey,
                    HolderName = existing.UserName,
                };
            }

            _locks[nodeKey] = new EditorLockInfo
            {
                NodeKey = nodeKey,
                UserKey = userKey,
                UserName = userName,
                ConnectionId = connectionId,
                LastHeartbeatUtc = DateTime.UtcNow,
            };

            return new EditorLockStatus { IsEditor = true };
        }
    }

    public EditorLockInfo? Get(Guid nodeKey) => _locks.TryGetValue(nodeKey, out EditorLockInfo? l) ? l : null;

    public bool Release(Guid nodeKey, string connectionId)
    {
        lock (_gate)
        {
            if (_locks.TryGetValue(nodeKey, out EditorLockInfo? existing) && existing.ConnectionId == connectionId)
            {
                _locks.TryRemove(nodeKey, out _);
                return true;
            }

            return false;
        }
    }

    public IReadOnlyCollection<EditorLockInfo> ReleaseAllForConnection(string connectionId)
    {
        lock (_gate)
        {
            List<EditorLockInfo> removed = _locks.Values.Where(l => l.ConnectionId == connectionId).ToList();
            foreach (EditorLockInfo l in removed)
            {
                _locks.TryRemove(l.NodeKey, out _);
            }

            return removed;
        }
    }

    public void Heartbeat(Guid nodeKey, string connectionId)
    {
        if (_locks.TryGetValue(nodeKey, out EditorLockInfo? existing) && existing.ConnectionId == connectionId)
        {
            existing.LastHeartbeatUtc = DateTime.UtcNow;
        }
    }

    public bool TryTransfer(Guid nodeKey, string currentConnectionId, Guid newUserKey, string newUserName, string newConnectionId)
    {
        lock (_gate)
        {
            if (!_locks.TryGetValue(nodeKey, out EditorLockInfo? existing) || existing.ConnectionId != currentConnectionId)
            {
                return false;
            }

            existing.UserKey = newUserKey;
            existing.UserName = newUserName;
            existing.ConnectionId = newConnectionId;
            existing.LastHeartbeatUtc = DateTime.UtcNow;
            return true;
        }
    }

    public void ForceAcquire(Guid nodeKey, Guid userKey, string userName, string connectionId)
    {
        lock (_gate)
        {
            _locks[nodeKey] = new EditorLockInfo
            {
                NodeKey = nodeKey,
                UserKey = userKey,
                UserName = userName,
                ConnectionId = connectionId,
                LastHeartbeatUtc = DateTime.UtcNow,
            };
        }
    }

    public IReadOnlyCollection<EditorLockInfo> RemoveStale(TimeSpan timeout)
    {
        lock (_gate)
        {
            DateTime cutoff = DateTime.UtcNow - timeout;
            List<EditorLockInfo> stale = _locks.Values.Where(l => l.LastHeartbeatUtc < cutoff).ToList();
            foreach (EditorLockInfo l in stale)
            {
                _locks.TryRemove(l.NodeKey, out _);
            }

            return stale;
        }
    }

    public void RegisterConnection(string connectionId, Guid userKey, string userName)
        => _connections[connectionId] = (userKey, userName);

    public (Guid UserKey, string UserName)? GetConnectionUser(string connectionId)
        => _connections.TryGetValue(connectionId, out (Guid UserKey, string UserName) user) ? user : null;

    public void RemoveConnection(string connectionId) => _connections.TryRemove(connectionId, out _);
}
