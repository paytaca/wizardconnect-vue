import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { h } from "vue";
import { WizardConnectQRDialog } from "../WizardConnectQRDialog.js";

vi.mock("../AlphanumericQRCode.js", () => ({
  AlphanumericQRCode: {
    name: "AlphanumericQRCode",
    props: ["value", "size", "foreground", "background", "quietZone"],
    setup(props: { value: string }) {
      return () =>
        h("div", {
          "data-testid": "qr-code",
          "data-value": props.value,
        });
    },
  },
}));

describe("WizardConnectQRDialog", () => {
  const defaultProps = {
    show: true,
    onClose: () => {},
    uri: "wiz://test",
    qrUri: "WIZ://TEST",
  };

  function render(
    props: Partial<typeof defaultProps> & {
      copyLabel?: string;
      qrCopyLabel?: string;
    } = {},
  ) {
    return mount(WizardConnectQRDialog, {
      props: { ...defaultProps, ...props },
      global: {
        stubs: {
          Teleport: {
            props: ["to"],
            setup(_: any, { slots }: any) {
              return () => h("div", { class: "teleported" }, slots.default?.());
            },
          },
        },
      },
    });
  }

  it("renders nothing when show is false", () => {
    const wrapper = render({ show: false });
    expect(wrapper.find(".teleported").exists()).toBe(false);
    wrapper.unmount();
  });

  it("renders dialog content when show is true", () => {
    const wrapper = render({ show: true });
    expect(wrapper.find(".teleported").exists()).toBe(true);
    wrapper.unmount();
  });

  it("displays the default title", () => {
    const wrapper = render();
    expect(wrapper.text()).toContain("WizardConnect");
    wrapper.unmount();
  });

  it("displays a custom title", () => {
    const wrapper = render({ title: "My Custom Title" });
    expect(wrapper.text()).toContain("My Custom Title");
    wrapper.unmount();
  });

  it("displays the URI text", () => {
    const wrapper = render({ uri: "wiz://my-unique-uri" });
    expect(wrapper.text()).toContain("wiz://my-unique-uri");
    wrapper.unmount();
  });

  it("displays the default subtitle", () => {
    const wrapper = render();
    expect(wrapper.text()).toContain("Scan with your wallet to connect");
    wrapper.unmount();
  });

  it("displays a custom subtitle", () => {
    const wrapper = render({ subtitle: "Custom scan instructions" });
    expect(wrapper.text()).toContain("Custom scan instructions");
    wrapper.unmount();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    const wrapper = render({ onClose });
    const closeBtn = wrapper.find('button[aria-label="Close"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger("click");
    expect(onClose).toHaveBeenCalledOnce();
    wrapper.unmount();
  });

  it("calls onCopy with the URI when copy button is clicked", async () => {
    const onCopy = vi.fn();
    const wrapper = render({ uri: "wiz://copy-test", onCopy });
    const copyBtn = wrapper.find('button[aria-label="Copy URI"]');
    expect(copyBtn.exists()).toBe(true);
    await copyBtn.trigger("click");
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy).toHaveBeenCalledWith("wiz://copy-test");
    wrapper.unmount();
  });

  it("calls onCopy with the URI when the QR code is clicked", async () => {
    const onCopy = vi.fn();
    const wrapper = render({ uri: "wiz://qr-click", onCopy });
    const qrBtn = wrapper.find('button[aria-label="Copy connection URI"]');
    expect(qrBtn.exists()).toBe(true);
    expect(qrBtn.find("[data-testid='qr-code']").exists()).toBe(true);
    await qrBtn.trigger("click");
    expect(onCopy).toHaveBeenCalledOnce();
    expect(onCopy).toHaveBeenCalledWith("wiz://qr-click");
    wrapper.unmount();
  });

  it("shows the copied indicator after clicking the QR code", async () => {
    const wrapper = render({ onCopy: vi.fn() });
    expect(wrapper.text()).not.toContain("Copied!");
    await wrapper
      .find('button[aria-label="Copy connection URI"]')
      .trigger("click");
    expect(wrapper.text()).toContain("Copied!");
    wrapper.unmount();
  });

  it("uses the custom copy labels", () => {
    const wrapper = render({
      copyLabel: "Kopiera länk",
      qrCopyLabel: "Kopiera anslutningslänk",
    });
    expect(wrapper.find('button[aria-label="Kopiera länk"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('button[aria-label="Kopiera anslutningslänk"]').exists(),
    ).toBe(true);
    wrapper.unmount();
  });

  it("always renders the WizardConnect logo in the header", () => {
    const wrapper = render();
    const logo = wrapper.find("img");
    expect(logo.exists()).toBe(true);
    expect(logo.attributes("src")).toContain("data:image/png;base64,");
    wrapper.unmount();
  });

  it("passes qrUri to the QR code component", () => {
    const wrapper = render({ qrUri: "WIZ://MY-QR-VALUE" });
    const qrCode = wrapper.find("[data-testid='qr-code']");
    expect(qrCode.exists()).toBe(true);
    expect(qrCode.attributes("data-value")).toBe("WIZ://MY-QR-VALUE");
    wrapper.unmount();
  });
});
