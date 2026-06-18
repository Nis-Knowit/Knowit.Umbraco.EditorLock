import { H as n, a } from "./constants-C95kCoac.js";
import { U as c } from "./editor-lock.context-token-Cbsy0_Pj.js";
import * as o from "@umbraco-cms/backoffice/external/signalr";
import { UmbContextBase as h } from "@umbraco-cms/backoffice/class-api";
import { UmbArrayState as d } from "@umbraco-cms/backoffice/observable-api";
import { UMB_AUTH_CONTEXT as u } from "@umbraco-cms/backoffice/auth";
import { UMB_CURRENT_USER_CONTEXT as l } from "@umbraco-cms/backoffice/current-user";
import { UMB_NOTIFICATION_CONTEXT as m } from "@umbraco-cms/backoffice/notification";
import { umbConfirmModal as f } from "@umbraco-cms/backoffice/modal";
class E extends h {
  #e;
  #s;
  #o;
  #r;
  #n;
  #a;
  #c = "";
  #h = "An editor";
  #i;
  // Lock state for every node we currently have open, keyed by node key.
  #t = new d([], (t) => t.nodeKey);
  constructor(t) {
    super(t, c), this.#s = new Promise((e) => this.#o = e), this.#r = new Promise((e) => this.#n = e), this.consumeContext(l, (e) => {
      e && this.observe(e.currentUser, (s) => {
        s?.unique && (this.#c = s.unique, this.#h = s.name || s.userName || "An editor", this.#n());
      });
    }), this.consumeContext(m, (e) => {
      this.#i = e;
    }), this.consumeContext(u, (e) => {
      !e || this.#e || this.#d(e);
    }), this.#a = setInterval(() => this.#u(), n);
  }
  #d(t) {
    this.#e = new o.HubConnectionBuilder().withUrl(a, {
      accessTokenFactory: async () => await t.getLatestToken() ?? ""
    }).withAutomaticReconnect().build(), this.#e.on("LockChanged", (e) => this.#l(e)), this.#e.on(
      "AccessRequested",
      (e, s, i) => this.#m(e, s, i)
    ), this.#e.on("AccessDenied", (e) => this.#f(e)), this.#e.start().then(() => {
      console.log("[EditorLock] Hub connected"), this.#o();
    }).catch((e) => console.error("[EditorLock] Failed to start hub connection", e));
  }
  /** Observe the lock state for a single node. */
  stateForNode(t) {
    return this.#t.asObservablePart((e) => e.find((s) => s.nodeKey === t));
  }
  /** The display name of the current holder of a node, if it is locked by someone else. */
  getHolderName(t) {
    return this.#t.getValue().find((e) => e.nodeKey === t)?.holderName ?? void 0;
  }
  /** Try to take the lock for a node, or observe it read-only if held by someone else. */
  async acquireOrObserve(t) {
    if (await this.#s, await this.#r, !this.#e) return;
    const e = await this.#e.invoke(
      "AcquireOrObserve",
      t,
      this.#c,
      this.#h
    );
    console.log("[EditorLock] acquireOrObserve", t, "->", e);
    const s = { nodeKey: t, isEditor: e.isEditor, holderName: e.holderName };
    return this.#t.appendOne(s), s;
  }
  /** Release the lock for a node and stop tracking it. */
  async release(t) {
    if (this.#t.removeOne(t), this.#e?.state === o.HubConnectionState.Connected)
      try {
        await this.#e.invoke("ReleaseLock", t);
      } catch (e) {
        console.warn("[EditorLock] Release failed", e);
      }
  }
  /** Ask the current holder of a node to hand over editing access. */
  async requestAccess(t) {
    await this.#s, this.#e && (await this.#e.invoke("RequestAccess", t), this.#i?.peek("positive", {
      data: {
        headline: "Access requested",
        message: "Your request has been sent to the current editor."
      }
    }));
  }
  /** Forcibly take over the lock for a node without waiting for the holder's consent. */
  async forceAccess(t) {
    await this.#s, this.#e && await this.#e.invoke("ForceAccess", t);
  }
  #u() {
    if (this.#e?.state === o.HubConnectionState.Connected)
      for (const t of this.#t.getValue())
        t.isEditor && this.#e.send("Heartbeat", t.nodeKey).catch(() => {
        });
  }
  async #l(t) {
    this.#t.getValue().some((e) => e.nodeKey === t) && (console.log("[EditorLock] LockChanged received for", t), await this.acquireOrObserve(t));
  }
  async #m(t, e, s) {
    console.log("[EditorLock] AccessRequested from", e, "for", t);
    let i = !1;
    try {
      await f(this, {
        headline: "Access requested",
        content: `${e} is requesting access to take over editing this content. Will you accept?`,
        confirmLabel: "Accept",
        cancelLabel: "Decline",
        color: "positive"
      }), i = !0;
    } catch {
      i = !1;
    }
    try {
      await this.#e?.invoke("RespondToRequest", t, s, i);
    } catch (r) {
      console.error("[EditorLock] RespondToRequest failed", r);
    }
  }
  #f(t) {
    this.#i?.peek("warning", {
      data: {
        headline: "Request declined",
        message: "The current editor declined your request for access."
      }
    });
  }
  destroy() {
    clearInterval(this.#a), this.#e?.stop().catch(() => {
    }), super.destroy();
  }
}
export {
  E as UmbEditorLockContext,
  E as api,
  E as default
};
//# sourceMappingURL=editor-lock.context-BKA4I2us.js.map
