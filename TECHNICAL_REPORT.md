# 📊 HomeOps AI: Technical Report & Engineering Specification

## 1. Executive Summary
HomeOps AI minimizes cognitive overhead in domestic logistics by uniting multi-channel messaging (Telegram via Caspian SDK) with autonomous decision heuristics and deterministic tool calling (Google Gemini 2.5 Flash).

---

## 2. Technical Stack Specifications

| Layer | Component | Implementation |
|---|---|---|
| **Client UI** | React 18.3 + TypeScript | Component-driven SPA with Tailwind CSS 4 & Motion animations |
| **Communication Gateway** | Caspian SDK | Multi-channel ingress router connecting Telegram `@MyHomeOps_bot` |
| **Agent Reasoning** | Google Gemini 2.5 Flash (`@google/genai`) | Function calling / tool execution with strict parameter schemas |
| **Domain Logic** | Custom TypeScript Tools | Deterministic inventory thresholds, priority score calculation |
| **State Layer** | In-Memory Reactive Manager | Zero-setup, instant in-memory store with real-time audit logging |
| **Server Engine** | Express 4.21 + Node.js | RESTful API endpoints & Netlify serverless function wrapper |

---

## 3. Data Integrity & Validation Strategy
- **Strong Typing**: 100% TypeScript across backend, serverless functions, and frontend components.
- **Strict Schema Enforcement**: Gemini tool declarations specify required fields, types, and numeric constraints to prevent corrupted state records.
- **Automatic Par-Level Triggers**: When inventory quantity drops below threshold, the system triggers synchronous shopping list addition.

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
- **Safe Netlify Edge Routing**: All `/api/*` routes are handled securely without exposing underlying credentials to client bundles.
