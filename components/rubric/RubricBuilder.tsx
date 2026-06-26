'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { displayInts, rebalanceWeights } from '@/lib/utils';

type Competency = { id: string; name: string; level: string; weight: number };
type DropState = 'idle' | 'over' | 'ingesting' | 'done';

const BAR_COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];
const INIT_WEIGHTS = [34, 24, 18, 14, 10];

function levelStyle(level: string) {
  if (level === 'CORE') return { c: '#059669', b: '#a7f3d0' };
  if (level === 'IMPORTANT') return { c: '#71717a', b: '#d4d4d8' };
  return { c: '#a1a1aa', b: '#e4e4e7' };
}

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
  const dropTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropTimer2Ref = useRef<ReturnType<typeof setTimeout>>(undefined);
  const rectRef = useRef<DOMRect | null>(null);

  const ints = displayInts(weights);
  const tx = animate ? 'all .45s cubic-bezier(.22,1,.36,1)' : 'none';

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

  const handleDrop = (e?: React.DragEvent) => {
    if (e?.preventDefault) e.preventDefault();
    setDropState('ingesting');
    clearTimeout(dropTimerRef.current);
    clearTimeout(dropTimer2Ref.current);
    dropTimerRef.current = setTimeout(() => setDropState('done'), 1700);
    dropTimer2Ref.current = setTimeout(() => setDropState('idle'), 4200);
  };

  const dropZoneStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { position: 'relative', borderRadius: 18, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', cursor: 'pointer', transition: 'all .35s cubic-bezier(.22,1,.36,1)' };
    if (dropState === 'over') return { ...base, border: '2px dashed #059669', background: '#ecfdf5', transform: 'scale(1.015)', boxShadow: '0 24px 48px -20px rgba(5,150,105,.4)' };
    if (dropState === 'ingesting') return { ...base, border: '2px solid #a7f3d0', background: '#f0fdf4' };
    if (dropState === 'done') return { ...base, border: '2px solid #6ee7b7', background: '#ecfdf5' };
    return { ...base, border: '2px dashed #d4d4d8', background: '#fafafa' };
  };

  const dropIconStyle = (): React.CSSProperties => {
    if (dropState === 'over') return { width: 58, height: 58, borderRadius: 18, background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'scale(1.08) translateY(-2px)', transition: 'all .3s' };
    if (dropState === 'ingesting') return { width: 58, height: 58, borderRadius: '50%', border: '3px solid #d1fae5', borderTopColor: '#059669', color: 'transparent' } as React.CSSProperties;
    if (dropState === 'done') return { width: 58, height: 58, borderRadius: 18, background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    return { width: 58, height: 58, borderRadius: 18, background: '#f4f4f5', color: '#71717a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' };
  };

  const dropTitle = dropState === 'over' ? 'Release to ingest' : dropState === 'ingesting' ? 'Parsing résumés…' : dropState === 'done' ? '3 candidates scored' : 'Drop résumés here';
  const dropSub = dropState === 'over' ? "We'll parse, embed and score against this rubric." : dropState === 'ingesting' ? 'Extracting skills, mapping to competencies, computing match.' : dropState === 'done' ? 'Added to the evaluation dashboard.' : 'Drag a stack of files, paste a LinkedIn URL, or click to browse.';

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
                  {/* Drag track */}
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

          {/* Summary bar */}
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
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); if (dropState !== 'over') setDropState('over'); }}
            onDragLeave={(e) => { e.preventDefault(); setDropState('idle'); }}
            onDrop={handleDrop}
            onClick={() => handleDrop()}
            style={dropZoneStyle()}
          >
            <div style={{ ...dropIconStyle(), ...(dropState === 'ingesting' ? {} : {}) }} className={dropState === 'ingesting' ? 'spin-anim' : undefined}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"><path d="M12 16V4M12 4L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, marginTop: 16, color: '#18181b' }}>{dropTitle}</div>
            <div style={{ fontSize: 11.5, color: '#a1a1aa', marginTop: 6, lineHeight: 1.5, maxWidth: 230 }}>{dropSub}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
              {['PDF', 'DOCX', '.txt', 'URL'].map((fmt) => (
                <span key={fmt} style={{ fontSize: 10, color: '#71717a', background: '#fff', border: '1px solid #e4e4e7', padding: '3px 8px', borderRadius: 6 }}>{fmt}</span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, padding: 22 }}>
            <div style={{ fontSize: 11, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 16 }}>INGESTION QUEUE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Applicants Evaluated', value: '142' },
                { label: 'In pipeline', value: '6', color: '#059669' },
                { label: 'Avg. evaluation time', value: '3.1s' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#27272a' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: color ?? '#18181b' }}>{value}</span>
                </div>
              ))}
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
