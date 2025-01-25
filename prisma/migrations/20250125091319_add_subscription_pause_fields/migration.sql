-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "pauseEnd" TIMESTAMP(3),
ADD COLUMN     "pauseStart" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
