import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { candidates, rubricCompetencies, jobs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

type ScoredResult = {
  name: string;
  email: string | null;
  currentRole: string | null;
  location: string | null;
  experience: string | null;
  score: number;
  tags: string[];
  aiHead: string;
  aiReasoning: string[];
  capabilities: { label: string; note: string; w: number }[];
  gaps: { label: string; note: string; w: number }[];
};

export async function scoreCandidate(candidateId: string, resumeText: string, jobId: string) {
  console.log(`[scorer] Starting score for candidate ${candidateId}, job ${jobId}`);
  try {
    const comps = await db
      .select()
      .from(rubricCompetencies)
      .where(eq(rubricCompetencies.jobId, jobId))
      .orderBy(rubricCompetencies.sortOrder);

    console.log(`[scorer] Found ${comps.length} competencies for job ${jobId}`);

    const competencyList = comps.length > 0
      ? comps.map((c) => `- ${c.name} (weight: ${Math.round(c.weight)}%, level: ${c.level})`).join('\n')
      : '- General fit (weight: 100%, level: CORE)';

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
    });

    const prompt = `You are an expert recruiter. Evaluate the following resume against the job competency rubric and return a structured JSON score.

COMPETENCY RUBRIC:
${competencyList}

RESUME TEXT:
${resumeText}

Return a JSON object with EXACTLY this structure (no extra fields):
{
  "name": "candidate full name extracted from resume",
  "email": "email address or null",
  "currentRole": "most recent job title or null",
  "location": "city/country or null",
  "experience": "years of experience summary e.g. '7 yrs' or null",
  "score": <integer 0-100 weighted match score>,
  "tags": ["up to 4 key skill tags from resume"],
  "aiHead": "one sentence headline summarizing the candidate's fit",
  "aiReasoning": [
    "first paragraph of reasoning (2-3 sentences)",
    "second paragraph of reasoning (2-3 sentences)"
  ],
  "capabilities": [
    { "label": "<competency name>", "note": "<evidence from resume>", "w": <weight as integer> }
  ],
  "gaps": [
    { "label": "<competency name>", "note": "<what is missing>", "w": <weight as integer> }
  ]
}

Rules:
- score must be a weighted calculation based on how well the resume matches each competency
- Only include competencies the candidate clearly demonstrates in capabilities
- Only include competencies with clear gaps in gaps
- capabilities + gaps should collectively cover all ${comps.length} competencies
- Respond with ONLY the JSON object, no markdown`;

    console.log(`[scorer] Calling Gemini for candidate ${candidateId}`);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(`[scorer] Gemini responded, parsing JSON...`);
    const parsed = JSON.parse(text) as ScoredResult;

    // Normalize capabilities/gaps — Gemini sometimes returns strings instead of objects
    const normalizeItems = (items: unknown[]): { label: string; note: string; w: number }[] =>
      items.map((item) => {
        if (typeof item === 'string') return { label: item, note: '', w: 0 };
        const obj = item as Record<string, unknown>;
        return {
          label: String(obj.label ?? obj.name ?? ''),
          note: String(obj.note ?? obj.description ?? obj.evidence ?? ''),
          w: Number(obj.w ?? obj.weight ?? 0),
        };
      });

    console.log(`[scorer] Parsed score: ${parsed.score}, updating DB...`);
    await db.update(candidates).set({
      name: parsed.name || 'Unknown',
      email: parsed.email ?? null,
      currentRole: parsed.currentRole ?? null,
      location: parsed.location ?? null,
      experience: parsed.experience ?? null,
      score: Math.max(0, Math.min(100, parsed.score)),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      aiHead: parsed.aiHead ?? '',
      aiReasoning: Array.isArray(parsed.aiReasoning) ? parsed.aiReasoning : [],
      capabilities: normalizeItems(Array.isArray(parsed.capabilities) ? parsed.capabilities : []),
      gaps: normalizeItems(Array.isArray(parsed.gaps) ? parsed.gaps : []),
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
