-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courierCheckCheckedAt" TIMESTAMP(3),
ADD COLUMN     "courierCheckData" JSONB;
