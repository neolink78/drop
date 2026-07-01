-- AlterTable
ALTER TABLE "Order" ADD COLUMN "aliexpressStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "fulfillmentError" TEXT;
ALTER TABLE "Order" ADD COLUMN "skuAttr" TEXT;
ALTER TABLE "Order" ADD COLUMN "skuId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "reviews" JSONB;
ALTER TABLE "Product" ADD COLUMN "shippingInfo" JSONB;
ALTER TABLE "Product" ADD COLUMN "skus" JSONB;

-- CreateTable
CREATE TABLE "AliExpressToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "accountId" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "refreshExpiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
