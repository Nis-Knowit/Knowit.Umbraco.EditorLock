import { U as r } from "./editor-lock.context-token-Cbsy0_Pj.js";
import { UmbConditionBase as n } from "@umbraco-cms/backoffice/extension-registry";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT as h } from "@umbraco-cms/backoffice/document";
class u extends n {
  #t;
  #i;
  #o;
  constructor(t, i, e) {
    super(t, i), this.#o = e, this.permitted = !e, this.consumeContext(r, (o) => {
      this.#t = o, this.#e();
    }), this.consumeContext(h, (o) => {
      o && this.observe(
        o.unique,
        (s) => {
          this.#i = s ?? void 0, this.#e();
        },
        "_lockConditionUnique"
      );
    });
  }
  #e() {
    !this.#t || !this.#i || this.observe(
      this.#t.stateForNode(this.#i),
      (t) => {
        const i = !!t && t.isEditor === !1;
        this.permitted = this.#o ? i : !i;
      },
      "_lockConditionState"
    );
  }
}
export {
  u as U
};
//# sourceMappingURL=lock-condition.base-B3Uv0Zrz.js.map
