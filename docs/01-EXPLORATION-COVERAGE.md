# Exploration Coverage Report — UX Pilot (`https://uxpilot.ai`)

## 1. Executive Summary

Using Playwright (`chromium`, headless) and the session credentials in `.cred` (`ph-distinct-id: 0SKEkRkdWpOQOpcfdlQt3mUdLM92`, 40 cookies across `.uxpilot.ai` and `uxpilot.ai`), we conducted a systematic, multi-phase exploration of `https://uxpilot.ai`. We analyzed both its public marketing/product surfaces and its authenticated `/a/*` workspace application, interactive infinite canvas (`/playground` and `/a/ui-design`), UX Pilot Labs (`/labs/*`), client-side Next.js App Router bundles, and RTK Query API contracts against `https://stream.uxpilot.ai`.

In total, **36 structured screenshots** (`screenshots/01_*.png` through `screenshots/38_*.png`) and **5 JSON DOM/network telemetry reports** (`exploration/*.json`) were captured across **Desktop (`1440×900`)**, **Tablet (`768×1024`)**, and **Mobile (`390×844`)** viewports.

---

## 2. Discovered Architecture & Authentication Model

### 2.1 Frontend & Backend Services
- **Frontend Framework**: Next.js App Router (`app/[locale]/(main)/(dashboard)/a/...`) with Redux Toolkit + RTK Query (`96837-d33b94a4231c7cf3.js`, `8607-1107fd3d586af7d6.js`).
- **Core Backend Gateway**: `https://stream.uxpilot.ai` (REST + SSE endpoints for user profiles, pages, workstreams/folders, screen groups, wireframes, hi-fi generation, React sandboxes, design systems, PR review, and predictive eye-tracking).
- **Collaboration & Canvas**: `tldraw`-based infinite canvas with real-time WebSocket sync (`wss://collabaration.uxpilot.net`) and sandboxed dual-iframe preview/editor architecture (`data-uxp-canvas-view` and `data-uxp-canvas-editor` communicating via `uxp:canvas-mode` and `uxp:canvas-snapshot-request` `postMessage` channels).
- **Model Context Protocol (MCP)**: `https://mcp.uxpilot.net/mcp` authenticated via personal MCP API keys managed under `/a/account` (`Access Token` tab).
- **Authentication Providers**: Dual Firebase Auth (`identitytoolkit.googleapis.com`) and WorkOS Enterprise SSO (`workos_access_token`, `workos_server_session`, `auth_type: "workos"`, `UxpUserID`) hydrated via `AuthProvider` (`91302` in `5696-50d3be323d97d6be.js`).

---

## 3. Route & Feature Coverage Matrix

