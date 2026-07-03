'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { bandForScore, RING_C, ringOffset } from '@/lib/utils';
import ScorecardDrawer from './ScorecardDrawer';

type Capability = { label: string; note: string; w: number };
type Gap = { label: string; note: string; w: number };

type SourceEmail = { sender: string; subject: string; bodyHtml: string; receivedAt: string } | null;

type Candidate = {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  experience: string;
  score: number;
  status: 'scored' | 'processing';
  tags: string[];
  aiHead: string;
  aiReasoning: string[];
  capabilities: Capability[];
  gaps: Gap[];
  email?: string | null;
  phone?: string | null;
  evaluations?: { competency: string; level: string; weight_percentage: number; evidence_quote: string | null; competency_score_0_to_100: number; weighted_points_earned: number; reasoning: string }[];
  sourceEmail?: SourceEmail;
};

type Filter = 'all' | 'high' | 'strong' | 'processing';

export default function EvaluationDashboard({
  jobId,
  jobTitle,
  candidates: initialCandidates,
  isSuperAdmin = false,
}: {
  jobId: string;
  jobTitle: string;
  candidates: Candidate[];
  isSuperAdmin?: boolean;
}) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rescoringId, setRescoringId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates`);
      if (!res.ok) return;
      const data = await res.json() as { candidates: Candidate[] };
      setCandidates(data.candidates);
    } catch { /* noop */ }
  }, [jobId]);

  useEffect(() => {
    const hasProcessing = candidates.some((c) => c.status === 'processing');
    if (!hasProcessing) return;

    pollingRef.current = setInterval(async () => {
      await fetchCandidates();
    }, 4000);

    return () => clearInterval(pollingRef.current);
  }, [candidates, fetchCandidates]);

  useEffect(() => {
    const hasProcessing = candidates.some((c) => c.status === 'processing');
    if (!hasProcessing) clearInterval(pollingRef.current);
  }, [candidates]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const form = new FormData();
    for (const file of Array.from(files)) {
      form.append('files', file);
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/upload`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        const err = await res.json() as { error: string };
        setUploadError(err.error ?? 'Upload failed');
      } else {
        await fetchCandidates();
      }
    } catch {
      setUploadError('Upload failed — please try again');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (candidateId: string) => {
    setDeletingId(candidateId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/${candidateId}`, { method: 'DELETE' });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
        if (activeId === candidateId) setActiveId(null);
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleRescore = async (candidateId: string) => {
    setRescoringId(candidateId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/${candidateId}/rescore`, { method: 'POST' });
      if (res.ok) {
        setCandidates((prev) =>
          prev.map((c) => c.id === candidateId ? { ...c, status: 'processing' as const } : c)
        );
        if (activeId === candidateId) setActiveId(null);
      }
    } finally {
      setRescoringId(null);
    }
  };

  const scored = candidates.filter((c) => c.status === 'scored');
  const avgMatch = scored.length
    ? Math.round(scored.reduce((a, c) => a + c.score, 0) / scored.length)
    : 0;

  const filtered = candidates.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'processing') return c.status === 'processing';
    if (filter === 'high') return c.status === 'scored' && c.score >= 88;
    if (filter === 'strong') return c.status === 'scored' && c.score >= 78 && c.score < 88;
    return true;
  });

  const active = candidates.find((c) => c.id === activeId && c.status === 'scored') ?? null;

  const chipStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    background: active ? '#18181b' : '#fff',
    color: active ? '#fff' : '#71717a',
    border: active ? 'none' : '1px solid #e4e4e7',
    padding: '7px 13px',
    borderRadius: 9,
    cursor: 'pointer',
  });

  const highCount = candidates.filter((c) => c.status === 'scored' && c.score >= 88).length;
  const strongCount = candidates.filter((c) => c.status === 'scored' && c.score >= 78 && c.score < 88).length;
  const processingCount = candidates.filter((c) => c.status === 'processing').length;

  return (
    <>
      <div style={{ maxWidth: 1200, padding: '80px 48px 90px 96px' }} className="animate-rise">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 30 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>
              CANDIDATES / {jobTitle.toUpperCase()}
            </div>
            <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 44, lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
              Evaluation <span style={{ fontWeight: 600 }}>Dashboard</span>
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 34, paddingBottom: 6 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 6 }}>SCORED</div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 30 }}>
                {scored.length}<span style={{ fontSize: 15, color: '#a1a1aa' }}> / {candidates.length}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 6 }}>AVG MATCH</div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 30, color: '#059669' }}>
                {avgMatch}<span style={{ fontSize: 15 }}>%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              background: uploading ? '#f4f4f5' : '#18181b',
              color: uploading ? '#a1a1aa' : '#fff',
              border: 'none',
              height: 38,
              padding: '0 16px',
              borderRadius: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            {uploading ? (
              <>
                <span className="spin-anim" style={{ width: 12, height: 12, border: '2px solid #d4d4d8', borderTopColor: '#71717a', borderRadius: '50%', display: 'inline-block' }} />
                Uploading…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 3v11M4 9l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Upload Resumes
              </>
            )}
          </button>
          <span style={{ fontSize: 11, color: '#a1a1aa' }}>PDF, DOC, DOCX, TXT · up to 20 files</span>
          {uploadError && (
            <span style={{ fontSize: 11, color: '#ef4444', marginLeft: 8 }}>{uploadError}</span>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <button onClick={() => setFilter('all')} style={chipStyle(filter === 'all')}>All · {candidates.length}</button>
          <button onClick={() => setFilter('high')} style={chipStyle(filter === 'high')}>High match · {highCount}</button>
          <button onClick={() => setFilter('strong')} style={chipStyle(filter === 'strong')}>Strong · {strongCount}</button>
          <button onClick={() => setFilter('processing')} style={chipStyle(filter === 'processing')}>Processing · {processingCount}</button>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#a1a1aa' }}>Sorted by match score ↓</span>
        </div>

        {/* Empty state */}
        {candidates.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#a1a1aa' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#52525b', marginBottom: 6 }}>No candidates yet</div>
            <div style={{ fontSize: 12 }}>Upload resumes above to start AI scoring</div>
          </div>
        )}

        {/* Candidate rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((c) => {
            if (c.status === 'processing') {
              return (
                <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 22, alignItems: 'center', background: '#fff', border: '1px solid #ececed', borderRadius: 16, padding: '18px 22px' }}>
                  <div className="spin-anim" style={{ width: 58, height: 58, flexShrink: 0, borderRadius: '50%', border: '5px solid #f1f1f2', borderTopColor: '#d4d4d8' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#52525b' }}>{c.name}</div>
                    <div className="shimmer" style={{ height: 10, width: '55%', borderRadius: 5 }} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div className="pulse-dot" style={{ height: 18, width: 48, borderRadius: 6, background: '#f4f4f5' }} />
                      <div className="pulse-dot" style={{ height: 18, width: 62, borderRadius: 6, background: '#f4f4f5' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4d4d8' }} />
                      AI scoring…
                    </span>
                    {isSuperAdmin && (
                      confirmDeleteId === c.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                          >
                            {deletingId === c.id ? '…' : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff8f8', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      )
                    )}
                  </div>
                </div>
              );
            }

            const band = bandForScore(c.score);
            const offset = ringOffset(c.score);
            const isConfirmingDelete = confirmDeleteId === c.id;

            return (
              <div
                key={c.id}
                onClick={() => !isSuperAdmin && setActiveId(c.id)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 22,
                  alignItems: 'center',
                  background: '#fff',
                  border: `1px solid ${isConfirmingDelete ? '#fecaca' : '#e4e4e7'}`,
                  borderRadius: 16,
                  padding: '18px 22px',
                  cursor: isSuperAdmin ? 'default' : 'pointer',
                  transition: 'all .22s cubic-bezier(.22,1,.36,1)',
                }}
                className={isSuperAdmin ? '' : 'hover:border-[#d4d4d8] hover:-translate-y-px hover:shadow-lg'}
              >
                {/* Score ring */}
                <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <circle cx="29" cy="29" r="24" fill="none" stroke="#f1f1f2" strokeWidth="5" />
                    <circle cx="29" cy="29" r="17.5" fill="none" stroke="#f4f4f5" strokeWidth="1.5" strokeDasharray="1.5 4" />
                    <circle cx="29" cy="29" r="24" fill="none" stroke={band.color} strokeWidth="5" strokeLinecap="round" strokeDasharray="150.796" strokeDashoffset={offset} transform="rotate(-90 29 29)" style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 17, lineHeight: 1, color: '#18181b' }}>{c.score}</span>
                  </div>
                </div>

                {/* Identity */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span
                      style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); setActiveId(c.id); }}
                    >
                      {c.name}
                    </span>
                    <span style={{ fontSize: 9, letterSpacing: '.14em', color: band.color, background: band.bg, border: `1px solid ${band.bd}`, padding: '2px 7px', borderRadius: 5 }}>{band.label}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 9 }}>
                    {c.currentRole} <span style={{ color: '#d4d4d8' }}>·</span> {c.location} <span style={{ color: '#d4d4d8' }}>·</span> {c.experience}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {c.tags.map((t) => (
                      <span key={t} style={{ fontSize: 10, color: '#52525b', background: '#f4f4f5', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Right — metrics or SuperAdmin actions */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, textAlign: 'right' }}>
                  {isSuperAdmin ? (
                    isConfirmingDelete ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                        <span style={{ fontSize: 10, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>Delete candidate?</span>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                        >
                          {deletingId === c.id ? '…' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRescore(c.id)}
                          disabled={rescoringId === c.id}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#fff', color: '#52525b', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          {rescoringId === c.id ? (
                            <span className="spin-anim" style={{ width: 10, height: 10, border: '1.5px solid #d4d4d8', borderTopColor: '#71717a', borderRadius: '50%', display: 'inline-block' }} />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 3v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                          Rescore
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff8f8', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </div>
                    )
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#71717a' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: '#059669' }} />{c.capabilities.length} matched
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: '#d97706' }} />{c.gaps.length} gaps
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: '#18181b', display: 'flex', alignItems: 'center', gap: 6 }}>
                        View scorecard <span style={{ color: '#059669' }}>→</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {active && <ScorecardDrawer candidate={active} onClose={() => setActiveId(null)} />}
    </>
  );
}
