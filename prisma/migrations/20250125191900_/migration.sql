-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referredBy" TEXT;

-- CreateTable
CREATE TABLE "TrialExtensionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedDays" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrialExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrialExtensionRequest_userId_idx" ON "TrialExtensionRequest"("userId");

-- CreateIndex
CREATE INDEX "TrialExtensionRequest_status_idx" ON "TrialExtensionRequest"("status");

-- CreateIndex
CREATE INDEX "User_referredBy_idx" ON "User"("referredBy");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredBy_fkey" FOREIGN KEY ("referredBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialExtensionRequest" ADD CONSTRAINT "TrialExtensionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
