'use client';

import { useState } from 'react';
import { bandForScore, ringOffset, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type EvaluationRow = {
  competency: string;
  level: string;
  weight_percentage: number;
  evidence_quote: string | null;
  competency_score_0_to_100: number;
  weighted_points_earned: number;
  reasoning: string;
};

type Capability = { label: string; note: string; w: number };
type Gap = { label: string; note: string; w: number };

type SourceEmail = {
  sender: string;
  subject: string;
  bodyHtml: string;
  receivedAt: string;
} | null;

type Candidate = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  currentRole: string;
  location: string;
  experience: string;
  score: number;
  aiHead: string;
  aiReasoning: string[];
  capabilities: Capability[];
  gaps: Gap[];
  evaluations?: EvaluationRow[];
  sourceEmail?: SourceEmail;
  resumeUrl?: string | null;
};

export default function ScorecardDrawer({
  candidate: c,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  const band = bandForScore(c.score);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const evals = c.evaluations ?? [];
  const hasEvals = evals.length > 0;
  const computedTotal = evals.reduce((s, e) => s + e.weighted_points_earned, 0);

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[60] bg-black/15 backdrop-blur-[1.5px]" />
      <div onClick={onClose} className="fixed inset-0 z-[59]" />

      <div
        className="cm-scroll animate-drawerin fixed top-0 right-0 bottom-0 z-[61] w-[480px] max-w-[94vw] bg-card border-l border-border overflow-y-auto"
        style={{ boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)' }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-border px-6 py-4 backdrop-blur-md"
          style={{ background: 'var(--topbar-bg)' }}>
          <div className="text-[10px] tracking-[.2em] text-muted-foreground">EXPLAINABLE SCORECARD</div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-8 w-8 rounded-[10px] font-mono text-[15px]">✕</Button>
        </div>

        <div className="p-6 flex flex-col gap-0">

          {/* BLOCK 1: Identity */}
          <div className="flex items-start gap-4 pb-5 border-b border-border">
            <div className="relative w-16 h-16 shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
                <circle cx="32" cy="32" r="27" fill="none" stroke={band.color} strokeWidth="5" strokeLinecap="round"
                  strokeDasharray="169.6" strokeDashoffset={ringOffset(c.score, 169.6)}
                  transform="rotate(-90 32 32)"
                  style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-semibold text-[18px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>
                {c.score}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-bold text-[18px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>{c.name}</span>
                <span className="text-[9px] tracking-[.14em] px-2 py-0.5 rounded-[5px] border" style={{ color: band.color, background: band.bg, borderColor: band.bd }}>
                  {band.label}
                </span>
              </div>
              <div className="text-[11.5px] text-muted-foreground mb-1.5">
                {c.currentRole} <span className="text-border">·</span> {c.location} <span className="text-border">·</span> {c.experience}
              </div>
              <div className="flex flex-col gap-0.5">
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground no-underline hover:text-foreground transition-colors" style={{ fontFamily: 'var(--font-mono)' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground no-underline hover:text-foreground transition-colors" style={{ fontFamily: 'var(--font-mono)' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                    {c.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* BLOCK 2: Aggregate Score */}
          <div className="mt-4 bg-muted/50 border border-border rounded-xl p-4">
            <div className="flex items-end justify-between mb-2">
              <div>
                <div className="text-[9px] tracking-[.16em] text-muted-foreground mb-1">AGGREGATE SCORE</div>
                <div className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  Σ weighted_points_earned = {computedTotal.toFixed(1)} → capped at 100
                </div>
              </div>
              <span className="font-bold text-[36px] leading-none" style={{ fontFamily: 'var(--font-space)', color: band.color }}>{c.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-border/60">
              <div className="h-full rounded-full transition-[width_.9s_cubic-bezier(.22,1,.36,1)]" style={{ width: `${c.score}%`, background: band.color }} />
            </div>
          </div>

          {/* BLOCK 3: Evaluation Breakdown */}
          {hasEvals && (
            <div className="mt-3.5">
              <button
                onClick={() => setBreakdownOpen((o) => !o)}
                className="w-full flex items-center justify-between bg-foreground text-background rounded-[10px] px-4 py-3 cursor-pointer border-none text-[10.5px] tracking-[.12em]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span>EVALUATION BREAKDOWN · {evals.length} COMPETENCIES</span>
                <span className={cn('opacity-70 transition-transform duration-200', breakdownOpen && 'rotate-180')}>▾</span>
              </button>

              {breakdownOpen && (
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {evals.map((e, i) => {
                    const hasEvidence = e.evidence_quote != null && e.evidence_quote !== '';
                    const sc = e.competency_score_0_to_100 >= 70 ? '#059669' : e.competency_score_0_to_100 >= 40 ? '#d97706' : '#ef4444';
                    const coreMiss = e.level === 'CORE' && !hasEvidence;

                    return (
                      <div
                        key={i}
                        className={cn('border rounded-[10px] p-3', coreMiss ? 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900' : hasEvidence ? 'border-border bg-card' : 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900')}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[12.5px] font-semibold text-foreground">{e.competency}</span>
                            <span className={cn('text-[8px] tracking-[.1em] px-1.5 py-0.5 rounded-[3px]', e.level === 'CORE' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>
                              {e.level}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[9.5px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{e.weight_percentage}% wt</span>
                            <span className="font-bold text-[18px] leading-none" style={{ fontFamily: 'var(--font-space)', color: sc }}>{e.competency_score_0_to_100}</span>
                            <span className="text-[9.5px]" style={{ fontFamily: 'var(--font-mono)', color: sc }}>+{e.weighted_points_earned.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="h-[3px] rounded-full bg-border/60 mb-2">
                          <div className="h-full rounded-full" style={{ width: `${e.competency_score_0_to_100}%`, background: sc }} />
                        </div>

                        {hasEvidence ? (
                          <blockquote className="m-0 p-2 bg-muted/70 border-l-2 border-foreground rounded-r-[7px] text-[10.5px] text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
                            &ldquo;{e.evidence_quote}&rdquo;
                          </blockquote>
                        ) : coreMiss ? (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-[7px]">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="#ef4444" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.5v2.5M8 10.5v.1" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            <span className="text-[9.5px] tracking-[.1em] text-red-700 dark:text-red-400" style={{ fontFamily: 'var(--font-mono)' }}>NO EVIDENCE FOUND · CORE PENALTY APPLIED</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 rounded-[7px]">
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.5v2.5M8 10.5v.1" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            <span className="text-[9.5px] tracking-[.1em] text-yellow-800 dark:text-yellow-400" style={{ fontFamily: 'var(--font-mono)' }}>NO EVIDENCE FOUND</span>
                          </div>
                        )}

                        <div className="mt-1.5 text-[10px] text-muted-foreground leading-snug">{e.reasoning}</div>
                      </div>
                    );
                  })}

                  <div className="border border-border rounded-[9px] px-3 py-2.5 bg-muted/40 flex items-center justify-between">
                    <span className="text-[9.5px] text-muted-foreground tracking-[.1em]" style={{ fontFamily: 'var(--font-mono)' }}>Σ WEIGHTED POINTS → SCORE</span>
                    <span className="text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                      {computedTotal.toFixed(1)} → cap 100 → <strong className="text-[16px]" style={{ fontFamily: 'var(--font-space)', color: band.color }}>{c.score}</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback capabilities */}
          {!hasEvals && c.capabilities.length > 0 && (
            <div className="mt-4">
              <div className="text-[10px] tracking-[.16em] text-muted-foreground mb-2.5">CAPABILITIES MATCHED</div>
              <div className="flex flex-col gap-1.5">
                {c.capabilities.map((cap, i) => (
                  <div key={i} className="flex gap-2.5 p-3 bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-[10px]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-foreground">{cap.label}</span>
                        <span className="text-[10px] text-[var(--green)] bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded-[5px]">{cap.w}% wt</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{cap.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BLOCK 4: AI Summary */}
          <div className="mt-4 bg-muted/40 rounded-[10px] border border-border overflow-hidden">
            <button
              onClick={() => setSummaryOpen((o) => !o)}
              className="w-full flex items-center justify-between bg-transparent border-none px-3.5 py-3 cursor-pointer text-[10px] text-muted-foreground tracking-[.14em]"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <span>AI AUDIT SUMMARY (supplementary)</span>
              <span className={cn('transition-transform duration-200', summaryOpen && 'rotate-180')}>▾</span>
            </button>
            {summaryOpen && (
              <div className="px-3.5 pb-3.5 border-t border-border">
                {c.aiHead && <p className="mt-2.5 mb-1.5 text-[12px] text-muted-foreground leading-relaxed font-medium">{c.aiHead}</p>}
                {c.aiReasoning.map((p, i) => (
                  <p key={i} className="mb-1.5 text-[12px] text-muted-foreground leading-relaxed">{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* BLOCK 5: Source Email */}
          {c.sourceEmail && (
            <div className="mt-4 bg-sky-50/60 dark:bg-sky-950/20 rounded-[10px] border border-sky-200 dark:border-sky-900 overflow-hidden">
              <button
                onClick={() => setEmailOpen((o) => !o)}
                className="w-full flex items-center justify-between bg-transparent border-none px-3.5 py-3 cursor-pointer text-[10px] text-sky-700 dark:text-sky-400 tracking-[.14em]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span className="flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  SOURCE APPLICATION EMAIL
                </span>
                <span className={cn('transition-transform duration-200', emailOpen && 'rotate-180')}>▾</span>
              </button>
              {emailOpen && (
                <div className="px-3.5 pb-3.5 border-t border-sky-200 dark:border-sky-900">
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    {[
                      { label: 'FROM', value: c.sourceEmail.sender },
                      { label: 'SUBJECT', value: c.sourceEmail.subject },
                      { label: 'RECEIVED', value: new Date(c.sourceEmail.receivedAt).toUTCString() },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-2 text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
                        <span className="text-sky-600 dark:text-sky-400 min-w-[56px]">{label}</span>
                        <span className="text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                  {c.sourceEmail.bodyHtml && (
                    <div
                      className="mt-3 p-3 bg-card rounded-[8px] border border-sky-200/60 dark:border-sky-900 text-[12px] text-foreground leading-relaxed max-h-[220px] overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: c.sourceEmail.bodyHtml }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download Resume */}
          {c.resumeUrl && (
            <a
              href={c.resumeUrl}
              download
              className="flex items-center justify-center gap-2 mt-4 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-[11px] text-[12px] text-blue-700 dark:text-blue-400 tracking-[.06em] no-underline hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Download Original Resume
            </a>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 mt-5">
            <Button className="flex-1 font-mono text-[12px] rounded-[11px]">Advance to interview</Button>
            <Button variant="outline" className="font-mono text-[12px] rounded-[11px] px-4">Hold</Button>
          </div>

        </div>
      </div>
    </>
  );
}
