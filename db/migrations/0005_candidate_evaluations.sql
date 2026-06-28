ALTER TABLE "candidates" ADD COLUMN "evaluations" jsonb DEFAULT '[]'::jsonb;
