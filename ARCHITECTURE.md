# 🏗️ HomeOps AI: Architecture Document

## 1. System Overview
HomeOps AI is an autonomous household operations platform built on a clean three-tier architecture:

1. **Multi-Channel Ingress & Communication Tier**: Powered by the **Caspian SDK 1.0**. Inbound user messages from Telegram ([@MyHomeOps_bot](https://t.me/MyHomeOps_bot)) are routed via Caspian's hosted channel infrastructure directly into the agent message listener (`cx.onMessage`), running continuously via `cx.run()`.
2. **Agentic Reasoning & Tool Execution Tier**: Powered by **Google Gemini 2.5 Flash** with deterministic tool declarations (`createTask`, `updateInventory`, `addShoppingItem`, `addBill`, `markBillPaid`, `addMaintenanceTask`, `whatShouldIDoNow`).
3. **State Management & Presentation Tier**: An **In-Memory Reactive State Manager** serving both the React 18 frontend dashboard (via Server-Sent Events `/api/events` and REST `/api/state`) and real-time outbound messaging channels through `thread.post()`.

---

## 2. Component Pipeline
```
[User on Telegram (@MyHomeOps_bot)]
                 │
                 ▼
      [Caspian Hosted Gateway]
    (https://api.trycaspianai.com)
                 │
                 ▼ (Hosted Gateway Event Loop: cx.run())
 [Caspian SDK 1.0 cx.onMessage({ channel: 'telegram' })]
                 │
                 ▼ (Unified handleIncomingMessage())
  [Google Gemini 2.5 Flash Agentic Core & Tools]
   • Intent detection & Tool selection
   • Deterministic Household Tools:
     - createTask / completeTask
     - updateInventory & auto-replenish
     - addShoppingItem
     - addBill / markBillPaid
     - addMaintenanceTask
     - whatShouldIDoNow calculation
                 │
                 ▼
  [Unified In-Memory State Manager (server/state.ts)]
   • Tasks, Inventory, Shopping, Bills, Maintenance, Timeline
                 │
        ┌────────┴──────────────────────────┐
        ▼                                   ▼
[Caspian Outbound: thread.post()]   [Live React 18 Dashboard]
 (Directly delivered to Telegram)    (Instant updates via SSE /api/events)
```

---

## 3. Storage & Persistence Strategy
- **Prototype In-Memory Store**: Keeps the hackathon project responsive, reliable, and zero-setup without requiring external database provisioning.
- **Transactional State Updates**: All tool actions synchronously mutate the unified state object and create audit entries in the activity log.
- **State Reset API**: `POST /api/reset` enables instant restoration to baseline seed records for testing.

---

## 4. Deployment Architecture
- **Frontend**: Single-Page Application (SPA) built via Vite into `/dist`, served with static asset caching and root fallback.
- **Backend API**: Full-stack Node.js Express server running `server.ts` / `dist/server.cjs` binding to `0.0.0.0:3000`.
- **Caspian Hosted Gateway**: Long-polling event loop initialized on startup via `caspianService.initCaspian()`, dispatching replies directly via `thread.post()`.
