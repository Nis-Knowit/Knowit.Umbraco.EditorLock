/** Mirrors the server's EditorLockStatus DTO (camelCase via [JsonPropertyName]). */
export interface EditorLockStatus {
	isEditor: boolean;
	holderUserKey?: string | null;
	holderName?: string | null;
}

/** Client-side tracked state for a single open node. */
export interface NodeLockState {
	nodeKey: string;
	isEditor: boolean;
	holderName?: string | null;
}
