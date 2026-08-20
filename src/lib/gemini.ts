import Groq from "groq-sdk";
import { withCache } from "@/lib/cache";

let groqClient: Groq | null = null;

function getGroq(): Groq {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error("GROQ_API_KEY is not configured. Get a free key at https://console.groq.com");
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

/**
 * Call Groq's Llama 3.3 70B model with a prompt and return the raw text response.
 * Groq is completely free (14,400 requests/day) — no credit card needed.
 */
export async function groqGenerate(prompt: string): Promise<string> {
    const client = getGroq();

    const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content:
                    "You are an expert YouTube content strategist, scriptwriter, and channel growth analyst. You always return valid, well-structured JSON when asked to. Never include markdown code fences, comments, or extra explanation — return only the raw JSON object.",
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.75, // Keeps output creative and non-deterministic
        max_tokens: 4096,
        response_format: { type: "json_object" },
    });

    return completion.choices[0]?.message?.content ?? "{}";
}

/**
 * Call Groq and parse the response directly as typed JSON.
 * The json_object response_format guarantees valid JSON — no cleanup needed.
 */
export async function groqGenerateJSON<T>(prompt: string): Promise<T> {
    const text = await groqGenerate(prompt);
    return JSON.parse(text) as T;
}

/**
 * Multimodal AI: Call Groq's Llama 3.2 Vision model to analyze an image.
 * Uses Base64 data URL.
 */
export async function groqVisionAnalyzeJSON<T>(prompt: string, base64Image: string | string[]): Promise<T> {
    const client = getGroq();

    const images = Array.isArray(base64Image) ? base64Image : [base64Image];
    const imageContent = images.map(url => ({ type: "image_url" as const, image_url: { url } }));

    const completion = await client.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text" as const, text: prompt + "\n\nIMPORTANT: You must return ONLY a raw JSON object. No markdown formatting, no code blocks, no explanation text. Just the `{}` JSON." },
                    ...imageContent
                ],
            },
        ],
        temperature: 0.2,
        max_tokens: 1024,
        // Vision model does not support response_format: { type: "json_object" } yet, 
        // so we manually clean the output if it has markdown formatting.
    });

    let rawOutput = completion.choices[0]?.message?.content ?? "{}";
    
    // Clean up potential markdown formatting from the vision model
    rawOutput = rawOutput.replace(/```json/g, "").replace(/```/g, "").trim();
    
    // In case there is text before or after the JSON braces
    const firstBrace = rawOutput.indexOf('{');
    const lastBrace = rawOutput.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        rawOutput = rawOutput.substring(firstBrace, lastBrace + 1);
    }

    try {
        return JSON.parse(rawOutput) as T;
    } catch (err) {
        console.error("Vision AI returned invalid JSON:", rawOutput);
        throw new Error("Failed to parse Vision AI output");
    }
}
