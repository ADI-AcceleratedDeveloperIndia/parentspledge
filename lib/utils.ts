import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// Rate limiting helper - Enhanced for high-scale deployment
// Note: For 20 lakh concurrent users, consider Redis-based distributed rate limiting
// Current implementation works for single-server deployments and Vercel's edge functions
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_MAP_SIZE = 100000; // Prevent memory leaks

export function checkRateLimit(identifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  
  // Clean up if map gets too large (prevent memory issues)
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const entriesToDelete: string[] = [];
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        entriesToDelete.push(key);
      }
    }
    entriesToDelete.forEach(key => rateLimitMap.delete(key));
    
    // If still too large, clear oldest 50%
    if (rateLimitMap.size > MAX_MAP_SIZE) {
      const sorted = Array.from(rateLimitMap.entries())
        .sort((a, b) => a[1].resetTime - b[1].resetTime);
      sorted.slice(0, Math.floor(sorted.length / 2))
        .forEach(([key]) => rateLimitMap.delete(key));
    }
  }
  
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit entries periodically (every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}




