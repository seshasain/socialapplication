/*
  Warnings:

  - You are about to drop the column `title` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `lastPosted` on the `SocialAccount` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Analytics_platform_date_idx";

-- DropIndex
DROP INDEX "SocialAccount_platform_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "title",
ADD COLUMN     "comments" INTEGER DEFAULT 0,
ADD COLUMN     "engagementRate" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "likes" INTEGER DEFAULT 0,
ADD COLUMN     "shares" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "SocialAccount" DROP COLUMN "lastPosted";

-- CreateIndex
CREATE INDEX "Analytics_platform_idx" ON "Analytics"("platform");

-- CreateIndex
CREATE INDEX "MediaFile_userId_idx" ON "MediaFile"("userId");
