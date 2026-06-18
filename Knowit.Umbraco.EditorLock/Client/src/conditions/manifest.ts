export const manifests: Array<UmbExtensionManifest> = [
	{
		type: 'condition',
		name: 'Content Node Editor Lock Is Locked Condition',
		alias: 'Knowit.Umbraco.EditorLock.Condition.IsLocked',
		api: () => import('./is-locked.condition.js'),
	},
	{
		type: 'condition',
		name: 'Content Node Editor Lock Is Not Locked Condition',
		alias: 'Knowit.Umbraco.EditorLock.Condition.IsNotLocked',
		api: () => import('./is-not-locked.condition.js'),
	},
];
