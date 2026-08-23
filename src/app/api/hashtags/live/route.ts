import { NextResponse } from "next/server";
import { youtubeGet } from "@/lib/youtube-live";
import { normalizeInputText } from "@/lib/utils";
import { generateHashtagIntelligence, VideoMetadataForNLP } from "@/lib/nlp";
import { getLocalHashtags } from "@/lib/local-niches";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const topic = normalizeInputText(searchParams.get("topic") || "");

        if (!topic) {
            return NextResponse.json({ message: "Topic parameter is required" }, { status: 400 });
        }

        // 🚀 FEATURE: "Local First" Generation Fallback
        // Check if we have pre-generated optimal tags for this niche
        const localTags = getLocalHashtags(topic);
        if (localTags) {
            console.log(`[Hashtags] ⚡ Local Match Found for "${topic}"! Bypassing API.`);
            return NextResponse.json({
                primaryKeyword: topic,
                categories: [
                    {
                        name: "Highly Relevant",
                        score: 95,
                        tags: localTags.slice(0, 5)
                    },
                    {
                        name: "Secondary",
                        score: 80,
                        tags: localTags.slice(5)
                    }
                ],
                recommendedStrategy: "Mix 3-4 highly relevant tags with 2 secondary broad tags."
            }, {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
                },
            });
        }

        // 1. Search for top ranking videos for this topic
        let videoData: VideoMetadataForNLP[] = [];

        try {
            const searchRes = await youtubeGet<{
                items: Array<{ id: { videoId?: string } }>;
            }>("search", {
                part: "id",
                q: topic,
                maxResults: "10",
                order: "relevance",
                type: "video",
            });

            const videoIds = searchRes.items?.map((item) => item.id.videoId).filter(Boolean) as string[] || [];

            if (videoIds.length > 0) {
                // 2. Fetch full metadata: titles, descriptions, tags, channels, and views
                const videosRes = await youtubeGet<{
                    items: Array<{
                        snippet: { title: string; description?: string; tags?: string[]; channelTitle: string };
                        statistics: { viewCount?: string };
                    }>;
                }>("videos", {
                    part: "snippet,statistics",
                    id: videoIds.join(","),
                });

                if (videosRes?.items) {
                    videoData = videosRes.items.map(v => ({
                        title: v.snippet.title,
                        description: v.snippet.description,
                        tags: v.snippet.tags,
                        channelTitle: v.snippet.channelTitle,
                        views: parseInt(v.statistics.viewCount || "0", 10),
                    }));
                }
            }
        } catch (ytErr) {
            console.warn("[Hashtags] YouTube fetch failed, generating from topic NLP:", ytErr);
        }

        // 3. If no live videos found, create a baseline document from the topic
        if (videoData.length === 0) {
            videoData = [
                {
                    title: `${topic} Complete Guide & Tutorial`,
                    description: `Everything you need to know about ${topic}, tips, tricks, and strategies.`,
                    channelTitle: `${topic} Hub`,
                    views: 45000,
                }
            ];
        }

        // 4. Run Pure TypeScript Mathematical & NLP Intelligence Engine (Zero Groq API cost)
        const result = generateHashtagIntelligence(topic, videoData);

        return NextResponse.json(result, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error) {
        console.error("Error in live hashtag route:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to generate hashtag data" },
            { status: 500 }
        );
    }
}
