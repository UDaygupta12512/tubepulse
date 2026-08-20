import { rateLimit } from "@/lib/rateLimit";
import { NextResponse } from "next/server";
import { groqVisionAnalyzeJSON } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/user-store";

export const dynamic = "force-dynamic";
// High size limit for Base64 image uploads
export const maxDuration = 30;

export async function POST(req: Request) {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(ip, 15, 60000); // 15 requests per minute
    if (!success) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }
    
    try {
        // Apply IP-based rate limiting
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const rateLimit = checkRateLimit(`vision_${ip}`);
        
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
        }

        const body = await req.json();
        const { imageBase64, title } = body;
        const images = Array.isArray(imageBase64) ? imageBase64 : [imageBase64];
        if (images.length === 0 || !images.every((img: string) => img.startsWith("data:image/"))) {
            return NextResponse.json({ error: "Invalid image format. Must be a valid Data URL." }, { status: 400 });
        }

        const titleContext = title ? `The creator intends to use the title: "${title}" alongside the thumbnail.` : "The creator has not finalized a title yet.";

        let prompt = "";
        
        if (images.length === 1) {
            prompt = `You are an elite YouTube Thumbnail Strategist and Multimodal Vision AI.
I am providing you with a raw image of a YouTube thumbnail.
${titleContext}

Analyze the image carefully and grade it on the following criteria:
1. Text Readability: Is the text too small for mobile devices? Is the contrast against the background strong enough?
2. Visual Hierarchy: What is the first thing the eye is drawn to? Is it too cluttered?
3. Emotion & Faces: If there is a face, does it convey strong emotion (curiosity, shock, happiness)?
4. Click-Through Rate (CTR) Potential: Will this stand out against YouTube's dark and light modes?
5. Focal Path: Describe the order in which a viewer's eye is likely to scan the image.

Return ONLY a JSON object exactly matching this structure:
{
  "overallScore": 85,
  "verdict": "A short 1-sentence summary of the thumbnail's strength.",
  "readability": { "score": 90, "feedback": "Specific feedback on text size and contrast." },
  "emotion": { "score": 75, "feedback": "Feedback on facial expressions or overall vibe." },
  "hierarchy": { "score": 80, "feedback": "Feedback on clutter and focal points." },
  "improvements": ["Specific actionable tip 1", "Specific actionable tip 2"],
  "focal_path": ["1. The bright red text in the top left.", "2. The shocked face in the center."]
}`;
        } else {
            prompt = `You are an elite YouTube Thumbnail Strategist and Multimodal Vision AI.
I am providing you with TWO images for an A/B Test Simulation. Image A is the first image, Image B is the second.
${titleContext}

Analyze BOTH images and determine which one has a higher mathematically probable Click-Through Rate (CTR).
Compare them deeply on: Color Theory, Psychological Triggers, Text Readability (Mobile), and Visual Hierarchy.

Return ONLY a JSON object exactly matching this structure:
{
  "isABTest": true,
  "winner": "A",
  "winnerScore": 92,
  "loserScore": 75,
  "verdict": "Why the winning thumbnail objectively beats the losing thumbnail.",
  "color_theory_analysis": "Deep analysis of contrast ratios, color wheel usage (e.g. complementary colors), and dark mode pop.",
  "psychological_triggers": "Deep analysis of facial expressions, curiosity gaps in the visual, or urgency triggers.",
  "mobile_readability_score": "Score out of 100 on how readable it is on a tiny mobile screen.",
  "comparison": [
    "Readability: Image A has bolder text, while B is too small.",
    "Emotion: Image B has a better facial expression.",
    "Contrast: Image A pops more against dark mode."
  ],
  "improvements": ["How to make the WINNING thumbnail even better."]
}`;
        }

        // Send to Llama 3.2 11B Vision
        const analysis = await groqVisionAnalyzeJSON<any>(prompt, images);

        return NextResponse.json({ analysis });
    } catch (error: any) {
        console.error("Vision Analysis Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to analyze image with Vision AI" },
            { status: 500 }
        );
    }
}
