-- DropForeignKey
ALTER TABLE "Analytics" DROP CONSTRAINT "Analytics_postPlatformId_fkey";

-- DropForeignKey
ALTER TABLE "Analytics" DROP CONSTRAINT "Analytics_userId_fkey";

-- DropForeignKey
ALTER TABLE "Feedback" DROP CONSTRAINT "Feedback_userId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "MediaFile" DROP CONSTRAINT "MediaFile_userId_fkey";

-- DropForeignKey
ALTER TABLE "MonthlyUsage" DROP CONSTRAINT "MonthlyUsage_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "PaymentMethod" DROP CONSTRAINT "PaymentMethod_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "PlanFeature" DROP CONSTRAINT "PlanFeature_planId_fkey";

-- DropForeignKey
ALTER TABLE "PlanLimit" DROP CONSTRAINT "PlanLimit_planId_fkey";

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_userId_fkey";

-- DropForeignKey
ALTER TABLE "PostPlatform" DROP CONSTRAINT "PostPlatform_postId_fkey";

-- DropForeignKey
ALTER TABLE "Response" DROP CONSTRAINT "Response_supportTicketId_fkey";

-- DropForeignKey
ALTER TABLE "RolloverPosts" DROP CONSTRAINT "RolloverPosts_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "SocialAccount" DROP CONSTRAINT "SocialAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_planId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "UsageRecord" DROP CONSTRAINT "UsageRecord_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "UserSettings" DROP CONSTRAINT "UserSettings_userId_fkey";

-- DropForeignKey
ALTER TABLE "_PostToMediaFile" DROP CONSTRAINT "_PostToMediaFile_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToMediaFile" DROP CONSTRAINT "_PostToMediaFile_B_fkey";

-- DropIndex
DROP INDEX "Analytics_date_idx";

-- DropIndex
DROP INDEX "Analytics_postPlatformId_idx";

-- DropIndex
DROP INDEX "Analytics_userId_idx";

-- DropIndex
DROP INDEX "Feedback_status_idx";

-- DropIndex
DROP INDEX "Feedback_userId_idx";

-- DropIndex
DROP INDEX "Invoice_subscriptionId_idx";

-- DropIndex
DROP INDEX "MediaFile_userId_idx";

-- DropIndex
DROP INDEX "MonthlyUsage_monthYear_idx";

-- DropIndex
DROP INDEX "MonthlyUsage_subscriptionId_idx";

-- DropIndex
DROP INDEX "PaymentMethod_subscriptionId_idx";

-- DropIndex
DROP INDEX "PaymentMethod_subscriptionId_key";

-- DropIndex
DROP INDEX "Plan_isDefault_idx";

-- DropIndex
DROP INDEX "Plan_name_idx";

-- DropIndex
DROP INDEX "Plan_name_key";

-- DropIndex
DROP INDEX "PlanFeature_planId_idx";

-- DropIndex
DROP INDEX "PlanLimit_planId_idx";

-- DropIndex
DROP INDEX "Post_scheduledDate_idx";

-- DropIndex
DROP INDEX "Post_userId_idx";

-- DropIndex
DROP INDEX "PostPlatform_platform_idx";

-- DropIndex
DROP INDEX "PostPlatform_postId_idx";

-- DropIndex
DROP INDEX "Response_supportTicketId_idx";

-- DropIndex
DROP INDEX "RolloverPosts_subscriptionId_idx";

-- DropIndex
DROP INDEX "RolloverPosts_subscriptionId_key";

-- DropIndex
DROP INDEX "SocialAccount_userId_idx";

-- DropIndex
DROP INDEX "Subscription_planId_idx";

-- DropIndex
DROP INDEX "Subscription_status_idx";

-- DropIndex
DROP INDEX "Subscription_userId_idx";

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- DropIndex
DROP INDEX "SupportTicket_status_idx";

-- DropIndex
DROP INDEX "SupportTicket_userId_idx";

-- DropIndex
DROP INDEX "TeamMember_email_key";

-- DropIndex
DROP INDEX "TeamMember_userId_idx";

-- DropIndex
DROP INDEX "UsageRecord_feature_idx";

-- DropIndex
DROP INDEX "UsageRecord_platform_idx";

-- DropIndex
DROP INDEX "UsageRecord_subscriptionId_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "UserSettings_userId_key";

-- DropIndex
DROP INDEX "_PostToMediaFile_AB_unique";

-- DropIndex
DROP INDEX "_PostToMediaFile_B_index";
