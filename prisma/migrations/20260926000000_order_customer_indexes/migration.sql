-- Customer history lookups on Order ("times purchased" on the admin orders list, search).
-- Both indexes already exist in the live database (phone: 20260421000000_add_banned_phone;
-- email: created CONCURRENTLY on 2026-09-25), so IF NOT EXISTS makes this a no-op there.
-- Names match what Prisma derives from the @@index lines in schema.prisma.
CREATE INDEX IF NOT EXISTS "Order_customerPhone_idx" ON "Order"("customerPhone");
CREATE INDEX IF NOT EXISTS "Order_customerEmail_idx" ON "Order"("customerEmail");
