import { NextResponse } from "next/server";
import { youtubeGet, resolveChannelId } from "@/lib/youtube-live";
import { groqGenerateJSON } from "@/lib/gemini";
import { normalizeInputText } from "@/lib/utils";
import { appCache } from "@/lib/cache";
import { scrapeYouTubeChannel } from "@/lib/scraper";
import { extractKeywordsTFIDF } from "@/lib/nlp";

export const dynamic = "force-dynamic";

function formatCompact(num: number): string {
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toString();
}

function parseDurationISO(iso: string): number {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (parseInt(match[1] || "0") * 3600) + (parseInt(match[2] || "0") * 60) + parseInt(match[3] || "0");
}

interface CompetitorAnalysis {
    channel: {
        name: string;
        subscribers: string;
        videos: string | number;
        totalViews: string;
        joinedDate: string;
        uploadFrequency: string;
        avgViews: string;
        emoji: string;
    };
    strengths: Array<{ title: string; description: string; impact: "High" | "Medium" | "Low"; icon: string }>;
    weaknesses: Array<{ title: string; description: string; opportunity: string; icon: string }>;
    topVideos: Array<{ title: string; views: string; ctr: string; engagement: string; emoji: string; velocity?: string }>;
    contentThemes: Array<{ theme: string; percentage: number; videos: number }>;
    postingSchedule: { bestDays: string[]; bestTimes: string[]; avgDuration: string };
    recommendations: string[];
    viewTrendData: Array<{ date: string; views: number; title: string }>;
    aiAnswer?: string;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const channelQuery = searchParams.get("channel") || "";
        const question = normalizeInputText(searchParams.get("question") || "");

        if (!channelQuery) {
            return NextResponse.json({ error: "Channel parameter is required" }, { status: 400 });
        }
        let channelId: string;
        try {
            channelId = await resolveChannelId(channelQuery);
        } catch (error) {
            return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to resolve channel." }, { status: 404 });
        }

        // ── WATERFALL STRATEGY: Cache → Scraper → API Fallback ──────────────────
        // This protects the YouTube API quota. Each level is tried in order.
        const waterfallKey = `competitor_channel_${channelId}`;
        let channelName = "";
        let subscriberCount = 0;
        let viewCount = 0;
        let videoCount = 0;
        let joinYear = new Date().getFullYear();
        let channelDescription = "";
        let dataSource = "youtube_api";

        // Step 1: Check in-memory cache
        const cachedChannel = appCache.get<{
            channelName: string; subscriberCount: number; viewCount: number;
            videoCount: number; joinYear: number; channelDescription: string;
        }>(waterfallKey);

        if (cachedChannel) {
            dataSource = "cache";
            ({ channelName, subscriberCount, viewCount, videoCount, joinYear, channelDescription } = cachedChannel);
        } else {
            // Step 2: Try web scraper (zero API cost)
            let scraperSucceeded = false;
            try {
                const scraped = await scrapeYouTubeChannel(channelId);
                if (scraped?.title) {
                    const parseSub = (v: string) => {
                        const n = parseFloat(v);
                        if (v.includes("B")) return n * 1_000_000_000;
                        if (v.includes("M")) return n * 1_000_000;
                        if (v.includes("K")) return n * 1_000;
                        return n || 0;
                    };
                    channelName = scraped.title;
                    channelDescription = scraped.description;
                    subscriberCount = parseSub(scraped.subscriberCount);
                    videoCount = parseInt(scraped.videoCount) || 0;
                    viewCount = 0; // Not easily available via scraper
                    dataSource = "scraper";
                    scraperSucceeded = true;
                    console.log(`[competitor] ✅ Scraper succeeded for ${channelId}`);
                }
            } catch (scrapeErr) {
                console.warn(`[competitor] ⚠️ Scraper failed, falling back to YouTube API:`, scrapeErr);
            }

            // Step 3: Fallback — Official YouTube API (uses quota)
            if (!scraperSucceeded) {
                console.log(`[competitor] 🔑 Using YouTube API for ${channelId}`);
                const channelData = await youtubeGet<{
                    items: Array<{
                        snippet: { title: string; publishedAt: string; description: string };
                        statistics: { viewCount: string; subscriberCount: string; videoCount: string };
                    }>;
                }>("channels", { part: "snippet,statistics", id: channelId });

                if (!channelData.items || channelData.items.length === 0) {
                    return NextResponse.json({ error: "Channel details not found." }, { status: 404 });
                }
                const ch = channelData.items[0];
                channelName = ch.snippet.title;
                channelDescription = ch.snippet.description || "";
                subscriberCount = parseInt(ch.statistics.subscriberCount || "0");
                viewCount = parseInt(ch.statistics.viewCount || "0");
                videoCount = parseInt(ch.statistics.videoCount || "0");
                joinYear = new Date(ch.snippet.publishedAt).getFullYear();
            }

            // Cache the normalized result for 6 hours
            appCache.set(waterfallKey, { channelName, subscriberCount, viewCount, videoCount, joinYear, channelDescription }, 6 * 60 * 60 * 1000);
        }

