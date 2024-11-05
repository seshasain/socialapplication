/*
  Warnings:

  - You are about to drop the column `comments` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `engagementRate` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `likes` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `shares` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Post` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Post_userId_status_idx";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "comments",
DROP COLUMN "engagementRate",
DROP COLUMN "likes",
DROP COLUMN "shares",
DROP COLUMN "status";

-- CreateIndex
CREATE INDEX "Post_userId_idx" ON "Post"("userId");
