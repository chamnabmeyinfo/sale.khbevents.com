'use client';

import React, { useEffect, useRef } from 'react';

/**
 * A silent looping background video that starts on phones too.
 *
 * Phones play a muted, inline video by themselves, except when they are told not to:
 * the in-app browsers of Telegram, Facebook, Messenger and Instagram on Android
 * (they wait for a tap), iPhone Low Power Mode and Android Data Saver. So:
 * - muted is set on the element itself, and play() is called on mount;
 * - if the phone refuses, the first tap, touch or key press anywhere starts every
 *   waiting background video (the photo shows until then);
 * - videos pause when scrolled off screen and resume when back, which saves battery
 *   and data and restarts videos that iOS paused when the tab was hidden.
 */

const waiting = new Set<HTMLVideoElement>();
const GESTURES = ['touchend', 'pointerup', 'click', 'keydown'] as const;
let listening = false;

function tryPlay(el: HTMLVideoElement): Promise<boolean> {
  el.muted = true;
  el.defaultMuted = true;
  el.setAttribute('muted', '');
  el.playsInline = true;
  try {
    const p = el.play();
    if (!p) return Promise.resolve(!el.paused);
    return p.then(() => true, () => false);
  } catch {
    return Promise.resolve(false);
  }
}

function onGesture() {
  for (const el of Array.from(waiting)) {
    void tryPlay(el).then((ok) => {
      if (ok) waiting.delete(el);
    });
  }
  if (waiting.size === 0) stopListening();
}

function startListening() {
  if (listening) return;
  listening = true;
  for (const type of GESTURES) window.addEventListener(type, onGesture, { passive: true, capture: true });
}

function stopListening() {
  if (!listening) return;
  listening = false;
  for (const type of GESTURES) window.removeEventListener(type, onGesture, { capture: true });
}

export default function BackgroundVideo({ src, poster, className }: { src: string; poster?: string; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = true;

    const start = () => {
      void tryPlay(el).then((ok) => {
        if (ok) {
          waiting.delete(el);
        } else if (visible) {
          waiting.add(el);
          startListening();
        }
      });
    };

    start();

    const io = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) {
            if (el.paused) start();
          } else if (!el.paused) {
            el.pause();
          }
        }, { rootMargin: '200px 0px' })
      : null;
    io?.observe(el);

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && visible && el.paused) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Some phones drop the first play() while the file is still loading.
    el.addEventListener('canplay', onVisibility);

    return () => {
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('canplay', onVisibility);
      waiting.delete(el);
      if (waiting.size === 0) stopListening();
    };
  }, [src]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden="true"
      // Older Android and iOS in-app browsers only honour the prefixed names.
      {...{ 'webkit-playsinline': 'true', 'x5-playsinline': 'true' }}
    />
  );
}
