import { useState, useEffect, useRef } from 'react';
import { User, SlidersHorizontal, CheckCircle2, Crown, Shield, Zap, Palette, Check, Copy, MessageCircle, HeartHandshake, BrainCircuit, CreditCard, Mail, Camera, Trash2, LogOut, RefreshCw } from 'lucide-react';
import { useTheme, THEMES, type ThemeId } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { encryptKey, decryptKey } from '../lib/crypto';
import { supabase } from '../lib/supabase';

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
      <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-gold">{icon}</div>
      <div>
        <h2 className="text-sm font-bold">{title}</h2>
        {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label className="text-[11px] text-muted uppercase tracking-widest font-medium">{children}</label>
      {hint && <span className="text-[10px] text-muted/50">{hint}</span>}
    </div>
  );
}

const inputCls =
  'w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-muted/40 font-mono focus:outline-none focus:border-gold transition-colors';

// ── Image compression helper ──────────────────────────────────────────────────

function compressImage(file: File, maxPx = 128, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const scale  = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = blobUrl;
  });
}

// ── Profile Avatar ────────────────────────────────────────────────────────────

function ProfileAvatarCard() {
  const { user } = useUser();
  const userId   = user?.id ?? '';
  const storageKey = `vantix_avatar_${userId}`;

  const [preview,   setPreview]   = useState<string>(() =>
    user?.user_metadata?.avatar_url || (userId ? localStorage.getItem(storageKey) ?? '' : '')
  );
  const [uploading, setUploading] = useState(false);
  const [removing,  setRemoving]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const dataUrl = await compressImage(file, 128, 0.85);
      try { localStorage.setItem(storageKey, dataUrl); } catch { /* quota exceeded */ }
      await supabase.auth.updateUser({ data: { avatar_url: dataUrl } });
      setPreview(dataUrl);
      window.dispatchEvent(new CustomEvent<string>('vantix-avatar-updated', { detail: dataUrl }));
    } catch { /* ignore */ }
    finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removeAvatar() {
    if (!userId) return;
    setRemoving(true);
    try {
      localStorage.removeItem(storageKey);
      await supabase.auth.updateUser({ data: { avatar_url: null } });
      setPreview('');
      window.dispatchEvent(new CustomEvent<string>('vantix-avatar-updated', { detail: '' }));
    } catch { /* ignore */ }
    finally { setRemoving(false); }
  }

  const initial = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'T')
    .charAt(0).toUpperCase();

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<Camera size={15} />}
        title="Profile Avatar"
        subtitle="Upload a custom profile photo — displayed in the sidebar"
      />

      <div className="flex items-center gap-5">
        {/* Preview */}
        <div className="relative shrink-0">
          {preview ? (
            <img
              src={preview}
              alt="Avatar preview"
              className="w-16 h-16 rounded-full object-cover border-2 border-gold/40"
              style={{ boxShadow: '0 0 16px rgba(255,215,0,0.14)' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 border-2 border-gold/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 16px rgba(255,215,0,0.10)' }}
            >
              <span className="text-2xl font-bold text-gold">{initial}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gold/30 bg-gold/[0.06] text-sm font-bold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 disabled:opacity-50 disabled:cursor-wait"
            style={{ boxShadow: '0 0 14px rgba(255,215,0,0.06)' }}
          >
            <Camera size={14} />
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </button>

          {preview && (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={removing}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg border border-alert/20 bg-alert/[0.04] text-xs font-semibold text-alert/80 transition-all hover:bg-alert/10 hover:border-alert/40 hover:text-alert disabled:opacity-50"
            >
              <Trash2 size={12} />
              {removing ? 'Removing…' : 'Remove Avatar'}
            </button>
          )}

          <p className="text-[10px] text-muted/40 leading-relaxed">
            PNG, JPG or WEBP · Resized to 128 × 128 px
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Profile & Subscription ────────────────────────────────────────────────────

function ProfileCard() {
  const { tier } = useUser();
  const isPro = tier === 'pro';

  const planDetails = isPro
    ? [
        { label: 'Plan',      value: 'Pro Monthly',     highlight: false },
        { label: 'Status',    value: 'Active',           highlight: true  },
        { label: 'Renews',    value: 'Jun 28, 2026',     highlight: false },
        { label: 'API Calls', value: '8,420 / 50,000',   highlight: false },
      ]
    : [
        { label: 'Plan',      value: 'Free',             highlight: false },
        { label: 'Status',    value: 'Active',           highlight: true  },
        { label: 'Trade Logs', value: '5 max',           highlight: false },
        { label: 'API Calls', value: '0 / 1,000',        highlight: false },
      ];

  const proFeatures = ['AI Analyst', 'Whale Tracker', 'Dark Pool', 'Options Flow', 'Smart Alerts', 'AI Coach'];
  const freeFeatures = ['Global News', 'Basic Watchlist', 'Market Tools (limited)'];

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<User size={15} />}
        title="Profile & Subscription"
        subtitle="Your account identity and plan"
      />

      <div className="flex flex-col gap-4">
        {/* Avatar + plan badge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-border">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-gold">G</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">Gilad</p>
            <p className="text-xs text-muted truncate">gilad3210@gmail.com</p>
          </div>
          {isPro ? (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/10 shrink-0"
              style={{ boxShadow: '0 0 12px rgba(255,215,0,0.12)' }}
            >
              <Crown size={11} className="text-gold" />
              <span className="text-[11px] font-bold text-gold tracking-wide">Vantix PRO</span>
            </div>
          ) : (
            <span className="text-[11px] font-bold text-muted border border-muted/30 rounded-full px-3 py-1 shrink-0">
              FREE
            </span>
          )}
        </div>

        {/* Plan details */}
        <div className="grid grid-cols-2 gap-3">
          {planDetails.map(item => (
            <div key={item.label} className="flex flex-col gap-0.5 bg-canvas rounded-lg px-3 py-2.5 border border-border">
              <span className="text-[10px] text-muted uppercase tracking-widest">{item.label}</span>
              <span className={`text-sm font-semibold font-mono ${item.highlight ? 'text-live' : 'text-white/80'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-2">
          {(isPro ? proFeatures : freeFeatures).map(f => (
            <span key={f} className="flex items-center gap-1 text-[10px] text-muted border border-border rounded-full px-2.5 py-1 bg-white/5">
              <CheckCircle2 size={9} className={isPro ? 'text-live' : 'text-muted/50'} />
              {f}
            </span>
          ))}
        </div>

        {/* Manage subscription */}
        {!isPro && (
          <div className="pt-3 border-t border-border">
            <a
              href="/billing"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gold/30 bg-gold/[0.06] text-sm font-bold text-gold transition-all hover:bg-gold/10 hover:border-gold/50"
              style={{ boxShadow: '0 0 16px rgba(255,215,0,0.07)' }}
            >
              <CreditCard size={14} />
              Upgrade to Vantix Pro
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Appearance ────────────────────────────────────────────────────────────────

function AppearanceCard() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<Palette size={15} />}
        title="Appearance"
        subtitle="Personalise the terminal color theme"
      />

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(t => {
          const isActive = t.id === theme;
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id as ThemeId)}
              className={`relative flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'border-gold/50 bg-gold/[0.06]'
                  : 'border-border bg-white/[0.03] hover:border-gold/30 hover:bg-white/[0.05]'
              }`}
              style={{ boxShadow: isActive ? `0 0 20px ${t.dot}22` : undefined }}
            >
              <span
                className="w-4 h-4 rounded-full shrink-0 mt-0.5 ring-1 ring-white/10"
                style={{ background: t.dot, boxShadow: `0 0 8px ${t.dot}60` }}
              />
              <div className="flex flex-col min-w-0">
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {t.name}
                </span>
                <span className="text-[10px] text-muted/70 mt-0.5 leading-snug">{t.description}</span>
              </div>
              {isActive && (
                <Check size={13} className="absolute top-2.5 right-2.5 text-gold" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}



// ── Trading Preferences ───────────────────────────────────────────────────────

function PreferencesCard({ onChange }: { onChange: () => void }) {
  const [riskPct,      setRiskPct]      = useState('1');
  const [accountSize,  setAccountSize]  = useState('100000');
  const [defaultQty,   setDefaultQty]   = useState('100');
  const [riskReward,   setRiskReward]   = useState('2');

  const riskDollar = ((parseFloat(riskPct) || 0) / 100) * (parseFloat(accountSize) || 0);

  function wrap(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => { setter(e.target.value); onChange(); };
  }

  const numberCls = `${inputCls} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`;

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<SlidersHorizontal size={15} />}
        title="Trading Preferences"
        subtitle="Defaults used across Position Sizer and AI Coach"
      />

      <div className="flex flex-col gap-4">
        {/* Account size + Risk % */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Default Account Size</FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">$</span>
              <input
                className={`${numberCls} pl-6`}
                type="number"
                min="0"
                step="1000"
                value={accountSize}
                onChange={wrap(setAccountSize)}
              />
            </div>
          </div>
          <div>
            <FieldLabel>Risk per Trade</FieldLabel>
            <div className="relative">
              <input
                className={`${numberCls} pr-6`}
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={riskPct}
                onChange={wrap(setRiskPct)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
            </div>
          </div>
        </div>

        {/* Risk in dollars — live calculation */}
        {riskDollar > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-alert/5 border border-alert/20">
            <span className="text-[11px] text-muted">Max risk per trade</span>
            <span className="text-sm font-bold font-mono text-alert">
              ${riskDollar.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </span>
          </div>
        )}

        <div className="h-px bg-border" />

        {/* Default qty + R/R */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel hint="shares / coins">Default Quantity</FieldLabel>
            <input
              className={numberCls}
              type="number"
              min="1"
              step="1"
              value={defaultQty}
              onChange={wrap(setDefaultQty)}
            />
          </div>
          <div>
            <FieldLabel hint="reward : risk">Min R/R Ratio</FieldLabel>
            <div className="relative">
              <input
                className={`${numberCls} pr-6`}
                type="number"
                min="0.5"
                step="0.5"
                value={riskReward}
                onChange={wrap(setRiskReward)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">:1</span>
            </div>
          </div>
        </div>

        {/* Preference summary */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
          <Zap size={12} className="text-gold shrink-0" />
          <p className="text-[11px] text-muted leading-snug">
            These defaults are pre-filled in the Position Sizer and Trade Journal forms.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── AI Coach Status ───────────────────────────────────────────────────────────

function AICoachCard() {
  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<BrainCircuit size={15} />}
        title="AI Coach & Intelligence Engine"
        subtitle="Powered by Google Gemini 1.5 Flash via secure server infrastructure"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-live/5 border border-live/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-live/10 border border-live/30 flex items-center justify-center shrink-0">
              <BrainCircuit size={16} className="text-live" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Google Gemini 1.5 Flash</p>
              <p className="text-[11px] text-muted">Server-Side Integration · Active</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-live bg-live/10 border border-live/30 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={10} />
            Connected & Secured
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
          <Shield size={12} className="text-gold shrink-0" />
          <p className="text-[11px] text-muted leading-snug">
            AI queries are processed through server-side Edge Functions with zero key exposure to client devices.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Business Contact ──────────────────────────────────────────────────────────

function BusinessContactCard() {
  const [copied, setCopied] = useState(false);
  const email = 'vantixbi@gmail.com';

  function copyEmail() {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      try {
        const el = document.createElement('textarea');
        el.value = email;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    });
  }

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<Mail size={15} />}
        title="Official Business Contact & Support"
        subtitle="Reach out to the Vantix team for business inquiries, support, or partnerships"
      />

      <div className="flex flex-col gap-4">
        {/* Email display tile */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/5 border border-gold/20">
          <div
            className="w-9 h-9 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center shrink-0"
            style={{ boxShadow: '0 0 12px rgba(255,215,0,0.10)' }}
          >
            <Mail size={16} className="text-gold" />
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-widest">Business Email</p>
            <p className="text-sm font-mono font-semibold text-white">{email}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`mailto:${email}`}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gold/30 bg-gold/[0.06] text-sm font-bold text-gold transition-all hover:bg-gold/10 hover:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            style={{ boxShadow: '0 0 16px rgba(255,215,0,0.07)' }}
          >
            <Mail size={14} />
            Send Email
          </a>
          <button
            type="button"
            onClick={copyEmail}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 ${
              copied
                ? 'border-live/40 bg-live/10 text-live'
                : 'border-border bg-white/[0.03] text-muted hover:border-white/20 hover:text-white'
            }`}
          >
            {copied
              ? <><Check size={14} /> Copied ✓</>
              : <><Copy size={14} /> Copy Email</>}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
          <Shield size={12} className="text-gold shrink-0" />
          <p className="text-[11px] text-muted leading-snug">
            For partnerships, press inquiries, or enterprise licensing, reach out directly.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── System & Support ─────────────────────────────────────────────────────────

function SupportCard() {
  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<HeartHandshake size={15} />}
        title="System & Support"
        subtitle="Share feedback or report issues directly to the Vantix team"
      />

      <div className="flex flex-col gap-4">
        <p className="text-[12px] text-muted leading-relaxed">
          Found a bug, have a feature idea, or just want to share your experience?
          Hit the button below to open the feedback panel — we read every submission.
        </p>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-feedback-modal'))}
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg border border-gold/30 bg-gold/[0.06] text-sm font-bold text-gold transition-all hover:bg-gold/10 hover:border-gold/50"
          style={{ boxShadow: '0 0 16px rgba(255,215,0,0.07)' }}
        >
          <MessageCircle size={14} />
          Submit Feedback / Report Bug
        </button>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
          <Shield size={12} className="text-muted shrink-0" />
          <p className="text-[11px] text-muted leading-snug">
            Submissions are private and only visible to the Vantix development team.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Account & Session Management ─────────────────────────────────────────────

function AccountCard() {
  const { signOut } = useUser();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try { await signOut(); } catch { setBusy(false); }
  }

  return (
    <div className="glass-panel p-5">
      <SectionHeader
        icon={<LogOut size={15} />}
        title="Account & Session Management"
        subtitle="Sign out or switch to a different account"
      />

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Sign Out */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-alert/30 bg-alert/[0.05] text-sm font-bold text-alert transition-all hover:bg-alert/10 hover:border-alert/50 disabled:opacity-50 disabled:cursor-wait"
          >
            <LogOut size={14} />
            {busy ? 'Signing Out…' : 'Sign Out'}
          </button>

          {/* Switch Account — signs out and lands on login form */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={busy}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-white/[0.03] text-sm font-semibold text-muted transition-all hover:border-white/20 hover:text-white disabled:opacity-50 disabled:cursor-wait"
          >
            <RefreshCw size={14} />
            Switch Account
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
          <Shield size={12} className="text-muted/50 shrink-0" />
          <p className="text-[11px] text-muted/60 leading-snug">
            Signing out ends your session and clears all cached credentials from this browser.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SettingsView() {
  const { user } = useUser();
  const userId = user?.id || '';

  const [dirty,      setDirty]      = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [finnhubKey, setFinnhubKey] = useState('');
  const [sbKey,      setSbKey]      = useState('');
  const [geminiKey,  setGeminiKey]  = useState('');

  useEffect(() => {
    const rawFinnhub = localStorage.getItem('vantix_finnhub_key') ?? '';
    const rawSb = localStorage.getItem('vantix_supabase_key') ?? '';
    const rawGemini = localStorage.getItem('vantix_gemini_api_key') ?? '';

    setFinnhubKey(decryptKey(rawFinnhub, userId) || rawFinnhub);
    setSbKey(decryptKey(rawSb, userId) || rawSb);
    setGeminiKey(decryptKey(rawGemini, userId) || rawGemini);
  }, [userId]);

  function markDirty() { setDirty(true); setSaved(false); }

  function save() {
    localStorage.setItem('vantix_finnhub_key',    encryptKey(finnhubKey, userId));
    localStorage.setItem('vantix_supabase_key',   encryptKey(sbKey, userId));
    localStorage.setItem('vantix_gemini_api_key', encryptKey(geminiKey, userId));
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 py-6 px-4">

        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-muted text-sm mt-1">Manage your profile, API keys, and trading defaults</p>
          </div>

          <button
            onClick={save}
            disabled={!dirty && !saved}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all ${
              saved
                ? 'bg-live/20 text-live border border-live/40'
                : dirty
                ? 'bg-live text-black hover:bg-live/90'
                : 'bg-white/5 text-muted border border-border cursor-not-allowed'
            }`}
          >
            {saved
              ? <><CheckCircle2 size={14} /> Saved</>
              : <><CheckCircle2 size={14} /> Save Settings</>}
          </button>
        </div>

        <ProfileCard />
        <ProfileAvatarCard />
        <AppearanceCard />
        <AICoachCard />
        <PreferencesCard onChange={markDirty} />
        <BusinessContactCard />
        <SupportCard />
        <AccountCard />

        <p className="text-center text-[11px] text-muted/40 pb-2">
          © 2026 Vantix Terminal · All rights reserved · Official Contact: vantixbi@gmail.com
        </p>

      </div>
    </div>
  );
}
