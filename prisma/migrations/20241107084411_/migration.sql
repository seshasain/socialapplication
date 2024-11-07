/*
  Warnings:

  - You are about to drop the column `platform` on the `Analytics` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Analytics` table. All the data in the column will be lost.
  - Added the required column `postPlatformId` to the `Analytics` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Analytics" DROP CONSTRAINT "Analytics_userId_fkey";

-- DropIndex
DROP INDEX "Analytics_platform_idx";

-- DropIndex
DROP INDEX "Analytics_userId_date_idx";

-- AlterTable
ALTER TABLE "Analytics" DROP COLUMN "platform",
DROP COLUMN "userId",
ADD COLUMN     "comments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postPlatformId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Analytics_postPlatformId_idx" ON "Analytics"("postPlatformId");

-- CreateIndex
CREATE INDEX "Analytics_date_idx" ON "Analytics"("date");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_postPlatformId_fkey" FOREIGN KEY ("postPlatformId") REFERENCES "PostPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
