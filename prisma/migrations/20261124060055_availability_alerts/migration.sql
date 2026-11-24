-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "alertClasses" TEXT[],
ADD COLUMN     "alertRadiusMiles" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastDigestAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "availabilityUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "JobMatchAlert" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobMatchAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobMatchAlert_jobId_driverId_key" ON "JobMatchAlert"("jobId", "driverId");
