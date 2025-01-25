/*
  Warnings:

  - You are about to drop the column `referralCredits` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Referral` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referredUserId_fkey";

-- DropForeignKey
ALTER TABLE "Referral" DROP CONSTRAINT "Referral_referrerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "referralCredits";

-- DropTable
DROP TABLE "Referral";

-- DropEnum
DROP TYPE "ReferralStatus";
