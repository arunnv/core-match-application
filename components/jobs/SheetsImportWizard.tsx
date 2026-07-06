'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Small shared primitives ───────────────────────────────────────────────────
function StepDot({ n, current }: { n: number; current: Step }) {
  const done = n < current;
  const active = n === current;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? '#18181b' : active ? '#18181b' : '#f4f4f5',
        color: done || active ? '#fff' : '#a1a1aa',
        fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600,
        border: active ? '2px solid #18181b' : done ? 'none' : '1px solid #e4e4e7',
        transition: 'all .2s',
      }}>
        {done ? '✓' : n}
      </div>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: active ? '#18181b' : '#a1a1aa', letterSpacing: '.08em' }}>
        {['', 'SELECT SHEET', 'MAP COLUMNS', 'PREVIEW & IMPORT'][n]}
      </span>
    </div>
  );
}

function NativeSelect({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #e4e4e7',
        background: '#fff', fontSize: 13, color: value ? '#18181b' : '#a1a1aa',
        fontFamily: 'inherit', cursor: 'pointer', outline: 'none', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23a1a1aa' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center',
        paddingRight: 32,
      }}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px', borderRadius: 12,
      background: type === 'success' ? '#18181b' : '#fef2f2',
      border: type === 'success' ? 'none' : '1px solid #fecaca',
      boxShadow: '0 8px 24px -4px rgba(24,24,27,.3)',
      animation: 'cm-in .3s cubic-bezier(.22,1,.36,1)',
      maxWidth: 340,
    }}>
      <span style={{ fontSize: 14 }}>{type === 'success' ? '✓' : '✕'}</span>
      <span style={{ fontSize: 13, color: type === 'success' ? '#fff' : '#b91c1c', fontFamily: 'var(--font-mono)' }}>{message}</span>
    </div>
  );
}

