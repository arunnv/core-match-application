ALTER TABLE "rubric_competencies" ADD COLUMN IF NOT EXISTS "mandatory" boolean NOT NULL DEFAULT false;
