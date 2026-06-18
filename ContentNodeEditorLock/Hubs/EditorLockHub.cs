using System.Security.Claims;
using Knowit.Umbraco.EditorLock.Models;
using Knowit.Umbraco.EditorLock.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Web.Common.Authorization;

namespace Knowit.Umbraco.EditorLock.Hubs;

/// <summary>
/// SignalR hub carrying the entire editor-lock protocol. Mapped under <c>/umbraco/</c> and
/// guarded by the backoffice access policy, so only authenticated backoffice users connect and
/// <see cref="HubCallerContext.User"/> carries their identity.
/// </summary>
[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
public sealed class EditorLockHub : Hub<IEditorLockHubEvents>
{
    private readonly IEditorLockService _lockService;

    public EditorLockHub(IEditorLockService lockService) => _lockService = lockService;

    private Guid GetUserKey()
    {
        string? sub = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? Context.User?.FindFirst("sub")?.Value;
        return Guid.TryParse(sub, out Guid key) ? key : Guid.Empty;
    }

    private string GetUserName(string? clientSuppliedName = null)
    {
        if (!string.IsNullOrWhiteSpace(clientSuppliedName))
        {
            return clientSuppliedName;
        }

        return Context.User?.Identity?.Name is { Length: > 0 } name ? name : "An editor";
    }

    public override async Task OnConnectedAsync()
    {
        _lockService.RegisterConnection(Context.ConnectionId, GetUserKey(), GetUserName());
        await base.OnConnectedAsync();
    }

    /// <summary>
    /// Try to take the lock for a node, or observe it read-only if someone else holds it.
    /// The user key and display name are supplied by the client (the backoffice knows both); we
    /// fall back to the token claims only if the client could not provide a key.
    /// </summary>
    public async Task<EditorLockStatus> AcquireOrObserve(Guid nodeKey, Guid userKey, string displayName)
    {
        if (userKey == Guid.Empty)
        {
            userKey = GetUserKey();
        }

        string userName = GetUserName(displayName);
        _lockService.RegisterConnection(Context.ConnectionId, userKey, userName);

        await Groups.AddToGroupAsync(Context.ConnectionId, Constants.GroupName(nodeKey));
        return _lockService.AcquireOrObserve(nodeKey, userKey, userName, Context.ConnectionId);
    }

    /// <summary>Release the lock the caller holds on a node and stop observing it.</summary>
    public async Task ReleaseLock(Guid nodeKey)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, Constants.GroupName(nodeKey));
        if (_lockService.Release(nodeKey, Context.ConnectionId))
        {
            await Clients.Group(Constants.GroupName(nodeKey)).LockChanged(nodeKey);
        }
    }

    /// <summary>Ask the current holder of a node to hand over editing access.</summary>
    public async Task RequestAccess(Guid nodeKey)
    {
        EditorLockInfo? holder = _lockService.Get(nodeKey);
        if (holder is null || holder.ConnectionId == Context.ConnectionId)
        {
            return;
        }

        string requesterName = _lockService.GetConnectionUser(Context.ConnectionId)?.UserName ?? GetUserName();
        await Clients.Client(holder.ConnectionId).AccessRequested(nodeKey, requesterName, Context.ConnectionId);
    }

    /// <summary>The holder accepts or declines a pending takeover request. On accept, the lock transfers.</summary>
    public async Task RespondToRequest(Guid nodeKey, string requesterConnectionId, bool accepted)
    {
        EditorLockInfo? holder = _lockService.Get(nodeKey);
        if (holder is null || holder.ConnectionId != Context.ConnectionId)
        {
            return; // only the current holder may respond
        }

        if (!accepted)
        {
            await Clients.Client(requesterConnectionId).AccessDenied(nodeKey);
            return;
        }

        (Guid UserKey, string UserName)? requester = _lockService.GetConnectionUser(requesterConnectionId);
        if (requester is null)
        {
            await Clients.Client(requesterConnectionId).AccessDenied(nodeKey);
            return;
        }

        if (_lockService.TryTransfer(nodeKey, Context.ConnectionId, requester.Value.UserKey, requester.Value.UserName, requesterConnectionId))
        {
            // Both the old holder and the requester are in the group; they each re-evaluate.
            await Clients.Group(Constants.GroupName(nodeKey)).LockChanged(nodeKey);
        }
    }

    /// <summary>Forcibly take over the lock without the current holder's consent.</summary>
    public async Task ForceAccess(Guid nodeKey)
    {
        (Guid UserKey, string UserName)? requester = _lockService.GetConnectionUser(Context.ConnectionId);
        if (requester is null)
        {
            return;
        }

        _lockService.ForceAcquire(nodeKey, requester.Value.UserKey, requester.Value.UserName, Context.ConnectionId);
        await Clients.Group(Constants.GroupName(nodeKey)).LockChanged(nodeKey);
    }

    /// <summary>Keep the caller's lock alive.</summary>
    public void Heartbeat(Guid nodeKey) => _lockService.Heartbeat(nodeKey, Context.ConnectionId);

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        IReadOnlyCollection<EditorLockInfo> released = _lockService.ReleaseAllForConnection(Context.ConnectionId);
        foreach (EditorLockInfo l in released)
        {
            await Clients.Group(Constants.GroupName(l.NodeKey)).LockChanged(l.NodeKey);
        }

        _lockService.RemoveConnection(Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}
