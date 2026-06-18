import { UMB_WORKSPACE_CONDITION_ALIAS as o } from "@umbraco-cms/backoffice/workspace";
const t = [
  {
    name: "Content Node Editor Lock Entrypoint",
    alias: "Knowit.Umbraco.EditorLock.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-C1RGET6g.js")
  }
], i = [
  {
    type: "globalContext",
    alias: "Knowit.Umbraco.EditorLock.GlobalContext",
    name: "Content Node Editor Lock Context",
    api: () => import("./editor-lock.context-BKA4I2us.js")
  }
], e = [
  {
    type: "workspaceContext",
    alias: "Knowit.Umbraco.EditorLock.WorkspaceContext",
    name: "Content Node Editor Lock Workspace Context",
    api: () => import("./editor-lock.workspace-context-DmycZT7G.js"),
    conditions: [{ alias: o, match: "Umb.Workspace.Document" }]
  },
  {
    type: "workspaceAction",
    kind: "default",
    alias: "Knowit.Umbraco.EditorLock.WorkspaceAction.RequestAccess",
    name: "Request Access Workspace Action",
    api: () => import("./request-access.action-Dz06clsh.js"),
    weight: 10,
    meta: {
      label: "Request access",
      look: "primary",
      color: "danger"
    },
    conditions: [
      { alias: o, match: "Umb.Workspace.Document" },
      { alias: "Knowit.Umbraco.EditorLock.Condition.IsLocked" }
    ]
  },
  {
    type: "workspaceAction",
    kind: "default",
    alias: "Knowit.Umbraco.EditorLock.WorkspaceAction.ForceAccess",
    name: "Force Access Workspace Action",
    api: () => import("./force-access.action-If0V-HE5.js"),
    weight: 5,
    meta: {
      label: "Force access",
      look: "outline",
      color: "danger"
    },
    conditions: [
      { alias: o, match: "Umb.Workspace.Document" },
      { alias: "Knowit.Umbraco.EditorLock.Condition.IsLocked" }
    ]
  }
], n = [
  {
    type: "condition",
    name: "Content Node Editor Lock Is Locked Condition",
    alias: "Knowit.Umbraco.EditorLock.Condition.IsLocked",
    api: () => import("./is-locked.condition-CopC2m0E.js")
  },
  {
    type: "condition",
    name: "Content Node Editor Lock Is Not Locked Condition",
    alias: "Knowit.Umbraco.EditorLock.Condition.IsNotLocked",
    api: () => import("./is-not-locked.condition-CbsWaQnV.js")
  }
], a = [
  ...t,
  ...i,
  ...e,
  ...n
];
export {
  a as manifests
};
//# sourceMappingURL=knowit-umbraco-editor-lock.js.map
