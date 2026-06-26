import { db } from '@/db';
import { jobs, rubricCompetencies, candidates, tenants, users, systemSettings } from '@/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

export async function getJobsByTenant(tenantId: string) {
  return db.select().from(jobs).where(eq(jobs.tenantId, tenantId)).orderBy(desc(jobs.createdAt));
}

export async function getJobById(id: string) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
  return job ?? null;
}

export async function getCompetenciesByJob(jobId: string) {
  return db
    .select()
    .from(rubricCompetencies)
    .where(eq(rubricCompetencies.jobId, jobId))
    .orderBy(rubricCompetencies.sortOrder);
}

export async function getCandidatesByJob(jobId: string) {
  return db
    .select()
    .from(candidates)
    .where(eq(candidates.jobId, jobId))
    .orderBy(desc(candidates.createdAt));
}

export async function getCandidateById(id: string) {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return c ?? null;
}

export async function createJob(data: typeof jobs.$inferInsert) {
  const [job] = await db.insert(jobs).values(data).returning();
  return job!;
}

export async function createCompetencies(comps: (typeof rubricCompetencies.$inferInsert)[]) {
  return db.insert(rubricCompetencies).values(comps).returning();
}

export async function updateJobCounts(jobId: string) {
  const rows = await db
    .select({ status: candidates.status })
    .from(candidates)
    .where(eq(candidates.jobId, jobId));

  const scored = rows.filter((r) => r.status === 'scored').length;
  const processing = rows.filter((r) => r.status === 'processing').length;
  await db.update(jobs).set({ scored, processing }).where(eq(jobs.id, jobId));
}

export async function getTenants() {
  return db.select().from(tenants).orderBy(desc(tenants.createdAt));
}

export async function getUsersByTenant(tenantId: string) {
  return db.select().from(users).where(eq(users.tenantId, tenantId)).orderBy(desc(users.createdAt));
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getSystemSetting(key: string) {
  const [row] = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
  return row?.value ?? null;
}

export async function upsertSystemSetting(key: string, value: string) {
  await db
    .insert(systemSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
}

export async function getAdminStats() {
  const [tenantCount] = await db.select({ count: sql<number>`count(*)` }).from(tenants);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [candidateCount] = await db.select({ count: sql<number>`count(*)` }).from(candidates);
  return {
    totalTenants: Number(tenantCount?.count ?? 0),
    totalUsers: Number(userCount?.count ?? 0),
    totalEvaluations: Number(candidateCount?.count ?? 0),
  };
}
