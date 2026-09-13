-- Migration contrôlée et non-destructive pour aligner mandemarket avec schema.prisma

BEGIN;

-- 1. Créer les nouveaux types ENUM s'ils n'existent pas
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('user', 'customer', 'seller', 'manager', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SellerStatus" AS ENUM ('pending', 'approved', 'suspended');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReturnStatus" AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SellerLedgerType" AS ENUM ('SALE_PENDING', 'SALE_AVAILABLE', 'COMMISSION', 'REFUND', 'PAYOUT_RESERVED', 'PAYOUT_COMPLETED', 'PAYOUT_RELEASED', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "SellerLedgerStatus" AS ENUM ('PENDING', 'AVAILABLE', 'LOCKED', 'CLEARED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Conversion sécurisée des colonnes VARCHAR vers ENUM sans suppression de données
ALTER TABLE "User" 
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole" USING "role"::text::"UserRole",
  ALTER COLUMN "role" SET DEFAULT 'user'::"UserRole";

ALTER TABLE "Seller" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "SellerStatus" USING "status"::text::"SellerStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending'::"SellerStatus";

ALTER TABLE "Product" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ProductStatus" USING "status"::text::"ProductStatus",
  ALTER COLUMN "status" SET DEFAULT 'active'::"ProductStatus";

ALTER TABLE "SellerPayout" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "PayoutStatus" USING "status"::text::"PayoutStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending'::"PayoutStatus";

ALTER TABLE "ReturnRequest" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReturnStatus" USING "status"::text::"ReturnStatus",
  ALTER COLUMN "status" SET DEFAULT 'pending'::"ReturnStatus";

ALTER TABLE "Review" 
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ReviewStatus" USING "status"::text::"ReviewStatus",
  ALTER COLUMN "status" SET DEFAULT 'approved'::"ReviewStatus";

-- 3. Ajout des colonnes Customer, Order, OrderItem
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "userId" TEXT;

ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS "subtotalAmount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "customerSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "billingAddress" JSONB,
  ADD COLUMN IF NOT EXISTS "shippingAddress" JSONB,
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

ALTER TABLE "OrderItem" 
  ADD COLUMN IF NOT EXISTS "productSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "selectedVariant" JSONB,
  ADD COLUMN IF NOT EXISTS "sku" TEXT,
  ADD COLUMN IF NOT EXISTS "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 10;

-- 4. Création des nouvelles tables
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "paymentId" TEXT,
    "gateway" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PromotionRedemption" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT,
    "discountApplied" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PromotionRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SellerLedgerEntry" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "orderId" TEXT,
    "payoutId" TEXT,
    "type" "SellerLedgerType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "feeAmount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "status" "SellerLedgerStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "balanceAfter" INTEGER,
    "availableAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SellerLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 5. Clés étrangères & contraintes
DO $$ BEGIN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PromotionRedemption" ADD CONSTRAINT "PromotionRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SellerLedgerEntry" ADD CONSTRAINT "SellerLedgerEntry_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SellerLedgerEntry" ADD CONSTRAINT "SellerLedgerEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "SellerLedgerEntry" ADD CONSTRAINT "SellerLedgerEntry_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "SellerPayout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 6. Index et Unicités
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_userId_key" ON "Customer"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_idempotencyKey_key" ON "PaymentEvent"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "PromotionRedemption_promotionId_orderId_key" ON "PromotionRedemption"("promotionId", "orderId");
CREATE UNIQUE INDEX IF NOT EXISTS "Product_sellerId_sku_key" ON "Product"("sellerId", "sku");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_tokenHash_idx" ON "Session"("tokenHash");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");
CREATE INDEX IF NOT EXISTS "PaymentEvent_gateway_eventType_idx" ON "PaymentEvent"("gateway", "eventType");
CREATE INDEX IF NOT EXISTS "PaymentEvent_orderId_idx" ON "PaymentEvent"("orderId");
CREATE INDEX IF NOT EXISTS "PaymentEvent_idempotencyKey_idx" ON "PaymentEvent"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "PromotionRedemption_customerId_idx" ON "PromotionRedemption"("customerId");
CREATE INDEX IF NOT EXISTS "PromotionRedemption_promotionId_idx" ON "PromotionRedemption"("promotionId");
CREATE INDEX IF NOT EXISTS "SellerLedgerEntry_sellerId_type_idx" ON "SellerLedgerEntry"("sellerId", "type");
CREATE INDEX IF NOT EXISTS "SellerLedgerEntry_sellerId_status_idx" ON "SellerLedgerEntry"("sellerId", "status");
CREATE INDEX IF NOT EXISTS "SellerLedgerEntry_orderId_idx" ON "SellerLedgerEntry"("orderId");
CREATE INDEX IF NOT EXISTS "SellerLedgerEntry_createdAt_idx" ON "SellerLedgerEntry"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "Product_status_idx" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "Seller_status_idx" ON "Seller"("status");
CREATE INDEX IF NOT EXISTS "SellerPayout_status_idx" ON "SellerPayout"("status");
CREATE INDEX IF NOT EXISTS "ReturnRequest_status_idx" ON "ReturnRequest"("status");
CREATE INDEX IF NOT EXISTS "Review_status_idx" ON "Review"("status");

COMMIT;
