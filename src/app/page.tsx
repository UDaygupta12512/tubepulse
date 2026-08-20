import { Navbar } from "@/components/landing/Navbar";
import { ArrowRight, Sparkles, TrendingUp, Image as ImageIcon, Zap, ChevronRight, BarChart3, Target, Users, Crown } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen relative bg-background overflow-x-hidden">
      <Navbar />

      <main>
        {/* Hero Section with 3D Anime Characters */}
        <section className="relative pt-52 pb-24 md:pt-64 md:pb-40 overflow-hidden px-6">
          <div className="bg-grid absolute inset-0 -z-10" />

          {/* Animated Anime Characters - Left Side */}
          <div className="absolute top-32 left-10 hidden lg:block">
            <div className="relative">
              <div className="text-9xl animate-float">👨‍💻</div>
              {/* Character Speech Bubble */}
              <div className="absolute -right-24 top-8 bg-purple-500/90 text-white px-4 py-2 rounded-2xl rounded-bl-none text-sm font-bold whitespace-nowrap animate-pulse-slow backdrop-blur-sm shadow-2xl">
                Let&apos;s grow! 🚀
              </div>
            </div>
          </div>

          {/* Animated Anime Characters - Right Side */}
          <div className="absolute top-24 right-10 hidden lg:block">
            <div className="relative">
              <div className="text-9xl animate-float-delayed">👩‍🎨</div>
              {/* Character Speech Bubble */}
              <div className="absolute -left-28 top-8 bg-pink-500/90 text-white px-4 py-2 rounded-2xl rounded-br-none text-sm font-bold whitespace-nowrap animate-pulse-slow anim-delay-05 backdrop-blur-sm shadow-2xl">
                Create magic! ✨
              </div>
            </div>
          </div>

          {/* Bottom Floating Characters */}
          <div className="absolute bottom-1/4 left-[5%] hidden lg:block z-20">
            <div className="text-7xl animate-float-slow drop-shadow-2xl">🧙‍♂️</div>
          </div>
          <div className="absolute bottom-1/3 right-[5%] hidden lg:block z-20">
            <div className="text-7xl animate-float anim-delay-03 drop-shadow-2xl">🎬</div>
          </div>

          {/* Magical Sparkles */}
          <div className="absolute top-1/4 left-1/4 text-6xl animate-spin-slow opacity-30">💫</div>
          <div className="absolute top-1/3 right-1/4 text-5xl animate-spin-slow anim-delay-10 opacity-30">⭐</div>

          {/* Traditional Floating Elements */}
          <div className="absolute top-20 right-[10%] text-8xl animate-float opacity-15">🚀</div>
          <div className="absolute top-40 left-[10%] text-6xl animate-float-delayed opacity-15">⚡</div>
          <div className="absolute bottom-20 right-[15%] text-7xl animate-float-slow opacity-15">🎯</div>

          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="flex flex-col items-center text-center">
              {/* Badge with Animation */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-8 animate-pulse-slow backdrop-blur-sm">
                <Sparkles size={16} className="text-red-500 animate-spin-slow" />
                <span className="text-sm font-bold uppercase tracking-wider bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                  Next Gen YouTube Growth AI
                </span>
              </div>

              {/* Headline with Gradient Animation */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-8 max-w-6xl leading-tight">
                <span className="text-white">Unlock Your </span>
                <span className="gradient-text-animated italic relative inline-block">
                  Maximum
                  <span className="absolute -top-8 -right-8 text-4xl animate-bounce">👑</span>
                </span>
                <span className="text-white"> YouTube Potential</span>
              </h1>

              {/* Subheadline */}
              <p className="text-gray-300 text-xl md:text-2xl max-w-3xl mb-12 leading-relaxed">
                The ultimate <span className="text-white font-bold">AI-powered cockpit</span> for modern creators.
                Generate viral thumbnails, discover hidden keyword opportunities, and analyze with surgical precision.
              </p>

              {/* CTA Buttons with 3D Effect */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-20 w-full sm:w-auto">
                <Link href="/dashboard" className="btn-premium text-xl group shadow-2xl shadow-red-500/50 hover:shadow-red-500/70 hover:scale-105 transition-all duration-300">
                  <Zap size={20} className="mr-2" fill="currentColor" />
                  Start Your Journey
                  <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={20} />
                </Link>
                <Link
                  href="/#features"
                  className="px-8 py-4 rounded-xl border-2 border-white/20 hover:bg-white/10 hover:border-white/40 transition-all font-bold text-xl text-white backdrop-blur-sm group"
                >
                  Explore Features
                  <ChevronRight className="inline ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Link>
              </div>

              {/* Animated Stats Bar */}
              <div className="grid grid-cols-3 gap-8 mb-16 max-w-4xl w-full">
                <div className="text-center glass-card p-6 rounded-2xl transform hover:scale-105 transition-transform">
                  <div className="text-5xl mb-2">🎬</div>
                  <div className="text-3xl font-black text-white mb-1">50K+</div>
                  <div className="text-sm text-gray-400 font-semibold">Creators</div>
                </div>
                <div className="text-center glass-card p-6 rounded-2xl transform hover:scale-105 transition-transform">
                  <div className="text-5xl mb-2">⚡</div>
                  <div className="text-3xl font-black text-white mb-1">10M+</div>
                  <div className="text-sm text-gray-400 font-semibold">Content Generated</div>
                </div>
                <div className="text-center glass-card p-6 rounded-2xl transform hover:scale-105 transition-transform">
                  <div className="text-5xl mb-2">📈</div>
                  <div className="text-3xl font-black text-white mb-1">300%</div>
                  <div className="text-sm text-gray-400 font-semibold">Avg. Growth</div>
                </div>
              </div>

              {/* Dashboard Preview with 3D Tilt */}
              <div className="relative w-full max-w-6xl mx-auto perspective-container mt-10">
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500/30 via-orange-500/20 to-purple-500/30 blur-3xl animate-pulse-soft -z-10" />
                
                <div className="glass-panel rounded-3xl p-3 border border-white/20 shadow-2xl shadow-red-500/10 transform hover:tilt-3d transition-all duration-500 relative bg-[#0a0a0a]/80 backdrop-blur-xl">
                  <div className="bg-[#12121a] rounded-2xl aspect-[16/9] overflow-hidden relative flex flex-col border border-white/5 shadow-inner">
                    
                    {/* Top Bar (Browser/App Header) */}
                    <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>
                        <div className="mx-auto flex items-center gap-2 px-4 py-1.5 rounded-md bg-black/40 border border-white/5 text-xs text-gray-400 font-medium">
                            <BarChart3 size={14} className="text-red-400" />
                            tubepulse.com/dashboard
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6 p-6 h-full bg-gradient-to-br from-transparent to-red-500/[0.02]">
                      {/* Left Column */}
                      <div className="col-span-8 flex flex-col gap-6">
                        
                        {/* Main Chart */}
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 h-48 relative group hover:border-red-500/30 transition-all">
                          <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                          <div className="relative z-10 flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm tracking-wider text-gray-300 font-bold flex items-center gap-2">
                                    <TrendingUp size={16} className="text-red-400" /> 
                                    CHANNEL MOMENTUM
                                </h3>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-black shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                                +18.4%
                            </span>
                          </div>
                          
                          {/* Animated Bars */}
                          <div className="flex items-end gap-3 h-20 w-full px-2 relative z-10">
                            {[25, 38, 45, 32, 55, 68, 52, 85].map((h, i) => (
                              <div key={i} className="flex-1 rounded-t-md relative group/bar cursor-pointer" style={{ height: `${h}%` }}>
                                <div className="absolute inset-0 bg-gradient-to-t from-red-500/40 to-orange-400/80 rounded-t-md group-hover/bar:brightness-125 transition-all shadow-[0_-5px_15px_rgba(239,68,68,0.2)]" />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bottom Row */}
                        <div className="grid grid-cols-2 gap-6 flex-1">
                          {/* Keywords */}
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-all">
                            <h3 className="text-xs tracking-wider text-gray-400 font-bold mb-4 flex items-center gap-2">
                                <Target size={14} className="text-blue-400" />
                                TOP KEYWORDS
                            </h3>
                            <div className="space-y-3 text-sm font-medium">
                              <div className="flex justify-between items-center text-white"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>ai editing</span><span className="text-gray-400">92/100</span></div>
                              <div className="flex justify-between items-center text-white"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>youtube growth</span><span className="text-gray-400">88/100</span></div>
                              <div className="flex justify-between items-center text-white"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>viral hooks</span><span className="text-gray-400">81/100</span></div>
                            </div>
                          </div>
                          
                          {/* CTR Snapshot */}
                          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex flex-col justify-center items-center text-center hover:bg-white/[0.04] transition-all relative overflow-hidden">
                            <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/10 to-pink-500/10 blur-2xl rounded-full" />
                            <h3 className="text-xs tracking-wider text-gray-400 font-bold mb-2 relative z-10">CTR SNAPSHOT</h3>
                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 relative z-10 drop-shadow-md">9.2%</div>
                            <p className="text-xs text-green-400 font-bold mt-2 relative z-10 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">Top 5% performer</p>
                          </div>
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="col-span-4 flex flex-col gap-6">
                        
                        {/* Opportunity Score */}
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 flex-1 flex flex-col justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
                          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl" />
                          <h3 className="text-xs tracking-wider text-gray-400 font-bold mb-6 text-center relative z-10">OPPORTUNITY SCORE</h3>
                          
                          <div className="relative w-full h-4 rounded-full bg-black/50 border border-white/10 mb-4 overflow-hidden z-10 shadow-inner">
                            <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 w-[78%] shadow-[0_0_15px_rgba(249,115,22,0.6)]" />
                          </div>
                          
                          <div className="text-center relative z-10">
                              <p className="text-4xl font-black text-white drop-shadow-md">78<span className="text-xl text-gray-500">/100</span></p>
                              <p className="text-xs text-orange-400 font-bold mt-2 uppercase tracking-wide">High Potential Niche</p>
                          </div>
                        </div>

                        {/* AI Insight */}
                        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 relative overflow-hidden">
                          <div className="absolute -right-4 -bottom-4 text-6xl opacity-10">✨</div>
                          <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={16} className="text-purple-400" />
                              <h3 className="text-xs tracking-wider text-purple-300 font-bold uppercase">AI Insight</h3>
                          </div>
                          <p className="text-sm text-gray-300 leading-relaxed font-medium">
                              Test <span className="text-white font-bold bg-white/10 px-1 rounded">&quot;Question + Number&quot;</span> formats this week. Our model predicts a 12% CTR boost for your audience.
                          </p>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section with Enhanced Grid */}
        <section id="features" className="relative py-32 px-6 bg-gradient-to-b from-background to-background-secondary">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 mb-6">
                <Crown size={16} className="text-red-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-red-400">Premium Tools</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Tools for the <span className="gradient-text">Top 1%</span>
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
                We&apos;ve built a suite of cutting-edge AI tools designed to help you <span className="text-white font-bold">out-compete the algorithm</span> and grow faster than ever.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1: AI Thumbnail Forge */}
              <Link href="/dashboard/thumbnail-generator" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                <div className="relative glass-card p-8 rounded-3xl group cursor-pointer h-full transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">🎨</div>
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 absolute top-8 right-8 group-hover:animate-bounce">
                    <ImageIcon className="text-red-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">AI Thumbnail Forge</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Stop settling for low CTR. Our AI analyzes millions of high-performing videos to generate thumbnails that <span className="text-white font-semibold">demand clicks</span>.
                  </p>
                  <div className="flex items-center gap-2 text-red-500 font-bold text-lg">
                    Try Forge <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Feature 2: Keyword Intelligence */}
              <Link href="/dashboard/keywords" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                <div className="relative glass-card p-8 rounded-3xl group cursor-pointer h-full transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">🔑</div>
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 absolute top-8 right-8 group-hover:animate-bounce">
                    <Target className="text-blue-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Keyword Intelligence</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Find the &quot;Blue Ocean&quot; content opportunities. Real-time trend analysis and search volume predictions to <span className="text-white font-semibold">stay ahead</span>.
                  </p>
                  <div className="flex items-center gap-2 text-blue-500 font-bold text-lg">
                    Explore Keywords <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>

              {/* Feature 3: Outlier Detection */}
              <Link href="/dashboard/outlier" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500" />
                <div className="relative glass-card p-8 rounded-3xl group cursor-pointer h-full transform hover:-translate-y-2 transition-all duration-300">
                  <div className="text-6xl mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-transform">🔥</div>
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 absolute top-8 right-8 group-hover:animate-bounce">
                    <TrendingUp className="text-orange-500" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Outlier Detection</h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Identify videos that are defying the odds. Understand why specific topics are blowing up and <span className="text-white font-semibold">ride the wave early</span>.
                  </p>
                  <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
                    Scan Trends <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="relative py-32 px-6 bg-background-secondary">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                <BarChart3 size={16} className="text-blue-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-blue-400">Simple Process</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Get started in minutes and start seeing results immediately
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: "01", emoji: "✍️", title: "Sign Up", desc: "Create your free account in under 30 seconds" },
                { step: "02", emoji: "🔗", title: "Connect Channel", desc: "Link your YouTube channel securely via API" },
                { step: "03", emoji: "🤖", title: "AI Analysis", desc: "Our AI instantly analyzes your niche and competition" },
                { step: "04", emoji: "🚀", title: "Grow & Scale", desc: "Use insights to create viral content and grow faster" },
              ].map((item, i) => (
                <div key={i} className="relative group">
                  <div className="glass-card p-8 rounded-3xl text-center h-full transform hover:-translate-y-2 transition-all duration-300">
                    <div className="text-6xl font-black text-white/10 mb-4">{item.step}</div>
                    <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform">{item.emoji}</div>
                    <h3 className="text-2xl font-bold text-white mb-4">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 text-red-500 text-3xl z-10">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="relative py-32 px-6 bg-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 mb-6">
                <Zap size={16} className="text-green-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-green-400">Flexible Plans</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Choose Your <span className="gradient-text">Growth</span> Plan
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                Start free, upgrade when you&apos;re ready to scale
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="glass-card p-8 rounded-3xl border border-white/10">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold text-white mb-2">Starter</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['5 AI Thumbnails/mo', 'Basic Keyword Search', '3 Content Generations', 'Community Support'].map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-300">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full py-4 rounded-xl border-2 border-white/20 text-center text-white font-bold hover:bg-white/5 transition-all">
                  Get Started
                </Link>
              </div>

              {/* Pro Plan */}
              <div className="glass-card p-8 rounded-3xl border-2 border-red-500 relative transform md:-translate-y-4">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                  MOST POPULAR
                </div>
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white mb-2">Growth</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">$29</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['50 AI Thumbnails/mo', 'Advanced Keyword Trends', 'Unlimited Content Gen', 'Outlier Analysis', 'Priority Support'].map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-300">
                      <span className="text-red-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full btn-premium text-center">
                  Start Free Trial
                </Link>
              </div>

              {/* Enterprise Plan */}
              <div className="glass-card p-8 rounded-3xl border border-white/10">
                <div className="text-4xl mb-4">👑</div>
                <h3 className="text-2xl font-bold text-white mb-2">Scale</h3>
                <div className="mb-6">
                  <span className="text-5xl font-black text-white">$99</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {['Unlimited Thumbnails', 'API Access', 'Dedicated Account Mgr', 'Custom AI Models', 'Team Collaboration'].map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-gray-300">
                      <span className="text-purple-500 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="block w-full py-4 rounded-xl bg-white text-black text-center font-bold hover:bg-gray-200 transition-all">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="relative py-32 px-6 bg-background-secondary">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                <Users size={16} className="text-purple-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-purple-400">Creator Stories</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black text-white mb-6">
                Loved by <span className="gradient-text">Creators</span> Worldwide
              </h2>
              <p className="text-gray-400 text-xl max-w-3xl mx-auto">
                See how TubePulse helped thousands of creators achieve their YouTube dreams
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Tech Reviewer • 250K Subscribers",
                  avatar: "👩‍💼",
                  quote: "TubePulse's AI thumbnail generator increased my CTR from 3% to 8% in just 2 weeks. Absolutely game-changing!",
                  rating: 5
                },
                {
                  name: "Marcus Chen",
                  role: "Gaming Creator • 500K Subscribers",
                  avatar: "🎮",
                  quote: "The keyword intelligence tool helped me find untapped niches. Grew from 50K to 500K in 6 months!",
                  rating: 5
                },
                {
                  name: "Emma Rodriguez",
                  role: "Lifestyle Vlogger • 180K Subscribers",
                  avatar: "✨",
                  quote: "Best investment for my channel. The outlier detection feature is like having a crystal ball for trends.",
                  rating: 5
                },
                {
                  name: "David Kim",
                  role: "Finance Educator • 350K Subscribers",
                  avatar: "💼",
                  quote: "Finally, data-driven decisions instead of guesswork. My watch time doubled within a month!",
                  rating: 5
                },
                {
                  name: "Lisa Anderson",
                  role: "Cooking Channel • 420K Subscribers",
                  avatar: "👨‍🍳",
                  quote: "The content generator saves me hours every week. I can focus on creating while AI handles the research.",
                  rating: 5
                },
                {
                  name: "Alex Turner",
                  role: "Fitness Coach • 290K Subscribers",
                  avatar: "💪",
                  quote: "TubePulse is the secret weapon every serious creator needs. ROI was instant!",
                  rating: 5
                },
              ].map((testimonial, i) => (
                <div key={i} className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-bold text-white text-lg">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-500 text-xl">⭐</span>
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed italic">&quot;{testimonial.quote}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* CTA Section with Animated Background */}
        <section className="relative py-40 px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-orange-600/30 to-red-600/30 -z-10" />
          <div className="absolute top-20 left-20 text-9xl animate-float opacity-10">🎯</div>
          <div className="absolute bottom-20 right-20 text-9xl animate-float-delayed opacity-10">💎</div>

          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <div className="text-7xl mb-8 animate-bounce-slow">🚀</div>
            <h2 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight">
              Ready to Dominate Your Niche?
            </h2>
            <p className="text-gray-200 text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Join <span className="text-white font-bold">thousands of creators</span> using TubePulse to scale their impact and revenue through AI-driven decisions.
            </p>
            <Link href="/dashboard" className="btn-premium text-2xl group inline-flex shadow-2xl shadow-red-500/50 hover:shadow-red-500/80 hover:scale-110 transition-all duration-300">
              <Zap size={24} className="mr-2" fill="currentColor" />
              Get Started for Free
              <ArrowRight className="ml-2 group-hover:translate-x-2 transition-transform" size={24} />
            </Link>
            <p className="text-gray-400 mt-6 text-sm">No credit card required • 7-day free trial</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative py-20 px-6 border-t border-white/5 bg-background-secondary">
          <div className="container mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-red-500/50">
                  <Zap size={26} fill="currentColor" />
                </div>
                <span className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">TubePulse</span>
              </div>

              <div className="flex gap-10 text-sm font-semibold">
                <Link href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                <Link href="/dashboard/billing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link>
              </div>

              <p className="text-gray-500 text-sm">© 2026 TubePulse AI. Built for the modern creator.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
