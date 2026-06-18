import { R as n } from "./constants-C95kCoac.js";
import { umbExtensionsRegistry as i } from "@umbraco-cms/backoffice/extension-registry";
const e = "knowit-umbraco-editor-lock-styles", c = [
  "Umb.WorkspaceAction.Document.Save",
  "Umb.WorkspaceAction.Document.SaveAndPublish",
  "Umb.WorkspaceAction.Document.SaveAndPreview"
], s = () => {
  for (const t of c)
    i.appendCondition(t, { alias: "Knowit.Umbraco.EditorLock.Condition.IsNotLocked" });
  if (document.getElementById(e)) return;
  const o = document.createElement("style");
  o.id = e, o.textContent = `
		body[${n}] umb-workspace-editor {
			outline: 3px solid var(--uui-color-danger, #d42054);
			outline-offset: -3px;
			border-radius: 3px;
		}
	`, document.head.appendChild(o);
}, a = () => {
  document.getElementById(e)?.remove();
};
export {
  s as onInit,
  a as onUnload
};
//# sourceMappingURL=entrypoint-C1RGET6g.js.map
