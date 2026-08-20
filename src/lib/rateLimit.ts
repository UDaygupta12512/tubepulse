type RateLimitStore = {
    [ip: string]: {
        count: number;
        resetTime: number;
    }
};

const store: RateLimitStore = {};

export function rateLimit(ip: string, limit = 15, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries to prevent memory leaks
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < windowStart) {
            delete store[key];
        }
    });

    if (!store[ip]) {
        store[ip] = {
            count: 1,
            resetTime: now
        };
        return { success: true };
    }

    if (store[ip].resetTime < windowStart) {
        store[ip].count = 1;
        store[ip].resetTime = now;
        return { success: true };
    }

    store[ip].count += 1;

    if (store[ip].count > limit) {
        return { success: false };
    }

    return { success: true };
}
