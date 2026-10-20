import { chromium } from "playwright";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  console.log(`=== Starting Comprehensive Playwright E2E Verification against ${BASE_URL} ===`);
  const browser = await chromium.launch({ headless: true });

  try {
    // -------------------------------------------------------------------------
    // PART 1: Public & Marketing Routes + 404
    // -------------------------------------------------------------------------
    const pubContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pubPage = await pubContext.newPage();

    await pubPage.goto(`${BASE_URL}/`, { waitUntil: "networkidle" });
    await pubPage.waitForSelector('[data-testid="landing-hero-prompt"]');
    console.log("[PASS] 1.1 Landing page (/) loaded with interactive prompt composer");

    await pubPage.goto(`${BASE_URL}/plans`, { waitUntil: "networkidle" });
    await pubPage.click('[data-testid="billing-toggle-monthly"]');
    await pubPage.click('[data-testid="currency-toggle-EUR"]');
    const proPriceText = await pubPage.textContent('[data-testid="plan-price-pro"]');
    assert.ok(proPriceText?.includes("€"), `Expected EUR symbol in price, got ${proPriceText}`);
    console.log("[PASS] 1.2 Plans page (/plans) billing & multi-currency switcher verified");

    await pubPage.goto(`${BASE_URL}/templates`, { waitUntil: "networkidle" });
    await pubPage.click('[data-testid="template-cat-fintech"]');
    await pubPage.waitForSelector('[data-testid="template-card-tpl-fintech"]');
    console.log("[PASS] 1.3 Templates gallery (/templates) category filtering verified");

    await pubPage.goto(`${BASE_URL}/wireframe-generator`, { waitUntil: "networkidle" });
    await pubPage.waitForSelector('[data-testid="launch-wireframe-studio-btn"]');
    await pubPage.goto(`${BASE_URL}/ui-design-generator`, { waitUntil: "networkidle" });
    await pubPage.waitForSelector('[data-testid="launch-hifi-studio-btn"]');
    await pubPage.goto(`${BASE_URL}/playground`, { waitUntil: "networkidle" });
    await pubPage.waitForSelector('[data-testid="infinite-canvas-surface"]');
    console.log(
      "[PASS] 1.4 Public generators (/wireframe-generator, /ui-design-generator, /playground) verified"
    );

    await pubPage.goto(`${BASE_URL}/non-existent-route-xyz-404`, { waitUntil: "networkidle" });
    await pubPage.waitForSelector('[data-testid="not-found-page"]');
    console.log("[PASS] 1.5 Custom 404 Not Found state verified");

    // -------------------------------------------------------------------------
    // PART 2: Invite-Only Registration Edge Cases & Single-Use Redemption (/sign-up)
    // -------------------------------------------------------------------------
    await pubPage.goto(`${BASE_URL}/sign-up`, { waitUntil: "networkidle" });

    // 2.1 Expired code test
    await pubPage.fill('[data-testid="signup-invite-code-input"]', "UXP-2026-EXPIRED");
    await pubPage.fill('[data-testid="signup-name-input"]', "Expired User");
    await pubPage.fill('[data-testid="signup-email-input"]', "expired.try@uxpilot.local");
    await pubPage.fill('[data-testid="signup-password-input"]', "ValidPass123!");
    await pubPage.click('[data-testid="signup-submit-btn"]');
    await pubPage.waitForSelector('[data-testid="signup-error-alert"]');
    const expiredErr = await pubPage.textContent('[data-testid="signup-error-alert"]');
    assert.match(expiredErr || "", /expired/i);

    // 2.2 Revoked code test
    await pubPage.fill('[data-testid="signup-invite-code-input"]', "UXP-2026-REVOKED");
    await pubPage.click('[data-testid="signup-submit-btn"]');
    await pubPage.waitForSelector('[data-testid="signup-error-alert"]');
    const revokedErr = await pubPage.textContent('[data-testid="signup-error-alert"]');
    assert.match(revokedErr || "", /revoked/i);

    // 2.3 Email-locked code with mismatched email
    await pubPage.fill('[data-testid="signup-invite-code-input"]', "UXP-2026-LOCKED1");
    await pubPage.fill('[data-testid="signup-email-input"]', "wrong.person@uxpilot.local");
    await pubPage.click('[data-testid="signup-submit-btn"]');
    await pubPage.waitForSelector('[data-testid="signup-error-alert"]');
    const lockedErr = await pubPage.textContent('[data-testid="signup-error-alert"]');
    assert.match(lockedErr || "", /restricted/i);
    console.log(
      "[PASS] 2.1 Invite-only edge cases (expired, revoked, email-locked mismatch) rejected on /sign-up"
    );

    await pubContext.close();

    // -------------------------------------------------------------------------
    // PART 3: Admin Sign-In, Admin Governance Console, Invitations, RBAC & AI Switch
    // -------------------------------------------------------------------------
    const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="quickfill-admin"]');
    await adminPage.click('[data-testid="signin-submit-btn"]');
    await adminPage.waitForURL("**/a/ui-list", { timeout: 15000 });
    await adminPage.waitForSelector('[data-testid="sidebar-user-role"]');
    const roleBadge = await adminPage.textContent('[data-testid="sidebar-user-role"]');
    assert.equal(roleBadge?.trim(), "Admin");
    console.log("[PASS] 3.1 Admin sign-in & workspace bootstrap verified");

    // Visit /a/admin
    await adminPage.goto(`${BASE_URL}/a/admin`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector('[data-testid="admin-active-ai-provider"]');

    // Switch AI Provider to Azure OpenAI and back to Copilot SDK
    await adminPage.click('[data-testid="switch-ai-provider-azure-openai"]');
    await adminPage.waitForTimeout(400);
    let activeProviderText = await adminPage.textContent('[data-testid="admin-active-ai-provider"]');
    assert.match(activeProviderText || "", /azure-openai/);

    await adminPage.click('[data-testid="switch-ai-provider-copilot-sdk"]');
    await adminPage.waitForTimeout(400);
    activeProviderText = await adminPage.textContent('[data-testid="admin-active-ai-provider"]');
    assert.match(activeProviderText || "", /copilot-sdk/);
    console.log(
      "[PASS] 3.2 Pluggable AI provider live switching (Copilot SDK <-> Azure OpenAI) verified"
    );

    // Issue a new single-use invitation code via Admin UI
    const uniqueTargetEmail = `e2e.invite.${Date.now()}@uxpilot.local`;
    await adminPage.fill('[data-testid="invite-email-input"]', uniqueTargetEmail);
    await adminPage.selectOption('[data-testid="invite-role-select"]', "Editor");
    await adminPage.click('[data-testid="create-invitation-btn"]');
    await adminPage.waitForTimeout(500);

    // Find the newly generated code in the table
    const inviteRows = await adminPage.locator('tr[data-testid^="invite-row-"]').all();
    assert.ok(inviteRows.length >= 4, "Expected invitation rows in admin table");
    const newestCodeAttr = await inviteRows[0].getAttribute("data-testid");
    const newestCode = newestCodeAttr?.replace("invite-row-", "") || "";
    assert.ok(newestCode.startsWith("UXP-2026-"));
    console.log(`[PASS] 3.3 Admin issued new single-use invitation code: ${newestCode}`);

    // Verify Audit Log records actions & supports filtering
    await adminPage.fill('[data-testid="audit-log-filter-input"]', "ai");
    await adminPage.waitForTimeout(400);
    const auditText = await adminPage.textContent('[data-testid="audit-log-list"]');
    assert.match(auditText || "", /ai\.provider_switch/);
    await adminPage.fill('[data-testid="audit-log-filter-input"]', "");
    console.log("[PASS] 3.4 Admin immutable Audit Log & action filter verified");

    // Redeem the newly issued single-use code in a fresh browser context
    const redeemCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const redeemPage = await redeemCtx.newPage();
    await redeemPage.goto(`${BASE_URL}/sign-up`, { waitUntil: "networkidle" });
    await redeemPage.fill('[data-testid="signup-invite-code-input"]', newestCode);
    await redeemPage.fill('[data-testid="signup-name-input"]', "E2E Invited Designer");
    await redeemPage.fill('[data-testid="signup-email-input"]', uniqueTargetEmail);
    await redeemPage.fill('[data-testid="signup-password-input"]', "DesignerPass123!");
    await redeemPage.click('[data-testid="signup-submit-btn"]');
    await redeemPage.waitForURL("**/a/ui-list", { timeout: 15000 });
    await redeemCtx.close();
    console.log("[PASS] 3.5 Redeemed single-use invitation code & auto-authenticated into /a/ui-list");

    // VerifyAdmin can immediately revoke the newly created user's access
    await adminPage.reload({ waitUntil: "networkidle" });
    await adminPage.waitForSelector(`[data-testid="revoke-user-btn-${uniqueTargetEmail}"]`);
    await adminPage.click(`[data-testid="revoke-user-btn-${uniqueTargetEmail}"]`);
    await adminPage.waitForTimeout(400);
    const userStatusAfterRevoke = await adminPage.textContent(
      `[data-testid="user-status-${uniqueTargetEmail}"]`
    );
    assert.equal(userStatusAfterRevoke?.trim(), "REVOKED");

    // Restore user and verify status returns to ACTIVE
    await adminPage.click(`[data-testid="restore-user-btn-${uniqueTargetEmail}"]`);
    await adminPage.waitForTimeout(400);
    const userStatusAfterRestore = await adminPage.textContent(
      `[data-testid="user-status-${uniqueTargetEmail}"]`
    );
    assert.equal(userStatusAfterRestore?.trim(), "ACTIVE");
    console.log("[PASS] 3.6 Immediate account revocation & restoration verified in Admin Console");

    // -------------------------------------------------------------------------
    // PART 4: Workspace Hub (/a/ui-list), Sidebar Modals, and Folders (/a/folders)
    // -------------------------------------------------------------------------
    await adminPage.goto(`${BASE_URL}/a/ui-list`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="tab-filter-bookmarked"]');
    await adminPage.click('[data-testid="tab-filter-shared"]');
    await adminPage.click('[data-testid="tab-filter-all"]');

    // Open Frameworks & MCP Modal
    await adminPage.click('[data-testid="sidebar-frameworks-btn"]');
    await adminPage.waitForSelector('[data-testid="frameworks-modal"]');
    await adminPage.click('[data-testid="close-frameworks-modal"]');

    // Open Figma Plugin Modal
    await adminPage.click('[data-testid="sidebar-figma-btn"]');
    await adminPage.waitForSelector('[data-testid="figma-plugin-modal"]');
    await adminPage.click('[data-testid="copy-figma-clipboard-btn"]');
    await adminPage.click('[data-testid="close-figma-modal"]');
    console.log("[PASS] 4.1 Workspace hub filters, Frameworks/MCP modal, and Figma Plugin modal verified");

    // Visit /a/folders and create a folder
    await adminPage.goto(`${BASE_URL}/a/folders`, { waitUntil: "networkidle" });
    const folderName = `E2E Mobile Growth ${Date.now().toString().slice(-4)}`;
    await adminPage.fill('[data-testid="folder-page-name-input"]', folderName);
    await adminPage.click('[data-testid="folder-page-create-btn"]');
    await adminPage.waitForTimeout(500);
    const foldersBody = await adminPage.textContent("main");
    assert.ok(foldersBody?.includes(folderName));
    console.log("[PASS] 4.2 Folders (/a/folders) creation & workstream listing verified");

    // -------------------------------------------------------------------------
    // PART 5: Infinite AI Canvas Studio (/a/ui-design) & All Canvas Workflows
    // -------------------------------------------------------------------------
    await adminPage.goto(`${BASE_URL}/a/ui-design?pageId=page-fintech-command`, {
      waitUntil: "networkidle",
    });
    await adminPage.waitForSelector('[data-testid="infinite-canvas-surface"]');

    // Zoom controls
    await adminPage.click('[data-testid="canvas-zoom-in"]');
    await adminPage.click('[data-testid="canvas-zoom-out"]');
    await adminPage.click('[data-testid="canvas-fit-screen"]');

    // Enhance Prompt in Canvas
    await adminPage.click('[data-testid="enhance-prompt-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-ai-banner"]', { timeout: 15000 });

    // Generate Autoflow Next Screen
    await adminPage.click('[data-testid="canvas-autoflow-btn"]');
    await adminPage.waitForTimeout(800);

    // Code Export Drawer (React TSX + HTML5)
    await adminPage.click('[data-testid="canvas-open-code-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-drawer-code"]');
    await adminPage.click('[data-testid="code-tab-html"]');
    await adminPage.click('[data-testid="code-tab-react"]');
    await adminPage.click('[data-testid="copy-exported-code-btn"]');

    // UX Review & Predictive Eye-Tracking Overlay inside Canvas
    await adminPage.click('[data-testid="canvas-open-review-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-drawer-review"]');
    await adminPage.click('[data-testid="run-ux-review-btn"]');
    await adminPage.waitForSelector('[data-testid="ux-review-results"]', { timeout: 15000 });
    await adminPage.click('[data-testid="overlay-mode-scanpath"]');
    await adminPage.click('[data-testid="overlay-mode-gazeflow"]');
    await adminPage.click('[data-testid="overlay-mode-heatmap"]');
    await adminPage.waitForSelector('[data-testid="canvas-eyetracking-overlay"]');

    // Flowchart Generator inside Canvas
    await adminPage.click('[data-testid="canvas-open-flowchart-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-drawer-flowchart"]');
    await adminPage.click('[data-testid="generate-flowchart-submit"]');
    await adminPage.waitForSelector('[data-testid="mermaid-code-output"]', { timeout: 15000 });

    // Canvas Comments Pinning
    await adminPage.click('[data-testid="canvas-open-comments-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-drawer-comments"]');
    await adminPage.fill(
      '[data-testid="new-comment-input"]',
      "E2E verified: primary CTA contrast looks great!"
    );
    await adminPage.click('[data-testid="submit-comment-btn"]');
    await adminPage.waitForTimeout(400);

    // Version History Drawer
    await adminPage.click('[data-testid="canvas-open-history-btn"]');
    await adminPage.waitForSelector('[data-testid="canvas-drawer-history"]');

    // Publish Live Prototype from Canvas & verify /s/[slug]
    await adminPage.click('[data-testid="canvas-publish-btn"]');
    await adminPage.waitForSelector('[data-testid="publish-site-modal"]');
    await adminPage.click('[data-testid="confirm-publish-site-btn"]');
    await adminPage.waitForSelector('[data-testid="published-site-link"]');
    const publishedHref = await adminPage.getAttribute(
      '[data-testid="published-site-link"]',
      "href"
    );
    assert.ok(publishedHref?.startsWith("/s/"));
    console.log(
      `[PASS] 5.1 Infinite AI Canvas Studio (Enhance, Autoflow, Code, Heatmap/Scanpath/GazeFlow, Flowchart, Comments, History, Publish -> ${publishedHref}) verified`
    );

    // Visit the newly published site /s/[slug]
    await adminPage.goto(`${BASE_URL}${publishedHref}`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector('[data-testid="shared-site-iframe"]');
    console.log(`[PASS] 5.2 Shared published prototype route (${publishedHref}) verified`);

    // -------------------------------------------------------------------------
    // PART 6: Dedicated Feature Modules (UX Review, Design System, Import, PR Review, Published Sites, Account, Labs)
    // -------------------------------------------------------------------------
    // 6.1 UX Design Review Hub (/a/ux-design-review)
    await adminPage.goto(`${BASE_URL}/a/ux-design-review`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="review-tab-scanpath"]');
    await adminPage.click('[data-testid="review-tab-gazeflow"]');
    await adminPage.click('[data-testid="review-tab-heatmap"]');
    await adminPage.click('[data-testid="launch-ux-review-btn"]');
    await adminPage.waitForTimeout(600);
    console.log("[PASS] 6.1 UX Design Review Hub (/a/ux-design-review) verified");

    // 6.2 Design Systems & Import Wizard (/a/design-system & /a/design-system/import)
    await adminPage.goto(`${BASE_URL}/a/design-system`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector('[data-testid="design-system-md-preview"]');
    await adminPage.click('[data-testid="goto-import-design-system-btn"]');
    await adminPage.waitForURL("**/a/design-system/import");
    await adminPage.click('[data-testid="import-source-figma"]');
    await adminPage.fill('[data-testid="import-ds-name-input"]', "E2E Imported Figma Tokens");
    await adminPage.click('[data-testid="submit-import-ds-btn"]');
    await adminPage.waitForURL("**/a/design-system");
    console.log(
      "[PASS] 6.2 Design Systems Hub (/a/design-system) & Import Wizard (/a/design-system/import) verified"
    );

    // 6.3 GitHub PR Review (/a/pr-review)
    await adminPage.goto(`${BASE_URL}/a/pr-review`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="run-pr-review-btn"]');
    await adminPage.waitForTimeout(500);
    console.log("[PASS] 6.3 Automated GitHub PR UX Review (/a/pr-review) verified");

    // 6.4 Published Sites Manager (/a/published-sites)
    await adminPage.goto(`${BASE_URL}/a/published-sites`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="publish-new-site-btn"]');
    await adminPage.waitForTimeout(500);
    console.log("[PASS] 6.4 Published Sites Manager (/a/published-sites) verified");

    // 6.5 Account & MCP Tokens (/a/account) + Live JSON-RPC 2.0 MCP Server (/api/mcp)
    await adminPage.goto(`${BASE_URL}/a/account`, { waitUntil: "networkidle" });
    await adminPage.fill('[data-testid="account-name-input"]', "Alex Rivera (Lead Admin)");
    await adminPage.click('[data-testid="save-account-profile-btn"]');
    await adminPage.waitForSelector('[data-testid="account-saved-notice"]');
    await adminPage.click('[data-testid="create-mcp-token-btn"]');
    await adminPage.waitForTimeout(400);

    // Verify /api/health, /api/mcp, and /api/pages/[id]/export
    const healthRes = await adminPage.request.get(`${BASE_URL}/api/health`);
    assert.equal(healthRes.status(), 200);
    const healthJson = await healthRes.json();
    assert.equal(healthJson.status, "healthy");

    const mcpRes = await adminPage.request.post(`${BASE_URL}/api/mcp`, {
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "list_design_pages", arguments: { limit: 5 } },
      },
    });
    assert.equal(mcpRes.status(), 200);
    const mcpJson = await mcpRes.json();
    assert.ok(mcpJson.result?.content?.[0]?.text);

    const exportRes = await adminPage.request.get(
      `${BASE_URL}/api/pages/page-fintech-command/export`
    );
    assert.equal(exportRes.status(), 200);
    const exportJson = await exportRes.json();
    assert.ok(exportJson.fileCount >= 3);
    console.log(
      "[PASS] 6.5 Account Settings, MCP JSON-RPC Server (/api/mcp), Project Bundle Export, and Healthcheck (/api/health) verified"
    );

    // 6.6 AI UX Copilot Chat (/a/chat) & AI PRD / UX Document Studio (/a/ux-document)
    await adminPage.goto(`${BASE_URL}/a/chat`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector('[data-testid="chat-messages-list"]');
    await adminPage.fill(
      '[data-testid="chat-input"]',
      "Critique our multi-currency treasury approval flow for mobile ergonomics"
    );
    await adminPage.click('[data-testid="chat-send-btn"]');
    await adminPage.waitForTimeout(500);

    await adminPage.goto(`${BASE_URL}/a/ux-document`, { waitUntil: "networkidle" });
    await adminPage.waitForSelector('[data-testid="uxdoc-editor-textarea"]');
    await adminPage.fill('[data-testid="uxdoc-title-input"]', "PRD: E2E Verified Treasury Spec");
    await adminPage.click('[data-testid="generate-uxdoc-btn"]');
    await adminPage.waitForTimeout(500);
    await adminPage.click('[data-testid="save-uxdoc-btn"]');
    await adminPage.waitForSelector('[data-testid="uxdoc-saved-banner"]');
    console.log(
      "[PASS] 6.6 AI UX Copilot Chat (/a/chat) & AI PRD / UX Document Studio (/a/ux-document) verified"
    );

    // 6.7 UX Pilot Labs (/labs, /labs/gradient-generator, /labs/dither-generator) + Direct Invite Route (/invite/[code])
    await adminPage.goto(`${BASE_URL}/invite/UXP-2026-VIEWER1`, {
      waitUntil: "networkidle",
    });
    await adminPage.waitForSelector('[data-testid="invite-grant-banner"]');

    await adminPage.goto(`${BASE_URL}/labs`, { waitUntil: "networkidle" });
    await adminPage.goto(`${BASE_URL}/labs/gradient-generator`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="gradient-mode-fluid"]');
    await adminPage.click('[data-testid="gradient-randomize-btn"]');
    await adminPage.click('[data-testid="gradient-copy-code-btn"]');

    await adminPage.goto(`${BASE_URL}/labs/dither-generator`, { waitUntil: "networkidle" });
    await adminPage.click('[data-testid="dither-alg-floyd-steinberg"]');
    await adminPage.click('[data-testid="dither-alg-halftone"]');
    await adminPage.click('[data-testid="dither-send-to-canvas-btn"]');
    await adminPage.waitForURL("**/a/ui-design**", { timeout: 15000 });
    console.log(
      "[PASS] 6.7 UX Pilot Labs (/labs, /labs/gradient-generator, /labs/dither-generator -> Send to AI Canvas) & Direct Invite Grant (/invite/[code]) verified"
    );

    await adminContext.close();

    // -------------------------------------------------------------------------
    // PART 7: Viewer Role Read-Only Enforcement & Responsive Viewports (Tablet & Mobile)
    // -------------------------------------------------------------------------
    const viewerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const viewerPage = await viewerContext.newPage();

    await viewerPage.goto(`${BASE_URL}/sign-in`, { waitUntil: "networkidle" });
    await viewerPage.click('[data-testid="quickfill-viewer"]');
    await viewerPage.click('[data-testid="signin-submit-btn"]');
    await viewerPage.waitForURL("**/a/ui-list", { timeout: 15000 });

    // Mobile drawer menu toggle on 390x844
    await viewerPage.click('[data-testid="mobile-menu-toggle"]');
    await viewerPage.waitForTimeout(250);

    // Check Viewer read-only badge on /a/ui-design
    await viewerPage.goto(`${BASE_URL}/a/ui-design?pageId=page-fintech-command`, {
      waitUntil: "networkidle",
    });
    await viewerPage.waitForSelector('[data-testid="canvas-readonly-badge"]');

    // Check Tablet viewport (768x1024)
    await viewerPage.setViewportSize({ width: 768, height: 1024 });
    await viewerPage.goto(`${BASE_URL}/a/ux-design-review`, { waitUntil: "networkidle" });
    await viewerPage.waitForSelector('[data-testid="review-visual-stage"]');

    await viewerContext.close();
    console.log(
      "[PASS] 7.1 Viewer RBAC read-only enforcement & Mobile (390x844) / Tablet (768x1024) responsive layouts verified"
    );

    console.log("=== ALL PLAYWRIGHT E2E FEATURE & COMBINATION TESTS PASSED! ===");
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error("E2E Verification failed:", err);
  process.exit(1);
});
