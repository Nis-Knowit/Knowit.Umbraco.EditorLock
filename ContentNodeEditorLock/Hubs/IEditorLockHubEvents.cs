namespace Knowit.Umbraco.EditorLock.Hubs;

/// <summary>
/// Strongly-typed server-to-client messages pushed by <see cref="EditorLockHub"/>.
/// </summary>
public interface IEditorLockHubEvents
{
    /// <summary>
    /// The lock for a node changed (released, transferred or expired). Clients observing the
    /// node should re-evaluate by calling <c>AcquireOrObserve</c> again.
    /// </summary>
    Task LockChanged(Guid nodeKey);

    /// <summary>Sent to the current lock holder when another user requests access / a takeover.</summary>
    Task AccessRequested(Guid nodeKey, string requesterName, string requesterConnectionId);

    /// <summary>Sent to a requester when the holder declines their access request.</summary>
    Task AccessDenied(Guid nodeKey);
}
