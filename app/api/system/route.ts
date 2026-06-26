import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SystemConfigSchema = z.object({
  modelEngine: z.enum(['Gemini 1.5 Pro', 'Gemini 1.5 Flash']).optional(),
  maintenanceMode: z.boolean().optional(),
});

export async function GET() {
  return NextResponse.json({ modelEngine: 'Gemini 1.5 Pro', maintenanceMode: false });
}

export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = SystemConfigSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', issues: result.error.flatten() }, { status: 422 });
  }

  // TODO: persist to DB via systemSettings table
  return NextResponse.json({ updated: result.data });
}
