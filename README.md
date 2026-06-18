# Content Node Editor Lock

An Umbraco 17 package that prevents two editors from changing the same content node at the same
time (a pessimistic "editor lock").

> ⚠️ This package was generated with AI assistance (Claude). Review before using in production.

## What it does

- When editor **A** opens a document, they acquire an editing lock on that node.
- When editor **B** opens the **same** document, their editor becomes **read-only** with a **red
  border**, and a **"Request access"** button appears in the workspace footer next to Save/Publish.
- Pressing **Request access** prompts editor A in real time: *"User B is requesting access to take
  over editing this content. Will you accept?"*
- If A **accepts**, the lock transfers — B becomes the editor and A goes read-only. If A **declines**,
  B is notified.
- Alternatively B can **Force access** — after a confirmation naming the current editor, B takes over
  immediately and A is pushed to read-only.
- While locked out, B's Save / Save and publish / Save and preview buttons are hidden; only the
  **Request access** and **Force access** buttons show.
- If A simply leaves (closes the tab/browser, or goes idle past the timeout), the lock is released
  automatically so B can take over — nodes never get permanently stuck.

Scope: **documents/content** only.

## How it works

Everything runs over a single SignalR hub.

### Backend (`ContentNodeEditorLock`, a Razor Class Library)

| File | Role |
| --- | --- |
| `Hubs/EditorLockHub.cs` | SignalR hub carrying the whole protocol. Mapped at `/umbraco/contentNodeEditorLockHub` and secured with `[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]`. |
| `Services/EditorLockService.cs` | In-memory, thread-safe store of active locks (singleton). |
| `Services/EditorLockCleanupService.cs` | Background service that releases stale locks (no heartbeat within `LockTimeout`). |
| `Composing/EditorLockComposer.cs` | Registers SignalR, the services, and maps the hub endpoint. |
| `Constants.cs` | Hub route, lock timeout (60s), cleanup interval (20s). |

Lock storage is **in-memory**: locks are lost on app restart and are **not** shared across
load-balanced servers. To support those scenarios, provide a database-backed implementation of
`IEditorLockService` (it is a clean drop-in seam).

### Frontend (`ContentNodeEditorLock/Client`, TS + Lit, built with Vite)

| File | Role |
| --- | --- |
| `context/editor-lock.context.ts` | App-scoped `globalContext` owning the SignalR connection, per-node lock state, heartbeats, and the takeover confirm dialog. |
| `workspace/editor-lock.workspace-context.ts` | Attached to the document workspace; acquires/observes the lock and toggles read-only via `readOnlyGuard` + the red-border body attribute. |
| `workspace/request-access.action.ts` | The "Request access" footer button. |
| `conditions/is-locked.condition.ts` | Shows that button only when the node is read-only due to another editor's lock. |
| `entrypoints/entrypoint.ts` | Injects the red-border stylesheet. |

SignalR is imported from `@umbraco-cms/backoffice/external/signalr` (Umbraco's shared copy), so it is
not bundled.

> Note: making the whole node read-only uses the content workspace's `readOnlyGuard`, which is
> deprecated in v17 (slated for future removal). Adding a rule with `permitted: true` means
> *"permitted to be read-only"* — the guard's semantics are intentionally inverted.

## Building

```sh
# Frontend
cd ContentNodeEditorLock/Client
npm install
npm run build        # outputs to ../wwwroot/App_Plugins/ContentNodeEditorLock

# Backend / solution
cd ../..
dotnet build
```

## Running the test host

```sh
dotnet run --project ContentNodeEditorLock.Web
```

The host is configured for an **unattended SQLite install** (see `appsettings.json`):

- URL: <https://localhost:44398>
- User: `admin@example.com` / `SuperSecret123!`

> These are throwaway local development credentials — change or remove them before any real use.

## Manual verification (two users)

The lock is keyed per backoffice user, so two **different** users are required (two tabs of the same
user both count as that one user and stay editable).

1. Log in as the admin, create a Document Type with a couple of properties, and create a content node.
2. Create a **second** backoffice user with content access.
3. **User A** (browser 1): open the content node — fully editable.
4. **User B** (browser 2, e.g. incognito): open the **same** node — fields are read-only, a **red
   border** surrounds the editor, and a **"Request access"** button shows in the footer.
5. B clicks **Request access** → A sees the *"User B is requesting access…"* prompt.
6. A clicks **Accept** → B's editor becomes editable; A goes read-only with the red border.
   (A **Decline** → B sees an "access denied" notice.)
7. **Auto-grant:** with B blocked, close A's browser → within ~60s (or instantly on disconnect) B's
   lock frees and B can edit.
