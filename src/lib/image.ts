// Convierte una imagen subida en data URL reducida, para que el proyecto entre en
// el almacenamiento del navegador y la exportación no pese de más.

export async function fileToDataUrl(file: File, maxSide = 1600): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo leer la imagen."));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    // PNG conserva transparencias (logos, recortes); el resto va en JPEG. Cada imagen
    // queda por debajo de ~900 KB para poder guardarse en la nube.
    let out = file.type === "image/png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.86);
    let quality = 0.82;
    while (out.length > 900_000 && quality > 0.4) {
      out = canvas.toDataURL("image/jpeg", quality);
      quality -= 0.12;
    }
    if (out.length > 900_000) throw new Error("La imagen es demasiado pesada. Probá con una más chica.");
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
