'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateJobModal from './CreateJobModal';
import SheetsImportWizard from './SheetsImportWizard';

type Job = {
  id: string;
  code: string;
  title: string;
  location: string;
  experience: string;
  status: 'Active' | 'Archived' | 'Draft';
  scored: number;
  processing: number;
  isNew?: boolean;
};

export default function JobsDashboard({
  initialJobs,
  isSuperAdmin = false,
}: {
  initialJobs: Job[];
  isSuperAdmin?: boolean;
}) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [showCreate, setShowCreate] = useState(false);
  const [showSheets, setShowSheets] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.code.toLowerCase().includes(search.toLowerCase()) ||
      j.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (job: Job) => {
    setJobs((prev) => [{ ...job, isNew: true }, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
      }
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1200, padding: '80px 48px 90px 96px' }} className="animate-rise">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.22em', color: '#a1a1aa', marginBottom: 14 }}>COREMATCH / JOBS</div>
          <h1 style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 44, lineHeight: 1, letterSpacing: '-.02em', margin: 0 }}>
            Open <span style={{ fontWeight: 600 }}>Positions</span>
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 34, paddingBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 6 }}>TOTAL JOBS</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 30 }}>{jobs.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 6 }}>ACTIVE CANDIDATES</div>
            <div style={{ fontFamily: 'var(--font-space)', fontWeight: 300, fontSize: 30, color: '#059669' }}>
              {jobs.reduce((a, j) => a + j.scored + j.processing, 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Search + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ flex: 1, maxWidth: 460, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #e4e4e7', borderRadius: 11, padding: '0 14px', height: 42 }}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6.2" stroke="#a1a1aa" strokeWidth="1.7"/><path d="M13.6 13.6L17 17" stroke="#a1a1aa" strokeWidth="1.7" strokeLinecap="round"/></svg>
          <input
            placeholder="Search roles, codes, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 12.5, color: '#18181b' }}
          />
        </div>
        <button
          onClick={() => setShowSheets(true)}
          style={{ background: '#fff', color: '#18181b', border: '1px solid #e4e4e7', height: 42, padding: '0 16px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          Import from Sheets
        </button>
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: '#18181b', color: '#fff', border: 'none', height: 42, padding: '0 18px', borderRadius: 11, fontFamily: 'var(--font-mono)', fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> New Job Role
        </button>
      </div>

      {/* Job cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((job) => {
          const active = job.status === 'Active';
          const badge = active
            ? { color: '#059669', bg: '#ecfdf5', bd: '#a7f3d0' }
            : { color: '#71717a', bg: '#f4f4f5', bd: '#e4e4e7' };
          const isConfirming = confirmId === job.id;
          const isDeleting = deletingId === job.id;

          return (
            <div
              key={job.id}
              onClick={() => !isSuperAdmin && active && router.push(`/jobs/${job.id}/rubric`)}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 22,
                alignItems: 'center',
                background: '#fff',
                border: `1px solid ${isConfirming ? '#fecaca' : job.isNew ? '#a7f3d0' : '#e4e4e7'}`,
                borderRadius: 16,
                padding: '20px 24px',
                transition: 'all .22s cubic-bezier(.22,1,.36,1)',
                cursor: isSuperAdmin ? 'default' : active ? 'pointer' : 'default',
                opacity: active ? 1 : 0.64,
              }}
              className={isSuperAdmin ? '' : 'hover:border-[#d4d4d8] hover:-translate-y-px hover:shadow-lg'}
            >
              {/* Icon tile */}
              <div style={{ width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: active ? '#ecfdf5' : '#f4f4f5' }}>
                <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                  <rect x="2.5" y="6" width="15" height="10.6" rx="2" stroke={active ? '#059669' : '#a1a1aa'} strokeWidth="1.6" />
                  <path d="M7 6V4.7A1.7 1.7 0 0 1 8.7 3h2.6A1.7 1.7 0 0 1 13 4.7V6" stroke={active ? '#059669' : '#a1a1aa'} strokeWidth="1.6" />
                  <path d="M2.6 10.4h14.8" stroke={active ? '#059669' : '#a1a1aa'} strokeWidth="1.6" />
                </svg>
              </div>

              {/* Identity */}
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span
                    style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 16, color: '#18181b', cursor: active ? 'pointer' : 'default' }}
                    onClick={(e) => { e.stopPropagation(); if (active) router.push(`/jobs/${job.id}/rubric`); }}
                  >
                    {job.title}
                  </span>
                  <span style={{ fontSize: 9, letterSpacing: '.14em', color: badge.color, background: badge.bg, border: `1px solid ${badge.bd}`, padding: '2px 8px', borderRadius: 5 }}>
                    {job.status.toUpperCase()}
                  </span>
                  {job.isNew && (
                    <span style={{ fontSize: 9, letterSpacing: '.14em', color: '#fff', background: '#059669', padding: '2px 8px', borderRadius: 5 }}>NEW</span>
                  )}
                </div>
                <div style={{ fontSize: 11.5, color: '#71717a', display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: '#52525b', fontVariantNumeric: 'tabular-nums' }}>{job.code}</span>
                  <span style={{ color: '#d4d4d8' }}>·</span>
                  <span>{job.location}</span>
                  <span style={{ color: '#d4d4d8' }}>·</span>
                  <span>{job.experience}</span>
                </div>
              </div>

              {/* Metrics + SuperAdmin actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, lineHeight: 1, color: '#18181b', fontVariantNumeric: 'tabular-nums' }}>{job.scored}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#a1a1aa', marginTop: 6 }}>EVALUATED</div>
                </div>
                <div style={{ width: 1, height: 32, background: '#f1f1f2' }} />
                <div style={{ textAlign: 'right', minWidth: 54 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    {job.processing > 0 && <span className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#a1a1aa' }} />}
                    <span style={{ fontFamily: 'var(--font-space)', fontWeight: 600, fontSize: 20, lineHeight: 1, color: job.processing > 0 ? '#18181b' : '#d4d4d8', fontVariantNumeric: 'tabular-nums' }}>{job.processing}</span>
                  </div>
                  <div style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#a1a1aa', marginTop: 6 }}>PROCESSING…</div>
                </div>

                {isSuperAdmin ? (
                  isConfirming ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <span style={{ fontSize: 10, color: '#ef4444', fontFamily: 'var(--font-mono)' }}>Delete job + all candidates?</span>
                      <button
                        onClick={() => handleDelete(job.id)}
                        disabled={isDeleting}
                        style={{ padding: '5px 10px', borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                      >
                        {isDeleting ? '…' : 'Confirm'}
                      </button>
                      <button
                        onClick={() => setConfirmId(null)}
                        style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #e4e4e7', background: '#fff', color: '#71717a', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmId(job.id); }}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff8f8', color: '#ef4444', fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer', letterSpacing: '.06em' }}
                    >
                      Delete
                    </button>
                  )
                ) : (
                  <span style={{ fontSize: 16, color: active ? '#059669' : '#e4e4e7', marginLeft: 4 }}>→</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreate={handleCreate} existingCount={jobs.length} />}
      <SheetsImportWizard
        open={showSheets}
        onClose={() => setShowSheets(false)}
        onImported={(count) => { if (count > 0) router.refresh(); }}
      />
    </div>
  );
}
