-- CreateEnum
CREATE TYPE "ReviewSource" AS ENUM ('MESSENGER', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'PHOTO', 'OTHER');

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "customerName" TEXT NOT NULL DEFAULT '',
    "source" "ReviewSource" NOT NULL DEFAULT 'MESSENGER',
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewProduct" (
    "reviewId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "ReviewProduct_pkey" PRIMARY KEY ("reviewId","productId")
);

-- CreateIndex
CREATE INDEX "Review_isActive_sortOrder_idx" ON "Review"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "ReviewProduct_productId_idx" ON "ReviewProduct"("productId");

-- AddForeignKey
ALTER TABLE "ReviewProduct" ADD CONSTRAINT "ReviewProduct_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewProduct" ADD CONSTRAINT "ReviewProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

