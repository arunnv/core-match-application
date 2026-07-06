'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3;

type Mapping = {
  title: string;
  code: string;
  location: string;
  experience: string;
  description: string;
  workMode: string;
};

type PreviewRow = {
  idx: number;
  title: string;
  code: string;
  location: string;
  experience: string;
  description: string;
  workMode: string;
  selected: boolean;
};

const FIELDS: { key: keyof Mapping; label: string; required: boolean }[] = [
  { key: 'title',       label: 'Job Title',    required: true },
  { key: 'code',        label: 'Job Code',     required: true },
  { key: 'location',    label: 'Location',     required: false },
  { key: 'experience',  label: 'Experience',   required: false },
  { key: 'workMode',    label: 'Work Mode',    required: false },
  { key: 'description', label: 'Description',  required: false },
];

function StepDot({ n, current }: { n: number; current: Step }) {
  const done = n < current;
  const active = n === current;
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold border transition-all',
        done || active ? 'bg-foreground text-background border-foreground' : 'bg-muted text-muted-foreground border-border'
      )}>
        {done ? '✓' : n}
      </div>
      <span className={cn('text-[11px] font-mono tracking-[.08em]', active ? 'text-foreground' : 'text-muted-foreground')}>
        {['', 'SELECT SHEET', 'MAP COLUMNS', 'PREVIEW & IMPORT'][n]}
      </span>
    </div>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-[9999] flex items-center gap-2.5 px-4 py-3 rounded-xl max-w-[340px]',
      type === 'success' ? 'bg-foreground text-background' : 'bg-card border border-destructive/30 text-destructive',
      'shadow-[0_8px_24px_-4px_rgba(24,24,27,.3)]'
    )} style={{ animation: 'cm-in .3s cubic-bezier(.22,1,.36,1)' }}>
      <span className="text-[14px]">{type === 'success' ? '✓' : '✕'}</span>
      <span className="text-[13px] font-mono">{message}</span>
    </div>
  );
}

