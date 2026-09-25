import React from 'react';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#F43F5E', '#14B8A6', '#6366F1'];

/** Two letters from a name ("Tim Vutha" → TV, "Dara" → DA). */
export function staffInitials(name: string): string {
  const words = (name || '?').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0] || '?').slice(0, 2).toUpperCase();
}

function colorFor(name: string): string {
  let h = 0;
  for (const ch of name || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

/** A salesperson's photo, or their initials on a colour when there is none. */
export default function StaffAvatar({ name, src, size = 40, className = '' }: { name: string; src?: string; size?: number; className?: string }) {
  const style = { width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.38)) };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className={`rounded-full object-cover shrink-0 ${className}`} style={style} />;
  }
  return (
    <span aria-hidden="true" className={`on-dark inline-flex items-center justify-center rounded-full font-black shrink-0 ${className}`} style={{ ...style, background: colorFor(name), color: '#FFFFFF' }}>
      {staffInitials(name)}
    </span>
  );
}
