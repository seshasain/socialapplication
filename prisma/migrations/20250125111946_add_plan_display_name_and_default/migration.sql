-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "displayName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Plan_isDefault_idx" ON "Plan"("isDefault");
