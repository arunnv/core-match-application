'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function EvalBreakdown({ evaluations, score }: { evaluations: EvaluationRow[]; score: number }) {
  const [open, setOpen] = useState(false);
  const total = evaluations.reduce((s, e) => s + e.weighted_points_earned, 0);
  const scoreColor = (s: number) => s >= 70 ? '#059669' : s >= 40 ? '#d97706' : '#ef4444';

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: '1px solid #e4e4e7', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#52525b', letterSpacing: '.1em' }}
      >
        <span>EVALUATION BREAKDOWN · {evaluations.length} COMPETENCIES</span>
        <span style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {evaluations.map((e, i) => {
            const hasEvidence = e.evidence_quote != null && e.evidence_quote !== '';
            const sc = scoreColor(e.competency_score_0_to_100);
            const coreMiss = e.level === 'CORE' && !hasEvidence;
            return (
              <div key={i} style={{ border: `1px solid ${coreMiss ? '#fecaca' : hasEvidence ? '#e4e4e7' : '#fde68a'}`, borderRadius: 10, padding: '10px 12px', background: coreMiss ? '#fff8f8' : '#fff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#18181b' }}>{e.competency}</span>
                    <span style={{ fontSize: 8, letterSpacing: '.1em', padding: '1px 4px', borderRadius: 3, background: e.level === 'CORE' ? '#18181b' : '#f4f4f5', color: e.level === 'CORE' ? '#fff' : '#71717a' }}>{e.level}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
                    <span style={{ fontSize: 9.5, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>{e.weight_percentage}%</span>
                    <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 16, color: sc }}>{e.competency_score_0_to_100}</span>
                    <span style={{ fontSize: 9.5, color: sc, fontFamily: 'var(--font-mono)' }}>+{e.weighted_points_earned.toFixed(1)}</span>
                  </div>
                </div>
                <div style={{ height: 2, borderRadius: 1, background: '#f1f1f2', marginBottom: 7 }}>
                  <div style={{ height: '100%', width: `${e.competency_score_0_to_100}%`, background: sc, borderRadius: 1 }} />
                </div>
                {hasEvidence ? (
                  <blockquote style={{ margin: 0, padding: '6px 10px', background: '#f8f8f9', borderLeft: '2px solid #18181b', borderRadius: '0 6px 6px 0', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#374151', lineHeight: 1.55 }}>
                    &ldquo;{e.evidence_quote}&rdquo;
                  </blockquote>
                ) : coreMiss ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                    <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>⚠ NO EVIDENCE · CORE PENALTY APPLIED</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6 }}>
                    <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#92400e', fontFamily: 'var(--font-mono)' }}>NO EVIDENCE FOUND</span>
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: 9, padding: '10px 12px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: '#71717a', letterSpacing: '.1em' }}>Σ WEIGHTED POINTS → SCORE</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#52525b' }}>{total.toFixed(1)} → <strong>{score}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}

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
  jobId: string;
  jobTitle: string | null;
  jobCode: string | null;
};

type Job = {
  id: string;
  title: string;
  code: string;
  location: string;
  scored: number;
};

type Props = {
  candidates: Candidate[];
  jobs: Job[];
};

const scoreColor = (s: number) =>
  s >= 88 ? '#059669' : s >= 70 ? '#0284c7' : s >= 50 ? '#d97706' : '#ef4444';
const ringColor = (s: number) =>
  s >= 88 ? '#059669' : s >= 70 ? '#3b82f6' : s >= 50 ? '#f59e0b' : '#ef4444';
const barColor = (s: number) =>
  s >= 88 ? '#059669' : s >= 70 ? '#3b82f6' : s >= 50 ? '#f59e0b' : '#ef4444';
const bandLabel = (s: number) =>
  s >= 88 ? 'STRONG' : s >= 70 ? 'GOOD' : s >= 50 ? 'FAIR' : 'WEAK';
const bandStyle = (s: number): React.CSSProperties => {
  const c =
    s >= 88
      ? { bg: '#ecfdf5', bd: '#a7f3d0', tx: '#065f46' }
      : s >= 70
      ? { bg: '#eff6ff', bd: '#bfdbfe', tx: '#1e3a8a' }
      : s >= 50
      ? { bg: '#fffbeb', bd: '#fcd34d', tx: '#92400e' }
      : { bg: '#fef2f2', bd: '#fecaca', tx: '#991b1b' };
  return { fontSize: 9, letterSpacing: '.12em', padding: '2px 6px', borderRadius: 5, background: c.bg, border: `1px solid ${c.bd}`, color: c.tx };
};

const AVATAR_COLORS = [
  ['#d1fae5', '#065f46'],
  ['#eff6ff', '#1e3a8a'],
  ['#fef3c7', '#92400e'],
  ['#fce7f3', '#9d174d'],
  ['#f0fdf4', '#166534'],
  ['#f5f3ff', '#4c1d95'],
];
const avatarStyle = (name: string, size = 44) => {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('');
  const i = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % AVATAR_COLORS.length;
  const [bg, color] = AVATAR_COLORS[i]!;
  return {
    initials,
    style: { width: size, height: size, borderRadius: '50%', background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.floor(size * 0.29), fontWeight: 700, flexShrink: 0 } as React.CSSProperties,
  };
};

const chipStyle = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? '#18181b' : '#e4e4e7'}`,
  background: active ? '#18181b' : '#fff',
  color: active ? '#fff' : '#52525b',
  padding: '5px 10px',
  borderRadius: 8,
  fontFamily: 'var(--font-mono),monospace',
  fontSize: 11,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const AI_CANNED = [
  {
    key: 'gems',
    match: (q: string) => q.includes('gem') || q.includes('hidden') || q.includes('cross'),
    heading: 'CROSS-ROLE GEM ANALYSIS',
    build: (cands: Candidate[], jobs: Job[]) => {
      const multi = cands
        .filter((c) => c.score >= 70)
        .slice(0, 2);
      const text = `CROSS-ROLE ANALYSIS COMPLETE\n\nSearching across ${cands.length} profiles for candidates with high match scores and versatile backgrounds...\n\nFinding: ${multi.map((c) => c.name).join(' and ')} both present strong scores in their evaluated roles and show broad skill signals applicable across your open positions.\n\nRecommendation: Broaden conversations with these candidates to explore all applicable tracks before committing to a single role pipeline.`;
      return { text, cards: multi };
    },
  },
  {
    key: 'pipeline',
    match: (q: string) =>
      q.includes('risk') || q.includes('pipeline') || q.includes('stall') || q.includes('churn'),
    heading: 'PIPELINE HEALTH SCAN',
    build: (cands: Candidate[]) => {
      const inPipe = cands.filter((c) => c.status === 'processing').slice(0, 2);
      const text = `PIPELINE HEALTH SCAN · ${inPipe.length} FLAGS\n\nAnalyzing pipeline candidates across stage velocity and engagement recency...\n\n${inPipe.length > 0 ? `Risk: ${inPipe.map((c) => `${c.name} (${c.score}% match)`).join(', ')} ${inPipe.length === 1 ? 'is' : 'are'} currently in processing. High-match candidates in pipeline are prime churn risks — expedite decisions.\n\nAction: Escalate to hiring decision within 48 hours.` : 'No critical pipeline risks detected at this time. All candidates appear to be progressing normally.'
      }`;
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

export default function AllCandidates({ candidates: initialCandidates, jobs, isSuperAdmin = false }: Props & { isSuperAdmin?: boolean }) {
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

  const handleDeleteCandidate = async (candidateId: string, jobId: string) => {
    setDeletingId(candidateId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/candidates/${candidateId}`, { method: 'DELETE' });
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
    if (q) list = list.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.currentRole.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
    if (filter === 'high') list = list.filter((c) => c.score >= 88);
    if (filter === 'pipeline') list = list.filter((c) => c.status === 'processing');
    if (filter === 'starred') list = list.filter((c) => starred.has(c.id));
    if (roleFilter !== 'all') list = list.filter((c) => c.jobId === roleFilter);
    const sk = matrixSort ?? (roleFilter !== 'all' ? null : null);
    if (sort === 'best' && !sk) list.sort((a, b) => b.score - a.score);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sk) list.sort((a, b) => matrixDir * ((b.jobId === sk ? b.score : 0) - (a.jobId === sk ? a.score : 0)));
    return list;
  })();

  const totalCount = candidates.length;
  const roleCount = jobs.length;
  const highCount = candidates.filter((c) => c.score >= 88).length;
  const pipeCount = candidates.filter((c) => c.status === 'processing').length;
  const shortlistCount = starred.size;

  const toggleStar = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setStarred((prev) => {
      const ns = new Set(prev);
      ns.has(id) ? ns.delete(id) : ns.add(id);
      return ns;
    });
  };

  const submitAiQuery = (q: string) => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    const resp = AI_CANNED.find((r) => r.match(q.toLowerCase())) ?? AI_CANNED[AI_CANNED.length - 1]!;
    const built = resp.build(candidates, jobs);
    setAiText(built.text);
    setAiCards(built.cards);
    setAiQuery(q);
    setAiResponseKey(resp.key);
    setAiOpen(true);
    setAiStreaming(true);
    setAiDone(false);
    setAiStreamedLen(0);
    let len = 0;
    aiIntervalRef.current = setInterval(() => {
      len = Math.min(len + 7, built.text.length);
      setAiStreamedLen(len);
      if (len >= built.text.length) {
        if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
        aiIntervalRef.current = null;
        setAiStreaming(false);
        setAiDone(true);
      }
    }, 28);
  };

  const closeAi = () => {
    if (aiIntervalRef.current) { clearInterval(aiIntervalRef.current); aiIntervalRef.current = null; }
    setAiOpen(false);
    setAiStreaming(false);
    setAiDone(false);
    setAiStreamedLen(0);
    setAiResponseKey(null);
  };

  const drawerCand = drawerCandId ? candidates.find((c) => c.id === drawerCandId) ?? null : null;

  const tabBase: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: '7px 12px', borderRadius: 9, border: 'none', fontFamily: 'var(--font-mono),monospace', fontSize: 11, cursor: 'pointer', transition: 'all .15s' };

  return (
    <div style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', color: '#18181b', minHeight: '100vh', background: '#f4f4f5', backgroundImage: 'radial-gradient(#e4e4e7 1px,transparent 1px)', backgroundSize: '32px 32px' }}>
      <style>{`
        @keyframes cm-rise{from{transform:translateY(10px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes cm-pulse{0%,100%{opacity:.5;}50%{opacity:1;}}
        @keyframes cm-in{from{transform:translateX(48px);opacity:0;}to{transform:translateX(0);opacity:1;}}
        @keyframes cm-fade{from{opacity:0;}to{transform:opacity(1);}}
        .cm-scroll::-webkit-scrollbar{width:5px;height:5px;}
        .cm-scroll::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:3px;}
        .cm-scroll::-webkit-scrollbar-track{background:transparent;}
        .cm-row-hover:hover{border-color:#c4c4c8!important;box-shadow:0 12px 28px -16px rgba(24,24,27,.2)!important;transform:translateY(-1px)!important;}
        .cm-chip-hover:hover{border-color:#18181b!important;color:#18181b!important;}
        .cm-cell-hover:hover{background:#f9fafb!important;}
        .cm-card-hover:hover{border-color:#c4c4c8!important;box-shadow:0 6px 22px -10px rgba(24,24,27,.18)!important;}
        @media(max-width:768px){
          .cm-pad{padding:72px 14px 80px!important;}
          .cm-flexhdr{flex-direction:column!important;align-items:flex-start!important;gap:12px!important;}
          .cm-g4{grid-template-columns:repeat(2,1fr)!important;gap:10px!important;}
          .cm-hidem{display:none!important;}
          .cm-chips{flex-wrap:wrap!important;}
          .cm-listrow{flex-direction:column!important;align-items:flex-start!important;gap:10px!important;}
          .cm-listscores{flex-wrap:wrap!important;}
          .cm-listacts{width:100%!important;flex-direction:row!important;align-items:center!important;border-top:1px solid #f4f4f5;padding-top:10px!important;}
        }
      `}</style>

      {/* PAGE */}
      <div style={{ maxWidth: 1460, padding: '72px 48px 90px', margin: '0 auto', animation: 'cm-rise .4s ease forwards' }} className="cm-pad">

        {/* HEADER */}
        <div className="cm-flexhdr" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 26 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.18em', color: '#a1a1aa', marginBottom: 8 }}>COREMATCH / CANDIDATE INTELLIGENCE</div>
            <h1 style={{ fontFamily: 'var(--font-space), sans-serif', fontWeight: 300, fontSize: 40, lineHeight: 1.05, letterSpacing: '-.02em', margin: '0 0 5px', color: '#18181b' }}>
              All <span style={{ fontWeight: 700 }}>Candidates</span>
            </h1>
            <div style={{ fontSize: 12, color: '#71717a' }}>{totalCount} screened · {roleCount} active roles · {highCount} high-match</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
            <div style={{ display: 'flex', background: '#fff', border: '1px solid #e4e4e7', borderRadius: 11, padding: 3, gap: 2 }}>
              <button onClick={() => setView('list')} style={{ ...tabBase, ...(view === 'list' ? { background: '#18181b', color: '#fff' } : { background: 'transparent', color: '#71717a' }) }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" /><rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" /><rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" /></svg>
                <span className="cm-hidem" style={{ marginLeft: 4 }}>List</span>
              </button>
              <button onClick={() => setView('matrix')} style={{ ...(view === 'matrix' ? { background: '#18181b', color: '#fff' } : { background: 'transparent', color: '#71717a' }), display: 'flex', alignItems: 'center', padding: '7px 12px', borderRadius: 9, border: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer' }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" /><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" /><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" /><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" /></svg>
                <span className="cm-hidem" style={{ marginLeft: 4 }}>Matrix</span>
              </button>
            </div>
            <button
              onClick={() => router.push('/jobs')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#18181b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <span className="cm-hidem">Add Job</span>
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="cm-g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 9, letterSpacing: '.15em', color: '#a1a1aa', marginBottom: 8 }}>TOTAL SCREENED</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 32, color: '#18181b', lineHeight: 1 }}>{totalCount}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 5 }}>{roleCount} active roles</div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #a7f3d0', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#059669', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 9, letterSpacing: '.15em', color: '#a1a1aa', marginBottom: 8 }}>HIGH MATCH ≥88</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 32, color: '#059669', lineHeight: 1 }}>{highCount}</div>
            <div style={{ fontSize: 11, color: '#065f46', marginTop: 5 }}>interview-ready</div>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e4e4e7', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 9, letterSpacing: '.15em', color: '#a1a1aa', marginBottom: 8 }}>IN PIPELINE</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 32, color: '#18181b', lineHeight: 1 }}>{pipeCount}</div>
            <div style={{ fontSize: 11, color: '#71717a', marginTop: 5 }}>active processes</div>
          </div>
          <div style={{ background: '#fff', border: '1.5px solid #fcd34d', borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f59e0b', borderRadius: '14px 14px 0 0' }} />
            <div style={{ fontSize: 9, letterSpacing: '.15em', color: '#a1a1aa', marginBottom: 8 }}>SHORTLISTED</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 32, color: '#d97706', lineHeight: 1 }}>{shortlistCount}</div>
            <div style={{ fontSize: 11, color: '#92400e', marginTop: 5 }}>awaiting decision</div>
          </div>
        </div>

        {/* AI COMMAND BAR */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ background: '#fff', border: '1.5px solid #e4e4e7', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="17" height="17" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill="#10b981" /></svg>
              </div>
              <input
                onChange={(e) => { aiInputRef.current = e.target.value; }}
                onKeyDown={(e) => { if (e.key === 'Enter') { const q = aiInputRef.current.trim(); if (q) submitAiQuery(q); } }}
                placeholder='Ask anything about your talent pool… (e.g., "Which candidates are highest match?")'
                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#18181b', minWidth: 0, lineHeight: 1.4 }}
              />
              <button
                onClick={() => { const q = aiInputRef.current.trim(); if (q) submitAiQuery(q); }}
                style={{ flexShrink: 0, background: '#18181b', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '.08em', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >ASK →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 18px', borderTop: '1px solid #f4f4f5', background: '#fafafa', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', marginRight: 3 }}>INDEXING:</span>
              {['Candidate Profiles', 'Evaluated Rubrics', 'All Open Positions'].map((l) => (
                <span key={l} style={{ fontSize: 9, color: '#71717a', background: '#fff', border: '1px solid #e9e9eb', padding: '2px 8px', borderRadius: 5, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ color: '#059669' }}>✔</span> {l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FILTER RAIL */}
        <div className="cm-chips" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 10, padding: '0 11px', height: 36 }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.2" stroke="#a1a1aa" strokeWidth="1.7" /><path d="M13.6 13.6L17 17" stroke="#a1a1aa" strokeWidth="1.7" strokeLinecap="round" /></svg>
            <input
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 11.5, color: '#18181b', width: 88 }}
            />
          </div>
          <div style={{ width: 1, height: 24, background: '#e4e4e7', flexShrink: 0 }} />
          <div className="cm-chips" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All' },
              { id: 'high', label: 'High Match' },
              { id: 'pipeline', label: 'In Pipeline' },
              { id: 'starred', label: '★ Shortlisted' },
            ].map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)} style={chipStyle(filter === f.id)}>{f.label}</button>
            ))}
          </div>
          {jobs.length > 0 && (
            <>
              <div style={{ width: 1, height: 24, background: '#e4e4e7', flexShrink: 0 }} />
              <div className="cm-chips" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <button onClick={() => setRoleFilter('all')} style={chipStyle(roleFilter === 'all')}>All Roles</button>
                {jobs.map((j) => (
                  <button key={j.id} onClick={() => setRoleFilter(j.id)} style={chipStyle(roleFilter === j.id)}>{j.title.length > 18 ? j.title.slice(0, 18) + '…' : j.title}</button>
                ))}
              </div>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            {view === 'list' && (
              <div className="cm-chips" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {[{ id: 'best', label: 'Best Match' }, { id: 'name', label: 'Name' }].map((s) => (
                  <button key={s.id} onClick={() => setSort(s.id)} style={chipStyle(sort === s.id)}>{s.label}</button>
                ))}
              </div>
            )}
            <span style={{ fontSize: 11, color: '#a1a1aa', whiteSpace: 'nowrap' }}>{filtered.length} candidates</span>
          </div>
        </div>

        {/* LIST VIEW */}
        {view === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#a1a1aa', fontSize: 13 }}>No candidates match your filters.</div>
            )}
            {filtered.map((c) => {
              const circ = 138.2;
              const ringOff = (circ * (1 - c.score / 100)).toFixed(1);
              const isStarred = starred.has(c.id);
              const av = avatarStyle(c.name);
              const inPipe = c.status === 'processing';
              return (
                <div
                  key={c.id}
                  className="cm-listrow cm-row-hover"
                  onClick={() => setDrawerCandId(c.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 18,
                    background: '#fff',
                    border: `1.5px solid ${isStarred ? '#fcd34d' : '#ececed'}`,
                    borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all .18s',
                  }}
                >
                  {/* Score ring */}
                  <div style={{ position: 'relative', width: 54, height: 54, flexShrink: 0 }}>
                    <svg width="54" height="54" viewBox="0 0 54 54">
                      <circle cx="27" cy="27" r="22" fill="none" stroke="#f1f1f2" strokeWidth="5" />
                      <circle cx="27" cy="27" r="22" fill="none" stroke={ringColor(c.score)} strokeWidth="5" strokeLinecap="round" strokeDasharray="138.2" strokeDashoffset={ringOff} transform="rotate(-90 27 27)" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 14, color: '#18181b' }}>{c.score}</span>
                    </div>
                  </div>

                  {/* Identity */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 15, color: '#18181b' }}>{c.name}</span>
                      <span style={bandStyle(c.score)}>{bandLabel(c.score)}</span>
                      {inPipe && <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#0369a1', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 6px', borderRadius: 5 }}>IN PIPELINE</span>}
                      {isStarred && <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#d97706', background: '#fffbeb', border: '1px solid #fcd34d', padding: '2px 6px', borderRadius: 5 }}>★ SHORTLISTED</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 5 }}>
                      {c.currentRole}<span style={{ color: '#d4d4d8' }}> · </span>{c.location}<span style={{ color: '#d4d4d8' }}> · </span>{c.experience}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 7, flexWrap: 'wrap' }}>
                      {c.email && (
                        <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#52525b', textDecoration: 'none' }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#a1a1aa" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="#a1a1aa" strokeWidth="1.4" strokeLinecap="round"/></svg>
                          {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: '#52525b', textDecoration: 'none' }}>
                          <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="#a1a1aa" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                          {c.phone}
                        </a>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {c.tags.slice(0, 5).map((t) => (
                        <span key={t} style={{ fontSize: 10, color: '#52525b', background: '#f4f4f5', padding: '2px 7px', borderRadius: 5 }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  {/* Job pill */}
                  <div className="cm-listscores cm-hidem" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ background: '#fafafa', border: `1px solid ${c.score >= 88 ? '#a7f3d0' : c.score >= 70 ? '#bfdbfe' : c.score >= 50 ? '#fcd34d' : '#fecaca'}`, borderRadius: 10, padding: '10px 12px', width: 96, flexShrink: 0 }}>
                      <div style={{ fontSize: 8.5, letterSpacing: '.1em', color: scoreColor(c.score), marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.jobCode ?? c.jobTitle ?? 'Role'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 18, lineHeight: 1, color: scoreColor(c.score) }}>{c.score}</div>
                      <div style={{ height: 3, borderRadius: 2, background: '#f1f1f2', marginTop: 6, width: '100%' }}>
                        <div style={{ height: '100%', width: `${c.score}%`, background: barColor(c.score), borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="cm-listacts" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {isSuperAdmin ? (
                      confirmDeleteId === c.id ? (
                        <>
                          <span style={{ fontSize: 10, color: '#ef4444', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>Delete candidate?</span>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleDeleteCandidate(c.id, c.jobId)}
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
                        </>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(c.id)}
                          style={{ padding: '6px 13px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff8f8', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Delete
                        </button>
                      )
                    ) : (
                      <>
                        <button
                          onClick={(e) => toggleStar(c.id, e)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            border: `1px solid ${isStarred ? '#fcd34d' : '#e4e4e7'}`,
                            background: isStarred ? '#fffbeb' : '#fff',
                            color: isStarred ? '#d97706' : '#52525b',
                            padding: '5px 11px', borderRadius: 8,
                            fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2l1.8 3.6 4 .6-2.9 2.8.7 4L8 11 4.4 13l.7-4L2.2 6.2l4-.6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" fill={isStarred ? 'currentColor' : 'none'} /></svg>
                          {isStarred ? 'Shortlisted' : 'Shortlist'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/jobs/${c.jobId}/rubric`); }}
                          style={{ border: '1px solid #e4e4e7', background: 'transparent', padding: '5px 11px', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                          Profile <span style={{ color: '#059669' }}>→</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MATRIX VIEW */}
        {view === 'matrix' && (
          <>
            <div style={{ fontSize: 11, color: '#a1a1aa', marginBottom: 10, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
              <span>Click a column header to rank by that role · green dot = candidate&apos;s evaluated role</span>
              <span>{filtered.length} candidates</span>
            </div>
            <div className="cm-scroll" style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid #e4e4e7', background: '#fff' }}>
              <div style={{ minWidth: Math.max(700, 220 + jobs.length * 140) }}>
                {/* Header */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e4e4e7', background: '#fafafa', position: 'sticky', top: 0, zIndex: 10 }}>
                  <div style={{ width: 220, minWidth: 220, padding: '14px 18px', borderRight: '1px solid #ececed', flexShrink: 0, display: 'flex', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: 9, letterSpacing: '.15em', color: '#a1a1aa' }}>CANDIDATE</span>
                  </div>
                  {jobs.map((j) => (
                    <button
                      key={j.id}
                      onClick={() => {
                        if (matrixSort === j.id) setMatrixDir((d) => d * -1);
                        else { setMatrixSort(j.id); setMatrixDir(1); }
                      }}
                      style={{ flex: 1, minWidth: 120, padding: '12px 14px', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', borderRight: '1px solid #ececed', display: 'flex', flexDirection: 'column', gap: 2 }}
                    >
                      <div style={{ fontSize: 8.5, letterSpacing: '.1em', color: '#a1a1aa' }}>{j.code}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 13, color: '#18181b' }}>{j.title.length > 14 ? j.title.slice(0, 14) + '…' : j.title}</span>
                        <span style={{ color: matrixSort === j.id ? '#059669' : '#d4d4d8' }}>{matrixSort === j.id ? (matrixDir === 1 ? '↓' : '↑') : '↕'}</span>
                      </div>
                      <div style={{ fontSize: 10, color: '#a1a1aa' }}>{j.scored} screened</div>
                    </button>
                  ))}
                </div>
                {/* Rows */}
                {filtered.map((c) => {
                  const av = avatarStyle(c.name, 36);
                  return (
                    <div key={c.id} style={{ display: 'flex', borderBottom: '1px solid #f4f4f5' }}>
                      <div
                        onClick={() => setDrawerCandId(c.id)}
                        style={{ width: 220, minWidth: 220, padding: '12px 18px', borderRight: '1px solid #ececed', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <div style={av.style}>{av.initials}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                          <div style={{ fontSize: 10, color: '#a1a1aa', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.location}</div>
                          {c.status === 'processing' && <span style={{ fontSize: 8.5, letterSpacing: '.1em', color: '#0369a1', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '1px 5px', borderRadius: 4, display: 'inline-block', marginTop: 3 }}>PIPELINE</span>}
                        </div>
                      </div>
                      {jobs.map((j) => {
                        const isMatch = c.jobId === j.id;
                        const s = isMatch ? c.score : null;
                        return (
                          <div
                            key={j.id}
                            onClick={() => setDrawerCandId(c.id)}
                            className="cm-cell-hover"
                            style={{ flex: 1, minWidth: 120, padding: '12px 14px', borderRight: '1px solid #f4f4f5', cursor: 'pointer', position: 'relative', background: isMatch ? '#f0fdf4' : 'transparent' }}
                          >
                            {s !== null ? (
                              <>
                                <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 21, lineHeight: 1, color: scoreColor(s) }}>{s}</div>
                                <div style={{ fontSize: 8.5, letterSpacing: '.1em', color: scoreColor(s), marginTop: 2 }}>{bandLabel(s)}</div>
                                <div style={{ height: 3, borderRadius: 2, background: '#f1f1f2', marginTop: 8 }}>
                                  <div style={{ height: '100%', width: `${s}%`, background: barColor(s), borderRadius: 2 }} />
                                </div>
                                <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#059669', boxShadow: '0 0 0 2px #ecfdf5' }} />
                              </>
                            ) : (
                              <div style={{ color: '#d4d4d8', fontSize: 18, fontFamily: 'var(--font-space)', fontWeight: 700 }}>—</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* CANDIDATE DRAWER */}
      {drawerCand && (
        <>
          <div onClick={() => setDrawerCandId(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,24,27,.18)', backdropFilter: 'blur(2px)', animation: 'cm-fade .22s ease' }} />
          <div className="cm-scroll" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61, width: 480, maxWidth: '96vw', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-24px 0 64px -24px rgba(24,24,27,.28)', overflowY: 'auto', animation: 'cm-in .38s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f1f2', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ fontSize: 9, letterSpacing: '.2em', color: '#a1a1aa' }}>CANDIDATE PROFILE</div>
              <button onClick={() => setDrawerCandId(null)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              {(() => {
                const c = drawerCand;
                const av = avatarStyle(c.name, 56);
                const isStarred = starred.has(c.id);
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
                      <div style={av.style}>{av.initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 21, lineHeight: 1.1, color: '#18181b' }}>{c.name}</span>
                          <span style={bandStyle(c.score)}>{bandLabel(c.score)}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: '#71717a' }}>{c.currentRole}</div>
                        <div style={{ fontSize: 11.5, color: '#a1a1aa', marginTop: 1 }}>{c.location}<span style={{ color: '#d4d4d8' }}> · </span>{c.experience}</div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                          {c.email && (
                            <a href={`mailto:${c.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#52525b', textDecoration: 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#a1a1aa" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="#a1a1aa" strokeWidth="1.4" strokeLinecap="round"/></svg>
                              {c.email}
                            </a>
                          )}
                          {c.phone && (
                            <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#52525b', textDecoration: 'none' }}>
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="#a1a1aa" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                              {c.phone}
                            </a>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                          {c.tags.slice(0, 6).map((t) => (
                            <span key={t} style={{ fontSize: 10, color: '#52525b', background: '#f4f4f5', padding: '3px 8px', borderRadius: 5 }}>{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {c.aiHead && (
                      <div style={{ background: '#f8f8f9', borderLeft: '3px solid #18181b', padding: '12px 14px', borderRadius: '0 10px 10px 0', marginBottom: 24, fontSize: 12, color: '#374151', lineHeight: 1.65 }}>
                        {c.aiHead}
                      </div>
                    )}

                    <div style={{ fontSize: 9, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 12 }}>MATCH ACROSS ALL ROLES</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      {jobs.map((j) => {
                        const isMatch = c.jobId === j.id;
                        const s = isMatch ? c.score : null;
                        return (
                          <div key={j.id} style={{ border: `1px solid ${s !== null && s >= 88 ? '#a7f3d0' : s !== null && s >= 70 ? '#bfdbfe' : '#ececed'}`, borderRadius: 12, padding: '14px 16px', background: s !== null && s >= 88 ? '#f0fdf4' : s !== null && s >= 70 ? '#f8fbff' : '#fff' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                              <div>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b', marginBottom: 2 }}>{j.title}</div>
                                <div style={{ fontSize: 10, color: '#a1a1aa' }}>{j.code}<span style={{ color: '#d4d4d8' }}> · </span>{j.location}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                {s !== null && <span style={bandStyle(s)}>{bandLabel(s)}</span>}
                                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 24, lineHeight: 1, color: s !== null ? scoreColor(s) : '#d4d4d8' }}>{s !== null ? s : '—'}</span>
                              </div>
                            </div>
                            {s !== null && (
                              <>
                                <div style={{ height: 6, borderRadius: 3, background: '#ececed' }}>
                                  <div style={{ height: '100%', width: `${s}%`, background: barColor(s), borderRadius: 3 }} />
                                </div>
                                {isMatch && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8 }}>
                                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 3.5" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" /></svg>
                                    <span style={{ fontSize: 10, color: '#059669' }}>Evaluated for this role</span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Evaluation breakdown */}
                    {c.evaluations.length > 0 && (
                      <EvalBreakdown evaluations={c.evaluations} score={c.score} />
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <button
                        onClick={() => toggleStar(c.id)}
                        style={{ padding: 12, borderRadius: 11, border: `1.5px solid ${isStarred ? '#f59e0b' : '#18181b'}`, background: isStarred ? '#fffbeb' : '#18181b', color: isStarred ? '#d97706' : '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
                      >
                        {isStarred ? '★ Shortlisted' : '☆ Shortlist'}
                      </button>
                      <button style={{ padding: 12, borderRadius: 11, border: '1.5px solid #e4e4e7', background: '#fff', color: '#52525b', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>Schedule Interview</button>
                    </div>
                    <button
                      onClick={() => router.push(`/jobs/${c.jobId}/rubric`)}
                      style={{ width: '100%', padding: 11, borderRadius: 11, border: '1px solid #f1f1f2', background: '#f8f8f9', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
                    >
                      View Full Rubric Evaluation →
                    </button>
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* AI COPILOT DRAWER */}
      {aiOpen && (
        <>
          <div onClick={closeAi} style={{ position: 'fixed', inset: 0, zIndex: 62, background: 'rgba(24,24,27,.12)', backdropFilter: 'blur(1px)', animation: 'cm-fade .22s ease' }} />
          <div className="cm-scroll" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 63, width: 520, maxWidth: '96vw', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-24px 0 64px -24px rgba(24,24,27,.28)', overflowY: 'auto', animation: 'cm-in .38s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f1f2', padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: '#18181b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none"><path d="M10 2l1.5 4.5L16 8l-4.5 1.5L10 14l-1.5-4.5L4 8l4.5-1.5z" fill="#10b981" /></svg>
                </div>
                <span style={{ fontSize: 9, letterSpacing: '.2em', color: '#a1a1aa' }}>AI TALENT COPILOT</span>
              </div>
              <button onClick={closeAi} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <div style={{ background: '#f4f4f5', borderRadius: 12, padding: '12px 16px', marginBottom: 22 }}>
                <div style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 5 }}>YOUR QUERY</div>
                <div style={{ fontSize: 12, color: '#52525b', lineHeight: 1.5 }}>{aiQuery}</div>
              </div>
              <div style={{ fontSize: 9, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 10 }}>ENGINE RESPONSE</div>
              <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.8, whiteSpace: 'pre-line', minHeight: 48 }}>
                {aiText.slice(0, aiStreamedLen)}
                {aiStreaming && <span style={{ display: 'inline-block', width: 7, height: 13, background: '#18181b', marginLeft: 2, verticalAlign: 'middle', animation: 'cm-pulse .7s infinite', borderRadius: 1 }} />}
              </div>
              {aiDone && (
                <div style={{ marginTop: 26 }}>
                  {aiCards.length > 0 && (
                    <>
                      <div style={{ fontSize: 9, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 10 }}>TOP CANDIDATES</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 26 }}>
                        {aiCards.map((ac) => {
                          const av = avatarStyle(ac.name);
                          return (
                            <div
                              key={ac.id}
                              onClick={() => { setAiOpen(false); setDrawerCandId(ac.id); }}
                              className="cm-card-hover"
                              style={{ border: '1px solid #e4e4e7', borderRadius: 14, padding: 16, cursor: 'pointer', transition: 'all .15s' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                                <div style={av.style}>{av.initials}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#18181b', marginBottom: 2 }}>{ac.name}</div>
                                  <div style={{ fontSize: 10.5, color: '#71717a' }}>{ac.location}<span style={{ color: '#d4d4d8' }}> · </span>{ac.experience}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 8.5, letterSpacing: '.1em', color: '#a1a1aa', marginBottom: 2 }}>{ac.jobTitle ?? 'Role'}</div>
                                  <div style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 22, lineHeight: 1, color: scoreColor(ac.score) }}>{ac.score}</div>
                                </div>
                              </div>
                              {ac.aiHead && (
                                <div style={{ fontSize: 11, color: '#52525b', lineHeight: 1.6, background: '#f8f8f9', padding: '10px 12px', borderRadius: 8, borderLeft: '2px solid #18181b' }}>
                                  {ac.aiHead.slice(0, 140)}{ac.aiHead.length > 140 ? '…' : ''}
                                </div>
                              )}
                              <div style={{ height: 4, borderRadius: 2, background: '#f1f1f2', marginTop: 12 }}>
                                <div style={{ height: '100%', width: `${ac.score}%`, background: barColor(ac.score), borderRadius: 2 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  <div style={{ fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>FOLLOW-UP SUGGESTIONS</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {[
                      '→ "Who are my highest match candidates?"',
                      '→ "Which candidates are in the pipeline?"',
                      '→ "Show me shortlisted candidates."',
                    ].map((label) => (
                      <button
                        key={label}
                        onClick={() => submitAiQuery(label.replace(/^→ "|"$/g, ''))}
                        style={{ textAlign: 'left', border: '1px solid #e4e4e7', background: '#fafafa', padding: '10px 14px', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#71717a', cursor: 'pointer', lineHeight: 1.4, transition: 'all .15s' }}
                      >{label}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
