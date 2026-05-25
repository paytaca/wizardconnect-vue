import type { Ref } from "vue";
import { watch, onMounted } from "vue";
import qrGenerator from "qrcode-generator";
import { WIZARDCONNECT_LOGO } from "../components/logo.js";

export function useAlphanumericQRCode(
  canvasRef: Ref<HTMLCanvasElement | null>,
  value: Ref<string>,
  size: Ref<number>,
  foreground: Ref<string>,
  background: Ref<string>,
  quietZone: Ref<number>,
) {
  function draw() {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const qr = qrGenerator(0, "H");
    qr.addData(value.value, "Alphanumeric");
    qr.make();

    const moduleCount = qr.getModuleCount();
    const cellSize = size.value / moduleCount;
    const canvasSize = size.value + 2 * quietZone.value;
    const scale =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    canvas.style.width = `${canvasSize}px`;
    canvas.style.height = `${canvasSize}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(scale, scale);

    ctx.fillStyle = background.value;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = foreground.value;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          ctx.fillRect(
            Math.round(col * cellSize) + quietZone.value,
            Math.round(row * cellSize) + quietZone.value,
            Math.ceil(cellSize),
            Math.ceil(cellSize),
          );
        }
      }
    }

    const logo = new Image();
    logo.onload = () => {
      const logoSize = size.value * 0.22;
      const logoPadding = 4;
      const dx = (canvasSize - logoSize) / 2;
      const dy = (canvasSize - logoSize) / 2;

      ctx.fillStyle = background.value;
      ctx.fillRect(
        dx - logoPadding,
        dy - logoPadding,
        logoSize + logoPadding * 2,
        logoSize + logoPadding * 2,
      );

      ctx.drawImage(logo, dx, dy, logoSize, logoSize);
    };
    logo.src = WIZARDCONNECT_LOGO;
  }

  watch([value, size, foreground, background, quietZone], draw);
  onMounted(draw);

  return { draw };
}
