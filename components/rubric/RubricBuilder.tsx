'use client';

import { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { parseJobDescription } from '@/lib/actions/parse-jd';

// ─── Types ───────────────────────────────────────────────────────────────────

type Competency = {
  id: string;
  name: string;
  level: 'CORE' | 'IMPORTANT' | 'BONUS';
  weight: number;   // integer 0-100
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

// ─── Constants ───────────────────────────────────────────────────────────────

const LEVELS = ['CORE', 'IMPORTANT', 'BONUS'] as const;
const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelStyle(level: string) {
  if (level === 'CORE')      return { color: '#059669', bg: '#ecfdf5', bd: '#a7f3d0' };
  if (level === 'IMPORTANT') return { color: '#0369a1', bg: '#eff6ff', bd: '#bfdbfe' };
  return                            { color: '#71717a', bg: '#f4f4f5', bd: '#e4e4e7' };
}

function cycleLevel(current: string): 'CORE' | 'IMPORTANT' | 'BONUS' {
  return LEVELS[(LEVELS.indexOf(current as typeof LEVELS[number]) + 1) % LEVELS.length];
}

function uid() { return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        position: 'relative', width: 32, height: 18, borderRadius: 9,
        background: on ? '#059669' : '#d4d4d8',
        border: 'none', cursor: 'pointer', flexShrink: 0,
        transition: 'background .2s',
        padding: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: on ? 16 : 2,
        width: 14, height: 14, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
      }} />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RubricBuilder({
  jobId, jobTitle, jobCode, jobLocation, jobWorkMode,
  jobExperience, jobContractDuration, jobDescription,
  initialCompetencies,
}: Props) {
  const router = useRouter();

  // ── Job meta ──
  const [meta, setMeta] = useState({ title: jobTitle, code: jobCode, location: jobLocation, workMode: jobWorkMode, experience: jobExperience, contractDuration: jobContractDuration, description: jobDescription });
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState(meta);
  const [metaSaving, setMetaSaving] = useState(false);
  const [descOpen, setDescOpen] = useState(false);

  const openEdit  = () => { setEditDraft(meta); setEditMode(true); };
  const cancelEdit = () => setEditMode(false);
  const saveMeta  = async () => {
    setMetaSaving(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editDraft) });
      if (res.ok) { setMeta(editDraft); setEditMode(false); router.refresh(); }
    } finally { setMetaSaving(false); }
  };

  // ── Competencies ──
  const toComp = (c: Props['initialCompetencies'][number]): Competency => ({
    id: c.id, name: c.name,
    level: (LEVELS.includes(c.level as typeof LEVELS[number]) ? c.level : 'IMPORTANT') as Competency['level'],
    weight: Math.round(c.weight),
    sortOrder: c.sortOrder,
    mandatory: c.mandatory,
  });

  const [comps, setComps] = useState<Competency[]>(
    initialCompetencies.length > 0 ? initialCompetencies.map(toComp) : []
  );

  // Derived: sum of weights
  const total = comps.reduce((s, c) => s + c.weight, 0);
  const balanced = total === 100;

  // ── AI parse ──
  const [aiParsing, startAiParse] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiParse = () => {
    const jd = meta.description.trim();
    if (!jd) { setAiError('Add a role description first (click EDIT INFO).'); return; }
    setAiError(null);
    startAiParse(async () => {
      const result = await parseJobDescription(jd);
      if (!result.ok) { setAiError(result.error); return; }
      setComps(result.criteria.map((c, i) => ({
        id: uid(), name: c.name,
        level: c.level, weight: c.weightPercentage,
        sortOrder: i, mandatory: c.mandatory,
      })));
      setSaveState('idle');
    });
  };

  // ── Save ──
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

  // ── Competency mutation helpers ──
  const updateComp = (id: string, patch: Partial<Competency>) => {
    setComps((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
    setSaveState('idle');
  };

  const removeComp = (id: string) => {
    setComps((prev) => prev.filter((c) => c.id !== id));
    setSaveState('idle');
  };

  const addComp = () => {
    const leftover = Math.max(0, 100 - total);
    setComps((prev) => [...prev, { id: uid(), name: '', level: 'IMPORTANT', weight: leftover > 0 ? leftover : 10, sortOrder: prev.length, mandatory: false }]);
    setSaveState('idle');
  };

  // ── Upload / drop ──
  const [dropState, setDropState]   = useState<DropState>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addedCount, setAddedCount]  = useState(0);
  const [stats, setStats]            = useState({ total: 0, processing: 0, scored: 0 });
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

  const handleDrop       = (e: React.DragEvent)                  => { e.preventDefault(); void uploadFiles(e.dataTransfer.files); };
  const handleFileInput  = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) void uploadFiles(e.target.files); e.target.value = ''; };

  // ─── Derived UI values ──────────────────────────────────────────────────────

  const totalBadgeStyle: React.CSSProperties = balanced
    ? { color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0' }
    : { color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d' };

  const saveDisabled = saveState === 'saving' || !balanced || comps.length === 0 || comps.some((c) => !c.name.trim());
  const saveBg       = saveState === 'saved' ? '#059669' : saveState === 'error' ? '#ef4444' : '#18181b';
  const saveLabel    = saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? '✓ Saved' : saveState === 'error' ? 'Save failed' : 'Save Rubric';

  const dropBorder = dropState === 'over' ? '2px dashed #059669' : dropState === 'uploading' ? '2px solid #a7f3d0' : dropState === 'done' ? '2px solid #6ee7b7' : dropState === 'error' ? '2px dashed #fca5a5' : '2px dashed #d4d4d8';
  const dropBg     = dropState === 'over' ? '#ecfdf5' : dropState === 'done' ? '#ecfdf5' : dropState === 'error' ? '#fff5f5' : '#fafafa';
  const dropTitle  = dropState === 'over' ? 'Release to upload' : dropState === 'uploading' ? 'Uploading résumés…' : dropState === 'done' ? `${addedCount} résumé${addedCount !== 1 ? 's' : ''} added` : dropState === 'error' ? 'Upload failed' : 'Drop résumés here';
  const dropSub    = dropState === 'uploading' ? 'Extracting skills…' : dropState === 'done' ? 'Scoring in background.' : dropState === 'error' ? (uploadError ?? 'Please retry.') : 'Drag files or click to browse.';

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1180, padding: '80px 48px 80px 96px' }} className="animate-rise">

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>JOB ROLE / RUBRIC BUILDER</div>

          {editMode ? (
            <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 16, padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                {([
                  { label: 'JOB TITLE', key: 'title', span: true },
                  { label: 'JOB CODE', key: 'code' },
                  { label: 'LOCATION', key: 'location' },
                  { label: 'EXPERIENCE', key: 'experience' },
                  { label: 'CONTRACT DURATION', key: 'contractDuration' },
                ] as { label: string; key: keyof typeof editDraft; span?: boolean }[]).map(({ label, key, span }) => (
                  <div key={key} style={{ gridColumn: span ? '1 / -1' : undefined }}>
                    <div style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 5 }}>{label}</div>
                    <input value={editDraft[key]} onChange={(e) => setEditDraft((d) => ({ ...d, [key]: e.target.value }))}
                      style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: 8, padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#18181b', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 5 }}>ROLE DESCRIPTION</div>
                <textarea value={editDraft.description} onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))} rows={5}
                  style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: 8, padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#18181b', background: '#fafafa', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button onClick={cancelEdit} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                <button onClick={saveMeta} disabled={metaSaving} style={{ padding: '8px 18px', borderRadius: 9, border: 'none', background: '#18181b', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: metaSaving ? 'not-allowed' : 'pointer', opacity: metaSaving ? .6 : 1 }}>
                  {metaSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 'clamp(28px,3.5vw,46px)', lineHeight: 1.02, letterSpacing: '-.02em', margin: 0 }}
                  dangerouslySetInnerHTML={{ __html: meta.title.replace(/\s(\S+)$/, ' <span style="font-weight:600">$1</span>') }} />
                <button onClick={openEdit} style={{ marginTop: 6, flexShrink: 0, padding: '4px 10px', border: '1px solid #e4e4e7', borderRadius: 7, background: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: '#71717a', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  EDIT INFO
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0, marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a' }}>
                {[meta.location, `Req #${meta.code}`, meta.experience ? `Exp: ${meta.experience}` : null, meta.contractDuration ? `Duration: ${meta.contractDuration}` : null]
                  .filter(Boolean).map((item, i, arr) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ padding: '3px 10px', background: '#f4f4f5', border: '1px solid #e4e4e7', borderRadius: 6 }}>{item}</span>
                      {i < arr.length - 1 && <span style={{ color: '#d4d4d8', margin: '0 6px', fontSize: 14 }}>·</span>}
                    </span>
                  ))}
              </div>
            </>
          )}

          {/* Collapsible description */}
          {!editMode && (
            <div style={{ marginTop: 14 }}>
              <button onClick={() => setDescOpen((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px dashed #d4d4d8', borderRadius: 7, padding: '5px 12px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.1em', color: '#a1a1aa', cursor: 'pointer' }}>
                <span style={{ fontSize: 12, lineHeight: 1 }}>{descOpen ? '−' : '+'}</span>
                {descOpen ? 'HIDE ROLE DESCRIPTION' : 'VIEW ROLE DESCRIPTION'}
              </button>
              {descOpen && (
                <div style={{ marginTop: 10, padding: '14px 16px', border: '1px dashed #e4e4e7', borderRadius: 10, background: '#fafafa', fontSize: 12.5, lineHeight: 1.7, color: '#52525b', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>
                  {meta.description || <span style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No description yet — click EDIT INFO to add one.</span>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RUBRIC TOTAL badge ── */}
        <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 28 }}>
          <div style={{ fontSize: 9.5, letterSpacing: '.18em', color: '#a1a1aa', marginBottom: 8 }}>RUBRIC TOTAL</div>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, padding: '8px 16px', borderRadius: 12, ...totalBadgeStyle }}>
            <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 34, lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 16, fontFamily: 'var(--font-space)' }}>%</span>
          </div>
          {!balanced && (
            <div style={{ fontSize: 10, color: '#d97706', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
              {total > 100 ? `−${total - 100}% over` : `+${100 - total}% remaining`}
            </div>
          )}
          {balanced && <div style={{ fontSize: 10, color: '#059669', marginTop: 6, fontFamily: 'var(--font-mono)' }}>balanced ✓</div>}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 34, marginTop: 40, alignItems: 'start' }}>

        {/* ── Rubric card ── */}
        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, padding: '28px 28px 24px', boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>

          {/* Card header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16 }}>Weighted Competency Rubric</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 3 }}>Edit names inline · adjust weights · toggle mandatory · save when balanced.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {/* AI parse button */}
              <button
                onClick={handleAiParse}
                disabled={aiParsing}
                title={meta.description ? 'Auto-generate criteria from role description' : 'Add a role description first'}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: aiParsing ? '#a1a1aa' : '#7c3aed', background: aiParsing ? '#f4f4f5' : '#f5f3ff', border: `1px solid ${aiParsing ? '#e4e4e7' : '#ddd6fe'}`, padding: '6px 12px', borderRadius: 8, cursor: aiParsing ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
              >
                {aiParsing ? (
                  <span className="spin-anim" style={{ width: 11, height: 11, border: '1.5px solid #d4d4d8', borderTopColor: '#7c3aed', borderRadius: '50%', display: 'inline-block' }} />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1l1.5 3 3.5.5-2.5 2.4.6 3.5L8 9l-3.1 1.4.6-3.5L3 4.5l3.5-.5z" stroke="#7c3aed" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                )}
                {aiParsing ? 'Parsing JD…' : 'AI Parse JD'}
              </button>
              <button onClick={addComp} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a', background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '6px 11px', borderRadius: 8, cursor: 'pointer' }}>+ Add</button>
              <button
                onClick={saveRubric}
                disabled={saveDisabled}
                title={!balanced ? 'Weights must sum to exactly 100% before saving' : comps.some((c) => !c.name.trim()) ? 'All competencies need a name' : undefined}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', background: saveDisabled ? '#d4d4d8' : saveBg, border: 'none', padding: '6px 14px', borderRadius: 8, cursor: saveDisabled ? 'not-allowed' : 'pointer', transition: 'background .2s' }}
              >
                {saveLabel}
              </button>
            </div>
          </div>

          {/* AI error */}
          {aiError && (
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 11, color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>
              {aiError}
            </div>
          )}

          {/* Column headers */}
          {comps.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px 56px 20px', gap: 10, alignItems: 'center', padding: '14px 0 6px', borderBottom: '1px solid #f1f1f2' }}>
              {['COMPETENCY', 'LEVEL', 'WT %', 'MANDATORY', ''].map((h) => (
                <div key={h} style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>{h}</div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {comps.length === 0 && !aiParsing && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#a1a1aa' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 12px', display: 'block', opacity: .4 }}>
                <rect x="4" y="8" width="24" height="18" rx="3" stroke="#a1a1aa" strokeWidth="1.5" />
                <path d="M4 13h24M11 8V6M21 8V6" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b', marginBottom: 6 }}>No competencies yet</div>
              <div style={{ fontSize: 11 }}>Click <strong>AI Parse JD</strong> to auto-generate, or <strong>+ Add</strong> manually.</div>
            </div>
          )}

          {aiParsing && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#7c3aed' }}>
              <span className="spin-anim" style={{ width: 28, height: 28, border: '3px solid #ddd6fe', borderTopColor: '#7c3aed', borderRadius: '50%', display: 'inline-block', marginBottom: 12 }} />
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#7c3aed' }}>Gemini is reading the JD…</div>
            </div>
          )}

          {/* Competency rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {comps.map((c, i) => {
              const ls = levelStyle(c.level);
              return (
                <div key={c.id} style={{ borderBottom: '1px solid #f4f4f5', padding: '14px 0' }}>
                  {/* Row: name · level · weight% · mandatory · remove */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 36px 56px 20px', gap: 10, alignItems: 'center', marginBottom: 10 }}>

                    {/* Inline name input */}
                    <input
                      value={c.name}
                      onChange={(e) => updateComp(c.id, { name: e.target.value })}
                      placeholder="Competency name…"
                      style={{ border: 'none', borderBottom: `1px solid ${c.name.trim() ? '#e4e4e7' : '#fca5a5'}`, background: 'transparent', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 500, color: '#18181b', outline: 'none', padding: '2px 0', width: '100%' }}
                    />

                    {/* Level badge toggle */}
                    <button
                      onClick={() => updateComp(c.id, { level: cycleLevel(c.level) })}
                      title="Click to cycle level"
                      style={{ fontSize: 9, letterSpacing: '.12em', color: ls.color, background: ls.bg, border: `1px solid ${ls.bd}`, padding: '4px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', textAlign: 'center' }}
                    >
                      {c.level}
                    </button>

                    {/* Weight % display */}
                    <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 15, color: '#18181b', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
                      {c.weight}
                    </div>

                    {/* Mandatory toggle */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Toggle on={c.mandatory} onChange={(v) => updateComp(c.id, { mandatory: v })} />
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeComp(c.id)}
                      style={{ fontSize: 13, color: '#d4d4d8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                      title="Remove"
                    >✕</button>
                  </div>

                  {/* Weight range slider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={c.weight}
                      onChange={(e) => { updateComp(c.id, { weight: Number(e.target.value) }); }}
                      style={{ flex: 1, accentColor: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669', height: 4, cursor: 'ew-resize' }}
                    />
                    <div style={{ width: 28, height: 6, borderRadius: 3, background: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669', opacity: .7, flexShrink: 0 }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stacked bar summary */}
          {comps.length > 0 && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #e4e4e7' }}>
              <div style={{ height: 8, borderRadius: 5, overflow: 'hidden', display: 'flex', background: '#f4f4f5' }}>
                {comps.map((c, i) => (
                  <div key={c.id} title={`${c.name}: ${c.weight}%`} style={{ height: '100%', width: `${c.weight}%`, background: i < BAR_COLORS.length ? BAR_COLORS[i] : '#059669', transition: 'width .3s cubic-bezier(.22,1,.36,1)', flexShrink: 0 }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                <span>{comps.length} competencies</span>
                {!balanced && <span style={{ color: '#d97706' }}>⚠ Weights must total 100% to save</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={handleFileInput} />

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragEnter={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropState('idle'); }}
            onDrop={handleDrop}
            onClick={() => { if (['idle','error','done'].includes(dropState)) fileInputRef.current?.click(); }}
            style={{ borderRadius: 18, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all .3s', border: dropBorder, background: dropBg }}
          >
            <div style={{ width: 52, height: 52, borderRadius: 14, background: dropState === 'over' || dropState === 'done' ? '#059669' : dropState === 'error' ? '#fee2e2' : '#f4f4f5', color: dropState === 'over' || dropState === 'done' ? '#fff' : dropState === 'error' ? '#ef4444' : '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center' }} className={dropState === 'uploading' ? 'spin-anim' : undefined}>
              {dropState === 'done'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : dropState === 'error'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                : dropState !== 'uploading'
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
                : null}
            </div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 15, marginTop: 14, color: dropState === 'error' ? '#ef4444' : '#18181b' }}>{dropTitle}</div>
            <div style={{ fontSize: 11, color: dropState === 'error' ? '#ef4444' : '#a1a1aa', marginTop: 5, lineHeight: 1.5 }}>{dropSub}</div>
            {['idle', 'error'].includes(dropState) && (
              <div style={{ display: 'flex', gap: 5, marginTop: 14 }}>
                {['PDF', 'DOCX', 'DOC', 'TXT'].map((f) => (
                  <span key={f} style={{ fontSize: 10, color: '#71717a', background: '#fff', border: '1px solid #e4e4e7', padding: '2px 7px', borderRadius: 5 }}>{f}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 16 }}>INGESTION QUEUE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Applicants Evaluated', value: stats.scored, highlight: false },
                { label: 'In pipeline',           value: stats.processing, highlight: stats.processing > 0 },
                { label: 'Total uploaded',         value: stats.total, highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#27272a' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: highlight ? '#059669' : '#18181b' }}>{value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => router.push(`/jobs/${jobId}/candidates`)}
              style={{ width: '100%', marginTop: 20, background: '#18181b', color: '#fff', border: 'none', padding: 12, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              View scored candidates <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
