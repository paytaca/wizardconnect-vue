import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h } from "vue";
import type { UseWizardConnectResult } from "../types.js";

vi.mock("@wizardconnect/core", () => {
  const EventEmitter = vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  }));

  return {
    initiateDappRelay: vi.fn(() => ({
      client: {},
      uri: "wiz://test-uri",
      qrUri: "WIZ://TEST-URI",
      credentials: {
        privateKey: "a".repeat(64),
        publicKey: "b".repeat(64),
        secret: "c".repeat(16),
      },
      events: new (EventEmitter as unknown as {
        new (): {
          on: ReturnType<typeof vi.fn>;
          off: ReturnType<typeof vi.fn>;
          emit: ReturnType<typeof vi.fn>;
        };
      })(),
      cleanup: vi.fn(),
    })),
    binToHex: vi.fn((bytes: Uint8Array) =>
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(""),
    ),
  };
});

vi.mock("@wizardconnect/dapp", async () => {
  const actual = await vi.importActual<typeof import("@wizardconnect/dapp")>(
    "@wizardconnect/dapp",
  );
  return {
    loadSession: actual.loadSession,
    saveSession: actual.saveSession,
    clearSession: actual.clearSession,
    DappConnectionManager: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      walletName: null,
      walletIcon: null,
      updateConnection: vi.fn(),
      sendDisconnect: vi.fn(() => Promise.resolve()),
      getSessionPaths: vi.fn(() => []),
      restoreSessionPaths: vi.fn(),
      attachRelay: vi.fn(),
      loadStoredSession: vi.fn(() => null),
      clearStoredSession: vi.fn(),
      destroy: vi.fn(),
    })),
  };
});

const { useWizardConnect } = await import("../useWizardConnect.js");
const { initiateDappRelay } = await import("@wizardconnect/core");

const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  get length() {
    return storage.size;
  },
  key: (_index: number) => null,
};
Object.defineProperty(globalThis, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

const SESSION_KEY = "wc-test-session";

function createTestComponent(
  options?: Parameters<typeof useWizardConnect>[0],
) {
  return defineComponent({
    setup() {
      const result = useWizardConnect({
        sessionKey: SESSION_KEY,
        ...options,
      });
      return { result };
    },
    render() {
      return h("div");
    },
  });
}

describe("useWizardConnect", () => {
  beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    storage.clear();
  });

  it("starts in idle state", () => {
    const wrapper = mount(createTestComponent({ persistSession: false }));
    const result = wrapper.vm.result as UseWizardConnectResult;

    expect(result.state.value).toBe("idle");
    expect(result.manager.value).toBeNull();
    expect(result.uri.value).toBeNull();
    expect(result.qrUri.value).toBeNull();
    expect(result.walletName.value).toBeNull();
    expect(result.walletIcon.value).toBeNull();
    expect(result.error.value).toBeNull();

    wrapper.unmount();
  });

  it("transitions to connecting on connect()", async () => {
    const wrapper = mount(createTestComponent({ persistSession: false }));
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    expect(result.state.value).toBe("connecting");
    expect(result.manager.value).not.toBeNull();
    expect(result.uri.value).toBe("wiz://test-uri");
    expect(result.qrUri.value).toBe("WIZ://TEST-URI");

    wrapper.unmount();
  });

  it("connect() calls initiateDappRelay", async () => {
    const wrapper = mount(createTestComponent({ persistSession: false }));
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    expect(initiateDappRelay).toHaveBeenCalledOnce();

    wrapper.unmount();
  });

  it("connect() returns false when already connecting", async () => {
    const wrapper = mount(createTestComponent({ persistSession: false }));
    const result = wrapper.vm.result as UseWizardConnectResult;

    const firstResult = result.connect();
    await wrapper.vm.$nextTick();
    const secondResult = result.connect();

    expect(firstResult).toBe(true);
    expect(secondResult).toBe(false);

    wrapper.unmount();
  });

  it("disconnect() clears state and calls clearStoredSession", async () => {
    const { DappConnectionManager } = vi.mocked(
      await import("@wizardconnect/dapp"),
    );

    const wrapper = mount(createTestComponent({ persistSession: true }));
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    const mgrInstance = DappConnectionManager.mock.results[0]?.value;

    await result.disconnect();
    await wrapper.vm.$nextTick();

    expect(result.state.value).toBe("idle");
    expect(result.manager.value).toBeNull();
    expect(result.uri.value).toBeNull();
    expect(result.qrUri.value).toBeNull();
    expect(mgrInstance.clearStoredSession).toHaveBeenCalled();

    wrapper.unmount();
  });

  it("passes dappName and dappIcon to DappConnectionManager", async () => {
    const { DappConnectionManager } = vi.mocked(
      await import("@wizardconnect/dapp"),
    );

    const wrapper = mount(
      createTestComponent({
        dappName: "My Dapp",
        dappIcon: "https://example.com/icon.png",
        persistSession: false,
      }),
    );
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    expect(DappConnectionManager).toHaveBeenCalledWith(
      "My Dapp",
      "https://example.com/icon.png",
      expect.objectContaining({}),
    );

    wrapper.unmount();
  });

  it("passes relayUrls to initiateDappRelay", async () => {
    const wrapper = mount(
      createTestComponent({
        relayUrls: ["wss://custom-relay:443"],
        persistSession: false,
      }),
    );
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    const callArgs = vi.mocked(initiateDappRelay).mock.calls[0];
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        explicitRelayUrls: ["wss://custom-relay:443"],
      }),
    );

    wrapper.unmount();
  });

  it("passes reconnectInterval and maxReconnectAttempts to initiateDappRelay", async () => {
    const wrapper = mount(
      createTestComponent({
        reconnectInterval: 10000,
        maxReconnectAttempts: 5,
        persistSession: false,
      }),
    );
    const result = wrapper.vm.result as UseWizardConnectResult;

    result.connect();
    await wrapper.vm.$nextTick();

    const callArgs = vi.mocked(initiateDappRelay).mock.calls[0];
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        reconnectInterval: 10000,
        maxReconnectAttempts: 5,
      }),
    );

    wrapper.unmount();
  });

  it("attempts auto-reconnect when stored session has walletPublicKey", async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        privateKey: "d".repeat(64),
        secret: "e".repeat(16),
        walletPublicKey: "f".repeat(64),
      }),
    );

    const wrapper = mount(createTestComponent({ persistSession: true }));
    await wrapper.vm.$nextTick();

    expect(initiateDappRelay).toHaveBeenCalledOnce();

    const callArgs = vi.mocked(initiateDappRelay).mock.calls[0];
    expect(callArgs[1]).toEqual(
      expect.objectContaining({
        existingCredentials: {
          privateKey: "d".repeat(64),
          secret: "e".repeat(16),
          walletPublicKey: "f".repeat(64),
        },
      }),
    );

    wrapper.unmount();
  });

  it("does not auto-reconnect when persistSession is false", async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        privateKey: "d".repeat(64),
        secret: "e".repeat(16),
        walletPublicKey: "f".repeat(64),
      }),
    );

    const wrapper = mount(createTestComponent({ persistSession: false }));
    await wrapper.vm.$nextTick();

    expect(initiateDappRelay).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
