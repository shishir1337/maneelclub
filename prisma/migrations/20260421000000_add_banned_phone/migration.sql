-- CreateTable
CREATE TABLE "BannedPhone" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BannedPhone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BannedPhone_phoneNumber_key" ON "BannedPhone"("phoneNumber");

-- CreateIndex
CREATE INDEX "BannedPhone_phoneNumber_idx" ON "BannedPhone"("phoneNumber");

-- CreateIndex: speed up phone-based cooldown queries on Order
CREATE INDEX IF NOT EXISTS "Order_customerPhone_idx" ON "Order"("customerPhone");
