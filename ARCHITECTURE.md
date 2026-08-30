# 🏗️ HomeOps AI: Architecture Document

## 1. System Overview
HomeOps AI is an autonomous household operations platform built on a clean three-tier architecture:

1. **Multi-Channel Ingress & Communication Tier**: Powered by the **Caspian SDK**. Inbound user messages from Telegram ([@MyHomeOps_bot](https://t.me/MyHomeOps_bot)), external webhooks, and the in-app simulator are routed into standardized message intents.
2. **Agentic Reasoning & Tool Execution Tier**: Powered by **Google Gemini 2.5 Flash** with deterministic tool declarations (`createTask`, `updateInventory`, `addShoppingItem`, `addBill`, `markBillPaid`, `addMaintenanceTask`, `whatShouldIDoNow`).
3. **State Management & Presentation Tier**: An **In-Memory Reactive State Manager** serving both the React 18 frontend dashboard and real-time outbound messaging channels.

---

## 2. Component Pipeline
```
[User on Telegram (@MyHomeOps_bot) / In-App Channel Simulator]
                         │
                         ▼
           [Caspian Hosted Gateway]
          (https://api.trycaspianai.com)
                         │
                         ▼ (Webhook POST /api/caspian/webhook)
       [Express Server (server/caspian.ts & server/app.ts)]
                         │
                         ▼
        [Google Gemini 2.5 Flash Agentic Core]
         • Intent detection & Tool selection
                         │
                         ▼ (Function Call Execution)
          [Deterministic Household Tools]
         • createTask / completeTask
         • updateInventory & auto-replenish
         • addShoppingItem
         • addBill / markBillPaid
         • addMaintenanceTask
         • whatShouldIDoNow calculation
                         │
                         ▼
        [Unified In-Memory State Manager (server/state.ts)]
         • Tasks, Inventory, Shopping, Bills, Maintenance
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[Telegram Message Reply via Caspian]   [Live React 18 Dashboard]
```

---

## 3. Storage & Persistence Strategy
- **Prototype In-Memory Store**: Keeps the hackathon project responsive, reliable, and zero-setup without requiring external database provisioning.
- **Transactional State Updates**: All tool actions synchronously mutate the unified state object and create audit entries in the activity log.
- **State Reset API**: `POST /api/reset` enables instant restoration to baseline seed records for testing.

---

## 4. Netlify Serverless Deployment Architecture
- **Frontend**: Single-Page Application (SPA) built via Vite into `/dist`, served with static asset caching and root fallback in `public/_redirects`.
- **Backend API**: Hosted as a Netlify serverless function via `netlify/functions/api.ts` utilizing `serverless-http` to wrap the Express router.
- **Routing**: `netlify.toml` maps `/api/*` requests directly to `/.netlify/functions/api`.
