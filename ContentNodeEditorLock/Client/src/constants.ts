// Must match Constants.HubRoute on the server.
export const HUB_URL = '/umbraco/knowitEditorLockHub';

// Identifier for the read-only guard rule we add/remove on the content workspace.
export const READONLY_RULE_UNIQUE = 'Knowit.Umbraco.EditorLock.ReadOnly';

// Body attribute toggled while the open node is read-only because of a lock — drives the red border CSS.
export const READONLY_BODY_ATTRIBUTE = 'knowit-editor-lock-readonly';

// How often we tell the server we are still editing the nodes we hold.
export const HEARTBEAT_INTERVAL_MS = 20_000;
