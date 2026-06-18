import { HUB_URL, HEARTBEAT_INTERVAL_MS } from '../constants.js';
import type { EditorLockStatus, NodeLockState } from '../types.js';
import { UMB_EDITOR_LOCK_CONTEXT } from './editor-lock.context-token.js';
import * as signalR from '@umbraco-cms/backoffice/external/signalr';
import { UmbContextBase } from '@umbraco-cms/backoffice/class-api';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbArrayState } from '@umbraco-cms/backoffice/observable-api';
import { UMB_AUTH_CONTEXT } from '@umbraco-cms/backoffice/auth';
import { UMB_CURRENT_USER_CONTEXT } from '@umbraco-cms/backoffice/current-user';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';
import { umbConfirmModal } from '@umbraco-cms/backoffice/modal';

/**
 * App-scoped context that owns the single SignalR connection and the per-node lock state.
 * Workspace contexts and conditions consume it to react to lock changes.
 */
export class UmbEditorLockContext extends UmbContextBase {
	#connection?: signalR.HubConnection;
	#ready: Promise<void>;
	#resolveReady!: () => void;
	#userReady: Promise<void>;
	#resolveUserReady!: () => void;
	#heartbeatTimer: ReturnType<typeof setInterval>;

	#currentUserKey = '';
	#currentUserName = 'An editor';
	#notificationContext?: typeof UMB_NOTIFICATION_CONTEXT.TYPE;

	// Lock state for every node we currently have open, keyed by node key.
	#states = new UmbArrayState<NodeLockState>([], (s) => s.nodeKey);

	constructor(host: UmbControllerHost) {
		super(host, UMB_EDITOR_LOCK_CONTEXT);

		this.#ready = new Promise<void>((resolve) => (this.#resolveReady = resolve));
		this.#userReady = new Promise<void>((resolve) => (this.#resolveUserReady = resolve));

		this.consumeContext(UMB_CURRENT_USER_CONTEXT, (ctx) => {
			if (!ctx) return;
			this.observe(ctx.currentUser, (user) => {
				if (!user?.unique) return;
				this.#currentUserKey = user.unique;
				this.#currentUserName = user.name || user.userName || 'An editor';
				this.#resolveUserReady();
			});
		});

		this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => {
			this.#notificationContext = ctx;
		});

		this.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
			if (!authContext || this.#connection) return;
			this.#setupConnection(authContext);
		});

		this.#heartbeatTimer = setInterval(() => this.#sendHeartbeats(), HEARTBEAT_INTERVAL_MS);
	}

	#setupConnection(authContext: typeof UMB_AUTH_CONTEXT.TYPE) {
		this.#connection = new signalR.HubConnectionBuilder()
			.withUrl(HUB_URL, {
				accessTokenFactory: async () => (await authContext.getLatestToken()) ?? '',
			})
			.withAutomaticReconnect()
			.build();

		this.#connection.on('LockChanged', (nodeKey: string) => this.#onLockChanged(nodeKey));
		this.#connection.on('AccessRequested', (nodeKey: string, requesterName: string, requesterConnectionId: string) =>
			this.#onAccessRequested(nodeKey, requesterName, requesterConnectionId),
		);
		this.#connection.on('AccessDenied', (nodeKey: string) => this.#onAccessDenied(nodeKey));

		this.#connection
			.start()
			.then(() => {
				console.log('[EditorLock] Hub connected');
				this.#resolveReady();
			})
			.catch((e) => console.error('[EditorLock] Failed to start hub connection', e));
	}

	/** Observe the lock state for a single node. */
	stateForNode(nodeKey: string) {
		return this.#states.asObservablePart((list) => list.find((s) => s.nodeKey === nodeKey));
	}

	/** The display name of the current holder of a node, if it is locked by someone else. */
	getHolderName(nodeKey: string): string | undefined {
		return this.#states.getValue().find((s) => s.nodeKey === nodeKey)?.holderName ?? undefined;
	}

	/** Try to take the lock for a node, or observe it read-only if held by someone else. */
	async acquireOrObserve(nodeKey: string): Promise<NodeLockState | undefined> {
		await this.#ready;
		await this.#userReady;
		if (!this.#connection) return undefined;

		const status: EditorLockStatus = await this.#connection.invoke(
			'AcquireOrObserve',
			nodeKey,
			this.#currentUserKey,
			this.#currentUserName,
		);
		console.log('[EditorLock] acquireOrObserve', nodeKey, '->', status);
		const state: NodeLockState = { nodeKey, isEditor: status.isEditor, holderName: status.holderName };
		this.#states.appendOne(state);
		return state;
	}

	/** Release the lock for a node and stop tracking it. */
	async release(nodeKey: string): Promise<void> {
		this.#states.removeOne(nodeKey);
		if (this.#connection?.state !== signalR.HubConnectionState.Connected) return;
		try {
			await this.#connection.invoke('ReleaseLock', nodeKey);
		} catch (e) {
			console.warn('[EditorLock] Release failed', e);
		}
	}

	/** Ask the current holder of a node to hand over editing access. */
	async requestAccess(nodeKey: string): Promise<void> {
		await this.#ready;
		if (!this.#connection) return;
		await this.#connection.invoke('RequestAccess', nodeKey);
		this.#notificationContext?.peek('positive', {
			data: {
				headline: 'Access requested',
				message: 'Your request has been sent to the current editor.',
			},
		});
	}

	/** Forcibly take over the lock for a node without waiting for the holder's consent. */
	async forceAccess(nodeKey: string): Promise<void> {
		await this.#ready;
		if (!this.#connection) return;
		await this.#connection.invoke('ForceAccess', nodeKey);
	}

	#sendHeartbeats() {
		if (this.#connection?.state !== signalR.HubConnectionState.Connected) return;
		for (const state of this.#states.getValue()) {
			if (state.isEditor) {
				this.#connection.send('Heartbeat', state.nodeKey).catch(() => {});
			}
		}
	}

	async #onLockChanged(nodeKey: string) {
		// Only react to nodes we actually have open.
		if (!this.#states.getValue().some((s) => s.nodeKey === nodeKey)) return;
		console.log('[EditorLock] LockChanged received for', nodeKey);
		await this.acquireOrObserve(nodeKey);
	}

	async #onAccessRequested(nodeKey: string, requesterName: string, requesterConnectionId: string) {
		console.log('[EditorLock] AccessRequested from', requesterName, 'for', nodeKey);
		let accepted = false;
		try {
			await umbConfirmModal(this, {
				headline: 'Access requested',
				content: `${requesterName} is requesting access to take over editing this content. Will you accept?`,
				confirmLabel: 'Accept',
				cancelLabel: 'Decline',
				color: 'positive',
			});
			accepted = true;
		} catch {
			accepted = false;
		}

		try {
			await this.#connection?.invoke('RespondToRequest', nodeKey, requesterConnectionId, accepted);
		} catch (e) {
			console.error('[EditorLock] RespondToRequest failed', e);
		}
	}

	#onAccessDenied(_nodeKey: string) {
		this.#notificationContext?.peek('warning', {
			data: {
				headline: 'Request declined',
				message: 'The current editor declined your request for access.',
			},
		});
	}

	override destroy(): void {
		clearInterval(this.#heartbeatTimer);
		this.#connection?.stop().catch(() => {});
		super.destroy();
	}
}

export { UmbEditorLockContext as api };
export default UmbEditorLockContext;
