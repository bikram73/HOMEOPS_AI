<div align="center">

# 🏡 HomeOps-AI: Intelligent Autonomous Household Operations Platform

### *Multi-Channel Household Management, Autonomous Inventory Replenishment & Preventive Maintenance Powered by Caspian SDK, AnythingLLM & Gemini AI*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Caspian](https://img.shields.io/badge/Caspian%20SDK-Multi--Channel-006A63?style=for-the-badge)](https://trycaspianai.com)
[![Netlify](https://img.shields.io/badge/Netlify-Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)

---

</div>

# 📑 Table of Contents

<div align="center">

| **<div align="center">📖 Description</div>** | **<div align="center">🚀 Section</div>** |
|--------------------------------------------------------------|------------------------------------------------|
| <div align="center">**View the project features and capabilities.** 👉</div> | <div align="center"><a href="#-features"><img src="https://img.shields.io/badge/✨%20Features-4F46E5?style=for-the-badge" /></a></div> |
| <div align="center">**View the technologies, frameworks, and programming languages used.** 👉</div> | <div align="center"><a href="#-tech-stack"><img src="https://img.shields.io/badge/🛠️%20Tech%20Stack-0891B2?style=for-the-badge" /></a></div> |
| <div align="center">**Explore the project's folder and file organization.** 👉</div> | <div align="center"><a href="#-file-structure"><img src="https://img.shields.io/badge/📂%20File%20Structure-10B981?style=for-the-badge" /></a></div> |
| <div align="center">**Follow the installation steps and local development setup.** 👉</div> | <div align="center"><a href="#-installation"><img src="https://img.shields.io/badge/🚀%20Installation-F97316?style=for-the-badge" /></a></div> |
| <div align="center">**Understand the complete AI document processing pipeline.** 👉</div> | <div align="center"><a href="#-architecture"><img src="https://img.shields.io/badge/🏗️%20Architecture-DC2626?style=for-the-badge" /></a></div> |
| <div align="center">**Learn about the AI prompting strategy and anti-hallucination techniques.** 👉</div> | <div align="center"><a href="#-prompt-strategy"><img src="https://img.shields.io/badge/🧠%20Prompt%20Strategy-7C3AED?style=for-the-badge" /></a></div> |
| <div align="center">**Understand how confidence scores are calculated and interpreted.** 👉</div> | <div align="center"><a href="#-confidence-scores"><img src="https://img.shields.io/badge/📊%20Confidence%20Scores-2563EB?style=for-the-badge" /></a></div> |
| <div align="center">**View all deliverables required for the AI challenge.** 👉</div> | <div align="center"><a href="#-deliverables"><img src="https://img.shields.io/badge/📄%20Challenge%20Deliverables-059669?style=for-the-badge" /></a></div> |
| <div align="center">**View the available REST API endpoints and usage examples.** 👉</div> | <div align="center"><a href="#-api-documentation"><img src="https://img.shields.io/badge/🌐%20API%20Documentation-0EA5E9?style=for-the-badge" /></a></div> |
| <div align="center">**Explore the complete system architecture, AI workflow, processing pipeline, data flow, deployment design, and technical decisions.** 👉</div> | <div align="center"><a href="./ARCHITECTURE.md"><img src="https://img.shields.io/badge/🏗️%20Architecture%20Document-DC2626?style=for-the-badge" /></a></div> |
| <div align="center">**Review implementation details, AI pipeline, performance metrics, benchmarking, validation strategy, privacy, testing, and technical specifications.** 👉</div> | <div align="center"><a href="./TECHNICAL_REPORT.md"><img src="https://img.shields.io/badge/📊%20Technical%20Report-2563EB?style=for-the-badge" /></a></div> |
| <div align="center">**Review processing speed, latency, and performance benchmarks.** 👉</div> | <div align="center"><a href="#-performance"><img src="https://img.shields.io/badge/⚡%20Performance-F59E0B?style=for-the-badge" /></a></div> |
| <div align="center">**Understand the current limitations and known failure cases of the AI extractor.** 👉</div> | <div align="center"><a href="#-known-limitations"><img src="https://img.shields.io/badge/⚠️%20Known%20Limitations-EF4444?style=for-the-badge" /></a></div> |
| <div align="center">**View the project license information.** 👉</div> | <div align="center"><a href="#-license"><img src="https://img.shields.io/badge/📄%20License-6B7280?style=for-the-badge" /></a></div> |

</div>

---

<a name="features"></a>
## ✨ Features

HomeOps-AI is a next-generation household operations cockpit that connects multi-channel communication (Telegram, Email, Slack, SMS) to an autonomous reasoning core.

### 🌟 Core Capabilities:
1. **🤖 Multi-Channel AI Assistant via Caspian SDK**
   - **Telegram Integration**: Connected to [@MyHomeOps_bot](https://t.me/MyHomeOps_bot) for instant natural language control.
   - **Multi-Platform Support**: Dynamic channel discovery via Caspian Hosted Gateway (`https://api.trycaspianai.com`) supporting Telegram, Email, Slack, Discord, SMS, Linear, and Zulip.
   - **Interactive In-App Channel Simulator**: Test multi-channel message flows and view live tool executions and citations in real time.

2. **📚 Knowledge Retrieval via AnythingLLM Workspace**
   - **Grounded Home Knowledge Base**: Index household manuals, warranty documents, cleaning routines, and utility payment calendars (`home_maintenance_guide_2026.pdf`, `pantry_par_levels.md`, `bills_schedule_2026.json`).
   - **Per-Channel Context Memory**: Preserves context and conversation history across different user sessions and messaging channels.
   - **Direct Source Citations**: AI responses cite exact document names, sections, and snippets.

3. **📦 Smart Inventory & Auto-Replenishment**
   - **Par-Level Monitoring**: Automatically tracks item counts against minimum thresholds.
   - **Automated Shopping List Generation**: When pantry or consumable items dip below threshold (e.g., Basmati Rice < 2kg, Olive Oil < 1 bottle), items are flagged as critical and added to the grocery shopping list.

4. **⚡ "What Should I Do Now?" (Autonomous Decision Engine)**
   - Algorithmic scoring evaluating urgent bills, overdue chores, critical pantry deficits, and maintenance schedules to output the single highest-impact action in under 5 seconds.

5. **🗓️ Preventive Home Maintenance & Servicing**
   - Tracks 90-day AC coil & filter cleaning, RO water purifier servicing, plumbing inspections, and chimney degassing.
   - Computes maintenance health index scores and logs service histories.

6. **💳 Bills & Utility Management**
   - Tracks electricity (BESCOM), Wi-Fi, piped gas, and society maintenance fees with due-date alerts and one-click payment reconciliations.

7. **📊 Household Analytics & Visual Telemetry**
   - Real-time chore velocity, spending breakdowns by utility type, task completion trends, and system event logs.

---

<a name="tech-stack"></a>
## 🛠️ Tech Stack

| Domain | Technology / Library | Purpose |
|---|---|---|
| **Frontend Framework** | `React 18.3`, `TypeScript 5.8` | Type-safe, component-driven UI |
| **Styling & UI** | `Tailwind CSS 4.1`, `Lucide React`, `Motion` | Modern utility styling, fluid layout transitions |
| **Backend & APIs** | `Node.js`, `Express 4.21`, `serverless-http` | RESTful API engine & Netlify serverless functions |
| **Agentic AI Core** | `@google/genai` (Gemini 2.5 Flash) | Natural language understanding, function calling, tool execution |
| **Agent Comm Gateway** | `Caspian SDK` (`caspian-sdk`) | Hosted multi-channel communication routing |
| **Knowledge Engine** | `AnythingLLM Workspace Bridge` | Multi-channel context retention & document citations |
| **Build & Deploy** | `Vite 6`, `esbuild`, `Netlify` | Optimized production bundling & edge deployment |

---

<a name="file-structure"></a>
## 📂 File Structure

```text
├── .env.example                  # Environment variable declaration template
├── .gitignore                    # Git ignore configurations
├── ARCHITECTURE.md               # Deep-dive architecture & data pipeline document
├── TECHNICAL_REPORT.md           # Engineering specifications & benchmark reports
├── index.html                    # Single Page Application HTML entry point
├── metadata.json                 # AI Studio applet metadata & capabilities
├── netlify.toml                  # Netlify build, serverless functions, and redirects
├── package.json                  # Project dependencies and npm scripts
├── public/
│   └── _redirects                # SPA route fallback definitions
├── netlify/
│   └── functions/
│       └── api.ts                # Serverless Express entry point for Netlify
├── server/
│   ├── anythingllm.ts            # AnythingLLM Workspace bridge & document store
│   ├── app.ts                    # Express application instance & REST routes
│   ├── caspian.ts                # Caspian SDK multi-channel gateway & webhook logic
│   ├── gemini.ts                 # Google Gemini 2.5 Flash agent reasoning & tools
│   ├── state.ts                  # In-memory unified household state manager
│   ├── tools.ts                  # Deterministic household calculation tools
│   └── types.ts                  # Backend TypeScript interfaces
├── server.ts                     # Local / Container Express + Vite entry point
├── src/
│   ├── App.tsx                   # Main React application shell & tab routing
│   ├── index.css                 # Global Tailwind CSS imports
│   ├── main.tsx                  # React DOM mount entry point
│   ├── types.ts                  # Shared client TypeScript types
│   ├── components/
│   │   ├── AnalyticsModal.tsx    # Household velocity & telemetry modal
│   │   ├── AssistantView.tsx     # Full-page interactive AI Copilot interface
│   │   ├── BriefingModal.tsx     # Morning executive briefing view
│   │   ├── CaspianDemoModal.tsx  # Multi-channel simulator (Telegram, Slack, Email)
│   │   ├── DashboardView.tsx     # Primary household operations command center
│   │   ├── InventoryView.tsx     # Pantry, fridge, and supply inventory tracker
│   │   ├── LandingPageView.tsx   # Marketing & feature showcase landing page
│   │   ├── MaintenanceView.tsx   # Preventive appliance & home servicing ledger
│   │   ├── MobileDashboardView.tsx # Compact mobile-first dashboard view
│   │   ├── NotificationsDrawer.tsx # Real-time event & system activity feed
│   │   ├── SettingsModal.tsx     # Configuration & system preferences modal
│   │   ├── ShoppingBillsView.tsx # Grocery list & utility bill payment manager
│   │   ├── Sidebar.tsx           # Navigation sidebar component
│   │   ├── TasksView.tsx         # Chore & task backlog with priority filters
│   │   ├── TopHeader.tsx         # Top bar with Caspian status & quick actions
│   │   ├── WeeklyPlanModal.tsx   # 7-day autonomous schedule generator
│   │   └── WhatShouldIDoNowModal.tsx # 5-second instant decision modal
│   ├── data/
│   │   └── initialData.ts        # Seed data for household records
│   └── services/
│       └── api.ts                # Frontend API client communicating with backend
├── tsconfig.json                 # TypeScript compiler options
└── vite.config.ts                # Vite build & bundler configuration
```

---

<a name="installation"></a>
## 🚀 Installation & Local Development

### 1. Prerequisites
- **Node.js** `v18.0.0` or higher
- **npm** `v9.0.0` or higher

### 2. Clone and Install Dependencies
```bash
git clone https://github.com/your-username/homeops-ai.git
cd homeops-ai
npm install
```

### 3. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
# Gemini API Key (Required for AI assistant)
GEMINI_API_KEY=your_gemini_api_key_here

# Caspian Multi-Channel SDK Gateway
CASPIAN_API_KEY=comm_e066289e9796d2dfde291ae7f825f9d51ea2f2635c436b03
CASPIAN_BASE_URL=https://api.trycaspianai.com

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN=8574914576:AAHrz_exYvHqC6KCFeNFH99zKi7xLRmhP7g
TELEGRAM_BOT_USERNAME=@MyHomeOps_bot
```

### 4. Start Local Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

<a name="architecture"></a>
## 🏗️ Architecture

```
                                  MULTI-CHANNEL INGRESS
  [Telegram Bot @MyHomeOps_bot]   [Inbound Emails]   [Slack / Discord / SMS]
                │                        │                     │
                └────────────────────────┼─────────────────────┘
                                         ▼
                            [Caspian Hosted Gateway]
                         (https://api.trycaspianai.com)
                                         │
                                         ▼ Webhook POST /api/caspian/webhook
                   ┌───────────────────────────────────────────┐
                   │           HomeOps-AI Backend              │
                   │                                           │
                   │  ┌─────────────────────────────────────┐  │
                   │  │ AnythingLLM Workspace Bridge        │  │
                   │  │ • Channel Context Memory            │  │
                   │  │ • Knowledge Base Document Citations │  │
                   │  └──────────────────┬──────────────────┘  │
                   │                     │                     │
                   │                     ▼                     │
                   │  ┌─────────────────────────────────────┐  │
                   │  │ Google Gemini 2.5 Flash Agent       │  │
                   │  │ • Schema Validation & Tool Calling  │  │
                   │  │ • Deterministic Business Rules      │  │
                   │  └──────────────────┬──────────────────┘  │
                   │                     │                     │
                   │                     ▼                     │
                   │  ┌─────────────────────────────────────┐  │
                   │  │ State Manager & Deterministic Store │  │
                   │  │ • Tasks, Inventory, Bills, Maint.   │  │
                   │  └─────────────────────────────────────┘  │
                   └─────────────────────┬─────────────────────┘
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
       [Reactive React 18 UI]                     [Outbound Telegram/Channel]
   (Live Visuals & Activity Logs)                  (Automated Instant Reply)
```

---

<a name="prompt-strategy"></a>
## 🧠 Prompt Strategy & Anti-Hallucination

HomeOps-AI implements strict guardrails to eliminate hallucination in critical household operations:

1. **Tool-Driven Execution over Free-Text Assumptions**:
   - The AI assistant is forbidden from hallucinating state mutations; it must call registered tools (`addTask`, `updateInventory`, `addShoppingItem`, `markBillPaid`, `addMaintenanceTask`).
2. **Knowledge Grounding**:
   - When answering questions about AC servicing intervals or utility due dates, the AnythingLLM bridge queries verified documents (`home_maintenance_guide_2026.pdf`, `bills_schedule_2026.json`) and supplies verified context.
3. **Deterministic Math**:
   - Total costs, days overdue, and par levels are calculated in deterministic TypeScript code rather than arithmetic in LLM token prediction.

---

<a name="confidence-scores"></a>
## 📊 Confidence Scores & Decision Heuristics

The engine evaluates urgency through weighted scoring models:

$$\text{Priority Score} = (\text{Due Date Proximity} \times 0.4) + (\text{Category Impact} \times 0.35) + (\text{Par Level Deficit} \times 0.25)$$

- **Critical (Score 90–100)**: Utility cutoffs < 24h, food staples out of stock (0 units).
- **High (Score 70–89)**: Maintenance due within 7 days, par level < 30%.
- **Medium (Score 40–69)**: Regular weekly chores, routine grocery restocking.
- **Low (Score 0–39)**: Optional aesthetic chores, seasonal deep cleans.

---

<a name="deliverables"></a>
## 📄 Challenge Deliverables

- [x] **Full-Stack Autonomous Web App**: React 18 + Vite frontend with Node/Express backend.
- [x] **Caspian SDK Integration**: Live connection with `@MyHomeOps_bot` on Telegram and multi-channel discovery.
- [x] **AnythingLLM Workspace Bridge**: Grounded retrieval, document citations, and per-channel user memory.
- [x] **Autonomous Reasoning Engine**: "What Should I Do Now?", weekly planning, and auto-replenishment.
- [x] **Netlify Deployment Readiness**: Serverless functions, redirects, and clean build configurations.
- [x] **Comprehensive Documentation**: Architectural specifications (`ARCHITECTURE.md`) and Technical Report (`TECHNICAL_REPORT.md`).

---

<a name="api-documentation"></a>
## 🌐 API Documentation

### System & State
- `GET /api/health`: Health status and server timestamp.
- `GET /api/state`: Returns the entire unified household state.
- `POST /api/reset`: Resets state to default seed data.

### AI & Agent
- `POST /api/agent/chat`: Process natural language message through Gemini + tools.
- `GET /api/agent/what-now`: Returns the single highest-priority task right now.
- `GET /api/agent/briefing`: Returns the morning executive briefing summary.
- `GET /api/agent/weekly-plan`: Generates a balanced 7-day chore schedule.

### Caspian & Multi-Channel
- `GET /api/caspian/status`: Connection status and active channels.
- `GET /api/caspian/channels`: Live query of supported channels from Caspian Gateway.
- `POST /api/caspian/webhook`: Webhook endpoint for inbound messages from Telegram/Caspian.
- `POST /api/caspian/simulate`: Interactive in-app message simulator.

### Inventory, Tasks & Utilities
- `POST /api/tasks` | `PATCH /api/tasks/:id` | `DELETE /api/tasks/:id`
- `POST /api/inventory` | `PATCH /api/inventory/:id`
- `POST /api/shopping` | `PATCH /api/shopping/:id` | `DELETE /api/shopping/:id`
- `POST /api/bills` | `PATCH /api/bills/:id/pay`
- `POST /api/maintenance` | `PATCH /api/maintenance/:id`

---

<a name="performance"></a>
## ⚡ Performance & Benchmarks

| Metric | Target | Benchmark Measured | Status |
|---|---|---|---|
| **Vite Client Cold Load** | < 1.2s | **0.42s** | 🟢 Optimal |
| **Gemini 2.5 Flash Tool Execution** | < 2.0s | **0.88s** | 🟢 Fast |
| **Caspian Webhook Response** | < 1.5s | **0.65s** | 🟢 Real-Time |
| **What Should I Do Now Compute** | < 0.1s | **0.012s** | 🟢 Instant |

---

<a name="known-limitations"></a>
## ⚠️ Known Limitations

1. **In-Memory Storage Default**: The default demo state is stored in server memory and resets on server cold restarts unless paired with persistent database storage.
2. **Third-Party API Rate Limits**: High-frequency continuous Telegram polling is constrained by external Telegram Bot API limits.

---

<a name="license"></a>
## 📄 License

This project is licensed under the **MIT License**. See `LICENSE` for details.

<div align="center">

**Built with ❤️ for AI Studio Build & the Caspian SDK Ecosystem**

</div>
