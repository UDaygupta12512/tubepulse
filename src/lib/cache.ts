/**
 * A strict LRU (Least Recently Used) in-memory cache for API and AI responses.
 * Prevents memory leaks by automatically evicting the oldest data when the 
 * maximum size limit is reached.
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class LRUCache {
    private cache = new Map<string, CacheEntry<any>>();
    private readonly maxSize: number;

    constructor(maxSize: number = 500) {
        this.maxSize = maxSize;
    }

    /**
     * Get an item from the cache. Updates its "recently used" status.
     * Returns null if missing or expired.
     */
    get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key); // Evict expired
            return null;
        }

        // LRU magic: delete and re-insert to move this key to the "most recently used" end
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.data as T;
    }

    /**
     * Set an item in the cache. Evicts oldest if max size is exceeded.
     */
    set<T>(key: string, data: T, ttlMs: number = 24 * 60 * 60 * 1000): void {
        // If it exists, delete it first so it gets re-inserted at the end
        if (this.cache.has(key)) {
            this.cache.delete(key);
        }

        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });

        // LRU Eviction Check: If over limit, delete the first item (oldest/least recently used)
        if (this.cache.size > this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
    }

    /**
     * Clear the cache entirely.
     */
    clear(): void {
        this.cache.clear();
    }
}

// Export a singleton instance with a strict limit of 500 cached requests
export const appCache = new LRUCache(500);

/**
 * A helper to automatically cache async function calls.
 */
export async function withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 24 * 60 * 60 * 1000 // default 24 hours
): Promise<T> {
    const cached = appCache.get<T>(key);
    if (cached) {
        return cached;
    }

    const data = await fetcher();
    appCache.set(key, data, ttlMs);
    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Waterfall Cache — the core of our API-protection architecture
// ─────────────────────────────────────────────────────────────────────────────

export interface WaterfallResult<T> {
    data: T;
    /** Where the data actually came from */
    source: "cache" | "scraper" | "youtube_api" | "groq" | "fallback";
    /** True if served from cache (no external call was made) */
    fromCache: boolean;
}

/**
 * withWaterfall — Implements the 3-tier data strategy:
 *   1. In-memory cache (instant, 0 API tokens)
 *   2. Primary fetcher (e.g. web scraper — 0 API tokens)
 *   3. Backup fetcher (e.g. official YouTube API — uses API quota)
 *
 * @param key         Unique cache key for this request
 * @param primary     Fast/free fetcher (scraper). Should return null on failure.
 * @param backup      Fallback fetcher (official API). Always returns data.
 * @param ttlMs       Cache TTL in ms (default: 6 hours for channel data)
 */
export async function withWaterfall<T>(
    key: string,
    primary: () => Promise<T | null>,
    backup: () => Promise<T>,
    ttlMs: number = 6 * 60 * 60 * 1000 // 6 hours
): Promise<WaterfallResult<T>> {
    // Step 1: Check in-memory cache
    const cached = appCache.get<T>(key);
    if (cached !== null) {
        console.log(`[waterfall] ✅ Cache HIT: ${key}`);
        return { data: cached, source: "cache", fromCache: true };
    }

    // Step 2: Try primary (scraper — zero API cost)
    try {
        console.log(`[waterfall] 🔍 Cache MISS — trying scraper for: ${key}`);
        const scraped = await primary();
        if (scraped !== null) {
            appCache.set(key, scraped, ttlMs);
            console.log(`[waterfall] 🌐 Scraper SUCCESS for: ${key}`);
            return { data: scraped, source: "scraper", fromCache: false };
        }
    } catch (err) {
        console.warn(`[waterfall] ⚠️ Scraper failed for ${key}:`, err);
    }

    // Step 3: Fallback to official API (uses quota — last resort)
    console.log(`[waterfall] 🔑 Falling back to YouTube API for: ${key}`);
    const apiData = await backup();
    appCache.set(key, apiData, ttlMs);
    return { data: apiData, source: "youtube_api", fromCache: false };
}
