/**
 * Generates consistent user initials for avatar fallbacks
 * Performs Unicode normalization and special character handling
 * to ensure consistent rendering between server and client
 * @param name The user's name
 * @param fallback The fallback value to use if no initials can be generated
 * @returns The normalized initials
 */
export function getInitials(name: string | null | undefined, fallback = 'NS'): string {
  // Always return a fallback for empty, null or non-string values
  if (!name || typeof name !== 'string') return fallback;
  
  try {
    // Normalize the string to handle Unicode characters consistently
    // and ensure ASCII-only output to prevent hydration mismatches
    const normalized = name
      .trim()
      .normalize('NFKD')          // Normalize Unicode
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII
      .replace(/[^\w\s]/g, '')      // Remove special characters
      .trim();
      
    // If normalization resulted in an empty string, return fallback
    if (!normalized) return fallback;
      
    // Use a deterministic approach that will render the same on server and client
    const parts = normalized.split(/\s+/);
    let initials = '';
      
    // Take first letter of first two parts
    for (let i = 0; i < Math.min(parts.length, 2); i++) {
      if (parts[i].length > 0) {
        initials += parts[i].charAt(0).toUpperCase();
      }
    }
      
    // Ensure we have at least 1-2 characters
    if (initials.length === 0) {
      // Just use first 2 chars of first non-empty part
      for (const part of parts) {
        if (part.length > 0) {
          initials = part.substring(0, 2).toUpperCase();
          break;
        }
      }
    } else if (initials.length === 1) {
      // If we only got one initial, duplicate it
      initials += initials;
    }
      
    return initials || fallback;
  } catch {
    // Failsafe return value
    return fallback;
  }
}
