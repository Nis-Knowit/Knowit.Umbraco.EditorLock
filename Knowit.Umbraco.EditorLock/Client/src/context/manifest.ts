export const manifests: Array<UmbExtensionManifest> = [
	{
		type: 'globalContext',
		alias: 'Knowit.Umbraco.EditorLock.GlobalContext',
		name: 'Content Node Editor Lock Context',
		api: () => import('./editor-lock.context.js'),
	},
];