        console.log(`[competitor] Data source: ${dataSource}`);
        const avgViewsNum = videoCount > 0 ? Math.round(viewCount / videoCount) : 0;

        // 3. Fetch top recent videos for velocity calculation
        const topVideosRes = await youtubeGet<{
            items: Array<{
                id: { videoId?: string };
                snippet: { title: string; publishedAt: string };
            }>;
        }>("search", {
            part: "snippet",
            channelId,
            order: "date",
            type: "video",
            maxResults: "25",
        });

        const topVideoIds = topVideosRes.items
            .map((i) => i.id.videoId)
            .filter(Boolean) as string[];

        // 4. Get real statistics and compute Viral Velocity (Views Per Day)
        let topVideoDetails: Array<{
            title: string;
            views: number;
            likes: number;
            comments: number;
            duration: string;
            durationSeconds: number;
            velocity: number;
        }> = [];

        if (topVideoIds.length > 0) {
            const videoStatsRes = await youtubeGet<{
                items: Array<{
                    snippet: { title: string; publishedAt: string };
                    statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
                    contentDetails: { duration: string };
                }>;
            }>("videos", {
                part: "snippet,statistics,contentDetails",
                id: topVideoIds.join(","),
            });

            const now = Date.now();
            topVideoDetails = videoStatsRes.items.map((v) => {
                const views = parseInt(v.statistics.viewCount || "0");
                const likes = parseInt(v.statistics.likeCount || "0");
                const comments = parseInt(v.statistics.commentCount || "0");
                const durSec = parseDurationISO(v.contentDetails.duration);
                const mins = Math.floor(durSec / 60);
                const secs = durSec % 60;
                
                // Viral Velocity Calculation
                const publishedAt = new Date(v.snippet.publishedAt).getTime();
                const uploadedDays = Math.max(1, Math.floor((now - publishedAt) / (1000 * 60 * 60 * 24)));
                const velocity = views / uploadedDays;

                return {
                    title: v.snippet.title,
                    views,
                    likes,
                    comments,
                    duration: `${mins}:${secs.toString().padStart(2, "0")}`,
                    durationSeconds: durSec,
                    velocity,
                };
            });
            
            // Sort by mathematically highest Views-Per-Day
            topVideoDetails.sort((a, b) => b.velocity - a.velocity);
        }

        // Calculate derived metrics
        const avgDurSeconds = topVideoDetails.length > 0
            ? Math.round(topVideoDetails.reduce((a, v) => a + v.durationSeconds, 0) / topVideoDetails.length)
            : 0;
        const avgDurStr = `${Math.floor(avgDurSeconds / 60)}:${(avgDurSeconds % 60).toString().padStart(2, "0")}`;

