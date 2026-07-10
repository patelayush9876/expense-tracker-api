-- AlterTable
ALTER TABLE "investments" ADD COLUMN     "quantity" DECIMAL(16,4),
ADD COLUMN     "symbol" TEXT;

-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'Starter';
