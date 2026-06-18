import { U as c } from "./editor-lock.context-token-Cbsy0_Pj.js";
import { UmbWorkspaceActionBase as r } from "@umbraco-cms/backoffice/workspace";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as n } from "@umbraco-cms/backoffice/document";
import { umbConfirmModal as s } from "@umbraco-cms/backoffice/modal";
class f extends r {
  async execute() {
    const t = await this.getContext(n), e = await this.getContext(c), o = t?.getUnique();
    if (!o || !e) return;
    const a = e.getHolderName(o) ?? "another editor";
    try {
      await s(this, {
        headline: "Force access",
        content: `Are you sure you want to take control from ${a}? They will be switched to read-only and may lose unsaved changes.`,
        confirmLabel: "Force access",
        cancelLabel: "Cancel",
        color: "danger"
      });
    } catch {
      return;
    }
    await e.forceAccess(o);
  }
}
export {
  f as UmbForceAccessWorkspaceAction,
  f as api,
  f as default
};
//# sourceMappingURL=force-access.action-If0V-HE5.js.map
