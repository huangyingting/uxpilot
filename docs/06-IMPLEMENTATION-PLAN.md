# Implementation Plan — UX Pilot Studio

## Phase 1: Project Scaffolding, Prisma 7 Dual-DB Schema & CLI Bootstrap
1. Initialize Next.js 16.2+ App Router (`package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`) with React 19, NextAuth 4.24.x, Prisma 7 (`@prisma/client`, `@prisma/adapter-better-sqlite3`, `@prisma/adapter-pg`), and `@github/copilot-sdk`.
2. Define `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL), generate the Prisma client, create initial SQL migrations (`prisma/migrations/0001_init/migration.sql`), and configure `prisma.config.ts`.
3. Implement `scripts/bootstrap-admin.mjs` (`npm run bootstrap:admin`) to seed the initial `Admin` user, sample single-use invitation codes (`Admin`, `Editor`, `Viewer`), and rich initial workspace fixtures (`Workstream`, `DesignPage`, `ScreenGroup`, `WireframeScreen`, `DesignSystem`, `DesignReview`, `PrReviewRun`, `PublishedSite`, `McpAccessToken`).
4. Implement `Dockerfile`, `docker-compose.yml` (with PostgreSQL production profile), and `.env.example`.

## Phase 2: Authentication, Invite-Only Registration, RBAC, Revocation & Audit Logging
1. Implement `src/lib/db.ts` (dual SQLite / PostgreSQL runtime adapter) and `src/lib/audit.ts` (`recordAuditLog`).
2. Implement `src/lib/auth.ts` (`NextAuthOptions` with `CredentialsProvider`, `bcryptjs` verification, and blocked login for `REVOKED` users) and `src/lib/api-auth.ts` (`resolveSessionActor` with live DB status/role verification and role hierarchy guard `hasMinimumRole`).
3. Implement `/api/auth/[...nextauth]` and `/api/auth/register` (`GET` code preview + `POST` atomic single-use invitation redemption).
4. Implement Admin Governance APIs (`/api/admin/invitations`, `/api/admin/invitations/[id]`, `/api/admin/users`, `/api/admin/users/[id]`, `/api/admin/audit-logs`).

## Phase 3: Pluggable AI Capability Layer (`@github/copilot-sdk` + Azure OpenAI + Fallback)
1. Implement `src/lib/ai/provider.ts` defining the unified `AIProvider` contract and runtime switcher (`AI_PROVIDER=copilot-sdk | azure-openai | deterministic`).
2. Implement `src/lib/ai/copilot-provider.ts` using `CopilotClient` from `@github/copilot-sdk` (`createSession`, `sendAndWait`).
3. Implement `src/lib/ai/azure-openai-provider.ts` calling Azure OpenAI Chat Completions REST endpoint.
4. Implement `src/lib/ai/fallback-provider.ts` generating rich, prompt-tailored Tailwind HTML screens, React TSX components, 4-Look variations, Mermaid flowcharts, UX heuristic reviews with Heatmap/Scanpath/GazeFlow coordinates, Design System token/component extractions, and GitHub PR UX review reports.
5. Expose `/api/ai/status`, `/api/ai/enhance-prompt`, `/api/ai/generate`, and `/api/ai/review`.

## Phase 4: Workspace Domain APIs (`/api/workspace/*`, `/api/pages/*`, `/api/design-systems/*`, `/api/pr-review/*`, `/api/published-sites/*`, `/api/labs/*`)
1. Implement `/api/workspace/bootstrap` returning consolidated workspace state.
2. Implement CRUD & action endpoints for `DesignPage`, `Workstream` (Folders), `WireframeScreen`, `CanvasFlowchart`, and `DesignComment`.
3. Implement `DesignSystem` creation & 3-source import (`/api/design-systems`, `/api/design-systems/import`), `PrReviewRun` execution (`/api/pr-review/runs`), `PublishedSite` management (`/api/published-sites`), MCP token management (`/api/account/mcp-tokens`), and Labs canvas export (`/api/labs/send-to-canvas`).

## Phase 5: Responsive Frontend Implementation (Public, Workspace `/a/*`, Canvas Studio, Labs & Admin Console)
1. Implement public & marketing routes (`/`, `/plans`, `/templates`, `/wireframe-generator`, `/ui-design-generator`, `/sign-in`, `/sign-up`, `/s/[slug]`).
2. Implement authenticated workspace shell (`/a/*` sidebar with `Design`, `Review`, `Design System`, `PR Review`, `Published websites`, `Frameworks` modal, `Figma Plugin` modal, `Folders` + Create Folder modal, `Recent` files, credit meter, `Account Settings`, and `Admin Governance`).
3. Implement `/a/ui-list` (Hero prompt bar, All/Bookmarked/Shared tabs, search/sort, file cards) and `/a/folders` (folder view).
4. Implement `/a/ui-design` and `/playground` Infinite Canvas Studio (pan/zoom, Global/Section/Screen prompts, sandboxed screen preview, `Edit with AI`, `4-Look Variations`, `Autoflow`, `Code` drawer with HTML & React tabs, `Review` drawer with Heatmap/Scanpath/GazeFlow, `Flowchart` generator, `Comment` pins, `Version History`, and `Share`/`Publish` modal).
5. Implement `/a/ux-design-review` (standalone UX Review & Predictive Eye-Tracking studio), `/a/design-system` & `/a/design-system/import` (Design Systems Hub & 3-source import wizard), `/a/pr-review` (GitHub PR UX Review dashboard), `/a/published-sites` (Published websites manager), `/a/account` (Profile, Billing & Subscription, MCP Access Tokens), and `/a/admin` (Invitations, Users/RBAC/Revocation, Audit Logs, AI Provider switcher).
6. Implement `/labs`, `/labs/gradient-generator`, and `/labs/dither-generator` with real-time HTML5 Canvas shaders/dithering and `Send to Canvas`.

## Phase 6: Automated Verification (Unit/API Tests, Build/Lint & Comprehensive Playwright E2E)
1. Run `npm run lint` and `npm run build` to verify zero TypeScript or Next.js build errors.
2. Run unit & integration tests covering invite-only registration, single-use/expired/revoked codes, RBAC (`Admin`, `Editor`, `Viewer`), immediate user revocation, audit logging, and pluggable AI provider switching (`Copilot SDK` <-> `Azure OpenAI` <-> fallback).
3. Run an end-to-end Playwright verification suite visiting every route, modal, canvas feature combination, Labs generator, and responsive viewport (`1440×900`, `768×1024`, `390×844`).
