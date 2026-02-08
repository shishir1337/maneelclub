-- CreateEnum
CREATE TYPE "ShippingZone" AS ENUM ('inside_dhaka', 'outside_dhaka');

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "shippingZone" "ShippingZone" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "City_value_key" ON "City"("value");

-- CreateIndex
CREATE INDEX "City_shippingZone_idx" ON "City"("shippingZone");
