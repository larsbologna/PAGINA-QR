// Generación de QR 100 % en el navegador (librería qrcode), sin servicios externos.
import QRCode from "qrcode";

const OPTS = { errorCorrectionLevel: "Q", margin: 4, color: { dark: "#000000", light: "#ffffff" } };

export const qrDataUrl = (url, width) => QRCode.toDataURL(url, { ...OPTS, width });
export const qrSvg = (url) => QRCode.toString(url, { ...OPTS, type: "svg" });

export function download(filename, href) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
}
