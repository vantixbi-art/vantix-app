import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Zap, TrendingUp, BrainCircuit, Waves, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BotVerification } from '../components/BotVerification';

const FEATURES = [
  { icon: <BrainCircuit size={16} />, label: 'AI Pattern Recognition' },
  { icon: <Waves         size={16} />, label: 'Whale & Dark Pool Tracker' },
  { icon: <TrendingUp    size={16} />, label: 'Smart Multi-Condition Alerts' },
  { icon: <Zap           size={16} />, label: 'Real-Time Options Flow' },
];

// ── Legal modal primitives ────────────────────────────────────────────────────

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="w-0.5 h-3.5 bg-gold/60 rounded-full shrink-0" />
        <h3 className="text-[11px] font-bold text-gold/90 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="text-xs text-muted/80 leading-relaxed pl-[14px]">{children}</div>
    </div>
  );
}

function LegalModal({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#0D0D0F] border border-white/[0.08] rounded-xl w-full max-w-lg flex flex-col"
        style={{ boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 30px rgba(255,215,0,0.05)' }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" style={{ boxShadow: '0 0 8px rgba(255,215,0,0.7)' }} />
            <h2 className="font-bold text-sm text-white tracking-wide">{title}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1 rounded-md hover:bg-white/5" aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto max-h-[60vh] flex flex-col gap-5">{children}</div>
        <div className="px-6 py-4 border-t border-white/[0.07] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-md bg-gold/10 hover:bg-gold/20 border border-gold/40 text-gold transition-all"
            style={{ boxShadow: '0 0 12px rgba(255,215,0,0.08)' }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Landing page ──────────────────────────────────────────────────────────────

export function LandingView() {
  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [visible,        setVisible]        = useState(false);
  const [modal,          setModal]          = useState<'terms' | 'privacy' | null>(null);
  const [agreed,         setAgreed]         = useState(false);
  const [isSignUp,       setIsSignUp]       = useState(false);
  const [error,          setError]          = useState('');
  const [signUpSuccess,  setSignUpSuccess]  = useState(false);
  const [loading,        setLoading]        = useState(false);
  const [captchaToken,   setCaptchaToken]   = useState<string | null>(null);
  const [botVerified,    setBotVerified]    = useState<boolean>(false);

  const inputCls =
    'w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors';

  const handleSubmit = async () => {
    if (!agreed || !botVerified) return;
    setLoading(true);
    setError('');
    setSignUpSuccess(false);
    try {
      const options = captchaToken ? { captchaToken } : undefined;
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password, options });
        if (signUpError) setError(signUpError.message);
        else setSignUpSuccess(true);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password, options });
        if (signInError) setError(signInError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreed || !botVerified) return;
    const options: any = { redirectTo: window.location.origin };
    if (captchaToken) {
      options.captchaToken = captchaToken;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options,
    });
  };

  const toggleMode = () => {
    setIsSignUp(v => !v);
    setError('');
    setSignUpSuccess(false);
  };

  return (
    <div className="min-h-screen bg-canvas text-white flex flex-col overflow-hidden relative">

      {/* ── Modals ── */}
      {modal === 'terms' && (
        <LegalModal title="Terms of Service" onClose={() => setModal(null)}>
          <LegalSection title="Eligibility">
            You must be at least 18 years of age to create an account or use any features of Vantix. By registering or accessing the platform you confirm that you satisfy this requirement. Vantix reserves the right to suspend accounts that do not meet this criterion.
          </LegalSection>
          <LegalSection title="License">
            All market data, charts, AI-generated analysis, and platform content are licensed to you for personal, non-commercial, non-professional use only. You may not redistribute, resell, republish, reverse-engineer, or incorporate any Vantix data or content into third-party services, publications, or financial products of any kind.
          </LegalSection>
          <LegalSection title="Disclaimers">
            Vantix is an informational and educational platform. Nothing published on Vantix — including AI signals, alerts, analyst commentary, whale tracking data, or options flow — constitutes financial, investment, trading, or tax advice. All outputs are for educational and analytical purposes only and must not be relied upon for actual investment or trading decisions.
          </LegalSection>
          <LegalSection title="Limitation of Liability">
            Vantix and its operators, employees, and affiliates shall not be held liable for any trading losses, lost profits, financial damages, or consequential losses of any kind arising from your use of or reliance on information provided by this platform. All use of Vantix is entirely at your own risk.
          </LegalSection>
        </LegalModal>
      )}

      {modal === 'privacy' && (
        <LegalModal title="Privacy Policy" onClose={() => setModal(null)}>
          <LegalSection title="Data Collection">
            We collect only the information necessary to provide the Vantix service: your email address, trade journal entries you choose to log, account settings, and usage preferences. We do not collect brokerage credentials, financial account numbers, social security numbers, or any other sensitive financial identifiers.
          </LegalSection>
          <LegalSection title="Data Protection">
            We do not sell, rent, trade, or share your personal data with third parties for marketing or commercial purposes. All data is secured using industry-standard encryption at rest and in transit. API keys entered in the Settings panel are stored locally on your device only and are never transmitted to or stored on Vantix servers.
          </LegalSection>
          <LegalSection title="User Rights">
            You have the right to access, correct, export, or request permanent deletion of all personal data associated with your account at any time. To submit a data deletion or export request, contact{' '}
            <span className="text-gold/80 font-mono text-[11px]">privacy@vantix.io</span>.
            {' '}We will acknowledge your request within 5 business days and complete processing within 30 days, in accordance with applicable data protection regulations.
          </LegalSection>
        </LegalModal>
      )}

      {/* Ambient glow blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-live/5 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-white/[0.02] blur-[80px]" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-gold"><Zap size={18} /></span>
          <span className="text-base font-bold tracking-widest uppercase text-white">Vantix</span>
        </div>
        <span
          className="text-[11px] font-bold px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold tracking-wider"
          style={{ boxShadow: '0 0 10px rgba(255,215,0,0.1)' }}
        >
          Beta Access
        </span>
      </header>

      {/* Hero + Auth layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-16 px-8 py-16 max-w-6xl mx-auto w-full">

        {/* Left — Hero copy */}
        <div className="flex-1 flex flex-col gap-8 max-w-xl">
          <div className="flex items-center gap-2 self-start">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-live" />
            </span>
            <span className="text-[11px] font-semibold text-live uppercase tracking-widest">
              Markets Open — Live Data
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight">
              The Ultimate<br />
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #FFD700 0%, #00FF88 100%)' }}
              >
                AI Trading
              </span>
              <br />Ecosystem.
            </h1>
            <p className="text-base text-muted leading-relaxed max-w-md">
              Institutional-grade pattern recognition, whale tracking, and AI coaching — unified in one terminal built for serious traders.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-white/5 border border-border">
                <span className="text-gold">{f.icon}</span>
                <span className="text-xs font-medium text-white/70">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['G', 'A', 'M', 'R'].map((l, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-canvas bg-gradient-to-br from-gold/30 to-live/20 flex items-center justify-center text-[10px] font-bold text-white/70"
                >
                  {l}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted">
              Joined by <span className="text-white font-semibold">2,400+</span> pro traders in beta
            </p>
          </div>
        </div>

        {/* Right — Auth card */}
        <div className="w-full max-w-sm shrink-0">
          <div
            className="glass-panel p-7 flex flex-col gap-5"
            style={{ boxShadow: '0 0 40px rgba(0,255,136,0.06), 0 0 80px rgba(255,215,0,0.03)' }}
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold">
                {isSignUp ? 'Create Your Account' : 'Access the Terminal'}
              </h2>
              <p className="text-xs text-muted">
                {isSignUp ? 'Start your free Vantix account' : 'Sign in to your Vantix account'}
              </p>
            </div>

            {/* Google OAuth */}
            <button
              onClick={handleGoogleSignIn}
              disabled={!agreed || !botVerified}
              className="w-full flex items-center justify-center gap-3 py-2.5 rounded-md border border-border bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[11px] text-muted">or continue with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className={`${inputCls} pl-9`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-muted uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  className={`${inputCls} pl-9 pr-10`}
                  type={visible ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agreed && botVerified && handleSubmit()}
                />
                <button
                  type="button"
                  onClick={() => setVisible(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white transition-colors"
                >
                  {visible ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Anti-Bot Security Verification */}
            <BotVerification
              verified={botVerified}
              onVerify={(token) => {
                setCaptchaToken(token);
                setBotVerified(true);
              }}
              onReset={() => {
                setCaptchaToken(null);
                setBotVerified(false);
              }}
            />

            {/* Sign in ↔ Sign up toggle */}
            <button
              type="button"
              onClick={toggleMode}
              className="text-center text-xs text-muted/70 hover:text-white/80 transition-colors -mt-1"
            >
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <span className="text-gold font-semibold">{isSignUp ? 'Sign In' : 'Sign Up'}</span>
            </button>

            {/* Consent checkbox */}
            <div className="flex items-start gap-3 select-none">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreed}
                onClick={() => setAgreed(v => !v)}
                className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center transition-all focus:outline-none ${
                  agreed ? 'bg-live/20 border-live' : 'border-border/80 hover:border-muted'
                }`}
                style={agreed ? { boxShadow: '0 0 8px rgba(0,255,136,0.35)' } : undefined}
              >
                {agreed && <Check size={9} className="text-live" strokeWidth={3} />}
              </button>
              <p
                className="text-[11px] text-muted/70 leading-relaxed cursor-pointer"
                onClick={() => setAgreed(v => !v)}
              >
                I confirm that I am at least 18 years old and agree to the{' '}
                <button type="button" onClick={e => { e.stopPropagation(); setModal('terms'); }}
                  className="underline decoration-muted/40 text-muted/90 hover:text-white hover:decoration-white/60 transition-colors">
                  Terms of Service
                </button>
                {' '}and{' '}
                <button type="button" onClick={e => { e.stopPropagation(); setModal('privacy'); }}
                  className="underline decoration-muted/40 text-muted/90 hover:text-white hover:decoration-white/60 transition-colors">
                  Privacy Policy
                </button>.
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-alert/30 bg-alert/[0.06]">
                <X size={13} className="text-alert shrink-0 mt-0.5" />
                <p className="text-xs text-alert/90 leading-snug">{error}</p>
              </div>
            )}

            {/* Sign-up success message */}
            {signUpSuccess && (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg border border-live/30 bg-live/[0.05]">
                <Check size={13} className="text-live shrink-0 mt-0.5" />
                <p className="text-xs text-live/90 leading-snug">
                  Account created! Check your email to verify your address, then sign in.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!agreed || !botVerified || loading}
              className="w-full py-2.5 rounded-md text-sm font-bold bg-live text-black hover:bg-live/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={agreed && botVerified ? { boxShadow: '0 0 20px rgba(0,255,136,0.2)' } : undefined}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-black/30 border-t-black/80 animate-spin" />
                  Processing…
                </span>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            {/* Disclaimer */}
            <p className="text-[10px] text-muted/40 leading-relaxed text-center px-1">
              <span className="font-semibold text-muted/50">Disclaimer:</span> Vantix is an informational and educational platform. All content, data, alerts, tools, and AI-generated analysis are for analytical purposes only and do not constitute financial, investment, trading, or tax advice. Trading financial instruments carries a high level of risk. Vantix does not assume any liability for financial losses.
            </p>
          </div>
        </div>

      </div>

      {/* Bottom ticker tape */}
      <div className="relative z-10 border-t border-border/50 px-8 py-3 flex items-center gap-8 overflow-hidden">
        {[
          { sym: 'BTC',  val: '$71,240', chg: '+2.4%', up: true  },
          { sym: 'ETH',  val: '$3,850',  chg: '+1.1%', up: true  },
          { sym: 'SPY',  val: '$528.40', chg: '+0.8%', up: true  },
          { sym: 'QQQ',  val: '$445.20', chg: '+1.2%', up: true  },
          { sym: 'NVDA', val: '$948.00', chg: '+3.1%', up: true  },
          { sym: 'VIX',  val: '18.42',   chg: '-1.2%', up: false },
        ].map(t => (
          <div key={t.sym} className="flex items-center gap-2 font-mono text-xs whitespace-nowrap shrink-0">
            <span className="font-bold text-white">{t.sym}</span>
            <span className="text-muted">{t.val}</span>
            <span className={t.up ? 'text-live' : 'text-alert'}>{t.chg}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
