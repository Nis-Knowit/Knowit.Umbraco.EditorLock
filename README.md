# Knowit.Umbraco.EditorLock

An Umbraco 17 package that prevents two editors from changing the same content node at the same
time (a pessimistic "editor lock").

> ⚠️ This package was built with AI assistance (Claude). Review before using in production.

## What it does

- When editor **A** opens a document, they acquire an editing lock on that node.
- When editor **B** opens the **same** document, their editor becomes **read-only** with a **red
  border**, and the Save buttons are replaced by **Request access** and **Force access**.
- **Request access** prompts editor A in real time: *"User B is requesting access… Accept / Decline."*
  On accept the lock transfers (B edits, A goes read-only).
- **Force access** takes over immediately — after a confirmation naming the current editor — and
  pushes A to read-only.
- If A simply leaves (closes the tab/browser, or goes idle past the timeout), the lock is released
  automatically so B can take over — nodes never get permanently stuck.

Scope: **documents/content** only.

## How it works

Everything runs over a single SignalR hub.

### Backend (`Knowit.Umbraco.EditorLock`, a Razor Class Library)

| File | Role |
| --- | --- |
| `Hubs/EditorLockHub.cs` | SignalR hub carrying the whole protocol. Mapped at `/umbraco/knowitEditorLockHub` and secured with `[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]`. |
| `Services/EditorLockService.cs` | In-memory, thread-safe store of active locks (singleton). |
| `Services/EditorLockCleanupService.cs` | Background service that releases stale locks (no heartbeat within `LockTimeout`). |
| `Composing/EditorLockComposer.cs` | Registers SignalR, the services, and maps the hub endpoint. |
| `Constants.cs` | Hub route, lock timeout (60s), cleanup interval (20s). |

Lock storage is **in-memory**: locks are lost on app restart and are **not** shared across
load-balanced servers. To support those scenarios, provide a database-backed implementation of
`IEditorLockService` (it is a clean drop-in seam).

### Frontend (`Knowit.Umbraco.EditorLock/Client`, TS + Lit, built with Vite)

| File | Role |
| --- | --- |
| `context/editor-lock.context.ts` | App-scoped `globalContext` owning the SignalR connection, per-node lock state, heartbeats, and the takeover confirm dialog. |
| `workspace/editor-lock.workspace-context.ts` | Attached to the document workspace; acquires/observes the lock and toggles read-only via `readOnlyGuard` + the red-border body attribute. |
| `workspace/request-access.action.ts` / `force-access.action.ts` | The footer buttons. |
| `conditions/` | `is-locked` shows the lock buttons; `is-not-locked` is appended to the core Save actions so they hide while locked out. |
| `entrypoints/entrypoint.ts` | Injects the red-border stylesheet and the not-locked condition. |

SignalR is imported from `@umbraco-cms/backoffice/external/signalr` (Umbraco's shared copy), so it is
not bundled.

> Note: making the whole node read-only uses the content workspace's `readOnlyGuard`, which is
> deprecated in v17 (slated for future removal). Adding a rule with `permitted: true` means
> *"permitted to be read-only"* — the guard's semantics are intentionally inverted.

## Building

```sh
# Frontend
cd Knowit.Umbraco.EditorLock/Client
npm install
npm run build        # outputs to ../wwwroot/App_Plugins/Knowit.Umbraco.EditorLock

# Backend / solution
cd ../..
dotnet build
```

`dotnet pack -c Release` rebuilds the client automatically. From a pristine checkout (no `wwwroot`
yet), run `npm run build` once first — the Razor SDK globs `wwwroot` at evaluation time.

## Running the test host

```sh
dotnet run --project ContentNodeEditorLock.Web
```

On first run, complete the Umbraco install wizard (choose **SQLite**) and create your admin user.
The host listens on <https://localhost:44398>.

## Manual verification (two users)

The lock is keyed per backoffice user, so two **different** users are required (two tabs of the same
user both count as that one user and stay editable).

1. Log in, create a Document Type with a couple of properties, and create a content node.
2. Create a **second** backoffice user with content access.
3. **User A** (browser 1): open the content node — fully editable.
4. **User B** (browser 2, e.g. incognito): open the **same** node — read-only, **red border**, and
   **Request access** / **Force access** in the footer.
5. B clicks **Request access** → A sees the prompt → **Accept** transfers the lock.
6. B clicks **Force access** → confirms → takes over immediately.
7. **Auto-grant:** with B blocked, close A's browser → within ~60s (or instantly on disconnect) B's
   lock frees.

## Releasing

CI builds every push/PR. Publishing to NuGet is automated via NuGet **Trusted Publishing** — publish
a GitHub Release tagged `vX.Y.Z` and the `Release` workflow packs and pushes (see
`.github/workflows/release.yml`). Requires the `NUGET_USER` repo secret and a Trusted Publishing
policy on nuget.org.

## License

MIT.
