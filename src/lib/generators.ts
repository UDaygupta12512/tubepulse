type Priority = "high" | "medium";

function normalizeText(input: string | null | undefined, fallback: string): string {
    const normalized = String(input ?? "")
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return normalized.length > 0 ? normalized : fallback;
}

function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function formatCountInK(valueInThousands: number): string {
    return valueInThousands >= 1000
        ? `${(valueInThousands / 1000).toFixed(1)}M`
        : `${valueInThousands}K`;
}

function formatHours(hours: number): string {
    if (hours >= 1000) {
        return `${(hours / 1000).toFixed(1)}K hrs`;
    }
    return `${hours.toLocaleString("en-US")} hrs`;
}

function normalizePercentages(weights: number[]): number[] {
    const totalWeight = weights.reduce((acc, value) => acc + value, 0);
    if (totalWeight <= 0) {
        return weights.map(() => Math.floor(100 / weights.length));
    }

    const raw = weights.map((weight) => (weight / totalWeight) * 100);
    const rounded = raw.map((value) => Math.floor(value));
    const remaining = 100 - rounded.reduce((acc, value) => acc + value, 0);

    const remainders = raw
        .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
        .sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remaining; i++) {
        const target = remainders[i % remainders.length];
        rounded[target.index] += 1;
    }

    return rounded;
}

function allocateCounts(total: number, percentages: number[]): number[] {
    const raw = percentages.map((percentage) => (total * percentage) / 100);
    const counts = raw.map((value) => Math.floor(value));
    const remaining = total - counts.reduce((acc, value) => acc + value, 0);

    const remainders = raw
        .map((value, index) => ({ index, remainder: value - Math.floor(value) }))
        .sort((a, b) => b.remainder - a.remainder);

    for (let i = 0; i < remaining; i++) {
        const target = remainders[i % remainders.length];
        counts[target.index] += 1;
    }

    return counts;
}

function sanitizeFilename(filename: string, fallback: string): string {
    const normalized = normalizeText(filename, fallback);
    const safe = normalized
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, "-")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    return safe || fallback;
}

function parseDuration(duration: string): number {
    const parsed = Number.parseInt(duration, 10);
    if (!Number.isFinite(parsed)) {
        return 10;
    }
    return clampNumber(parsed, 3, 120);
}

const STOP_WORDS = new Set([
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "if", "in", "into", "is",
    "it", "its", "of", "on", "or", "that", "the", "their", "then", "this", "to", "was", "we", "with", "you",
    "your", "about", "after", "before", "between", "over", "under", "while", "during", "within", "without"
]);

function hashString(value: string): number {
    let hash = 5381;
    for (let i = 0; i < value.length; i++) {
        hash = (hash * 33) ^ value.charCodeAt(i);
    }
    return Math.abs(hash >>> 0);
}

function numberFromHash(seed: string, min: number, max: number): number {
    if (max <= min) return min;
    const range = max - min + 1;
    return min + (hashString(seed) % range);
}

function toTitleCase(value: string): string {
    return value
        .split(" ")
        .map((word) => word ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join(" ");
}

function getTokens(value: string): string[] {
    const matches = value.toLowerCase().match(/[a-z0-9]+/g);
    return matches ? matches : [];
}

function getKeyTerms(value: string, limit = 6): string[] {
    const tokens = getTokens(value);
    const seen = new Set<string>();
    const terms: string[] = [];

    for (const token of tokens) {
        if (STOP_WORDS.has(token)) continue;
        if (seen.has(token)) continue;
        seen.add(token);
        terms.push(token);
        if (terms.length >= limit) break;
    }

    return terms.length > 0 ? terms : tokens.slice(0, limit);
}

function uniqueList(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
        const key = value.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(value);
    }
    return out;
}

function estimateVolumeK(term: string): number {
    const tokens = getTokens(term);
    const avgLen = tokens.length === 0 ? 0 : tokens.reduce((acc, t) => acc + t.length, 0) / tokens.length;
    const base = 8 + tokens.length * 7 + Math.round(avgLen * 2.2);
    const variation = numberFromHash(term, 0, 18);
    return clampNumber(base + variation, 8, 120);
}

function estimateCompetition(term: string): number {
    const tokens = getTokens(term);
    const avgLen = tokens.length === 0 ? 0 : tokens.reduce((acc, t) => acc + t.length, 0) / tokens.length;
    const base = 20 + tokens.length * 8 + Math.round(avgLen * 1.8);
    const variation = numberFromHash(term + "|comp", 0, 20);
    return clampNumber(base + variation, 18, 88);
}

function estimateTrend(term: string): number {
    const tokens = getTokens(term);
    const base = 12 + tokens.length * 4;
    const variation = numberFromHash(term + "|trend", 5, 80);
    return clampNumber(base + variation, 10, 180);
}

function pickEmoji(seed: string, list: string[]): string {
    if (list.length === 0) return "✨";
    return list[hashString(seed) % list.length];
}

export function generateKeywordResults(seed: string) {
    const baseInput = normalizeText(seed, "youtube growth");
    const words = getKeyTerms(baseInput, 5);
    const base = words.length > 0 ? words.join(" ") : baseInput.toLowerCase();

    const emojis = ["🤖", "💰", "✨", "🎓", "🎬", "📱", "🔥", "💡", "🚀", "📊", "💎", "⚡"];

    const variants = uniqueList([
        base,
        `${base} for beginners`,
        `how to ${base}`,
        `best ${base} tips`,
        `${base} tutorial`,
        `learn ${base}`,
        `${base} guide`,
        `${base} 2026`,
        `advanced ${base}`,
        `complete ${base} checklist`,
    ]);

    const results = variants.slice(0, 8).map((keyword) => {
        const volumeK = estimateVolumeK(keyword);
        const competition = estimateCompetition(keyword);
        const trendValue = estimateTrend(keyword);
        const difficulty = competition < 40 ? "Low" : competition < 65 ? "Medium" : "High";
        const opportunity = clampNumber(Math.round((100 - competition) + trendValue * 0.1), 35, 99);

        return {
            keyword,
            volume: `${volumeK}K`,
            difficulty,
            trend: `+${trendValue}%`,
            competition,
            opportunity,
            emoji: pickEmoji(keyword, emojis),
        };
    });

    return results;
}

