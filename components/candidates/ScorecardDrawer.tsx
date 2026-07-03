'use client';

import { useState } from 'react';
import { bandForScore, RING_C2, ringOffset } from '@/lib/utils';

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
};

export default function ScorecardDrawer({
  candidate: c,
  onClose,
}: {
  candidate: Candidate;
  onClose: () => void;
}) {
  const band = bandForScore(c.score);
  const offset = ringOffset(c.score, RING_C2);
  const [breakdownOpen, setBreakdownOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const evals = c.evaluations ?? [];
  const hasEvals = evals.length > 0;
  const computedTotal = evals.reduce((s, e) => s + e.weighted_points_earned, 0);

  const evWithEvidence = evals.filter((e) => e.evidence_quote != null && e.competency_score_0_to_100 > 0);
  const evGaps = evals.filter((e) => e.evidence_quote == null || e.competency_score_0_to_100 === 0);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,24,27,.14)', backdropFilter: 'blur(1.5px)' }} />
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 59 }} />

      <div
        className="cm-scroll animate-drawerin"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61, width: 480, maxWidth: '94vw', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)', overflowY: 'auto' }}
      >
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f1f2', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ fontSize: 10, letterSpacing: '.2em', color: '#a1a1aa' }}>EXPLAINABLE SCORECARD</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: 24 }}>

          {/* ── BLOCK 1: Identity ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 20, borderBottom: '1px solid #f1f1f2' }}>
            <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
              <svg width="64" height="64" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="#f1f1f2" strokeWidth="5" />
                <circle cx="32" cy="32" r="27" fill="none" stroke={band.color} strokeWidth="5" strokeLinecap="round" strokeDasharray="169.6" strokeDashoffset={ringOffset(c.score, 169.6)} transform="rotate(-90 32 32)" style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 18, color: '#18181b' }}>{c.score}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 18, color: '#18181b' }}>{c.name}</span>
                <span style={{ fontSize: 9, letterSpacing: '.14em', color: band.color, background: band.bg, border: `1px solid ${band.bd}`, padding: '2px 7px', borderRadius: 5 }}>{band.label}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 7 }}>
                {c.currentRole} <span style={{ color: '#d4d4d8' }}>·</span> {c.location} <span style={{ color: '#d4d4d8' }}>·</span> {c.experience}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {c.email && (
                  <a href={`mailto:${c.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#52525b', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#a1a1aa" strokeWidth="1.4" /><path d="M1 5l7 5 7-5" stroke="#a1a1aa" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    {c.email}
                  </a>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#52525b', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 2h3l1.5 3.5-1.5 1a9 9 0 0 0 3.5 3.5l1-1.5L14 10v3a1 1 0 0 1-1 1A12 12 0 0 1 2 3a1 1 0 0 1 1-1z" stroke="#a1a1aa" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                    {c.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ── BLOCK 2: Aggregate Score ── */}
          <div style={{ marginTop: 18, background: '#fafafa', border: '1px solid #e4e4e7', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 4 }}>AGGREGATE SCORE</div>
                <div style={{ fontSize: 10, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                  Σ weighted_points_earned = {computedTotal.toFixed(1)} → capped at 100
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 36, color: band.color, lineHeight: 1 }}>{c.score}</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#ececed' }}>
              <div style={{ height: '100%', width: `${c.score}%`, background: band.color, borderRadius: 3, transition: 'width .9s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>

          {/* ── BLOCK 3: Evaluation Breakdown (primary focus) ── */}
          {hasEvals && (
            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setBreakdownOpen((o) => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#18181b', border: 'none', borderRadius: 10, padding: '11px 15px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#fff', letterSpacing: '.12em' }}
              >
                <span>EVALUATION BREAKDOWN · {evals.length} COMPETENCIES</span>
                <span style={{ transition: 'transform .2s', transform: breakdownOpen ? 'rotate(180deg)' : 'none', opacity: .7 }}>▾</span>
              </button>

              {breakdownOpen && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {evals.map((e, i) => {
                    const hasEvidence = e.evidence_quote != null && e.evidence_quote !== '';
                    const sc = e.competency_score_0_to_100 >= 70 ? '#059669' : e.competency_score_0_to_100 >= 40 ? '#d97706' : '#ef4444';
                    const coreMiss = e.level === 'CORE' && !hasEvidence;

                    return (
                      <div
                        key={i}
                        style={{
                          border: `1px solid ${coreMiss ? '#fecaca' : hasEvidence ? '#e4e4e7' : '#fde68a'}`,
                          borderRadius: 10,
                          padding: '12px 13px',
                          background: coreMiss ? '#fff8f8' : hasEvidence ? '#fff' : '#fffdf5',
                        }}
                      >
                        {/* Header row */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0 }}>
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#18181b' }}>{e.competency}</span>
                            <span style={{ fontSize: 8, letterSpacing: '.1em', padding: '1px 5px', borderRadius: 3, background: e.level === 'CORE' ? '#18181b' : '#f4f4f5', color: e.level === 'CORE' ? '#fff' : '#71717a' }}>{e.level}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <span style={{ fontSize: 9.5, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>{e.weight_percentage}% wt</span>
                            <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 18, color: sc, lineHeight: 1 }}>{e.competency_score_0_to_100}</span>
                            <span style={{ fontSize: 9.5, color: sc, fontFamily: 'var(--font-mono)' }}>+{e.weighted_points_earned.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* Score bar */}
                        <div style={{ height: 3, borderRadius: 2, background: '#f1f1f2', marginBottom: 9 }}>
                          <div style={{ height: '100%', width: `${e.competency_score_0_to_100}%`, background: sc, borderRadius: 2 }} />
                        </div>

                        {/* Evidence */}
                        {hasEvidence ? (
                          <blockquote style={{ margin: 0, padding: '8px 11px', background: '#f8f8f9', borderLeft: '2px solid #18181b', borderRadius: '0 7px 7px 0', fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#374151', lineHeight: 1.6 }}>
                            &ldquo;{e.evidence_quote}&rdquo;
                          </blockquote>
                        ) : coreMiss ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7 }}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="#ef4444" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.5v2.5M8 10.5v.1" stroke="#ef4444" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            <span style={{ fontSize: 9.5, letterSpacing: '.1em', color: '#b91c1c', fontFamily: 'var(--font-mono)' }}>NO EVIDENCE FOUND · CORE PENALTY APPLIED</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7 }}>
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="#d97706" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.5v2.5M8 10.5v.1" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" /></svg>
                            <span style={{ fontSize: 9.5, letterSpacing: '.1em', color: '#92400e', fontFamily: 'var(--font-mono)' }}>NO EVIDENCE FOUND</span>
                          </div>
                        )}

                        {/* Reasoning */}
                        <div style={{ marginTop: 7, fontSize: 10, color: '#a1a1aa', lineHeight: 1.4 }}>{e.reasoning}</div>
                      </div>
                    );
                  })}

                  {/* Math footer */}
                  <div style={{ border: '1px solid #e4e4e7', borderRadius: 9, padding: '11px 13px', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: '#71717a', letterSpacing: '.1em' }}>Σ WEIGHTED POINTS → SCORE</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#52525b' }}>{computedTotal.toFixed(1)} → cap 100 → <strong style={{ fontFamily: 'var(--font-space)', fontSize: 16, color: band.color }}>{c.score}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback capabilities/gaps for old candidates without evaluations */}
          {!hasEvals && c.capabilities.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 10 }}>CAPABILITIES MATCHED</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {c.capabilities.map((cap, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '11px 13px', background: '#f6fefb', border: '1px solid #d1fae5', borderRadius: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12.5, fontWeight: 500, color: '#18181b' }}>{cap.label}</span>
                        <span style={{ fontSize: 10, color: '#059669', background: '#ecfdf5', padding: '1.5px 6px', borderRadius: 5 }}>{cap.w}% wt</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#52525b', marginTop: 3 }}>{cap.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BLOCK 4: AI Summary — demoted, collapsible, muted ── */}
          <div style={{ marginTop: 16, background: '#f9f9fa', borderRadius: 10, border: '1px solid #ececed', overflow: 'hidden' }}>
            <button
              onClick={() => setSummaryOpen((o) => !o)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#a1a1aa', letterSpacing: '.14em' }}
            >
              <span>AI AUDIT SUMMARY (supplementary)</span>
              <span style={{ transition: 'transform .2s', transform: summaryOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {summaryOpen && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid #ececed' }}>
                {c.aiHead && (
                  <p style={{ margin: '10px 0 6px', fontSize: 12, color: '#52525b', lineHeight: 1.5, fontWeight: 500 }}>{c.aiHead}</p>
                )}
                {c.aiReasoning.map((p, i) => (
                  <p key={i} style={{ margin: '0 0 6px', fontSize: 12, color: '#71717a', lineHeight: 1.6 }}>{p}</p>
                ))}
              </div>
            )}
          </div>

          {/* ── BLOCK 5: Source Application Email ── */}
          {c.sourceEmail && (
            <div style={{ marginTop: 16, background: '#f0f9ff', borderRadius: 10, border: '1px solid #bae6fd', overflow: 'hidden' }}>
              <button
                onClick={() => setEmailOpen((o) => !o)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', padding: '11px 14px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#0369a1', letterSpacing: '.14em' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#0369a1" strokeWidth="1.4"/><path d="M1 5l7 5 7-5" stroke="#0369a1" strokeWidth="1.4" strokeLinecap="round"/></svg>
                  SOURCE APPLICATION EMAIL
                </span>
                <span style={{ transition: 'transform .2s', transform: emailOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
              </button>
              {emailOpen && (
                <div style={{ padding: '0 14px 14px', borderTop: '1px solid #bae6fd' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: '#0369a1', minWidth: 56 }}>FROM</span>
                      <span style={{ color: '#18181b' }}>{c.sourceEmail.sender}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: '#0369a1', minWidth: 56 }}>SUBJECT</span>
                      <span style={{ color: '#18181b' }}>{c.sourceEmail.subject}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                      <span style={{ color: '#0369a1', minWidth: 56 }}>RECEIVED</span>
                      <span style={{ color: '#71717a' }}>{new Date(c.sourceEmail.receivedAt).toUTCString()}</span>
                    </div>
                  </div>
                  {c.sourceEmail.bodyHtml && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e0f2fe', fontSize: 12, color: '#334155', lineHeight: 1.6, maxHeight: 220, overflowY: 'auto' }}
                      dangerouslySetInnerHTML={{ __html: c.sourceEmail.bodyHtml }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={{ flex: 1, background: '#18181b', color: '#fff', border: 'none', padding: 13, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>
              Advance to interview
            </button>
            <button style={{ background: '#fff', color: '#71717a', border: '1px solid #e4e4e7', padding: '13px 18px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>
              Hold
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