// ── Main wizard ───────────────────────────────────────────────────────────────
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

  // Parse spreadsheet ID from URL or raw ID
  const parseId = (input: string): string => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  // Step 1 → fetch sheet tabs
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

  // Step 1 → 2: fetch rows
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
      // Auto-map columns by fuzzy label match
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

  // Step 2 → 3: build preview
  const buildPreview = () => {
    if (!mapping.title || !mapping.code) { setError('Job Title and Job Code mappings are required.'); return; }
    setError('');
    const titleIdx  = headers.indexOf(mapping.title);
    const codeIdx   = headers.indexOf(mapping.code);
    const locIdx    = headers.indexOf(mapping.location);
    const expIdx    = headers.indexOf(mapping.experience);
    const descIdx   = headers.indexOf(mapping.description);
    const modeIdx   = headers.indexOf(mapping.workMode);

    const rows: PreviewRow[] = rawRows
      .map((row, i) => ({
        idx: i,
        title:       row[titleIdx]?.trim() ?? '',
        code:        row[codeIdx]?.trim() ?? '',
        location:    row[locIdx]?.trim() ?? 'Remote',
        experience:  row[expIdx]?.trim() ?? '',
        description: row[descIdx]?.trim() ?? '',
        workMode:    (['Remote','Hybrid','On-Site'].includes(row[modeIdx]?.trim() ?? '') ? row[modeIdx].trim() : 'Remote') as 'Remote'|'Hybrid'|'On-Site',
        selected:    true,
      }))
      .filter(r => r.title && r.code);

    if (rows.length === 0) { setError('No valid rows found. Make sure Title and Code columns have data.'); return; }
    setPreview(rows);
    setStep(3);
  };

  // Step 3: import
  const doImport = async () => {
    const selected = preview.filter(r => r.selected);
    if (selected.length === 0) { setError('Select at least one row to import.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/jobs/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: selected.map(r => ({
            title: r.title, code: r.code, location: r.location,
            experience: r.experience, description: r.description, workMode: r.workMode,
          })),
        }),
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
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(24,24,27,.2)', backdropFilter: 'blur(2px)', animation: 'cm-fade .2s ease' }} />

      {/* Dialog */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, width: 580, maxWidth: '95vw', maxHeight: '88vh',
        background: '#fff', borderRadius: 18, border: '1px solid #e4e4e7',
        boxShadow: '0 24px 64px -16px rgba(24,24,27,.28)',
        display: 'flex', flexDirection: 'column',
        animation: 'cm-in .3s cubic-bezier(.22,1,.36,1)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f1f2', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2" stroke="#18181b" strokeWidth="1.5"/><path d="M7 7h6M7 10h6M7 13h4" stroke="#18181b" strokeWidth="1.4" strokeLinecap="round"/></svg>
              <span style={{ fontFamily: 'var(--font-space)', fontWeight: 700, fontSize: 15, color: '#18181b' }}>Import from Google Sheets</span>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[1, 2, 3].map(n => <StepDot key={n} n={n} current={step} />)}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 9, border: '1px solid #e4e4e7', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#71717a', fontSize: 14, flexShrink: 0 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>GOOGLE SHEETS URL OR SPREADSHEET ID</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={spreadsheetUrl}
                    onChange={e => setSpreadsheetUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && fetchSheets()}
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 10, border: '1px solid #e4e4e7', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none', color: '#18181b' }}
                  />
                  <button
                    onClick={fetchSheets}
                    disabled={loading || !spreadsheetUrl}
                    style={{ padding: '9px 16px', borderRadius: 10, background: '#18181b', color: '#fff', border: 'none', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: loading ? 'wait' : 'pointer', opacity: !spreadsheetUrl ? .4 : 1 }}
                  >
                    {loading ? '...' : 'Connect'}
                  </button>
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: '#a1a1aa' }}>Paste the full URL or just the spreadsheet ID from the URL bar.</div>
              </div>

              {sheets.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '.16em', color: '#a1a1aa', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>SELECT SHEET TAB</div>
                  <NativeSelect
                    value={sheetName}
                    onChange={setSheetName}
                    placeholder="Choose a tab…"
                    options={sheets.map(s => ({ value: s, label: s }))}
                  />
                </div>
              )}

              {error && <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 12, color: '#b91c1c', lineHeight: 1.5 }}>{error}</div>}
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 11.5, color: '#71717a', marginBottom: 12, lineHeight: 1.6 }}>
                Map your sheet columns to job fields. <span style={{ color: '#18181b', fontWeight: 500 }}>Title</span> and <span style={{ color: '#18181b', fontWeight: 500 }}>Code</span> are required.
              </div>
              {FIELDS.map(f => (
                <div key={f.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f4f4f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#18181b' }}>{f.label}</span>
                    {f.required && <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#ef4444', fontFamily: 'var(--font-mono)' }}>REQ</span>}
                  </div>
                  <NativeSelect
                    value={mapping[f.key]}
                    onChange={v => setMapping(m => ({ ...m, [f.key]: v }))}
                    placeholder="— skip —"
                    options={colOptions}
                  />
                </div>
              ))}
              {error && <div style={{ marginTop: 8, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 12, color: '#b91c1c' }}>{error}</div>}
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 11.5, color: '#71717a' }}>
                  <span style={{ color: '#18181b', fontWeight: 600 }}>{preview.filter(r => r.selected).length}</span> of {preview.length} rows selected
                </div>
                <button
                  onClick={() => setPreview(p => p.map(r => ({ ...r, selected: !p.every(x => x.selected) })))}
                  style={{ fontSize: 11, color: '#52525b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', textDecoration: 'underline' }}
                >
                  {preview.every(r => r.selected) ? 'Deselect all' : 'Select all'}
                </button>
              </div>

              <div style={{ border: '1px solid #e4e4e7', borderRadius: 12, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 90px 80px', gap: 0, background: '#f8f8f9', borderBottom: '1px solid #e4e4e7' }}>
                  {['', 'Job Title', 'Code', 'Location', 'Mode'].map((h, i) => (
                    <div key={i} style={{ padding: '8px 10px', fontSize: 9, letterSpacing: '.14em', color: '#a1a1aa', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h}</div>
                  ))}
                </div>

                {/* Scrollable rows */}
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {preview.map(row => (
                    <div
                      key={row.idx}
                      onClick={() => setPreview(p => p.map(r => r.idx === row.idx ? { ...r, selected: !r.selected } : r))}
                      style={{
                        display: 'grid', gridTemplateColumns: '32px 1fr 100px 90px 80px',
                        borderBottom: '1px solid #f4f4f5', cursor: 'pointer',
                        background: row.selected ? '#fff' : '#f9f9fa',
                        opacity: row.selected ? 1 : .45,
                        transition: 'opacity .15s, background .15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 5, border: `1.5px solid ${row.selected ? '#18181b' : '#d4d4d8'}`,
                          background: row.selected ? '#18181b' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {row.selected && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
                        </div>
                      </div>
                      <div style={{ padding: '10px', fontSize: 12.5, fontWeight: 500, color: '#18181b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</div>
                      <div style={{ padding: '10px', fontSize: 11, color: '#52525b', fontFamily: 'var(--font-mono)' }}>{row.code}</div>
                      <div style={{ padding: '10px', fontSize: 11, color: '#71717a' }}>{row.location || '—'}</div>
                      <div style={{ padding: '10px', fontSize: 10, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>{row.workMode}</div>
                    </div>
                  ))}
                </div>
              </div>

              {error && <div style={{ marginTop: 10, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 9, fontSize: 12, color: '#b91c1c' }}>{error}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => step > 1 ? setStep(s => (s - 1) as Step) : onClose()}
            style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid #e4e4e7', background: '#fff', fontSize: 12, color: '#52525b', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {step === 3 && (
              <span style={{ fontSize: 11, color: '#a1a1aa', fontFamily: 'var(--font-mono)' }}>
                {preview.filter(r => r.selected).length} job{preview.filter(r => r.selected).length !== 1 ? 's' : ''} ready
              </span>
            )}
            <button
              disabled={loading}
              onClick={() => {
                if (step === 1) fetchRows();
                else if (step === 2) buildPreview();
                else doImport();
              }}
              style={{
                padding: '9px 20px', borderRadius: 10, background: '#18181b', color: '#fff',
                border: 'none', fontSize: 12, fontFamily: 'var(--font-mono)', cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? .6 : 1, letterSpacing: '.04em',
              }}
            >
              {loading ? 'Working…'
                : step === 1 ? 'Load Sheet →'
                : step === 2 ? 'Preview Rows →'
                : `Import ${preview.filter(r => r.selected).length} Jobs`}
            </button>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