export function generateContentResults(topic: string, tone: string) {
    const normalizedTopic = normalizeText(topic, "content strategy");
    const normalizedTone = normalizeText(tone, "professional");
    const primaryTerms = getKeyTerms(normalizedTopic, 4);
    const topicTitle = toTitleCase(normalizedTopic);
    const numberSecrets = clampNumber(5 + numberFromHash(normalizedTopic + "|secrets", 0, 7), 5, 12);
    const numberMinutes = clampNumber(6 + numberFromHash(normalizedTopic + "|minutes", 0, 18), 5, 25);

    const toneMap: Record<string, { adj: string; style: string; cta: string }> = {
        professional: { adj: "Comprehensive", style: "In this expert analysis", cta: "Subscribe for more professional insights" },
        casual: { adj: "Epic", style: "Hey what's up everyone! Let's chat about", cta: "Drop a like if you vibed with this!" },
        hype: { adj: "INSANE", style: "THIS IS GOING TO BLOW YOUR MIND", cta: "SMASH that subscribe button RIGHT NOW!" },
        storytelling: { adj: "Incredible", style: "Let me tell you a story that changed everything", cta: "Follow along on this journey, subscribe" },
    };

    const t = toneMap[normalizedTone] || toneMap.professional;
    const primaryWord = normalizedTopic.split(" ")[0] || "content";

    const titles = [
        `${t.adj} ${topicTitle}: The Ultimate Guide`,
        `How ${topicTitle} Delivers Real Results`,
        `${numberSecrets} ${topicTitle} Secrets You Can Use Today`,
        `${topicTitle}: Everything You Need to Know`,
        `Master ${topicTitle} in ${numberMinutes} Minutes (Step-by-Step)`,
    ];

    const description = `${t.style}, we dive deep into ${normalizedTopic}. Whether you're a complete beginner or looking to level up, this guide has everything you need.

What you'll learn:
✅ The fundamentals of ${normalizedTopic}
✅ Advanced techniques and strategies
✅ Common mistakes to avoid
✅ Real-world examples and case studies
✅ Expert tips and recommendations

🔔 ${t.cta}
💬 Drop your questions in the comments
👍 Like if you found this helpful!

Timestamps:
0:00 - Introduction
2:15 - Getting Started with ${normalizedTopic}
5:30 - Advanced ${normalizedTopic} Strategies
8:45 - Common ${normalizedTopic} Mistakes
12:20 - Final Thoughts`;

    const script = `[INTRO]
${t.style}! Today we're diving into ${normalizedTopic}, and this will give you a practical roadmap.

[HOOK]
Have you ever struggled with ${normalizedTopic}? You're not alone. By the end, you'll know exactly what to do next.

[MAIN CONTENT]
Let's start with the basics of ${normalizedTopic} and quickly move into what actually works.

[CALL TO ACTION]
${t.cta}

[OUTRO]
Thanks for watching! See you in the next one.`;

    const tags = uniqueList([
        "#" + normalizedTopic.replace(/\s+/g, ""),
        "#Tutorial",
        "#HowTo",
        "#Learn",
        "#Guide",
        "#Tips",
        "#" + primaryWord,
        ...primaryTerms.map((term) => "#" + term),
    ]).slice(0, 10);

    const thumbnailIdeas = [
        `🎯 Large text: '${topicTitle}' with bold contrast`,
        "📊 Split screen: Before/After results with arrows",
        `🔥 Pointing at text with '${numberSecrets} SECRETS' overlay`,
        "💡 Lightbulb moment with excited expression and emojis",
    ];

    return { titles, description, tags, script, thumbnailIdeas };
}

