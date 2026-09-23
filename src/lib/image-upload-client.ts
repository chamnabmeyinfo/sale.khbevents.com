'use client';

/**
 * Browser-side helpers shared by every image field in the admin: shrink a photo,
 * then send it to /api/uploads and get back the URL to store on the page.
 */

/** Longest edge after downscaling. Nothing on the site renders wider than this. */
export const MAX_EDGE = 1920;

/**
 * Shrink a photo before upload: at most 1920px on the long edge, WebP (JPEG where
 * WebP encoding is unavailable). GIFs keep their animation and are sent as they are.
 * Anything the browser cannot decode is sent untouched and the server decides.
 */
export async function prepareForUpload(file: File, maxEdge: number = MAX_EDGE): Promise<File> {
  if (file.type === 'image/gif' || !file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const encode = (type: string, quality: number) =>
      new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
    // PNG stays lossless when it is small (logos, QR codes need crisp edges).
    const keepPng = file.type === 'image/png' && file.size < 400 * 1024;
    let blob = keepPng ? await encode('image/png', 1) : await encode('image/webp', 0.85);
    if (!blob || (!keepPng && blob.type !== 'image/webp')) blob = await encode('image/jpeg', 0.86);
    if (!blob) return file;
    if (scale === 1 && blob.size >= file.size) return file;
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type: blob.type });
  } catch {
    return file;
  }
}

/** Upload one image through the admin API. Resolves to its public URL; throws with a readable message. */
export async function uploadImage(original: File, maxEdge?: number): Promise<{ url: string; name: string }> {
  const file = await prepareForUpload(original, maxEdge);
  const body = new FormData();
  body.append('file', file, file.name);
  const res = await fetch('/api/uploads', { method: 'POST', body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.url) throw new Error(data.error || `Upload failed (${res.status})`);
  return { url: data.url, name: data.name };
}
