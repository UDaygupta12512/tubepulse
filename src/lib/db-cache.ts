import fs from "fs";
import path from "path";

// Define the shape of our cached data
interface CacheEntry<T> {
    data: T;
    updatedAt: number;
}

interface CacheStore {
    [key: string]: CacheEntry<any>;
}

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(DATA_DIR, "youtube-cache.json");

function ensureCacheFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CACHE_FILE)) {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({}), "utf-8");
    }
}

/**
 * Get an item from the persistent file-based cache.
 * @param key The unique key (e.g., channel ID)
 * @param ttlMs Time-To-Live in milliseconds (e.g., 6 hours = 6 * 60 * 60 * 1000)
 */
export function getPersistentCache<T>(key: string, ttlMs: number): T | null {
    try {
        ensureCacheFile();
        const fileContent = fs.readFileSync(CACHE_FILE, "utf-8");
        const cache: CacheStore = JSON.parse(fileContent);

        const entry = cache[key];
        if (!entry) return null;

        const isExpired = Date.now() - entry.updatedAt > ttlMs;
        if (isExpired) {
            // It's stale, but in a real SWR pattern we might return it while fetching fresh.
            // For simplicity and strict limits, we return null to force a fresh fetch.
            return null;
        }

        return entry.data as T;
    } catch (error) {
        console.error("[db-cache] Error reading cache:", error);
        return null;
    }
}

/**
 * Save an item to the persistent file-based cache.
 */
export function setPersistentCache<T>(key: string, data: T): void {
    try {
        ensureCacheFile();
        const fileContent = fs.readFileSync(CACHE_FILE, "utf-8");
        const cache: CacheStore = JSON.parse(fileContent);

        cache[key] = {
            data,
            updatedAt: Date.now(),
        };

        fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
    } catch (error) {
        console.error("[db-cache] Error writing to cache:", error);
    }
}

/**
 * Wrapper to fetch data, checking the persistent cache first.
 * If cache misses, calls the fetcher and caches the result.
 */
export async function withPersistentCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = 6 * 60 * 60 * 1000 // default 6 hours
): Promise<{ data: T; fromCache: boolean }> {
    const cached = getPersistentCache<T>(key, ttlMs);
    
    if (cached) {
        console.log(`[db-cache] ⚡ Persistent Cache HIT for key: ${key}`);
        return { data: cached, fromCache: true };
    }

    console.log(`[db-cache] 🔍 Cache MISS for key: ${key}. Fetching fresh...`);
    const freshData = await fetcher();
    
    // Only cache if the fetcher returned something valid
    if (freshData) {
        setPersistentCache(key, freshData);
    }
    
    return { data: freshData, fromCache: false };
}