export default function SheetsImportWizard({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheets, setSheets] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Mapping>({ title: '', code: '', location: '', experience: '', description: '', workMode: '' });
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const reset = useCallback(() => {
    setStep(1); setSpreadsheetUrl(''); setSpreadsheetId(''); setSheets([]); setSheetName('');
    setHeaders([]); setRawRows([]); setMapping({ title: '', code: '', location: '', experience: '', description: '', workMode: '' });
    setPreview([]); setLoading(false); setError('');
  }, []);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const parseId = (input: string): string => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const fetchSheets = async () => {
    const id = parseId(spreadsheetUrl);
    if (!id) { setError('Enter a valid Google Sheets URL or spreadsheet ID.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/integrations/google/sheets/fetch?spreadsheetId=${encodeURIComponent(id)}&mode=sheets`);
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'no_google_token') setError('Sign in with Google to access Google Sheets. Use the avatar menu → Sign out, then sign back in with Google.');
        else setError(data.error ?? 'Failed to access spreadsheet.');
        return;
      }
      setSpreadsheetId(id);
      setSheets(data.sheets);
      if (data.sheets.length === 1) setSheetName(data.sheets[0]);
    } finally { setLoading(false); }
  };

  const fetchRows = async () => {
    if (!sheetName) { setError('Select a sheet tab.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/integrations/google/sheets/fetch?spreadsheetId=${encodeURIComponent(spreadsheetId)}&sheetName=${encodeURIComponent(sheetName)}&mode=rows`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to fetch rows.'); return; }
      if (data.headers.length === 0) { setError('Sheet appears to be empty.'); return; }
      setHeaders(data.headers);
      setRawRows(data.rows);
      const autoMap = (keywords: string[]) => data.headers.find((h: string) => keywords.some(k => h.toLowerCase().includes(k))) ?? '';
      setMapping({
        title:       autoMap(['title', 'job title', 'role', 'position']),
        code:        autoMap(['code', 'job code', 'ref', 'id', 'jc']),
        location:    autoMap(['location', 'city', 'office', 'place']),
        experience:  autoMap(['experience', 'exp', 'years']),
        description: autoMap(['description', 'desc', 'summary', 'details']),
        workMode:    autoMap(['work mode', 'mode', 'remote', 'hybrid', 'on-site']),
      });
      setStep(2);
    } finally { setLoading(false); }
  };

  const buildPreview = () => {
    if (!mapping.title || !mapping.code) { setError('Job Title and Job Code mappings are required.'); return; }
    setError('');
    const titleIdx = headers.indexOf(mapping.title);
    const codeIdx  = headers.indexOf(mapping.code);
    const locIdx   = headers.indexOf(mapping.location);
    const expIdx   = headers.indexOf(mapping.experience);
    const descIdx  = headers.indexOf(mapping.description);
    const modeIdx  = headers.indexOf(mapping.workMode);
    const rows: PreviewRow[] = rawRows
      .map((row, i) => ({
        idx: i, title: row[titleIdx]?.trim() ?? '', code: row[codeIdx]?.trim() ?? '',
        location: row[locIdx]?.trim() ?? 'Remote', experience: row[expIdx]?.trim() ?? '',
        description: row[descIdx]?.trim() ?? '',
        workMode: (['Remote','Hybrid','On-Site'].includes(row[modeIdx]?.trim() ?? '') ? row[modeIdx].trim() : 'Remote') as 'Remote'|'Hybrid'|'On-Site',
        selected: true,
      }))
      .filter(r => r.title && r.code);
    if (rows.length === 0) { setError('No valid rows found. Make sure Title and Code columns have data.'); return; }
    setPreview(rows);
    setStep(3);
  };

  const doImport = async () => {
    const selected = preview.filter(r => r.selected);
    if (selected.length === 0) { setError('Select at least one row to import.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/jobs/batch-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: selected.map(r => ({ title: r.title, code: r.code, location: r.location, experience: r.experience, description: r.description, workMode: r.workMode })) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Import failed.'); return; }
      setToast({ message: `Successfully imported ${data.imported} job role${data.imported !== 1 ? 's' : ''}${data.skipped > 0 ? ` (${data.skipped} skipped — duplicate codes)` : ''}.`, type: 'success' });
      onImported(data.imported);
      onClose();
    } finally { setLoading(false); }
  };

  if (!open) return null;

  const colOptions = [{ value: '', label: '— skip —' }, ...headers.map(h => ({ value: h, label: h }))];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px]" style={{ animation: 'cm-fade .2s ease' }} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-[580px] max-w-[95vw] max-h-[88vh] bg-card rounded-[18px] border border-border flex flex-col"
        style={{ boxShadow: '0 24px 64px -16px rgba(24,24,27,.28)', animation: 'cm-in .3s cubic-bezier(.22,1,.36,1)' }}>

        {/* Header */}
        <div className="px-6 py-5 pb-4 border-b border-border flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-foreground"><rect x="3" y="2" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <span className="font-bold text-[15px] text-foreground" style={{ fontFamily: 'var(--font-space)' }}>Import from Google Sheets</span>
            </div>
            <div className="flex gap-4">
              {[1, 2, 3].map(n => <StepDot key={n} n={n} current={step} />)}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={onClose} className="h-[30px] w-[30px] rounded-[9px] text-[14px] shrink-0">✕</Button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-[10px] tracking-[.16em] text-muted-foreground mb-2 font-mono">GOOGLE SHEETS URL OR SPREADSHEET ID</div>
                <div className="flex gap-2">
                  <Input
                    value={spreadsheetUrl}
                    onChange={e => setSpreadsheetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchSheets()}
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    className="flex-1 font-mono text-[13px]"
                  />
                  <Button onClick={fetchSheets} disabled={loading || !spreadsheetUrl} className="font-mono text-[12px]">
                    {loading ? '...' : 'Connect'}
                  </Button>
                </div>
                <div className="mt-1.5 text-[11px] text-muted-foreground">Paste the full URL or just the spreadsheet ID from the URL bar.</div>
              </div>

              {sheets.length > 0 && (
                <div>
                  <div className="text-[10px] tracking-[.16em] text-muted-foreground mb-2 font-mono">SELECT SHEET TAB</div>
                  <select
                    value={sheetName}
                    onChange={e => setSheetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-[10px] border border-border bg-card text-foreground font-mono text-[13px] cursor-pointer outline-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                  >
                    <option value="" disabled>Choose a tab…</option>
                    {sheets.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              {error && <div className="px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-[9px] text-[12px] text-destructive leading-snug">{error}</div>}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-1">
              <div className="text-[11.5px] text-muted-foreground mb-3 leading-relaxed">
                Map your sheet columns to job fields. <span className="text-foreground font-medium">Title</span> and <span className="text-foreground font-medium">Code</span> are required.
              </div>
              {FIELDS.map(f => (
                <div key={f.key} className="grid gap-3 items-center py-2.5 border-b border-border/50" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-foreground">{f.label}</span>
                    {f.required && <span className="text-[9px] tracking-[.1em] text-destructive font-mono">REQ</span>}
                  </div>
                  <select
                    value={mapping[f.key]}
                    onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                    className="px-3 py-2 rounded-[10px] border border-border bg-card text-foreground font-mono text-[13px] cursor-pointer outline-none"
                  >
                    {colOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              {error && <div className="mt-2 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-[9px] text-[12px] text-destructive">{error}</div>}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11.5px] text-muted-foreground">
                  <span className="text-foreground font-semibold">{preview.filter(r => r.selected).length}</span> of {preview.length} rows selected
                </div>
                <button
                  onClick={() => setPreview(p => p.map(r => ({ ...r, selected: !p.every(x => x.selected) })))}
                  className="text-[11px] text-muted-foreground bg-transparent border-none cursor-pointer font-mono underline hover:text-foreground transition-colors"
                >
                  {preview.every(r => r.selected) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid bg-muted/60 border-b border-border" style={{ gridTemplateColumns: '32px 1fr 100px 90px 80px' }}>
                  {['', 'Job Title', 'Code', 'Location', 'Mode'].map((h, i) => (
                    <div key={i} className="px-2.5 py-2 text-[9px] tracking-[.14em] text-muted-foreground font-mono font-semibold">{h}</div>
                  ))}
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {preview.map(row => (
                    <div
                      key={row.idx}
                      onClick={() => setPreview(p => p.map(r => r.idx === row.idx ? { ...r, selected: !r.selected } : r))}
                      className={cn('grid border-b border-border/40 cursor-pointer transition-[opacity_.15s,background_.15s]', row.selected ? 'bg-card opacity-100' : 'bg-muted/30 opacity-45')}
                      style={{ gridTemplateColumns: '32px 1fr 100px 90px 80px' }}
                    >
                      <div className="flex items-center justify-center py-2.5">
                        <div className={cn('w-4 h-4 rounded-[5px] border-[1.5px] flex items-center justify-center', row.selected ? 'bg-foreground border-foreground' : 'bg-card border-muted-foreground/40')}>
                          {row.selected && <span className="text-background text-[10px] leading-none">✓</span>}
                        </div>
                      </div>
                      <div className="px-2.5 py-2.5 text-[12.5px] font-medium text-foreground overflow-hidden text-ellipsis whitespace-nowrap">{row.title}</div>
                      <div className="px-2.5 py-2.5 text-[11px] text-muted-foreground font-mono">{row.code}</div>
                      <div className="px-2.5 py-2.5 text-[11px] text-muted-foreground">{row.location || '—'}</div>
                      <div className="px-2.5 py-2.5 text-[10px] text-muted-foreground font-mono">{row.workMode}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="mt-2.5 px-3 py-2.5 bg-destructive/10 border border-destructive/30 rounded-[9px] text-[12px] text-destructive">{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex justify-between items-center shrink-0">
          <Button variant="outline" onClick={() => step > 1 ? setStep(s => (s - 1) as Step) : onClose()} className="font-mono text-[12px]">
            {step === 1 ? 'Cancel' : '← Back'}
          </Button>
          <div className="flex items-center gap-2">
            {step === 3 && (
              <span className="text-[11px] text-muted-foreground font-mono">
                {preview.filter(r => r.selected).length} job{preview.filter(r => r.selected).length !== 1 ? 's' : ''} ready
              </span>
            )}
            <Button
              disabled={loading}
              onClick={() => { if (step === 1) fetchRows(); else if (step === 2) buildPreview(); else doImport(); }}
              className="font-mono text-[12px] tracking-[.04em]"
              style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}
            >
              {loading ? 'Working…' : step === 1 ? 'Load Sheet →' : step === 2 ? 'Preview Rows →' : `Import ${preview.filter(r => r.selected).length} Jobs`}
            </Button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
