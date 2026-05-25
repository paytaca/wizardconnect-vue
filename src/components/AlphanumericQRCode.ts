import { defineComponent, ref, h } from "vue";
import { useAlphanumericQRCode } from "../composables/useAlphanumericQRCode.js";

const DEFAULT_SIZE = 280;
const DEFAULT_QUIET_ZONE = 4;
const DEFAULT_FG = "#1e2a4a";
const DEFAULT_BG = "#ffffff";

export const AlphanumericQRCode = defineComponent({
  name: "AlphanumericQRCode",
  props: {
    value: { type: String, required: true },
    size: { type: Number, default: DEFAULT_SIZE },
    foreground: { type: String, default: DEFAULT_FG },
    background: { type: String, default: DEFAULT_BG },
    quietZone: { type: Number, default: DEFAULT_QUIET_ZONE },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(null);

    const valueRef = ref(props.value);
    const sizeRef = ref(props.size);
    const fgRef = ref(props.foreground);
    const bgRef = ref(props.background);
    const qzRef = ref(props.quietZone);

    useAlphanumericQRCode(canvasRef, valueRef, sizeRef, fgRef, bgRef, qzRef);

    return () =>
      h("canvas", {
        ref: canvasRef,
        style: { height: "auto", maxWidth: `${props.size}px`, width: "100%" },
      });
  },
});
