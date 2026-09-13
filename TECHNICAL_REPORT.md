# 📊 HomeOps AI: Technical Report & Engineering Specification

## 1. Executive Summary
HomeOps AI minimizes cognitive overhead in domestic logistics by uniting multi-channel messaging (Telegram via Caspian SDK 1.0 hosted gateway) with autonomous decision heuristics and deterministic tool calling (Google Gemini 2.5 Flash).

---

## 2. Technical Stack Specifications

| Layer | Component | Implementation |
|---|---|---|
| **Client UI** | React 18.3 + TypeScript | Component-driven SPA with Tailwind CSS & Lucide icons |
| **Communication Gateway** | Caspian SDK 1.0 (`@caspian/sdk`) | Hosted gateway loop (`cx.run()`) with `cx.onMessage()` & `thread.post()` |
| **Agent Reasoning** | Google Gemini 2.5 Flash (`@google/genai`) | Function calling / tool execution with strict parameter schemas |
| **Domain Logic** | Custom TypeScript Tools | Deterministic inventory thresholds, priority score calculation |
| **State Layer** | In-Memory Reactive Manager | Zero-setup, instant in-memory store with real-time SSE stream (`/api/events`) |
| **Server Engine** | Express + Node.js | Full-stack REST API with Server-Sent Events & static SPA serving |

---

## 3. Ingress & Egress Architecture
- **Hosted Gateway Loop**: The server runs `cx.run()` which connects to Caspian's hosted platform, receiving Telegram events via `cx.onMessage({ channel: 'telegram' })`.
- **Direct Thread Post**: Responses from the Gemini agent are posted directly back to the active channel thread using `thread.post(response)`.
- **Zero Webhook Attack Surface**: Inbound webhook endpoints are permanently disabled in favor of the hosted gateway connection loop.
- **Server-Sent Events (SSE)**: State changes from both Telegram chats and the web app broadcast live to all connected browser sessions via `/api/events`.

---

## 4. Prioritization Heuristics ("What Should I Do Now?")
The priority calculation algorithm computes urgency scores:

$$\text{Priority Score} = (\text{Due Date Proximity} \times 0.40) + (\text{Category Severity} \times 0.35) + (\text{Inventory Deficit} \times 0.25)$$

- **Critical (Score 90–100)**: Utility cutoffs due $\le$ 24h, food staples at 0 units.
- **High (Score 70–89)**: Maintenance overdue or due within 7 days, par level $< 30\%$.
- **Medium (Score 40–69)**: Routine weekly chores, regular grocery restocking.
- **Low (Score 0–39)**: Optional aesthetic chores, seasonal deep cleaning.

---

## 5. Security & Configuration
- **Zero Secrets in Source**: All API keys and bot tokens are loaded from runtime environment variables (`process.env`).
- **Clean Gitignore**: The repository strictly prevents environment files and build artifacts from entering version control.
- **Server-Side API Security**: Third-party keys and Gemini operations are strictly isolated on the backend server.
