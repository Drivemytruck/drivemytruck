-- CreateEnum
CREATE TYPE "JobKind" AS ENUM ('SHIFT', 'PERMANENT');

-- AlterEnum
ALTER TYPE "PayType" ADD VALUE 'ANNUAL';

-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "openToPermanent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "permEmployment" TEXT[],
ADD COLUMN     "permNote" TEXT,
ADD COLUMN     "permReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "permSchedule" TEXT,
ADD COLUMN     "permanentUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "employmentType" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "expiryReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "kind" "JobKind" NOT NULL DEFAULT 'SHIFT',
ADD COLUMN     "renewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "schedule" TEXT,
ADD COLUMN     "startAsap" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "durationHours" SET DEFAULT 0;
