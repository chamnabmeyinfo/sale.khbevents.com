/**
 * Background videos for builder sections: turn what an admin pastes (a link,
 * or an embed code copied from YouTube, Vimeo, Facebook or TikTok) or an
 * uploaded file's address into something the page can play silently behind
 * the text.
 *
 * Only these sources are accepted, so a pasted embed code can never put an
 * arbitrary site inside the page. Client-safe: no Node or Next imports.
 */

export type VideoProvider = 'file' | 'youtube' | 'vimeo' | 'facebook' | 'tiktok';

export interface VideoSource {
  provider: VideoProvider;
  /** Canonical link that is stored on the page. */
  url: string;
  /** What to play: a video file address, or an iframe address for embeds. */
  src: string;
  /** Width / height of the video, used to cover the section without black bars. */
  aspect: number;
}

const FILE_EXT = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i;
const YT_ID = /^[A-Za-z0-9_-]{11}$/;

/** Pulls the src out of pasted `<iframe src="...">` embed code; otherwise returns the input. */
function unwrapEmbedCode(input: string): string {
  const m = input.match(/<iframe[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
  return (m ? m[1] : input).trim().replace(/&amp;/g, '&');
}

function toUrl(value: string): URL | null {
  try {
    const u = new URL(value.startsWith('//') ? `https:${value}` : value);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u : null;
  } catch {
    return null;
  }
}

const host = (u: URL) => u.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.|web\.)/, '');

function youtube(u: URL): VideoSource | null {
  const h = host(u);
  let id: string | null = null;
  if (h === 'youtu.be') id = u.pathname.split('/')[1] || null;
  else if (h === 'youtube.com' || h === 'youtube-nocookie.com' || h === 'music.youtube.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else {
      const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
      id = m ? m[1] : null;
    }
  }
  if (!id || !YT_ID.test(id)) return null;
  const params = new URLSearchParams({
    autoplay: '1', mute: '1', loop: '1', playlist: id, controls: '0', playsinline: '1',
    modestbranding: '1', rel: '0', disablekb: '1', iv_load_policy: '3', fs: '0',
  });
  const shorts = /^\/shorts\//.test(u.pathname);
  return {
    provider: 'youtube',
    url: shorts ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
    src: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
    aspect: shorts ? 9 / 16 : 16 / 9,
  };
}

function vimeo(u: URL): VideoSource | null {
  const h = host(u);
  if (h !== 'vimeo.com' && h !== 'player.vimeo.com') return null;
  const m = u.pathname.match(/^\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d{5,12})(?:\/([0-9a-f]{6,20}))?/i);
  if (!m) return null;
  const id = m[1];
  const hash = m[2] || u.searchParams.get('h') || '';
  const safeHash = /^[0-9a-f]{6,20}$/i.test(hash) ? hash : '';
  const params = new URLSearchParams({ background: '1', autoplay: '1', muted: '1', loop: '1', dnt: '1' });
  if (safeHash) params.set('h', safeHash);
  return {
    provider: 'vimeo',
    url: `https://vimeo.com/${id}${safeHash ? `/${safeHash}` : ''}`,
    src: `https://player.vimeo.com/video/${id}?${params}`,
    aspect: 16 / 9,
  };
}

function facebook(u: URL): VideoSource | null {
  const h = host(u);
  let href: URL | null = null;
  if (h === 'facebook.com' && u.pathname === '/plugins/video.php') {
    const inner = toUrl(u.searchParams.get('href') || '');
    href = inner && ['facebook.com', 'fb.watch'].includes(host(inner)) ? inner : null;
  } else if (h === 'fb.watch' || (h === 'facebook.com' && /\/(videos|reel|watch|share\/v|share\/r)\b/.test(u.pathname + '/'))) {
    href = u;
  }
  if (!href) return null;
  const clean = `https://${host(href) === 'fb.watch' ? 'fb.watch' : 'www.facebook.com'}${href.pathname}${href.pathname === '/watch' || href.pathname === '/watch/' ? `?v=${encodeURIComponent(href.searchParams.get('v') || '')}` : ''}`;
  const params = new URLSearchParams({ href: clean, show_text: 'false', autoplay: 'true', mute: 'true', loop: 'true', allowfullscreen: 'false' });
  const reel = /\/(reel|share\/r)\b/.test(href.pathname + '/');
  return { provider: 'facebook', url: clean, src: `https://www.facebook.com/plugins/video.php?${params}`, aspect: reel ? 9 / 16 : 16 / 9 };
}

function tiktok(u: URL): VideoSource | null {
  const h = host(u);
  if (h !== 'tiktok.com') return null;
  const m = u.pathname.match(/\/(?:@[^/]+\/video|embed\/v2|embed|player\/v1)\/(\d{8,25})/);
  if (!m) return null;
  const id = m[1];
  const params = new URLSearchParams({
    autoplay: '1', loop: '1', muted: '1', controls: '0', progress_bar: '0', play_button: '0', volume_control: '0',
    fullscreen_button: '0', timestamp: '0', music_info: '0', description: '0', rel: '0', native_context_menu: '0', closed_caption: '0',
  });
  const path = u.pathname.match(/^\/@[^/]+\/video\/\d+/)?.[0];
  return {
    provider: 'tiktok',
    url: path ? `https://www.tiktok.com${path}` : `https://www.tiktok.com/player/v1/${id}`,
    src: `https://www.tiktok.com/player/v1/${id}?${params}`,
    aspect: 9 / 16,
  };
}

/**
 * Reads a background video from a link, embed code or file address.
 * Returns null for anything that is not a supported source.
 */
export function parseVideoSource(input: unknown): VideoSource | null {
  if (typeof input !== 'string') return null;
  const raw = unwrapEmbedCode(input.trim()).slice(0, 2000);
  if (!raw) return null;

  // Uploaded files (this site) and video files hosted anywhere over https.
  if (/^\/api\/uploads\/video\/[a-z0-9][a-z0-9-]*\.(mp4|webm|mov|m4v)$/.test(raw)) {
    return { provider: 'file', url: raw, src: raw, aspect: 16 / 9 };
  }
  const u = toUrl(raw);
  if (!u) return null;
  const embed = youtube(u) || vimeo(u) || facebook(u) || tiktok(u);
  if (embed) return embed;
  if (u.protocol === 'https:' && FILE_EXT.test(u.pathname + u.search)) {
    return { provider: 'file', url: u.toString(), src: u.toString(), aspect: 16 / 9 };
  }
  return null;
}

/** The value stored on a page: the canonical link, or undefined when the input is not a supported video. */
export function cleanVideoUrl(input: unknown): string | undefined {
  return parseVideoSource(input)?.url;
}

export const VIDEO_PROVIDER_NAMES: Record<VideoProvider, string> = {
  file: 'Video file',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  facebook: 'Facebook',
  tiktok: 'TikTok',
};
