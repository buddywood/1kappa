/**
 * Design system tokens for consistent styling across the frontend
 * These values align with the mobile app design system
 */

// Spacing scale (in Tailwind units - 1 = 0.25rem = 4px)
export const SPACING = {
  xs: 1,    // 4px
  sm: 2,    // 8px
  md: 3,    // 12px
  lg: 4,    // 16px
  xl: 6,    // 24px
  '2xl': 8, // 32px
} as const;

// Border radii (in Tailwind units)
export const RADII = {
  sm: 'rounded-md',      // 6px
  md: 'rounded-lg',      // 10px
  lg: 'rounded-xl',      // 14px
  xl: 'rounded-2xl',     // 20px
  full: 'rounded-full',  // 9999px
} as const;

// Typography scale
export const TYPOGRAPHY = {
  title: 'text-2xl font-bold',           // 26px, 700
  subtitle: 'text-base leading-relaxed opacity-70', // 15px, line-height 22, opacity 0.7
  label: 'text-sm font-semibold',        // 14px, 600
  body: 'text-base',                     // 16px
  small: 'text-sm',                      // 14px
} as const;

// Shadow utilities (Tailwind classes)
export const SHADOW = {
  card: 'shadow-lg',      // shadow-lg
  input: 'shadow-sm',     // shadow-sm
  button: 'shadow-md',    // shadow-md
} as const;

// Color classes (using Tailwind color names from config)
export const COLORS = {
  primary: 'bg-crimson text-white',
  secondary: 'bg-cream text-midnight-navy',
  outline: 'border-2 border-crimson text-crimson',
  ghost: 'bg-transparent text-crimson',
} as const;

