import React, { useState } from 'react';
import { PageTab } from '../types';
import { LOGO_URL, HERO_IMAGE_URL } from '../data/mockData';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckSquare,
  Package,
  Receipt,
  QrCode,
  Play,
  X,
  ExternalLink,
  Shield,
  Sparkles,
  ArrowRight,
  Send,
  Bot,
  Zap,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Calendar,
  Smartphone,
  Layers,
  Wrench,
  HelpCircle,
  ChevronRight,
  Terminal,
  Clock,
  ShieldCheck,
  TrendingDown,
  ShoppingBag,
} from 'lucide-react';

interface LandingPageViewProps {
  onLaunchApp: (tab?: PageTab) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLaunchApp }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState<'overview' | 'tasks' | 'inventory' | 'bills'>('overview');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeChannelTab, setActiveChannelTab] = useState<'telegram' | 'web' | 'automation'>('telegram');
  const [footerModal, setFooterModal] = useState<'privacy' | 'terms' | 'contact' | 'careers' | null>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const rotatingPhrases = [
    'restock pantry essentials',
    'schedule AC servicing',
    'pay utility bills on time',
    'automate chore routines',
    'track grocery inventory',
    'orchestrate home repairs',
  ];

  const liveStatusUpdates = [
    '⚡ Auto-replenishing pantry par levels',
    '📄 BESCOM electricity bill scheduled for Auto-Pay',
    '🔧 AC filter & coil check due in 4 days',
    '🧹 Deep cleaning routine assigned for Tuesday',
    '📦 Grocery shopping list synced via Telegram',
  ];

  React.useEffect(() => {
    const phraseTimer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
    }, 2800);

    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % liveStatusUpdates.length);
    }, 3600);

    return () => {
      clearInterval(phraseTimer);
      clearInterval(statusTimer);
    };
  }, []);

  const fallbackHeroImage =
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
  const [heroImageSrc, setHeroImageSrc] = useState<string>(HERO_IMAGE_URL || fallbackHeroImage);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans antialiased flex flex-col selection:bg-[#99efe5] selection:text-[#006f67]">
      {/* Top Navigation Bar */}
      <header
        id="landing-navbar"
        className="fixed top-0 w-full z-50 bg-[#f7f9fb]/90 backdrop-blur-md border-b border-[#c6c6cd]/50 transition-all duration-200"
      >
        <div className="flex justify-between items-center h-16 px-4 md:px-10 max-w-[1440px] mx-auto">
          {/* Logo & Brand */}
          <div
            id="brand-logo-btn"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src={LOGO_URL}
              alt="HomeOps AI Logo"
              className="h-8 w-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-[20px] font-bold text-[#006a63] tracking-tight">
              HomeOps AI
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <button
              onClick={() => onLaunchApp('tasks')}
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Tasks
            </button>
            <button
              onClick={() => onLaunchApp('inventory')}
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Inventory
            </button>
            <button
              onClick={() => onLaunchApp('bills')}
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Bills
            </button>
            <a
              href="#how-it-works"
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              How it Works
            </a>
            <a
              href="#architecture"
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Architecture
            </a>
            <a
              href="#usage-channels"
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Usage & Channels
            </a>
            <a
              href="#faq"
              className="text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <button
              id="btn-nav-get-started"
              onClick={() => onLaunchApp('home')}
              className="bg-[#006a63] text-white px-4 py-2 rounded-lg text-[14px] font-medium hover:bg-[#00504a] active:scale-95 transition-all shadow-xs"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-24 pb-16">
        {/* Hero Section */}
        <section className="px-4 md:px-10 max-w-[1440px] mx-auto mt-10 md:mt-12 mb-20 md:mb-24 text-center">
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            {/* Live Operational Status Animated Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200/80 text-[#006a63] text-xs font-semibold mb-6 shadow-xs"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006a63] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006a63]"></span>
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={statusIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="tracking-tight font-medium"
                >
                  {liveStatusUpdates[statusIndex]}
                </motion.span>
              </AnimatePresence>
            </motion.div>

            {/* Dynamic Animated Headline */}
            <h1 className="text-[36px] sm:text-[44px] md:text-[50px] font-bold text-[#000000] tracking-[-0.025em] leading-[1.18] mb-5">
              <span>Don't manage your home.</span>
              <br />
              <span className="inline-flex flex-wrap items-baseline justify-center gap-x-2">
                <span>Tell HomeOps to</span>
                <span className="inline-block relative overflow-hidden align-bottom min-w-[240px] sm:min-w-[340px] text-left">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={phraseIndex}
                      initial={{ y: 35, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -35, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="inline-block text-[#006a63] font-extrabold underline decoration-[#99efe5] decoration-4 underline-offset-4"
                    >
                      {rotatingPhrases[phraseIndex]}.
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-[17px] sm:text-[18px] text-[#45464d] font-normal leading-[1.55] mb-5 max-w-2xl"
            >
              The intelligent household operations agent that orchestrates chores, restocks groceries, schedules repairs, and reconciles utility bills across Telegram, Slack, and web.
            </motion.p>

            {/* Interactive Prompt Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8 max-w-2xl">
              <span className="text-xs text-gray-500 font-medium mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#006a63]" /> Try asking:
              </span>
              {["\"We're low on olive oil\"", "\"When is electricity bill due?\"", "\"Schedule AC filter check\""].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => onLaunchApp('assistant')}
                  className="text-xs bg-white hover:bg-teal-50 text-slate-700 hover:text-[#006a63] px-3 py-1.5 rounded-full border border-gray-200/80 hover:border-teal-300 transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-14 sm:mb-16 w-full sm:w-auto justify-center">
              <button
                id="btn-hero-get-started"
                onClick={() => onLaunchApp('home')}
                className="bg-[#006a63] text-white px-8 py-4 rounded-lg text-[14px] font-semibold hover:bg-[#00504a] transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                id="btn-hero-watch-video"
                onClick={() => setIsVideoModalOpen(true)}
                className="bg-white border border-[#c6c6cd] text-[#000000] px-8 py-4 rounded-lg text-[14px] font-semibold hover:bg-[#f2f4f6] transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current text-[#000000]" />
                <span>Watch Video</span>
              </button>
            </div>
          </div>

          {/* Living Room Interior Photo Showcase with interactive drill-down */}
          <div
            onClick={() => onLaunchApp('home')}
            className="w-full rounded-xl overflow-hidden border border-[#c6c6cd]/80 shadow-sm bg-white cursor-pointer group relative transition-all duration-300 hover:border-[#006a63] hover:shadow-md"
          >
            <img
              id="hero-showcase-img"
              alt="HomeOps AI Modern Living Interior"
              className="w-full h-[320px] sm:h-[420px] md:h-[500px] lg:h-[560px] object-cover transition-transform duration-700 group-hover:scale-[1.01]"
              src={heroImageSrc}
              referrerPolicy="no-referrer"
              loading="eager"
              onError={() => {
                if (heroImageSrc !== fallbackHeroImage) {
                  setHeroImageSrc(fallbackHeroImage);
                }
              }}
            />
            {/* Subtle overlay badge in bottom right corner */}
            <div className="absolute bottom-4 right-4 bg-[#131b2e]/90 text-white backdrop-blur-md px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-md">
              <span className="w-2 h-2 rounded-full bg-[#99efe5] animate-pulse" />
              <span>Living Room • 72°F Optimal • Click to Open App</span>
            </div>
          </div>
        </section>

        {/* Features Grid: Command Center for Your Home */}
        <section className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24 bg-[#f2f4f6]/60 rounded-2xl">
          <div className="text-center mb-14 md:mb-16">
            <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#000000] tracking-[-0.02em] mb-3">
              Command Center for Your Home
            </h2>
            <p className="text-[16px] text-[#45464d] max-w-2xl mx-auto">
              A seamless blend of anticipation and execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Feature 1: Task Management */}
            <div
              id="card-feature-tasks"
              onClick={() => onLaunchApp('tasks')}
              className="bg-white p-8 rounded-xl border border-[#c6c6cd]/70 hover:border-[#006a63] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col items-start cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#F0FDFA] flex items-center justify-center mb-6 border-l-2 border-[#006a63] transition-transform group-hover:scale-105">
                <CheckSquare className="w-6 h-6 text-[#006a63]" />
              </div>
              <h3 className="text-[20px] font-semibold text-[#000000] mb-2 flex items-center gap-2">
                <span>Task Management</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#006a63] font-bold">
                  &rarr;
                </span>
              </h3>
              <p className="text-[16px] text-[#45464d] leading-[1.55]">
                Your household chores, prioritized by AI. Delegate the mental load and let the system orchestrate your daily rhythms.
              </p>
            </div>

            {/* Feature 2: Inventory Tracking */}
            <div
              id="card-feature-inventory"
              onClick={() => onLaunchApp('inventory')}
              className="bg-white p-8 rounded-xl border border-[#c6c6cd]/70 hover:border-[#006a63] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col items-start cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#f7f9fb] flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                <Package className="w-6 h-6 text-[#45464d] group-hover:text-[#006a63] transition-colors" />
              </div>
              <h3 className="text-[20px] font-semibold text-[#000000] mb-2 flex items-center gap-2">
                <span>Inventory Tracking</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#006a63] font-bold">
                  &rarr;
                </span>
              </h3>
              <p className="text-[16px] text-[#45464d] leading-[1.55]">
                Never run out of staples again. Automated tracking anticipates needs before they become urgencies.
              </p>
            </div>

            {/* Feature 3: Bill Monitoring */}
            <div
              id="card-feature-bills"
              onClick={() => onLaunchApp('bills')}
              className="bg-white p-8 rounded-xl border border-[#c6c6cd]/70 hover:border-[#006a63] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col items-start cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#f7f9fb] flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
                <Receipt className="w-6 h-6 text-[#45464d] group-hover:text-[#006a63] transition-colors" />
              </div>
              <h3 className="text-[20px] font-semibold text-[#000000] mb-2 flex items-center gap-2">
                <span>Bill Monitoring</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#006a63] font-bold">
                  &rarr;
                </span>
              </h3>
              <p className="text-[16px] text-[#45464d] leading-[1.55]">
                Avoid late fees with smart reminders. A unified ledger for all ongoing household expenses and subscriptions.
              </p>
            </div>

            {/* Feature 4: AI Assistant */}
            <div
              id="card-feature-assistant"
              onClick={() => onLaunchApp('assistant')}
              className="bg-white p-8 rounded-xl border border-[#c6c6cd]/70 hover:border-[#006a63] transition-all duration-300 shadow-xs hover:shadow-md flex flex-col items-start cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-lg bg-[#F0FDFA] flex items-center justify-center mb-6 border-l-2 border-[#006a63] transition-transform group-hover:scale-105">
                <QrCode className="w-6 h-6 text-[#006a63]" />
              </div>
              <h3 className="text-[20px] font-semibold text-[#000000] mb-2 flex items-center gap-2">
                <span>AI Assistant</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[#006a63] font-bold">
                  &rarr;
                </span>
              </h3>
              <p className="text-[16px] text-[#45464d] leading-[1.55]">
                Your personal agent for every household need. Ask natural questions, receive actionable insights instantly.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section: A Frictionless Setup */}
        <section id="how-it-works" className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24">
          <div className="text-center mb-16">
            <h2 className="text-[28px] sm:text-[32px] font-semibold text-[#000000] tracking-[-0.02em] mb-3">
              A Frictionless Setup
            </h2>
            <p className="text-[16px] text-[#45464d] max-w-2xl mx-auto">
              Three steps to operationalizing your household.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-full bg-[#e6e8ea] flex items-center justify-center mb-6 text-[20px] font-semibold text-[#000000] border border-[#c6c6cd]/80 transition-transform group-hover:scale-105">
                1
              </div>
              <h3 className="text-[24px] font-semibold text-[#000000] mb-3">
                Connect
              </h3>
              <p className="text-[14px] text-[#45464d] leading-[1.55] max-w-xs">
                Link your existing services, accounts, and preferences in minutes with our secure integrations.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="hidden md:block absolute top-8 left-[-50%] w-full h-[1px] bg-[#c6c6cd] -z-10" />
              <div className="w-16 h-16 rounded-full bg-[#006a63] flex items-center justify-center mb-6 text-[20px] font-semibold text-white shadow-sm transition-transform group-hover:scale-105">
                2
              </div>
              <h3 className="text-[24px] font-semibold text-[#000000] mb-3">
                Configure
              </h3>
              <p className="text-[14px] text-[#45464d] leading-[1.55] max-w-xs">
                Tell the AI your household rhythms. Establish routines, thresholds, and notification preferences.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center relative group">
              <div className="hidden md:block absolute top-8 left-[-50%] w-full h-[1px] bg-[#c6c6cd] -z-10" />
              <div className="w-16 h-16 rounded-full bg-[#e6e8ea] flex items-center justify-center mb-6 text-[20px] font-semibold text-[#000000] border border-[#c6c6cd]/80 transition-transform group-hover:scale-105">
                3
              </div>
              <h3 className="text-[24px] font-semibold text-[#000000] mb-3">
                Relax
              </h3>
              <p className="text-[14px] text-[#45464d] leading-[1.55] max-w-xs">
                Step back as HomeOps AI silently orchestrates your environment, requiring attention only when necessary.
              </p>
            </div>
          </div>

          {/* Quick Launch CTA Banner at the bottom of How it Works */}
          <div className="mt-16 text-center">
            <button
              onClick={() => onLaunchApp('home')}
              className="bg-[#006a63] text-white px-8 py-3.5 rounded-lg text-[14px] font-semibold hover:bg-[#00504a] transition-all shadow-sm active:scale-95 inline-flex items-center gap-2"
            >
              <span>Get Started with HomeOps AI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Section: Project Overview & Core Mission */}
        <section id="project-overview" className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24 border-t border-[#c6c6cd]/50">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#006a63] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                  Project Mission
                </span>
                <h2 className="text-[28px] sm:text-[34px] font-bold text-[#000000] tracking-tight mt-3">
                  Why HomeOps AI Exists
                </h2>
              </div>
              <p className="text-[15px] sm:text-[16px] text-[#45464d] max-w-lg leading-relaxed">
                Modern households operate like small businesses with logistics, maintenance schedules, budgets, and daily chores—yet rely on scattered memory, paper notes, and disjointed group chats.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-7 rounded-xl border border-[#c6c6cd]/70 shadow-xs hover:border-[#006a63] transition-all">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#006a63] mb-4">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Zero Mental Overhead</h3>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  Offload chores, appliance checks, and grocery restocking to an autonomous system that plans ahead before stockouts or missed deadlines happen.
                </p>
              </div>

              <div className="bg-white p-7 rounded-xl border border-[#c6c6cd]/70 shadow-xs hover:border-[#006a63] transition-all">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#006a63] mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Single Source of Truth</h3>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  Consolidate chores, pantry items, scheduled appliance services, and utility bills into one synchronized engine accessible to every household member.
                </p>
              </div>

              <div className="bg-white p-7 rounded-xl border border-[#c6c6cd]/70 shadow-xs hover:border-[#006a63] transition-all">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-[#006a63] mb-4">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Omnichannel Flow</h3>
                <p className="text-sm text-[#45464d] leading-relaxed">
                  Interact naturally where you already communicate: via Telegram bot, desktop dashboard, or voice-ready conversational assistant with idempotent webhooks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Architecture & How the Engine Works */}
        <section id="architecture" className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24 bg-[#f2f4f6]/60 rounded-2xl my-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006a63] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Technical Architecture
              </span>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-[#000000] tracking-tight mt-3 mb-3">
                How HomeOps AI Works Under the Hood
              </h2>
              <p className="text-[16px] text-[#45464d] max-w-2xl mx-auto">
                Built on a multi-layer pipeline: natural language understanding, deterministic state management, and real-time cross-channel synchronization.
              </p>
            </div>

            {/* Architecture Pipeline Flow Diagram */}
            <div className="bg-white p-8 rounded-2xl border border-[#c6c6cd]/70 shadow-sm mb-12">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
                {/* Step 1 */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        Layer 1
                      </span>
                      <Smartphone className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">Inbound Omnichannel</h4>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      Accepts messages via Caspian webhook, Telegram Bot API, or web assistant chat.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                    POST /api/caspian/webhook
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        Layer 2
                      </span>
                      <Bot className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">NLU &amp; Intent Routing</h4>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      Gemini function calling parses tasks, bills, inventory quantities, and maintenance urgency.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                    Deterministic Fallback + Gemini 3.8
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        Layer 3
                      </span>
                      <RefreshCw className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">State &amp; Automations</h4>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      Central state manager updates records, computes thresholds, and auto-queues restocks.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                    Auto-Replenish &amp; Priority Engine
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
                        Layer 4
                      </span>
                      <Send className="w-4 h-4 text-slate-400" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">Outbound &amp; Audit</h4>
                    <p className="text-xs text-[#45464d] leading-relaxed">
                      Real-time confirmation dispatched back to channel + activity logged in calendar audit stream.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                    Audit Log &amp; Caspian Dispatch
                  </div>
                </div>
              </div>
            </div>

            {/* Core Subsystem Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#c6c6cd]/70 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#006a63] flex items-center justify-center shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Priority Ranking Engine</h4>
                  <p className="text-sm text-[#45464d] leading-relaxed">
                    When you ask <em>"What should I do right now?"</em>, the engine calculates a multi-factor score: Overdue utility bills (Weight: 100), Critical inventory (Weight: 80), Pending appliance maintenance (Weight: 60), and High-priority chores (Weight: 40).
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-[#c6c6cd]/70 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#006a63] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Anti-Hallucination Guardrails</h4>
                  <p className="text-sm text-[#45464d] leading-relaxed">
                    The agent strictly answers based on factual state. If an item or bill doesn't exist, it transparently tells you rather than inventing fake quantities or completed actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Usage & Omnichannel Experience */}
        <section id="usage-channels" className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006a63] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Usage &amp; Interaction
              </span>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-[#000000] tracking-tight mt-3 mb-3">
                How to Use HomeOps AI in Daily Life
              </h2>
              <p className="text-[16px] text-[#45464d] max-w-2xl mx-auto">
                Switch seamlessly between conversation on your phone and rich visual controls on your desktop.
              </p>
            </div>

            {/* Interactive Channel Tabs */}
            <div className="bg-white rounded-2xl border border-[#c6c6cd]/70 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-200 bg-gray-50/80 p-2 gap-2">
                <button
                  onClick={() => setActiveChannelTab('telegram')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeChannelTab === 'telegram'
                      ? 'bg-white text-[#006a63] shadow-xs border border-gray-200/80'
                      : 'text-[#45464d] hover:text-black hover:bg-gray-100/60'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Telegram Messaging</span>
                </button>
                <button
                  onClick={() => setActiveChannelTab('web')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeChannelTab === 'web'
                      ? 'bg-white text-[#006a63] shadow-xs border border-gray-200/80'
                      : 'text-[#45464d] hover:text-black hover:bg-gray-100/60'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Web App &amp; AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveChannelTab('automation')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeChannelTab === 'automation'
                      ? 'bg-white text-[#006a63] shadow-xs border border-gray-200/80'
                      : 'text-[#45464d] hover:text-black hover:bg-gray-100/60'
                  }`}
                >
                  <Zap className="w-4 h-4" />
                  <span>Proactive Automations</span>
                </button>
              </div>

              <div className="p-6 md:p-8">
                {activeChannelTab === 'telegram' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 mb-3 inline-block">
                        Mobile On-The-Go
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Talk to Your Household via Telegram
                      </h3>
                      <p className="text-sm text-[#45464d] leading-relaxed mb-4">
                        Send quick voice or text notes while running errands. No need to download a separate heavy app—HomeOps AI lives directly in your Telegram inbox via Caspian.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><em>"Add 6 bananas and milk to shopping list"</em></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><em>"Mark electricity bill as paid"</em></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><em>"What's urgent right now?"</em></span>
                        </li>
                      </ul>
                      <div className="mt-6">
                        <button
                          onClick={() => onLaunchApp('assistant')}
                          className="bg-[#006a63] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#00504a] transition-all inline-flex items-center gap-2"
                        >
                          <span>Test Telegram Simulator in App</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white p-5 rounded-xl font-mono text-xs shadow-md">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-slate-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Telegram Inbound Webhook</span>
                      </div>
                      <div className="space-y-3">
                        <div className="bg-slate-800/70 p-2.5 rounded text-emerald-400">
                          &gt; You: "Create a task to vacuum the hallway"
                        </div>
                        <div className="bg-slate-800/40 p-2.5 rounded text-slate-300">
                          &lt; HomeOps AI: "Created task: 'Vacuum the hallway' (Priority: medium, Due: Today). Assigned to household chore board."
                        </div>
                        <div className="text-[11px] text-teal-300">
                          ✓ Tool executed: createTask(title="vacuum the hallway")
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeChannelTab === 'web' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 mb-3 inline-block">
                        Command Center
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Interactive Web Dashboard &amp; Assistant
                      </h3>
                      <p className="text-sm text-[#45464d] leading-relaxed mb-4">
                        A responsive desktop and tablet command console. Inspect real-time pantry inventory meters, filter maintenance logs, track bills, and converse with the Gemini AI assistant.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span>Direct state manipulation with one-click toggles</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span>Visual telemetry meters for water filters, HVAC, and salts</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span>Multi-member chore assignees and due status tags</span>
                        </li>
                      </ul>
                      <div className="mt-6">
                        <button
                          onClick={() => onLaunchApp('home')}
                          className="bg-[#006a63] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#00504a] transition-all inline-flex items-center gap-2"
                        >
                          <span>Launch Web Dashboard</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                      <div className="text-xs font-bold text-slate-700 mb-3 flex items-center justify-between">
                        <span>Real-Time Web State Sync</span>
                        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">Connected</span>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        <div className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Laundry Detergent</span>
                          <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">Critical (18%)</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">BESCOM Electricity</span>
                          <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">$145.20 • Due Tomorrow</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200 flex items-center justify-between">
                          <span className="font-semibold text-slate-800">HVAC Filter Clean</span>
                          <span className="text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded">Due in 4 Days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeChannelTab === 'automation' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <span className="text-xs font-bold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200 mb-3 inline-block">
                        Autonomous Logic
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mb-3">
                        Proactive Triggers &amp; Self-Healing Ops
                      </h3>
                      <p className="text-sm text-[#45464d] leading-relaxed mb-4">
                        HomeOps AI doesn't just react to commands—it proactively monitors inventory thresholds, upcoming bill payment windows, and recurring appliance service milestones.
                      </p>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><strong>Automatic Restock:</strong> Items dropping below par automatically land on your shopping list.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><strong>Deduplication Guard:</strong> Prevents multiple redundant shopping entries for the same item.</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#006a63]" />
                          <span><strong>Activity Audit Trail:</strong> Complete timestamped log of every mutation and automation.</span>
                        </li>
                      </ul>
                      <div className="mt-6">
                        <button
                          onClick={() => onLaunchApp('activity')}
                          className="bg-[#006a63] text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-[#00504a] transition-all inline-flex items-center gap-2"
                        >
                          <span>View Activity Audit Calendar</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-900 text-white p-5 rounded-xl font-mono text-xs shadow-md">
                      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-slate-400">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Automation Lifecycle Execution</span>
                      </div>
                      <div className="space-y-2 text-slate-300">
                        <div className="text-emerald-400">&gt; Event: updateInventory("Rice", 0.5 kg)</div>
                        <div className="text-amber-300">&gt; Trigger: Quantity &lt; Par Threshold (2.0 kg)</div>
                        <div className="text-teal-300">&gt; Action: autoRestockAdded("Jasmine Rice", "1 bag")</div>
                        <div className="text-slate-400">&gt; Audit: Logged to Activity Calendar [ACT-1725981234565]</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Frequently Asked Questions (FAQ) */}
        <section id="faq" className="px-4 md:px-10 max-w-[1440px] mx-auto py-20 md:py-24 bg-[#f2f4f6]/60 rounded-2xl my-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006a63] bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                Got Questions?
              </span>
              <h2 className="text-[28px] sm:text-[34px] font-bold text-[#000000] tracking-tight mt-3 mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-[16px] text-[#45464d]">
                Everything you need to know about HomeOps AI, privacy, and day-to-day operations.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: 'What is HomeOps AI and how is it different from a basic todo app?',
                  a: 'HomeOps AI is a full-stack household operations operating system. Unlike a static checklist, it features an intelligent agent powered by Gemini 3.8, proactive automatic replenishment, deterministic priority calculation, cross-channel messaging via Telegram and Caspian, appliance maintenance telemetry, and unified expense monitoring.'
                },
                {
                  q: 'How does Telegram integration work?',
                  a: 'You connect the HomeOps bot on Telegram. Inbound messages route through Caspian webhook ingestion to our backend intent router. The AI executes tools like createTask, addShoppingItem, or markBillPaid and dispatches instant confirmations back to your chat.'
                },
                {
                  q: 'What happens if the AI model rate limit or network is unavailable?',
                  a: 'HomeOps AI is built with graceful fallbacks. If an external AI API exceeds quota or errors out, our deterministic fallback NLP agent parses and executes all 7 core household tools (task creation, stock adjustments, shopping additions, bill payment, maintenance schedules, and priority ranking) with 100% reliability.'
                },
                {
                  q: 'How does automatic grocery replenishment work?',
                  a: 'Each pantry item has a configurable minimum threshold (par level). Whenever stock drops below this threshold (either manually in the app or via a voice/text update), HomeOps AI automatically queues it to your unified shopping list with deduplication guards.'
                },
                {
                  q: 'Is my household data private and secure?',
                  a: 'Yes. All authentication keys, bot tokens, and agent credentials remain strictly on the backend server. No API secrets are exposed to browser bundles, and audit trails record every mutation transparently in your activity calendar.'
                }
              ].map((faq, fIdx) => (
                <div
                  key={fIdx}
                  className="bg-white rounded-xl border border-[#c6c6cd]/70 overflow-hidden shadow-xs"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === fIdx ? null : fIdx)}
                    className="w-full text-left p-5 flex items-center justify-between font-semibold text-slate-900 hover:text-[#006a63] transition-colors"
                  >
                    <span className="text-[15px] sm:text-[16px] pr-4">{faq.q}</span>
                    <ChevronRight
                      className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${
                        expandedFaq === fIdx ? 'rotate-90 text-[#006a63]' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === fIdx && (
                    <div className="px-5 pb-5 pt-1 text-sm text-[#45464d] leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section: Interactive Household Setup CTA */}
        <section className="px-4 md:px-10 max-w-[1440px] mx-auto py-16 text-center">
          <div className="max-w-3xl mx-auto bg-[#006a63] text-white rounded-3xl p-8 md:p-12 shadow-md">
            <h2 className="text-[26px] sm:text-[34px] font-bold mb-3 tracking-tight">
              Ready to Operationalize Your Household?
            </h2>
            <p className="text-[15px] sm:text-[17px] text-teal-100 max-w-xl mx-auto mb-8 leading-relaxed">
              Launch the live dashboard right now. Experience real-time task rhythm, predictive pantry replenishment, and autonomous AI orchestration in action.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onLaunchApp('home')}
                className="bg-white text-[#006a63] px-8 py-3.5 rounded-lg text-[14px] font-bold hover:bg-teal-50 transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <span>Launch HomeOps AI</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onLaunchApp('assistant')}
                className="bg-teal-700/60 border border-teal-400/40 text-white px-8 py-3.5 rounded-lg text-[14px] font-bold hover:bg-teal-700 transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" />
                <span>Try AI Assistant</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Video Demonstration Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-gray-200"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-gray-700 ml-2">
                    HomeOps AI Product Tour
                  </span>
                </div>
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Preview Canvas with interactive tabs */}
              <div className="p-6 space-y-4">
                <div className="flex gap-2 border-b border-gray-200 pb-3">
                  <button
                    onClick={() => setActiveVideoTab('overview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeVideoTab === 'overview'
                        ? 'bg-[#006a63] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    1. Overview
                  </button>
                  <button
                    onClick={() => setActiveVideoTab('tasks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeVideoTab === 'tasks'
                        ? 'bg-[#006a63] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    2. Task Prioritization
                  </button>
                  <button
                    onClick={() => setActiveVideoTab('inventory')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeVideoTab === 'inventory'
                        ? 'bg-[#006a63] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    3. Smart Inventory
                  </button>
                  <button
                    onClick={() => setActiveVideoTab('bills')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeVideoTab === 'bills'
                        ? 'bg-[#006a63] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    4. Bill Ledger
                  </button>
                </div>

                <div className="relative rounded-xl overflow-hidden bg-[#131b2e] p-6 text-white min-h-[280px] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#99efe5] font-bold mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Interactive Feature Walkthrough</span>
                    </div>
                    {activeVideoTab === 'overview' && (
                      <div>
                        <h4 className="text-xl font-bold mb-2">
                          Autonomous Household Orchestration
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          HomeOps AI unifies chore delegation, inventory tracking, utility bill auditing, and appliance maintenance schedules into a single ambient workspace.
                        </p>
                      </div>
                    )}
                    {activeVideoTab === 'tasks' && (
                      <div>
                        <h4 className="text-xl font-bold mb-2">
                          AI-Prioritized Daily Task Rhythm
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Chore routines are automatically scheduled around occupancy, priority urgency, and appliance telemetry data so nothing slips through the cracks.
                        </p>
                      </div>
                    )}
                    {activeVideoTab === 'inventory' && (
                      <div>
                        <h4 className="text-xl font-bold mb-2">
                          Predictive Consumables &amp; Auto-Restock
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Depletion curves automatically predict when detergents, pantry staples, and toiletries require restock, populating smart shopping lists before stockouts happen.
                        </p>
                      </div>
                    )}
                    {activeVideoTab === 'bills' && (
                      <div>
                        <h4 className="text-xl font-bold mb-2">
                          Unified Utility Invoicing &amp; Due Date Alerts
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Track electricity, water, internet, and recurring subscription dues with instant status indicators and zero late fees.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                    <span className="text-xs text-slate-400">
                      Want to experience it live?
                    </span>
                    <button
                      onClick={() => {
                        setIsVideoModalOpen(false);
                        onLaunchApp(activeVideoTab === 'overview' ? 'home' : (activeVideoTab as PageTab));
                      }}
                      className="bg-[#006a63] hover:bg-[#00504a] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                    >
                      Open in App &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Shared Component */}
      <footer
        id="landing-footer"
        className="bg-white w-full py-12 px-4 md:px-10 border-t border-[#c6c6cd]/60 transition-all duration-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1440px] mx-auto">
          <div className="flex flex-col gap-4">
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                alt="HomeOps AI Logo"
                className="h-6 w-6 object-contain grayscale opacity-70"
                src={LOGO_URL}
              />
              <span className="text-[14px] font-bold text-[#000000]">
                HomeOps AI
              </span>
            </div>
            <p className="text-[14px] text-[#45464d]">
              © 2026 HomeOps AI. The Operating System for Modern Living.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 md:justify-end items-center">
            <button
              onClick={() => setFooterModal('privacy')}
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#006a63] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setFooterModal('terms')}
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#006a63] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Terms of Service
            </button>
            <button
              onClick={() => {
                setContactSubmitted(false);
                setFooterModal('contact');
              }}
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#006a63] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Contact
            </button>
            <button
              onClick={() => setFooterModal('careers')}
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#006a63] transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              Careers
            </button>
          </div>
        </div>
      </footer>

      {/* Footer Interactive Information Modals */}
      <AnimatePresence>
        {footerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl p-6 sm:p-8 relative"
            >
              <button
                onClick={() => setFooterModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-black transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              {footerModal === 'privacy' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#006a63]">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Privacy Policy</h3>
                      <p className="text-xs text-gray-500">Effective Date: September 2026</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-[#45464d] leading-relaxed">
                    <p>
                      At <strong>HomeOps AI</strong>, protecting your household data and privacy is built into our foundational architecture. We strictly adhere to zero-compromise data isolation policies.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="font-semibold text-slate-800">Key Commitments:</div>
                      <div>• <strong>No Data Selling:</strong> We do not sell, rent, or monetize your pantry habits, grocery receipts, or utility payment records.</div>
                      <div>• <strong>Server-Side Secret Isolation:</strong> All Gemini API keys, Telegram Bot tokens, and credentials are kept strictly in secured backend memory.</div>
                      <div>• <strong>Local First &amp; Transparent Logs:</strong> Every task mutation and automated restock is permanently recorded in your transparent Activity Calendar.</div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Have questions regarding your data rights or wish to request complete deletion? Contact us anytime at privacy@homeops.ai.
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setFooterModal(null)}
                        className="bg-[#006a63] hover:bg-[#00504a] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        Understood
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {footerModal === 'terms' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#006a63]">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Terms of Service</h3>
                      <p className="text-xs text-gray-500">Last updated: September 2026</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-[#45464d] leading-relaxed">
                    <p>
                      By accessing or using the <strong>HomeOps AI</strong> platform, Telegram bot agent, and automated household services, you agree to the following terms:
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                      <div>
                        <strong className="text-slate-800">1. Responsible Household Automation:</strong>
                        <p className="text-slate-600 mt-0.5">Automations such as automatic restock additions are designed as aids. You retain ultimate approval for financial transactions and service contracts.</p>
                      </div>
                      <div>
                        <strong className="text-slate-800">2. Security &amp; Channel Access:</strong>
                        <p className="text-slate-600 mt-0.5">Only authorize members of your household to connect to your shared HomeOps bot channel to maintain operational integrity.</p>
                      </div>
                      <div>
                        <strong className="text-slate-800">3. Service Availability:</strong>
                        <p className="text-slate-600 mt-0.5">HomeOps includes deterministic local fallbacks to ensure uninterrupted chore and inventory management even during upstream network disruptions.</p>
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setFooterModal(null)}
                        className="bg-[#006a63] hover:bg-[#00504a] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        I Agree
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {footerModal === 'contact' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#006a63]">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Get in Touch</h3>
                      <p className="text-xs text-gray-500">We'd love to hear from you or your household team</p>
                    </div>
                  </div>

                  {contactSubmitted ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900">Message Received!</h4>
                      <p className="text-sm text-[#45464d] max-w-sm mx-auto">
                        Thank you for reaching out. The HomeOps engineering team will get back to your household at <strong>{contactForm.email || 'your email'}</strong> within 24 hours.
                      </p>
                      <button
                        onClick={() => setFooterModal(null)}
                        className="mt-4 bg-[#006a63] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#00504a] transition-all"
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (contactForm.email.trim()) {
                          setContactSubmitted(true);
                        }
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Your Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="e.g. Alex Henderson"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006a63]/40 focus:border-[#006a63]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="alex@example.com"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006a63]/40 focus:border-[#006a63]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Message or Feedback</label>
                        <textarea
                          rows={3}
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Tell us what you need, questions about Caspian integrations, or feature ideas..."
                          className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#006a63]/40 focus:border-[#006a63]"
                        />
                      </div>
                      <div className="pt-2 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setFooterModal(null)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-[#006a63] hover:bg-[#00504a] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Message</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {footerModal === 'careers' && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-[#006a63]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Careers at HomeOps AI</h3>
                      <p className="text-xs text-gray-500">Help us revolutionize the future of domestic intelligence</p>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm text-[#45464d] leading-relaxed">
                    <p>
                      We are pioneering deterministic AI agents and real-time operational operating systems for households around the globe.
                    </p>
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl border border-gray-200 hover:border-[#006a63] transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">Full-Stack AI Systems Engineer</div>
                          <div className="text-xs text-gray-500">TypeScript • Node.js • Gemini API • Remote</div>
                        </div>
                        <span className="text-xs font-semibold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded">Open</span>
                      </div>
                      <div className="p-3.5 rounded-xl border border-gray-200 hover:border-[#006a63] transition-colors flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">Product Designer (Design Systems)</div>
                          <div className="text-xs text-gray-500">Figma • Tailwind • Mobile UX • Remote</div>
                        </div>
                        <span className="text-xs font-semibold text-[#006a63] bg-teal-50 px-2.5 py-1 rounded">Open</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      Interested in joining our mission? Send your GitHub/portfolio to careers@homeops.ai.
                    </p>
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => setFooterModal(null)}
                        className="bg-[#006a63] hover:bg-[#00504a] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
