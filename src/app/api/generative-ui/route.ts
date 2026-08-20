import { NextResponse } from "next/server";
import { groqGenerateJSON } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/user-store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const ip = req.headers.get("x-forwarded-for") || "anonymous";
        const rateLimit = checkRateLimit(`gen_ui_${ip}`);
        
        if (!rateLimit.allowed) {
            return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
        }

        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        const systemPrompt = `
You are a "Generative UI" AI. You do not just reply with text. You reply with a structured JSON schema that the frontend will use to render interactive React components (Charts, Tables, and Text).

The user is a YouTube Creator asking for analytics or strategy. 
Since you don't have access to their real database, you must INVENT realistic, plausible data to answer their prompt and render it beautifully.

You MUST return a JSON object exactly matching this TypeScript interface:
{
  "blocks": Array<{
     "type": "text" | "chart" | "table";
     // If type is "text":
     "content"?: string; // Markdown formatted text
     
     // If type is "chart":
     "title"?: string; // Chart title
     "xAxisKey"?: string; // e.g., "month" or "day"
     "dataKey"?: string; // e.g., "views" or "subscribers"
     "data"?: Array<{ [key: string]: string | number }>; // e.g., [{ "month": "Jan", "views": 1500 }]
     
     // If type is "table":
     "title"?: string;
     "headers"?: string[];
     "rows"?: Array<string[]>;
  }>
}

Example user prompt: "Show me my sub growth for 3 months"
Example response:
{
  "blocks": [
    { "type": "text", "content": "Here is your projected subscriber growth for the next quarter:" },
    { 
      "type": "chart", 
      "title": "Q1 Subscriber Growth", 
      "xAxisKey": "month", 
      "dataKey": "subs", 
      "data": [
        { "month": "Jan", "subs": 1200 },
        { "month": "Feb", "subs": 2500 },
        { "month": "Mar", "subs": 4100 }
      ]
    },
    { "type": "text", "content": "You are on track to hit 10k by June!" }
  ]
}

User Prompt: "${prompt}"
`;

        const uiSchema = await groqGenerateJSON<any>(systemPrompt);

        return NextResponse.json(uiSchema);

    } catch (error: any) {
        console.error("Generative UI Error:", error);
        return NextResponse.json({ error: "Failed to generate UI components." }, { status: 500 });
    }
}
