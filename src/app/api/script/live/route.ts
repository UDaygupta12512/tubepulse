import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { youtubeGet } from "@/lib/youtube-live";
import { groqGenerateJSON } from "@/lib/gemini";
import { normalizeInputText } from "@/lib/utils";
import { scriptCache, hashParams } from "@/lib/lruCache";
import { ScriptResultSchema, validateWithRetry } from "@/lib/schemas";

export const dynamic = "force-dynamic";

interface AVRow {
    timestamp: string;
    audio: string;
    visual: string;
    pacing_note: string;
}

interface ScriptSection {
    title: string;
    time: string;
    retention_risk_score: number;
    retention_warning: string;
    av_rows: AVRow[];
}

interface ScriptResult {
    chain_of_thought_niche_analysis: string;
    title: string;
    duration: string;
    ab_hooks: Array<{ type: string; text: string; visual_hook: string }>;
    sections: ScriptSection[];
    engagement_boosters: string[];
    keywords: string[];
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
        const duration = searchParams.get("duration") || "10";
        const style = searchParams.get("style") || "educational";
        
        // Advanced Personalization
        const audience = normalizeInputText(searchParams.get("audience") || "");
        const channelStyle = normalizeInputText(searchParams.get("channelStyle") || "");
        const uniqueAngle = normalizeInputText(searchParams.get("uniqueAngle") || "");

        if (!topic) {
            return NextResponse.json({ message: "Topic parameter is required" }, { status: 400 });
        }

        // LRU Cache check — return instantly if we've seen this exact prompt before
        const cacheKey = hashParams({ topic, duration, style, audience, channelStyle, uniqueAngle });
        const cached = scriptCache.get(cacheKey);
        if (cached) {
            console.log(`[LRU Cache HIT] script: ${topic}`);
            return NextResponse.json(cached, {
                status: 200,
                headers: { "X-Cache": "HIT", "Cache-Control": "no-store" },
            });
        }

        const durationInt = Math.max(3, Math.min(60, parseInt(duration) || 10));
        const sectionCount = durationInt <= 5 ? 2 : durationInt <= 12 ? 3 : 4;

        // Fetch real YouTube context
        let realTags: string[] = [];
        let contextTitles: string[] = [];

