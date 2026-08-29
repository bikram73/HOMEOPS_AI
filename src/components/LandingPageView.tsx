import React, { useState } from 'react';
import { PageTab } from '../types';
import { LOGO_URL } from '../data/mockData';
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
  ArrowRight
} from 'lucide-react';

interface LandingPageViewProps {
  onLaunchApp: (tab?: PageTab) => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onLaunchApp }) => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState<'overview' | 'tasks' | 'inventory' | 'bills'>('overview');

  const heroImageSrc =
    'https://lh3.googleusercontent.com/aida/AEtjO1VlJX0YISrdfLnSMPxpXKf8T-NsvHWIms3vpdPq4CsxYYOkVqmR5vhYg9GQAIKCvuFxkwECms8MI41ZLLxpTQe2RsTvAH9Isc4p--YeRCNxaWtGjmAqgvXAvjHUcC8_S36wZvLMIQWJH_2M7Bl9TDECr7NGtkjA4-3qc0Rc7KpjKY7T6i7H1DSXNDdSA4fzeK1b8yCYee7vsYE6EjzSdwIibrkAWyumxaJH2sSUl_8llSgxZjsCo4_Fww';

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
          <nav className="hidden md:flex items-center gap-8">
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
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <button
              id="btn-nav-login"
              onClick={() => onLaunchApp('home')}
              className="hidden md:block text-[14px] font-medium text-[#45464d] hover:text-[#006a63] transition-colors"
            >
              Log In
            </button>
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
            <h1 className="text-[36px] sm:text-[44px] md:text-[48px] font-bold text-[#000000] tracking-[-0.02em] leading-[1.15] mb-5">
              Don't manage your home.
              <br />
              Tell HomeOps what matters.
            </h1>
            <p className="text-[17px] sm:text-[18px] text-[#45464d] font-normal leading-[1.55] mb-9 max-w-2xl">
              The intelligent household operations agent that handles tasks, inventory, and bills so you don't have to.
            </p>

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
              alt="HomeOps AI Modern Living Interior"
              className="w-full h-auto object-cover max-h-[600px] transition-transform duration-700 group-hover:scale-[1.01]"
              src={heroImageSrc}
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
              © 2024 HomeOps AI. The Operating System for Modern Living.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 md:justify-end items-center">
            <a
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#000000] transition-colors"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#000000] transition-colors"
              href="#"
            >
              Terms of Service
            </a>
            <a
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#000000] transition-colors"
              href="#"
            >
              Contact
            </a>
            <a
              className="text-[12px] font-semibold text-[#45464d] hover:text-[#000000] transition-colors"
              href="#"
            >
              Careers
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
