import { UMB_EDITOR_LOCK_CONTEXT } from '../context/editor-lock.context-token.js';
import { UmbWorkspaceActionBase } from '@umbraco-cms/backoffice/workspace';
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from '@umbraco-cms/backoffice/document';

/**
 * Footer button (next to Save/Publish) shown to the blocked second editor. Asks the current
 * holder to hand over editing access.
 */
export class UmbRequestAccessWorkspaceAction extends UmbWorkspaceActionBase {
	override async execute(): Promise<void> {
		const workspaceContext = await this.getContext(UMB_DOCUMENT_WORKSPACE_CONTEXT);
		const lockContext = await this.getContext(UMB_EDITOR_LOCK_CONTEXT);
		const nodeKey = workspaceContext?.getUnique();
		if (!nodeKey || !lockContext) return;

		await lockContext.requestAccess(nodeKey);
	}
}

export { UmbRequestAccessWorkspaceAction as api };
export default UmbRequestAccessWorkspaceAction;
