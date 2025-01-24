-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "deactivationReason" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';
