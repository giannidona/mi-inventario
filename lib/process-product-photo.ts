/**
 * Client-only pipeline: ML background removal (@imgly/onnx) + canvas polish.
 * Runs in the browser; no image is sent to your server.
 */

const MAX_INPUT_BYTES = 15 * 1024 * 1024
const MAX_OUTPUT_EDGE = 1024

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file."
  }
  if (file.size > MAX_INPUT_BYTES) {
    return "Image must be 15MB or smaller."
  }
  return null
}

/**
 * Contrast / saturation / brightness pass and downscale if huge (sharper catalog thumbnails).
 */
export async function enhanceProductPhotoBlob(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  try {
    let w = bitmap.width
    let h = bitmap.height
    const scale = Math.min(1, MAX_OUTPUT_EDGE / Math.max(w, h))
    w = Math.round(w * scale)
    h = Math.round(h * scale)

    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d", { willReadFrequently: true })
    if (!ctx) {
      throw new Error("Canvas is not available.")
    }

    ctx.filter =
      "contrast(1.08) saturate(1.1) brightness(1.03)"
    ctx.drawImage(bitmap, 0, 0, w, h)
    ctx.filter = "none"

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Could not encode image."))),
        "image/png",
        0.95
      )
    })
  } finally {
    bitmap.close()
  }
}

export type ProcessStage = "remove-bg" | "enhance" | "done"

export async function processUploadedProductPhoto(
  file: File,
  onProgress?: (stage: ProcessStage, message: string, percent: number) => void
): Promise<Blob> {
  const err = validateImageFile(file)
  if (err) throw new Error(err)

  onProgress?.("remove-bg", "Removing background (AI)…", 5)

  const { removeBackground } = await import("@imgly/background-removal")

  const withoutBg = await removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png", quality: 0.92 },
    progress: (_key, current, total) => {
      const pct = 5 + Math.round((current / total) * 55)
      onProgress?.("remove-bg", "Removing background (AI)…", pct)
    },
  })

  onProgress?.("enhance", "Enhancing photo…", 70)
  const enhanced = await enhanceProductPhotoBlob(withoutBg)
  onProgress?.("done", "Ready", 100)

  return enhanced
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("Read failed"))
    reader.readAsDataURL(blob)
  })
}
