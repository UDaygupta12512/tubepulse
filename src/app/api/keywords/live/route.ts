import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeInputText } from "@/lib/utils";
import { appCache } from "@/lib/cache";
import { stableHash } from "@/lib/nlp";

export const dynamic = "force-dynamic";

function hashInRange(seed: string, min: number, max: number): number {
    if (max <= min) return min;
    return min + (stableHash(seed) % (max - min + 1));
}

/**
 * Estimate search volume heuristics mathematically from autocomplete rank position:
 * - Rank 0 (top autocomplete result) = highest volume
 * - Volume drops logarithmically as rank increases
 */
function estimateVolume(keyword: string, rank: number): string {
    const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = tokens.length;

    const baseVolume = Math.max(5, 1800 - rank * 140 - (wordCount - 1) * 90);
    const variation = hashInRange(keyword + "|vol", -30, 50);
    const volumeK = Math.max(5, Math.round(baseVolume + variation));

    if (volumeK >= 1000) return `${(volumeK / 1000).toFixed(1)}M`;
    return `${volumeK}K`;
}

/**
 * Estimate competition level (0-100) mathematically
 */
function estimateCompetition(keyword: string, rank: number): number {
    const tokens = keyword.toLowerCase().split(/\s+/).filter(Boolean);
    const wordCount = tokens.length;

    const base = Math.max(15, 92 - rank * 8 - (wordCount - 1) * 7);
    const variation = hashInRange(keyword + "|comp", -6, 6);
    return Math.min(95, Math.max(12, Math.round(base + variation)));
}

/**
 * Estimate trend growth rate mathematically
 */
function estimateTrend(keyword: string, rank: number): number {
    const base = Math.max(8, 65 - rank * 4);
    const variation = hashInRange(keyword + "|trend", -10, 20);
    return Math.max(8, Math.min(160, Math.round(base + variation)));
}

const EMOJIS = ["🔥", "📈", "💡", "🚀", "🎯", "⚡", "🔍", "💎", "🎬", "📱", "✨", "🔑"];

export async function GET(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(ip, 15, 60000); // 15 requests per minute
    if (!success) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }
    
    try {
        const { searchParams } = new URL(req.url);
        const query = normalizeInputText(searchParams.get("q") || "");

        if (!query) {
            return NextResponse.json({ message: "Query parameter 'q' is required" }, { status: 400 });
        }

        const cacheKey = `keyword_suggest_${query.toLowerCase()}`;
        const cached = appCache.get<any[]>(cacheKey);
        if (cached) {
            return NextResponse.json({ results: cached }, {
                headers: { "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" },
            });
        }

        // Fetch real autocomplete suggestions from YouTube's suggestion API (Zero API key cost)
        const ytSuggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
        const res = await fetch(ytSuggestUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        if (!res.ok) {
            throw new Error(`YouTube Suggest API returned status: ${res.status}`);
        }

        const data = await res.json();
        const suggestions: string[] = data[1] || [];

        if (suggestions.length === 0) {
            // Fallback suggestions derived from root query
            suggestions.push(query, `${query} tutorial`, `${query} 2026`, `${query} tips`, `${query} for beginners`);
        }

        // Run Pure Local Mathematical Modeling Engine (0 LLM tokens, instantaneous <5ms)
        const results = suggestions.slice(0, 12).map((keyword, index) => {
            const competition = estimateCompetition(keyword, index);
            const trendVal = estimateTrend(keyword, index);
            const volume = estimateVolume(keyword, index);

            const difficulty: "High" | "Medium" | "Low" = competition > 70 ? "High" : competition > 42 ? "Medium" : "Low";
            const trendBoost = Math.round(trendVal * 0.08);
            const opportunity = Math.min(99, Math.max(20, 100 - competition + trendBoost));
            const emoji = EMOJIS[stableHash(keyword) % EMOJIS.length];

            return {
                keyword,
                volume,
                difficulty,
                trend: `+${trendVal}%`,
                competition,
                opportunity,
                emoji,
            };
        });

        // Cache result in memory for 6 hours
        appCache.set(cacheKey, results, 6 * 60 * 60 * 1000);

        return NextResponse.json({ results }, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("Error in keyword search:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to fetch keyword data" },
            { status: 500 }
        );
    }
}
