import { U as o } from "./editor-lock.context-token-Cbsy0_Pj.js";
import { UmbWorkspaceActionBase as a } from "@umbraco-cms/backoffice/workspace";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as c } from "@umbraco-cms/backoffice/document";
class m extends a {
  async execute() {
    const s = await this.getContext(c), t = await this.getContext(o), e = s?.getUnique();
    !e || !t || await t.requestAccess(e);
  }
}
export {
  m as UmbRequestAccessWorkspaceAction,
  m as api,
  m as default
};
//# sourceMappingURL=request-access.action-Dz06clsh.js.map
