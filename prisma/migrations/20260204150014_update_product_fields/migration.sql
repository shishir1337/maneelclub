/*
  Warnings:

  - You are about to drop the column `discountPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `featured` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Product` table. All the data in the column will be lost.
  - Added the required column `regularPrice` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Product_featured_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "discountPrice",
DROP COLUMN "featured",
DROP COLUMN "price",
ADD COLUMN     "colors" TEXT[],
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regularPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "salePrice" DECIMAL(10,2),
ADD COLUMN     "sizes" TEXT[],
ADD COLUMN     "stock" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");
