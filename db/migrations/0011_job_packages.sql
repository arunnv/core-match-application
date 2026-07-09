ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "client_package" integer;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "our_package" integer;
