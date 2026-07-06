'use client';

import { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { parseJobDescription } from '@/lib/actions/parse-jd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Competency = {
  id: string;
  name: string;
  level: 'CORE' | 'IMPORTANT' | 'BONUS';
  weight: number;
  sortOrder: number;
  mandatory: boolean;
};

type DropState  = 'idle' | 'over' | 'uploading' | 'done' | 'error';
type SaveState  = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  jobId: string;
  jobTitle: string;
  jobCode: string;
  jobLocation: string;
  jobWorkMode: string;
  jobExperience: string;
  jobContractDuration: string;
  jobDescription: string;
  initialCompetencies: { id: string; name: string; level: string; weight: number; sortOrder: number; mandatory: boolean }[];
};

const LEVELS = ['CORE', 'IMPORTANT', 'BONUS'] as const;
const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

function levelStyle(level: string) {
  if (level === 'CORE')      return { color: '#059669', bg: 'bg-green-50 dark:bg-green-950/30', bd: 'border-green-200 dark:border-green-800', text: 'text-[#059669]' };
  if (level === 'IMPORTANT') return { color: '#0369a1', bg: 'bg-blue-50 dark:bg-blue-950/30', bd: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-400' };
  return                            { color: '#71717a', bg: 'bg-muted', bd: 'border-border', text: 'text-muted-foreground' };
}

function cycleLevel(current: string): 'CORE' | 'IMPORTANT' | 'BONUS' {
  return LEVELS[(LEVELS.indexOf(current as typeof LEVELS[number]) + 1) % LEVELS.length];
}

function uid() { return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn('relative w-8 h-[18px] rounded-[9px] border-none cursor-pointer shrink-0 transition-colors p-0', on ? 'bg-[var(--green)]' : 'bg-muted-foreground/30')}
    >
      <span className={cn('absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white transition-[left_.2s] shadow-sm', on ? 'left-[18px]' : 'left-[2px]')} />
    </button>
  );
}

