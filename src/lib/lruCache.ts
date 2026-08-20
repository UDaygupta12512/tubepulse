import crypto from "crypto";

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

/**
 * A lightweight, generic LRU (Least Recently Used) cache.
 * Automatically evicts the oldest entry when capacity is reached.
 * All entries expire after `ttlMs` milliseconds (default: 24 hours).
 */
export class LRUCache<T> {
    private cache: Map<string, CacheEntry<T>>;
    private readonly capacity: number;
    private readonly ttlMs: number;

    constructor(capacity = 200, ttlMs = 24 * 60 * 60 * 1000) {
        this.cache = new Map();
        this.capacity = capacity;
        this.ttlMs = ttlMs;
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        // Evict if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (most recently used) by re-inserting
        this.cache.delete(key);
        this.cache.set(key, entry);
        return entry.value;
    }

    set(key: string, value: T): void {
        // Evict the least recently used entry if at capacity
        if (this.cache.size >= this.capacity) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    size(): number {
        return this.cache.size;
    }
}

/**
 * Generate a stable SHA-256 hash from an object of parameters.
 * Used as the cache key to uniquely identify an AI prompt.
 */
export function hashParams(params: Record<string, string>): string {
    const normalized = Object.keys(params)
        .sort()
        .filter((k) => params[k]) // exclude empty values
        .map((k) => `${k}=${params[k].toLowerCase().trim()}`)
        .join("&");
    return crypto.createHash("sha256").update(normalized).digest("hex");
}

// Singleton cache instances — one per AI tool
// These live in server memory for the lifetime of the Next.js process
export const contentCache = new LRUCache<unknown>(200);
export const scriptCache = new LRUCache<unknown>(200);
export const keywordsCache = new LRUCache<unknown>(300);
