import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { rateLimit } from "@/lib/rateLimit";
import { normalizeInputText } from "@/lib/utils";
import { scriptCache, hashParams } from "@/lib/lruCache";

export const dynamic = "force-dynamic";

/**
 * Streaming Script Generation Route
 * Uses Groq's streaming SDK to push tokens to the browser as they arrive.
 * The client reads chunks of text and progressively renders them.
 */
export async function GET(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(ip, 10, 60000); // Slightly stricter for streaming
    if (!success) {
        return NextResponse.json(
            { error: "Rate limit exceeded. Please wait a minute." },
            { status: 429 }
        );
    }

    const { searchParams } = new URL(req.url);
    const topic = normalizeInputText(searchParams.get("topic") || "");
    const duration = searchParams.get("duration") || "10";
    const style = searchParams.get("style") || "educational";
    const audience = normalizeInputText(searchParams.get("audience") || "");
    const channelStyle = normalizeInputText(searchParams.get("channelStyle") || "");
    const uniqueAngle = normalizeInputText(searchParams.get("uniqueAngle") || "");

    if (!topic) {
        return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Check LRU cache first — if this exact script was generated before, stream
    // it back instantly from memory (no AI call needed).
    const cacheKey = hashParams({ topic, duration, style, audience, channelStyle, uniqueAngle });
    const cachedScript = scriptCache.get(cacheKey);
    if (cachedScript) {
        const cachedText = JSON.stringify(cachedScript, null, 2);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                // Stream the cached content in chunks to preserve the streaming UX
                const chunkSize = 50;
                let i = 0;
                const interval = setInterval(() => {
                    const chunk = cachedText.slice(i, i + chunkSize);
                    if (chunk) {
                        controller.enqueue(encoder.encode(chunk));
                        i += chunkSize;
                    } else {
                        clearInterval(interval);
                        controller.close();
                    }
                }, 5);
            },
        });
        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "X-Cache": "HIT",
                "Cache-Control": "no-store",
                "Transfer-Encoding": "chunked",
            },
        });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    const durationInt = Math.max(3, Math.min(60, parseInt(duration) || 10));
    const sectionCount = durationInt <= 5 ? 2 : durationInt <= 12 ? 3 : 4;

    const styleGuides: Record<string, string> = {
        educational: "Educational/Tutorial: Clear step-by-step explanations with analogies.",
        entertainment: "Entertainment/Challenge: High energy, fast pacing, surprise reveals.",
        vlog: "Vlog/Personal: First-person storytelling, authentic moments.",
        documentary: "Documentary: Authoritative narration, fact-driven, cinematic.",
        review: "Review: Hands-on testing, honest pros and cons, comparisons.",
    };

    const audienceBlock = audience ? `\n**Target Audience:** ${audience}` : "";
    const channelStyleBlock = channelStyle ? `\n**Channel Style:** Write in the style of "${channelStyle}".` : "";
    const uniqueAngleBlock = uniqueAngle ? `\n**Unique Angle (MOST IMPORTANT):** "${uniqueAngle}". Build everything around this.` : "";

    const prompt = `You are an elite YouTube scriptwriter. Write a detailed video script for:

**Topic:** "${topic}"
**Duration:** ${durationInt} minutes
**Style:** ${styleGuides[style] || styleGuides.educational}${audienceBlock}${channelStyleBlock}${uniqueAngleBlock}

Write a compelling, structured script with ${sectionCount} main sections. Include:
- A powerful hook (first 30 seconds)
- Clear section transitions
- Specific b-roll/visual direction notes in [brackets]
- Engagement moments (polls, questions)
- A strong CTA ending

Format as a readable script with timestamps. Be specific, creative, and write like a top YouTube creator.`;

    const groq = new Groq({ apiKey });

    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const completion = await groq.chat.completions.create({
                    model: "openai/gpt-oss-120b",
                    messages: [
                        {
                            role: "system",
                            content: "You are an elite YouTube scriptwriter. Write engaging, well-structured scripts with timestamps and visual direction notes.",
                        },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.8,
                    max_tokens: 4096,
                    stream: true,
                });

                for await (const chunk of completion) {
                    const text = chunk.choices[0]?.delta?.content || "";
                    if (text) {
                        fullText += text;
                        controller.enqueue(encoder.encode(text));
                    }
                }

                // After streaming completes, cache the full script text for next time
                if (fullText) {
                    scriptCache.set(cacheKey, { streamedScript: fullText, topic, duration, style });
                }

                controller.close();
            } catch (err) {
                console.error("[Streaming] Error:", err);
                controller.error(err);
            }
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "X-Cache": "MISS",
            "Cache-Control": "no-store",
            "Transfer-Encoding": "chunked",
        },
    });
}
