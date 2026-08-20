import { NextResponse } from "next/server";
import { youtubeGet } from "@/lib/youtube-live";
import { groqGenerateJSON } from "@/lib/gemini";
import { normalizeInputText } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const category = normalizeInputText(searchParams.get("category") || "all").toLowerCase();

        // Map categories to YouTube videoCategoryId
        // 20 = Gaming, 28 = Science & Tech, 27 = Education, 24 = Entertainment/Lifestyle, 10 = Music, 26 = Howto
        const categoryMap: Record<string, string | undefined> = {
            all: undefined,
            gaming: "20",
            tech: "28",
            education: "27",
            lifestyle: "24",
            entertainment: "24",
            music: "10",
            howto: "26",
        };

        const categoryId = categoryMap[category];
        let videoItems: Array<{
            id: string;
            snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string };
            statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
        }> = [];

        // 1. Fetch Real YouTube Most Popular Chart
        try {
            const queryParams: Record<string, string> = {
                part: "snippet,statistics",
                chart: "mostPopular",
                regionCode: "US",
                maxResults: "30",
            };
            if (categoryId) {
                queryParams.videoCategoryId = categoryId;
            }

            const chartRes = await youtubeGet<{
                items: Array<{
                    id: string;
                    snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string };
                    statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
                }>;
            }>("videos", queryParams);

            if (chartRes?.items && chartRes.items.length > 0) {
                videoItems = chartRes.items;
            }
        } catch (chartErr) {
            console.warn("[Outliers] MostPopular chart query failed, falling back to search:", chartErr);
        }

        // If chart returned empty or failed (e.g. for custom categories like 'business'), use search
        if (videoItems.length === 0) {
            const searchRes = await youtubeGet<{
                items: Array<{ id: { videoId?: string } }>;
            }>("search", {
                part: "id",
                q: category === "all" ? "trending viral" : `${category} viral`,
                maxResults: "25",
                order: "viewCount",
                type: "video",
            });

            const videoIds = searchRes.items.map((item) => item.id.videoId).filter(Boolean) as string[];
            if (videoIds.length > 0) {
                const detailsRes = await youtubeGet<{
                    items: Array<{
                        id: string;
                        snippet: { title: string; channelId: string; channelTitle: string; publishedAt: string };
                        statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
                    }>;
                }>("videos", {
                    part: "snippet,statistics",
                    id: videoIds.join(","),
                });
                videoItems = detailsRes.items || [];
            }
        }

        if (videoItems.length === 0) {
            return NextResponse.json({ results: [] });
        }

        // 2. Fetch Channel Subscriber Counts in Batch (1 API call)
        const channelIds = Array.from(new Set(videoItems.map((v) => v.snippet.channelId)));
        const channelSubscribers = new Map<string, number>();

        try {
            const channelsRes = await youtubeGet<{
                items: Array<{
                    id: string;
                    statistics: { subscriberCount?: string };
                }>;
            }>("channels", {
                part: "statistics",
                id: channelIds.slice(0, 50).join(","),
            });

            channelsRes.items.forEach((c) => {
                channelSubscribers.set(c.id, parseInt(c.statistics.subscriberCount || "0", 10));
            });
        } catch (chanErr) {
            console.warn("[Outliers] Channel subscriber fetch failed:", chanErr);
        }

        const formatCount = (value: number) => {
            if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
            if (value >= 1_000) return `${(value / 1000).toFixed(1)}K`;
            return value.toString();
        };

        // 3. Calculate mathematical velocity and outlier multiplier
        const processedVideos = videoItems.map((video, index) => {
            const views = parseInt(video.statistics.viewCount || "0", 10);
            const subs = channelSubscribers.get(video.snippet.channelId) || 0;
            const publishedAt = new Date(video.snippet.publishedAt);
            const uploadedDays = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24)));

            // Baseline expected views: 15% of subscriber count or 5K minimum
            const expectedViews = Math.max(5000, Math.floor(subs * 0.15));
            const multiplierNum = views > 0 ? views / Math.max(expectedViews, 1000) : 1;
            const multiplierStr = multiplierNum >= 10 ? `${multiplierNum.toFixed(1)}x` : `${multiplierNum.toFixed(2)}x`;

            // Velocity score = (views / uploadedDays) normalized
            const velocityScore = Math.min(99, Math.max(60, Math.round(55 + Math.min(35, multiplierNum * 3) + Math.min(10, 20 / uploadedDays))));

            return {
                id: index + 1,
                title: video.snippet.title,
                channel: video.snippet.channelTitle,
                cat: category,
                views,
                subs,
                expectedViews,
                multiplierNum,
                multiplierStr,
                uploadedDays,
                velocityScore,
            };
        });

        // Sort by Time-Decayed Outlier Score (Recent Viral > Ancient Viral)
        processedVideos.sort((a, b) => {
            // Decay function: -0.015 gives ~50% penalty at 45 days, ~90% penalty at 150 days.
            // This ensures a 30x multiplier from 5 years ago doesn't beat a 5x multiplier from today.
            const scoreA = a.multiplierNum * Math.exp(-0.015 * a.uploadedDays);
            const scoreB = b.multiplierNum * Math.exp(-0.015 * b.uploadedDays);
            return scoreB - scoreA;
        });
        const topOutliers = processedVideos.slice(0, 10);

        // 4. Pass Real Trending Videos to Groq AI for Strategic Deep Dive
        try {
            const prompt = `You are a YouTube viral growth strategist.
Analyze these ${topOutliers.length} real trending videos from the "${category}" category on YouTube:
${JSON.stringify(
    topOutliers.map((v) => ({
        title: v.title,
        channel: v.channel,
        views: formatCount(v.views),
        subscribers: formatCount(v.subs),
        uploadedDaysAgo: v.uploadedDays,
        multiplier: v.multiplierStr,
    }))
)}

For each video, provide:
1. "reason": A sharp, 1-2 sentence analysis of WHY this video outperformed (e.g. curiosity gap in title, extreme stakes, current trending event, high-retention hook).
2. "emoji": A single relevant emoji (🔥, 🚀, 💡, ⚡, 🤯, 🎯).

Return ONLY a JSON array with objects matching:
[
  {
    "title": "string",
    "reason": "string",
    "emoji": "string"
  }
]`;

            const aiAnalysis = await groqGenerateJSON<Array<{ title: string; reason: string; emoji: string }>>(prompt);
            const analysisMap = new Map<string, { reason: string; emoji: string }>();

            if (Array.isArray(aiAnalysis)) {
                aiAnalysis.forEach((item) => {
                    if (item.title) {
                        analysisMap.set(item.title.toLowerCase(), { reason: item.reason, emoji: item.emoji || "🔥" });
                    }
                });
            }

            const finalResults = topOutliers.map((v, idx) => {
                const aiItem = analysisMap.get(v.title.toLowerCase());
                return {
                    id: idx + 1,
                    title: v.title,
                    channel: v.channel,
                    cat: category,
                    emoji: aiItem?.emoji || (v.multiplierNum > 5 ? "🔥" : "📈"),
                    views: formatCount(v.views),
                    expectedViews: formatCount(v.expectedViews),
                    multiplier: v.multiplierStr,
                    uploadedDays: v.uploadedDays,
                    subscribers: formatCount(v.subs),
                    viralScore: v.velocityScore,
                    reason:
                        aiItem?.reason ||
                        (v.multiplierNum > 4
                            ? `Exceptional velocity! This video is generating ${v.multiplierStr} more views than the channel's standard baseline due to strong organic search and recommendation distribution.`
                            : `Strong algorithmic momentum driven by high first-day engagement and audience retention.`),
                };
            });

            return NextResponse.json({ results: finalResults }, {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
                },
            });
        } catch (aiErr) {
            console.warn("[Outliers] Groq strategic reasoning failed, formatting direct data:", aiErr);
            const fallbackResults = topOutliers.map((v, idx) => ({
                id: idx + 1,
                title: v.title,
                channel: v.channel,
                cat: category,
                emoji: v.multiplierNum > 5 ? "🔥" : "📈",
                views: formatCount(v.views),
                expectedViews: formatCount(v.expectedViews),
                multiplier: v.multiplierStr,
                uploadedDays: v.uploadedDays,
                subscribers: formatCount(v.subs),
                viralScore: v.velocityScore,
                reason: `Video achieved a ${v.multiplierStr} view surge relative to the creator's subscriber size (${formatCount(v.subs)} subs).`,
            }));

            return NextResponse.json({ results: fallbackResults });
        }
    } catch (error) {
        console.error("Error in live outliers route:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to fetch live outlier data" },
            { status: 500 }
        );
    }
}