        try {
            const searchRes = await youtubeGet<{
                items: Array<{ id: { videoId?: string } }>;
            }>("search", {
                part: "id",
                q: topic,
                maxResults: "5",
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

                const titleSet = new Set<string>();
                videosRes.items.forEach((v) => {
                    if (v.snippet.title) titleSet.add(v.snippet.title);
                });
                contextTitles = Array.from(titleSet);

                const tagSet = new Set<string>();
                videosRes.items.forEach((v) => {
                    if (v.snippet.tags) {
                        v.snippet.tags
                            .filter(t => t && /^[\x00-\x7F]*$/.test(t))
                            .slice(0, 10)
                            .forEach((t) => tagSet.add(t.toLowerCase().trim()));
                    }
                });
                realTags = Array.from(tagSet).slice(0, 12);
            }
        } catch {
            // Proceed without YouTube context
        }

        const styleGuides: Record<string, string> = {
            educational: `Educational/Tutorial style: Clear explanations, step-by-step breakdowns, use analogies, cite examples, address common misconceptions. Opening hook should promise a specific, measurable outcome.`,
            entertainment: `Entertainment/Challenge style: High energy, fast pacing, dramatic tension, funny moments, surprise reveals. Hook must be a shocking statement or outrageous claim that creates curiosity.`,
            vlog: `Vlog/Personal style: First-person storytelling, authentic and raw, share personal experiences and failures. Hook is an intimate, relatable moment or confession.`,
            documentary: `Documentary style: Authoritative narration, cinematic b-roll suggestions, interview-style segments, fact-driven. Hook presents a surprising statistic or little-known fact.`,
            review: `Product/Service Review style: Hands-on testing narrative, honest pros and cons, benchmark comparisons. Hook challenges a popular belief about the product/topic.`,
        };

        const styleGuide = styleGuides[style] || styleGuides.educational;

        const contextBlock =
            contextTitles.length > 0
                ? `\n\nFor grounding, here are real YouTube video titles currently ranking for this topic (use them to understand the landscape, but create an original approach):\n${contextTitles.slice(0, 4).map((t) => `- "${t}"`).join("\n")}`
                : "";

        // Build personalization blocks
        const audienceBlock = audience
            ? `\n**Target Audience:** ${audience}\nWrite the dialogue specifically for this audience. Use words, pain points, and examples they deeply relate to.`
            : "";

        const channelStyleBlock = channelStyle
            ? `\n**Channel Style Reference:** Write in the style of creators like "${channelStyle}". Match their pacing, energy, and sentence structure exactly.`
            : "";

        const uniqueAngleBlock = uniqueAngle
            ? `\n**Creator's Unique Angle/Hook:** "${uniqueAngle}". THIS IS CRITICAL. The entire script, especially the hook and main value proposition, MUST revolve around this specific angle.`
            : "";

        const prompt = `You are an elite, highly-paid YouTube scriptwriter and video director who consistently writes videos that achieve 70%+ retention graphs and millions of views. Your task is to write a detailed, professional video script structure.

**Topic:** "${topic}"
**Target Duration:** ${durationInt} minutes (~${durationInt * 150} words spoken at normal pacing)
**Content Style:** ${styleGuide}${audienceBlock}${channelStyleBlock}${uniqueAngleBlock}${contextBlock}
**Number of Main Sections:** ${sectionCount}

CRITICAL SCRIPTWRITING & DIRECTING RULES (The "Director's Cut" Format):
1. NICHE ROUTING: First, analyze the topic and detect the niche (e.g., Gaming, Finance, Vlog, Education). Apply strict structural rules for that niche. (e.g., Finance = slow authoritative pacing with disclaimers; Gaming = high energy mid-action start).
2. SELF-CORRECTING HOOK: Draft a hook, harshly critique it for retention drop-off, and rewrite it to be 10x punchier before outputting the final text.
3. DIRECTOR'S CUT FORMATTING: Do not just write a wall of text. You must write like a video editor timeline. Inject exact [Camera Angles], [SFX: ...], and [B-Roll: ...] directly inline with the dialogue.

ANTI-HALLUCINATION / GIBBERISH RULE:
- No matter how obscure or specific the user's Topic is, TREAT IT AS A VALID PROJECT TOPIC. Act as a world-class expert in that specific niche. The user MUST receive perfectly formatted JSON output.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "chain_of_thought_niche_analysis": "Identify the niche and list strict pacing/tone rules.",
  "title": "A highly-clickable, perfectly packaged YouTube video title",
  "duration": "${durationInt} minutes",
  "ab_hooks": [
    { "type": "The Curiosity Hook", "text": "Exact spoken words...", "visual_hook": "Describe the B-roll/graphic." },
    { "type": "The Direct/Pain Hook", "text": "Exact spoken words...", "visual_hook": "Describe the B-roll/graphic." },
    { "type": "The Story Hook", "text": "Exact spoken words...", "visual_hook": "Describe the B-roll/graphic." }
  ],
  "sections": [
    {
      "title": "Section Title (e.g. The Setup)",
      "time": "X:XX - Y:YY",
      "retention_risk_score": 85,
      "retention_warning": "Actionable warning if score is high.",
      "av_rows": [
        { "timestamp": "X:XX", "audio": "Spoken dialogue here...", "visual": "B-roll, text popups, or camera angles...", "pacing_note": "Fast cuts / Slow dramatic zoom / etc." },
        { "timestamp": "X:YY", "audio": "More spoken dialogue...", "visual": "Show graph going up...", "pacing_note": "Normal pacing" }
      ]
    }
  ],
  "engagement_boosters": [
    "Easter egg idea at 4:30",
    "Specific pinned comment question"
  ],
  "keywords": ["key1", "key2"]
}

Ensure exactly ${sectionCount} sections are in the "sections" array with properly allocated timestamps across ${durationInt} minutes.`;

        // Validate AI output against Zod schema, auto-retrying on malformed responses
        const result = await validateWithRetry(
            ScriptResultSchema,
            () => groqGenerateJSON<ScriptResult>(prompt)
        );

        // Augment keywords with real YouTube tags if available
        if (realTags.length > 0) {
            const combined = [...new Set([
                ...result.keywords.map(t => t.toLowerCase().trim()),
                ...realTags
            ])].filter(t => t && t.length > 1).slice(0, 15);
            result.keywords = combined;
        }

        // Store in LRU cache for future identical requests
        scriptCache.set(cacheKey, result);

        return NextResponse.json(result, {
            status: 200,
            headers: {
                "X-Cache": "MISS",
                "Cache-Control": "no-store",
            },
        });
    } catch (error) {
        console.error("Error generating script:", error);
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to generate script" },
            { status: 500 }
        );
    }
}
