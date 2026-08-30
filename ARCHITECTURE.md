# 🏗️ HomeOps-AI Architecture Document

## 1. System Overview
HomeOps-AI operates as an autonomous household operations system designed around a three-tier architecture:

1. **Ingress & Communication Tier**: Managed via the Caspian SDK and AnythingLLM Workspace Bridge. Inbound updates from Telegram (`@MyHomeOps_bot`), Slack, Email, or Web UI are normalized into standardized operational intents.
2. **Reasoning & Tool Execution Tier**: Powered by Google Gemini 2.5 Flash with structured function declarations for state mutations (tasks, inventory par-level replenishment, bill tracking, preventive maintenance).
3. **State Management & Presentation Tier**: Unified in-memory reactive state manager serving both a React 18 frontend dashboard and outbound conversational channels.

---

## 2. Component Pipeline
```
[User / Channel]
       │
       ▼
[Caspian Gateway (Hosted @ api.trycaspianai.com)]
       │
       ▼ (Webhook POST /api/caspian/webhook)
[AnythingLLM Workspace Bridge (homeops-ai)]
       │ ── Context Retrieval & Document Citations
       ▼
[Gemini 2.5 Flash Agentic Core]
       │ ── Tool Calling (addTask, updateInventory, etc.)
       ▼
[State Manager (server/state.ts)]
       ├── Tasks Ledger
       ├── Inventory & Par Levels
       ├── Shopping Backlog
       ├── Utilities & Due Dates
       └── Preventive Maintenance Schedule
       │
       ▼
[Response Output]
       ├── Telegram Message Response via Caspian
       └── Live React Dashboard Synchronization
```

---

## 3. Deployment Design (Netlify)
- **Frontend SPA**: Bundled into `/dist` via `npm run build` using Vite.
- **Serverless API**: Handled via `netlify/functions/api.ts` running `serverless-http` wrapping Express.
- **Redirects**: Routed via `netlify.toml` and `public/_redirects` for seamless SPA hydration.
