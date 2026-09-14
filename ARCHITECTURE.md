# 🏗️ HomeOps AI: Architecture Document

<div align="center">

[![Download Architecture PDF](https://img.shields.io/badge/📄%20Working%20Architecture%20PDF-HomeOps__AI__Working__Architecture.pdf-00C7B7?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](./HomeOps_AI_Working_Architecture.pdf)
[![Live Application](https://img.shields.io/badge/Netlify-homeops--ai.netlify.app-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://homeops-ai.netlify.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-bikram73%2FHOMEOPS__AI-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/bikram73/HOMEOPS_AI)

</div>

---

## 📄 Working Architecture Visual Diagram (PDF)

Below is the official **HomeOps AI Working Architecture Diagram** (`HomeOps_AI_Working_Architecture.pdf`). You can inspect it directly in the embedded viewer below or [download the PDF file directly](./HomeOps_AI_Working_Architecture.pdf).

<div align="center">

<object data="./HomeOps_AI_Working_Architecture.pdf" type="application/pdf" width="100%" height="850px">
  <iframe src="./HomeOps_AI_Working_Architecture.pdf" width="100%" height="850px" style="border: 1px solid #e2e8f0; border-radius: 8px;">
    <p>Your browser does not support embedded PDF viewing. Please <a href="./HomeOps_AI_Working_Architecture.pdf" target="_blank" rel="noopener noreferrer"><b>click here to view and download HomeOps_AI_Working_Architecture.pdf</b></a>.</p>
  </iframe>
</object>

<p><em>Direct PDF link: <a href="./HomeOps_AI_Working_Architecture.pdf"><b>HomeOps_AI_Working_Architecture.pdf</b></a> (Accessible in workspace root and <code>public/</code> static web directory)</em></p>

</div>

---

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
- **Architecture PDF Asset**: Available in the repository root (`./HomeOps_AI_Working_Architecture.pdf`) and publicly hosted at `/HomeOps_AI_Working_Architecture.pdf`.
