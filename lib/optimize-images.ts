'use client';

// Helper functions to optimize image loading across the application

// Preload avatar images to speed up navigation experience
export function preloadAvatars(avatarUrls: string[]) {
  if (typeof window === 'undefined') return;
  
  avatarUrls.forEach(url => {
    if (!url) return;
    
    const img = new Image();
    img.src = url;
    
    // Use low priority to avoid competing with critical resources
    if ('fetchPriority' in HTMLImageElement.prototype) {
      // Using type assertion to HTMLImageElement with fetchPriority
      (img as HTMLImageElement & { fetchPriority: string }).fetchPriority = 'low';
    }
  });
}

// Prepare avatar URL with proper dimensions for faster loading
export function optimizeAvatarUrl(url: string | null, size = 48): string {
  if (!url) return '';
  
  // Skip optimization for URLs that can't be optimized
  if (url.startsWith('data:') || !url.includes('://')) {
    return url;
  }
  
  // Try to add sizing parameters to common image providers
  if (url.includes('githubusercontent.com')) {
    // GitHub avatar optimization
    return url.includes('?') ? `${url}&s=${size}` : `${url}?s=${size}`;
  } else if (url.includes('googleusercontent.com')) {
    // Google avatar optimization
    return url.includes('=') ? url : `${url}=s${size}-c`;
  } else if (url.includes('supabase.co')) {
    // Supabase storage optimization
    const width = size;
    const height = size;
    return `${url}?width=${width}&height=${height}&resize=fill`;
  }
  
  // Return original URL for other cases
  return url;
}
