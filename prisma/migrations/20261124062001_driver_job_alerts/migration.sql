-- AlterTable
ALTER TABLE "DriverProfile" ADD COLUMN     "jobAlertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastJobDigestAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DriverJobAlert" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverJobAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverJobAlert_driverId_createdAt_idx" ON "DriverJobAlert"("driverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DriverJobAlert_jobId_driverId_key" ON "DriverJobAlert"("jobId", "driverId");
