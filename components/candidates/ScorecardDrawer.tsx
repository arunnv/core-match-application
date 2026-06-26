'use client';

import { bandForScore, RING_C2, ringOffset } from '@/lib/utils';

type Capability = { label: string; note: string; w: number };
type Gap = { label: string; note: string; w: number };

type Candidate = {
  id: string;
  name: string;
  currentRole: string;
  location: string;
  experience: string;
  score: number;
  aiHead: string;
  aiReasoning: string[];
  capabilities: Capability[];
  gaps: Gap[];
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

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(24,24,27,.14)', backdropFilter: 'blur(1.5px)' }} className="animate-rise" />
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 59 }} />

      {/* Drawer */}
      <div
        className="cm-scroll animate-drawerin"
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 61, width: 452, maxWidth: '94vw', background: '#fff', borderLeft: '1px solid #e4e4e7', boxShadow: '-30px 0 60px -30px rgba(24,24,27,.3)', overflowY: 'auto' }}
      >
        {/* Sticky header */}
        <div style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #f1f1f2', padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 2 }}>
          <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#a1a1aa' }}>EXPLAINABLE SCORECARD</div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
        </div>

        <div style={{ padding: 26 }}>
          {/* Identity + ring */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="#f1f1f2" strokeWidth="6" />
                <circle cx="36" cy="36" r="22" fill="none" stroke="#f4f4f5" strokeWidth="1.5" strokeDasharray="1.5 4" />
                <circle cx="36" cy="36" r="30" fill="none" stroke={band.color} strokeWidth="6" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset={offset} transform="rotate(-90 36 36)" style={{ transition: 'stroke-dashoffset .9s cubic-bezier(.22,1,.36,1)' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 22, color: '#18181b' }}>{c.score}</div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20 }}>{c.name}</span>
                <span style={{ fontSize: 9, letterSpacing: '.14em', color: band.color, background: band.bg, border: `1px solid ${band.bd}`, padding: '2px 7px', borderRadius: 5 }}>{band.label}</span>
              </div>
              <div style={{ fontSize: 12, color: '#71717a' }}>{c.currentRole} <span style={{ color: '#d4d4d8' }}>·</span> {c.location} <span style={{ color: '#d4d4d8' }}>·</span> {c.experience}</div>
            </div>
          </div>

          {/* AI reasoning */}
          <div style={{ marginTop: 28, paddingLeft: 16, borderLeft: '2px solid #a7f3d0' }}>
            <div style={{ fontSize: 11, letterSpacing: '.18em', color: '#059669', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.6 3.9 4.2.3-3.2 2.7 1 4.1L8 10.9 4.4 12.6l1-4.1L2.2 5.7l4.2-.3z" stroke="#059669" strokeWidth="1.2" strokeLinejoin="round" /></svg>
              AI REASONING
            </div>
            <div style={{ fontSize: 13, color: '#3f3f46', lineHeight: 1.3, marginBottom: 10 }}>{c.aiHead}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
              {c.aiReasoning.map((p, i) => (
                <p key={i} style={{ margin: 0, fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 14.5, lineHeight: 1.62, color: '#52525b' }}>{p}</p>
              ))}
            </div>
          </div>

          {/* Capabilities */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: '#ecfdf5', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="#059669" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#065f46' }}>Capabilities Matched</span>
              </div>
              <span style={{ fontSize: 11, color: '#059669' }}>{c.capabilities.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.capabilities.map((cap) => (
                <div key={cap.label} style={{ display: 'flex', gap: 11, padding: '12px 14px', background: '#f6fefb', border: '1px solid #d1fae5', borderRadius: 11 }}>
                  <span style={{ marginTop: 1, flexShrink: 0, width: 16, height: 16, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5l3 3 6-7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#18181b' }}>{cap.label}</span>
                      <span style={{ fontSize: 10, color: '#059669', background: '#ecfdf5', padding: '1.5px 6px', borderRadius: 5, whiteSpace: 'nowrap' }}>{cap.w}% wt</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#52525b', marginTop: 3, lineHeight: 1.45 }}>{cap.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps */}
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2.5l5.5 9.5h-11z" stroke="#d97706" strokeWidth="1.4" strokeLinejoin="round" /><path d="M8 6.5v2.2M8 10.4v.1" stroke="#d97706" strokeWidth="1.4" strokeLinecap="round" /></svg>
                </span>
                <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#92400e' }}>Gaps Identified</span>
              </div>
              <span style={{ fontSize: 11, color: '#d97706' }}>{c.gaps.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {c.gaps.map((gap) => (
                <div key={gap.label} style={{ display: 'flex', gap: 11, padding: '12px 14px', background: '#fffdf5', border: '1px solid #fde68a', borderRadius: 11 }}>
                  <span style={{ marginTop: 1, flexShrink: 0, width: 16, height: 16, borderRadius: '50%', background: '#fff', border: '1.5px solid #d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M4 8h8" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#18181b' }}>{gap.label}</span>
                      <span style={{ fontSize: 10, color: '#92400e', background: '#fffbeb', padding: '1.5px 6px', borderRadius: 5, whiteSpace: 'nowrap' }}>{gap.w}% wt</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#52525b', marginTop: 3, lineHeight: 1.45 }}>{gap.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
            <button style={{ flex: 1, background: '#18181b', color: '#fff', border: 'none', padding: 13, borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer' }}>
              Advance to interview
            </button>
            <button style={{ background: '#fff', color: '#71717a', border: '1px solid #e4e4e7', padding: '13px 18px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer' }}>
              Hold
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
