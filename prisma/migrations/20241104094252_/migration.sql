/*
  Warnings:

  - You are about to drop the column `platform` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the `PlatformSettings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PlatformSettings" DROP CONSTRAINT "PlatformSettings_postId_fkey";

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "platform";

-- DropTable
DROP TABLE "PlatformSettings";

-- CreateTable
CREATE TABLE "PostPlatform" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "error" TEXT,
    "externalId" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostPlatform_postId_idx" ON "PostPlatform"("postId");

-- CreateIndex
CREATE INDEX "PostPlatform_platform_idx" ON "PostPlatform"("platform");

-- AddForeignKey
ALTER TABLE "PostPlatform" ADD CONSTRAINT "PostPlatform_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
