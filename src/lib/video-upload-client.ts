'use client';

import { createClient } from './supabase-browser';
import { ALLOWED_VIDEO_TYPES, MAX_VIDEO_BYTES } from './uploads-shared';

/**
 * Uploads a background video. With Supabase Storage the file goes from the browser
 * straight to storage through a signed URL from /api/uploads/video; in local
 * development it is posted to the same route. Returns the address to store.
 */
export async function uploadVideo(file: File): Promise<string> {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) throw new Error('Choose an MP4, WebM or MOV video.');
  if (file.size > MAX_VIDEO_BYTES) throw new Error(`Videos must be under ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB. Shorten or compress the clip.`);

  const res = await fetch('/api/uploads/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed. Try again.');

  if (data.mode === 'signed') {
    const supabase = createClient();
    if (!supabase) throw new Error('Video storage is not available in this browser session.');
    const { error } = await supabase.storage
      .from(data.bucket)
      .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type, cacheControl: '31536000' });
    if (error) throw new Error(error.message || 'Upload failed. Try again.');
    return data.url as string;
  }

  const form = new FormData();
  form.append('file', file);
  const local = await fetch('/api/uploads/video', { method: 'POST', body: form });
  const localData = await local.json().catch(() => ({}));
  if (!local.ok || !localData.url) throw new Error(localData.error || 'Upload failed. Try again.');
  return localData.url as string;
}
