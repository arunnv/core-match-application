'use client';

import { useState } from 'react';

type Job = {
  id: string;
  code: string;
  title: string;
  location: string;
  experience: string;
  status: 'Active' | 'Archived' | 'Draft';
  scored: number;
  processing: number;
};

type Props = {
  onClose: () => void;
  onCreate: (job: Job) => void;
  existingCount: number;
};

const WORK_MODES = ['Remote', 'Hybrid', 'On-Site'] as const;
const EXAMPLE_JD = `🚀 Hiring Now | Oracle CPQ Developer
📌 Job Code: JC#00103
📍 Location: Remote
🏢 Work Mode: Remote
⏳ Contract Duration: 6+ Months
👨‍💻 Experience Required: 4–5 Years

About the Role
We are looking for an experienced Oracle CPQ Developer with strong expertise in Oracle CPQ (Big Machines), BML, BMQL, and web technologies.

Must-Have Skills
✅ Oracle CPQ (Big Machines)
✅ BML & BMQL
✅ JavaScript`;

function parseJD(text: string) {
  const grab = (re: RegExp) => { const m = text.match(re); return m ? m[1].trim() : ''; };
  let title = grab(/Hiring Now\s*\|\s*(.+)/i);
  if (!title) {
    const first = text.split('\n').map((s) => s.trim()).filter(Boolean)[0] ?? '';
    title = first.replace(/[^\x20-\x7E]+/g, '').replace(/Hiring Now\s*\|?/i, '').trim();
  }
  return {
    title,
    code: grab(/Job Code:\s*(JC#\d+)/i) || grab(/(JC#\d+)/),
    loc: grab(/Location:\s*(.+)/i),
    exp: grab(/Experience Required:\s*(.+)/i),
  };
}

export default function CreateJobModal({ onClose, onCreate, existingCount }: Props) {
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [parseText, setParseText] = useState(EXAMPLE_JD);
  const [form, setForm] = useState({ title: '', location: '', experience: '', workMode: 'Remote' as typeof WORK_MODES[number] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCode = `JC#${String(105 + existingCount).padStart(5, '0')}`;
  const canCreate = mode === 'ai' ? parseText.trim().length > 0 : form.title.trim().length > 0;

  const handleSubmit = async () => {
    if (!canCreate || submitting) return;
    setError(null);

    let payload: Record<string, string>;
    if (mode === 'ai') {
      const p = parseJD(parseText);
      if (!p.title) { setError('Could not extract a job title — try manual entry.'); return; }
      payload = {
        title: p.title,
        location: p.loc || 'Remote',
        experience: p.exp || '',
        workMode: 'Remote',
        status: 'Active',
        code: p.code || nextCode,
      };
    } else {
      if (!form.title.trim()) return;
      payload = {
        title: form.title.trim(),
        location: form.location.trim() || form.workMode,
        experience: form.experience.trim() || '',
        workMode: form.workMode,
        status: 'Active',
        code: nextCode,
      };
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { job?: Job; error?: string; issues?: unknown };

      if (!res.ok) {
        if (res.status === 409 || (data.error as string)?.toLowerCase().includes('duplicate') || (data.error as string)?.toLowerCase().includes('unique')) {
          setError(`Job code ${payload.code} already exists — please use a different code.`);
        } else {
          setError((data.error as string) ?? 'Failed to create job. Please try again.');
        }
        return;
      }

      if (data.job) {
        onCreate(data.job);
      }
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    border: 'none',
    borderRadius: 8,
    padding: '9px 10px',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    background: active ? '#fff' : 'transparent',
    color: active ? '#18181b' : '#a1a1aa',
    boxShadow: active ? '0 1px 2px rgba(24,24,27,.06)' : 'none',
    transition: 'all .2s',
  });

  return (
    <>
      {/* Scrim */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(24,24,27,.18)', backdropFilter: 'blur(2px)' }} />
      {/* Modal */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 71, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', width: 520, maxWidth: '100%', background: '#fff', border: '1px solid #e4e4e7', borderRadius: 18, boxShadow: '0 34px 70px -28px rgba(24,24,27,.45)', overflow: 'hidden' }} className="animate-rise">
          {/* Header */}
          <div style={{ padding: '22px 26px', borderBottom: '1px solid #f1f1f2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#a1a1aa', marginBottom: 7 }}>COREMATCH / NEW ROLE</div>
              <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 19, color: '#18181b' }}>Create Job Role</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✕</button>
          </div>

          {/* Mode toggle */}
          <div style={{ padding: '16px 26px 0' }}>
            <div style={{ display: 'flex', gap: 4, background: '#f4f4f5', border: '1px solid #ececed', borderRadius: 11, padding: 3 }}>
              <button onClick={() => setMode('ai')} style={tabStyle(mode === 'ai')}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.6 3.9 4.2.3-3.2 2.7 1 4.1L8 10.9 4.4 12.6l1-4.1L2.2 5.7l4.2-.3z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                AI Auto-Parse
              </button>
              <button onClick={() => setMode('manual')} style={tabStyle(mode === 'manual')}>Manual Entry</button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 26px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'ai' ? (
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>PASTE JOB DESCRIPTION OR REQUIREMENT TEXT</div>
                <textarea
                  value={parseText}
                  onChange={(e) => setParseText(e.target.value)}
                  placeholder="Paste a job post, email or requirement spec…"
                  style={{ width: '100%', height: 228, border: '1px solid #e4e4e7', borderRadius: 12, padding: '14px 15px', fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.62, color: '#27272a', background: '#fafafa', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, fontSize: 11, color: '#71717a' }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l1.6 3.9 4.2.3-3.2 2.7 1 4.1L8 10.9 4.4 12.6l1-4.1L2.2 5.7l4.2-.3z" stroke="#059669" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  We'll auto-extract the title, code, location, work mode and experience.
                </div>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>ROLE TITLE</div>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Staff Backend Engineer" style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '11px 13px', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#18181b', background: '#fff', outline: 'none' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fafafa', border: '1px dashed #e4e4e7', borderRadius: 10, padding: '11px 13px' }}>
                  <span style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa' }}>JOB CODE</span>
                  <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 14, color: '#18181b' }}>{nextCode}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a1a1aa', letterSpacing: '.04em' }}>auto-assigned</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>LOCATION</div>
                    <input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Kochi, IN" style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '11px 13px', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#18181b', background: '#fff', outline: 'none' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>EXPERIENCE</div>
                    <input value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} placeholder="e.g. 5–6 Yrs Exp" style={{ width: '100%', border: '1px solid #e4e4e7', borderRadius: 10, padding: '11px 13px', fontFamily: 'var(--font-mono)', fontSize: 13, color: '#18181b', background: '#fff', outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.14em', color: '#a1a1aa', marginBottom: 8 }}>WORK MODE</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {WORK_MODES.map((m) => (
                      <div
                        key={m}
                        onClick={() => setForm((f) => ({ ...f, workMode: m }))}
                        style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 9, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer', border: `1px solid ${form.workMode === m ? '#a7f3d0' : '#e4e4e7'}`, background: form.workMode === m ? '#ecfdf5' : '#fff', color: form.workMode === m ? '#059669' : '#71717a', transition: 'all .2s' }}
                      >{m}</div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Inline error */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 12, color: '#dc2626' }}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="10" cy="13.5" r="1" fill="currentColor"/></svg>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '18px 26px', borderTop: '1px solid #f1f1f2', background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
              Created as Active
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ background: '#fff', color: '#71717a', border: '1px solid #e4e4e7', padding: '11px 16px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer' }}>Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!canCreate || submitting}
                style={{ border: 'none', padding: '11px 18px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, transition: 'all .2s', background: canCreate && !submitting ? '#18181b' : '#e4e4e7', color: canCreate && !submitting ? '#fff' : '#a1a1aa', cursor: canCreate && !submitting ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                {submitting && <span className="spin-anim" style={{ width: 11, height: 11, border: '2px solid #52525b', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} />}
                {submitting ? 'Creating…' : mode === 'ai' ? 'Parse & create role' : 'Create job role'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
