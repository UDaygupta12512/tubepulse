<div align="center">

<img src="https://img.shields.io/badge/TubePulse-AI%20YouTube%20Intelligence%20Platform-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="TubePulse Banner" />

<br/>
<br/>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/Groq-LLaMA%203.3%2070B-F55036?style=flat-square" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel" />
</p>

<h1>⚡ TubePulse</h1>
<h3>The All-in-One AI Intelligence Platform for YouTube Creators</h3>

<p>Generate viral scripts, optimize thumbnails, find explosive keywords, analyze competitors, and grow your channel — all powered by Groq's lightning-fast Llama 3.3 70B AI.</p>

<br/>

[🚀 Live Demo](#) · [📖 Documentation](#-features) · [🐛 Report Bug](https://github.com/UDaygupta12512/tubepulse/issues) · [💡 Request Feature](https://github.com/UDaygupta12512/tubepulse/issues)

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🔑 Environment Variables](#-environment-variables)
- [📡 API Reference](#-api-reference)
- [⚡ Performance Optimizations](#-performance-optimizations)
- [🚢 Deployment](#-deployment)
- [📁 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)

---

## ✨ Features

TubePulse offers **15 powerful tools** across 3 core categories:

### 🤖 AI Content Generation
| Tool | Description |
|------|-------------|
| **📝 Script Generator** | Generates full video scripts with A/B hook testing, A/V direction, and retention risk scores. Supports real-time token streaming (watch it write!) |
| **📋 Content Generator** | Creates SEO-optimized titles, descriptions, chapters, hashtags, and community post ideas from a single topic |
| **#️⃣ Hashtag Generator** | Produces categorized hashtag sets with relevance scores for any niche |

### 📊 Analytics & Intelligence
| Tool | Description |
|------|-------------|
| **📈 Channel Analytics** | Live YouTube data: views, subscribers, engagement rates, top videos, and trend graphs |
| **🏆 Competitor Analysis** | Deep-dive analysis of any competitor's channel — their top videos, posting frequency, and tag strategy |
| **🎯 Outlier Detector** | Identifies viral outlier videos in your niche by analyzing performance vs. channel average |
| **🔒 Retention Analyzer** | Predicts video retention curves before you film using AI scoring on your script |

### 🛠️ Optimization Tools
| Tool | Description |
|------|-------------|
| **🔍 Keyword Research** | Zero-cost keyword research using YouTube's own autocomplete API with local mathematical volume/competition scoring |
| **🖼️ Thumbnail Analyzer** | Multi-modal AI vision analyzes thumbnails for CTR potential, composition, color, and facial expressions |
| **🖼️ Thumbnail Generator** | Generate professional thumbnail concepts and ideas with AI |
| **🔍 Thumbnail Search** | Search and browse top-performing thumbnails in any niche |
| **⚙️ Video Optimizer** | Audit any existing video's metadata and get an improvement score with actionable suggestions |
| **🤖 Autonomous Agent** | A background AI agent that runs multi-step research tasks on your behalf |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                     │
│                                                         │
│  React 19 + Next.js App Router + TailwindCSS            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ React Query  │  │   Zustand    │  │ Framer Motion│  │
│  │  (Caching)   │  │ (Drafts/State│  │ (Animations) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP / Server-Sent Events (SSE)
┌──────────────────────▼──────────────────────────────────┐
│               NEXT.JS SERVER (Edge/Node.js)             │
│                                                         │
│  ┌────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Rate Limiter│  │  LRU Cache   │  │ Zod Validator  │  │
│  │  15 req/min │  │ 200 entries  │  │  Auto-Retry x2 │  │
│  └────────────┘  └──────────────┘  └────────────────┘  │
│                                                         │
│  API Routes: /api/script, /api/content, /api/keywords.. │
└──────┬──────────────────────────────┬───────────────────┘
       │                              │
┌──────▼──────────┐          ┌────────▼────────────────┐
│   GROQ API      │          │  YouTube Data API v3     │
│  Llama 3.3 70B  │          │  Google Suggest API      │
│  (AI Generation)│          │  (Real-time Context)     │
└─────────────────┘          └─────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** — App Router, Server Components, Turbopack
- **[React 19](https://react.dev/)** — Latest React with concurrent features
- **[TypeScript 5](https://www.typescriptlang.org/)** — Full type safety across the codebase
- **[TailwindCSS 3.4](https://tailwindcss.com/)** — Utility-first styling with custom glassmorphism design system
- **[Framer Motion](https://www.framer-motion.com/)** — Page transitions and micro-animations
- **[Recharts](https://recharts.org/)** — Analytics data visualizations
- **[Lucide React](https://lucide.dev/)** — Consistent icon system

### State Management & Data Fetching
- **[TanStack Query (React Query)](https://tanstack.com/query)** — Server state, caching, and background refetching
- **[Zustand](https://zustand-demo.pmnd.rs/)** — Lightweight global state with localStorage persistence (never lose your drafts!)

### Backend & AI
- **[Groq SDK](https://groq.com/)** — Ultra-fast Llama 3.3 70B inference (free tier: 14,400 req/day)
- **[Next-Auth v4](https://next-auth.js.org/)** — Email/password + OAuth authentication
- **[Prisma ORM](https://www.prisma.io/)** — Database layer for user accounts and history

### Performance & Reliability
- **Custom LRU Cache** — In-memory server-side caching (SHA-256 keyed, 200 entry limit, 24hr TTL)
- **Zod Schema Validation** — AI output validation with auto-retry on hallucinated responses
- **fetchWithRetry** — Exponential backoff (1s→2s→4s) on network failures and 429/5xx errors
- **AbortController** — Race condition prevention for rapid user interactions
- **HTTP Streaming (SSE)** — Token-by-token script rendering with `ReadableStream`
- **React ErrorBoundary** — Graceful fallback UI if AI returns an unrenderable response

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** — [Download here](https://nodejs.org/)
- **A free Groq API key** — [console.groq.com](https://console.groq.com) (No credit card needed)
- **A YouTube Data API v3 key** — [Google Cloud Console](https://console.cloud.google.com/)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/UDaygupta12512/tubepulse.git
cd tubepulse
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up your environment variables**
```bash
# Create a .env.local file in the project root
cp .env.example .env.local
```

Then open `.env.local` and fill in your API keys (see [Environment Variables](#-environment-variables) below).

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser and visit** [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# ============================================================
# 🤖 AI PROVIDERS
# ============================================================

# Groq API (REQUIRED - Free at console.groq.com)
# Powers all AI generation: scripts, content, hashtags, vision
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Google Gemini API (Optional - fallback AI provider)
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# ============================================================
# 📺 YOUTUBE DATA API
# ============================================================

# YouTube Data API v3 (REQUIRED for analytics & search)
# Get it from: console.cloud.google.com → Enable "YouTube Data API v3"
YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx


# ============================================================
# 🔐 AUTHENTICATION (NextAuth)
# ============================================================

# Required: A random 32-character secret string
# Generate one with: openssl rand -base64 32
NEXTAUTH_SECRET=your_random_32_character_secret_here

# Your app URL (http://localhost:3000 for local development)
# Change to your Vercel URL for production: https://yourapp.vercel.app
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (Optional - enables "Sign in with Google")
# Create at: console.cloud.google.com → APIs & Services → Credentials
GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxx


# ============================================================
# 🗄️ DATABASE (Prisma)
# ============================================================

# Your database connection string
# For local development with SQLite:
DATABASE_URL="file:./dev.db"

# For production (PostgreSQL recommended):
# DATABASE_URL="postgresql://user:password@host:5432/tubepulse"
```

### How to Get Each API Key

| Key | Where to Get It | Cost |
|-----|----------------|------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys | **Free** (14,400 req/day) |
| `YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → Enable YouTube Data API v3 | **Free** (10,000 req/day) |
| `NEXTAUTH_SECRET` | Run `openssl rand -base64 32` in a terminal | Free |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 | Free |

---

## 📡 API Reference

All API routes are located under `/src/app/api/`. Every route is protected with an in-memory IP rate limiter (15 requests/minute).

### AI Generation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/content/live` | GET | Generate titles, descriptions, chapters, tags |
| `GET /api/script/live` | GET | Generate a full A/V script with retention scores |
| `GET /api/script/stream` | GET | **Server-Sent Events** — stream script tokens live |
| `GET /api/hashtags/live` | GET | Generate hashtag sets with relevance scores |
| `GET /api/keywords/live` | GET | Keyword research with volume/competition estimates |
| `POST /api/vision` | POST | Multimodal AI thumbnail analysis (base64 image) |

### Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/analytics/live` | GET | Live channel stats from YouTube API |
| `GET /api/competitor/live` | GET | Competitor channel deep-dive analysis |
| `GET /api/outliers/live` | GET | Detect viral outlier videos in a niche |
| `GET /api/retention` | GET | AI-powered retention curve prediction |
| `GET /api/optimize/live` | GET | Video metadata audit and improvement score |

### History & Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/content/history` | GET | Retrieve saved content generation history |
| `GET /api/script/history` | GET | Retrieve saved script generation history |
| `POST /api/auth/register` | POST | Create a new user account |
| `GET /api/auth/[...nextauth]` | GET/POST | NextAuth.js session management |

---

## ⚡ Performance Optimizations

TubePulse is built with a strong focus on speed and resilience:

### Server-Side LRU Cache
```
User A asks for "Tesla Review" script → AI generates (8 seconds)
User B asks for "Tesla Review" script → Cache HIT (10 milliseconds) ✓
```
- **200-entry capacity** with LRU eviction
- **24-hour TTL** on all entries
- **SHA-256 hashed keys** from prompt parameters
- Saves AI API costs on repeated requests

### Zod Schema Validation + Auto-Retry
```
AI returns malformed JSON → Zod catches it → Auto-retry (up to 2 times)
User always gets valid, renderable data ✓
```

### HTTP Streaming (Script Generator)
```
Before: Wait 10 seconds → See nothing → Full script appears
After:  See first words in <200ms → Watch it write in real-time ✓
```

### Exponential Backoff Retries
```
Network blip → Wait 1s → Retry → Wait 2s → Retry → Wait 4s → Retry ✓
```

### Frontend React Query Caching
```
User generates content → Switches pages → Comes back → Still there (no re-fetch) ✓
```

---

## 🚢 Deployment

### Deploy to Vercel (Recommended — 1 click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/UDaygupta12512/tubepulse)

#### Manual Steps:
1. Fork this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and import your fork
3. Add all [Environment Variables](#-environment-variables) in the Vercel dashboard
4. Click **Deploy**

> [!IMPORTANT]
> Make sure to set `NEXTAUTH_URL` to your production Vercel URL (e.g., `https://tubepulse.vercel.app`) — not `localhost`. After adding it, trigger a redeployment for the change to take effect.

### Push Future Updates
```bash
git add .
git commit -m "your update message"
git push
# Vercel auto-deploys on every push to main ✓
```

---

## 📁 Project Structure

```
tubepulse/
├── src/
│   ├── app/
│   │   ├── api/                    # All backend API routes
│   │   │   ├── content/live/       # Content generation
│   │   │   ├── script/live/        # Script generation
│   │   │   ├── script/stream/      # ⚡ SSE streaming route
│   │   │   ├── keywords/live/      # Keyword research
│   │   │   ├── vision/             # Multimodal thumbnail AI
│   │   │   ├── analytics/live/     # YouTube channel data
│   │   │   └── auth/               # NextAuth endpoints
│   │   ├── dashboard/
│   │   │   ├── analytics/          # Channel analytics page
│   │   │   ├── content-generator/  # Content generation UI
│   │   │   ├── script-generator/   # Script + streaming UI
│   │   │   ├── keywords/           # Keyword research UI
│   │   │   ├── thumbnail-analyzer/ # Vision AI UI
│   │   │   ├── competitor-analysis/# Competitor tool
│   │   │   └── ...                 # 10 more dashboard pages
│   │   ├── login/                  # Auth pages
│   │   ├── signup/
│   │   └── page.tsx                # Landing page
│   ├── components/
│   │   ├── ErrorBoundary.tsx       # Graceful error UI
│   │   ├── LoadingSkeleton.tsx     # Skeleton loading states
│   │   ├── Toast.tsx               # Toast notifications
│   │   └── ui/                     # Reusable UI components
│   ├── lib/
│   │   ├── lruCache.ts             # ⚡ LRU cache implementation
│   │   ├── schemas.ts              # Zod validation schemas
│   │   ├── fetchWithRetry.ts       # Exponential backoff fetch
│   │   ├── rateLimit.ts            # IP-based rate limiter
│   │   ├── gemini.ts               # Groq SDK wrapper
│   │   └── youtube-live.ts         # YouTube API wrapper
│   └── store/
│       └── useDraftStore.ts        # Zustand persisted form state
├── .env.local                      # 🔐 Your secret API keys (gitignored)
├── next.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'feat: add some amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Follow the existing code style (TypeScript strict mode)
- All API routes must include rate limiting
- New AI routes should use `validateWithRetry` with a Zod schema
- Test your changes by running `npm run dev` locally

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ by **UDaygupta12512**

<br/>

⭐ **Star this repo if TubePulse helped you grow your channel!** ⭐

<br/>

<img src="https://img.shields.io/github/stars/UDaygupta12512/tubepulse?style=social" />
<img src="https://img.shields.io/github/forks/UDaygupta12512/tubepulse?style=social" />

</div>
