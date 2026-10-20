# Technical Specification — UX Pilot Studio

## 1. Technology Stack

- **Runtime & Framework**: Node.js `v24.x`, Next.js `16.2+` (App Router, Turbopack/Webpack compatible), React `19.2+`, TypeScript `5.x`.
- **Styling & Icons**: Tailwind CSS `v4` (`@tailwindcss/postcss`), `lucide-react` icons.
- **Authentication**: `next-auth` `v4.24.x` (`CredentialsProvider`, JWT strategy with live database actor verification for instant revocation and role sync), `bcryptjs`.
- **Database & ORM**: Prisma `7.x` (`@prisma/client`, `@prisma/adapter-better-sqlite3` + `better-sqlite3` for local SQLite, `@prisma/adapter-pg` + `pg` for PostgreSQL).
- **AI Engine**: Pluggable provider (`src/lib/ai/provider.ts`) supporting `@github/copilot-sdk` (`CopilotClient`), Azure OpenAI REST API, and a rich deterministic fallback engine.
- **Testing**: Vitest / Node native test runner for unit & API integration tests + Playwright for full end-to-end browser verification across all routes and feature combinations.

---

## 2. Application Route Map

### 2.1 Public & Marketing Routes
| Route | Description |
|---|---|
| `/` | Interactive Landing Page with AI prompt bar, Hi-Fi/Wireframe mode switcher, templates preview, and feature showcase |
| `/playground` | Public & authenticated interactive multi-screen Infinite Canvas demo (`Fitness Mobile App` + live AI tools) |
| `/labs` | UX Pilot Labs hub linking to Gradient Generator and Dither Generator |
| `/labs/gradient-generator` | Real-time interactive Shader / Mesh / Halftone Gradient Generator with `Send to Canvas` |
| `/labs/dither-generator` | Real-time interactive Error-Diffusion & Ordered Bayer Dither Generator with `Send to Canvas` |
| `/plans` | Subscription Plans (`Free`, `Standard`, `Pro`, `Team`, `Enterprise`), Monthly/Yearly toggle, Currency switcher (`USD`/`EUR`/`GBP`), and Credit Calculator |
| `/templates` | Filterable UX/UI Framework & Multi-Screen Template Gallery with one-click `Use Template` |
| `/wireframe-generator` | Dedicated AI Wireframe Generator product workflow page |
| `/ui-design-generator` | Dedicated Hi-Fi UI Generator product workflow page |
| `/sign-in` | Sign-In page (Email/Password + SSO simulation + Demo quick-fill helper for local testing) |
| `/sign-up` | Invite-Only Registration page requiring a valid single-use `AccountInvitation` code |
| `/s/[slug]` | Live Published Website / Shared Prototype viewer (with optional password unlock & comments) |

### 2.2 Authenticated Workspace Routes (`/a/*`)
| Route | Minimum Role | Description |
|---|---|---|
| `/a/ui-list` | `Viewer` | Main Workspace Dashboard: AI Prompt Composer, Credit meter, All/Bookmarked/Shared Files tabs, Frameworks & Figma modals |
| `/a/ui-design` | `Viewer` (`Editor` to mutate) | Infinite Canvas Studio (`?page=<id>`): Multi-screen canvas, Global/Section/Screen prompts, 4-Look variations, Autoflow, Flowchart, Code export, Comments, Version History |
| `/a/folders` | `Viewer` (`Editor` to mutate) | Workstream / Folder detail view (`?folder=<id>`) with folder file management |
| `/a/ux-design-review` | `Viewer` (`Editor` to run new audit) | AI UX Heuristic Review & Predictive Eye-Tracking (`Attention Heatmap`, `Visual Scanpath`, `Gaze Flow`) |
| `/a/design-system` | `Viewer` (`Editor` to mutate) | Design Systems Hub: Token editor, React/Tailwind component catalog, `DESIGN.md` spec viewer |
| `/a/design-system/import` | `Editor` | 3-Source Design System Import Wizard (`GitHub Repo`, `Figma Library`, `Website URL`) |
| `/a/pr-review` | `Viewer` (`Editor` to trigger run) | GitHub Pull Request UI/UX Review automation, rules configuration, and PR compliance run reports |
| `/a/published-sites` | `Viewer` (`Editor` to publish) | Published Websites manager (`*.uxpilot.site` / `/s/[slug]`, password protection, analytics) |
| `/a/account` | `Viewer` | Account Settings (`Profile`, `Billing and Subscription`, `Access Token` for MCP integration) |
| `/a/admin` | `Admin` | Enterprise Governance Console: Single-use/Expiring Invitations, User Role & Revocation Manager, Audit Log Explorer, AI Provider Runtime Config |

---

## 3. REST API Specification (`/api/*`)

