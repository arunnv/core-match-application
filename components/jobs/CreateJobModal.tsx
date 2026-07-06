'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createJobRoleAction } from '@/lib/actions/create-job-role';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Job = {
  id: string;
  code: string;
  title: string;
  location: string;
  experience: string;
  status: 'Active' | 'Archived' | 'Draft';
  scored: number;
  processing: number;
};

type Props = {
  onClose: () => void;
  onCreate: (job: Job) => void;
  existingCount: number;
};

const WORK_MODES = ['Remote', 'Hybrid', 'On-Site'] as const;
const EXAMPLE_JD = `🚀 Hiring Now | Oracle CPQ Developer
📌 Job Code: JC#00103
📍 Location: Remote
🏢 Work Mode: Remote
⏳ Contract Duration: 6+ Months
👨‍💻 Experience Required: 4–5 Years

About the Role
We are looking for an experienced Oracle CPQ Developer with strong expertise in Oracle CPQ (Big Machines), BML, BMQL, and web technologies.

Must-Have Skills
✅ Oracle CPQ (Big Machines)
✅ BML & BMQL
✅ JavaScript`;

function parseJD(text: string) {
  const grab = (re: RegExp) => { const m = text.match(re); return m ? m[1].trim() : ''; };
  let title = grab(/Hiring Now\s*\|\s*(.+)/i);
  if (!title) {
    const first = text.split('\n').map((s) => s.trim()).filter(Boolean)[0] ?? '';
    title = first.replace(/[^\x20-\x7E]+/g, '').replace(/Hiring Now\s*\|?/i, '').trim();
  }
  const descMatch = text.match(/About the Role\s*\n([\s\S]+)/i);
  const description = descMatch ? descMatch[1].trim() : '';
  return {
    title,
    code: grab(/Job Code:\s*(JC#\d+)/i) || grab(/(JC#\d+)/),
    loc: grab(/Location:\s*(.+)/i),
    exp: grab(/Experience Required:\s*(.+)/i),
    contractDuration: grab(/Contract Duration:\s*(.+)/i),
    description,
  };
}

export default function CreateJobModal({ onClose, onCreate, existingCount }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [parseText, setParseText] = useState(EXAMPLE_JD);
  const [form, setForm] = useState({ title: '', location: '', experience: '', workMode: 'Remote' as typeof WORK_MODES[number] });
  const [submitting, setSubmitting] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextCode = `JC#${String(105 + existingCount).padStart(5, '0')}`;
  const isLoading = submitting || aiPending;
  const canCreate = mode === 'ai' ? parseText.trim().length > 30 : form.title.trim().length > 0;

  const handleSubmit = async () => {
    if (!canCreate || isLoading) return;
    setError(null);

    if (mode === 'ai') {
      startAiTransition(async () => {
        const result = await createJobRoleAction(parseText);
        if (!result.ok) { setError(result.error); return; }
        onClose();
        router.push(`/jobs/${result.jobId}/rubric`);
      });
      return;
    }

    if (!form.title.trim()) return;
    const payload = {
      title: form.title.trim(),
      location: form.location.trim() || form.workMode,
      experience: form.experience.trim() || '',
      workMode: form.workMode,
      status: 'Active',
      code: nextCode,
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { job?: Job; error?: string };
      if (!res.ok) {
        if (res.status === 409 || (data.error as string)?.toLowerCase().includes('duplicate') || (data.error as string)?.toLowerCase().includes('unique')) {
          setError(`Job code ${payload.code} already exists — please use a different code.`);
        } else {
          setError((data.error as string) ?? 'Failed to create job. Please try again.');
        }
        return;
      }
      if (data.job) onCreate(data.job);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise relative flex flex-col w-full max-w-[560px] max-h-[90vh] bg-card border border-border rounded-[18px] overflow-hidden"
        style={{ boxShadow: '0 20px 40px rgba(0,0,0,.18)' }}
      >
        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="text-[11px] tracking-[.2em] text-muted-foreground mb-1.5">COREMATCH / NEW ROLE</div>
            <div className="font-semibold text-[19px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>Create Job Role</div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8 rounded-[10px] font-mono text-[15px]">✕</Button>
        </div>

        {/* Mode toggle */}
        <div className="px-6 pt-4">
          <div className="flex gap-1 bg-muted border border-border rounded-[11px] p-0.5">
            {(['ai', 'manual'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 rounded-[8px] py-2 text-[12px] font-mono cursor-pointer border-none transition-all',
                  mode === m ? 'bg-card text-foreground shadow-sm' : 'bg-transparent text-muted-foreground'
                )}
              >
                {m === 'ai' && (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.6 3.9 4.2.3-3.2 2.7 1 4.1L8 10.9 4.4 12.6l1-4.1L2.2 5.7l4.2-.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                )}
                {m === 'ai' ? 'AI Auto-Parse' : 'Manual Entry'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
          {mode === 'ai' ? (
            <div>
              <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">PASTE JOB DESCRIPTION OR REQUIREMENT TEXT</div>
              <textarea
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder="Paste a job post, email or requirement spec…"
                className="w-full min-h-[180px] border border-border rounded-xl p-3.5 text-[12.5px] leading-relaxed text-foreground bg-muted/40 outline-none resize-y box-border focus:border-muted-foreground/40 transition-colors"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.6 3.9 4.2.3-3.2 2.7 1 4.1L8 10.9 4.4 12.6l1-4.1L2.2 5.7l4.2-.3z" stroke="var(--green)" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                AI extracts metadata + builds rubric in one step. You'll land on the rubric page to review.
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">ROLE TITLE</div>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Staff Backend Engineer"
                  className="font-mono text-[13px]"
                />
              </div>
              <div className="flex items-center gap-2.5 bg-muted/40 border border-dashed border-border rounded-[10px] px-3 py-2.5">
                <span className="text-[10px] tracking-[.14em] text-muted-foreground">JOB CODE</span>
                <span className="font-semibold text-[14px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{nextCode}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">auto-assigned</span>
              </div>
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">LOCATION</div>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Kochi, IN" className="font-mono text-[13px]" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">EXPERIENCE</div>
                  <Input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5–6 Yrs Exp" className="font-mono text-[13px]" />
                </div>
              </div>
              <div>
                <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">WORK MODE</div>
                <div className="flex gap-2">
                  {WORK_MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm((f) => ({ ...f, workMode: m }))}
                      className={cn(
                        'flex-1 text-center py-2 rounded-[9px] font-mono text-[12px] cursor-pointer border transition-all',
                        form.workMode === m
                          ? 'border-green-300 bg-green-50 dark:bg-green-950/30 text-[var(--green)] dark:border-green-800'
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40'
                      )}
                    >{m}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-[9px] text-[12px] text-destructive">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)]" />
            Created as Active
          </span>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={onClose} className="font-mono text-[12.5px]">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={!canCreate || isLoading}
              className="font-mono text-[12.5px] gap-1.5"
            >
              {isLoading && <span className="spin-anim w-[11px] h-[11px] border-2 border-background/30 border-t-background rounded-full inline-block" />}
              {aiPending ? 'AI generating…' : submitting ? 'Creating…' : mode === 'ai' ? 'Parse & create role' : 'Create job role'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
