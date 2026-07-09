import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { candidates, rubricCompetencies, jobs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type EvaluationRow = {
  competency: string;
  level: string;
  weight_percentage: number;
  evidence_quote: string | null;
  competency_score_0_to_100: number;
  weighted_points_earned: number;
  reasoning: string;
};

type ScoredResult = {
  candidate_metadata: {
    name: string;
    email: string | null;
    phone: string | null;
    currentRole: string | null;
    location: string | null;
    years_experience: number | null;
  };
  evaluations: EvaluationRow[];
  aiHead: string;
  aiReasoning: string;
};

/**
 * Compute final score entirely server-side from per-competency data.
 * Never trust the LLM's own aggregate — it inflates.
 *
 * Algorithm:
 *  1. For each competency: earned = weight * (competency_score / 100)
 *  2. For each CORE competency with no evidence: additional penalty = weight * 0.75
 *     (total CORE miss cost = weight * 1.75 against the theoretical maximum)
 *  3. Floor at 0, round, cap at 100.
 */
function computeScore(evals: EvaluationRow[]): number {
  let earned = 0;
  let corePenalty = 0;

  for (const e of evals) {
    const w = Math.max(0, e.weight_percentage);
    const s = Math.max(0, Math.min(100, e.competency_score_0_to_100));
    earned += (w * s) / 100;

    if (e.level === 'CORE' && (e.evidence_quote == null || e.evidence_quote === '') && s === 0) {
      corePenalty += w * 0.75;
    }
  }

  return Math.max(0, Math.min(100, Math.round(earned - corePenalty)));
}

export async function scoreCandidate(candidateId: string, resumeText: string, jobId: string) {
  console.log(`[scorer] Starting score for candidate ${candidateId}, job ${jobId}`);
  try {
    const [comps, job] = await Promise.all([
      db.select().from(rubricCompetencies).where(eq(rubricCompetencies.jobId, jobId)).orderBy(rubricCompetencies.sortOrder),
      db.select({ title: jobs.title, description: jobs.description }).from(jobs).where(eq(jobs.id, jobId)).limit(1).then(r => r[0] ?? null),
    ]);

    console.log(`[scorer] Found ${comps.length} competencies for job ${jobId} (${job?.title ?? 'unknown'})`);

    const rubricItems = comps.length > 0
      ? comps.map((c) => ({ name: c.name, weight_percentage: Math.round(c.weight), level: c.level }))
      : [{ name: 'General fit', weight_percentage: 100, level: 'CORE' }];

    const totalWeight = rubricItems.reduce((s, r) => s + r.weight_percentage, 0);

    const jobTitle = job?.title ?? 'the target role';
    const jobDescription = job?.description ? `\nJOB DESCRIPTION:\n${job.description.slice(0, 1200)}` : '';

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are a strict technical hiring auditor evaluating a resume against a specific target role.
The rubric competencies below are the ONLY skills that matter. Your job is to find hard evidence — or confirm its absence.

TARGET JOB ROLE: ${jobTitle}${jobDescription}

═══════════════════════════════════════════════
ABSOLUTE RULES — violating any rule invalidates the evaluation:

RULE 1 — ZERO SCORE WITHOUT QUOTE
  competency_score_0_to_100 MUST be 0 and evidence_quote MUST be null
  if the candidate does not explicitly name this technology, tool, or skill
  somewhere in their resume. General programming ability does NOT count.

RULE 2 — NO ADJACENT TECHNOLOGY INFERENCE
  Example: knowing Java does NOT imply Oracle. Knowing SQL does NOT imply Oracle MDM/C2M.
  Knowing "utilities billing" does NOT imply Oracle Utilities MDM unless explicitly stated.
  If the exact product/technology name is absent, score is 0.

RULE 3 — VERBATIM QUOTE ONLY
  evidence_quote must be copied character-for-character from the resume text.
  Do not paraphrase. Do not summarise. If you cannot copy an exact phrase
  that names the technology, set evidence_quote to null and score to 0.

RULE 4 — SCORE SCALE (only applies when evidence_quote is non-null)
  0   = no evidence (evidence_quote must be null)
  40  = technology mentioned once with no context
  60  = technology used in a project or role with some detail
  80  = technology used as a primary tool with measurable outcomes
  100 = deep expertise: multiple projects, technical depth, leadership or architecture

RULE 5 — EVERY RUBRIC COMPETENCY MUST APPEAR IN evaluations EXACTLY ONCE
  The rubric has ${rubricItems.length} competencies. evaluations must have exactly ${rubricItems.length} objects.

RULE 6 — aiHead AND aiReasoning MUST BE WRITTEN IN THE CONTEXT OF "${jobTitle}" ONLY
  Do NOT praise the candidate for skills irrelevant to the target job.
  If the job is "${jobTitle}" and the candidate's background is in a completely different technology,
  the summary MUST explicitly state they lack the required skills for THIS role.
  Example: a MuleSoft developer applying for an Oracle MDM role → aiHead must say they lack Oracle MDM,
  not that they are strong in MuleSoft. Their MuleSoft skills are irrelevant here.
═══════════════════════════════════════════════

COMPETENCY RUBRIC FOR "${jobTitle}" (total weight = ${totalWeight}%):
${JSON.stringify(rubricItems, null, 2)}

RESUME TEXT:
---
${resumeText}
---

Return ONLY this JSON (no markdown, no extra fields):
{
  "candidate_metadata": {
    "name": "full name extracted from resume",
    "email": "email or null",
    "phone": "phone number or null",
    "currentRole": "most recent job title or null",
    "location": "city, country or null",
    "years_experience": <integer total years of professional experience, or null>
  },
  "evaluations": [
    {
      "competency": "<exact competency name from rubric>",
      "level": "<CORE|IMPORTANT|BONUS — copy from rubric>",
      "weight_percentage": <copy from rubric>,
      "evidence_quote": "<verbatim text copied from resume, or null — if the quote contains double-quote characters, escape them as \\">",
      "competency_score_0_to_100": <0 if evidence_quote is null, else 40/60/80/100 per scale above>,
      "weighted_points_earned": <weight_percentage * competency_score_0_to_100 / 100, 1 decimal>,
      "reasoning": "<one sentence: why this score for THIS role, naming the specific evidence or its absence>"
    }
  ],
  "aiHead": "<one sentence strictly about fit for ${jobTitle}: if critical CORE skills are missing, say so bluntly — do not mention unrelated strengths>",
  "aiReasoning": "<2-3 sentences strictly about fit for ${jobTitle}: what evidence exists for the required skills, what is absent, and a clear hire/no-hire signal for this specific role>"
}`;


    console.log(`[scorer] Calling Gemini for candidate ${candidateId}`);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    console.log(`[scorer] Gemini responded (${raw.length} chars), parsing...`);

    // Strip markdown fences Gemini occasionally adds despite responseMimeType
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    let parsed: ScoredResult;
    try {
      parsed = JSON.parse(jsonStr) as ScoredResult;
    } catch (parseErr) {
      // Last resort: strip the response to just the outermost JSON object
      const start = jsonStr.indexOf('{');
      const end = jsonStr.lastIndexOf('}');
      if (start === -1 || end === -1) throw parseErr;
      parsed = JSON.parse(jsonStr.slice(start, end + 1)) as ScoredResult;
    }

    const meta = parsed.candidate_metadata ?? {};
    let evals: EvaluationRow[] = Array.isArray(parsed.evaluations) ? parsed.evaluations : [];

    // Enforce RULE 1 server-side: if evidence_quote is null/empty, force score to 0
    evals = evals.map((e) => {
      const noEvidence = e.evidence_quote == null || String(e.evidence_quote).trim() === '';
      const score = noEvidence ? 0 : Math.max(0, Math.min(100, e.competency_score_0_to_100));
      const earned = parseFloat(((e.weight_percentage * score) / 100).toFixed(1));
      return {
        ...e,
        evidence_quote: noEvidence ? null : e.evidence_quote,
        competency_score_0_to_100: score,
        weighted_points_earned: earned,
      };
    });

    // Compute score ourselves — never trust the LLM's aggregate
    const finalScore = computeScore(evals);

    console.log(`[scorer] Server-computed score: ${finalScore} (${evals.length} competencies)`);
    evals.forEach((e) => {
      console.log(`[scorer]   ${e.competency}: ${e.competency_score_0_to_100} × ${e.weight_percentage}% = ${e.weighted_points_earned} pts | evidence: ${e.evidence_quote ? '"' + e.evidence_quote.slice(0, 60) + '…"' : 'NULL'}`);
    });

    // Derive capabilities/gaps from verified evals
    const capabilities = evals
      .filter((e) => e.evidence_quote != null && e.competency_score_0_to_100 > 0)
      .map((e) => ({ label: e.competency, note: e.evidence_quote!, w: e.weight_percentage }));

    const gaps = evals
      .filter((e) => e.evidence_quote == null || e.competency_score_0_to_100 === 0)
      .map((e) => ({ label: e.competency, note: e.reasoning, w: e.weight_percentage }));

    // Tags: top evidenced competencies by earned weight
    const tags = evals
      .filter((e) => e.competency_score_0_to_100 >= 60)
      .sort((a, b) => b.weighted_points_earned - a.weighted_points_earned)
      .slice(0, 4)
      .map((e) => e.competency);

    const expYears = meta.years_experience;
    const experience = expYears != null ? `${expYears} yr${expYears === 1 ? '' : 's'}` : null;

    await db.update(candidates).set({
      name: String(meta.name || 'Unknown'),
      email: meta.email ?? null,
      phone: meta.phone ?? null,
      currentRole: meta.currentRole ?? null,
      location: meta.location ?? null,
      experience,
      score: finalScore,
      tags,
      aiHead: parsed.aiHead ?? '',
      aiReasoning: parsed.aiReasoning ? [parsed.aiReasoning] : [],
      capabilities,
      gaps,
      evaluations: evals,
      status: 'scored',
    }).where(eq(candidates.id, candidateId));

  } catch (err) {
    console.error(`[scorer] Failed to score candidate ${candidateId}:`, err);
    await db.update(candidates).set({
      status: 'scored',
      score: 0,
      aiHead: 'Scoring failed — please re-upload this resume.',
      aiReasoning: [],
    }).where(eq(candidates.id, candidateId));
  } finally {
    await updateJobCounts(jobId);
  }
}

export async function extractCandidateMeta(candidateId: string, resumeText: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });
    const prompt = `Extract contact and identity details from this resume. Return only a JSON object:
{
  "email": "email address or null",
  "phone": "phone number or null",
  "currentRole": "most recent job title or null",
  "location": "city, country or null",
  "years_experience": <integer total years of experience or null>,
  "tags": ["up to 5 key skills or technologies"]
}

RESUME:
${resumeText.slice(0, 3000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const meta = JSON.parse(raw) as {
      email?: string | null;
      phone?: string | null;
      currentRole?: string | null;
      location?: string | null;
      years_experience?: number | null;
      tags?: string[];
    };

    const expYears = meta.years_experience;
    await db.update(candidates).set({
      email: meta.email ?? null,
      phone: meta.phone ?? null,
      currentRole: meta.currentRole ?? null,
      location: meta.location ?? null,
      experience: expYears != null ? `${expYears} yr${expYears === 1 ? '' : 's'}` : null,
      tags: meta.tags ?? [],
      status: 'unmatched',
    }).where(eq(candidates.id, candidateId));
  } catch (err) {
    console.error(`[scorer] extractCandidateMeta failed for ${candidateId}:`, err);
    await db.update(candidates).set({ status: 'unmatched' }).where(eq(candidates.id, candidateId));
  }
}

async function updateJobCounts(jobId: string) {
  const [counts] = await db
    .select({
      scored: sql<number>`count(*) filter (where ${candidates.status} = 'scored')`,
      processing: sql<number>`count(*) filter (where ${candidates.status} = 'processing')`,
    })
    .from(candidates)
    .where(eq(candidates.jobId, jobId));

  if (counts) {
    await db.update(jobs).set({
      scored: Number(counts.scored),
      processing: Number(counts.processing),
    }).where(eq(jobs.id, jobId));
  }
}
