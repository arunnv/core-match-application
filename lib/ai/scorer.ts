import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { candidates, rubricCompetencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
  try {
    // Fetch competencies
    const comps = await db
      .select()
      .from(rubricCompetencies)
      .where(eq(rubricCompetencies.jobId, jobId))
      .orderBy(rubricCompetencies.sortOrder);

    const competencyList = comps
      .map((c) => `- ${c.name} (weight: ${Math.round(c.weight)}%, level: ${c.level})`)
      .join('\n');

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text) as ScoredResult;

    await db.update(candidates).set({
      name: parsed.name || 'Unknown',
      email: parsed.email ?? null,
      currentRole: parsed.currentRole ?? null,
      location: parsed.location ?? null,
      experience: parsed.experience ?? null,
      score: Math.max(0, Math.min(100, parsed.score)),
      tags: parsed.tags ?? [],
      aiHead: parsed.aiHead ?? '',
      aiReasoning: parsed.aiReasoning ?? [],
      capabilities: parsed.capabilities ?? [],
      gaps: parsed.gaps ?? [],
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
  }
}
