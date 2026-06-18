import { UMB_EDITOR_LOCK_CONTEXT } from '../context/editor-lock.context-token.js';
import { UmbWorkspaceActionBase } from '@umbraco-cms/backoffice/workspace';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';

/**
 * Footer button that takes over editing immediately, without waiting for the current holder to
 * accept. The previous holder is pushed to read-only. Asks for confirmation first.
 */
export class UmbForceAccessWorkspaceAction extends UmbWorkspaceActionBase {
	override async execute(): Promise<void> {
		const workspaceContext = await this.getContext(UMB_DOCUMENT_WORKSPACE_CONTEXT);
		const lockContext = await this.getContext(UMB_EDITOR_LOCK_CONTEXT);
		const nodeKey = workspaceContext?.getUnique();
		if (!nodeKey || !lockContext) return;

		const holderName = lockContext.getHolderName(nodeKey) ?? 'another editor';

		try {
			await umbConfirmModal(this, {
				headline: 'Force access',
				content: `Are you sure you want to take control from ${holderName}? They will be switched to read-only and may lose unsaved changes.`,
				confirmLabel: 'Force access',
				cancelLabel: 'Cancel',
				color: 'danger',
			});
		} catch {
			return; // cancelled
		}

		await lockContext.forceAccess(nodeKey);
	}
}

export { UmbForceAccessWorkspaceAction as api };
export default UmbForceAccessWorkspaceAction;
