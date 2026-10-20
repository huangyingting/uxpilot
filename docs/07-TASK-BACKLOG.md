# Task Backlog — UX Pilot Studio

| ID | Epic | Task Title | Role / Scope | Priority | Points | Status |
|---|---|---|---|---|---|---|
| **T-01** | Discovery | Playwright exploration of `uxpilot.ai` public & authenticated `/a/*` routes, `/playground`, `/labs`, and responsive viewports | QA / Arch | P0 | 5 | Done |
| **T-02** | Architecture | Author Exploration Coverage, ADR, PRD, Tech Spec, Data Model, Implementation Plan, Backlog, Acceptance Criteria, and Parity Matrix | Arch / PM | P0 | 5 | Done |
| **T-03** | Data Layer | Configure Prisma 7 dual SQLite (`schema.prisma`) & PostgreSQL (`schema.postgres.prisma`) schemas, migrations, and runtime driver adapter | Backend | P0 | 5 | Pending |
| **T-04** | Security | Implement CLI-only `npm run bootstrap:admin` (`scripts/bootstrap-admin.mjs`) with zero public HTTP bootstrap endpoint | Security | P0 | 3 | Pending |
| **T-05** | Auth & RBAC | Implement NextAuth Credentials provider, invite-only `/api/auth/register` with single-use/expiring/email-locked codes, and `AuditLog` | Security | P0 | 5 | Pending |
| **T-06** | Governance | Implement `resolveSessionActor` live DB revocation check, RBAC enforcement (`Admin`, `Editor`, `Viewer`), and `/api/admin/*` routes | Security | P0 | 5 | Pending |
| **T-07** | AI Engine | Implement pluggable `AIProvider` (`@github/copilot-sdk` `CopilotClient` + Azure OpenAI REST + deterministic fallback) | AI / Backend | P0 | 8 | Pending |
| **T-08** | Workspace API | Implement `/api/workspace/bootstrap`, `/api/pages/*`, `/api/workstreams/*`, `/api/screens/*`, `/api/comments/*` | Backend | P0 | 5 | Pending |
| **T-09** | Dashboard UI | Build `/a/ui-list` and `/a/folders` with Hero Prompt Composer, All/Bookmarked/Shared tabs, Frameworks modal, and Figma Plugin modal | Frontend | P0 | 5 | Pending |
| **T-10** | Canvas Studio | Build `/a/ui-design` and `/playground` Infinite Canvas with pan/zoom, 3-tier prompts, 4-Look variations, Autoflow, Code drawer, Flowchart, Comments, and Version History | Frontend | P0 | 8 | Pending |
| **T-11** | UX Review | Build `/a/ux-design-review` & canvas Review drawer with Heuristic scores + Predictive Attention Heatmap, Visual Scanpath, and Gaze Flow | AI / Frontend | P0 | 5 | Pending |
| **T-12** | Design System | Build `/a/design-system` & `/a/design-system/import` (GitHub, Figma, Website URL) with token editor, React components, and `DESIGN.md` | Frontend | P1 | 5 | Pending |
| **T-13** | PR & Sites | Build `/a/pr-review` (GitHub PR UI/UX audit runner) and `/a/published-sites` + `/s/[slug]` live published prototype viewer | Full-Stack | P1 | 5 | Pending |
| **T-14** | Labs | Build `/labs`, `/labs/gradient-generator` (Prism/Aurora/Mesh/Halftone shader canvas), and `/labs/dither-generator` (Floyd-Steinberg/Atkinson/Bayer) + `Send to Canvas` | Frontend | P1 | 5 | Pending |
| **T-15** | Account/Admin | Build `/a/account` (Profile, Billing & Subscription, MCP Access Tokens) and `/a/admin` (Invitations, Users/Revocation, Audit Logs, AI Provider) | Full-Stack | P0 | 5 | Pending |
| **T-16** | Public Pages | Build `/`, `/plans`, `/templates`, `/wireframe-generator`, `/ui-design-generator`, `/sign-in`, `/sign-up` | Frontend | P1 | 3 | Pending |
| **T-17** | Verification | Execute unit/API tests, `npm run build`, and full Playwright E2E test suite verifying all features, combinations, and responsive viewports | QA | P0 | 5 | Pending |
