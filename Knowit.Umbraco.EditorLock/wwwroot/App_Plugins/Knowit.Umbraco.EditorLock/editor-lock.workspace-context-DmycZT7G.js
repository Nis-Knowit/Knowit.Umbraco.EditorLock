import { b as i, R as s } from "./constants-C95kCoac.js";
import { U as r } from "./editor-lock.context-token-Cbsy0_Pj.js";
import { UmbControllerBase as n } from "@umbraco-cms/backoffice/class-api";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as a } from "@umbraco-cms/backoffice/document";
class p extends n {
  #t;
  #s;
  #e;
  #i = !1;
  constructor(e) {
    super(e), this.consumeContext(r, (t) => {
      this.#t = t, this.#r();
    }), this.consumeContext(a, (t) => {
      this.#s = t, t && this.observe(t.unique, (o) => this.#n(o ?? void 0), "_editorLockUnique");
    });
  }
  #n(e) {
    e !== this.#e && (this.#e && (this.#o(), this.#t?.release(this.#e)), this.#e = e, this.#r());
  }
  async #r() {
    const e = this.#e;
    !e || !this.#t || (console.log("[EditorLock] Workspace acquiring lock for", e), await this.#t.acquireOrObserve(e), this.observe(this.#t.stateForNode(e), (t) => this.#a(t), "_editorLockState"));
  }
  #a(e) {
    !e || e.nodeKey !== this.#e || (console.log("[EditorLock] applyState", e), e.isEditor ? this.#o() : this.#h(e.holderName ?? "another editor"));
  }
  #h(e) {
    this.#i || (this.#i = !0, this.#s?.readOnlyGuard.addRule({
      unique: i,
      message: `This content is being edited by ${e}.`,
      // The read-only guard is "backwards": permitted: true means permitted to BE read-only.
      permitted: !0
    }), document.body.toggleAttribute(s, !0));
  }
  #o() {
    this.#i && (this.#i = !1, this.#s?.readOnlyGuard.removeRule(i), document.body.toggleAttribute(s, !1));
  }
  destroy() {
    this.#o(), this.#e && this.#t?.release(this.#e), super.destroy();
  }
}
export {
  p as UmbEditorLockWorkspaceContext,
  p as api,
  p as default
};
//# sourceMappingURL=editor-lock.workspace-context-DmycZT7G.js.map
