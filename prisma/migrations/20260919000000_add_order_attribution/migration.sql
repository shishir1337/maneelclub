-- AlterTable: traffic attribution on orders (additive, all nullable)
ALTER TABLE "Order" ADD COLUMN     "sourceChannel" TEXT,
ADD COLUMN     "firstSourceChannel" TEXT,
ADD COLUMN     "attribution" JSONB;

-- CreateIndex
CREATE INDEX "Order_sourceChannel_idx" ON "Order"("sourceChannel");
