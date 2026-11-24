-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'SUPERSEDED');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "agreedPayAmount" INTEGER,
ADD COLUMN     "agreedPayType" "PayType",
ADD COLUMN     "agreedStartAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "byRole" "Role" NOT NULL,
    "payAmount" INTEGER NOT NULL,
    "payType" "PayType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Offer_applicationId_status_idx" ON "Offer"("applicationId", "status");

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
