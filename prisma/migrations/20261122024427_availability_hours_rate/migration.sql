-- AlterTable
ALTER TABLE "Availability" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "rateAmount" INTEGER,
ADD COLUMN     "rateType" "PayType",
ADD COLUMN     "startTime" TEXT;
