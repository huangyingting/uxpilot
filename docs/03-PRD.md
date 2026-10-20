# Product Requirements Document (PRD) — UX Pilot Studio

## 1. Product Vision & Goals

**UX Pilot Studio** is an AI-native UX/UI design, prototyping, design-system, and usability review platform modeled after `https://uxpilot.ai` and enhanced with enterprise-grade invite-only access control, role-based permissions (`Admin`, `Editor`, `Viewer`), account/invite revocation, comprehensive audit logging, and a pluggable AI engine (`@github/copilot-sdk` and Azure OpenAI).

### Core Objectives
1. **Superfast UX-to-UI Generation**: Turn natural-language product prompts, PRDs, or existing design systems into low-fidelity wireframes, high-fidelity mobile/desktop screens, connected multi-screen flows, and Mermaid flowcharts in seconds.
2. **Infinite Canvas Collaboration & Code Handoff**: Organize screens into groups on a zoomable infinite canvas, iterate with Global/Section/Screen prompts or 4-Look variations, inspect/edit live HTML + Tailwind CSS and React code, export to Figma/React/HTML, and leave spatial comments.
3. **Predictive Eye-Tracking & AI UX Review**: Evaluate any screen for UX heuristics, WCAG accessibility, conversion friction, and visual hierarchy with interactive **Attention Heatmap**, **Scanpath**, and **Gaze Flow** overlays.
4. **Design Systems & GitHub PR Review**: Extract and manage tokenized React/HTML design systems (from GitHub, Figma, or Website URLs) and run automated UI/UX compliance reviews against GitHub Pull Requests.
5. **UX Pilot Labs**: Create custom mesh/halftone/aurora shaders and dithered artwork in `/labs` and send them directly into any canvas file.
6. **Zero-Trust Invite-Only Governance**: Restrict registration to single-use, expiring invitation codes issued by administrators, enforce RBAC across all UI and API surfaces, support instant revocation, and log all security-sensitive and operational events.

---

## 2. Target Personas

| Persona | Role in App | Primary Workflows |
|---|---|---|
| **Workspace Administrator** | `Admin` | Bootstrapped via CLI (`npm run bootstrap:admin`); issues/revokes single-use expiring invitation codes; manages user roles (`Admin`, `Editor`, `Viewer`) and account status; inspects immutable audit logs; configures AI provider (`Copilot SDK` vs `Azure OpenAI`). |
| **Product Designer / PM** | `Editor` | Creates workstreams (folders) and design files; generates wireframes, hi-fi screens, 4-Look variations, and autoflows on the infinite canvas; runs AI UX reviews and predictive heatmaps; builds shaders/dither assets in Labs; publishes live preview sites. |
| **Frontend Engineer** | `Editor` | Imports React/Tailwind design systems; exports clean HTML/React code and MCP access tokens; configures and runs GitHub PR UI/UX reviews. |
| **Stakeholder / Reviewer** | `Viewer` | Browses shared design files, published websites, UX review reports, and design systems in view-only mode; leaves review comments where permitted without modifying or deleting workspace assets. |

---

## 3. Functional Requirements by Pillar

### Pillar 1: Invite-Only Authentication, RBAC, Revocation & Audit Logging
- **FR-1.1 (CLI Bootstrap)**: Initial `Admin` account creation is exclusively performed via `npm run bootstrap:admin` (`scripts/bootstrap-admin.mjs`). No public HTTP bootstrap endpoint exists.
- **FR-1.2 (Invite-Only Registration)**: New users can register at `/sign-up` only by supplying a valid `AccountInvitation` code (`UXP-...`) that has not been redeemed, has not been revoked, and has not passed its `expiresAt` timestamp. If the invitation specifies a target email, registration must match that email.
- **FR-1.3 (Role-Based Access Control)**:
  - `Admin`: Full access to all workspace features + `/a/admin` governance console (Invitations, Users & Revocation, Audit Logs, AI Provider status).
  - `Editor`: Can create, edit, generate, review, export, and publish design files, folders, design systems, PR reviews, and Labs assets.
  - `Viewer`: Read-only access to workspace files, canvas (`"You're on view mode only."`), design systems, and reviews; cannot create/mutate/delete files or access admin endpoints (`403 Forbidden`).
- **FR-1.4 (Immediate Revocation)**: Admins can revoke unredeemed invitations and suspend/revoke user accounts (`status = "REVOKED"`). Revoked users are immediately blocked by API session resolution (`403`) even if their browser still holds a prior session token.
- **FR-1.5 (Audit Logging)**: Every login, registration, invitation creation/revocation/redemption, role change, user suspension/restoration, file creation/deletion, AI generation, design system import, and site publication writes a structured record to `AuditLog`.

### Pillar 2: Authenticated Dashboard (`/a/ui-list`) & Workstreams (`/a/folders`)
- **FR-2.1 (Hero AI Prompt Composer)**: Personalized greeting (`START GENERATING, <NAME>`), mode selector (`Standard` vs `Design Systems`), fidelity selector (`Hi-Fi Designs` vs `Wireframes`), platform selector (`Mobile 390×844` vs `Desktop 1440×900`), screen count (`1`–`4` screens), `Prompt Enhancer` button, and curated example prompts.
- **FR-2.2 (Files Grid & Tabs)**: Filter files by `All Files`, `Bookmarked`, and `Shared Files`; search by name; sort by `Most recent`, `Oldest`, or `Alphabetical (A-Z)`; toggle bookmark star; move files into folders; duplicate or delete files.
- **FR-2.3 (Sidebar & Modals)**: Collapsible navigation sidebar matching `uxpilot.ai` (`Design`, `Review`, `Design System`, `PR Review`, `Published websites`, `Frameworks` template library modal, `Figma Plugin` modal, `Folders` list with `+` Create Folder modal, `Recent` files, credit usage bar, and `Account Settings`).