        // Compute real engagement rates and velocity badges
        const enrichedTopVideos = topVideoDetails.slice(0, 5).map((v) => {
            const engagementRate = v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0;
            // CTR proxy: good content gets 5-15% CTR; we proxy from engagement
            const ctrProxy = Math.min(16, Math.max(2.5, 3 + engagementRate * 0.9));
            // Format velocity as views/day
            const velocityStr = v.velocity >= 1000
                ? `${(v.velocity / 1000).toFixed(1)}K views/day`
                : `${Math.round(v.velocity)} views/day`;
            return {
                title: v.title,
                views: formatCompact(v.views),
                ctr: `${ctrProxy.toFixed(1)}%`,
                engagement: `${engagementRate.toFixed(1)}%`,
                emoji: v.velocity > 10000 ? "🔥" : v.velocity > 3000 ? "🚀" : "🎬",
                velocity: velocityStr,
            };
        });

        // 4.5 Fetch recent videos for the Trend Chart
        const recentVideosRes = await youtubeGet<{
            items: Array<{ id: { videoId?: string } }>;
        }>("search", {
            part: "snippet",
            channelId,
            order: "date",
            type: "video",
            maxResults: "10",
        });

        const recentVideoIds = recentVideosRes.items.map(i => i.id.videoId).filter(Boolean) as string[];
        let viewTrendData: Array<{ date: string; views: number; title: string }> = [];