export default function RubricBuilder({
  jobId, jobTitle, jobCode, jobLocation, jobWorkMode,
  jobExperience, jobContractDuration, jobDescription,
  initialCompetencies,
}: Props) {
  const router = useRouter();

  const [meta, setMeta] = useState({ title: jobTitle, code: jobCode, location: jobLocation, workMode: jobWorkMode, experience: jobExperience, contractDuration: jobContractDuration, description: jobDescription });
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState(meta);
  const [metaSaving, setMetaSaving] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const openEdit   = () => { setEditDraft(meta); setEditMode(true); };
  const cancelEdit = () => setEditMode(false);
  const saveMeta   = async () => {
    setMetaSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft) });
      if (res.ok) { setMeta(editDraft); setEditMode(false); router.refresh(); }
    } finally { setMetaSaving(false); }
  };

  const toComp = (c: Props['initialCompetencies'][number]): Competency => ({
    id: c.id, name: c.name,
    level: (LEVELS.includes(c.level as typeof LEVELS[number]) ? c.level : 'IMPORTANT') as Competency['level'],
    weight: Math.round(c.weight), sortOrder: c.sortOrder, mandatory: c.mandatory,
  });

  const [comps, setComps] = useState<Competency[]>(initialCompetencies.length > 0 ? initialCompetencies.map(toComp) : []);
  const total = comps.reduce((s, c) => s + c.weight, 0);
  const balanced = total === 100;

  const [aiParsing, startAiParse] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiParse = () => {
    const jd = meta.description.trim();
    if (!jd) { setAiError('Add a role description first (click EDIT INFO).'); return; }
    setAiError(null);
    startAiParse(async () => {
      const result = await parseJobDescription(jd);
      if (!result.ok) { setAiError(result.error); return; }
      setComps(result.criteria.map((c, i) => ({ id: uid(), name: c.name, level: c.level, weight: c.weightPercentage, sortOrder: i, mandatory: c.mandatory })));
      setSaveState('idle');
    });
  };

  const [saveState, setSaveState] = useState<SaveState>(initialCompetencies.length > 0 ? 'saved' : 'idle');
  const saveRubric = async () => {
    setSaveState('saving');
    try {
      const payload = comps.map((c, i) => ({ name: c.name, level: c.level, weight: c.weight, sortOrder: i, mandatory: c.mandatory }));
      const res = await fetch(`/api/jobs/${jobId}/rubric`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ competencies: payload }) });
      setSaveState(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveState('idle'), 2500);
    } catch { setSaveState('error'); }
  };

  const updateComp = (id: string, patch: Partial<Competency>) => { setComps((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c)); setSaveState('idle'); };
  const removeComp = (id: string) => { setComps((prev) => prev.filter((c) => c.id !== id)); setSaveState('idle'); };
  const addComp = () => {
    const leftover = Math.max(0, 100 - total);
    setComps((prev) => [...prev, { id: uid(), name: '', level: 'IMPORTANT', weight: leftover > 0 ? leftover : 10, sortOrder: prev.length, mandatory: false }]);
    setSaveState('idle');
  };

  const [dropState, setDropState]     = useState<DropState>('idle');
  const [uploadError, setUploadError]  = useState<string | null>(null);
  const [addedCount, setAddedCount]    = useState(0);
  const [stats, setStats]              = useState({ total: 0, processing: 0, scored: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`/api/jobs/${jobId}/candidates`);
      if (!res.ok) return;
      const data = await res.json() as { candidates: { status: string }[] };
      const all  = data.candidates ?? [];
      setStats({ total: all.length, processing: all.filter((c) => c.status === 'processing').length, scored: all.filter((c) => c.status === 'scored').length });
    } catch { /* noop */ }
  }, [jobId]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => ['pdf', 'doc', 'docx', 'txt'].includes(f.name.split('.').pop()?.toLowerCase() ?? ''));
    if (!arr.length) { setUploadError('No supported files.'); setDropState('error'); return; }
    if (arr.length > 20) { setUploadError('Max 20 files.'); setDropState('error'); return; }
    setDropState('uploading'); setUploadError(null);
    const form = new FormData();
    arr.forEach((f) => form.append('files', f));
    try {
      const res  = await fetch(`/api/jobs/${jobId}/candidates/upload`, { method: 'POST', body: form });
      const data = await res.json() as { created?: string[]; total?: number; error?: string };
      if (!res.ok) { setUploadError(data.error ?? 'Upload failed.'); setDropState('error'); return; }
      setAddedCount(data.total ?? arr.length); setDropState('done');
      void fetchStats();
      setTimeout(() => setDropState('idle'), 4000);
    } catch { setUploadError('Network error.'); setDropState('error'); }
  };

  const handleDrop      = (e: React.DragEvent)                    => { e.preventDefault(); void uploadFiles(e.dataTransfer.files); };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; };

  const saveDisabled = saveState === 'saving' || !balanced || comps.length === 0 || comps.some((c) => !c.name.trim());
  const saveBtnVariant = saveState === 'saved' ? 'default' : saveState === 'error' ? 'destructive' : 'default';
  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? 'Save failed' : 'Save Rubric';

  const dropBg = dropState === 'over' ? 'bg-green-50/60 dark:bg-green-950/20' : dropState === 'done' ? 'bg-green-50/60 dark:bg-green-950/20' : dropState === 'error' ? 'bg-red-50/50 dark:bg-red-950/20' : 'bg-muted/40';
  const dropBorderClass = dropState === 'over' ? 'border-[var(--green)]' : dropState === 'uploading' ? 'border-green-300' : dropState === 'done' ? 'border-green-400' : dropState === 'error' ? 'border-destructive/50' : 'border-muted-foreground/30';
  const dropTitle = dropState === 'over' ? 'Release to upload' : dropState === 'uploading' ? 'Uploading résumés…' : dropState === 'done' ? `${addedCount} résumé${addedCount !== 1 ? 's' : ''} added` : dropState === 'error' ? 'Upload failed' : 'Drop résumés here';
  const dropSub   = dropState === 'uploading' ? 'Extracting skills…' : dropState === 'done' ? 'Scoring in background.' : dropState === 'error' ? (uploadError ?? 'Please retry.') : 'Drag files or click to browse.';

  return (
    <div style={{ maxWidth: 1180, padding: '80px 48px 80px 96px' }} className="animate-rise">

      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-0">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] tracking-[.22em] text-muted-foreground mb-3.5">JOB ROLE / RUBRIC BUILDER</div>

          {editMode ? (
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {([
                  { label: 'JOB TITLE', key: 'title', span: true },
                  { label: 'JOB CODE', key: 'code' },
                  { label: 'LOCATION', key: 'location' },
                  { label: 'EXPERIENCE', key: 'experience' },
                  { label: 'CONTRACT DURATION', key: 'contractDuration' },
                ] as { label: string; key: keyof typeof editDraft; span?: boolean }[]).map(({ label, key, span }) => (
                  <div key={key} className={span ? 'col-span-2' : undefined}>
                    <div className="text-[9px] tracking-[.14em] text-muted-foreground mb-1">{label}</div>
                    <Input
                      value={editDraft[key]}
                      onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                      className="font-mono text-[12.5px]"
                    />
                  </div>
                ))}
              </div>
              <div className="mb-4">
                <div className="text-[9px] tracking-[.14em] text-muted-foreground mb-1">ROLE DESCRIPTION</div>
                <textarea
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={5}
                  className="w-full border border-border rounded-[8px] px-3 py-2.5 font-mono text-[12px] text-foreground bg-muted/40 outline-none resize-y box-border focus:border-muted-foreground/40 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={cancelEdit} className="font-mono text-[12px]">Cancel</Button>
                <Button onClick={saveMeta} disabled={metaSaving} className="font-mono text-[12px]">
                  {metaSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3.5">
                <h1
                  className="font-light leading-[1.02] tracking-[-0.02em] m-0 text-foreground"
                  style={{ fontFamily: 'var(--font-space)', fontSize: 'clamp(28px,3.5vw,46px)' }}
                  dangerouslySetInnerHTML={{ __html: meta.title.replace(/\s(\S+)$/, ' <span style="font-weight:600">$1</span>') }}
                />
                <Button variant="outline" size="sm" onClick={openEdit} className="mt-1.5 shrink-0 font-mono text-[10px] tracking-[.1em]">
                  EDIT INFO
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-0 mt-4 font-mono text-[11px] text-muted-foreground">
                {[meta.location, `Req #${meta.code}`, meta.experience ? `Exp: ${meta.experience}` : null, meta.contractDuration ? `Duration: ${meta.contractDuration}` : null]
                  .filter(Boolean).map((item, i, arr) => (
                    <span key={i} className="flex items-center">
                      <span className="px-2.5 py-0.5 bg-muted border border-border rounded-[6px]">{item}</span>
                      {i < arr.length - 1 && <span className="text-border mx-1.5 text-[14px]">·</span>}
                    </span>
                  ))}
              </div>
            </>
          )}

          {!editMode && (
            <div className="mt-3.5">
              <button
                onClick={() => setDescOpen((o) => !o)}
                className="flex items-center gap-1.5 bg-transparent border border-dashed border-muted-foreground/40 rounded-[7px] px-3 py-1.5 font-mono text-[10px] tracking-[.1em] text-muted-foreground cursor-pointer hover:border-muted-foreground/60 transition-colors"
              >
                <span className="text-[12px] leading-none">{descOpen ? '−' : '+'}</span>
                {descOpen ? 'HIDE ROLE DESCRIPTION' : 'VIEW ROLE DESCRIPTION'}
              </button>
              {descOpen && (
                <div className="mt-2.5 p-4 border border-dashed border-border rounded-[10px] bg-muted/40 text-[12.5px] leading-[1.7] text-muted-foreground font-mono whitespace-pre-wrap max-h-[240px] overflow-y-auto">
                  {meta.description || <span className="text-muted-foreground/60 italic">No description yet — click EDIT INFO to add one.</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rubric total */}
        <div className="text-right shrink-0 pt-7">
          <div className="text-[9.5px] tracking-[.18em] text-muted-foreground mb-2">RUBRIC TOTAL</div>
          <div className={cn('inline-flex items-baseline gap-0.5 px-4 py-2 rounded-xl border', balanced ? 'text-[var(--green)] bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800')}>
            <span className="font-bold text-[34px] leading-none" style={{ fontFamily: 'var(--font-space)' }}>{total}</span>
            <span className="text-[16px]" style={{ fontFamily: 'var(--font-space)' }}>%</span>
          </div>
          {!balanced && (
            <div className="text-[10px] text-amber-600 mt-1.5 font-mono">
              {total > 100 ? `−${total - 100}% over` : `+${100 - total}% remaining`}
            </div>
          )}
          {balanced && <div className="text-[10px] text-[var(--green)] mt-1.5 font-mono">balanced ✓</div>}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-8 mt-10 items-start" style={{ gridTemplateColumns: '1.55fr 1fr' }}>

        {/* Rubric card */}
        <div className="bg-card border border-border rounded-[18px] p-7 shadow-sm">
          <div className="flex items-center justify-between mb-1.5 gap-2.5 flex-wrap">
            <div>
              <div className="font-semibold text-[16px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>Weighted Competency Rubric</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Edit names inline · adjust weights · toggle mandatory · save when balanced.</div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAiParse}
                disabled={aiParsing}
                className={cn('font-mono text-[11px] gap-1.5', !aiParsing && 'text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 hover:bg-violet-100 dark:hover:bg-violet-950/50')}
              >
                {aiParsing ? (
                  <span className="spin-anim w-[11px] h-[11px] border-[1.5px] border-violet-300 border-t-violet-700 rounded-full inline-block" />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1l1.5 3 3.5.5-2.5 2.4.6 3.5L8 9l-3.1 1.4.6-3.5L3 4.5l3.5-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
                )}
                {aiParsing ? 'Parsing JD…' : 'AI Parse JD'}
              </Button>
              <Button variant="outline" size="sm" onClick={addComp} className="font-mono text-[11px]">+ Add</Button>
              <Button
                size="sm"
                onClick={saveRubric}
                disabled={saveDisabled}
                className={cn('font-mono text-[11px]', saveState === 'saved' && 'bg-[var(--green)] hover:bg-[var(--green-dark)] border-transparent', saveState === 'error' && 'bg-destructive hover:bg-destructive/90 border-transparent')}
              >
                {saveLabel}
              </Button>
            </div>
          </div>

          {aiError && (
            <div className="mt-2.5 px-3 py-2 bg-destructive/10 border border-destructive/30 rounded-[8px] text-[11px] text-destructive font-mono">{aiError}</div>
          )}

          {comps.length > 0 && (
            <div className="grid gap-2.5 items-center py-3.5 pb-1.5 border-b border-border" style={{ gridTemplateColumns: '1fr 90px 36px 56px 20px' }}>
              {['COMPETENCY', 'LEVEL', 'WT %', 'MANDATORY', ''].map((h) => (
                <div key={h} className="text-[9px] tracking-[.14em] text-muted-foreground font-mono">{h}</div>
              ))}
            </div>
          )}

          {comps.length === 0 && !aiParsing && (
            <div className="text-center py-9 text-muted-foreground">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="mx-auto mb-3 opacity-40">
                <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 13h24M11 8V6M21 8V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div className="text-[13px] font-medium text-foreground mb-1.5">No competencies yet</div>
              <div className="text-[11px]">Click <strong>AI Parse JD</strong> to auto-generate, or <strong>+ Add</strong> manually.</div>
            </div>
          )}

          {aiParsing && (
            <div className="text-center py-9 text-violet-600 dark:text-violet-400">
              <span className="spin-anim w-7 h-7 border-[3px] border-violet-200 border-t-violet-600 rounded-full inline-block mb-3" />
              <div className="text-[12px] font-mono">Gemini is reading the JD…</div>
            </div>
          )}

          <div className="flex flex-col">
            {comps.map((c, i) => {
              const ls = levelStyle(c.level);
              return (
                <div key={c.id} className="border-b border-border/50 py-3.5">
                  <div className="grid gap-2.5 items-center mb-2.5" style={{ gridTemplateColumns: '1fr 90px 36px 56px 20px' }}>
                    <input
                      value={c.name}
                      onChange={(e) => updateComp(c.id, { name: e.target.value })}
                      placeholder="Competency name…"
                      className={cn('border-0 border-b bg-transparent font-mono text-[13px] font-medium text-foreground outline-none py-0.5 w-full', c.name.trim() ? 'border-border' : 'border-destructive/50')}
                    />
                    <button
                      onClick={() => updateComp(c.id, { level: cycleLevel(c.level) })}
                      className={cn('text-[9px] tracking-[.12em] px-2 py-1 rounded-[6px] cursor-pointer font-mono whitespace-nowrap text-center border', ls.bg, ls.bd, ls.text)}
                    >
                      {c.level}
                    </button>
                    <div className="font-semibold text-[15px] text-foreground text-center" style={{ fontFamily: 'var(--font-space)', fontVariantNumeric: 'tabular-nums' }}>
                      {c.weight}
                    </div>
                    <div className="flex justify-center">
                      <Toggle on={c.mandatory} onChange={(v) => updateComp(c.id, { mandatory: v })} />
                    </div>
                    <button onClick={() => removeComp(c.id)} className="text-[13px] text-muted-foreground/50 bg-transparent border-none cursor-pointer p-0 leading-none hover:text-muted-foreground transition-colors" title="Remove">✕</button>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="range" min={1} max={100} value={c.weight}
                      onChange={(e) => updateComp(c.id, { weight: Number(e.target.value) })}
                      className="flex-1 h-1 cursor-ew-resize"
                      style={{ accentColor: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669' }}
                    />
                    <div className="w-7 h-1.5 rounded-full opacity-70 shrink-0" style={{ background: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {comps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="h-2 rounded-[5px] overflow-hidden flex bg-muted">
                {comps.map((c, i) => (
                  <div key={c.id} title={`${c.name}: ${c.weight}%`} className="h-full shrink-0 transition-[width_.3s_cubic-bezier(.22,1,.36,1)]" style={{ width: `${c.weight}%`, background: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669' }} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground font-mono">
                <span>{comps.length} competencies</span>
                {!balanced && <span className="text-amber-600">⚠ Weights must total 100% to save</span>}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileInput} />

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragEnter={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropState('idle'); }}
            onDrop={handleDrop}
            onClick={() => { if (['idle','error','done'].includes(dropState)) fileInputRef.current?.click(); }}
            className={cn('rounded-[18px] p-7 flex flex-col items-center text-center cursor-pointer border-2 border-dashed transition-all', dropBg, dropBorderClass)}
          >
            <div className={cn('w-[52px] h-[52px] rounded-[14px] flex items-center justify-center',
              dropState === 'over' || dropState === 'done' ? 'bg-[var(--green)] text-white' :
              dropState === 'error' ? 'bg-red-100 dark:bg-red-950/40 text-destructive' :
              'bg-muted text-muted-foreground',
              dropState === 'uploading' && 'spin-anim'
            )}>
              {dropState === 'done'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : dropState === 'error'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                : dropState !== 'uploading'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                : null}
            </div>
            <div className={cn('font-semibold text-[15px] mt-3.5', dropState === 'error' ? 'text-destructive' : 'text-foreground')} style={{ fontFamily: 'var(--font-space)' }}>{dropTitle}</div>
            <div className={cn('text-[11px] mt-1 leading-snug', dropState === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{dropSub}</div>
            {['idle', 'error'].includes(dropState) && (
              <div className="flex gap-1.5 mt-3.5">
                {['PDF', 'DOCX', 'DOC', 'TXT'].map((f) => (
                  <span key={f} className="text-[10px] text-muted-foreground bg-card border border-border px-1.5 py-0.5 rounded-[5px]">{f}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-card border border-border rounded-[18px] p-5.5">
            <div className="text-[11px] tracking-[.16em] text-muted-foreground mb-4">INGESTION QUEUE</div>
            <div className="flex flex-col gap-3.5">
              {[
                { label: 'Applicants Evaluated', value: stats.scored, highlight: false },
                { label: 'In pipeline',           value: stats.processing, highlight: stats.processing > 0 },
                { label: 'Total uploaded',         value: stats.total, highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-[13px] text-foreground">{label}</span>
                  <span className={cn('font-semibold text-[18px]', highlight ? 'text-[var(--green)]' : 'text-foreground')} style={{ fontFamily: 'var(--font-space)' }}>{value}</span>
                </div>
              ))}
            </div>
            <Button onClick={() => router.push(`/jobs/${jobId}/candidates`)} className="w-full mt-5 font-mono text-[12.5px] gap-2">
              View scored candidates <span className="text-[14px]">→</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
