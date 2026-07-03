ALTER TABLE "candidates" ALTER COLUMN "job_id" DROP NOT NULL;
ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_job_id_jobs_id_fk";
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL;
