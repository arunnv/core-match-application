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
const STATUSES = ['Active', 'Draft', 'Archived'] as const;
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
  const defaultCode = `JC#${String(105 + existingCount).padStart(5, '0')}`;
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [parseText, setParseText] = useState('');
  const [form, setForm] = useState({
    title: '',
    code: defaultCode,
    location: '',
    experience: '',
    contractDuration: '',
    description: '',
    clientPackage: '',
    ourPackage: '',
    workMode: 'Remote' as typeof WORK_MODES[number],
    status: 'Active' as typeof STATUSES[number],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [aiPending, startAiTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const clientPkg = parseInt(form.clientPackage) || 0;
  const ourPkg = parseInt(form.ourPackage) || 0;
  const margin = clientPkg > 0 && ourPkg > 0 ? clientPkg - ourPkg : null;
  const marginPct = clientPkg > 0 && ourPkg > 0 ? (((clientPkg - ourPkg) / clientPkg) * 100).toFixed(1) : null;

  const isLoading = submitting || aiPending;
  const canCreate = mode === 'ai' ? parseText.trim().length > 30 : form.title.trim().length > 0 && form.code.trim().length > 0 && !codeError && Object.keys(fieldErrors).length === 0;

  function setFieldError(field: string, msg: string | null) {
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (msg) next[field] = msg;
      else delete next[field];
      return next;
    });
  }

  function validatePackage(field: 'clientPackage' | 'ourPackage', value: string) {
    if (!value) { setFieldError(field, null); return; }
    const n = parseInt(value);
    if (isNaN(n) || n <= 0) { setFieldError(field, 'Must be a positive number'); return; }
    setFieldError(field, null);
  }

  async function checkCodeDuplicate(code: string) {
    const trimmed = code.trim();
    if (!trimmed) { setCodeError(null); return; }
    try {
      const res = await fetch(`/api/jobs/check-code?code=${encodeURIComponent(trimmed)}`);
      const data = await res.json() as { exists: boolean };
      setCodeError(data.exists ? `Job code "${trimmed}" already exists.` : null);
    } catch {
      // silently ignore network errors — submit will catch duplicate
    }
  }

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

    if (!form.title.trim() || !form.code.trim()) return;
    const payload = {
      title: form.title.trim(),
      code: form.code.trim(),
      location: form.location.trim() || form.workMode,
      experience: form.experience.trim() || '',
      contractDuration: form.contractDuration.trim() || '',
      description: form.description.trim() || '',
      clientPackage: form.clientPackage ? parseInt(form.clientPackage) : null,
      ourPackage: form.ourPackage ? parseInt(form.ourPackage) : null,
      workMode: form.workMode,
      status: form.status,
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
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">ROLE TITLE <span className="text-destructive">*</span></div>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Staff Backend Engineer"
                    className="font-mono text-[13px]"
                  />
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">JOB CODE <span className="text-destructive">*</span></div>
                  <Input
                    value={form.code}
                    onChange={(e) => { setForm((f) => ({ ...f, code: e.target.value })); setCodeError(null); }}
                    onBlur={(e) => checkCodeDuplicate(e.target.value)}
                    placeholder="e.g. JC#00101"
                    className={cn('font-mono text-[13px]', codeError && 'border-destructive focus-visible:ring-destructive')}
                  />
                  {codeError && <p className="text-[11px] text-destructive mt-1">{codeError}</p>}
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">STATUS</div>
                  <div className="flex gap-1.5">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setForm((f) => ({ ...f, status: s }))}
                        className={cn(
                          'flex-1 text-center py-1.5 rounded-[9px] font-mono text-[11px] cursor-pointer border transition-all',
                          form.status === s
                            ? 'border-foreground bg-foreground text-background'
                            : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40'
                        )}
                      >{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">LOCATION</div>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Kochi, IN" className="font-mono text-[13px]" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">EXPERIENCE</div>
                  <Input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5–6 Yrs Exp" className="font-mono text-[13px]" />
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">CONTRACT DURATION</div>
                  <Input value={form.contractDuration} onChange={(e) => setForm((f) => ({ ...f, contractDuration: e.target.value }))} placeholder="e.g. 6+ Months" className="font-mono text-[13px]" />
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">CLIENT PACKAGE <span className="text-[9px] normal-case tracking-normal">(₹/month)</span></div>
                  <Input
                    value={form.clientPackage}
                    onChange={(e) => { setForm((f) => ({ ...f, clientPackage: e.target.value })); validatePackage('clientPackage', e.target.value); }}
                    onBlur={(e) => validatePackage('clientPackage', e.target.value)}
                    placeholder="e.g. 150000"
                    className={cn('font-mono text-[13px]', fieldErrors.clientPackage && 'border-destructive')}
                    type="number"
                    min={1}
                  />
                  {fieldErrors.clientPackage && <p className="text-[11px] text-destructive mt-1">{fieldErrors.clientPackage}</p>}
                </div>
                <div>
                  <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">OUR PACKAGE <span className="text-[9px] normal-case tracking-normal">(₹/month)</span></div>
                  <Input
                    value={form.ourPackage}
                    onChange={(e) => { setForm((f) => ({ ...f, ourPackage: e.target.value })); validatePackage('ourPackage', e.target.value); }}
                    onBlur={(e) => validatePackage('ourPackage', e.target.value)}
                    placeholder="e.g. 120000"
                    className={cn('font-mono text-[13px]', fieldErrors.ourPackage && 'border-destructive')}
                    type="number"
                    min={1}
                  />
                  {fieldErrors.ourPackage && <p className="text-[11px] text-destructive mt-1">{fieldErrors.ourPackage}</p>}
                </div>
                {margin !== null && (
                  <div className="col-span-2">
                    <div className={cn(
                      'flex items-center justify-between px-3 py-2.5 rounded-[10px] border font-mono text-[12px]',
                      margin >= 0
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                        : 'bg-destructive/10 border-destructive/30'
                    )}>
                      <span className="text-muted-foreground text-[10px] tracking-[.1em]">MARGIN</span>
                      <div className="flex items-center gap-3">
                        <span className={cn('font-semibold', margin >= 0 ? 'text-[var(--green-dark)]' : 'text-destructive')}>
                          {margin >= 0 ? '+' : ''}₹{Math.abs(margin).toLocaleString('en-IN')}
                        </span>
                        <span className={cn('text-[11px]', margin >= 0 ? 'text-[var(--green-dark)]' : 'text-destructive')}>
                          ({marginPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
              <div>
                <div className="text-[10px] tracking-[.14em] text-muted-foreground mb-2">DESCRIPTION</div>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional job description or notes…"
                  rows={3}
                  className="w-full border border-border rounded-xl p-3 text-[12.5px] leading-relaxed text-foreground bg-muted/40 outline-none resize-y box-border focus:border-muted-foreground/40 transition-colors font-mono"
                />
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
            <span className={cn('w-1.5 h-1.5 rounded-full', mode === 'manual' && form.status === 'Draft' ? 'bg-amber-400' : mode === 'manual' && form.status === 'Archived' ? 'bg-muted-foreground' : 'bg-[var(--green)]')} />
            Created as {mode === 'manual' ? form.status : 'Active'}
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
