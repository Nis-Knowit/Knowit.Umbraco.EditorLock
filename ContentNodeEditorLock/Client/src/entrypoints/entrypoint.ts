import { READONLY_BODY_ATTRIBUTE } from '../constants.js';
import type { UmbEntryPointOnInit, UmbEntryPointOnUnload } from '@umbraco-cms/backoffice/extension-api';
import { umbExtensionsRegistry } from '@umbraco-cms/backoffice/extension-registry';

const STYLE_ID = 'knowit-umbraco-editor-lock-styles';

// Core document actions that should be hidden while another editor holds the lock.
const CORE_SAVE_ACTIONS = [
	'Umb.WorkspaceAction.Document.Save',
	'Umb.WorkspaceAction.Document.SaveAndPublish',
	'Umb.WorkspaceAction.Document.SaveAndPreview',
];

/**
 * Injects the global stylesheet that draws a red border around the workspace editor whenever the
 * open node is read-only because of a lock (the workspace context toggles the body attribute), and
 * appends the "is not locked" condition to the core save actions so only the lock buttons remain
 * while locked out.
 */
export const onInit: UmbEntryPointOnInit = () => {
	for (const alias of CORE_SAVE_ACTIONS) {
		umbExtensionsRegistry.appendCondition(alias, { alias: 'Knowit.Umbraco.EditorLock.Condition.IsNotLocked' });
	}

	if (document.getElementById(STYLE_ID)) return;

	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = `
		body[${READONLY_BODY_ATTRIBUTE}] umb-workspace-editor {
			outline: 3px solid var(--uui-color-danger, #d42054);
			outline-offset: -3px;
			border-radius: 3px;
		}
	`;
	document.head.appendChild(style);
};

export const onUnload: UmbEntryPointOnUnload = () => {
	document.getElementById(STYLE_ID)?.remove();
};
