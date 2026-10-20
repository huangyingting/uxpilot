# Architecture Decision Records (ADR)

## ADR-001: Next.js 16 App Router Full-Stack Architecture

- **Status**: Accepted
- **Context**: UX Pilot combines marketing/discovery pages, an authenticated multi-route workspace (`/a/ui-list`, `/a/ui-design`, `/a/ux-design-review`, `/a/design-system`, `/a/pr-review`, `/a/published-sites`, `/a/account`), creative shader/dithering tools (`/labs/*`), and rich JSON APIs for AI generation, canvas persistence, and governance.
- **Decision**: Build a unified Next.js 16.2+ App Router application using React 19, TypeScript, and Tailwind CSS v4. Public routes, workspace views (`/a/*`), interactive canvas (`/playground` and `/a/ui-design`), Labs (`/labs/*`), and REST API route handlers (`/api/*`) reside in a single cohesive codebase.
- **Consequences**: Zero CORS friction between the frontend and backend APIs, shared TypeScript domain types across UI and server routes, and straightforward deployment as either a standalone Node.js container or serverless deployment.

---

## ADR-002: Dual-Target Prisma 7 Persistence (SQLite Local + PostgreSQL Production)

- **Status**: Accepted
- **Context**: The user requires SQLite for zero-configuration local development and automated testing, and PostgreSQL for production deployments, with full schema parity and migrations.
- **Decision**: Use Prisma 7 (`@prisma/client` + `@prisma/adapter-better-sqlite3` for `file:` URLs and `@prisma/adapter-pg` for `postgres://` / `postgresql://` URLs), following the proven reference pattern in `../Arcade`. Maintain `prisma/schema.prisma` (SQLite default) and `prisma/schema.postgres.prisma` (PostgreSQL production) alongside SQL migrations in `prisma/migrations/`. Runtime adapter selection in `src/lib/db.ts` inspects `DATABASE_URL` and instantiates either `PrismaBetterSqlite3` or `PrismaPg`.
- **Consequences**: Local development (`npm run dev`, `npm test`, E2E Playwright runs) works out-of-the-box with local SQLite (`file:./dev.db`), while production environments connect directly to PostgreSQL by setting `DATABASE_URL=postgresql://...`.

---

## ADR-003: Auth.js / NextAuth with Invite-Only Admission, RBAC, Session Revocation & CLI Bootstrap

- **Status**: Accepted
- **Context**: The application must enforce invite-only registration using single-use, expiring invitation codes, role-based access control (`Admin`, `Editor`, `Viewer`), immediate account/invitation revocation, audit logging, and a strict security boundary where initial bootstrap admin creation is available **only** via a deployment CLI script (`npm run bootstrap:admin`) and never exposed as an HTTP endpoint.
- **Decision**:
  1. Use `next-auth` (`CredentialsProvider` with `bcryptjs` password hashing stored in `PasswordCredential`).
  2. Require a valid, unredeemed, non-expired, non-revoked `AccountInvitation` code (`code`, `email` optional binding, `assignedRole`, `expiresAt`, `redeemedAt`, `revokedAt`) for `/api/auth/register`. Redeeming an invitation atomically marks `redeemedAt`, `redeemedByUserId`, and creates the `User` with `assignedRole` and an `AuditLog` entry.
  3. On every authenticated request (`resolveSessionActor` in `src/lib/api-auth.ts`), re-verify the user record in the database (`status === "ACTIVE"` and `revokedAt === null`) so that revoking a user or changing their role takes effect immediately even if an existing JWT cookie is still presented.
  4. Provide `scripts/bootstrap-admin.mjs` (`npm run bootstrap:admin`) as the sole mechanism to seed or promote the initial `Admin` user. No `/api/bootstrap` HTTP endpoint exists.
- **Consequences**: Complete protection against unauthorized sign-ups and privilege escalation, immediate session invalidation upon user revocation, and full traceability via `AuditLog`.

---

## ADR-004: Pluggable AI Capability Layer (`@github/copilot-sdk` + Azure OpenAI + Deterministic Fallback)

