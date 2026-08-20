/**
 * EduCRM Document Watermarking Engine
 * Overlays semi-transparent security watermarks on images and documents
 * prior to download or preview to prevent unauthorized redistribution.
 */

/**
 * Creates a watermarked copy of an image using HTML5 Canvas.
 * Returns a downloadable Blob.
 */
export async function watermarkImage(
  imageUrl: string,
  watermarkText: string = "EduCRM Confidential • Placement Document"
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Watermark Styling
      const fontSize = Math.max(16, Math.floor(img.width / 25));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillStyle = "rgba(16, 185, 129, 0.25)"; // Emerald with 25% opacity
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Rotate and draw diagonal watermark pattern
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6); // -30 degrees

      const timestamp = new Date().toISOString().slice(0, 10);
      const textToDraw = `${watermarkText} • ${timestamp}`;

      // Draw multiple lines for full coverage
      const step = fontSize * 4;
      for (let y = -canvas.height; y < canvas.height; y += step) {
        ctx.fillText(textToDraw, 0, y);
      }
      ctx.restore();

      // Export canvas as blob
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate watermarked blob"));
        }
      }, "image/jpeg", 0.92);
    };

    img.onerror = (e) => reject(e);
    img.src = imageUrl;
  });
}

/**
 * Trigger download of a Blob file in the browser.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