export function generateScriptSections(topic: string, duration: string, style: string) {
    const normalizedTopic = normalizeText(topic, "content strategy");
    const normalizedStyle = normalizeText(style, "educational");
    const dur = parseDuration(duration);
    const templateOffset = numberFromHash(`${normalizedTopic}|${normalizedStyle}`, 0, 5);

    const styleHooks: Record<string, string> = {
        educational: `Welcome back! Today we're breaking down ${normalizedTopic} in a way that's easy to understand.`,
        entertainment: `What's up everyone! You won't BELIEVE what I discovered about ${normalizedTopic}!`,
        vlog: `Good morning! Today I'm sharing my real experience with ${normalizedTopic}.`,
        documentary: `In the rapidly evolving world of ${normalizedTopic}, understanding the fundamentals has never been more critical.`,
        review: `I've spent the last month testing ${normalizedTopic}, and here's my honest, unfiltered review.`,
    };

    const sectionCount = clampNumber(Math.floor(dur / 3), 2, 8);
    const outroBlock = clampNumber(dur * 0.12, 0.4, 1.5);
    let currentTime = 0;

    const formatTime = (mins: number) => {
        const safeMins = Math.max(0, mins);
        const m = Math.floor(safeMins);
        const s = Math.floor((safeMins - m) * 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const hookEnd = clampNumber(dur * 0.05, 0.2, 0.8);
    const hook = {
        time: `0:00-${formatTime(hookEnd)}`,
        text: styleHooks[normalizedStyle] || styleHooks.educational,
    };
    currentTime = hookEnd;

    const sectionTemplates = [
        { title: `Introduction to ${normalizedTopic}`, points: [`Define what ${normalizedTopic} means`, `Why ${normalizedTopic} matters in 2026`, "Who this video is for"], visuals: ["Title cards with key stats", "B-roll footage"] },
        { title: `Core Concepts of ${normalizedTopic}`, points: ["The fundamental principles", "Key terminology explained", "Common misconceptions"], visuals: ["Animated diagrams", "Screen recordings"] },
        { title: `Advanced ${normalizedTopic} Strategies`, points: ["Pro-level techniques", "Insider tips and tricks", "Case studies and examples"], visuals: ["Real examples", "Before/after comparisons"] },
        { title: `Practical ${normalizedTopic} Application`, points: ["Step-by-step walkthrough", "Live demonstration", "Tools and resources needed"], visuals: ["Screen recording", "Live demo footage"] },
        { title: `${normalizedTopic} Mistakes to Avoid`, points: ["Top mistakes beginners make", "How to fix common issues", "Best practices checklist"], visuals: ["List graphics", "Error examples"] },
        { title: `Future of ${normalizedTopic}`, points: ["Upcoming trends", "What to expect in 2026-2027", "How to stay ahead"], visuals: ["Trend charts", "Expert predictions"] },
    ];

    const sections = [];
    for (let i = 0; i < sectionCount; i++) {
        const template = sectionTemplates[(i + templateOffset) % sectionTemplates.length];
        const remainingForSections = Math.max(0.5, dur - outroBlock - currentTime);
        const remainingSections = sectionCount - i;
        const sectionDuration = Math.max(0.35, remainingForSections / remainingSections);
        const start = currentTime;
        currentTime = Math.min(dur - outroBlock, currentTime + sectionDuration);

        sections.push({
            title: template.title,
            time: `${formatTime(start)}-${formatTime(currentTime)}`,
            talking_points: template.points,
            visual_suggestions: template.visuals,
        });
    }

    const ctaStart = currentTime;
    const ctaEnd = Math.min(dur - 0.05, ctaStart + Math.max(0.25, outroBlock * 0.45));
    const cta = {
        time: `${formatTime(ctaStart)}-${formatTime(ctaEnd)}`,
        text: `If you found this helpful, LIKE this video and SUBSCRIBE for more ${normalizedTopic} content. Drop a comment telling me your biggest takeaway!`,
    };

    const outro = {
        time: `${formatTime(ctaEnd)}-${formatTime(dur)}`,
        text: "Thanks for watching! Check out the next video about related topics. See you there!",
    };

    const engagement_boosters = [
        `Add a pattern interrupt at the ${formatTime(dur / 3)} mark`,
        "Include a mini-challenge for viewers",
        `Reference a trending angle tied to ${normalizedTopic}`,
        "Use humor or relatable moments",
        `Ask a question around ${formatTime(dur / 2)} to boost comments`,
    ];

    return {
        title: `${normalizedTopic}: Complete ${normalizedStyle.charAt(0).toUpperCase() + normalizedStyle.slice(1)} Guide for 2026`,
        duration: `${dur} minutes`,
        hook,
        sections,
        cta,
        outro,
        engagement_boosters,
        keywords: ["how to", normalizedTopic, "tutorial", "guide", "2026", normalizedStyle],
    };
}

export function generateHashtags(topic: string) {
    const normalizedTopic = normalizeText(topic, "content creation");

    const slug = normalizedTopic.replace(/\s+/g, "");
    const slugLower = slug.toLowerCase();
    const words = normalizedTopic.toLowerCase().split(/\s+/);
    const firstWord = words[0] || "content";

    const trendingBase = [
        { prefix: "#", word: firstWord.charAt(0).toUpperCase() + firstWord.slice(1), volBase: 1500, trendBase: 80 },
        { prefix: "#", word: "AI" + firstWord.charAt(0).toUpperCase() + firstWord.slice(1), volBase: 800, trendBase: 120 },
        { prefix: "#", word: slug + "2026", volBase: 600, trendBase: 180 },
        { prefix: "#", word: "Best" + slug, volBase: 400, trendBase: 60 },
        { prefix: "#", word: slug + "Tips", volBase: 350, trendBase: 50 },
    ];

    const emojis = ["🔥", "⚡", "💬", "📈", "🚀", "🎯", "📚", "💡", "🔍", "✨", "🎬", "📖", "🌟", "💎", "🗺️"];
    const difficulties = ["Very High", "High", "Medium", "Low", "Very Low"];

    const makeTag = (base: { prefix: string; word: string; volBase: number; trendBase: number }, offset: number) => {
        const volumeK = clampNumber(
            base.volBase + numberFromHash(base.word + "|vol", -120, 180),
            20,
            1800
        );
        const trend = clampNumber(
            base.trendBase + numberFromHash(base.word + "|trend", -25, 60),
            10,
            220
        );

        let difficultyIndex = 2;
        if (volumeK > 1200) difficultyIndex = 0;
        else if (volumeK > 700) difficultyIndex = 1;
        else if (volumeK > 300) difficultyIndex = 2;
        else if (volumeK > 120) difficultyIndex = 3;
        else difficultyIndex = 4;

        return {
            tag: base.prefix + base.word,
            volume: formatCountInK(volumeK),
            trend: `+${trend}%`,
            difficulty: difficulties[difficultyIndex],
            emoji: emojis[(offset + (hashString(base.word) % emojis.length)) % emojis.length],
        };
    };

    const trending = trendingBase.map((base, index) => makeTag(base, index));

    const nicheBase = [
        { prefix: "#", word: slugLower + "community", volBase: 200, trendBase: 40 },
        { prefix: "#", word: "tutorialvideos", volBase: 450, trendBase: 32 },
        { prefix: "#", word: "learn" + firstWord, volBase: 300, trendBase: 28 },
        { prefix: "#", word: firstWord + "explained", volBase: 250, trendBase: 41 },
        { prefix: "#", word: "beginnerfriendly", volBase: 200, trendBase: 19 },
    ];
    const niche = nicheBase.map((base, index) => makeTag(base, index + 5));

    const longTailBase = [
        { prefix: "#", word: "howto" + slugLower, volBase: 45, trendBase: 67 },
        { prefix: "#", word: slugLower + "tutorial", volBase: 38, trendBase: 52 },
        { prefix: "#", word: "learn" + slugLower, volBase: 32, trendBase: 43 },
        { prefix: "#", word: slugLower + "tips", volBase: 28, trendBase: 38 },
        { prefix: "#", word: slugLower + "guide", volBase: 24, trendBase: 29 },
    ];
    const longTail = longTailBase.map((base, index) => makeTag(base, index + 10));

    const branded = [
        { tag: "#TubePulse", volume: "New", trend: "New", difficulty: "Very Low", emoji: "⚡" },
        { tag: `#${slug}WithMe`, volume: "New", trend: "New", difficulty: "Very Low", emoji: "👥" },
        { tag: "#YourChannelName", volume: "New", trend: "New", difficulty: "Very Low", emoji: "📺" },
    ];

    const bestCombinations = [
        {
            name: "Maximum Reach",
            tags: [trending[0].tag, trending[1].tag, niche[0].tag, longTail[0].tag, `#${slug}`],
            expectedReach: `${(3.5 + numberFromHash(slug + "|reachA", 0, 60) / 10).toFixed(1)}M`,
            difficulty: "High",
        },
        {
            name: "Balanced Growth",
            tags: [niche[1].tag, niche[2].tag, longTail[1].tag, longTail[2].tag, "#beginnerfriendly"],
            expectedReach: `${(1 + numberFromHash(slug + "|reachB", 0, 30) / 10).toFixed(1)}M`,
            difficulty: "Medium",
        },
        {
            name: "Low Competition Win",
            tags: [longTail[0].tag, longTail[1].tag, longTail[3].tag, branded[0].tag, branded[1].tag],
            expectedReach: `${Math.floor(200 + numberFromHash(slug + "|reachC", 0, 420))}K`,
            difficulty: "Very Low",
        },
    ];

    const tips = [
        "Use 3-5 hashtags per video for optimal reach",
        "Mix high-volume and low-competition tags",
        "Place your most important hashtag first",
        "Include branded hashtags to build community",
        "Update hashtags based on trending topics weekly",
    ];

    return { trending, niche, longTail, branded, bestCombinations, tips };
}

export function generateCompetitorData(url: string) {
    const normalizedUrl = normalizeText(url, "youtube-channel");
    const slugSource = normalizedUrl
        .replace(/^https?:\/\//i, "")
        .replace(/\?.*$/, "")
        .split("/")
        .filter(Boolean)
        .pop() || normalizedUrl;
    const slug = slugSource.replace(/^@/, "").replace(/[^a-zA-Z0-9_-]/g, "").trim() || "YouTube Channel";
    const name = toTitleCase(slug.replace(/[-_]+/g, " "));

    const subscribersK = numberFromHash(slug + "|subs", 25, 980);
    const videos = numberFromHash(slug + "|videos", 40, 1400);
    const totalViewsM = Number(((subscribersK * (4 + numberFromHash(slug + "|views", 0, 18) / 2)) / 10).toFixed(1));
    const avgViewsK = Number(((totalViewsM * 1000) / Math.max(1, videos)).toFixed(1));

    const themePercentages = normalizePercentages([
        28 + numberFromHash(slug + "|themeA", 0, 30),
        18 + numberFromHash(slug + "|themeB", 0, 24),
        12 + numberFromHash(slug + "|themeC", 0, 20),
    ]);
    const themeVideoCounts = allocateCounts(videos, themePercentages);

    return {
        channel: {
            name,
            subscribers: `${subscribersK}K`,
            videos,
            totalViews: `${totalViewsM}M`,
            joinedDate: `${numberFromHash(slug + "|years", 1, 10)} years ago`,
            uploadFrequency: `${numberFromHash(slug + "|freq", 1, 6)} videos/week`,
            avgViews: `${avgViewsK}K`,
            emoji: pickEmoji(slug, ["💻", "🎬", "📊", "🚀", "🎯"]),
        },
        strengths: [
            { title: "Consistent Upload Schedule", description: `Posts ${numberFromHash(slug + "|posts", 2, 6)} times weekly, maintaining audience engagement`, impact: "High", icon: "📅" },
            { title: "High Engagement Rate", description: `${(4.5 + numberFromHash(slug + "|eng", 0, 60) / 10).toFixed(1)}% average engagement, above industry standard`, impact: "High", icon: "💬" },
            { title: "SEO Optimization", description: "Strong keyword usage in titles and descriptions", impact: "Medium", icon: "🔍" },
        ],
        weaknesses: [
            { title: "Inconsistent Thumbnail Style", description: "Lack of brand identity across thumbnails", opportunity: "Rebrand thumbnails for +25% CTR", icon: "🎨" },
            { title: "Limited Call-to-Actions", description: `Only ${numberFromHash(slug + "|cta", 18, 55)}% of videos include strong CTAs`, opportunity: "Add CTAs to boost subscriptions", icon: "📢" },
        ],
        topVideos: [
            { title: `${toTitleCase(getKeyTerms(normalizedUrl, 2).join(" "))} Deep Dive`, views: `${numberFromHash(slug + "|v1", 60, 240)}K`, ctr: `${(6.5 + numberFromHash(slug + "|ctr1", 0, 45) / 10).toFixed(1)}%`, engagement: `${(4.5 + numberFromHash(slug + "|eng1", 0, 35) / 10).toFixed(1)}%`, emoji: "🤖" },
            { title: "Secrets Nobody Tells You", views: `${numberFromHash(slug + "|v2", 50, 190)}K`, ctr: `${(6.2 + numberFromHash(slug + "|ctr2", 0, 45) / 10).toFixed(1)}%`, engagement: `${(4.0 + numberFromHash(slug + "|eng2", 0, 35) / 10).toFixed(1)}%`, emoji: "🔐" },
            { title: "Make Money with AI Tools", views: `${numberFromHash(slug + "|v3", 40, 160)}K`, ctr: `${(5.8 + numberFromHash(slug + "|ctr3", 0, 45) / 10).toFixed(1)}%`, engagement: `${(3.8 + numberFromHash(slug + "|eng3", 0, 30) / 10).toFixed(1)}%`, emoji: "💰" },
        ],
        contentThemes: [
            { theme: "AI & Automation", percentage: themePercentages[0], videos: themeVideoCounts[0] },
            { theme: "Tech Reviews", percentage: themePercentages[1], videos: themeVideoCounts[1] },
            { theme: "Tutorials", percentage: themePercentages[2], videos: themeVideoCounts[2] },
        ],
        postingSchedule: {
            bestDays: ["Tuesday", "Thursday"],
            bestTimes: ["10:00 AM", "6:00 PM"],
            avgDuration: `${numberFromHash(slug + "|durM", 6, 16)}:${numberFromHash(slug + "|durS", 0, 59).toString().padStart(2, "0")}`,
        },
        recommendations: [
            `Adopt their ${numberFromHash(slug + "|freq2", 2, 6)}x/week posting schedule for consistency`,
            "Study their top 10 performing video titles and adapt the formula",
            `Create more ${numberFromHash(slug + "|lenA", 7, 12)}-${numberFromHash(slug + "|lenB", 13, 20)} minute videos (their sweet spot)`,
            "Improve thumbnail consistency with brand colors",
            "Add end screens to all videos like they do",
        ],
    };
}

export function generateOutlierData(category: string) {
    const normalizedCategory = normalizeText(category, "all");
    const validCategories = new Set(["all", "tech", "business", "education", "lifestyle"]);
    const safeCategory = validCategories.has(normalizedCategory) ? normalizedCategory : "all";

    const allOutliers = [
        { id: 1, title: "This AI Tool Generated $50K in 30 Days", channel: "AI Hustler", cat: "tech", emoji: "🤖💰" },
        { id: 2, title: "I Quit My Job to Build This AI Business", channel: "TechStory", cat: "business", emoji: "🚀💼" },
        { id: 3, title: "ChatGPT Automation Blueprint (Free Course)", channel: "Automation Pro", cat: "education", emoji: "⚡📚" },
        { id: 4, title: "AI Will Replace These 10 Jobs First", channel: "Future Insights", cat: "tech", emoji: "⚠️🔮" },
        { id: 5, title: "Build a SaaS with AI in One Weekend", channel: "Code Fast", cat: "tech", emoji: "💻⏱️" },
        { id: 6, title: "My Morning Routine as a 6-Figure Creator", channel: "Creator Life", cat: "lifestyle", emoji: "☀️✨" },
        { id: 7, title: "The $0 to $100K Business Blueprint", channel: "Money Mentor", cat: "business", emoji: "💵📈" },
        { id: 8, title: "Learn Python in 1 Hour (Complete Course)", channel: "CodeAcademy", cat: "education", emoji: "🐍📖" },
        { id: 9, title: "How I Built My Dream Home Office", channel: "Desk Setup", cat: "lifestyle", emoji: "🏠💻" },
        { id: 10, title: "The Future of AI Agents Explained", channel: "AI Weekly", cat: "tech", emoji: "🤖🌐" },
    ];

    const filtered = safeCategory === "all"
        ? allOutliers
        : allOutliers.filter((outlier) => outlier.cat === safeCategory);

    const reasons = [
        "Perfect timing with trending topic + clear value proposition",
        "Emotional hook + trending topic combination",
        "Free value offer + searchable keyword optimization",
        "Fear-based curiosity + listicle format",
        "Actionable timeframe + specific outcome",
    ];

    return filtered.map((outlier, index) => {
        const seed = `${outlier.title}|${safeCategory}`;
        const viewsK = numberFromHash(seed + "|views", 800, 3200);
        const expectedK = numberFromHash(seed + "|expected", 30, 140);
        const multiplier = (viewsK / Math.max(1, expectedK)).toFixed(1);

        return {
            ...outlier,
            views: formatCountInK(viewsK),
            expectedViews: `${expectedK}K`,
            multiplier: `${multiplier}x`,
            uploadedDays: numberFromHash(seed + "|days", 1, 14),
            subscribers: `${(numberFromHash(seed + "|subs", 5, 30) / 1).toFixed(1)}K`,
            viralScore: numberFromHash(seed + "|score", 82, 98),
            reason: reasons[(index + (hashString(seed) % reasons.length)) % reasons.length],
        };
    });
}

export function generateAnalyticsData(timeRange: string) {
    const normalizedRange = ["7d", "30d", "90d", "1y"].includes(timeRange) ? timeRange : "7d";
    const multiplier = normalizedRange === "7d" ? 1 : normalizedRange === "30d" ? 4 : normalizedRange === "90d" ? 10 : 30;

    const viewsK = Math.floor(420 * multiplier * (0.9 + numberFromHash(normalizedRange + "|views", 0, 30) / 100));
    const watchHours = Math.floor(900 * multiplier * (0.85 + numberFromHash(normalizedRange + "|watch", 0, 25) / 100));
    const subscribersK = Number((1.5 * multiplier * (0.85 + numberFromHash(normalizedRange + "|subs", 0, 30) / 100)).toFixed(1));

    const stats = [
        { label: "Total Views", value: formatCountInK(viewsK), change: `+${(9 + numberFromHash(normalizedRange + "|c1", 0, 10) / 10).toFixed(1)}%`, icon: "Eye", color: "blue", trend: "up" },
        { label: "Watch Time", value: formatHours(watchHours), change: `+${(7 + numberFromHash(normalizedRange + "|c2", 0, 10) / 10).toFixed(1)}%`, icon: "Clock", color: "purple", trend: "up" },
        { label: "Subscribers", value: `${subscribersK.toFixed(1)}K`, change: `+${(4 + numberFromHash(normalizedRange + "|c3", 0, 10) / 10).toFixed(1)}%`, icon: "Users", color: "green", trend: "up" },
        { label: "Engagement Rate", value: `${(5.2 + numberFromHash(normalizedRange + "|c4", 0, 20) / 10).toFixed(1)}%`, change: `+${(1 + numberFromHash(normalizedRange + "|c5", 0, 20) / 10).toFixed(1)}%`, icon: "ThumbsUp", color: "orange", trend: "up" },
    ];

    const barCount = normalizedRange === "7d" ? 7 : normalizedRange === "30d" ? 14 : 12;
    const chartData = Array.from({ length: barCount }, (_, i) => 45 + (numberFromHash(`${normalizedRange}|bar|${i}`, 0, 50)));

    const topVideos = [
        { title: "AI Tools That Changed My Life", emoji: "🤖" },
        { title: "Make Money with ChatGPT", emoji: "💰" },
        { title: "Coding Tutorial for Beginners", emoji: "💻" },
        { title: "Passive Income Secrets", emoji: "💎" },
        { title: "AI Automation Blueprint", emoji: "⚡" },
    ].map((video, i) => ({
        ...video,
        views: `${numberFromHash(`${normalizedRange}|top|${i}`, 80, 260)}K`,
        ctr: `${(7.5 + numberFromHash(`${normalizedRange}|ctr|${i}`, 0, 40) / 10).toFixed(1)}%`,
        engagement: `${(4.5 + numberFromHash(`${normalizedRange}|eng|${i}`, 0, 40) / 10).toFixed(1)}%`,
    }));

    const trafficWeights = [
        35 + numberFromHash(normalizedRange + "|t1", 0, 12),
        20 + numberFromHash(normalizedRange + "|t2", 0, 12),
        10 + numberFromHash(normalizedRange + "|t3", 0, 8),
        5 + numberFromHash(normalizedRange + "|t4", 0, 8),
        3 + numberFromHash(normalizedRange + "|t5", 0, 6),
    ];
    const trafficPercentages = normalizePercentages(trafficWeights);

    const trafficSources = [
        { source: "YouTube Search", percentage: trafficPercentages[0], color: "red" },
        { source: "Suggested Videos", percentage: trafficPercentages[1], color: "blue" },
        { source: "Browse Features", percentage: trafficPercentages[2], color: "green" },
        { source: "External", percentage: trafficPercentages[3], color: "purple" },
        { source: "Playlists", percentage: trafficPercentages[4], color: "orange" },
    ];

    const engagement = {
        likes: numberFromHash(normalizedRange + "|likes", 52, 92),
        comments: numberFromHash(normalizedRange + "|comments", 32, 82),
        shares: numberFromHash(normalizedRange + "|shares", 20, 70),
        saves: numberFromHash(normalizedRange + "|saves", 25, 75),
    };

    return { stats, chartData, topVideos, trafficSources, engagement };
}

export function generateOptimizeData(period: string) {
    const normalizedPeriod = ["7d", "30d", "90d", "1y"].includes(period) ? period : "30d";
    const multiplier = normalizedPeriod === "7d" ? 1 : normalizedPeriod === "30d" ? 4 : normalizedPeriod === "90d" ? 10 : 30;

    const views = Math.floor(120000 * multiplier * (0.9 + numberFromHash(normalizedPeriod + "|views", 0, 25) / 100));
    const subscribers = Math.floor(1400 * multiplier * (0.85 + numberFromHash(normalizedPeriod + "|subs", 0, 30) / 100));
    const watchTimeHours = Math.floor(8500 * multiplier * (0.85 + numberFromHash(normalizedPeriod + "|watch", 0, 30) / 100));

    const numberFormat = new Intl.NumberFormat("en-US");
    const durationMinutes = numberFromHash(normalizedPeriod + "|durM", 3, 7);
    const durationSeconds = numberFromHash(normalizedPeriod + "|durS", 0, 59).toString().padStart(2, "0");

    return {
        stats: [
            { label: "Total Views", value: numberFormat.format(views), change: `+${(9 + numberFromHash(normalizedPeriod + "|c1", 0, 20) / 10).toFixed(1)}%`, trend: "up", color: "blue" },
            { label: "Subscribers", value: numberFormat.format(subscribers), change: `+${(4 + numberFromHash(normalizedPeriod + "|c2", 0, 15) / 10).toFixed(1)}%`, trend: "up", color: "green" },
            { label: "Watch Time (hrs)", value: numberFormat.format(watchTimeHours), change: `+${(12 + numberFromHash(normalizedPeriod + "|c3", 0, 20) / 10).toFixed(1)}%`, trend: "up", color: "purple" },
            { label: "Avg. View Duration", value: `${durationMinutes}:${durationSeconds}`, change: `+${(1 + numberFromHash(normalizedPeriod + "|c4", 0, 25) / 10).toFixed(1)}%`, trend: "up", color: "orange" },
        ],
        health: {
            overall: numberFromHash(normalizedPeriod + "|h1", 70, 90),
            content: numberFromHash(normalizedPeriod + "|h2", 72, 92),
            engagement: numberFromHash(normalizedPeriod + "|h3", 60, 88),
            growth: numberFromHash(normalizedPeriod + "|h4", 68, 90),
            retention: numberFromHash(normalizedPeriod + "|h5", 55, 85),
        },
        topVideos: [
            { title: "Complete Guide to AI in 2026", thumbnail: "🎬" },
            { title: "10 Tools Every Creator Needs", thumbnail: "🛠️" },
            { title: "My Strategy Revealed", thumbnail: "💰" },
            { title: "Behind the Scenes: My Setup Tour", thumbnail: "🎥" },
            { title: "How I Grew to 50K Subscribers", thumbnail: "📈" },
        ].map((video, i) => ({
            ...video,
            views: `${numberFromHash(`${normalizedPeriod}|tv|${i}`, 50, 220)}K`,
            engagement: `${(5.5 + numberFromHash(`${normalizedPeriod}|te|${i}`, 0, 60) / 10).toFixed(1)}%`,
        })),
    };
}

export function generateThumbnailSearchResults(query: string, filter: string) {
    const normalizedQuery = normalizeText(query, "youtube growth strategy");
    const normalizedFilter = ["all", "high-ctr", "trending", "recent"].includes(filter) ? filter : "all";
    const words = getKeyTerms(normalizedQuery, 4);
    const compactQuery = words.slice(0, 3).join(" ") || normalizedQuery;
    const emojis = ["🤖", "💰", "🎬", "⚡", "🚀", "💎", "🔥", "💻", "📊", "🎨"];

    const titles = [
        `${compactQuery} - The Ultimate Guide`,
        `How to ${normalizedQuery} (Step by Step)`,
        `${numberFromHash(normalizedQuery + "|tips", 5, 14)} ${normalizedQuery} Tips Nobody Tells You`,
        `${normalizedQuery}: Everything You NEED to Know`,
        `Master ${normalizedQuery} in 2026`,
        `The Truth About ${normalizedQuery} (Exposed)`,
        `Why ${normalizedQuery} Will Change Everything`,
        `${normalizedQuery} for Beginners - Full Course`,
    ];

    const initialResults = titles
        .slice(0, 7)
        .map((title, index) => {
            const seed = `${title}|${normalizedFilter}`;
            const ctrNum = Number((6 + numberFromHash(seed + "|ctr", 0, 45) / 5).toFixed(1));
            const viewsK = numberFromHash(seed + "|views", 200, 1600);
            const score = numberFromHash(seed + "|score", 70, 99);
            const daysAgo = numberFromHash(seed + "|days", 1, 60);

            return {
                id: index + 1,
                title,
                views: formatCountInK(viewsK),
                ctr: `${ctrNum.toFixed(1)}%`,
                ctrNum,
                thumbnail: pickEmoji(seed, emojis),
                score,
                daysAgo,
            };
        });

    let filtered = [...initialResults];
    if (normalizedFilter === "high-ctr") {
        filtered = filtered.filter((result) => result.ctrNum > 9);
    }
    if (normalizedFilter === "trending") {
        filtered = filtered.filter((result) => result.daysAgo < 14);
    }
    if (normalizedFilter === "recent") {
        filtered = filtered.sort((a, b) => a.daysAgo - b.daysAgo);
    }

    if (filtered.length === 0) {
        return initialResults
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
    }

    return filtered;
}

export function generateABTestResults(testType: string, variantAName: string, variantBName: string) {
    const normalizedTestType = normalizeText(testType, "thumbnail");
    const safeVariantA = normalizeText(variantAName, "Original");
    const safeVariantB = normalizeText(variantBName, "Variant B");
    const seed = `${normalizedTestType}|${safeVariantA}|${safeVariantB}`;

    const aImpressions = numberFromHash(seed + "|aImp", 9000, 22000);
    const bImpressions = numberFromHash(seed + "|bImp", 9000, 22000);
    const aCtr = Number(clampNumber(3 + numberFromHash(seed + "|aCtr", 0, 90) / 10, 2.5, 12).toFixed(2));
    const lengthLift = (safeVariantB.length - safeVariantA.length) * 0.05;
    const baseLift = numberFromHash(seed + "|lift", -12, 12) / 10;
    const bCtr = Number(clampNumber(aCtr + lengthLift + baseLift, 1.5, 20).toFixed(2));

    const aClicks = Math.floor(aImpressions * (aCtr / 100));
    const bClicks = Math.floor(bImpressions * (bCtr / 100));

    const winner = bCtr > aCtr ? "b" : "a";
    const winnerCtr = winner === "a" ? aCtr : bCtr;
    const loserCtr = winner === "a" ? bCtr : aCtr;
    const improvementPct = ((winnerCtr / loserCtr) - 1) * 100;
    const improvement = improvementPct.toFixed(1);

    const ctrDiff = Math.abs(aCtr - bCtr);
    const sampleStrength = Math.min(1, (aImpressions + bImpressions) / 40000);
    const confidence = clampNumber(
        Math.round(65 + ctrDiff * 4 + sampleStrength * 20 + numberFromHash(seed + "|conf", 0, 6)),
        65,
        99
    );

    const typeLabel = normalizedTestType === "thumbnail"
        ? "thumbnail design"
        : normalizedTestType === "title"
            ? "title"
            : "description";

    const watchBaseA = 2.8 + numberFromHash(seed + "|watchA", 0, 26) / 10;
    const watchBaseB = watchBaseA * (1 + (bCtr - aCtr) / 100);
    const aWatchMinutes = Math.floor(watchBaseA);
    const bWatchMinutes = Math.floor(watchBaseB);
    const aWatchSeconds = Math.floor((watchBaseA - aWatchMinutes) * 60).toString().padStart(2, "0");
    const bWatchSeconds = Math.floor((watchBaseB - bWatchMinutes) * 60).toString().padStart(2, "0");

    const winnerName = winner === "a" ? safeVariantA : safeVariantB;

    return {
        variantA: {
            name: safeVariantA,
            impressions: aImpressions,
            clicks: aClicks,
            ctr: aCtr.toFixed(1),
            conversionRate: (aCtr * (0.55 + numberFromHash(seed + "|convA", 0, 25) / 100)).toFixed(1),
            avgWatchTime: `${aWatchMinutes}:${aWatchSeconds}`,
            emoji: "📸",
        },
        variantB: {
            name: safeVariantB,
            impressions: bImpressions,
            clicks: bClicks,
            ctr: bCtr.toFixed(1),
            conversionRate: (bCtr * (0.55 + numberFromHash(seed + "|convB", 0, 25) / 100)).toFixed(1),
            avgWatchTime: `${bWatchMinutes}:${bWatchSeconds}`,
            emoji: "🎨",
        },
        winner,
        improvement: `+${improvement}%`,
        confidence,
        recommendation: `${winnerName} outperforms for ${typeLabel} with a ${improvement}% lift. Keep the winner live and rerun with one new variation for continuous gains.`,
        insights: [
            `The winning ${typeLabel} attracted ${improvement}% more clicks per impression`,
            "Clarity and contrast likely influenced the CTR difference",
            `Estimated confidence is ${confidence}% based on sample size and performance gap`,
            `Average watch time moved by about ${numberFromHash(seed + "|watchMove", 15, 65)} seconds`,
        ],
    };
}

export function generateOptimizeInsights(period: string) {
    const normalizedPeriod = ["7d", "30d", "90d", "1y"].includes(period) ? period : "30d";
    const seed = "insights" + normalizedPeriod;

    const allInsights: { title: string; description: string; priority: Priority }[] = [
        { title: "Optimal Upload Time", description: `Your audience is most active on ${["Tuesdays", "Wednesdays", "Thursdays"][numberFromHash(seed + "|d1", 0, 2)]} and ${["Thursdays", "Fridays", "Saturdays"][numberFromHash(seed + "|d2", 0, 2)]} at ${numberFromHash(seed + "|time", 4, 9)} PM EST. Schedule uploads during these windows for ${numberFromHash(seed + "|lift1", 20, 45)}% more initial views.`, priority: "high" },
        { title: "Trending Topic Opportunity", description: `Videos about "${["AI automation", "passive income", "coding tools", "productivity hacks", "ChatGPT"][numberFromHash(seed + "|topic", 0, 4)]}" in your niche are seeing ${numberFromHash(seed + "|lift2", 30, 65)}% higher engagement. Create content around this theme.`, priority: "high" },
        { title: "Improve CTR", description: `Your average CTR is ${(3.2 + numberFromHash(seed + "|ctr", 0, 25) / 10).toFixed(1)}%. Test more vibrant thumbnails with contrasting colors to reach the ${(6.5 + numberFromHash(seed + "|ctr2", 0, 20) / 10).toFixed(0)}% benchmark. A/B testing shows faces and arrows increase CTR by ${numberFromHash(seed + "|lift3", 15, 38)}%.`, priority: "medium" },
        { title: "Engagement Boost", description: `Videos with pinned comments receive ${numberFromHash(seed + "|lift4", 25, 50)}% more engagement. Always pin a conversation starter within the first hour. Ask a question to boost comment rates.`, priority: "medium" },
        { title: "Video Length Sweet Spot", description: `Your top performing videos average ${numberFromHash(seed + "|lenA", 8, 15)} minutes. Videos in this range get ${numberFromHash(seed + "|lenB", 15, 35)}% more watch time than shorter or longer content.`, priority: "high" },
        { title: "Thumbnail Style Consistency", description: `Maintain a consistent thumbnail style with your brand colors. Channels with recognizable thumbnails see ${numberFromHash(seed + "|lift5", 20, 40)}% higher returning viewer rates.`, priority: "medium" },
    ];

    const selected: typeof allInsights = [];
    const usedIndices = new Set<number>();

    const start = numberFromHash(seed + "|start", 0, allInsights.length - 1);
    for (let i = 0; i < allInsights.length && selected.length < 4; i++) {
        const index = (start + i * 2) % allInsights.length;
        if (usedIndices.has(index)) continue;
        usedIndices.add(index);
        selected.push(allInsights[index]);
    }

    return selected;
}

export function generateDashboardStats() {
    const seed = "dashboard2026";

    return {
        channelViews: `${(0.8 + numberFromHash(seed + "|views", 0, 15) / 10).toFixed(1)}M`,
        channelViewsChange: `+${(10 + numberFromHash(seed + "|viewsC", 0, 12) / 10).toFixed(1)}%`,
        subscribers: `${(30 + numberFromHash(seed + "|subs", 0, 40) / 1).toFixed(1)}K`,
        subscribersChange: `+${(5 + numberFromHash(seed + "|subsC", 0, 10) / 10).toFixed(1)}%`,
        videosPublished: `${numberFromHash(seed + "|videos", 150, 360)}`,
        videosChange: `+${numberFromHash(seed + "|videosC", 5, 20)}`,
        growthRate: `+${numberFromHash(seed + "|growth", 8, 20)}%`,
        growthChange: `↑ ${(1 + numberFromHash(seed + "|growthC", 0, 30) / 10).toFixed(1)}%`,
        recentActivity: [
            { action: "Generated AI Thumbnail", time: `${numberFromHash(seed + "|a1", 1, 4)} hours ago`, icon: "🎨" },
            { action: "Keyword Research Completed", time: `${numberFromHash(seed + "|a2", 3, 8)} hours ago`, icon: "🔑" },
            { action: "Content Ideas Generated", time: `${numberFromHash(seed + "|a3", 1, 2)} days ago`, icon: "✨" },
            { action: "Channel Analysis Updated", time: `${numberFromHash(seed + "|a4", 1, 3)} days ago`, icon: "📊" },
            { action: "A/B Test Completed", time: `${numberFromHash(seed + "|a5", 2, 6)} days ago`, icon: "🧪" },
            { action: "Script Generated", time: `${numberFromHash(seed + "|a6", 3, 7)} days ago`, icon: "🎬" },
        ],
    };
}

export function downloadAsFile(content: string, filename: string, type = "text/plain") {
    const safeFilename = sanitizeFilename(filename, "download.txt");
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = safeFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function exportToCSV(headers: string[], rows: string[][], filename: string) {
    const escapeCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csvLines = [
        headers.map(escapeCell).join(","),
        ...rows.map((row) => row.map((cell) => escapeCell(cell)).join(",")),
    ];

    const safeFilename = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
    downloadAsFile(`\uFEFF${csvLines.join("\r\n")}`, safeFilename, "text/csv;charset=utf-8;");
}
