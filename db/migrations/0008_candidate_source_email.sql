ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "source_email" jsonb DEFAULT NULL;
