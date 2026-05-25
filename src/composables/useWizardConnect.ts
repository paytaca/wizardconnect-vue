import { ref, shallowRef, onMounted, onUnmounted } from "vue";
import {
  initiateDappRelay,
  type DappRelayResult,
  type RelayUpdatePayload,
} from "@wizardconnect/core";
import { DappConnectionManager, loadSession } from "@wizardconnect/dapp";
import type {
  UseWizardConnectOptions,
  UseWizardConnectResult,
  WizardConnectState,
} from "../types.js";

const DEFAULT_SESSION_KEY = "wizardconnect-session";

export function useWizardConnect(
  options: UseWizardConnectOptions = {},
): UseWizardConnectResult {
  const {
    dappName,
    dappIcon,
    relayUrls,
    sessionKey = DEFAULT_SESSION_KEY,
    persistSession = true,
    storage,
  } = options;

  const state = ref<WizardConnectState>("idle");
  const manager = shallowRef<DappConnectionManager | null>(null);
  const uri = ref<string | null>(null);
  const qrUri = ref<string | null>(null);
  const walletName = ref<string | null>(null);
  const walletIcon = ref<string | null>(null);
  const error = ref<string | null>(null);

  let relayResult: DappRelayResult | null = null;
  let managerInstance: DappConnectionManager | null = null;
  let autoReconnectAttempted = false;

  function startRelay(
    existingCredentials?: {
      privateKey: string;
      secret: string;
      walletPublicKey: string;
    },
  ): boolean {
    if (state.value === "connecting" || state.value === "connected")
      return false;

    error.value = null;
    state.value = "connecting";

    const mgr = new DappConnectionManager(dappName, dappIcon, {
      session: persistSession ? { key: sessionKey, storage } : false,
    });
    managerInstance = mgr;
    manager.value = mgr;

    mgr.on("walletready", () => {
      walletName.value = mgr.walletName;
      walletIcon.value = mgr.walletIcon;
      state.value = "connected";
    });

    mgr.on("reconnecting", () => {
      state.value = "reconnecting";
    });

    mgr.on("disconnect", () => {
      state.value = "disconnected";
      walletName.value = null;
      walletIcon.value = null;
      mgr.clearStoredSession();
      relayResult?.cleanup();
      relayResult = null;
    });

    try {
      const relay = initiateDappRelay(
        (payload: RelayUpdatePayload) => {
          mgr.updateConnection(payload.client, payload.status);
        },
        {
          existingCredentials,
          explicitRelayUrls: relayUrls,
        },
      );

      relayResult = relay;
      if (!existingCredentials) {
        uri.value = relay.uri;
        qrUri.value = relay.qrUri;
      }
      mgr.attachRelay(relay);

      return true;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to start relay";
      error.value = message;
      state.value = "idle";
      return false;
    }
  }

  function connect(): boolean {
    return startRelay();
  }

  async function disconnect(): Promise<void> {
    try {
      if (managerInstance) {
        await managerInstance.sendDisconnect().catch(() => {});
      }
    } finally {
      relayResult?.cleanup();
      relayResult = null;
      managerInstance?.clearStoredSession();
      managerInstance = null;
      manager.value = null;
      uri.value = null;
      qrUri.value = null;
      walletName.value = null;
      walletIcon.value = null;
      state.value = "idle";
    }
  }

  onMounted(() => {
    if (autoReconnectAttempted) return;
    if (!persistSession) return;
    autoReconnectAttempted = true;

    const stored = loadSession(sessionKey, storage);
    if (!stored || !stored.walletPublicKey) return;

    if (stored.walletName) {
      walletName.value = stored.walletName;
    }

    startRelay({
      privateKey: stored.privateKey,
      secret: stored.secret,
      walletPublicKey: stored.walletPublicKey,
    });
  });

  onUnmounted(() => {
    managerInstance?.destroy();
    relayResult?.cleanup();
    relayResult = null;
    autoReconnectAttempted = false;
  });

  return {
    state,
    manager,
    uri,
    qrUri,
    walletName,
    walletIcon,
    connect,
    disconnect,
    error,
  };
}
