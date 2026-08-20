import * as cheerio from "cheerio";
import { normalizeInputText } from "@/lib/utils";

export interface ScrapedChannelData {
    channelId: string;
    title: string;
    description: string;
    subscriberCount: string;
    viewCount: string;
    videoCount: string;
    avatarUrl: string;
    latestVideos: Array<{
        title: string;
        videoId: string;
        views: string;
        publishedAt: string;
    }>;
}

/**
 * Fallback Web Scraper for YouTube Channels
 * Extracts metadata directly from YouTube's HTML to save API quotas.
 */
export async function scrapeYouTubeChannel(handleOrId: string): Promise<ScrapedChannelData | null> {
    const query = normalizeInputText(handleOrId);
    if (!query) return null;

    // Determine URL format
    let url = "";
    if (query.startsWith("UC") && query.length === 24) {
        url = `https://www.youtube.com/channel/${query}`;
    } else if (query.startsWith("@")) {
        url = `https://www.youtube.com/${query}`;
    } else {
        url = `https://www.youtube.com/@${query}`;
    }

    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9",
            },
            next: { revalidate: 3600 } // Cache HTML for 1 hour
        });

        if (!res.ok) {
            console.warn(`Scraper failed to fetch ${url} with status: ${res.status}`);
            return null;
        }

        const html = await res.text();
        const $ = cheerio.load(html);

        // 1. Extract meta tags
        const title = $('meta[property="og:title"]').attr("content") || "";
        const description = $('meta[property="og:description"]').attr("content") || "";
        const avatarUrl = $('meta[property="og:image"]').attr("content") || "";
        const canonical = $('link[rel="canonical"]').attr("href") || "";
        
        let channelId = query.startsWith("UC") ? query : "";
        if (!channelId && canonical.includes("/channel/")) {
            channelId = canonical.split("/channel/")[1] || "";
        }

        // 2. Extract ytInitialData (Contains the hard data)
        const scripts = $("script").toArray();
        let ytInitialData: any = null;

        for (const script of scripts) {
            const content = $(script).html();
            if (content && content.includes("var ytInitialData = ")) {
                try {
                    const jsonStr = content.split("var ytInitialData = ")[1]?.split(";</script>")[0]?.split("};")[0] + "}";
                    ytInitialData = JSON.parse(jsonStr);
                    break;
                } catch (e) {
                    console.error("Failed to parse ytInitialData");
                }
            }
        }

        if (!ytInitialData) {
            console.warn("Could not find ytInitialData in HTML");
            return null;
        }

        // 3. Dig into ytInitialData for stats
        const header = ytInitialData.header?.c4TabbedHeaderRenderer || {};
        
        // Subscriber count text (e.g. "320M subscribers")
        const subText = header.subscriberCountText?.simpleText || "0";
        const subscriberCount = subText.replace(/[^0-9.KM]/g, "").trim() || "0";
        
        // Video count text
        const vidText = header.videosCountText?.runs?.[0]?.text || "0";
        const videoCount = vidText.replace(/[^0-9]/g, "") || "0";

        // Note: View count is no longer explicitly in the header, we'll estimate or fallback to API for views if needed,
        // or extract from the about page. For now we leave it generic.
        const viewCount = "N/A"; 

        return {
            channelId: channelId || query,
            title,
            description,
            subscriberCount,
            viewCount,
            videoCount,
            avatarUrl,
            latestVideos: [] // To be extracted from tabs if needed
        };

    } catch (error) {
        console.error(`Scraper error for ${url}:`, error);
        return null;
    }
}
