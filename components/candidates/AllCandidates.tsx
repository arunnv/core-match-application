'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

/* ── Types ──────────────────────────────────────────────── */
type EvaluationRow = {
  competency: string;
  level: string;
  weight_percentage: number;
  evidence_quote: string | null;
  competency_score_0_to_100: number;
  weighted_points_earned: number;
  reasoning: string;
};

type Candidate = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  currentRole: string;
  location: string;
  experience: string;
  score: number;
  tags: string[];
  aiHead: string;
  status: string | null;
  evaluations: EvaluationRow[];
  jobId: string | null;
  jobTitle: string | null;
  jobCode: string | null;
  resumeUrl: string | null;
  sourceEmail: { sender: string; subject: string; bodyHtml: string; receivedAt: string } | null;
};

type Job = { id: string; title: string; code: string; location: string; scored: number };
type Props = { candidates: Candidate[]; jobs: Job[]; isSuperAdmin?: boolean };

/* ── Score helpers ──────────────────────────────────────── */
const scoreColor   = (s: number) => s >= 88 ? 'text-[var(--green-dark)]' : s >= 70 ? 'text-blue-500' : s >= 50 ? 'text-amber-500' : 'text-destructive';
const ringStroke   = (s: number) => s >= 88 ? 'var(--green-dark)' : s >= 70 ? '#3b82f6' : s >= 50 ? '#f59e0b' : 'hsl(var(--destructive))';
const barFill      = (s: number) => s >= 88 ? 'var(--green-dark)' : s >= 70 ? '#3b82f6' : s >= 50 ? '#f59e0b' : 'hsl(var(--destructive))';
const bandLabel    = (s: number) => s >= 88 ? 'STRONG' : s >= 70 ? 'GOOD' : s >= 50 ? 'FAIR' : 'WEAK';

function BandBadge({ score }: { score: number }) {
  const cls = score >= 88
    ? 'bg-[var(--green-bg)] text-[var(--green-dark)] border-[var(--green-border)]'
    : score >= 70
    ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
    : score >= 50
    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
    : 'bg-destructive/10 text-destructive border-destructive/30';
  return (
    <Badge variant="outline" className={cn('text-[9px] tracking-[.12em] px-1.5 py-0 font-mono', cls)}>
      {bandLabel(score)}
    </Badge>
  );
}

/* ── Avatar helpers ─────────────────────────────────────── */
const AVATAR_PALETTES = [
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
];
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name.split(' ').map((w) => w[0] ?? '').slice(0, 2).join('');
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_PALETTES.length;
  const sizeClass = size === 'sm' ? 'h-9 w-9 text-[11px]' : size === 'lg' ? 'h-14 w-14 text-[16px]' : 'h-[44px] w-[44px] text-[13px]';
  return (
    <div className={cn('flex-shrink-0 rounded-full flex items-center justify-center font-bold', sizeClass, AVATAR_PALETTES[idx])}>
      {initials}
    </div>
  );
}

/* ── AI canned responses ────────────────────────────────── */
const AI_CANNED = [
  {
    key: 'gems',
    match: (q: string) => q.includes('gem') || q.includes('hidden') || q.includes('cross'),
    heading: 'CROSS-ROLE GEM ANALYSIS',
    build: (cands: Candidate[], jobs: Job[]) => {
      const multi = cands.filter((c) => c.score >= 70).slice(0, 2);
      const text = `CROSS-ROLE ANALYSIS COMPLETE\n\nSearching across ${cands.length} profiles for candidates with high match scores and versatile backgrounds...\n\nFinding: ${multi.map((c) => c.name).join(' and ')} both present strong scores in their evaluated roles and show broad skill signals applicable across your open positions.\n\nRecommendation: Broaden conversations with these candidates to explore all applicable tracks before committing to a single role pipeline.`;
      return { text, cards: multi };
    },
  },
  {
    key: 'pipeline',
    match: (q: string) => q.includes('risk') || q.includes('pipeline') || q.includes('stall'),
    heading: 'PIPELINE HEALTH SCAN',
    build: (cands: Candidate[]) => {
      const inPipe = cands.filter((c) => c.status === 'processing').slice(0, 2);
      const text = `PIPELINE HEALTH SCAN · ${inPipe.length} FLAGS\n\nAnalyzing pipeline candidates across stage velocity...\n\n${inPipe.length > 0 ? `Risk: ${inPipe.map((c) => `${c.name} (${c.score}% match)`).join(', ')} ${inPipe.length === 1 ? 'is' : 'are'} currently in processing. High-match candidates in pipeline are prime churn risks — expedite decisions.\n\nAction: Escalate to hiring decision within 48 hours.` : 'No critical pipeline risks detected at this time.'}`;
      return { text, cards: inPipe };
    },
  },
  {
    key: 'top',
    match: () => true,
    heading: 'TOP MATCH ANALYSIS',
    build: (cands: Candidate[]) => {
      const top = [...cands].sort((a, b) => b.score - a.score).slice(0, 2);
      const text = `TOP MATCH ANALYSIS COMPLETE\n\nRanking all ${cands.length} candidates by evaluated match score...\n\nTop candidates: ${top.map((c) => `${c.name} (${c.score}/100 for ${c.jobTitle ?? 'their role'})`).join('; ')}.\n\nRecommendation: Prioritise these candidates for immediate outreach and schedule first-round conversations this week.`;
      return { text, cards: top };
    },
  },
];