- **Status**: Accepted
- **Context**: UX Pilot's core workflows (Wireframe generation, Hi-Fi UI generation, 4-Look variations, Multi-screen Autoflow, Prompt Enhancement, Mermaid Flowchart generation, HTML-to-React conversion, AI UX Design Review, Predictive Eye-Tracking Heatmap/Scanpath analysis, Design System extraction, and PR UX Review) require an AI engine that uses `@github/copilot-sdk` now and can switch seamlessly to Azure OpenAI via configuration without changing application logic.
- **Decision**: Implement a Strategy/Adapter interface (`AIProvider` in `src/lib/ai/provider.ts`) with three concrete implementations:
  1. `CopilotSdkProvider` (`src/lib/ai/copilot-provider.ts`): Uses `CopilotClient` from `@github/copilot-sdk` (matching `../website/scripts/translate-markdown.mjs`) to create a session and invoke the configured Copilot model (`AI_COPILOT_MODEL`, default `gpt-4.1` / `gpt-4o`).
  2. `AzureOpenAIProvider` (`src/lib/ai/azure-openai-provider.ts`): Calls Azure OpenAI Chat Completions (`AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`).
  3. `DeterministicDesignProvider` (`src/lib/ai/fallback-provider.ts`): Domain-aware, prompt-responsive deterministic generator used automatically as an internal fallback when external AI credentials/daemon are unavailable or when `AI_PROVIDER=mock` in deterministic CI tests.
- **Consequences**: Switching from Copilot SDK to Azure OpenAI requires only setting `AI_PROVIDER=azure-openai` and Azure environment variables, while every AI feature remains 100% functional and testable in offline/CI environments via automatic internal fallback.

---

## ADR-005: Infinite Canvas Studio with Dual-Mode Sandboxed Screen Renderer

- **Status**: Accepted
- **Context**: UX Pilot's `/a/ui-design` and `/playground` allow users to pan/zoom across an infinite canvas of screen groups (`ScreenGroup`), individual screens (`WireframeScreen`), and flowcharts (`CanvasFlowchart`), inspect/edit rendered HTML+Tailwind screens safely, generate 4-Look variations, link multi-screen autoflows, export production HTML/React/Figma payloads, and pin spatial comments.
- **Decision**: Build an interactive canvas engine supporting pan/zoom (`25%` to `200%`), tool modes (`Select`, `Add Screen`, `Flowchart`, `Comment`, `Navigate`), global/section/screen prompt overlays, sandboxed `iframe` screen rendering (`srcDoc` with Tailwind CSS + live visual/code inspector), 4-Look variation generation, Autoflow connector lines, and version history snapshots.
- **Consequences**: Users get an authentic, responsive infinite-canvas workflow matching UX Pilot's `/a/ui-design` and `/playground` experience without external WebSocket server dependencies.

---

## ADR-006: Predictive Eye-Tracking (Heatmap, Scanpath, Gaze Flow) & Heuristic UX Review

- **Status**: Accepted
- **Context**: UX Pilot's `/a/ux-design-review` and canvas `Review` drawer provide both AI UX heuristic evaluation and predictive visual analytics (`Attention Heatmap`, `Visual Scanpath` fixation sequence, and `Gaze Flow` region breakdown).
- **Decision**: Combine structured AI heuristic scoring (`Overall Score`, `Visual Hierarchy`, `Accessibility & Contrast`, `Copy Clarity`, `Conversion Friction`, `Actionable Recommendations`) with a deterministic + AI-assisted salient-region analyzer that computes normalized fixation coordinates `(x, y, weight, order, label)` and renders interactive SVG/Canvas overlays for **Attention Heatmap** (radial thermal gradient), **Scanpath** (numbered saccade vectors `1 -> 2 -> 3 -> 4 -> 5`), and **Gaze Flow** (AOI attention percentages).
- **Consequences**: Every screen on the canvas or uploaded/selected in `/a/ux-design-review` can be audited with toggleable Heatmap, Scanpath, and Gaze Flow overlays.

---

## ADR-007: Client-Side WebGL/Canvas Generators for UX Pilot Labs

- **Status**: Accepted
- **Context**: UX Pilot includes `/labs`, `/labs/gradient-generator`, and `/labs/dither-generator`, plus a "Send to Canvas" workflow that saves generated visual assets directly into the user's design workspace.
- **Decision**: Implement real-time HTML5 Canvas / pixel-buffer engines for both the **Gradient Shader Generator** (`Prism`, `Aurora`, `Mesh`, `Halftone` modes, aspect ratios, speed/scale/swirl/warp/grain/vignette controls, PNG/SVG/CSS export, and `Send to Canvas`) and the **Dither Generator** (`Floyd-Steinberg`, `Atkinson`, `Bayer 4×4`, `Bayer 8×8`, `Halftone` error-diffusion/ordered dithering algorithms on real pixel data, threshold/contrast/scale/palette controls, PNG/SVG export, and `Send to Canvas`).
- **Consequences**: Instant 60fps interactive visual generation in the browser with persisted preset/artifact saving to the database and direct integration into `/a/ui-design`.
