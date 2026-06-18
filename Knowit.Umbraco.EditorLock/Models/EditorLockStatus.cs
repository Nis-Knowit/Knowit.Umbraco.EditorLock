using System.Text.Json.Serialization;

namespace Knowit.Umbraco.EditorLock.Models;

/// <summary>
/// The result of attempting to acquire (or observe) the lock for a node, returned to the
/// calling backoffice client. Property names are forced to camelCase so the JSON matches the
/// TypeScript client without changing SignalR's global serializer (which Umbraco also uses).
/// </summary>
public sealed class EditorLockStatus
{
    /// <summary>True if the caller holds the lock and may edit; false if read-only.</summary>
    [JsonPropertyName("isEditor")]
    public required bool IsEditor { get; init; }

    /// <summary>The key of the user currently holding the lock (set when <see cref="IsEditor"/> is false).</summary>
    [JsonPropertyName("holderUserKey")]
    public Guid? HolderUserKey { get; init; }

    /// <summary>The display name of the user currently holding the lock.</summary>
    [JsonPropertyName("holderName")]
    public string? HolderName { get; init; }
}
