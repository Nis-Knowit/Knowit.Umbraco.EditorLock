import { READONLY_RULE_UNIQUE, READONLY_BODY_ATTRIBUTE } from '../constants.js';
import type { NodeLockState } from '../types.js';
import { UMB_EDITOR_LOCK_CONTEXT } from '../context/editor-lock.context-token.js';
import type { UmbEditorLockContext } from '../context/editor-lock.context.js';
import { UmbControllerBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';

/**
 * Attached to the document workspace. Acquires (or observes) the lock for the open node and toggles
 * the content workspace into read-only — with a red border — when another editor holds it.
 */
export class UmbEditorLockWorkspaceContext extends UmbControllerBase {
	#lockContext?: UmbEditorLockContext;
	#workspaceContext?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;
	#nodeKey?: string;
	#readOnlyApplied = false;

	constructor(host: UmbControllerHost) {
		super(host);

		this.consumeContext(UMB_EDITOR_LOCK_CONTEXT, (ctx) => {
			this.#lockContext = ctx;
			this.#start();
		});

		this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (ctx) => {
			this.#workspaceContext = ctx;
			if (!ctx) return;
			this.observe(ctx.unique, (unique) => this.#onUnique(unique ?? undefined), '_editorLockUnique');
		});
	}

	#onUnique(unique?: string) {
		if (unique === this.#nodeKey) return;

		// Switching to a different node: release the previous one first.
		if (this.#nodeKey) {
			this.#clearReadOnly();
			this.#lockContext?.release(this.#nodeKey);
		}

		this.#nodeKey = unique;
		this.#start();
	}

	async #start() {
		const nodeKey = this.#nodeKey;
		if (!nodeKey || !this.#lockContext) return;

		console.log('[EditorLock] Workspace acquiring lock for', nodeKey);
		await this.#lockContext.acquireOrObserve(nodeKey);
		this.observe(this.#lockContext.stateForNode(nodeKey), (state) => this.#applyState(state), '_editorLockState');
	}

	#applyState(state?: NodeLockState) {
		if (!state || state.nodeKey !== this.#nodeKey) return;
		console.log('[EditorLock] applyState', state);
		if (state.isEditor) {
			this.#clearReadOnly();
		} else {
			this.#applyReadOnly(state.holderName ?? 'another editor');
		}
	}

	#applyReadOnly(holderName: string) {
		if (this.#readOnlyApplied) return;
		this.#readOnlyApplied = true;
		this.#workspaceContext?.readOnlyGuard.addRule({
			unique: READONLY_RULE_UNIQUE,
			message: `This content is being edited by ${holderName}.`,
			// The read-only guard is "backwards": permitted: true means permitted to BE read-only.
			permitted: true,
		});
		document.body.toggleAttribute(READONLY_BODY_ATTRIBUTE, true);
	}

	#clearReadOnly() {
		if (!this.#readOnlyApplied) return;
		this.#readOnlyApplied = false;
		this.#workspaceContext?.readOnlyGuard.removeRule(READONLY_RULE_UNIQUE);
		document.body.toggleAttribute(READONLY_BODY_ATTRIBUTE, false);
	}

	override destroy(): void {
		this.#clearReadOnly();
		if (this.#nodeKey) this.#lockContext?.release(this.#nodeKey);
		super.destroy();
	}
}

export { UmbEditorLockWorkspaceContext as api };
export default UmbEditorLockWorkspaceContext;
