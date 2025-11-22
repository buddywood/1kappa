// Color constants matching frontend design system
export const COLORS = {
  crimson: '#9B111E',
  cream: '#F7F4E9',
  midnightNavy: '#0D0D0F',
  auroraGold: '#C6A664',
  frostGray: '#D8D8D8',
  white: '#FFFFFF',
  black: '#000000',
};

// API base URL - defaults to localhost for development
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Web app URL for deep linking
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'http://localhost:3000';

// Cognito Configuration
export const COGNITO_USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || '';
export const COGNITO_CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || '';


