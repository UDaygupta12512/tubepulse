/**
 * Shared in-memory store for Content & Script generation history.
 * Stores up to 50 items per user, most recent first.
 */

export interface ContentHistoryItem {
    id: string;
    userId: string;
    type: "content" | "script";
    topic: string;
    tone?: string;       // for content
    style?: string;      // for script
    duration?: string;   // for script
    result: Record<string, unknown>;
    createdAt: string;
}

const store = new Map<string, ContentHistoryItem[]>();

const MAX_ITEMS_PER_USER = 50;

export function addHistoryItem(item: ContentHistoryItem): void {
    const key = `${item.userId}:${item.type}`;
    const existing = store.get(key) ?? [];
    // Prepend the new item and limit to max
    const updated = [item, ...existing].slice(0, MAX_ITEMS_PER_USER);
    store.set(key, updated);
}

export function getHistoryForUser(userId: string, type: "content" | "script"): ContentHistoryItem[] {
    return store.get(`${userId}:${type}`) ?? [];
}
