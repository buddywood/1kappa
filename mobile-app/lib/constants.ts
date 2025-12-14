// Color constants matching frontend design system
export const COLORS = {
  crimson: "#9B111E",
  cream: "#F7F4E9",
  midnightNavy: "#0D0D0F",
  auroraGold: "#C6A664",
  frostGray: "#D8D8D8",
  white: "#FFFFFF",
  black: "#000000",
};

// API base URL - defaults to production, override with EXPO_PUBLIC_API_URL for local development
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://onekappa.herokuapp.com";

// Web app URL for deep linking - defaults to production, override with EXPO_PUBLIC_WEB_URL for local development
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || "https://www.one-kappa.com";

// Log configuration on import (helpful for debugging)
if (__DEV__) {
  console.log("[Mobile App Config] API_URL:", API_URL);
  console.log("[Mobile App Config] WEB_URL:", WEB_URL);
  console.log("[Mobile App Config] Using environment variable:", {
    apiUrl: !!process.env.EXPO_PUBLIC_API_URL,
    webUrl: !!process.env.EXPO_PUBLIC_WEB_URL,
  });
}

// Cognito Configuration
export const COGNITO_USER_POOL_ID =
  process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID || "";
export const COGNITO_CLIENT_ID =
  process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID || "";
