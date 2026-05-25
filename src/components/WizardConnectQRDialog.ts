import { defineComponent, ref, h, Teleport } from "vue";
import { AlphanumericQRCode } from "./AlphanumericQRCode.js";
import { WIZARDCONNECT_LOGO } from "./logo.js";
import type { WizardConnectQRTheme } from "../types.js";

const defaults: Required<
  Pick<
    WizardConnectQRTheme,
    | "backdropColor"
    | "dialogBackground"
    | "headerBackground"
    | "titleColor"
    | "subtitleColor"
    | "qrForeground"
    | "qrBackground"
    | "uriRowBackground"
    | "uriTextColor"
    | "borderColor"
    | "closeButtonColor"
    | "copyButtonColor"
    | "qrSize"
  >
> = {
  backdropColor: "rgba(0,0,0,0.5)",
  dialogBackground: "#1a1f2e",
  headerBackground: "#1a1f2e",
  titleColor: "#ffffff",
  subtitleColor: "#9ca3af",
  qrForeground: "#1e2a4a",
  qrBackground: "#ffffff",
  uriRowBackground: "rgba(31,41,55,0.6)",
  uriTextColor: "#9ca3af",
  borderColor: "#374151",
  closeButtonColor: "#9ca3af",
  copyButtonColor: "#9ca3af",
  qrSize: 280,
};

function CloseIcon(color: string) {
  return h(
    "svg",
    { width: 20, height: 20, viewBox: "0 0 20 20", fill: "none" },
    h("path", {
      d: "M5 5L15 15M15 5L5 15",
      stroke: color,
      "stroke-width": "2",
      "stroke-linecap": "round",
    }),
  );
}

function CopyIcon(color: string) {
  return [
    h("rect", {
      x: 9,
      y: 9,
      width: 13,
      height: 13,
      rx: 2,
      stroke: color,
      "stroke-width": "2",
      fill: "none",
    }),
    h("path", {
      d: "M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1",
      stroke: color,
      "stroke-width": "2",
      fill: "none",
    }),
  ];
}

export const WizardConnectQRDialog = defineComponent({
  name: "WizardConnectQRDialog",
  props: {
    show: { type: Boolean, required: true },
    onClose: { type: Function, required: true },
    uri: { type: String, required: true },
    qrUri: { type: String, required: true },
    onCopy: { type: Function, default: undefined },
    theme: { type: Object, default: undefined },
    class: { type: String, default: undefined },
    subtitle: {
      type: String,
      default: "Scan with your wallet to connect",
    },
    title: { type: String, default: "WizardConnect" },
  },
  emits: ["update:show"],
  setup(props, { emit }) {
    const copied = ref(false);
    let copiedTimer: ReturnType<typeof setTimeout> | null = null;

    function handleCopy() {
      if (props.onCopy) {
        props.onCopy(props.uri);
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(props.uri).catch(() => {});
      }
      copied.value = true;
      if (copiedTimer) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        copied.value = false;
      }, 2000);
    }

    function handleHide() {
      props.onClose();
      emit("update:show", false);
    }

    function handleBackdropClick(e: MouseEvent) {
      if (e.target === e.currentTarget) handleHide();
    }

    return () => {
      if (!props.show) return null;

      const t = { ...defaults, ...props.theme };

      return h(
        Teleport,
        { to: "body" },
        h(
          "div",
          {
            class: props.class,
            onClick: handleBackdropClick,
            style: {
              position: "fixed",
              inset: "0",
              zIndex: 40,
              display: "grid",
              placeItems: "center",
              padding: "16px",
              backgroundColor: t.backdropColor,
              backdropFilter: "blur(4px)",
            },
          },
          h(
            "div",
            {
              style: {
                width: "100%",
                maxWidth: "384px",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                border: `1px solid ${t.borderColor}`,
              },
            },
            [
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    backgroundColor: t.headerBackground,
                  },
                },
                [
                  h(
                    "div",
                    {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      },
                    },
                    [
                      h("img", {
                        src: WIZARDCONNECT_LOGO,
                        alt: "",
                        style: { width: "28px", height: "28px" },
                      }),
                      h(
                        "span",
                        {
                          style: {
                            color: t.titleColor,
                            fontWeight: 600,
                            fontSize: "18px",
                          },
                        },
                        props.title,
                      ),
                    ],
                  ),
                  h(
                    "button",
                    {
                      onClick: handleHide,
                      style: {
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                      },
                      "aria-label": "Close",
                    },
                    CloseIcon(t.closeButtonColor),
                  ),
                ],
              ),
              h(
                "div",
                {
                  style: {
                    backgroundColor: t.dialogBackground,
                    padding: "0 20px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "16px",
                  },
                },
                [
                  h(
                    "p",
                    {
                      style: {
                        color: t.subtitleColor,
                        fontSize: "14px",
                        margin: 0,
                      },
                    },
                    props.subtitle,
                  ),
                  h(
                    "div",
                    {
                      style: {
                        backgroundColor: t.qrBackground,
                        padding: "12px",
                        borderRadius: "12px",
                      },
                    },
                    [
                      h(AlphanumericQRCode, {
                        value: props.qrUri,
                        size: t.qrSize,
                        foreground: t.qrForeground,
                        background: t.qrBackground,
                      }),
                    ],
                  ),
                  h(
                    "button",
                    {
                      onClick: handleCopy,
                      style: {
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 12px",
                        backgroundColor: t.uriRowBackground,
                        borderRadius: "8px",
                        border: `1px solid ${t.borderColor}`,
                        cursor: "pointer",
                        textAlign: "left",
                        font: "inherit",
                        transition: "border-color 0.15s",
                      },
                      "aria-label": "Copy URI",
                    },
                    [
                      h(
                        "p",
                        {
                          style: {
                            color: t.uriTextColor,
                            fontSize: "12px",
                            margin: 0,
                            flex: "1",
                            wordBreak: "break-all",
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          },
                        },
                        props.uri,
                      ),
                      copied.value
                        ? h(
                            "span",
                            {
                              style: {
                                color: "#0307fe",
                                fontSize: "12px",
                                fontWeight: 600,
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                              },
                            },
                            "Copied!",
                          )
                        : h(
                            "span",
                            {
                              style: {
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                              },
                            },
                            CopyIcon(t.copyButtonColor),
                          ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      );
    };
  },
});
