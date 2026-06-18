import { UMB_WORKSPACE_CONDITION_ALIAS } from '@umbraco-cms/backoffice/workspace';

export const manifests: Array<UmbExtensionManifest> = [
	{
		type: 'workspaceContext',
		alias: 'Knowit.Umbraco.EditorLock.WorkspaceContext',
		name: 'Content Node Editor Lock Workspace Context',
		api: () => import('./editor-lock.workspace-context.js'),
		conditions: [{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: 'Umb.Workspace.Document' }],
	},
	{
		type: 'workspaceAction',
		kind: 'default',
		alias: 'Knowit.Umbraco.EditorLock.WorkspaceAction.RequestAccess',
		name: 'Request Access Workspace Action',
		api: () => import('./request-access.action.js'),
		weight: 10,
		meta: {
			label: 'Request access',
			look: 'primary',
			color: 'danger',
		},
		conditions: [
			{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: 'Umb.Workspace.Document' },
			{ alias: 'Knowit.Umbraco.EditorLock.Condition.IsLocked' },
		],
	},
	{
		type: 'workspaceAction',
		kind: 'default',
		alias: 'Knowit.Umbraco.EditorLock.WorkspaceAction.ForceAccess',
		name: 'Force Access Workspace Action',
		api: () => import('./force-access.action.js'),
		weight: 5,
		meta: {
			label: 'Force access',
			look: 'outline',
			color: 'danger',
		},
		conditions: [
			{ alias: UMB_WORKSPACE_CONDITION_ALIAS, match: 'Umb.Workspace.Document' },
			{ alias: 'Knowit.Umbraco.EditorLock.Condition.IsLocked' },
		],
	},
];
