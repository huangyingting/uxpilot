# Acceptance Criteria — UX Pilot Studio

## AC-1: Invite-Only Registration, Single-Use/Expiring Codes & CLI Bootstrap
- **AC-1.1**: Running `npm run bootstrap:admin` creates (or updates) the bootstrap `Admin` account and seeds initial invitation codes without exposing any HTTP `/api/bootstrap*` endpoint.
- **AC-1.2**: Attempting to register at `/sign-up` (`POST /api/auth/register`) without an invitation code, or with an unknown, expired (`expiresAt < now`), already redeemed (`redeemedAt != null`), or revoked (`revokedAt != null`) code returns `400`/`403` with a clear error message.
- **AC-1.3**: If an invitation code is locked to a specific email address, registering with a different email is rejected (`403`).
- **AC-1.4**: Redeeming a valid invitation code creates the user with the invitation's `assignedRole` (`Admin`, `Editor`, or `Viewer`), atomically marks the invitation `REDEEMED` so a second registration attempt with the same code fails, and logs `auth.register` in `AuditLog`.

## AC-2: Role-Based Access Control (`Admin`, `Editor`, `Viewer`), Revocation & Audit Logging
- **AC-2.1**: Only `Admin` users can access `/a/admin` and `/api/admin/*` endpoints (creating/revoking invitations, changing user roles, revoking/restoring user accounts, viewing audit logs). `Editor` and `Viewer` requests receive `403 Forbidden`.
- **AC-2.2**: `Viewer` users can browse `/a/ui-list`, open `/a/ui-design` in view-only mode (`"You're on view mode only."`), and inspect `/a/ux-design-review` and `/a/design-system`, but any mutation request (`POST`/`PATCH`/`DELETE` on pages, screens, folders, design systems, or published sites) is rejected with `403 Forbidden`.
- **AC-2.3**: When an `Admin` revokes a user (`status = "REVOKED"`), any subsequent API call by that user immediately fails with `403` and their sign-in is blocked until restored.
- **AC-2.4**: All security and workspace lifecycle actions appear in `/a/admin` under the **Audit Logs** tab with timestamp, actor email, role, action code, target, and summary.

## AC-3: Pluggable AI Capability (`@github/copilot-sdk` + Azure OpenAI + Deterministic Fallback)
- **AC-3.1**: The AI layer (`src/lib/ai/`) uses `@github/copilot-sdk` (`CopilotClient`) when `AI_PROVIDER=copilot-sdk` (default) and switches cleanly to Azure OpenAI when `AI_PROVIDER=azure-openai` (or when switched in the Admin AI configuration panel).
- **AC-3.2**: If external AI credentials or network endpoints are unavailable in local/CI environments, the AI layer transparently falls back to `DeterministicDesignProvider` so prompt enhancement, wireframe/hi-fi generation, 4-Look variations, flowchart generation, UX review, design system import, and PR review always succeed with realistic, context-aware output.

## AC-4: Authenticated Dashboard (`/a/ui-list`) & Folders (`/a/folders`)
- **AC-4.1**: `/a/ui-list` renders the personalized `START GENERATING, <NAME>` prompt composer with `Standard` / `Design Systems` mode selector, `Hi-Fi Designs` / `Wireframes` fidelity toggle, `Mobile` / `Desktop` platform toggle, `Prompt Enhancer`, and example prompts.
- **AC-4.2**: Submitting a prompt from `/a/ui-list` creates a new `DesignPage` with generated screens and navigates directly into `/a/ui-design?page=<id>`.
- **AC-4.3**: Users can filter files by `All Files`, `Bookmarked`, and `Shared Files`, search by title, sort files, star/bookmark files, create folders (`Workstream`), view folder contents at `/a/folders?folder=<id>`, and open the **Frameworks** and **Figma Plugin** sidebar modals.

## AC-5: Infinite Canvas Studio (`/a/ui-design` & `/playground`)
- **AC-5.1**: `/a/ui-design` and `/playground` render multi-screen groups on an interactive zoomable canvas (`25%`–`200%`) with sandboxed live HTML/Tailwind screen previews.
- **AC-5.2**: Selecting a screen on the canvas enables:
  - **Edit with AI** (screen-scoped prompt iteration + automatic version history snapshot)
  - **4-Look Variations** (generates aesthetic/theme variations on the canvas)
  - **Autoflow** (generates the next connected screen in the user flow with visual connector badge)
  - **Code Drawer** (live `HTML + Tailwind CSS` and `React TSX` code tabs + copy/download)
  - **Review Drawer** (AI UX score + interactive **Attention Heatmap**, **Visual Scanpath**, and **Gaze Flow** overlays)
  - **Version History** (view and restore previous versions of a screen)
- **AC-5.3**: Bottom dock tools support **Select**, **Add Screen**, **Flowchart** (AI Mermaid flowchart generator rendered on canvas), **Comment** (pinning and resolving spatial comments), and **Navigate**.

## AC-6: UX Design Review, Design Systems, PR Review, Published Sites, Account & Labs
- **AC-6.1**: `/a/ux-design-review` evaluates any workspace screen or custom HTML input and displays overall & category scores, heuristic findings, and interactive **Heatmap**, **Scanpath**, and **Gaze Flow** visual overlays.
- **AC-6.2**: `/a/design-system` and `/a/design-system/import` allow importing a Design System from `GitHub Repository`, `Figma Library`, or `Website URL`, inspecting color/typography tokens, previewing React/HTML components, and viewing `DESIGN.md`.
- **AC-6.3**: `/a/pr-review` runs automated UI/UX & Design System compliance checks on GitHub Pull Requests and displays detailed file/component findings.
- **AC-6.4**: `/a/published-sites` publishes any design page to `/s/[slug]`, where visitors can interact with the live multi-screen prototype.
- **AC-6.5**: `/a/account` provides `Profile`, `Billing and Subscription`, and `Access Token` (MCP API key generation & revocation) tabs.
- **AC-6.6**: `/labs/gradient-generator` and `/labs/dither-generator` render interactive HTML5 Canvas visuals with preset/algorithm controls, PNG/CSS export, and `Send to Canvas` into `/a/ui-design`.
- **AC-6.7**: All pages render responsively across Desktop (`1440×900`), Tablet (`768×1024`), and Mobile (`390×844`) viewports.
