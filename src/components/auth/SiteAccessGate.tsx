import { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';

// ── Master toggle — set to false to disable the gate on public launch ──────────
const ENABLE_EARLY_ACCESS_GATE = true;

const STORAGE_KEY = 'vantix_beta_access_granted';
const PASSCODE    = (import.meta as any).env?.VITE_SITE_ACCESS_PASSCODE ?? 'VANTIX-BETA-2026-X9!';

async function sha256(str: string): Promise<string> {
  const buf    = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function isGranted(): boolean {
  if (!ENABLE_EARLY_ACCESS_GATE) return true;
  try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch { return false; }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props { children: React.ReactNode }

export function SiteAccessGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(isGranted);
  const [input,    setInput]    = useState('');
  const [visible,  setVisible]  = useState(false);
  const [error,    setError]    = useState(false);
  const [checking, setChecking] = useState(false);
  const [granted,  setGranted]  = useState(false);

  if (unlocked) return <>{children}</>;

  async function verify() {
    const value = input.trim();
    if (!value || checking) return;
    setChecking(true);
    setError(false);
    try {
      const [got, want] = await Promise.all([sha256(value), sha256(PASSCODE)]);
      if (got === want) {
        setGranted(true);
        try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
        setTimeout(() => setUnlocked(true), 700);
      } else {
        setError(true);
        setInput('');
      }
    } finally {
      setChecking(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') verify();
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#070709] flex items-center justify-center overflow-hidden select-none">

      {/* Ambient orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-[130px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-live/4 blur-[110px]" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-gold/3 blur-[100px]" />
      </div>

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-2xl border border-gold/25 flex flex-col items-center gap-6 px-7 py-8"
        style={{
          background:  'linear-gradient(160deg, rgba(18,18,20,0.98) 0%, rgba(10,10,11,0.99) 100%)',
          backdropFilter: 'blur(32px)',
          boxShadow: '0 0 0 1px rgba(255,215,0,0.06), 0 0 60px rgba(255,215,0,0.07), 0 32px 80px rgba(0,0,0,0.6)',
        }}
      >

        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.10) 0%, rgba(7,7,9,0.96) 70%)',
              border: '1.5px solid rgba(212,175,55,0.50)',
              boxShadow: '0 0 28px rgba(212,175,55,0.22), 0 0 14px rgba(0,255,136,0.10)',
            }}
          >
            {granted
              ? <ShieldCheck size={26} className="text-live" />
              : <Lock size={22} className="text-gold" />
            }
          </div>

          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-[0.22em] uppercase text-white">VANTIX</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold tracking-widest uppercase">
              AI
            </span>
          </div>
        </div>

        {/* Header copy */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-alert/30 bg-alert/10">
            <KeyRound size={10} className="text-alert" />
            <span className="text-[10px] font-bold text-alert tracking-widest uppercase">Restricted Access</span>
          </div>
          <h1 className="text-lg font-bold text-white leading-tight">Vantix Beta</h1>
          <p className="text-[11px] text-muted/70 leading-relaxed">
            Early Access Program · Authorized Testers Only
          </p>
        </div>

        {/* Input section */}
        <div className="w-full flex flex-col gap-3">
          <label className="text-[10px] text-muted/60 uppercase tracking-widest font-medium">
            Access Passcode
          </label>

          <div className="relative">
            <input
              type={visible ? 'text' : 'password'}
              value={input}
              onChange={e => { setInput(e.target.value); setError(false); }}
              onKeyDown={onKeyDown}
              placeholder="Enter your passcode…"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 pr-11 text-sm text-white font-mono placeholder:text-muted/30 focus:outline-none transition-colors ${
                error
                  ? 'border-alert/60 focus:border-alert/80'
                  : 'border-border focus:border-gold/60'
              }`}
            />
            <button
              type="button"
              onClick={() => setVisible(v => !v)}
              aria-label={visible ? 'Hide passcode' : 'Show passcode'}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted/50 hover:text-muted transition-colors focus-visible:outline-none"
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-alert/30 bg-alert/10">
              <AlertTriangle size={12} className="text-alert shrink-0" />
              <p className="text-[11px] text-alert font-semibold">Invalid Passcode — Early Access Only</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={verify}
            disabled={!input.trim() || checking || granted}
            className={`w-full py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 ${
              granted
                ? 'bg-live/20 border border-live/40 text-live'
                : checking
                ? 'bg-gold/10 border border-gold/20 text-gold/60 cursor-wait'
                : input.trim()
                ? 'bg-gold text-[#070709] hover:bg-gold/90 shadow-[0_0_20px_rgba(255,215,0,0.20)]'
                : 'bg-white/5 border border-border text-muted/40 cursor-not-allowed'
            }`}
          >
            {granted
              ? '✓ Access Granted — Loading…'
              : checking
              ? 'Verifying…'
              : 'Unlock Access'
            }
          </button>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-muted/30 text-center leading-relaxed">
          This terminal is in closed beta. Access is restricted to authorized testers.
          Contact <span className="text-muted/50">vantixbi@gmail.com</span> to request access.
        </p>

      </div>
    </div>
  );
}
