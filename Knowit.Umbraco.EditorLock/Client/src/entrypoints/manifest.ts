export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Content Node Editor Lock Entrypoint",
    alias: "Knowit.Umbraco.EditorLock.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
