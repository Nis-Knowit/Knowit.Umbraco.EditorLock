using Knowit.Umbraco.EditorLock.Hubs;
using Knowit.Umbraco.EditorLock.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Hosting;

namespace Knowit.Umbraco.EditorLock.Services;

/// <summary>
/// Periodically releases locks whose holder has gone silent (no heartbeat within
/// <see cref="Constants.LockTimeout"/>) and notifies observers so they can take over. This is the
/// safety net for ungraceful losses that never raised the hub's OnDisconnected.
/// </summary>
public sealed class EditorLockCleanupService : BackgroundService
{
    private readonly IEditorLockService _lockService;
    private readonly IHubContext<EditorLockHub, IEditorLockHubEvents> _hub;

    public EditorLockCleanupService(IEditorLockService lockService, IHubContext<EditorLockHub, IEditorLockHubEvents> hub)
    {
        _lockService = lockService;
        _hub = hub;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Constants.CleanupInterval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            IReadOnlyCollection<EditorLockInfo> stale = _lockService.RemoveStale(Constants.LockTimeout);
            foreach (EditorLockInfo l in stale)
            {
                await _hub.Clients.Group(Constants.GroupName(l.NodeKey)).LockChanged(l.NodeKey);
            }
        }
    }
}
