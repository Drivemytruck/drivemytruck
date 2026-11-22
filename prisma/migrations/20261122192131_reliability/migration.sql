-- CreateEnum
CREATE TYPE "ReliabilityEventType" AS ENUM ('NO_SHOW', 'LATE_CANCEL', 'CANCEL');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "disputeStatus" TEXT,
ADD COLUMN     "disputeText" TEXT,
ADD COLUMN     "noShowAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ReliabilityEvent" (
    "id" TEXT NOT NULL,
    "type" "ReliabilityEventType" NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "jobId" TEXT NOT NULL,
    "bookingId" TEXT,
    "overturned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReliabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReliabilityEvent_userId_idx" ON "ReliabilityEvent"("userId");

-- AddForeignKey
ALTER TABLE "ReliabilityEvent" ADD CONSTRAINT "ReliabilityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
