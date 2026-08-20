import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { youtubeGet } from "@/lib/youtube-live";
import { groqGenerateJSON } from "@/lib/gemini";
import { normalizeInputText } from "@/lib/utils";
import { contentCache, hashParams } from "@/lib/lruCache";
import { ContentResultSchema, validateWithRetry } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface ContentResult {
    chain_of_thought_title_critique?: string;
    titles: Array<{
        title: string;
        angle: string;
        predicted_ctr: string;
    }>;
    description: string;
    chapters: Array<{ timestamp: string; title: string }>;
    engagement_assets: {
        pinned_comment: string;
        community_post: string;
    };
    tags: string[];
    thumbnailIdeas: string[];
    metadata_health: {
        title_length_check: string;
        description_seo_check: string;
        is_title_optimized: boolean;
    };
}

export async function GET(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(ip, 15, 60000); // 15 requests per minute
    if (!success) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }
    
    try {
        const { searchParams } = new URL(req.url);
        const topic = normalizeInputText(searchParams.get("topic") || "");
        const tone = searchParams.get("tone") || "professional";
        // New personalization fields
        const audience = normalizeInputText(searchParams.get("audience") || "");
        const channelStyle = normalizeInputText(searchParams.get("channelStyle") || "");
        const uniqueAngle = normalizeInputText(searchParams.get("uniqueAngle") || "");

        if (!topic) {
            return NextResponse.json({ message: "Topic parameter is required" }, { status: 400 });
        }

        // LRU Cache check — return instantly if we've seen this exact prompt before
        const cacheKey = hashParams({ topic, tone, audience, channelStyle, uniqueAngle });
        const cached = contentCache.get(cacheKey);
        if (cached) {
            console.log(`[LRU Cache HIT] content: ${topic}`);
            return NextResponse.json(cached, {
                status: 200,
                headers: { "X-Cache": "HIT", "Cache-Control": "no-store" },
            });
        }


        // 1. Fetch real YouTube context to ground the AI
        let realTitles: string[] = [];
        let realTags: string[] = [];

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

            const videoIds = searchRes.items
                .map((item) => item.id.videoId)
                .filter(Boolean) as string[];

            if (videoIds.length > 0) {
                const videosRes = await youtubeGet<{
                    items: Array<{
                        snippet: { title: string; tags?: string[] };
                    }>;
                }>("videos", {
                    part: "snippet",
                    id: videoIds.join(","),
                });

                // Deduplicate titles
                const titleSet = new Set<string>();
                videosRes.items.forEach((v) => {
                    if (v.snippet.title) titleSet.add(v.snippet.title);
                });
                realTitles = Array.from(titleSet);

                // Deduplicate and clean tags: only English, no duplicates, no empties
                const tagSet = new Set<string>();
                videosRes.items.forEach((v) => {
                    if (v.snippet.tags) {
                        v.snippet.tags
                            .filter(t => t && /^[\x00-\x7F]*$/.test(t)) // ASCII/English only
                            .slice(0, 10)
                            .forEach((t) => tagSet.add(t.toLowerCase().trim()));
                    }
                });
                realTags = Array.from(tagSet).slice(0, 20);
            }
        } catch {
            // If YouTube call fails, we still generate with AI only
        }

        const toneDescriptions: Record<string, string> = {
            professional:
                "formal, data-driven, authoritative, expert-level, using clear and precise language. Suitable for a professional/business audience.",
            casual:
                "friendly, conversational, warm, relatable, like talking to a knowledgeable friend. Use contractions and simple language.",
            hype: "extremely energetic, urgent, hype-style, using lots of CAPS for emphasis, exclamation marks, and scarcity triggers. MrBeast-inspired.",
            storytelling:
                "narrative-driven, emotional, with a personal journey arc. Build suspense, use descriptive language, and make the viewer feel something.",
        };

        const toneDescription = toneDescriptions[tone] || toneDescriptions.professional;

        const contextBlock =
            realTitles.length > 0
                ? `\n\nFor additional context, here are some real YouTube video titles currently ranking for this topic (use these to understand the competitive landscape and create DIFFERENT, more original angles):\n${realTitles.slice(0, 6).map((t) => `- "${t}"`).join("\n")}`
                : "";

        // Build personalization blocks — only include if user provided them
        const audienceBlock = audience
            ? `\n**Target Audience:** ${audience}\nEverything you write — the vocabulary, pain points, examples, and cultural references — must be perfectly tailored to THIS specific audience.`
            : "";

        const channelStyleBlock = channelStyle
            ? `\n**Channel Style Reference:** Write in the style of creators like "${channelStyle}". Study their energy, pacing, and vocabulary, and use it throughout.`
            : "";

        const uniqueAngleBlock = uniqueAngle
            ? `\n**Creator's Unique Angle/Hook:** The user wants to make this video from this specific angle: "${uniqueAngle}". THIS IS THE MOST IMPORTANT INSTRUCTION. Build every title, the entire script structure, and the description around this exact hook. Do not deviate.`
            : "";

        const prompt = `You are an elite YouTube Content Strategist and Master Copywriter who has grown multiple channels to over 1 million subscribers.
Your task is to generate highly optimized, viral-ready YouTube content for the following video topic.

**Topic:** "${topic}"
**Tone & Style:** ${toneDescription}${audienceBlock}${channelStyleBlock}${uniqueAngleBlock}${contextBlock}

CRITICAL INSTRUCTIONS:
- Use advanced YouTube psychology: Curiosity Gaps, Open Loops, and the AIDA framework.
- Titles must be highly clickable but NOT clickbait — use strong emotional triggers that deliver real value.
- The description must be heavily SEO-optimized. Place the most important keywords NATURALLY in the first 2 sentences.

CRITICAL RULES:
- SELF-CORRECTING TITLES: Draft 5 initial titles in your thoughts, harshly critique them for being too generic or clickbaity, and rewrite them to be 10x punchier. Each title MUST have a specific psychological angle (Curiosity, FOMO, Utility, Authority, Contrarian) and a Predicted CTR (e.g. "8.5%").
- The Description should be SEO optimized and engaging. Include a timeline/chapters section.
- Generate an engaging Pinned Comment to drive community interaction.
- Generate a Community Tab post to hype the video.

ANTI-HALLUCINATION / GIBBERISH RULE:
- Treat the topic as a valid project. Act as a world-class expert. Only if the input is explicitly abusive/illegal should you fallback to general YouTube advice. The user MUST receive perfectly formatted JSON output.

Return ONLY a valid JSON object matching exactly this structure (no markdown, no extra text):
{
  "chain_of_thought_title_critique": "Draft 5 initial titles, tear them apart for being boring or generic, and explain how the final rewritten titles fix them.",
  "titles": [
    { "title": "...", "angle": "Curiosity Gap", "predicted_ctr": "9.2%" },
    { "title": "...", "angle": "FOMO/Urgency", "predicted_ctr": "8.7%" },
    { "title": "...", "angle": "Authority/How-To", "predicted_ctr": "7.5%" },
    { "title": "...", "angle": "Contrarian/Debunking", "predicted_ctr": "8.1%" },
    { "title": "...", "angle": "Emotional/Story", "predicted_ctr": "7.9%" }
  ],
  "description": "A full YouTube video description (350-500 words). Paragraph 1: A powerful hook using main keywords in the first 2 sentences. Paragraph 2: AIDA breakdown of what viewers learn.",
  "chapters": [
    { "timestamp": "0:00", "title": "The Hook" },
    { "timestamp": "1:25", "title": "The Core Problem" }
  ],
  "engagement_assets": {
    "pinned_comment": "A comment designed to get heavily liked and replied to.",
    "community_post": "A short, engaging text post with a poll or question to promote the video."
  },
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "thumbnailIdeas": [
    "Thumbnail 1: Describe the EXACT background scene, a specific 2-3 word text overlay, the subject's facial expression, and the dominant color.",
    "Thumbnail 2: Before/After split or a 'secret revealed' concept."
  ],
  "metadata_health": {
    "title_length_check": "Count the characters of your first title. If it is over 60 characters, YOU MUST rewrite it in the 'titles' array to be under 60 characters.",
    "description_seo_check": "Confirm that the main keyword appears in the first 2 sentences of the description.",
    "is_title_optimized": true
  }
}`;

        // Validate AI output against Zod schema, auto-retrying on malformed responses
        const result = await validateWithRetry(
            ContentResultSchema,
            () => groqGenerateJSON<ContentResult>(prompt)
        );

        // Merge real YouTube tags, deduplicate, and clean
        if (realTags.length > 0 && result.tags) {
            const combined = [...new Set([
                ...result.tags.map(t => t.toLowerCase().trim()),
                ...realTags
            ])].filter(t => t && t.length > 1).slice(0, 15);
            result.tags = combined;
        }

        // Store in LRU cache for future identical requests
        contentCache.set(cacheKey, result);

        return NextResponse.json(result, {
            status: 200,
            headers: {
                "X-Cache": "MISS",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Error generating content:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to generate content" },
            { status: 500 }
        );
    }
}
