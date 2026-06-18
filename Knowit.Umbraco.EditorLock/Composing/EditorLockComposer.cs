using System.Linq;
using Knowit.Umbraco.EditorLock.Hubs;
using Knowit.Umbraco.EditorLock.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.DependencyInjection;
using Umbraco.Cms.Core.Composing;
using Umbraco.Cms.Core.DependencyInjection;
using Umbraco.Cms.Web.Common.ApplicationBuilder;

namespace Knowit.Umbraco.EditorLock.Composing;

/// <summary>
/// Registers the lock service, SignalR, the background cleanup service, and maps the hub endpoint.
/// </summary>
public sealed class EditorLockComposer : IComposer
{
    public void Compose(IUmbracoBuilder builder)
    {
        builder.Services.AddSingleton<IEditorLockService, EditorLockService>();

        // Add SignalR only once (Umbraco may already have added it for its own server events).
        if (!builder.Services.Any(x => x.ServiceType == typeof(IHubContext<>)))
        {
            builder.Services.AddSignalR();
        }

        // Surface server-side hub exceptions to the client to aid debugging. Consider disabling
        // (or gating on the hosting environment) for production.
        builder.Services.PostConfigure<HubOptions>(options => options.EnableDetailedErrors = true);

        builder.Services.AddHostedService<EditorLockCleanupService>();

        builder.Services.Configure<UmbracoPipelineOptions>(options =>
        {
            options.AddFilter(new UmbracoPipelineFilter(
                "Knowit.Umbraco.EditorLock",
                endpoints: app => app.UseEndpoints(e => e.MapHub<EditorLockHub>(Constants.HubRoute))));
        });
    }
}
