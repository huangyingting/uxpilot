-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Editor',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "revokedAt" DATETIME,
    "revokedReason" TEXT,
    "planType" TEXT NOT NULL DEFAULT 'pro',
    "creditsRemaining" INTEGER NOT NULL DEFAULT 1500,
    "creditsTotal" INTEGER NOT NULL DEFAULT 1800,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordCredential" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PasswordCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "email" TEXT,
    "assignedRole" TEXT NOT NULL DEFAULT 'Editor',
    "note" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "redeemedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdByUserId" TEXT,
    "redeemedByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountInvitation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccountInvitation_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workstream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#7c3aed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workstream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignSystem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'react',
    "sourceUrl" TEXT,
    "tokensJson" TEXT NOT NULL DEFAULT '{}',
    "componentsJson" TEXT NOT NULL DEFAULT '[]',
    "designMd" TEXT NOT NULL DEFAULT '',
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DesignSystem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignPage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workstreamId" TEXT,
    "designSystemId" TEXT,
    "name" TEXT NOT NULL,
    "globalPrompt" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'mobile',
    "mode" TEXT NOT NULL DEFAULT 'hifi',
    "isBookmarked" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithEmails" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DesignPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DesignPage_workstreamId_fkey" FOREIGN KEY ("workstreamId") REFERENCES "Workstream" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DesignPage_designSystemId_fkey" FOREIGN KEY ("designSystemId") REFERENCES "DesignSystem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScreenGroup" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sectionPrompt" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScreenGroup_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "DesignPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WireframeScreen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "groupId" TEXT,
    "name" TEXT NOT NULL,
    "screenPrompt" TEXT,
    "fidelity" TEXT NOT NULL DEFAULT 'hifi',
    "platform" TEXT NOT NULL DEFAULT 'mobile',
    "htmlContent" TEXT NOT NULL,
    "reactCode" TEXT NOT NULL DEFAULT '',
    "x" INTEGER NOT NULL DEFAULT 80,
    "y" INTEGER NOT NULL DEFAULT 100,
    "width" INTEGER NOT NULL DEFAULT 390,
    "height" INTEGER NOT NULL DEFAULT 844,
    "linkedNextScreenId" TEXT,
    "versionHistoryJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WireframeScreen_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "DesignPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WireframeScreen_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ScreenGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CanvasFlowchart" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT,
    "mermaidCode" TEXT NOT NULL,
    "nodesJson" TEXT NOT NULL DEFAULT '[]',
    "x" INTEGER NOT NULL DEFAULT 100,
    "y" INTEGER NOT NULL DEFAULT 1020,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CanvasFlowchart_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "DesignPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pageId" TEXT NOT NULL,
    "screenId" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 200,
    "y" INTEGER NOT NULL DEFAULT 200,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "repliesJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DesignComment_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "DesignPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DesignComment_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "WireframeScreen" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DesignComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DesignReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "screenId" TEXT,
    "title" TEXT NOT NULL,
    "reviewGoal" TEXT,
    "overallScore" INTEGER NOT NULL,
    "metricsJson" TEXT NOT NULL DEFAULT '{}',
    "findingsJson" TEXT NOT NULL DEFAULT '[]',
    "heatmapPointsJson" TEXT NOT NULL DEFAULT '[]',
    "scanpathJson" TEXT NOT NULL DEFAULT '[]',
    "gazeFlowJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DesignReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DesignReview_screenId_fkey" FOREIGN KEY ("screenId") REFERENCES "WireframeScreen" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PrReviewRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "repoFullName" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "prTitle" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "designSystemId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "score" INTEGER NOT NULL DEFAULT 92,
    "summary" TEXT NOT NULL,
    "findingsJson" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrReviewRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PublishedSite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "passwordHash" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PublishedSite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PublishedSite_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "DesignPage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "McpAccessToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenPrefix" TEXT NOT NULL,
    "tokenValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "McpAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "AccountInvitation_code_key" ON "AccountInvitation"("code");
CREATE UNIQUE INDEX "AccountInvitation_redeemedByUserId_key" ON "AccountInvitation"("redeemedByUserId");
CREATE UNIQUE INDEX "PublishedSite_slug_key" ON "PublishedSite"("slug");
CREATE UNIQUE INDEX "McpAccessToken_tokenValue_key" ON "McpAccessToken"("tokenValue");
