-- AlterTable
ALTER TABLE "PlanLimit" ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'monthly',
ALTER COLUMN "value" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "UsageRecord" ADD COLUMN     "platform" TEXT;

-- CreateTable
CREATE TABLE "MonthlyUsage" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "postsUsed" INTEGER NOT NULL DEFAULT 0,
    "platformUsage" JSONB NOT NULL DEFAULT '{}',
    "rolloverAmount" INTEGER,
    "rolloverExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolloverPosts" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolloverPosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyUsage_subscriptionId_idx" ON "MonthlyUsage"("subscriptionId");

-- CreateIndex
CREATE INDEX "MonthlyUsage_monthYear_idx" ON "MonthlyUsage"("monthYear");

-- CreateIndex
CREATE UNIQUE INDEX "RolloverPosts_subscriptionId_key" ON "RolloverPosts"("subscriptionId");

-- CreateIndex
CREATE INDEX "RolloverPosts_subscriptionId_idx" ON "RolloverPosts"("subscriptionId");

-- CreateIndex
CREATE INDEX "UsageRecord_platform_idx" ON "UsageRecord"("platform");

-- AddForeignKey
ALTER TABLE "MonthlyUsage" ADD CONSTRAINT "MonthlyUsage_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolloverPosts" ADD CONSTRAINT "RolloverPosts_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
