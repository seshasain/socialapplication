/*
  Warnings:

  - You are about to drop the column `externalPostId` on the `Post` table. All the data in the column will be lost.
  - Added the required column `platform` to the `Analytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Analytics` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Analytics" DROP CONSTRAINT "Analytics_postPlatformId_fkey";

-- AlterTable
ALTER TABLE "Analytics" ADD COLUMN     "platform" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "postPlatformId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "externalPostId";

-- CreateIndex
CREATE INDEX "Analytics_userId_idx" ON "Analytics"("userId");

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analytics" ADD CONSTRAINT "Analytics_postPlatformId_fkey" FOREIGN KEY ("postPlatformId") REFERENCES "PostPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;
