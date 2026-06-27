'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { displayInts, rebalanceWeights } from '@/lib/utils';

type Competency = { id: string; name: string; level: string; weight: number };
type DropState = 'idle' | 'over' | 'uploading' | 'done' | 'error';

const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
const INIT_WEIGHTS = [34, 24, 18, 14, 10];

function levelStyle(level: string) {
  if (level === 'CORE') return { c: '#059669', b: '#a7f3d0' };
  if (level === 'IMPORTANT') return { c: '#71717a', b: '#d4d4d8' };
  return { c: '#a1a1aa', b: '#e4e4e7' };
}

type Stats = { total: number; processing: number; scored: number };

type Props = {
  jobId: string;
  jobTitle: string;
  jobCode: string;
  jobLocation: string;
  initialCompetencies: Competency[];
};

export default function RubricBuilder({ jobId, jobTitle, jobCode, jobLocation, initialCompetencies }: Props) {
  const router = useRouter();
  const [weights, setWeights] = useState<number[]>(INIT_WEIGHTS);
  const [animate, setAnimate] = useState(true);
  const [dropState, setDropState] = useState<DropState>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const [stats, setStats] = useState<Stats>({ total: 0, processing: 0, scored: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const ints = displayInts(weights);
  const tx = animate ? 'all .45s cubic-bezier(.22,1,.36,1)' : 'none';

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates`);
      if (!res.ok) return;
      const data = await res.json() as { candidates: { status: string }[] };
      const all = data.candidates ?? [];
      setStats({
        total: all.length,
        processing: all.filter((c) => c.status === 'processing').length,
        scored: all.filter((c) => c.status === 'scored').length,
      });
    } catch { /* noop */ }
  }, [jobId]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const startDrag = useCallback((i: number, e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    rectRef.current = e.currentTarget.getBoundingClientRect();
    setAnimate(false);

    const move = (ev: PointerEvent) => {
      const x = ev.clientX - (rectRef.current?.left ?? 0);
      setWeights((w) => rebalanceWeights(w, i, (x / (rectRef.current?.width ?? 1)) * 100));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setAnimate(true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, []);

  const resetRubric = () => { setWeights(INIT_WEIGHTS); setAnimate(true); };

  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      return ['pdf', 'doc', 'docx', 'txt'].includes(ext);
    });
    if (!arr.length) {
      setUploadError('No supported files found (PDF, DOC, DOCX, TXT).');
      setDropState('error');
      return;
    }
    if (arr.length > 20) {
      setUploadError('Maximum 20 files per upload.');
      setDropState('error');
      return;
    }

    setDropState('uploading');
    setUploadError(null);

    const form = new FormData();
    arr.forEach((f) => form.append('files', f));

    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/upload`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json() as { created?: string[]; total?: number; error?: string };
      if (!res.ok) {
        setUploadError(data.error ?? 'Upload failed.');
        setDropState('error');
        return;
      }
      setAddedCount(data.total ?? arr.length);
      setDropState('done');
      void fetchStats();
      // Reset to idle after 4s
      setTimeout(() => setDropState('idle'), 4000);
    } catch {
      setUploadError('Network error — please try again.');
      setDropState('error');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropState('idle'); // reset over state first
    void uploadFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) void uploadFiles(e.target.files);
    e.target.value = '';
  };

  const dropZoneStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'relative', borderRadius: 18, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all .35s cubic-bezier(.22,1,.36,1)' };
    if (dropState === 'over') return { ...base, border: '2px dashed #059669', background: '#ecfdf5', transform: 'scale(1.015)', boxShadow: '0 24px 48px -20px rgba(5,150,105,.4)' };
    if (dropState === 'uploading') return { ...base, border: '2px solid #a7f3d0', background: '#f0fdf4' };
    if (dropState === 'done') return { ...base, border: '2px solid #6ee7b7', background: '#ecfdf5' };
    if (dropState === 'error') return { ...base, border: '2px dashed #fca5a5', background: '#fff5f5' };
    return { ...base, border: '2px dashed #d4d4d8', background: '#fafafa' };
  };

  const dropIconStyle = (): React.CSSProperties => {
    if (dropState === 'over') return { width: 58, height: 58, borderRadius: 18, background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.08) translateY(-2px)', transition: 'all .3s' };
    if (dropState === 'uploading') return { width: 58, height: 58, borderRadius: '50%', border: '4px solid #d1fae5', borderTopColor: '#059669', color: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    if (dropState === 'done') return { width: 58, height: 58, borderRadius: 18, background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    if (dropState === 'error') return { width: 58, height: 58, borderRadius: 18, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    return { width: 58, height: 58, borderRadius: 18, background: '#f4f4f5', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' };
  };

  const dropTitle =
    dropState === 'over' ? 'Release to upload' :
    dropState === 'uploading' ? 'Uploading résumés…' :
    dropState === 'done' ? `${addedCount} résumé${addedCount !== 1 ? 's' : ''} added` :
    dropState === 'error' ? 'Upload failed' :
    'Drop résumés here';

  const dropSub =
    dropState === 'over' ? "We'll parse, embed and score against this rubric." :
    dropState === 'uploading' ? 'Extracting skills, mapping to competencies, computing match.' :
    dropState === 'done' ? 'Scoring in background — check the evaluation dashboard.' :
    dropState === 'error' ? (uploadError ?? 'Please try again.') :
    'Drag a stack of files or click to browse.';

  return (
    <div style={{ maxWidth: 1180, padding: '80px 48px 80px 96px' }} className="animate-rise">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>JOB ROLE / RUBRIC BUILDER</div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 46, lineHeight: 1.02, letterSpacing: '-.02em', margin: 0 }} dangerouslySetInnerHTML={{ __html: jobTitle.replace(/\s(\S+)$/, ' <span style="font-weight:600">$1</span>') }} />
          <div style={{ display: 'flex', gap: 18, marginTop: 18, fontSize: 12, color: '#71717a' }}>
            <span>Platform Team</span><span style={{ color: '#d4d4d8' }}>·</span><span>{jobLocation}</span><span style={{ color: '#d4d4d8' }}>·</span><span>Req #{jobCode}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, paddingTop: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 6 }}>RUBRIC TOTAL</div>
          <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 40, lineHeight: 1, color: '#059669' }}>100<span style={{ fontSize: 20 }}>%</span></div>
          <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 4, letterSpacing: '.04em' }}>auto-balanced</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 34, marginTop: 40, alignItems: 'start' }}>
        {/* Rubric card */}
        <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, padding: '30px 30px 26px', boxShadow: '0 1px 2px rgba(24,24,27,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 17 }}>Weighted Competency Rubric</div>
              <div style={{ fontSize: 11, color: '#a1a1aa', marginTop: 3 }}>Drag any weight — the rest rebalance to keep 100%.</div>
            </div>
            <button onClick={resetRubric} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a', background: '#f4f4f5', border: '1px solid #e4e4e7', padding: '6px 11px', borderRadius: 8, cursor: 'pointer' }}>Reset</button>
          </div>

          <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {initialCompetencies.map((c, i) => {
              const ls = levelStyle(c.level);
              return (
                <div key={c.id} style={{ padding: '13px 0', borderTop: '1px solid #f1f1f2' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 11 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#27272a' }}>{c.name}</span>
                      <span style={{ fontSize: 9.5, letterSpacing: '.12em', color: ls.c, border: `1px solid ${ls.b}`, padding: '1.5px 6px', borderRadius: 5 }}>{c.level}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, fontFamily: 'var(--font-space)' }}>
                      <span style={{ fontWeight: 600, fontSize: 20, color: '#18181b', fontVariantNumeric: 'tabular-nums' }}>{ints[i]}</span>
                      <span style={{ fontSize: 12, color: '#a1a1aa' }}>%</span>
                    </div>
                  </div>
                  <div
                    onPointerDown={(e) => startDrag(i, e)}
                    style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'center', cursor: 'ew-resize', touchAction: 'none' }}
                  >
                    <div style={{ position: 'absolute', left: 0, right: 0, height: 8, borderRadius: 6, background: '#f1f1f2', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 6, background: 'linear-gradient(90deg,#34d399,#059669)', width: `${ints[i]}%`, transition: tx }} />
                    </div>
                    <div style={{ position: 'absolute', left: `${ints[i]}%`, top: '50%', transform: 'translate(-50%,-50%)', width: 20, height: 20, borderRadius: '50%', background: '#fff', border: '2px solid #059669', boxShadow: '0 2px 6px -1px rgba(5,150,105,.45)', transition: tx, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#059669' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid #e4e4e7', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1, height: 10, borderRadius: 6, overflow: 'hidden', display: 'flex' }}>
              {initialCompetencies.map((c, i) => (
                <div key={c.id} style={{ height: '100%', width: `${ints[i]}%`, background: BAR_COLORS[i], transition: tx }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{initialCompetencies.length} competencies</span>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragEnter={(e) => { e.preventDefault(); if (dropState === 'idle') setDropState('over'); }}
            onDragLeave={(e) => {
              e.preventDefault();
              // Only leave if pointer actually left the zone
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropState('idle');
            }}
            onDrop={handleDrop}
            onClick={() => { if (dropState === 'idle' || dropState === 'error' || dropState === 'done') fileInputRef.current?.click(); }}
            style={dropZoneStyle()}
          >
            <div style={dropIconStyle()} className={dropState === 'uploading' ? 'spin-anim' : undefined}>
              {dropState === 'done' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              ) : dropState === 'error' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/></svg>
              ) : dropState === 'uploading' ? null : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              )}
            </div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, marginTop: 16, color: dropState === 'error' ? '#ef4444' : '#18181b' }}>{dropTitle}</div>
            <div style={{ fontSize: 11.5, color: dropState === 'error' ? '#ef4444' : '#a1a1aa', marginTop: 6, lineHeight: 1.5, maxWidth: 230 }}>{dropSub}</div>
            {(dropState === 'idle' || dropState === 'error') && (
              <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                {['PDF', 'DOCX', 'DOC', '.txt'].map((fmt) => (
                  <span key={fmt} style={{ fontSize: 10, color: '#71717a', background: '#fff', border: '1px solid #e4e4e7', padding: '3px 8px', borderRadius: 6 }}>{fmt}</span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 16 }}>INGESTION QUEUE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#27272a' }}>Applicants Evaluated</span>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: '#18181b' }}>{stats.scored}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#27272a' }}>In pipeline</span>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: stats.processing > 0 ? '#059669' : '#18181b' }}>{stats.processing}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: '#27272a' }}>Total uploaded</span>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: '#18181b' }}>{stats.total}</span>
              </div>
            </div>
            <button
              onClick={() => router.push(`/jobs/${jobId}/candidates`)}
              style={{ width: '100%', marginTop: 20, background: '#18181b', color: '#fff', border: 'none', padding: 12, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              View scored candidates <span style={{ fontSize: 14 }}>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
