'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { bandForScore, RING_C, ringOffset, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  resumeUrl?: string | null;
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
    pollingRef.current = setInterval(async () => { await fetchCandidates(); }, 4000);
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
    for (const file of Array.from(files)) form.append('files', file);
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/upload`, { method: 'POST', body: form });
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
        setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, status: 'processing' as const } : c));
        if (activeId === candidateId) setActiveId(null);
      }
    } finally {
      setRescoringId(null);
    }
  };

  const scored = candidates.filter((c) => c.status === 'scored');
  const avgMatch = scored.length ? Math.round(scored.reduce((a, c) => a + c.score, 0) / scored.length) : 0;
  const filtered = candidates.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'processing') return c.status === 'processing';
    if (filter === 'high') return c.status === 'scored' && c.score >= 88;
    if (filter === 'strong') return c.status === 'scored' && c.score >= 78 && c.score < 88;
    return true;
  });

  const active = candidates.find((c) => c.id === activeId && c.status === 'scored') ?? null;
  const highCount = candidates.filter((c) => c.status === 'scored' && c.score >= 88).length;
  const strongCount = candidates.filter((c) => c.status === 'scored' && c.score >= 78 && c.score < 88).length;
  const processingCount = candidates.filter((c) => c.status === 'processing').length;

  return (
    <>
      <div style={{ maxWidth: 1200, padding: '80px 48px 90px 96px' }} className="animate-rise">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-7">
          <div>
            <div className="text-[11px] tracking-[.22em] text-muted-foreground mb-3.5">
              CANDIDATES / {jobTitle.toUpperCase()}
            </div>
            <h1 className="font-light text-[44px] leading-none tracking-[-0.02em] m-0" style={{ fontFamily: 'var(--font-space)' }}>
              Evaluation <span className="font-semibold">Dashboard</span>
            </h1>
          </div>
          <div className="flex gap-8 pb-1.5">
            <div>
              <div className="text-[10px] tracking-[.16em] text-muted-foreground mb-1.5">SCORED</div>
              <div className="font-light text-[30px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>
                {scored.length}<span className="text-[15px] text-muted-foreground"> / {candidates.length}</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.16em] text-muted-foreground mb-1.5">AVG MATCH</div>
              <div className="font-light text-[30px] text-[var(--green)]" style={{ fontFamily: 'var(--font-space)' }}>
                {avgMatch}<span className="text-[15px]">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload bar */}
        <div className="flex items-center gap-3 mb-4">
          <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleUpload} />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            variant={uploading ? 'outline' : 'default'}
            className="h-9 gap-1.5 font-mono text-[12px]"
          >
            {uploading ? (
              <>
                <span className="spin-anim w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full inline-block" />
                Uploading…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><path d="M10 3v11M4 9l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                Upload Resumes
              </>
            )}
          </Button>
          <span className="text-[11px] text-muted-foreground">PDF, DOC, DOCX, TXT · up to 20 files</span>
          {uploadError && <span className="text-[11px] text-destructive ml-2">{uploadError}</span>}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-5">
          {([
            { key: 'all', label: `All · ${candidates.length}` },
            { key: 'high', label: `High match · ${highCount}` },
            { key: 'strong', label: `Strong · ${strongCount}` },
            { key: 'processing', label: `Processing · ${processingCount}` },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'text-[11px] px-3 py-1.5 rounded-[9px] border cursor-pointer transition-colors font-mono',
                filter === key ? 'bg-foreground text-background border-transparent' : 'bg-card text-muted-foreground border-border hover:border-muted-foreground'
              )}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">Sorted by match score ↓</span>
        </div>

        {/* Empty state */}
        {candidates.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-[36px] mb-3">📂</div>
            <div className="text-[14px] font-medium text-foreground mb-1.5">No candidates yet</div>
            <div className="text-[12px]">Upload resumes above to start AI scoring</div>
          </div>
        )}

        {/* Candidate rows */}
        <div className="flex flex-col gap-2.5">
          {filtered.map((c) => {
            if (c.status === 'processing') {
              return (
                <div key={c.id} className="grid gap-[22px] items-center bg-card border border-border rounded-2xl p-[18px_22px]"
                  style={{ gridTemplateColumns: 'auto 1fr auto' }}>
                  <div className="spin-anim w-[58px] h-[58px] shrink-0 rounded-full border-[5px] border-border border-t-muted-foreground/50" />
                  <div className="flex flex-col gap-2">
                    <div className="text-[13px] font-medium text-muted-foreground">{c.name}</div>
                    <div className="shimmer h-2.5 w-[55%] rounded-full" />
                    <div className="flex gap-1.5">
                      <div className="pulse-dot h-[18px] w-12 rounded-md bg-muted" />
                      <div className="pulse-dot h-[18px] w-16 rounded-md bg-muted" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="pulse-dot w-[7px] h-[7px] rounded-full bg-muted-foreground/40" />
                      AI scoring…
                    </span>
                    {isSuperAdmin && (
                      confirmDeleteId === c.id ? (
                        <div className="flex items-center gap-1.5">
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="h-7 text-[10px] font-mono">
                            {deletingId === c.id ? '…' : 'Confirm'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)} className="h-7 text-[10px] font-mono">Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(c.id)} className="h-7 text-[10px] font-mono text-destructive border-destructive/40 hover:bg-destructive/10">Delete</Button>
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
                className={cn(
                  'grid gap-[22px] items-center bg-card rounded-2xl p-[18px_22px] transition-all duration-[220ms] ease-[cubic-bezier(.22,1,.36,1)]',
                  isConfirmingDelete ? 'border border-destructive/40' : 'border border-border',
                  !isSuperAdmin && 'cursor-pointer hover:border-muted-foreground/40 hover:-translate-y-px hover:shadow-lg'
                )}
                style={{ gridTemplateColumns: 'auto 1fr auto' }}
              >
                {/* Score ring */}
                <div className="relative w-[58px] h-[58px] shrink-0">
                  <svg width="58" height="58" viewBox="0 0 58 58">
                    <circle cx="29" cy="29" r="24" fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
                    <circle cx="29" cy="29" r="17.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="1.5" strokeDasharray="1.5 4" />
                    <circle cx="29" cy="29" r="24" fill="none" stroke={band.color} strokeWidth="5" strokeLinecap="round"
                      strokeDasharray="150.796" strokeDashoffset={offset}
                      transform="rotate(-90 29 29)"
                      style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-semibold text-[17px] leading-none text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{c.score}</span>
                  </div>
                </div>

                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span
                      className="font-semibold text-[16px] text-foreground cursor-pointer"
                      style={{ fontFamily: 'var(--font-space)' }}
                      onClick={(e) => { e.stopPropagation(); setActiveId(c.id); }}
                    >
                      {c.name}
                    </span>
                    <span className="text-[9px] tracking-[.14em] px-2 py-0.5 rounded-[5px] border" style={{ color: band.color, background: band.bg, borderColor: band.bd }}>
                      {band.label}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-muted-foreground mb-2">
                    {c.currentRole} <span className="text-border">·</span> {c.location} <span className="text-border">·</span> {c.experience}
                  </div>
                  <div className="flex gap-1.5">
                    {c.tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px] px-2 py-0.5">{t}</Badge>
                    ))}
                  </div>
                </div>

                {/* Right actions */}
                <div className="flex flex-col items-end gap-2 text-right">
                  {isSuperAdmin ? (
                    isConfirmingDelete ? (
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-destructive" style={{ fontFamily: 'var(--font-mono)' }}>Delete candidate?</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="h-7 text-[10px] font-mono">
                          {deletingId === c.id ? '…' : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)} className="h-7 text-[10px] font-mono">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => handleRescore(c.id)} disabled={rescoringId === c.id} className="h-7 text-[10px] font-mono gap-1">
                          {rescoringId === c.id ? (
                            <span className="spin-anim w-2.5 h-2.5 border-[1.5px] border-muted-foreground/30 border-t-muted-foreground rounded-full inline-block" />
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M13 8A5 5 0 1 1 8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M13 3v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          )}
                          Rescore
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(c.id)} className="h-7 text-[10px] font-mono text-destructive border-destructive/40 hover:bg-destructive/10">Delete</Button>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="flex gap-3.5 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="w-[7px] h-[7px] rounded-sm bg-[var(--green)]" />{c.capabilities.length} matched
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-[7px] h-[7px] rounded-sm bg-amber-500" />{c.gaps.length} gaps
                        </span>
                      </div>
                      <span className="text-[12px] text-foreground flex items-center gap-1.5">
                        View scorecard <span className="text-[var(--green)]">→</span>
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