| # | Route / Surface | Category | Viewport(s) | Screenshot Artifact(s) | Observed Capabilities & UI States |
|---|---|---|---|---|---|
| 1 | `/` | Public Landing | `1440×900` | `01_landing_or_home.png` | Hero prompt bar (`Standard` / `Design Systems`), mode tabs (`Hi-Fi Designs`, `Wireframes`), platform toggle (`Mobile` / `Desktop`), example prompts, interactive feature tabs, pricing preview, FAQ. |
| 2 | `/a/ui-list` (Labs Modal + Invite Error) | Authenticated Dashboard | `1440×900` | `04_a_ui_list_labs_modal.png` | Initial promo modal ("GET CREATIVE WITH OUR NEW LABS TOOL") + Administrator invitations error/retry banner (`Invitations could not be loaded. Please retry.`). |
| 3 | `/a/ui-list` (Main Dashboard) | Authenticated Dashboard | `1440×900`, `768×1024`, `390×844` | `05_a_ui_list_dashboard_clean.png`, `34_mobile_a_ui_list.png`, `37_tablet_a_ui_list.png` | Left navigation sidebar, credit usage meter (`1500/1800`), "START GENERATING, ALEX" AI prompt composer, `UX Pilot Academy` & `Invite friends` cards, `FILES` grid (`All Files`, `Bookmarked`, `Shared Files`), sort order, `Create New` & `New File` cards. |
| 4 | `/a/ui-list` (`Bookmarked` & `Shared Files` tabs) | Authenticated Dashboard | `1440×900` | `06_a_ui_list_bookmarked_tab.png`, `07_a_ui_list_shared_files_tab.png` | Filtered file grid showing bookmarked files (`Fintech Mobile Banking`, `Healthcare Patient Portal`) and shared files (`Enterprise Checkout Redesign`). |
| 5 | `/a/ui-list` -> `Frameworks` Modal | Sidebar Modal | `1440×900` | `08_a_sidebar_frameworks_modal.png` | Template & UX Frameworks modal (`Create Custom`, category filters, multi-screen flow templates). |
| 6 | `/a/ui-list` -> `Figma Plugin` Modal | Sidebar Modal | `1440×900` | `09_a_sidebar_figma_plugin_modal.png` | Bidirectional Figma plugin integration guide & launch modal (`Import from Figma`, `Export to Figma`). |
| 7 | `/a/folders?folder=ws-1` | Workstreams / Folders | `1440×900` | `10_a_folders.png` | Workstream folder detail view (`Q2 Product Design`), inline description, folder action menu, and scoped file cards. |
| 8 | `/a/ux-design-review` | AI UX Review & Eye-Tracking | `1440×900` | `11_a_ux_design_review.png` | Standalone AI UX Design Review workspace (`Choose from existing designs` vs `Upload an image`, custom review context/goals, saved review history, heuristic scoring, predictive attention heatmap & scanpath). |
| 9 | `/a/design-system` | Design Systems Hub | `1440×900`, `390×844` | `12_a_design_system.png`, `35_mobile_a_design_system.png` | Design System management (`New Design System`, `Import from Figma`, React component systems vs legacy HTML collections, token & component editor). |
| 10 | `/a/design-system/import` | Design System Import Wizard | `1440×900` | `13_a_design_system_import.png` | 3-source import wizard: `Code Repository` (GitHub/Storybook), `Figma Library`, and `Website URL` token/component extractor. |
| 11 | `/a/pr-review` | GitHub PR UI/UX Review | `1440×900` | `14_a_pr_review.png` | Automated GitHub Pull Request UI/UX review dashboard (`Connect GitHub`, repository selector, review rules, design system adherence checks, PR run logs). |
| 12 | `/a/published-sites` | Published Websites | `1440×900` | `15_a_published_sites.png` | Published sites manager (`*.uxpilot.site` slug management, live status, unpublish/update controls). |
| 13 | `/a/account` | Account, Billing & MCP Keys | `1440×900` | `18_a_account.png` | 3-tab Account Settings: `Profile` (Full Name, Email, Google Link, Password, Delete Account), `Billing and Subscription` (Plan status, credit packs, invoices), and `Access Token` (Personal MCP API keys for Cursor/Claude Code). |
| 14 | `/a/ui-design?page=page-1` | Authenticated Canvas Studio | `1440×900` | `19_a_ui_design_canvas.png` | Infinite canvas workspace for a design file with top bar (`Fintech Mobile Banking`, `Design` mode selector, `Share`, credits badge, zoom `44%`), canvas frames, and view-only/edit mode state. |
| 15 | `/playground` | Interactive Demo Canvas | `1440×900` | `03_app_route_2.png`, `22_playground_canvas_overview.png` | Multi-screen interactive canvas (`Fitness Mobile App`) showing `Global prompt`, `Section prompt`, and `Screen prompt` overlays, plus bottom dock (`Select`, `Add`, `Flowchart`, `Comment`, `Navigate`, `Version history`). |
| 16 | `/labs` | UX Pilot Labs Hub | `1440×900` | `03_app_route_5.png`, `25_labs_hub.png` | Creative shader & visual effects hub ("BUILT IN THE LAB, READY FOR REAL INTERFACES") featuring `Gradient Generator` and `Dither Generator`. |
| 17 | `/labs/gradient-generator` | Labs Gradient Generator | `1440×900`, `390×844` | `26_labs_gradient_generator.png`, `36_mobile_labs_gradient.png` | Interactive WebGL/Canvas shader generator with `Preset` (`Prism`, `Aurora`, `Mesh`, `Halftone`), `Aspect Ratio` (`16:9`, `1:1`, `9:16`), color stops, speed/scale/swirl/warp sliders, grain/vignette, and `Export` (`PNG`, `SVG`, `CSS`, `Send to Canvas`). |
| 18 | `/labs/dither-generator` | Labs Dither Generator | `1440×900` | `27_labs_dither_generator.png` | Interactive image dithering tool (`Floyd-Steinberg`, `Atkinson`, `Bayer 4×4`, `Bayer 8×8`, `Halftone`), pixel scale, threshold, contrast, brightness, monochrome/duotone/custom palette, and PNG/SVG export. |
| 19 | `/plans` | Plans & Pricing | `1440×900`, `768×1024` | `03_app_route_4.png`, `38_tablet_plans.png` | Billing cadence toggle (`Monthly` / `Yearly`), currency selector (`USD`/`EUR`/`GBP`), `Free`, `Standard`, `Pro`, `Team`, and `Enterprise` tiers, credit estimator, and feature comparison table. |
| 20 | `/templates` | Public Templates Gallery | `1440×900` | `28_public_templates.png` | Community and official multi-screen UX templates with category filtering and one-click remix into canvas. |
| 21 | `/wireframe-generator` & `/ui-design-generator` | Feature Landing Pages | `1440×900` | `29_public_wireframe_generator.png`, `30_public_ui_design_generator.png` | Deep-dive product workflows for wireframe generation, hi-fi generation, predictive heatmaps, and code export. |
| 22 | `/sign-in` & `/sign-up` | Authentication Flows | `1440×900` | `31_public_sign_in.png`, `32_public_sign_up.png` | Google OAuth, WorkOS Enterprise SSO, and Email/Password authentication forms with validation states. |
| 23 | `/non-existent-route-404-check` | Error / 404 State | `1440×900` | `33_public_404_error.png` | Branded 404 Not Found recovery page with navigation back to workspace. |

