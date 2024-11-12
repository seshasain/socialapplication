/*
  Warnings:

  - You are about to drop the column `scheduledTime` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "scheduledTime";

-- AlterTable
ALTER TABLE "PostPlatform" ADD COLUMN     "scheduledTime" TEXT;
