import { manifests as entrypoints } from './entrypoints/manifest.js';
import { manifests as context } from './context/manifest.js';
import { manifests as workspace } from './workspace/manifest.js';
import { manifests as conditions } from './conditions/manifest.js';

// Collates every manifest in the package; loaded from umbraco-package.json as a bundle.
export const manifests: Array<UmbExtensionManifest> = [
	...entrypoints,
	...context,
	...workspace,
	...conditions,
];
