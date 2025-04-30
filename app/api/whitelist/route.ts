import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Cache to prevent abuse (stores username: timestamp pairs)
const requestCache = new Map<string, number>();
const MAX_REQUESTS_PER_WINDOW = 1000; // 1000 requests per 5 minutes
const CACHE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of requestCache.entries()) {
    if (now - timestamp > CACHE_WINDOW_MS) {
      requestCache.delete(key);
    }
  }
}, 60 * 1000); // Run cleanup every minute

export async function GET(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check rate limiting
    const requestKey = `${ip}`;
    const requestCount = getRequestCount(requestKey);

    if (requestCount > MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Get username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Validate input
    if (!username) {
      return NextResponse.json(
        { error: 'Missing username parameter' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Validate username format (basic Discord username validation)
    // Discord usernames can have letters, numbers, and some special characters
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Invalid username format' },
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Sanitize input (prevent SQL injection and other attacks)
    const sanitizedUsername = sanitizeUsername(username);

    // Create Supabase client
    const supabase = await createClient();

    // Query the discord_whitelist table
    const { error } = await supabase
      .from('discord_whitelist')
      .select('username')
      .eq('username', sanitizedUsername)
      .single();

    if (error) {
      // If the error is PGRST116 (not found), return false for "not whitelisted"
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { whitelisted: false },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
            },
          }
        );
      }

      // For other errors, return error status
      console.error('Error checking whitelist:', error);
      return NextResponse.json(
        { error: 'Failed to check whitelist' },
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
          },
        }
      );
    }

    // Return result
    return NextResponse.json(
      { whitelisted: true },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  } catch (err) {
    console.error('Unexpected error checking whitelist:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
        },
      }
    );
  }
}

// Helper function to check and increment request count
function getRequestCount(key: string): number {
  const now = Date.now();
  const currentCount = requestCache.get(key) || 0;
  requestCache.set(key, currentCount + 1);
  return currentCount + 1;
}

// Helper function to validate username format
function isValidUsername(username: string): boolean {
  // Basic username validation
  // Discord usernames are between 2-32 characters
  if (username.length < 2 || username.length > 32) {
    return false;
  }

  // Check for valid characters (letters, numbers, and some special chars)
  // This is a basic check - Discord's actual rules may be more complex
  const validRegex = /^[a-zA-Z0-9_\.]+$/;
  return validRegex.test(username);
}

// Helper function to sanitize username
function sanitizeUsername(username: string): string {
  // Basic sanitization
  return username.trim();
}