### 3.1 Authentication, Registration & Governance
- `POST /api/auth/[...nextauth]` — NextAuth credentials authentication.
- `GET /api/auth/register?code=UXP-...` — Validate an invitation code prior to registration (returns validity, expiration, assigned role, and optional locked email).
- `POST /api/auth/register` — Redeem a single-use, non-expired, non-revoked invitation code, create `User` + `PasswordCredential`, mark invitation redeemed, and record `AuditLog`.
- `GET /api/admin/invitations` (`Admin`) — List all invitations with status (`PENDING`, `REDEEMED`, `EXPIRED`, `REVOKED`).
- `POST /api/admin/invitations` (`Admin`) — Issue a new single-use invitation code with `email` (optional), `assignedRole` (`Admin` | `Editor` | `Viewer`), `expiresInHours`, and `note`.
- `PATCH /api/admin/invitations/[id]` (`Admin`) — Revoke an unredeemed invitation code (`action: "revoke"`).
- `GET /api/admin/users` (`Admin`) — List all users with role, status (`ACTIVE` | `REVOKED`), credit balance, and activity counts.
- `PATCH /api/admin/users/[id]` (`Admin`) — Change user role (`Admin` | `Editor` | `Viewer`) or revoke/restore user access (`status: "REVOKED" | "ACTIVE"`). Prevents self-revocation or removing the last active Admin.
- `GET /api/admin/audit-logs` (`Admin`) — Query immutable `AuditLog` entries with filtering by `action`, `actorEmail`, `targetType`, and search query.

### 3.2 Workspace Files, Folders (Workstreams), Canvas & Sharing
- `GET /api/workspace/bootstrap` — Returns consolidated workspace state for the authenticated user (`user`, `pages`, `workstreams`, `designSystems`, `publishedSites`, `mcpTokens`, `aiStatus`).
- `GET /api/pages` / `POST /api/pages` — List all accessible design pages or create a new page (optionally from a template or immediate AI generation prompt).
- `GET /api/pages/[id]` / `PATCH /api/pages/[id]` / `DELETE /api/pages/[id]` — Fetch full page with `groups`, `screens`, `flowcharts`, and `comments`; update page metadata/bookmark/folder/sharing; or delete page.
- `POST /api/workstreams` / `PATCH /api/workstreams/[id]` / `DELETE /api/workstreams/[id]` — Create, rename, or delete folders (`Workstream`).
- `POST /api/pages/[id]/screens` — Add or AI-generate screens (`wireframe`, `hifi`, `variation`, `autoflow`) inside a page.
- `PATCH /api/screens/[id]` / `DELETE /api/screens/[id]` — Update screen HTML/React code, title, coordinates, fidelity, or restore a version snapshot.
- `POST /api/pages/[id]/flowcharts` — Generate or update a Mermaid / node-graph flowchart on the canvas.
- `POST /api/pages/[id]/comments` / `PATCH /api/comments/[id]` — Pin a spatial comment on a canvas screen or resolve/reply to a comment thread.
- `POST /api/published-sites` / `PATCH /api/published-sites/[id]` / `DELETE /api/published-sites/[id]` — Publish, update, password-protect, or unpublish a design page at `/s/[slug]`.

### 3.3 Pluggable AI Generation & Analysis Endpoints
- `GET /api/ai/status` — Returns active AI provider (`copilot-sdk`, `azure-openai`, or `deterministic-fallback`), configured model, and health status.
- `POST /api/ai/enhance-prompt` — Expands a short user prompt into a comprehensive UX specification prompt (`Global`, `Section`, or `Screen` scope).
- `POST /api/ai/generate` — Generates 1–4 screens (`wireframe` or `hifi`), 4-Look variations, or connected userflow screens using the active `AIProvider` (respecting any selected `DesignSystem` tokens).
- `POST /api/ai/review` — Runs an AI UX Heuristic Review + generates **Attention Heatmap**, **Scanpath**, and **Gaze Flow** telemetry for a screen, persisting the `DesignReview` record.
- `POST /api/design-systems` / `POST /api/design-systems/import` — Creates or imports a Design System from GitHub, Figma, or Website URL using AI token/component extraction.
- `POST /api/pr-review/runs` — Executes an automated AI UI/UX & Design System compliance audit against a GitHub Pull Request and stores the `PrReviewRun`.
- `POST /api/account/mcp-tokens` / `DELETE /api/account/mcp-tokens/[id]` — Generates or revokes personal MCP API tokens (`uxp_mcp_...`).
- `POST /api/labs/send-to-canvas` — Saves a generated Gradient Shader or Dither asset from `/labs/*` directly into a target `DesignPage` as a ready-to-use hero screen or visual frame.

---

## 4. Pluggable AI Provider Architecture (`src/lib/ai/`)

```ts
export type AIProviderId = "copilot-sdk" | "azure-openai" | "deterministic";

export interface AIProvider {
  readonly id: AIProviderId;
  readonly modelName: string;
  enhancePrompt(input: EnhancePromptInput): Promise<EnhancePromptOutput>;
  generateScreens(input: GenerateScreensInput): Promise<GeneratedScreenPayload[]>;
  generateFlowchart(input: GenerateFlowchartInput): Promise<GeneratedFlowchartPayload>;
  evaluateScreenUx(input: EvaluateUxInput): Promise<UxReviewPayload>;
  extractDesignSystem(input: ExtractDesignSystemInput): Promise<ExtractedDesignSystemPayload>;
  auditPullRequest(input: AuditPrInput): Promise<PrAuditPayload>;
}
```

### Provider Resolution Order (`getAIProvider()`)
1. If `AI_PROVIDER=azure-openai` (or `AZURE_OPENAI_ENDPOINT` + `AZURE_OPENAI_API_KEY` are configured and selected), `AzureOpenAIProvider` is primary.
2. Otherwise, `CopilotSdkProvider` (`@github/copilot-sdk` `CopilotClient`) is primary.
3. Every call wraps the primary provider in a resilient executor (`executeWithFallback`) that automatically falls back to `DeterministicDesignProvider` if the external SDK/network call times out or lacks credentials, recording whether the response came from `copilot-sdk`, `azure-openai`, or `fallback` in the response metadata.
