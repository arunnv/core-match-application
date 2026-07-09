'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CreateJobModal from './CreateJobModal';
import SheetsImportWizard from './SheetsImportWizard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none" className="text-muted-foreground flex-shrink-0">
    <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M13.6 13.6L17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
);

const SheetsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const JobIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
    <rect x="2.5" y="6" width="15" height="10.6" rx="2" stroke={active ? 'var(--green-dark)' : 'currentColor'} strokeWidth="1.6" />
    <path d="M7 6V4.7A1.7 1.7 0 0 1 8.7 3h2.6A1.7 1.7 0 0 1 13 4.7V6" stroke={active ? 'var(--green-dark)' : 'currentColor'} strokeWidth="1.6" />
    <path d="M2.6 10.4h14.8" stroke={active ? 'var(--green-dark)' : 'currentColor'} strokeWidth="1.6" />
  </svg>
);

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
      if (res.ok) setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } finally {
      setDeletingId(null);
      setConfirmId(null);
    }
  };

  return (
    <div className="w-full px-12 pb-24 pt-20 animate-rise" style={{ paddingLeft: '96px' }}>
      {/* Header */}
      <div className="flex items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[11px] tracking-[.22em] text-muted-foreground mb-3.5 font-mono">COREMATCH / JOBS</p>
          <h1 className="font-light text-[44px] leading-none tracking-[-0.02em] m-0" style={{ fontFamily: 'var(--font-space)' }}>
            Open <span className="font-semibold">Positions</span>
          </h1>
        </div>
        <div className="flex gap-8 pb-1.5">
          <div>
            <p className="text-[10px] tracking-[.16em] text-muted-foreground mb-1.5 font-mono">TOTAL JOBS</p>
            <p className="text-[30px] font-light leading-none" style={{ fontFamily: 'var(--font-space)' }}>{jobs.length}</p>
          </div>
          <div>
            <p className="text-[10px] tracking-[.16em] text-muted-foreground mb-1.5 font-mono">ACTIVE CANDIDATES</p>
            <p className="text-[30px] font-light leading-none text-[var(--green-dark)]" style={{ fontFamily: 'var(--font-space)' }}>
              {jobs.reduce((a, j) => a + j.scored + j.processing, 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search + CTA */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-[460px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2">
            <SearchIcon />
          </span>
          <Input
            placeholder="Search roles, codes, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-[42px] font-mono text-[12.5px] bg-card border-border"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowSheets(true)}
          className="h-[42px] gap-2 font-mono text-[12.5px] border-border"
        >
          <SheetsIcon /> Import from Sheets
        </Button>
        <Button
          onClick={() => setShowCreate(true)}
          className="h-[42px] gap-1.5 font-mono text-[12.5px]"
        >
          <span className="text-[15px] leading-none">+</span> New Job Role
        </Button>
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-2.5">
        {filtered.map((job) => {
          const active = job.status === 'Active';
          const isConfirming = confirmId === job.id;
          const isDeleting = deletingId === job.id;

          return (
            <Card
              key={job.id}
              onClick={() => !isSuperAdmin && active && router.push(`/jobs/${job.id}/rubric`)}
              className={cn(
                'border transition-all duration-[220ms] ease-[cubic-bezier(.22,1,.36,1)]',
                isConfirming && 'border-destructive/50 bg-destructive/5',
                job.isNew && !isConfirming && 'border-[var(--green-border)]',
                !isSuperAdmin && active && 'cursor-pointer hover:border-border hover:-translate-y-px hover:shadow-lg',
                !active && 'opacity-60'
              )}
            >
              <CardContent className="p-5 grid gap-5" style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
                {/* Icon tile */}
                <div className={cn(
                  'w-[46px] h-[46px] rounded-[13px] flex items-center justify-center flex-shrink-0',
                  active ? 'bg-[var(--green-bg)] text-[var(--green-dark)]' : 'bg-muted text-muted-foreground'
                )}>
                  <JobIcon active={active} />
                </div>

                {/* Identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="font-semibold text-[16px] text-foreground cursor-pointer"
                      style={{ fontFamily: 'var(--font-space)' }}
                      onClick={(e) => { e.stopPropagation(); if (active) router.push(`/jobs/${job.id}/rubric`); }}
                    >
                      {job.title}
                    </span>
                    <Badge
                      variant={active ? 'default' : 'secondary'}
                      className={cn(
                        'text-[9px] tracking-[.14em] px-2 py-0.5 rounded-[5px] font-mono',
                        active && 'bg-[var(--green-bg)] text-[var(--green-dark)] border border-[var(--green-border)] hover:bg-[var(--green-bg)]'
                      )}
                    >
                      {job.status.toUpperCase()}
                    </Badge>
                    {job.isNew && (
                      <Badge className="text-[9px] tracking-[.14em] px-2 py-0.5 rounded-[5px] font-mono bg-[var(--green)] hover:bg-[var(--green)]">
                        NEW
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground flex items-center gap-2.5 font-mono">
                    <span className="text-foreground/70 tabular-nums">{job.code}</span>
                    <span className="text-border">·</span>
                    <span>{job.location}</span>
                    <span className="text-border">·</span>
                    <span>{job.experience}</span>
                  </div>
                </div>

                {/* Metrics + actions */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[20px] font-semibold leading-none tabular-nums" style={{ fontFamily: 'var(--font-space)' }}>{job.scored}</div>
                    <div className="text-[9.5px] tracking-[.14em] text-muted-foreground mt-1.5 font-mono">EVALUATED</div>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-right min-w-[54px]">
                    <div className="flex items-center justify-end gap-1.5">
                      {job.processing > 0 && <span className="pulse-dot w-[7px] h-[7px] rounded-full bg-muted-foreground" />}
                      <span
                        className={cn('text-[20px] font-semibold leading-none tabular-nums', job.processing > 0 ? 'text-foreground' : 'text-muted-foreground/40')}
                        style={{ fontFamily: 'var(--font-space)' }}
                      >
                        {job.processing}
                      </span>
                    </div>
                    <div className="text-[9.5px] tracking-[.14em] text-muted-foreground mt-1.5 font-mono">PROCESSING…</div>
                  </div>

                  {isSuperAdmin ? (
                    isConfirming ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-destructive font-mono">Delete job + all candidates?</span>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={isDeleting}
                          onClick={() => handleDelete(job.id)}
                          className="h-7 px-2.5 text-[10px] font-mono"
                        >
                          {isDeleting ? '…' : 'Confirm'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmId(null)}
                          className="h-7 px-2.5 text-[10px] font-mono"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => { e.stopPropagation(); setConfirmId(job.id); }}
                        className="h-7 px-3 text-[10px] font-mono text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        Delete
                      </Button>
                    )
                  ) : (
                    <span className={cn('text-[16px] ml-1', active ? 'text-[var(--green-dark)]' : 'text-muted-foreground/30')}>→</span>
                  )}
                </div>
              </CardContent>
            </Card>
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
