import { NextResponse } from "next/server";
import { youtubeGet } from "@/lib/youtube-live";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");
        const filter = searchParams.get("filter") || "all";

        if (!query) {
            return NextResponse.json({ message: "Query parameter 'q' is required" }, { status: 400 });
        }

        // 1. Search YouTube for videos matching the query
        const searchRes = await youtubeGet<{
            items: Array<{ id: { videoId?: string } }>;
        }>("search", {
            part: "id",
            q: query,
            maxResults: "25",
            order: "relevance",
            type: "video",
        });

        const videoIds = searchRes.items.map((item) => item.id.videoId).filter(Boolean) as string[];
        
        if (videoIds.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // 2. Fetch statistics and thumbnails for these videos
        const videosRes = await youtubeGet<{
            items: Array<{
                id: string;
                snippet: {
                    title: string;
                    publishedAt: string;
                    thumbnails: {
                        high?: { url: string };
                        medium?: { url: string };
                        default?: { url: string };
                    };
                };
                statistics: {
                    viewCount?: string;
                    likeCount?: string;
                    commentCount?: string;
                };
            }>;
        }>("videos", {
            part: "snippet,statistics",
            id: videoIds.join(","),
        });

        // 3. Map to ThumbnailSearchResult
        let results = videosRes.items.map((video, index) => {
            const views = Number(video.statistics.viewCount || 0);
            const likes = Number(video.statistics.likeCount || 0);
            const comments = Number(video.statistics.commentCount || 0);
            
            // Calculate a proxy CTR/Engagement Score
            const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;
            // Since we can't get real CTR from Data API, we estimate it based on engagement
            const ctrNum = Math.min(16, Math.max(2.5, 3 + engagementRate * 0.8));
            
            // Format views
            const formatCountInK = (value: number) => {
                return value >= 1_000_000
                    ? `${(value / 1_000_000).toFixed(1)}M`
                    : value >= 1_000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
            };

            const publishedAt = new Date(video.snippet.publishedAt);
            const daysAgo = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)));

            // Basic AI score estimation based on engagement + recency
            const score = Math.min(99, Math.max(50, Math.round(50 + engagementRate * 5 + (30 / daysAgo))));

            const thumbnailUrl = video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url || "";

            return {
                id: video.id,
                title: video.snippet.title,
                views: formatCountInK(views),
                ctr: `${ctrNum.toFixed(1)}%`,
                ctrNum,
                thumbnailUrl,
                score,
                daysAgo,
            };
        });

        // Apply filters
        if (filter === "high-ctr") {
            results = results.filter((r) => r.ctrNum > 9);
        } else if (filter === "trending") {
            results = results.filter((r) => r.daysAgo < 14);
        } else if (filter === "recent") {
            results = results.sort((a, b) => a.daysAgo - b.daysAgo);
        }

        // Sort by score descending for default view
        if (filter === "all") {
            results = results.sort((a, b) => b.score - a.score);
        }

        // --- Semantic Power Word Extraction ---
        // We run the titles through our NLP TF-IDF engine to extract the actual power words carrying these videos
        const { extractKeywordsTFIDF } = await import("@/lib/nlp");
        const titles = results.map(r => r.title);
        const tfidfWords = extractKeywordsTFIDF(titles, 5);
        const powerWords = tfidfWords.map(w => w.keyword.toUpperCase());

        return NextResponse.json({ results, powerWords }, {
            status: 200,
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
            }
        });
    } catch (error) {
        console.error("Error in thumbnail search:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to fetch thumbnail search data" },
            { status: 500 }
        );
    }
}
