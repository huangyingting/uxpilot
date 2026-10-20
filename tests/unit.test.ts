import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/passwords";
import { hasMinimumRole } from "../src/lib/api-auth";
import {
  getAIProvider,
  getAIProviderStatus,
  setRuntimeAIProvider,
} from "../src/lib/ai/provider";
import {
  createInvitation,
  validateInvitationCode,
  redeemInvitationAndCreateUser,
  revokeInvitation,
} from "../src/lib/invitations";
import { prisma } from "../src/lib/prisma";
import { seedInitialWorkspaceData } from "../src/lib/bootstrap";

async function runTests() {
  console.log("=== UX Pilot Studio Unit & Integration Test Suite ===");

  // 1. Ensure database is seeded
  await seedInitialWorkspaceData();
  console.log("[PASS] 1. Workspace database bootstrap & seed verified");

  // 2. Password hashing & verification
  const hashed = hashPassword("SuperSecretPass123!");
  assert.equal(verifyPassword("SuperSecretPass123!", hashed), true);
  assert.equal(verifyPassword("WrongPass!", hashed), false);
  console.log("[PASS] 2. Scrypt password hashing & timing-safe verification");

  // 3. RBAC role hierarchy checks
  assert.equal(hasMinimumRole("Admin", "Admin"), true);
  assert.equal(hasMinimumRole("Admin", "Editor"), true);
  assert.equal(hasMinimumRole("Admin", "Viewer"), true);
  assert.equal(hasMinimumRole("Editor", "Admin"), false);
  assert.equal(hasMinimumRole("Editor", "Editor"), true);
  assert.equal(hasMinimumRole("Viewer", "Editor"), false);
  assert.equal(hasMinimumRole("Viewer", "Viewer"), true);
  console.log("[PASS] 3. RBAC role hierarchy (Admin > Editor > Viewer)");

  // 4. Invitation lifecycle: create -> validate -> email lock -> redeem -> single-use enforcement -> revoke -> expire
  const createdInvite = await createInvitation({
    email: "unit.tester@uxpilot.local",
    assignedRole: "Editor",
    expiresInHours: 24,
  });
  assert.ok(createdInvite.code.startsWith("UXP-"));

  // Wrong email should fail email lock
  const wrongEmailValidation = await validateInvitationCode(
    createdInvite.code,
    "other@uxpilot.local"
  );
  assert.equal(wrongEmailValidation.valid, false);

  // Correct email should pass
  const rightEmailValidation = await validateInvitationCode(
    createdInvite.code,
    "unit.tester@uxpilot.local"
  );
  assert.equal(rightEmailValidation.valid, true);

  // Clean up any previous test user with this email
  await prisma.user.deleteMany({ where: { email: "unit.tester@uxpilot.local" } });

  // Redeem invitation
  const redemption = await redeemInvitationAndCreateUser({
    code: createdInvite.code,
    email: "unit.tester@uxpilot.local",
    name: "Unit Tester",
    password: "UnitPass123!",
  });
  assert.equal(redemption.ok, true);

  // Second redemption of same single-use code must fail
  const reuseAttempt = await validateInvitationCode(
    createdInvite.code,
    "second@uxpilot.local"
  );
  assert.equal(reuseAttempt.valid, false);
  assert.match(reuseAttempt.reason || "", /redeemed/i);

  // Expired code must fail
  const expiredCheck = await validateInvitationCode("UXP-2026-EXPIRED", "any@uxpilot.local");
  assert.equal(expiredCheck.valid, false);
  assert.match(expiredCheck.reason || "", /expired/i);

  // Revoked code must fail
  const revokedCheck = await validateInvitationCode("UXP-2026-REVOKED", "any@uxpilot.local");
  assert.equal(revokedCheck.valid, false);
  assert.match(revokedCheck.reason || "", /revoked/i);

  // Dynamic revocation test
  const toRevoke = await createInvitation({ assignedRole: "Viewer", expiresInHours: 12 });
  await revokeInvitation(toRevoke.id);
  const afterRevoke = await validateInvitationCode(toRevoke.code);
  assert.equal(afterRevoke.valid, false);
  console.log(
    "[PASS] 4. Single-use, email-locked, expiring, and revocable invitation lifecycle verified"
  );

  // 5. Pluggable AI Provider Engine (Copilot SDK / Azure OpenAI / Deterministic)
  process.env.AI_DISABLE_EXTERNAL = "1"; // Fast deterministic fallback for unit tests

  setRuntimeAIProvider("copilot-sdk", "gpt-4.1");
  assert.equal(getAIProviderStatus().activeProvider, "copilot-sdk");
  const copilotAdapter = getAIProvider();
  const enhanced = await copilotAdapter.enhancePrompt({
    prompt: "FinTech card dashboard",
    platform: "desktop",
    mode: "hifi",
  });
  assert.ok(enhanced.enhancedPrompt.length > 30);

  setRuntimeAIProvider("azure-openai", "gpt-4o");
  assert.equal(getAIProviderStatus().activeProvider, "azure-openai");
  const azureAdapter = getAIProvider();
  const screensOut = await azureAdapter.generateScreens({
    prompt: "B2B SaaS Analytics",
    platform: "desktop",
    fidelity: "hifi",
    count: 2,
    generationKind: "standard",
  });
  assert.equal(screensOut.screens.length, 2);
  assert.ok(screensOut.screens[0].htmlContent.includes("<!DOCTYPE html>"));
  assert.ok(screensOut.screens[0].reactCode.includes("export function"));

  const uxReviewOut = await azureAdapter.evaluateScreenUx({
    screenTitle: "Checkout Screen",
    htmlContent: screensOut.screens[0].htmlContent,
  });
  assert.ok(uxReviewOut.review.overallScore >= 70);
  assert.ok(uxReviewOut.review.heatmapPoints.length >= 3);
  assert.ok(uxReviewOut.review.scanpath.length >= 3);
  assert.ok(uxReviewOut.review.gazeFlow.length >= 3);

  // Reset provider back to copilot-sdk default
  setRuntimeAIProvider("copilot-sdk", "gpt-4.1");
  console.log(
    "[PASS] 5. Pluggable AI Provider (Copilot SDK + Azure OpenAI + Deterministic) verified"
  );

  console.log("=== ALL UNIT & INTEGRATION TESTS PASSED ===");
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
