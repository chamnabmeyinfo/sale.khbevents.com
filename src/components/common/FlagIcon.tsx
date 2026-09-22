'use client';

import React from 'react';

interface FlagIconProps {
  country: 'en' | 'kh';
  className?: string;
  width?: number;
  height?: number;
}

export default function FlagIcon({ country, className = '', width = 18, height = 12 }: FlagIconProps) {
  if (country === 'en') {
    return (
      <img
        src="/images/flags/en.svg"
        alt="UK Flag"
        width={width}
        height={height}
        className={`inline-block rounded-[2px] object-cover shrink-0 ${className}`}
        style={{ width: `${width}px`, height: `${height}px`, verticalAlign: '-1px' }}
        loading="eager"
      />
    );
  }

  return (
    <img
      src="/images/flags/kh.svg"
      alt="Cambodia Flag"
      width={width}
      height={height}
      className={`inline-block rounded-[2px] object-cover shrink-0 ${className}`}
      style={{ width: `${width}px`, height: `${height}px`, verticalAlign: '-1px' }}
      loading="eager"
    />
  );
}
