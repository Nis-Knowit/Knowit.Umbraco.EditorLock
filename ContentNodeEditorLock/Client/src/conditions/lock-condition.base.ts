import { UMB_EDITOR_LOCK_CONTEXT } from '../context/editor-lock.context-token.js';
import type { UmbEditorLockContext } from '../context/editor-lock.context.js';
import { UmbConditionBase } from '@umbraco-cms/backoffice/extension-registry';
import type { UmbConditionConfigBase, UmbConditionControllerArguments } from '@umbraco-cms/backoffice/extension-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';

/**
 * Shared logic for the lock conditions. Tracks whether the open node is read-only because another
 * editor holds the lock, and sets `permitted` accordingly.
 *
 * @param permittedWhenLocked - true for "is locked by other" (request/force buttons), false for
 *   "is not locked by other" (the core Save/Publish actions).
 */
export abstract class UmbLockConditionBase extends UmbConditionBase<UmbConditionConfigBase> {
	#lockContext?: UmbEditorLockContext;
	#nodeKey?: string;
	#permittedWhenLocked: boolean;

	constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<UmbConditionConfigBase>, permittedWhenLocked: boolean) {
		super(host, args);
		this.#permittedWhenLocked = permittedWhenLocked;
		// Default before any lock state is known: not locked.
		this.permitted = !permittedWhenLocked;

		this.consumeContext(UMB_EDITOR_LOCK_CONTEXT, (ctx) => {
			this.#lockContext = ctx;
			this.#observeState();
		});

		this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (ctx) => {
			if (!ctx) return;
			this.observe(
				ctx.unique,
				(unique) => {
					this.#nodeKey = unique ?? undefined;
					this.#observeState();
				},
				'_lockConditionUnique',
			);
		});
	}

	#observeState() {
		if (!this.#lockContext || !this.#nodeKey) return;
		this.observe(
			this.#lockContext.stateForNode(this.#nodeKey),
			(state) => {
				const lockedByOther = !!state && state.isEditor === false;
				this.permitted = this.#permittedWhenLocked ? lockedByOther : !lockedByOther;
			},
			'_lockConditionState',
		);
	}
}
