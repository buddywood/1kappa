import { COLORS } from '../lib/constants';

// Spacing scale
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// Border radii
export const RADII = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

// Typography
export const FONT = {
  title: { fontSize: 26, fontWeight: '700' as const },
  subtitle: { fontSize: 15, lineHeight: 22, opacity: 0.7 },
  label: { fontSize: 14, fontWeight: '600' as const },
  body: { fontSize: 16 },
};

// Shadows
export const SHADOW = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  input: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// Re-export COLORS for convenience
export { COLORS };

