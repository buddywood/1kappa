/**
 * Formats an array of strings into a human-readable list with proper punctuation and conjunctions.
 * 
 * Examples:
 * - [] -> ""
 * - ["A"] -> "A"
 * - ["A", "B"] -> "A and B"
 * - ["A", "B", "C"] -> "A, B, and C"
 */
export function formatList(items: string[]): string {
  if (!items || items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1);
  return `${otherItems.join(", ")}, and ${lastItem}`;
}