/* ── EvalBreakdown (inside drawer) ─────────────────────── */
function EvalBreakdown({ evaluations, score }: { evaluations: EvaluationRow[]; score: number }) {
  const [open, setOpen] = useState(false);
  const total = evaluations.reduce((s, e) => s + e.weighted_points_earned, 0);

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-transparent border border-border rounded-[10px] px-3.5 py-2.5 cursor-pointer font-mono text-[10.5px] text-muted-foreground tracking-[.1em] hover:bg-muted/50 transition-colors"
      >
        <span>EVALUATION BREAKDOWN · {evaluations.length} COMPETENCIES</span>
        <span className={cn('transition-transform duration-200', open && 'rotate-180')}>▾</span>
      </button>

      {open && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {evaluations.map((e, i) => {
            const hasEvidence = !!e.evidence_quote;
            const coreMiss = e.level === 'CORE' && !hasEvidence;
            const sc = e.competency_score_0_to_100;
            return (
              <div
                key={i}
                className={cn(
                  'border rounded-[10px] p-3',
                  coreMiss ? 'border-destructive/30 bg-destructive/5'
                  : hasEvidence ? 'border-border bg-card'
                  : 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-semibold text-foreground">{e.competency}</span>
                    <Badge variant={e.level === 'CORE' ? 'default' : 'secondary'} className="text-[8px] tracking-[.1em] px-1 py-0 font-mono">
                      {e.level}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9.5px] text-muted-foreground font-mono">{e.weight_percentage}%</span>
                    <span className={cn('font-bold text-[16px] leading-none', scoreColor(sc))} style={{ fontFamily: 'var(--font-space)' }}>{sc}</span>
                    <span className={cn('text-[9.5px] font-mono', scoreColor(sc))}>+{e.weighted_points_earned.toFixed(1)}</span>
                  </div>
                </div>
                <div className="h-0.5 rounded-sm bg-muted mb-1.5">
                  <div className="h-full rounded-sm" style={{ width: `${sc}%`, background: barFill(sc) }} />
                </div>
                {hasEvidence ? (
                  <blockquote className="m-0 pl-2.5 border-l-2 border-foreground/70 bg-muted/50 rounded-r-md p-2 font-mono text-[10px] text-foreground/70 leading-relaxed">
                    &ldquo;{e.evidence_quote}&rdquo;
                  </blockquote>
                ) : coreMiss ? (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-destructive/10 border border-destructive/20 rounded-md">
                    <span className="text-[9px] tracking-[.1em] text-destructive font-mono">⚠ NO EVIDENCE · CORE PENALTY APPLIED</span>
                  </div>
                ) : (
                  <div className="flex items-center px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-md dark:bg-amber-950/30 dark:border-amber-800">
                    <span className="text-[9px] tracking-[.1em] text-amber-700 dark:text-amber-400 font-mono">NO EVIDENCE FOUND</span>
                  </div>
                )}
              </div>
            );
          })}
          <div className="border border-border rounded-[9px] p-3 bg-muted/40 flex items-center justify-between">
            <span className="text-[9.5px] font-mono text-muted-foreground tracking-[.1em]">Σ WEIGHTED POINTS → SCORE</span>
            <span className="font-mono text-[10.5px] text-muted-foreground">{total.toFixed(1)} → <strong className="text-foreground">{score}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function AllCandidates({ candidates: initialCandidates, jobs, isSuperAdmin = false }: Props) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initialCandidates);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'matrix'>('list');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sort, setSort] = useState('best');
  const [matrixSort, setMatrixSort] = useState<string | null>(null);
  const [matrixDir, setMatrixDir] = useState(1);
  const [drawerCandId, setDrawerCandId] = useState<string | null>(null);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [aiOpen, setAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiDone, setAiDone] = useState(false);
  const [aiStreamedLen, setAiStreamedLen] = useState(0);
  const [aiResponseKey, setAiResponseKey] = useState<string | null>(null);
  const [aiCards, setAiCards] = useState<Candidate[]>([]);
  const [aiText, setAiText] = useState('');
  const aiInputRef = useRef('');
  const aiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (aiIntervalRef.current) clearInterval(aiIntervalRef.current); }, []);

  const handleDeleteCandidate = async (candidateId: string, jobId: string | null) => {
    setDeletingId(candidateId);
    try {
      const url = jobId ? `/api/jobs/${jobId}/candidates/${candidateId}` : `/api/candidates/${candidateId}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (res.ok) {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
        if (drawerCandId === candidateId) setDrawerCandId(null);
      }
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filtered = (() => {
    const q = query.toLowerCase();
    let list = [...candidates];
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.currentRole.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q)));
    if (filter === 'high') list = list.filter((c) => c.score >= 88);
    if (filter === 'pipeline') list = list.filter((c) => c.status === 'processing');
    if (filter === 'starred') list = list.filter((c) => starred.has(c.id));
    if (roleFilter !== 'all') list = list.filter((c) => c.jobId === roleFilter);
    const sk = matrixSort;
    if (sort === 'best' && !sk) list.sort((a, b) => b.score - a.score);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sk) list.sort((a, b) => matrixDir * ((b.jobId === sk ? b.score : 0) - (a.jobId === sk ? a.score : 0)));
    return list;
  })();

  const totalCount = candidates.length;
  const highCount = candidates.filter((c) => c.score >= 88).length;
  const pipeCount = candidates.filter((c) => c.status === 'processing').length;
  const shortlistCount = starred.size;

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarred((prev) => { const ns = new Set(prev); ns.has(id) ? ns.delete(id) : ns.add(id); return ns; });
  };

  const submitAiQuery = (q: string) => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    const resp = AI_CANNED.find((r) => r.match(q.toLowerCase())) ?? AI_CANNED[AI_CANNED.length - 1]!;
    const built = resp.build(candidates, jobs);
    setAiText(built.text); setAiCards(built.cards); setAiQuery(q);
    setAiResponseKey(resp.key); setAiOpen(true); setAiStreaming(true); setAiDone(false); setAiStreamedLen(0);
    let len = 0;
    aiIntervalRef.current = setInterval(() => {
      len = Math.min(len + 7, built.text.length);
      setAiStreamedLen(len);
      if (len >= built.text.length) {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        aiIntervalRef.current = null;
        setAiStreaming(false); setAiDone(true);
      }
    }, 28);
  };

  const closeAi = () => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    setAiOpen(false); setAiStreaming(false); setAiDone(false); setAiStreamedLen(0); setAiResponseKey(null);
  };

  const drawerCand = drawerCandId ? candidates.find((c) => c.id === drawerCandId) ?? null : null;

  const FilterChip = ({ id, label }: { id: string; label: string }) => (
    <button
      onClick={() => setFilter(id)}
      className={cn(
        'px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition-all cursor-pointer whitespace-nowrap',
        filter === id
          ? 'bg-foreground text-background border-foreground'
          : 'bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen font-mono">
      <div className="max-w-[1460px] px-12 pt-[72px] pb-24 mx-auto animate-rise" style={{ paddingLeft: '96px' }}>

        {/* HEADER */}
        <div className="flex items-start justify-between gap-5 mb-6">
          <div>
            <p className="text-[10px] tracking-[.18em] text-muted-foreground mb-2">COREMATCH / CANDIDATE INTELLIGENCE</p>
            <h1 className="font-light text-[40px] leading-[1.05] tracking-[-0.02em] m-0" style={{ fontFamily: 'var(--font-space)' }}>
              All <span className="font-bold">Candidates</span>
            </h1>
            <p className="text-[12px] text-muted-foreground mt-1">{totalCount} screened · {jobs.length} active roles · {highCount} high-match</p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            {/* View toggle */}
            <div className="flex bg-card border border-border rounded-[11px] p-[3px] gap-0.5">
              {[
                { id: 'list', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor"/><rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor"/></svg>, label: 'List' },
                { id: 'matrix', icon: <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/></svg>, label: 'Matrix' },
              ].map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id as 'list' | 'matrix')}
                  className={cn(
                    'flex items-center gap-1 px-3 py-[7px] rounded-[9px] border-none font-mono text-[11px] cursor-pointer transition-all',
                    view === v.id ? 'bg-foreground text-background' : 'bg-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v.icon} <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
            </div>
            <Button onClick={() => router.push('/jobs')} className="gap-1.5 font-mono text-[12px] h-9">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              <span className="hidden sm:inline">Add Job</span>
            </Button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <Card className="border">
            <CardContent className="p-[18px]">
              <p className="text-[9px] tracking-[.15em] text-muted-foreground mb-2 font-mono">TOTAL SCREENED</p>
              <p className="text-[32px] font-bold leading-none" style={{ fontFamily: 'var(--font-space)' }}>{totalCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{jobs.length} active roles</p>
            </CardContent>
          </Card>
          <Card className="border border-[var(--green-border)] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-[var(--green-dark)] rounded-t-xl" />
            <CardContent className="p-[18px]">
              <p className="text-[9px] tracking-[.15em] text-muted-foreground mb-2 font-mono">HIGH MATCH ≥88</p>
              <p className="text-[32px] font-bold leading-none text-[var(--green-dark)]" style={{ fontFamily: 'var(--font-space)' }}>{highCount}</p>
              <p className="text-[11px] text-[var(--green-dark)]/70 mt-1">interview-ready</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-[18px]">
              <p className="text-[9px] tracking-[.15em] text-muted-foreground mb-2 font-mono">IN PIPELINE</p>
              <p className="text-[32px] font-bold leading-none" style={{ fontFamily: 'var(--font-space)' }}>{pipeCount}</p>
              <p className="text-[11px] text-muted-foreground mt-1">active processes</p>
            </CardContent>
          </Card>
          <Card className="border border-amber-200 dark:border-amber-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-amber-400 rounded-t-xl" />
            <CardContent className="p-[18px]">
              <p className="text-[9px] tracking-[.15em] text-muted-foreground mb-2 font-mono">SHORTLISTED</p>
              <p className="text-[32px] font-bold leading-none text-amber-600 dark:text-amber-400" style={{ fontFamily: 'var(--font-space)' }}>{shortlistCount}</p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-1">awaiting decision</p>
            </CardContent>
          </Card>
        </div>

        {/* AI COMMAND BAR */}
        <Card className="border mb-4 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-foreground flex items-center justify-center flex-shrink-0">
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill="var(--green)" /></svg>
              </div>
              <input
                onChange={(e) => { aiInputRef.current = e.target.value; }}
                onKeyDown={(e) => { if (e.key === 'Enter') { const q = aiInputRef.current.trim(); if (q) submitAiQuery(q); } }}
                placeholder='Ask anything about your talent pool… e.g. "Which candidates are highest match?"'
                className="flex-1 border-none bg-transparent outline-none font-mono text-[13px] text-foreground min-w-0 placeholder:text-muted-foreground"
              />
              <Button
                size="sm"
                onClick={() => { const q = aiInputRef.current.trim(); if (q) submitAiQuery(q); }}
                className="flex-shrink-0 font-mono text-[11px] tracking-[.08em] whitespace-nowrap"
              >
                ASK →
              </Button>
            </div>
            <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border bg-muted/50 flex-wrap">
              <span className="text-[9px] tracking-[.14em] text-muted-foreground mr-1 font-mono">INDEXING:</span>
              {['Candidate Profiles', 'Evaluated Rubrics', 'All Open Positions'].map((l) => (
                <span key={l} className="text-[9px] text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-[5px] inline-flex items-center gap-1">
                  <span className="text-[var(--green-dark)]">✔</span> {l}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* FILTER RAIL */}
        <div className="flex flex-col gap-2 mb-4">
          {/* Row 1: search + status filters + sort + count */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-2 bg-card border border-border rounded-[10px] px-3 h-8 shrink-0">
              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className="text-muted-foreground flex-shrink-0"><circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.7"/><path d="M13.6 13.6L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
              <input onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="border-none bg-transparent outline-none font-mono text-[11px] text-foreground w-24 placeholder:text-muted-foreground" />
            </div>
            <Separator orientation="vertical" className="h-5 shrink-0" />
            <div className="flex items-center gap-1">
              {[{ id: 'all', label: 'All' }, { id: 'high', label: 'High Match' }, { id: 'pipeline', label: 'In Pipeline' }, { id: 'starred', label: '★ Shortlisted' }].map((f) => (
                <FilterChip key={f.id} id={f.id} label={f.label} />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1.5 shrink-0">
              {view === 'list' && (
                <div className="flex gap-1">
                  {[{ id: 'best', label: 'Best Match' }, { id: 'name', label: 'Name' }].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSort(s.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer',
                        sort === s.id ? 'bg-foreground text-background border-foreground' : 'bg-card text-muted-foreground border-border hover:text-foreground'
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
              <span className="text-[11px] text-muted-foreground whitespace-nowrap font-mono">{filtered.length} candidates</span>
            </div>
          </div>
          {/* Row 2: role filter — horizontally scrollable */}
          {jobs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
              {[{ id: 'all', label: 'All Roles' }, ...jobs.map((j) => ({ id: j.id, label: j.title }))].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRoleFilter(r.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all cursor-pointer whitespace-nowrap shrink-0',
                    roleFilter === r.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-card text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground text-[13px]">No candidates match your filters.</div>
            )}
            {filtered.map((c) => {
              const circ = 138.2;
              const ringOff = (circ * (1 - c.score / 100)).toFixed(1);
              const isStarred = starred.has(c.id);
              const inPipe = c.status === 'processing';

              return (
                <Card
                  key={c.id}
                  onClick={() => setDrawerCandId(c.id)}
                  className={cn(
                    'border cursor-pointer transition-all duration-[180ms] hover:border-border hover:-translate-y-px hover:shadow-lg',
                    isStarred && 'border-amber-200 dark:border-amber-800'
                  )}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Score ring */}
                    <div className="relative w-[54px] h-[54px] flex-shrink-0">
                      <svg width="54" height="54" viewBox="0 0 54 54">
                        <circle cx="27" cy="27" r="22" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                        <circle cx="27" cy="27" r="22" fill="none" stroke={ringStroke(c.score)} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.2" strokeDashoffset={ringOff} transform="rotate(-90 27 27)" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={cn('font-bold text-[14px]', scoreColor(c.score))} style={{ fontFamily: 'var(--font-space)' }}>{c.score}</span>
                      </div>
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[15px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{c.name}</span>
                        {c.jobId && <BandBadge score={c.score} />}
                        {inPipe && <Badge variant="outline" className="text-[9px] tracking-[.1em] px-1.5 py-0 font-mono text-blue-600 border-blue-200 bg-blue-50 dark:text-blue-300 dark:border-blue-800 dark:bg-blue-950">IN PIPELINE</Badge>}
                        {isStarred && <Badge variant="outline" className="text-[9px] tracking-[.1em] px-1.5 py-0 font-mono text-amber-600 border-amber-200 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950">★ SHORTLISTED</Badge>}
                        {!c.jobId && <Badge variant="outline" className="text-[9px] tracking-[.1em] px-1.5 py-0 font-mono text-amber-700 border-orange-200 bg-orange-50 dark:text-amber-400 dark:border-orange-900 dark:bg-orange-950">NO MATCHING JOB</Badge>}
                      </div>
                      <p className="text-[11.5px] text-muted-foreground mb-1.5">
                        {c.currentRole}<span className="text-border"> · </span>{c.location}<span className="text-border"> · </span>{c.experience}
                      </p>
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        {c.email && (
                          <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground no-underline transition-colors">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                            {c.email}
                          </a>
                        )}
                        {c.phone && (
                          <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[10.5px] text-muted-foreground hover:text-foreground no-underline transition-colors">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                            {c.phone}
                          </a>
                        )}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {c.tags.slice(0, 5).map((t) => (
                          <span key={t} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-[5px]">{t}</span>
                        ))}
                      </div>
                    </div>

                    {/* Score pill */}
                    <div className={cn(
                      'hidden sm:block border rounded-[10px] p-3 w-24 flex-shrink-0 bg-card',
                      c.score >= 88 ? 'border-[var(--green-border)]' : c.score >= 70 ? 'border-blue-200 dark:border-blue-800' : c.score >= 50 ? 'border-amber-200 dark:border-amber-800' : 'border-destructive/30'
                    )}>
                      <div className={cn('text-[8.5px] tracking-[.1em] mb-1 font-mono whitespace-nowrap overflow-hidden text-ellipsis', scoreColor(c.score))}>
                        {c.jobCode ?? c.jobTitle ?? 'Unassigned'}
                      </div>
                      <div className={cn('font-bold text-[18px] leading-none', scoreColor(c.score))} style={{ fontFamily: 'var(--font-space)' }}>{c.score}</div>
                      <div className="h-[3px] rounded-sm bg-muted mt-1.5">
                        <div className="h-full rounded-sm" style={{ width: `${c.score}%`, background: barFill(c.score) }} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {isSuperAdmin ? (
                        confirmDeleteId === c.id ? (
                          <>
                            <span className="text-[10px] text-destructive font-mono whitespace-nowrap">Delete candidate?</span>
                            <div className="flex gap-1.5">
                              <Button size="sm" variant="destructive" disabled={deletingId === c.id} onClick={() => handleDeleteCandidate(c.id, c.jobId)} className="h-7 px-2 text-[10px] font-mono">
                                {deletingId === c.id ? '…' : 'Confirm'}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)} className="h-7 px-2 text-[10px] font-mono">Cancel</Button>
                            </div>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(c.id)} className="h-7 px-3 text-[10px] font-mono text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">Delete</Button>
                        )
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => toggleStar(c.id, e)}
                            className={cn(
                              'h-7 px-3 text-[11px] font-mono gap-1.5 whitespace-nowrap',
                              isStarred && 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950'
                            )}
                          >
                            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11 4.4 13l.7-4L2.2 6.2l4-.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill={isStarred ? 'currentColor' : 'none'}/></svg>
                            {isStarred ? 'Shortlisted' : 'Shortlist'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); if (c.jobId) router.push(`/jobs/${c.jobId}/rubric`); }} className="h-7 px-3 text-[11px] font-mono whitespace-nowrap">
                            Profile <span className="text-[var(--green-dark)] ml-1">→</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* MATRIX VIEW */}
        {view === 'matrix' && (
          <>
            <div className="text-[11px] text-muted-foreground mb-2.5 flex justify-between flex-wrap gap-1.5">
              <span>Click a column header to rank by that role · green dot = evaluated role</span>
              <span>{filtered.length} candidates</span>
            </div>
            <div className="cm-scroll overflow-x-auto rounded-[16px] border border-border bg-card">
              <div style={{ minWidth: Math.max(700, 220 + jobs.length * 140) }}>
                <div className="flex border-b-2 border-border bg-muted/50 sticky top-0 z-10">
                  <div className="w-[220px] min-w-[220px] px-4 py-3.5 border-r border-border flex-shrink-0 flex items-end">
                    <span className="text-[9px] tracking-[.15em] text-muted-foreground font-mono">CANDIDATE</span>
                  </div>
                  {jobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => { if (matrixSort === j.id) setMatrixDir((d) => d * -1); else { setMatrixSort(j.id); setMatrixDir(1); } }}
                      className="flex-1 min-w-[120px] px-3.5 py-3 border-none bg-transparent text-left cursor-pointer border-r border-border flex flex-col gap-0.5 hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-[8.5px] tracking-[.1em] text-muted-foreground font-mono">{j.code}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[13px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{j.title.length > 14 ? j.title.slice(0, 14) + '…' : j.title}</span>
                        <span className={matrixSort === j.id ? 'text-[var(--green-dark)]' : 'text-muted-foreground/40'}>{matrixSort === j.id ? (matrixDir === 1 ? '↓' : '↑') : '↕'}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">{j.scored} screened</span>
                    </button>
                  ))}
                </div>
                {filtered.map((c) => (
                  <div key={c.id} className="flex border-b border-border/50">
                    <div onClick={() => setDrawerCandId(c.id)} className="w-[220px] min-w-[220px] px-4 py-3 border-r border-border flex-shrink-0 cursor-pointer flex items-center gap-2.5 hover:bg-muted/30 transition-colors">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.location}</p>
                        {c.status === 'processing' && (
                          <Badge variant="outline" className="text-[8.5px] tracking-[.1em] px-1 py-0 mt-0.5 font-mono text-blue-600 border-blue-200 dark:text-blue-300 dark:border-blue-800">PIPELINE</Badge>
                        )}
                      </div>
                    </div>
                    {jobs.map((j) => {
                      const isMatch = c.jobId === j.id;
                      const s = isMatch ? c.score : null;
                      return (
                        <div
                          key={j.id}
                          onClick={() => setDrawerCandId(c.id)}
                          className={cn('flex-1 min-w-[120px] px-3.5 py-3 border-r border-border/50 cursor-pointer relative transition-colors hover:bg-muted/30', isMatch && 'bg-[var(--green-bg)]')}
                        >
                          {s !== null ? (
                            <>
                              <div className={cn('font-bold text-[21px] leading-none', scoreColor(s))} style={{ fontFamily: 'var(--font-space)' }}>{s}</div>
                              <div className={cn('text-[8.5px] tracking-[.1em] mt-0.5 font-mono', scoreColor(s))}>{bandLabel(s)}</div>
                              <div className="h-[3px] rounded-sm bg-muted mt-2">
                                <div className="h-full rounded-sm" style={{ width: `${s}%`, background: barFill(s) }} />
                              </div>
                              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[var(--green-dark)]" style={{ boxShadow: '0 0 0 2px var(--green-bg)' }} />
                            </>
                          ) : (
                            <div className="text-muted-foreground/30 text-[18px] font-bold" style={{ fontFamily: 'var(--font-space)' }}>—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CANDIDATE DRAWER — shadcn Sheet */}
      <Sheet open={!!drawerCand} onOpenChange={(o) => { if (!o) setDrawerCandId(null); }}>
        <SheetContent side="right" className="w-[480px] max-w-[96vw] p-0 flex flex-col overflow-hidden font-mono">
          <SheetHeader className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex-shrink-0">
            <SheetTitle className="text-[9px] tracking-[.2em] text-muted-foreground font-mono font-normal">CANDIDATE PROFILE</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 p-6 cm-scroll">
            {drawerCand && (() => {
              const c = drawerCand;
              const isStarred = starred.has(c.id);
              return (
                <>
                  {/* Identity header */}
                  <div className="flex items-start gap-3.5 mb-5">
                    <Avatar name={c.name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-[21px] leading-[1.1] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{c.name}</span>
                        {c.jobId && <BandBadge score={c.score} />}
                      </div>
                      <p className="text-[12.5px] text-muted-foreground">{c.currentRole}</p>
                      <p className="text-[11.5px] text-muted-foreground/70 mt-0.5">{c.location}<span className="text-border"> · </span>{c.experience}</p>
                      <div className="flex gap-3 mt-1.5 flex-wrap">
                        {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground no-underline"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>{c.email}</a>}
                        {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground no-underline"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>{c.phone}</a>}
                      </div>
                      <div className="flex gap-1.5 flex-wrap mt-2.5">
                        {c.tags.slice(0, 6).map((t) => (
                          <span key={t} className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-[5px]">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {c.aiHead && (
                    <div className="bg-muted/50 border-l-[3px] border-foreground pl-3.5 pr-3 py-3 rounded-r-[10px] mb-6 text-[12px] text-foreground/80 leading-[1.65]">
                      {c.aiHead}
                    </div>
                  )}

                  {!c.jobId ? (
                    <div className="mb-6">
                      <div className="flex items-center gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-[10px] mb-5 dark:bg-amber-950/40 dark:border-amber-800">
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" className="text-amber-600"/><path d="M8 6.5v2.5M8 10.5v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-amber-600"/></svg>
                        <div>
                          <p className="text-[10px] tracking-[.12em] text-amber-700 dark:text-amber-400 font-mono">NO MATCHING JOB FOUND</p>
                          <p className="text-[10.5px] text-amber-600 dark:text-amber-500 mt-0.5">This candidate was not matched to any open role.</p>
                        </div>
                      </div>

                      {c.sourceEmail && (
                        <div className="bg-blue-50/50 border border-blue-200 rounded-[10px] overflow-hidden mb-3.5 dark:bg-blue-950/30 dark:border-blue-900">
                          <div className="px-3.5 py-2.5 border-b border-blue-200 dark:border-blue-900 text-[9px] tracking-[.16em] text-blue-600 dark:text-blue-400 font-mono">SOURCE EMAIL</div>
                          <div className="px-3.5 py-3 flex flex-col gap-1.5">
                            {[['FROM', c.sourceEmail.sender], ['SUBJECT', c.sourceEmail.subject], ['RECEIVED', new Date(c.sourceEmail.receivedAt).toUTCString()]].map(([label, val]) => (
                              <div key={label} className="flex gap-2 text-[11px] font-mono">
                                <span className="text-blue-500 dark:text-blue-400 min-w-[56px]">{label}</span>
                                <span className="text-foreground/80 break-all">{val}</span>
                              </div>
                            ))}
                            {c.sourceEmail.bodyHtml && (
                              <div className="mt-2 p-3 bg-card rounded-lg border border-blue-100 dark:border-blue-900 text-[11.5px] text-foreground/80 leading-relaxed max-h-[200px] overflow-y-auto cm-scroll"
                                dangerouslySetInnerHTML={{ __html: c.sourceEmail.bodyHtml }} />
                            )}
                          </div>
                        </div>
                      )}

                      {c.resumeUrl && (
                        <a href={c.resumeUrl} download className="flex items-center justify-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-[10px] text-blue-700 font-mono text-[12px] no-underline hover:bg-blue-100 transition-colors dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-300 dark:hover:bg-blue-950/60">
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                          Download Attached Resume
                        </a>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-[9px] tracking-[.16em] text-muted-foreground mb-3 font-mono">MATCH ACROSS ALL ROLES</p>
                      <div className="flex flex-col gap-2 mb-6">
                        {jobs.map((j) => {
                          const isMatch = c.jobId === j.id;
                          const s = isMatch ? c.score : null;
                          return (
                            <div
                              key={j.id}
                              className={cn(
                                'border rounded-[12px] p-3.5',
                                s !== null && s >= 88 ? 'border-[var(--green-border)] bg-[var(--green-bg)]'
                                : s !== null && s >= 70 ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20'
                                : 'border-border bg-card'
                              )}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <div>
                                  <p className="text-[12.5px] font-semibold text-foreground mb-0.5">{j.title}</p>
                                  <p className="text-[10px] text-muted-foreground font-mono">{j.code}<span className="text-border"> · </span>{j.location}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {s !== null && <BandBadge score={s} />}
                                  <span className={cn('font-bold text-[24px] leading-none', s !== null ? scoreColor(s) : 'text-muted-foreground/30')} style={{ fontFamily: 'var(--font-space)' }}>{s !== null ? s : '—'}</span>
                                </div>
                              </div>
                              {s !== null && (
                                <>
                                  <div className="h-[6px] rounded-[3px] bg-muted">
                                    <div className="h-full rounded-[3px]" style={{ width: `${s}%`, background: barFill(s) }} />
                                  </div>
                                  {isMatch && (
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="var(--green-dark)" strokeWidth="1.6" strokeLinecap="round"/></svg>
                                      <span className="text-[10px] text-[var(--green-dark)] font-mono">Evaluated for this role</span>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {c.evaluations.length > 0 && <EvalBreakdown evaluations={c.evaluations} score={c.score} />}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <Button
                      variant={isStarred ? 'outline' : 'default'}
                      onClick={() => toggleStar(c.id)}
                      className={cn('font-mono text-[12px]', isStarred && 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950')}
                    >
                      {isStarred ? '★ Shortlisted' : '☆ Shortlist'}
                    </Button>
                    <Button variant="outline" className="font-mono text-[12px]">Schedule Interview</Button>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => { if (c.jobId) router.push(`/jobs/${c.jobId}/rubric`); }}
                    disabled={!c.jobId}
                    className="w-full font-mono text-[12px] text-muted-foreground"
                  >
                    {c.jobId ? 'View Full Rubric Evaluation →' : 'No job role assigned'}
                  </Button>
                </>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* AI COPILOT DRAWER — shadcn Sheet */}
      <Sheet open={aiOpen} onOpenChange={(o) => { if (!o) closeAi(); }}>
        <SheetContent side="right" className="w-[520px] max-w-[96vw] p-0 flex flex-col overflow-hidden font-mono">
          <SheetHeader className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-[26px] h-[26px] rounded-[8px] bg-foreground flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill="var(--green)" /></svg>
              </div>
              <SheetTitle className="text-[9px] tracking-[.2em] text-muted-foreground font-mono font-normal">AI TALENT COPILOT</SheetTitle>
            </div>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 p-6 cm-scroll">
            <div className="bg-muted/50 rounded-[12px] px-4 py-3 mb-5">
              <p className="text-[9px] tracking-[.14em] text-muted-foreground mb-1.5 font-mono">YOUR QUERY</p>
              <p className="text-[12px] text-muted-foreground/80 leading-relaxed">{aiQuery}</p>
            </div>
            <p className="text-[9px] tracking-[.16em] text-muted-foreground mb-2.5 font-mono">ENGINE RESPONSE</p>
            <div className="text-[12px] text-foreground/80 leading-[1.8] whitespace-pre-line min-h-[48px]">
              {aiText.slice(0, aiStreamedLen)}
              {aiStreaming && <span className="inline-block w-[7px] h-[13px] bg-foreground ml-0.5 align-middle pulse-dot rounded-[1px]" />}
            </div>
            {aiDone && (
              <div className="mt-6">
                {aiCards.length > 0 && (
                  <>
                    <p className="text-[9px] tracking-[.16em] text-muted-foreground mb-2.5 font-mono">TOP CANDIDATES</p>
                    <div className="flex flex-col gap-2 mb-6">
                      {aiCards.map((ac) => (
                        <Card
                          key={ac.id}
                          onClick={() => { setAiOpen(false); setDrawerCandId(ac.id); }}
                          className="border cursor-pointer hover:border-border hover:shadow-md transition-all"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3 mb-2.5">
                              <Avatar name={ac.name} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[14px] text-foreground mb-0.5" style={{ fontFamily: 'var(--font-space)' }}>{ac.name}</p>
                                <p className="text-[10.5px] text-muted-foreground">{ac.location}<span className="text-border"> · </span>{ac.experience}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-[8.5px] tracking-[.1em] text-muted-foreground mb-0.5 font-mono">{ac.jobTitle ?? 'Role'}</p>
                                <p className={cn('font-bold text-[22px] leading-none', scoreColor(ac.score))} style={{ fontFamily: 'var(--font-space)' }}>{ac.score}</p>
                              </div>
                            </div>
                            {ac.aiHead && (
                              <div className="text-[11px] text-muted-foreground leading-relaxed bg-muted/50 p-2.5 rounded-lg border-l-2 border-foreground/30">
                                {ac.aiHead.slice(0, 140)}{ac.aiHead.length > 140 ? '…' : ''}
                              </div>
                            )}
                            <div className="h-[4px] rounded-sm bg-muted mt-3">
                              <div className="h-full rounded-sm" style={{ width: `${ac.score}%`, background: barFill(ac.score) }} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
                <p className="text-[9px] tracking-[.14em] text-muted-foreground mb-2 font-mono">FOLLOW-UP SUGGESTIONS</p>
                <div className="flex flex-col gap-1.5">
                  {['"Who are my highest match candidates?"', '"Which candidates are in the pipeline?"', '"Show me shortlisted candidates."'].map((label) => (
                    <button
                      key={label}
                      onClick={() => submitAiQuery(label.replace(/^"|"$/g, ''))}
                      className="text-left border border-border bg-muted/50 px-3.5 py-2.5 rounded-[10px] font-mono text-[11px] text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                    >
                      → {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
