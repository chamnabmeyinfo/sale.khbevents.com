'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_LOGO } from '@/lib/company';

/** The company logo for admin screens (Settings → Company), set by the admin layout. */
export const BrandLogoContext = createContext<string>(DEFAULT_LOGO);
export const useBrandLogo = () => useContext(BrandLogoContext);
