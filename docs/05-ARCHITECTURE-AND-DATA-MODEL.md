# Architecture & Data Model — UX Pilot Studio

## 1. High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Browser Client (Desktop / Tablet / Mobile)            │
│  ┌──────────────────┐  ┌─────────────────────┐  ┌─────────────────────────┐  │
│  │ Public & Labs UI │  │ /a/* Workspace UI   │  │ Infinite Canvas Studio  │  │
│  │ /, /plans, /labs │  │ /a/ui-list, /review │  │ /a/ui-design, /playground│  │
│  │ /templates, /s/* │  │ /design-system, /pr │  │ Sandboxed Iframe Preview│  │
│  └────────┬─────────┘  └──────────┬──────────┘  └────────────┬────────────┘  │
└───────────┼───────────────────────┼──────────────────────────┼───────────────┘
            │                       │ HTTPS / JSON             │
            ▼                       ▼                          ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Next.js 16 App Router Server (`/api/*`)                  │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Auth & Governance Guard (`resolveSessionActor` + NextAuth JWT + DB)    │  │
│  │  • Role Enforcement (`Admin`, `Editor`, `Viewer`)                      │  │
│  │  • Live User Status Check (`ACTIVE` vs `REVOKED`)                      │  │
│  │  • Single-Use / Expiring `AccountInvitation` Verifier                  │  │
│  └──────────────────┬──────────────────────────────────┬──────────────────┘  │
│                     │                                  │                     │
│                     ▼                                  ▼                     │
│  ┌───────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ Domain Services & Audit Logger    │  │ Pluggable AI Orchestrator       │  │
│  │  • Pages, Groups, WireframeScreens│  │  1. `@github/copilot-sdk`       │  │
│  │  • DesignSystems, PublishedSites  │  │  2. Azure OpenAI REST Adapter   │  │
│  │  • UX Reviews (Heatmap/Scanpath)  │  │  3. Deterministic UX Fallback   │  │
│  │  • PR Reviews, MCP Tokens, Audits │  └─────────────────────────────────┘  │
│  └──────────────────┬────────────────┘                                       │
└─────────────────────┼────────────────────────────────────────────────────────┘
                      │ Prisma 7 Driver Adapter (`better-sqlite3` | `pg`)
                      ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│        Relational Database (SQLite `dev.db` Local / PostgreSQL Prod)         │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Relational Data Model (Prisma 7 Schema)

The database schema is identically modeled in `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL):

### 2.1 Identity, Invite-Only Access & Audit Governance
- **`User`**:
  - `id` (String, PK, CUID)
  - `email` (String, Unique)
  - `name` (String)
  - `role` (String: `"Admin"` | `"Editor"` | `"Viewer"`, default `"Editor"`)
  - `status` (String: `"ACTIVE"` | `"REVOKED"`, default `"ACTIVE"`)
  - `revokedAt` (DateTime?, nullable)
  - `revokedReason` (String?, nullable)
  - `planType` (String: `"free"` | `"standard"` | `"pro"` | `"team"` | `"enterprise"`, default `"pro"`)
  - `creditsRemaining` (Int, default `1500`)
  - `creditsTotal` (Int, default `1800`)
  - `onboardingCompleted` (Boolean, default `true`)
  - `createdAt`, `updatedAt`
- **`PasswordCredential`**:
  - `userId` (String, PK & FK -> `User.id` onDelete Cascade)
  - `passwordHash` (String, bcrypt)
  - `createdAt`, `updatedAt`
- **`AccountInvitation`**:
  - `id` (String, PK, CUID)
  - `code` (String, Unique, indexed — e.g. `UXP-2026-ALPHA9`)
  - `email` (String?, optional email lock)
  - `assignedRole` (String: `"Admin"` | `"Editor"` | `"Viewer"`, default `"Editor"`)
  - `note` (String?)
  - `expiresAt` (DateTime)
  - `redeemedAt` (DateTime?)
  - `revokedAt` (DateTime?)
  - `createdByUserId` (String?, FK -> `User.id`)
  - `redeemedByUserId` (String?, Unique, FK -> `User.id`)
  - `createdAt`, `updatedAt`
- **`AuditLog`**:
  - `id` (String, PK, CUID)
  - `actorUserId` (String?, FK -> `User.id`)
  - `actorEmail` (String?)
  - `actorRole` (String?)
  - `action` (String — e.g., `auth.register`, `auth.login`, `invite.create`, `invite.revoke`, `user.role_change`, `user.revoke`, `page.create`, `ai.generate`, `ai.review`, `site.publish`)
  - `targetType` (String)
  - `targetId` (String?)
  - `summary` (String)
  - `metadataJson` (String — JSON payload)
  - `createdAt` (DateTime, indexed)
- **`McpAccessToken`**:
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `name` (String)
  - `tokenPrefix` (String)
  - `tokenHash` (String)
  - `status` (String: `"ACTIVE"` | `"REVOKED"`)
  - `lastUsedAt` (DateTime?)
  - `createdAt` (DateTime)

### 2.2 Workspace, Folders, Infinite Canvas & Prototyping
- **`Workstream`** (Folders in Sidebar):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `name` (String)
  - `description` (String?)
  - `color` (String, default `"#7c3aed"`)
  - `createdAt`, `updatedAt`
- **`DesignPage`** (Design Files on `/a/ui-list` and `/a/ui-design`):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `workstreamId` (String?, FK -> `Workstream.id` onDelete SetNull)
  - `designSystemId` (String?, FK -> `DesignSystem.id` onDelete SetNull)
  - `name` (String)
  - `globalPrompt` (String?)
  - `platform` (String: `"mobile"` | `"desktop"`, default `"mobile"`)
  - `mode` (String: `"hifi"` | `"wireframe"`, default `"hifi"`)
  - `isBookmarked` (Boolean, default `false`)
  - `isShared` (Boolean, default `false`)
  - `sharedWithEmails` (String, default `"[]"`)
  - `createdAt`, `updatedAt`
- **`ScreenGroup`** (Sections on Infinite Canvas):
  - `id` (String, PK, CUID)
  - `pageId` (String, FK -> `DesignPage.id` onDelete Cascade)
  - `name` (String)
  - `sectionPrompt` (String?)
  - `orderIndex` (Int, default `0`)
  - `createdAt`, `updatedAt`
- **`WireframeScreen`** (Individual UI Screens on Canvas):
  - `id` (String, PK, CUID)
  - `pageId` (String, FK -> `DesignPage.id` onDelete Cascade)
  - `groupId` (String?, FK -> `ScreenGroup.id` onDelete SetNull)
  - `name` (String)
  - `screenPrompt` (String?)
  - `fidelity` (String: `"hifi"` | `"wireframe"`, default `"hifi"`)
  - `platform` (String: `"mobile"` | `"desktop"`, default `"mobile"`)
  - `htmlContent` (String — self-contained Tailwind HTML document)
  - `reactCode` (String — generated React TSX component code)
  - `x` (Int, default `80`)
  - `y` (Int, default `100`)
  - `width` (Int, default `390`)
  - `height` (Int, default `844`)
  - `linkedNextScreenId` (String? — for Autoflow connectors)
  - `versionHistoryJson` (String, default `"[]"` — array of prior HTML/title snapshots)
  - `createdAt`, `updatedAt`
- **`CanvasFlowchart`** (AI Userflow & Mermaid Diagrams on Canvas):
  - `id` (String, PK, CUID)
  - `pageId` (String, FK -> `DesignPage.id` onDelete Cascade)
  - `title` (String)
  - `prompt` (String?)
  - `mermaidCode` (String)
  - `nodesJson` (String — structured nodes & edges for visual canvas rendering)
  - `x` (Int, default `100`)
  - `y` (Int, default `1040`)
  - `createdAt`, `updatedAt`
- **`DesignComment`** (Spatial Canvas Comments):
  - `id` (String, PK, CUID)
  - `pageId` (String, FK -> `DesignPage.id` onDelete Cascade)
  - `screenId` (String?, FK -> `WireframeScreen.id` onDelete SetNull)
  - `authorId` (String, FK -> `User.id` onDelete Cascade)
  - `authorName` (String)
  - `body` (String)
  - `x` (Int, default `200`)
  - `y` (Int, default `200`)
  - `resolved` (Boolean, default `false`)
  - `repliesJson` (String, default `"[]"`)
  - `createdAt`, `updatedAt`

### 2.3 AI UX Review, Design Systems, PR Review & Published Sites
- **`DesignReview`** (`/a/ux-design-review` & Canvas Review Drawer):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `screenId` (String?, FK -> `WireframeScreen.id` onDelete SetNull)
  - `title` (String)
  - `reviewGoal` (String?)
  - `overallScore` (Int)
  - `metricsJson` (String — scores for Visual Hierarchy, Accessibility, Usability, Copy Clarity, Conversion)
  - `findingsJson` (String — list of heuristic findings with severity & fix suggestions)
  - `heatmapPointsJson` (String — normalized `[x, y, intensity, label]` hotspots)
  - `scanpathJson` (String — ordered `[step, x, y, dwellMs, label]` eye-tracking path)
  - `gazeFlowJson` (String — Area-of-Interest attention distribution)
  - `createdAt` (DateTime)
- **`DesignSystem`** (`/a/design-system`):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `name` (String)
  - `sourceType` (String: `"react"` | `"github"` | `"figma"` | `"website"`)
  - `sourceUrl` (String?)
  - `tokensJson` (String — colors, typography, spacing, radius, shadows)
  - `componentsJson` (String — catalog of reusable React + HTML components)
  - `designMd` (String — markdown documentation for AI agents & MCP)
  - `isShared` (Boolean, default `true`)
  - `createdAt`, `updatedAt`
- **`PrReviewRun`** (`/a/pr-review`):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `repoFullName` (String — e.g., `acme/fintech-web`)
  - `prNumber` (Int)
  - `prTitle` (String)
  - `branchName` (String)
  - `designSystemId` (String?)
  - `status` (String: `"PASSED"` | `"NEEDS_ATTENTION"` | `"CHANGES_REQUESTED"`)
  - `score` (Int)
  - `summary` (String)
  - `findingsJson` (String — file, line, rule, severity, suggestion)
  - `createdAt` (DateTime)
- **`PublishedSite`** (`/a/published-sites` & `/s/[slug]`):
  - `id` (String, PK, CUID)
  - `userId` (String, FK -> `User.id` onDelete Cascade)
  - `pageId` (String, FK -> `DesignPage.id` onDelete Cascade)
  - `slug` (String, Unique)
  - `title` (String)
  - `status` (String: `"PUBLISHED"` | `"PAUSED"`, default `"PUBLISHED"`)
  - `passwordHash` (String?)
  - `viewCount` (Int, default `0`)
  - `createdAt`, `updatedAt`
