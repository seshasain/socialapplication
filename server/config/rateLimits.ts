import { RateLimiter } from 'limiter';

export interface PlatformRateLimit {
  postsPerHour: number;
  postsPerDay: number;
  mediaUploadLimit: number; // in MB
  apiCallsPerHour: number;
}

export const PLATFORM_RATE_LIMITS: Record<string, PlatformRateLimit> = {
  twitter: {
    postsPerHour: 300,
    postsPerDay: 2400,
    mediaUploadLimit: 512,
    apiCallsPerHour: 500
  },
  instagram: {
    postsPerHour: 25,
    postsPerDay: 100,
    mediaUploadLimit: 100,
    apiCallsPerHour: 200
  },
  facebook: {
    postsPerHour: 50,
    postsPerDay: 500,
    mediaUploadLimit: 4096,
    apiCallsPerHour: 400
  },
  linkedin: {
    postsPerHour: 30,
    postsPerDay: 100,
    mediaUploadLimit: 5120,
    apiCallsPerHour: 300
  },
  threads: {
    postsPerHour: 20,
    postsPerDay: 100,
    mediaUploadLimit: 100,
    apiCallsPerHour: 150
  }
};

// Create rate limiters for each platform
export const platformRateLimiters = Object.entries(PLATFORM_RATE_LIMITS).reduce((acc, [platform, limits]) => {
  acc[platform] = {
    hourly: new RateLimiter({
      tokensPerInterval: limits.postsPerHour,
      interval: 'hour'
    }),
    daily: new RateLimiter({
      tokensPerInterval: limits.postsPerDay,
      interval: 'day'
    }),
    api: new RateLimiter({
      tokensPerInterval: limits.apiCallsPerHour,
      interval: 'hour'
    })
  };
  return acc;
}, {} as Record<string, {
  hourly: RateLimiter;
  daily: RateLimiter;
  api: RateLimiter;
}>);

export async function checkRateLimit(platform: string, type: 'post' | 'api' = 'post'): Promise<boolean> {
  const limiter = platformRateLimiters[platform];
  if (!limiter) {
    throw new Error(`Unknown platform: ${platform}`);
  }

  try {
    // Check both hourly and daily limits for posts
    if (type === 'post') {
      const [hourlyOk, dailyOk] = await Promise.all([
        limiter.hourly.tryRemoveTokens(1),
        limiter.daily.tryRemoveTokens(1)
      ]);
      return hourlyOk && dailyOk;
    }
    // Check only API rate limit
    return await limiter.api.tryRemoveTokens(1);
  } catch (error) {
    console.error(`Rate limit check failed for ${platform}:`, error);
    return false;
  }
}

export function getRateLimitInfo(platform: string): PlatformRateLimit | undefined {
  return PLATFORM_RATE_LIMITS[platform];
}

export function validateMediaUpload(platform: string, sizeInMB: number): boolean {
  const limits = PLATFORM_RATE_LIMITS[platform];
  if (!limits) {
    return false;
  }
  return sizeInMB <= limits.mediaUploadLimit;
} 