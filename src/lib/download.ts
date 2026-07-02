/**
 * Forces a browser download of a file served from `url`, saved with `filename`.
 * More reliable than a plain <a href target="_blank"> link, which some browsers
 * or extensions will open inline (e.g. PDFs) instead of downloading.
 */
export async function downloadFile(url: string, filename: string) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Download failed");
  }
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
