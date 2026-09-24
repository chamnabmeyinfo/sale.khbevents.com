import { describe, expect, it } from 'vitest';
import { cleanVideoUrl, parseVideoSource } from '../video-embed';

describe('parseVideoSource', () => {
  it('reads YouTube links, shorts and embed code, and plays muted in a loop', () => {
    for (const input of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
      'https://youtu.be/dQw4w9WgXcQ',
      '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=abc" title="YouTube video player" allowfullscreen></iframe>',
    ]) {
      const v = parseVideoSource(input);
      expect(v?.provider).toBe('youtube');
      expect(v?.url).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(v?.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ?');
      expect(v?.src).toContain('mute=1');
      expect(v?.src).toContain('playlist=dQw4w9WgXcQ');
    }
    expect(parseVideoSource('https://youtube.com/shorts/dQw4w9WgXcQ')?.aspect).toBeCloseTo(9 / 16);
    expect(parseVideoSource('https://www.youtube.com/watch?v=short')).toBeNull();
  });

  it('reads Vimeo, including unlisted links', () => {
    expect(parseVideoSource('https://vimeo.com/76979871')?.src).toBe('https://player.vimeo.com/video/76979871?background=1&autoplay=1&muted=1&loop=1&dnt=1');
    expect(parseVideoSource('https://vimeo.com/76979871/8272103f6e')?.url).toBe('https://vimeo.com/76979871/8272103f6e');
    expect(parseVideoSource('<iframe src="https://player.vimeo.com/video/76979871?h=8272103f6e&amp;badge=0"></iframe>')?.src).toContain('h=8272103f6e');
  });

  it('reads Facebook videos and reels', () => {
    const fb = parseVideoSource('https://www.facebook.com/khbevents/videos/1234567890123456/');
    expect(fb?.provider).toBe('facebook');
    expect(fb?.src).toContain('facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fkhbevents%2Fvideos%2F1234567890123456%2F');
    expect(parseVideoSource('https://www.facebook.com/reel/1234567890')?.aspect).toBeCloseTo(9 / 16);
    const code = '<iframe src="https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Fkhbevents%2Fvideos%2F1234567890123456%2F&show_text=false&width=560"></iframe>';
    expect(parseVideoSource(code)?.url).toBe('https://www.facebook.com/khbevents/videos/1234567890123456/');
  });

  it('reads TikTok videos as vertical', () => {
    const t = parseVideoSource('https://www.tiktok.com/@khbevents/video/7312345678901234567?is_from_webapp=1');
    expect(t?.provider).toBe('tiktok');
    expect(t?.url).toBe('https://www.tiktok.com/@khbevents/video/7312345678901234567');
    expect(t?.src).toContain('tiktok.com/player/v1/7312345678901234567?');
    expect(t?.aspect).toBeCloseTo(9 / 16);
  });

  it('accepts video files and uploads, and refuses everything else', () => {
    expect(parseVideoSource('https://cdn.example.com/clips/hero.mp4?v=2')?.provider).toBe('file');
    expect(parseVideoSource('/api/uploads/video/mfk2x1a-0a1b2c3d-hero.mp4')?.provider).toBe('file');
    expect(parseVideoSource('http://cdn.example.com/hero.mp4')).toBeNull();
    expect(parseVideoSource('https://evil.example.com/page')).toBeNull();
    expect(parseVideoSource('<iframe src="https://evil.example.com/embed"></iframe>')).toBeNull();
    expect(parseVideoSource('javascript:alert(1)//.mp4')).toBeNull();
    expect(parseVideoSource('/api/uploads/video/../../db.json')).toBeNull();
    expect(cleanVideoUrl('')).toBeUndefined();
  });
});
