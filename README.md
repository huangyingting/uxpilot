# UX Pilot Studio

An AI-powered UI/UX Design, Wireframing, Design System Token Extraction, Predictive Eye-Tracking UX Review, GitHub PR UX Audit, and Interactive Shader Labs platform built with **Next.js 16 (App Router)**, **Auth.js / NextAuth**, **Prisma 7** (SQLite for local dev, PostgreSQL for production), **Invite-Only RBAC Governance**, and a **Pluggable AI Layer** (`@github/copilot-sdk` + **Azure OpenAI**).

---

## Key Capabilities

1. **Infinite AI Design & Wireframe Canvas (`/a/ui-design`, `/playground`)**:
   - Generate multi-screen **Hi-Fi UI** and **Low-Fi Wireframes** across **Desktop** and **Mobile** viewports.
   - **AI Prompt Enhancer**, **4-Look Variations**, and **Autoflow** screen linking.
   - **Code Export Drawer** (`React 19 + Tailwind CSS TSX` & `HTML5/CSS`).
   - **AI Mermaid Flowchart** generation and **Canvas Comments** with pin resolution.
   - **Screen Version History** with 1-click snapshot restore.
2. **Predictive Eye-Tracking & Heuristic UX Review (`/a/ux-design-review`)**:
   - Visual **Attention Heatmap**, **Numbered Scanpath**, and **Regional Gaze Flow** simulation.
   - Quantitative Clarity, Visual Hierarchy, WCAG AA Accessibility, and Conversion Friction scores.
3. **Design System Hub & Import Wizard (`/a/design-system`, `/a/design-system/import`)**:
   - Import design systems from **Figma Plugin**, **Live Website URL**, **Product Screenshots**, or **`DESIGN.md`**.
4. **Automated GitHub PR UX Review (`/a/pr-review`)**:
   - Inspect pull requests for accessibility focus traps, WCAG contrast, and token adherence.
5. **UX Pilot Shader Labs (`/labs`, `/labs/gradient-generator`, `/labs/dither-generator`)**:
   - Interactive Mesh/Aurora/Fluid Gradient and Retro Bayer/Floyd-Steinberg/Halftone/ASCII Dither generators with **Send to AI Canvas**.
6. **Invite-Only Registration, RBAC, Revocation & Audit Logging (`/a/admin`, `/sign-up`, `/sign-in`)**:
   - Single-use and expiring invitation codes (`AccountInvitation`) with optional email locks.
   - `Admin`, `Editor`, and `Viewer` RBAC enforcement across UI and API routes.
   - Immediate session revocation (`REVOKED` status) and immutable `AuditLog` trail.
   - **CLI-only Bootstrap Admin**: No public HTTP bootstrap endpoint; bootstrap admins are provisioned strictly via `npm run bootstrap:admin`.
7. **Pluggable AI Provider Engine (`src/lib/ai/`)**:
   - Default **`@github/copilot-sdk`** (`CopilotSDKProvider`) with runtime or environment-based switching to **Azure OpenAI** (`AzureOpenAIProvider`) and deterministic synthesis fallback.

---

## Quick Start (Local Development with SQLite)

```bash
# 1. Install dependencies
npm install

# 2. Push Prisma SQLite schema & generate client
npm run db:push

# 3. Provision bootstrap admin & seed initial workspace via CLI script
npm run bootstrap:admin

# 4. Run development server
npm run dev
```

## Production Deployment (PostgreSQL / Docker)

```bash
# Apply PostgreSQL schema
npx prisma db push --schema=prisma/schema.postgres.prisma

# Or launch with Docker Compose (Next.js + PostgreSQL 16)
docker compose up --build -d
```

## Documentation Suite (`docs/`)

- `docs/01-EXPLORATION-COVERAGE.md` — Systematic Playwright exploration report & 34 screenshots (`screenshots/`)
- `docs/02-ADR.md` — Architecture Decision Records
- `docs/03-PRD.md` — Product Requirements Document
- `docs/04-TECHNICAL-SPEC.md` — Technical Specification
- `docs/05-ARCHITECTURE-AND-DATA-MODEL.md` — System Architecture & Dual SQLite/PostgreSQL Data Model
- `docs/06-IMPLEMENTATION-PLAN.md` — Phased Implementation Plan
- `docs/07-TASK-BACKLOG.md` — Engineering Task Backlog
- `docs/08-ACCEPTANCE-CRITERIA.md` — Testable Acceptance Criteria
- `docs/09-FEATURE-PARITY-MATRIX.md` — Feature Parity & Enterprise Extensions Matrix
