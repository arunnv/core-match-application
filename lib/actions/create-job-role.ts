'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { auth } from '@/auth';
import { db } from '@/db';
import { jobs, rubricCompetencies } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Zod schema for the unified Gemini response ──────────────────────────────

const JobRoleAISchema = z.object({
  metadata: z.object({
    title: z.string().min(1),
    jobCode: z.string().optional(),
    location: z.string().default('Remote'),
    workMode: z.string().default('Remote'),
    experienceRequired: z.string().optional(),
    contractDuration: z.string().optional(),
  }),
  rubric: z.array(z.object({
    name: z.string().min(1),
    weightPercentage: z.number().int().min(1).max(100),
    level: z.enum(['CORE', 'IMPORTANT', 'BONUS']),
    mandatory: z.boolean(),
  })).min(4).max(6),
});

type ActionResult = { ok: true; jobId: string } | { ok: false; error: string };

function normaliseWorkMode(raw: string): 'Remote' | 'Hybrid' | 'On-Site' {
  const s = raw.toLowerCase();
  if (s.includes('hybrid')) return 'Hybrid';
  if (s.includes('on-site') || s.includes('onsite') || s.includes('on site')) return 'On-Site';
  return 'Remote';
}

function normaliseWeights(rubric: { weightPercentage: number; name: string; level: 'CORE' | 'IMPORTANT' | 'BONUS'; mandatory: boolean }[]) {
  const sum = rubric.reduce((s, r) => s + r.weightPercentage, 0);
  if (sum === 0) return rubric;
  const normalised = rubric.map((r, i, arr) => ({
    ...r,
    weightPercentage: i < arr.length - 1
      ? Math.round((r.weightPercentage / sum) * 100)
      : 0,
  }));
  const partial = normalised.slice(0, -1).reduce((s, r) => s + r.weightPercentage, 0);
  normalised[normalised.length - 1]!.weightPercentage = 100 - partial;
  return normalised;
}

// ── Main action ─────────────────────────────────────────────────────────────

export async function createJobRoleAction(jdText: string): Promise<ActionResult> {
  if (!jdText || jdText.trim().length < 30) {
    return { ok: false, error: 'Job description is too short to parse.' };
  }

  const session = await auth();
  if (!session?.user?.tenantId) return { ok: false, error: 'Not authenticated.' };

  // ── 1. Generate next job code from DB ──
  const [countRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.tenantId, session.user.tenantId));
  const nextCode = `JC#${String(100 + Number(countRow?.count ?? 0) + 1).padStart(5, '0')}`;

  // ── 2. Unified Gemini call ──
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction:
      'You are an expert technical recruiter. Parse the provided unstructured Job Description. ' +
      'You must extract key metadata (title, code, location, experience, duration) AND identify ' +
      'the 4 to 6 most critical, specific competencies required for this role to build a weighted ' +
      'evaluation rubric. Ensure the rubric weights sum exactly to 100. ' +
      'Do NOT use generic competency names like "Technical Skills" or "Communication". ' +
      'Extract specific domains like "Oracle CPQ (Big Machines)" or "React.js Architecture".',
  });

  const prompt = `Parse this job description and return a single JSON object.

JSON schema:
{
  "metadata": {
    "title": "<job title>",
    "jobCode": "<job code if found, e.g. JC#00103, or null>",
    "location": "<city/country or Remote>",
    "workMode": "<Remote | Hybrid | On-Site>",
    "experienceRequired": "<e.g. 4-5 Years or null>",
    "contractDuration": "<e.g. 6+ Months or null>"
  },
  "rubric": [
    {
      "name": "<specific technology or domain — not generic>",
      "weightPercentage": <integer, all items must sum to exactly 100>,
      "level": "<CORE | IMPORTANT | BONUS>",
      "mandatory": <true only for CORE deal-breakers>
    }
  ]
}

Rules:
- rubric must have 4 to 6 items
- all weightPercentage values must sum to exactly 100
- level CORE = absolute must-have, IMPORTANT = strong preference, BONUS = differentiator
- mandatory = true only for CORE items that are absolute deal-breakers

JOB DESCRIPTION:
---
${jdText.slice(0, 4000)}
---`;

  let parsed: z.infer<typeof JobRoleAISchema>;
  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let rawParsed: unknown;
    try {
      rawParsed = JSON.parse(raw);
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end === -1) return { ok: false, error: 'AI returned malformed JSON — please try again.' };
      rawParsed = JSON.parse(raw.slice(start, end + 1));
    }

    const validated = JobRoleAISchema.safeParse(rawParsed);
    if (!validated.success) {
      console.error('[create-job-role] Zod error:', validated.error.flatten());
      return { ok: false, error: `AI response failed validation: ${validated.error.issues[0]?.message ?? 'unknown'}` };
    }
    parsed = validated.data;
  } catch (err) {
    console.error('[create-job-role] Gemini error:', err);
    return { ok: false, error: 'AI parsing failed — check your Gemini API key and try again.' };
  }

  const { metadata, rubric } = parsed;
  const normalisedRubric = normaliseWeights(rubric);
  const workMode = normaliseWorkMode(metadata.workMode);

  // Use extracted job code if it matches format, otherwise use generated one
  const jobCodeRaw = metadata.jobCode?.trim() ?? '';
  const jobCode = /^JC#\d+$/.test(jobCodeRaw) ? jobCodeRaw : nextCode;

  // ── 3. Insert job + rubric atomically ──
  let jobId: string;
  try {
    const [job] = await db.insert(jobs).values({
      tenantId: session.user.tenantId,
      createdBy: session.user.id ?? undefined,
      title: metadata.title,
      code: jobCode,
      location: metadata.location || 'Remote',
      workMode,
      experience: metadata.experienceRequired ?? null,
      contractDuration: metadata.contractDuration ?? null,
      description: jdText.trim(),
      status: 'Active',
    }).returning({ id: jobs.id });

    if (!job) return { ok: false, error: 'Failed to create job record.' };
    jobId = job.id;

    await db.insert(rubricCompetencies).values(
      normalisedRubric.map((r, i) => ({
        jobId,
        name: r.name,
        level: r.level,
        weight: r.weightPercentage,
        sortOrder: i,
        mandatory: r.mandatory,
      }))
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    const code = (err as { cause?: { code?: string } })?.cause?.code;
    if (code === '23505' || msg.includes('unique') || msg.includes('duplicate')) {
      return { ok: false, error: `Job code ${jobCode} already exists — please try again.` };
    }
    console.error('[create-job-role] DB error:', err);
    return { ok: false, error: 'Database error — please try again.' };
  }

  return { ok: true, jobId };
}
