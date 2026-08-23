// Local dictionary of top YouTube niches and their most effective hashtags.
// Using this bypasses the AI completely (0 API calls, 0 cost, 0 latency).

export const LOCAL_NICHES: Record<string, string[]> = {
    gaming: [
        "gaming", "gamer", "gameplay", "videogames", "gamingcommunity",
        "letsplay", "pcgaming", "streamer", "twitch", "gaminglife"
    ],
    minecraft: [
        "minecraft", "minecraftmemes", "minecraftbuilds", "minecraftpe", 
        "minecraftserver", "minecrafter", "mcpe", "minecraftsurvival"
    ],
    tech: [
        "tech", "technology", "techreview", "gadgets", "innovation", 
        "unboxing", "techsetup", "software", "hardware"
    ],
    finance: [
        "finance", "investing", "money", "personalfinance", "crypto", 
        "stocks", "wealth", "financialfreedom", "passiveincome"
    ],
    crypto: [
        "crypto", "bitcoin", "ethereum", "cryptocurrency", "web3", 
        "nft", "blockchain", "altcoin"
    ],
    vlog: [
        "vlog", "vlogger", "dailyvlog", "lifestyle", "dayinthelife", 
        "vloggers", "creator", "behindthescenes"
    ],
    fitness: [
        "fitness", "gym", "workout", "bodybuilding", "health", 
        "fitnessmotivation", "fit", "training", "muscle"
    ],
    cooking: [
        "cooking", "food", "recipe", "baking", "chef", 
        "foodie", "homecooking", "delicious", "kitchen"
    ],
    travel: [
        "travel", "wanderlust", "travelvlog", "explore", "vacation", 
        "adventure", "travelgram", "tourism"
    ],
    education: [
        "education", "learning", "study", "student", "science", 
        "history", "knowledge", "school", "tutorial"
    ],
    coding: [
        "programming", "coding", "developer", "javascript", "python", 
        "softwareengineer", "webdev", "tech", "reactjs"
    ],
    productivity: [
        "productivity", "motivation", "selfimprovement", "habits", 
        "success", "discipline", "mindset", "focus"
    ]
};

/**
 * Fuzzy match a user's topic to our local dictionary.
 * If there's a hit, return the local hashtags instantly.
 */
export function getLocalHashtags(topic: string): string[] | null {
    const normalized = topic.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Exact match
    if (LOCAL_NICHES[normalized]) {
        return LOCAL_NICHES[normalized];
    }

    // Partial match (e.g., "minecraft gameplay 2024" -> matches "minecraft")
    for (const [niche, tags] of Object.entries(LOCAL_NICHES)) {
        if (normalized.includes(niche)) {
            return tags;
        }
    }

    // No local match found, MUST fallback to AI
    return null;
}