        if (recentVideoIds.length > 0) {
            const recentStatsRes = await youtubeGet<{
                items: Array<{
                    snippet: { title: string; publishedAt: string };
                    statistics: { viewCount?: string };
                }>;
            }>("videos", {
                part: "snippet,statistics",
                id: recentVideoIds.join(","),
            });

            // Sort chronologically (oldest to newest) for left-to-right chart rendering
            viewTrendData = recentStatsRes.items
                .sort((a, b) => new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime())
                .map(v => ({
                    date: new Date(v.snippet.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    views: parseInt(v.statistics.viewCount || "0"),
                    title: v.snippet.title.length > 30 ? v.snippet.title.substring(0, 30) + '...' : v.snippet.title
                }));
        }

        // Use Custom NLP Engine to extract keywords mathematically (TF-IDF)
        const allTextDocs = [
            channelDescription,
            ...topVideoDetails.map(v => v.title),
            ...viewTrendData.map(v => v.title)
        ].filter(Boolean);
        const topKeywords = extractKeywordsTFIDF(allTextDocs, 8);

        // Gather data summary for AI analysis
        const dataSummary = `
Channel Name: ${channelName}
Subscribers: ${formatCompact(subscriberCount)}
Total Videos: ${videoCount}
Total Views: ${formatCompact(viewCount)}
Avg Views Per Video: ${formatCompact(avgViewsNum)}
Founded: ${joinYear}
Channel Description: "${channelDescription?.slice(0, 300) || "Not provided"}"
Average Video Duration: ${avgDurStr}

Custom Backend Engine NLP Keywords (TF-IDF):
${topKeywords.map(k => `${k.keyword} (score: ${k.score.toFixed(3)})`).join(", ") || "None extracted"}

Top 5 Videos (sorted by Viral Velocity — Views Per Day, highest to lowest):
${topVideoDetails.slice(0, 5).map((v, i) => `  ${i + 1}. "${v.title}" - ${formatCompact(v.views)} views, ${Math.round(v.velocity)} views/day, ${((v.likes + v.comments) / Math.max(1, v.views) * 100).toFixed(1)}% engagement`).join("\n")}
`;

        // 5. Use Gemini to generate intelligent analysis from real data
        const questionBlock = question
            ? `\n\nUSER'S SPECIFIC QUESTION: "${question}"\nCRITICAL: You MUST provide a detailed, analytical answer to this exact question in the "aiAnswer" field, using the data provided below to justify your answer. Do not ignore this question.`
            : "";

        const prompt = `You are a senior YouTube channel analyst. Based on the following REAL data from the YouTube API, generate a strategic competitive analysis report.
${questionBlock}

${dataSummary}

Generate a strategic analysis with specific, actionable insights derived directly from the real data above. Do NOT make up statistics — all numbers must come from the data provided. The "strengths" and "weaknesses" should be genuinely derived from the metrics, not generic observations.

ANTI-HALLUCINATION / GIBBERISH RULE:
- No matter how obscure, technical, or specific the User's Specific Question is, TREAT IT AS A VALID, SERIOUS QUESTION. Act as a world-class analyst for that specific niche and answer it directly using the data provided. Never fallback to generic channel health questions. Only if the input is explicitly abusive/illegal should you fallback to generic advice. The user MUST receive perfectly formatted JSON output.

QUALITY GATE:
- Do not output generic advice like "make better thumbnails". Your recommendations and weaknesses MUST be strictly data-driven based on the numbers provided. Use a chain-of-thought process to review your own plan and rewrite it to be 10x more specific and actionable.

Return ONLY a valid JSON object with this structure (no markdown, no extra text):
{
  "chain_of_thought_plan_critique": "Draft 3 generic recommendations internally, harshly critique them for being too generic, and explain how your final rewritten recommendations are highly specific and data-driven.",
  ${question ? `"aiAnswer": "A detailed, direct answer to the user's specific question based on the data. Be insightful and analytical.",` : ""}
  "strengths": [
    {
      "title": "Specific strength observed from the data",
      "description": "Specific description citing actual numbers from the data",
      "impact": "High",
      "icon": "📈"
    },
    {
      "title": "Second specific strength",
      "description": "Description with actual metrics",
      "impact": "Medium",
      "icon": "💡"
    },
    {
      "title": "Third specific strength",
      "description": "Description with actual metrics",
      "impact": "High",
      "icon": "🎯"
    }
  ],
  "weaknesses": [
    {
      "title": "Specific weakness or gap",
      "description": "Specific description of what's lacking or underperforming",
      "opportunity": "Specific, actionable opportunity to exploit this weakness",
      "icon": "⚠️"
    },
    {
      "title": "Second specific weakness",
      "description": "Description of the gap",
      "opportunity": "Specific opportunity",
      "icon": "🎨"
    }
  ],
  "contentThemes": [
    { "theme": "Most prominent content category based on video titles", "percentage": 55, "videos": ${Math.floor(videoCount * 0.55)} },
    { "theme": "Second category", "percentage": 30, "videos": ${Math.floor(videoCount * 0.30)} },
    { "theme": "Third category", "percentage": 15, "videos": ${Math.floor(videoCount * 0.15)} }
  ],
  "postingSchedule": {
    "bestDays": ["Day1", "Day2"],
    "bestTimes": ["HH:MM", "HH:MM"],
    "avgDuration": "${avgDurStr}"
  },
  "recommendations": [
    "Specific, actionable recommendation 1 based on the actual data",
    "Specific recommendation 2",
    "Specific recommendation 3",
    "Specific recommendation 4",
    "Specific recommendation 5"
  ]
}`;

        const aiAnalysis = await groqGenerateJSON<{
            strengths: CompetitorAnalysis["strengths"];
            weaknesses: CompetitorAnalysis["weaknesses"];
            contentThemes: CompetitorAnalysis["contentThemes"];
            postingSchedule: CompetitorAnalysis["postingSchedule"];
            recommendations: string[];
            aiAnswer?: string;
        }>(prompt);

        const response: CompetitorAnalysis = {
            channel: {
                name: channelName,
                subscribers: formatCompact(subscriberCount),
                videos: videoCount,
                totalViews: formatCompact(viewCount),
                joinedDate: String(joinYear),
                uploadFrequency: "Variable",
                avgViews: formatCompact(avgViewsNum),
                emoji: "📊",
            },
            strengths: aiAnalysis.strengths || [],
            weaknesses: aiAnalysis.weaknesses || [],
            topVideos: enrichedTopVideos,
            contentThemes: aiAnalysis.contentThemes || [],
            postingSchedule: aiAnalysis.postingSchedule || { bestDays: [], bestTimes: [], avgDuration: avgDurStr },
            recommendations: aiAnalysis.recommendations || [],
            viewTrendData,
            aiAnswer: aiAnalysis.aiAnswer,
        };

        return NextResponse.json(response, {
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error: unknown) {
        console.error("Competitor analysis error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to analyze competitor" },
            { status: 500 }
        );
    }
}
