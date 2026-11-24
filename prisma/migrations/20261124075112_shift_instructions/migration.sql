-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "instrExtra" TEXT,
ADD COLUMN     "instrOpenedAt" TIMESTAMP(3),
ADD COLUMN     "instrReadAt" TIMESTAMP(3),
ADD COLUMN     "instrSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "instrAccess" TEXT,
ADD COLUMN     "instrApps" TEXT,
ADD COLUMN     "instrAuto" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "instrEmergency" TEXT,
ADD COLUMN     "instrKeys" TEXT,
ADD COLUMN     "instrPaperwork" TEXT;
