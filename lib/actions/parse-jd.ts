'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const CriteriaSchema = z.array(
  z.object({
    name: z.string().min(1),
    weightPercentage: z.number().int().min(1).max(100),
    level: z.enum(['CORE', 'IMPORTANT', 'BONUS']),
    mandatory: z.boolean(),
  })
).min(4).max(6);

export type ParsedCriterion = z.infer<typeof CriteriaSchema>[number];

type ParseResult =
  | { ok: true; criteria: ParsedCriterion[] }
  | { ok: false; error: string };

export async function parseJobDescription(jdText: string): Promise<ParseResult> {
  if (!jdText || jdText.trim().length < 30) {
    return { ok: false, error: 'Job description is too short to parse.' };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    generationConfig: { responseMimeType: 'application/json' },
    systemInstruction: `You are a ruthless technical recruiter. Read the provided Job Description text and identify the 4 to 6 most critical, highly specific competencies required. Do NOT use generic terms like "Technical Skills". Extract specific domains like "React.js Architecture" or "Oracle MDM". Weights must sum to exactly 100. CORE competencies are must-haves; IMPORTANT are strong preferences; BONUS are differentiators. mandatory=true only for CORE competencies that are absolute deal-breakers.`,
  });

  const prompt = `Extract the 4–6 most critical competencies from this job description.

Return ONLY a valid JSON array matching this schema exactly:
[
  {
    "name": "<specific technology or domain>",
    "weightPercentage": <integer, all must sum to 100>,
    "level": "<CORE | IMPORTANT | BONUS>",
    "mandatory": <true | false>
  }
]

JOB DESCRIPTION:
---
${jdText.slice(0, 3000)}
---`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract a JSON array substring
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      if (start === -1 || end === -1) return { ok: false, error: 'AI returned unrecognisable output — please try again.' };
      parsed = JSON.parse(raw.slice(start, end + 1));
    }

    // Gemini sometimes wraps the array in an object e.g. { "criteria": [...] }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const arrayValue = Object.values(obj).find(Array.isArray);
      if (arrayValue) parsed = arrayValue;
    }

    const validated = CriteriaSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('[parse-jd] Zod error:', validated.error.flatten());
      return { ok: false, error: `AI returned unexpected format — please try again.` };
    }

    // Normalise weights to sum exactly to 100
    const raw_sum = validated.data.reduce((s, c) => s + c.weightPercentage, 0);
    const criteria = validated.data.map((c, i, arr) => ({
      ...c,
      weightPercentage: i < arr.length - 1
        ? Math.round((c.weightPercentage / raw_sum) * 100)
        : 0,
    }));
    const partial = criteria.slice(0, -1).reduce((s, c) => s + c.weightPercentage, 0);
    criteria[criteria.length - 1]!.weightPercentage = 100 - partial;

    return { ok: true, criteria };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[parse-jd] error:', msg);
    if (msg.includes('API_KEY') || msg.includes('api key') || msg.includes('403')) {
      return { ok: false, error: 'Gemini API key is invalid or missing — check GEMINI_API_KEY.' };
    }
    if (msg.includes('quota') || msg.includes('429')) {
      return { ok: false, error: 'Gemini quota exceeded — please wait a moment and try again.' };
    }
    return { ok: false, error: `AI parsing failed: ${msg.slice(0, 120)}` };
  }
}
