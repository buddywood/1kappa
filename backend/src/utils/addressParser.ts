/**
 * Parse city and state from a location string
 * Handles various formats like:
 * - "123 Main St, New York, NY 10001"
 * - "123 Main St, New York, NY"
 * - "New York, NY"
 */
export function parseCityAndState(location: string): {
  city: string | null;
  state: string | null;
} {
  if (!location || !location.trim()) {
    return { city: null, state: null };
  }

  // US state abbreviations (2 letters)
  const stateAbbreviations = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
    "DC"
  ];

  // Try to extract state (usually at the end, 2 letters)
  let state: string | null = null;
  let city: string | null = null;

  // Split by comma and process from the end
  const parts = location.split(",").map((p) => p.trim()).filter(Boolean);

  if (parts.length >= 2) {
    // Look for state in the last part (could be "NY" or "NY 10001")
    const lastPart = parts[parts.length - 1];
    const stateMatch = lastPart.match(/\b([A-Z]{2})\b/);
    
    if (stateMatch && stateAbbreviations.includes(stateMatch[1])) {
      state = stateMatch[1];
      
      // City is usually the second-to-last part
      if (parts.length >= 2) {
        city = parts[parts.length - 2];
      }
    } else {
      // If no state abbreviation found, try the last part as city
      // and second-to-last as state (for full state names)
      if (parts.length >= 2) {
        city = parts[parts.length - 2];
        // Check if last part looks like a state name
        const lastPartLower = lastPart.toLowerCase();
        if (lastPartLower.length > 2 && lastPartLower.length < 20) {
          // Might be a full state name, but we'll leave state as null
          // and let it be parsed by geocoding if needed
        }
      }
    }
  } else if (parts.length === 1) {
    // Single part - might be just city or just address
    // Try to extract state if present
    const stateMatch = parts[0].match(/\b([A-Z]{2})\b/);
    if (stateMatch && stateAbbreviations.includes(stateMatch[1])) {
      state = stateMatch[1];
      // Extract city part before state
      const beforeState = parts[0].substring(0, stateMatch.index).trim();
      if (beforeState) {
        city = beforeState.split(/\s+/).pop() || null;
      }
    }
  }

  return { city, state };
}

