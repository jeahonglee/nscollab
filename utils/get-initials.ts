// Helper function to get initials from a name or fallback
export function getInitials(name: string | null | undefined, fallback: string = 'NS'): string {
    try {
      if (name && typeof name === 'string') {
        const parts = name.trim().split(/\s+/);
        const initials = parts
          .filter(part => part.length > 0)
          .map(part => part.charAt(0))
          .join('')
          .toUpperCase()
          .substring(0, 2);

        return initials || fallback;
      }
      return fallback;
    } catch {
      // Failsafe
      return fallback;
    }
  }