---

## 4. Complete Backend API Catalog Discovered (`83111` & `8607`)

From reverse-engineering `83111-14b91d8d6283c08a.js` (`65427`) and `8607-1107fd3d586af7d6.js`, UX Pilot's backend exposes the following functional domains:

1. **Workspace, Pages & Workstreams (Folders)**
   - `GET /crud/getPages`, `GET /crud/getPage/v3/:id`, `POST /crud/createPage`, `POST /crud/updatePage-v2`, `POST /crud/togglePageBookmark`, `DELETE /crud/deletePage`
   - `GET /crud/getWorkstreams`, `POST /crud/createWorkstream`, `PUT /crud/updateWorkstream`, `DELETE /crud/deleteWorkstream`
   - `GET /crud/getGroups`, `POST /crud/createGroup`, `PUT /crud/updateGroup-v2`, `DELETE /crud/deleteGroup-v2`
2. **AI Screen & Flow Generation**
   - `POST /generate-wireframes-v3` (Low-fidelity wireframe generation)
   - `POST /generate-ui-v4` (High-fidelity Tailwind/HTML UI generation)
   - `POST /generate-by-flow` (Multi-screen connected userflow generation)
   - `POST /generate-variations` (4-Look parallel visual variations)
   - `POST /prompt-enhancer`, `POST /enhance-pageprompt`, `POST /enhance-wireprompt` (AI prompt expansion)
   - `POST /flowchart/generate`, `POST /flowchart/generate-mermaid` (AI userflow & architecture flowcharts)
3. **Live Prototypes, Code Export & Figma Handoff**
   - `POST /generate-html-prototype` (Interactive linked prototype)
   - `POST /generate-html-to-react` (Convert HTML screen to multi-file React + Tailwind project)
   - `GET /sandboxes/by-wireframe/:id/export-zip` (Download React project bundle)
   - `POST /generate-figma-code`, `POST /generate-fig-file`, `POST /figma/import` (Bidirectional Figma integration)
4. **AI UX Design Review & Predictive Eye-Tracking**
   - `POST /evaluate-html` (AI UX heuristic audit: usability, accessibility, visual hierarchy, copy clarity)
   - `POST /heatmap` (Predictive visual attention heatmap overlay)
   - `POST /scanpath` (Predictive eye-tracking fixation sequence `1 -> 2 -> 3 -> 4`)
   - `POST /gaze-flow` (Attention distribution across screen zones)
5. **Design Systems Hub**
   - `GET /design-assets/collections/:uid`, `POST /design-assets/collections/:uid`
   - `POST /design-system/import/github`, `POST /design-system/import/website`, `POST /design-system/import/upload`
   - `GET /api/design-systems/by-name/:name/design-tokens`, `GET /api/design-systems/by-name/:name/design-md`
6. **GitHub PR UI/UX Review**
   - `GET /github/connection-status`, `GET /github/repos`, `GET /pr-review/rules`, `GET /pr-review/runs`
7. **Collaboration, Comments & Published Websites**
   - `POST /sharing/generate`, `GET /sharing/shared-pages`, `PUT /sharing/direct-share`
   - `GET /api/comments/:pageId`, `POST /api/comments/:pageId`
   - `GET /sites/user`, `POST /sites/publish`

---

## 5. Observed Edge Cases & Error States

1. **Administrator & Team Invitations Failure Banner**: When `/enterprise-admin-invitations` or `/team/invitations/email/check` fails or returns an unexpected cursor structure, `/a/ui-list` displays a non-blocking floating card (`Administrator invitations — Invitations could not be loaded. Please retry. [Check invitations again]`).
2. **Canvas View-Only vs Owner Edit Mode**: When a user opens `/a/ui-design?page=...` where `page.uid !== currentUser.uid` and edit permission is absent, the bottom dock switches to `"You're on view mode only."` and disables destructive screen mutations.
3. **Preview Sandbox Timeout / Recovery**: The dual-iframe canvas (`67344`) enforces a 10-second handshake timeout for `uxp:canvas-dom-ready` / `uxp:canvas-ready`; if a generated screen's script stalls, an inline recovery button (`"Preview could not load. Retry"`) is rendered inside the frame header.
4. **Legacy HTML vs React Design Systems**: `/a/design-system` explicitly distinguishes between older HTML token collections and React component design systems, offering guided migration or new React system creation.