### Pillar 3: Infinite Canvas Studio (`/a/ui-design` & `/playground`)
- **FR-3.1 (Infinite Canvas & Zoom/Pan)**: Interactive viewport with zoom controls (`25%`–`200%`, Fit to Screen), screen groups (`ScreenGroup`), and screen frames (`WireframeScreen`).
- **FR-3.2 (Three-Tier Prompting)**: Support `Global prompt` (page-level context), `Section prompt` (group-level flow generation), and `Screen prompt` (individual screen iteration), plus AI `Enhance Prompt`.
- **FR-3.3 (Screen Action Toolbar)**: Selecting a screen reveals actions:
  - `Edit with AI`: Refine layout, theme, or content via prompt.
  - `4-Look Variations`: Generate up to 4 distinct aesthetic/layout variations of the selected screen.
  - `Autoflow`: Generate connected next-step screens in the user journey with visual flow arrows.
  - `Switch Fidelity`: Convert Low-Fi Wireframe <-> Hi-Fi UI.
  - `Code`: Inspect/copy clean `HTML + Tailwind CSS` and `React (TSX)` component code, or download a project bundle.
  - `Review`: Open inline UX Review + Predictive Eye-Tracking (Heatmap / Scanpath / Gaze Flow) for that screen.
  - `Export to Figma`: Copy structured Figma plugin payload / SVG export.
- **FR-3.4 (Bottom Dock Tools)**: `Select`, `Add` (`New Screen`, `Flowchart`, `Sticky Note`), `Flowchart` (AI Mermaid userflow generator), `Comment` (pin spatial comments with resolve/reply threads), `Navigate` (hand pan), and `Version History` (restore previous screen snapshots).

### Pillar 4: AI UX Design Review & Predictive Eye-Tracking (`/a/ux-design-review`)
- **FR-4.1 (Screen Selection or Upload)**: Audit any existing workspace screen or paste/upload custom HTML/design snapshots with optional review goals (e.g., "Optimize checkout conversion and WCAG AA contrast").
- **FR-4.2 (Heuristic Breakdown)**: Score (`0–100`) across `Visual Hierarchy`, `Usability & Navigation`, `Accessibility (WCAG)`, `Copy & CTA Clarity`, and `Trust & Conversion`, with prioritized severity findings (`Critical`, `Warning`, `Pass`).
- **FR-4.3 (Predictive Eye-Tracking Overlays)**: Toggle between **Attention Heatmap** (thermal saliency map), **Visual Scanpath** (numbered fixation nodes `1 -> 2 -> 3 -> 4 -> 5` with saccade vectors), and **Gaze Flow** (Area-of-Interest attention distribution percentages).

### Pillar 5: Design Systems Hub (`/a/design-system` & `/a/design-system/import`)
- **FR-5.1 (Design System Registry)**: Create, inspect, and edit tokenized Design Systems containing color tokens, typography scales, border radii, shadows, and reusable React/Tailwind component definitions (`Button`, `Card`, `Input`, `Navbar`, `Modal`, `Badge`).
- **FR-5.2 (3-Source Import Wizard)**: Import design systems from `Code Repository (GitHub)`, `Figma Library`, or `Website URL`, automatically synthesizing `design-tokens.json`, `DESIGN.md` guidelines, and live component previews.
- **FR-5.3 (Design-System-Guided Generation)**: Select any imported Design System in the dashboard or canvas prompt bar so generated screens strictly adhere to its tokens and component styles.

### Pillar 6: GitHub PR UI/UX Review (`/a/pr-review`) & Published Websites (`/a/published-sites`)
- **FR-6.1 (GitHub PR Review)**: Connect repositories, configure UX review rules (Token compliance, WCAG contrast, responsive breakpoints, missing empty/loading states), trigger AI PR UI/UX audits, and inspect line-by-line/component findings.
- **FR-6.2 (Published Websites)**: Publish any design page or screen group to a shareable live slug (`/s/[slug]`), toggle password protection, view visit counters, and unpublish or update in one click.

### Pillar 7: UX Pilot Labs (`/labs`, `/labs/gradient-generator`, `/labs/dither-generator`)
- **FR-7.1 (Gradient Shader Generator)**: Real-time presets (`Prism`, `Aurora`, `Cyber Mesh`, `Solar Halftone`), aspect ratio selector (`16:9`, `1:1`, `9:16`), color stop pickers, animation/distortion sliders (`Speed`, `Scale`, `Swirl`, `Warp`, `Grain`, `Vignette`), `Randomize`, `Export PNG/CSS`, and `Send to Canvas`.
- **FR-7.2 (Dither Generator)**: Real-time pixel dithering (`Floyd-Steinberg`, `Atkinson`, `Bayer 4×4`, `Bayer 8×8`, `Halftone`), pixel size, threshold, contrast, brightness, palette modes (`Monochrome`, `Duotone`, `Terminal Green`, `Amber CRT`, `Custom`), `Export PNG`, and `Send to Canvas`.
