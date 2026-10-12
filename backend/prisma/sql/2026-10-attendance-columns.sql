-- Additive, idempotent, non-destructive. Safe to run more than once.
-- Brings an older "Attendance" table in line with prisma/schema.prisma.
-- No columns are dropped and no rows are modified.
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "checkInPhotoUrl" TEXT;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "checkOutPhotoUrl" TEXT;
