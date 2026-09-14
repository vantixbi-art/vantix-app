import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Crown, Zap, Lock, Sparkles, BrainCircuit, Fish, BellRing, BarChart2, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

const STRIPE_MONTHLY_LINK = 'https://buy.stripe.com/test_fZuaEQ0cS5Gj5Jf1ao2sM01';
const STRIPE_YEARLY_LINK  = 'https://buy.stripe.com/test_6oU4gs0cS6Kn0oVcT62sM02';

const FREE_FEATURES = [
  '5 trade journal logs',
  'Basic watchlist (5 tickers)',
  'Global news feed',
  'Limited market tools',
];

const PRO_FEATURES = [
  'Unlimited trade journal logs',
  'Full AI Behavioral Analytics',
  'AI Trading Coach insights',
  'Unlimited watchlist',
  'Whale Tracker & Dark Pool prints',
  'Smart multi-condition alerts',
  'Options flow & insider feed',
  'Macro liquidity & yield curve tools',
  'Priority support',
];

const VALUE_PROPS = [
  {
    emoji: '🛡️',
    title: 'Stop Emotional Losses',
    subtitle: 'Behavioral Diagnostics',
    body: 'AI Behavioral Analytics scans your trade journal to flag emotional traps like FOMO and revenge trading. Our system acts as a psychological circuit-breaker to save you from avoidable losses.',
  },
  {
    emoji: '🐋',
    title: 'Ride the Whale Waves',
    subtitle: 'Smart Money Tracking',
    body: 'Access professional institutional-grade flow. Track massive Dark Pool prints and Unusual Options Sweeps before they impact the retail market, giving you a clear direction on smart money positioning.',
  },
  {
    emoji: '⚡',
    title: 'Hours of Analysis, Done in Seconds',
    subtitle: 'AI Synthesis',
    body: 'No more manual chart drawing. Our terminal synthesizes RSI, MACD, Volume Profile, and expected ranges into a single, clean Confluence Score to help you make trading decisions instantly.',
  },
  {
    emoji: '🔔',
    title: 'Set-and-Forget',
    subtitle: 'Multi-Condition Logic Alerts',
    body: 'Create complex custom logic alerts (e.g., alert when price crosses below SMA 200 AND RSI is oversold) and get notified instantly. Never miss an entry or exit point while away from the screen.',
  },
];

const TABLE_ROWS: { feature: string; monthly: string; yearly: string; highlight: boolean }[] = [
  { feature: 'Billed As',              monthly: '$29.00 Billed Monthly',         yearly: '$229.00 Billed Annually',        highlight: false },
  { feature: 'Effective Monthly Cost', monthly: '$29.00 / mo',                   yearly: '~$19.08 / mo',                   highlight: true  },
  { feature: 'Total Cost (12 Months)', monthly: '$348.00 / year',                yearly: '$229.00 / year',                 highlight: true  },
  { feature: 'Annual Savings',         monthly: '—',                             yearly: 'Save $119.00 Instantly (35%)',   highlight: true  },
  { feature: 'Price Protection',       monthly: 'Subject to future price hikes', yearly: 'Locked-in at $229 forever',      highlight: true  },
  { feature: 'Support Priority',       monthly: 'Standard',                      yearly: 'Priority VIP',                   highlight: true  },
];

const UNLOCKED_CAPABILITIES = [
  { icon: BrainCircuit, label: 'AI Analyst',            desc: 'Real-time symbol analysis powered by Claude' },
  { icon: Fish,         label: 'Whale Tracking',        desc: 'Dark pool prints & unusual options flow'     },
  { icon: BellRing,     label: 'Unlimited Alerting',    desc: 'Multi-condition smart alerts via email'      },
  { icon: BarChart2,    label: 'Behavioral Dashboard',  desc: 'Psychological trade pattern analysis'        },
];

export function BillingView() {
  const { tier, refreshTier } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const handle = async () => {
        // Stripe's webhook has already written the tier server-side.
        // Re-fetch the profile row so the UI reflects the new tier.
        await refreshTier();
        setShowSuccessOverlay(true);
        setSearchParams({}, { replace: true });
      };
      handle();
    }
  }, [searchParams, setSearchParams, refreshTier]);

  return (
    <div className="h-full overflow-y-auto relative">

      {/* ── Success overlay ──────────────────────────────────────────────────── */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 backdrop-blur-md bg-black/75">
          <div
            className="relative bg-[#0A0A0B] border border-gold/30 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col"
            style={{ boxShadow: '0 0 80px rgb(var(--glow-accent) / 0.20), 0 24px 80px rgba(0,0,0,0.8)' }}
          >
            {/* Top gold accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

            {/* Radial glow behind crown */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 50% 0%, rgb(var(--glow-accent) / 0.18), transparent 70%)' }}
            />

            <div className="px-8 pt-10 pb-8 flex flex-col items-center gap-6 relative">

              {/* Crown icon with pulse rings */}
              <div className="relative flex items-center justify-center">
                <span className="absolute w-20 h-20 rounded-full bg-gold/10 animate-ping" style={{ animationDuration: '2s' }} />
                <span className="absolute w-16 h-16 rounded-full bg-gold/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                <div
                  className="relative w-16 h-16 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center"
                  style={{ boxShadow: '0 0 32px rgb(var(--glow-accent) / 0.40)' }}
                >
                  <Crown size={28} className="text-gold" />
                </div>
              </div>

              {/* Heading */}
              <div className="text-center flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2">
                  <Sparkles size={14} className="text-gold" />
                  <h2 className="text-2xl font-bold text-white">Welcome to Vantix PRO!</h2>
                  <Sparkles size={14} className="text-gold" />
                </div>
                <p className="text-sm text-muted leading-relaxed max-w-sm">
                  Your transaction was completed successfully. Your professional trading terminal is now fully unlocked.
                </p>
              </div>

              {/* Unlocked capabilities grid */}
              <div className="w-full grid grid-cols-2 gap-3">
                {UNLOCKED_CAPABILITIES.map(({ icon: Icon, label, desc }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 p-3.5 rounded-xl border border-gold/15 bg-gold/[0.05]"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-gold/15 flex items-center justify-center shrink-0">
                        <Icon size={12} className="text-gold" />
                      </div>
                      <span className="text-xs font-bold text-white">{label}</span>
                    </div>
                    <p className="text-[10px] text-muted/70 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => setShowSuccessOverlay(false)}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all"
                style={{
                  background: 'rgb(var(--color-gold))',
                  boxShadow: '0 0 28px rgb(var(--glow-accent) / 0.40)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Zap size={14} />
                  Enter Terminal
                </span>
              </button>

            </div>

            {/* Bottom gold accent */}
            <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          </div>
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto flex flex-col gap-8 py-10 px-4">

        {/* Header */}
        <div className="text-center flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 mx-auto px-3 py-1 rounded-full border border-gold/30 bg-gold/5 text-[11px] text-gold font-semibold tracking-wide">
            <Crown size={11} />
            Vantix PRO
          </div>
          <h1 className="text-3xl font-bold">Unlock Your Trading Edge</h1>
          <p className="text-muted text-sm max-w-md mx-auto leading-relaxed">
            Join professional traders who use Vantix PRO to monitor smart money, analyze their psychology, and execute with precision.
          </p>
        </div>

        {/* ── Value proposition grid ───────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div className="text-center flex flex-col gap-1">
            <h2 className="text-xl font-bold">The Vantix PRO Edge</h2>
            <p className="text-muted text-sm">Why Traders Choose Us</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {VALUE_PROPS.map(({ emoji, title, subtitle, body }) => (
              <div key={title} className="glass-panel p-5 flex flex-col gap-3 hover:border-border/80 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none shrink-0">{emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white leading-snug">{title}</p>
                    <p className="text-[10px] text-gold font-semibold uppercase tracking-widest mt-0.5">{subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-muted leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Billing period toggle ────────────────────────────────────────── */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#121214] border border-border/80">
            {(['monthly', 'yearly'] as const).map(period => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  billingPeriod === period
                    ? 'bg-[#1a1a1e] border border-gold/40 text-gold'
                    : 'text-muted hover:text-white'
                }`}
              >
                {period === 'monthly' ? 'Monthly Billing' : 'Yearly Billing'}
                {period === 'yearly' && (
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: billingPeriod === 'yearly'
                        ? 'rgb(var(--color-gold) / 0.20)'
                        : 'rgba(255,255,255,0.06)',
                      color: billingPeriod === 'yearly' ? 'rgb(var(--color-gold))' : 'rgb(var(--color-muted))',
                      boxShadow: billingPeriod === 'yearly' ? '0 0 8px rgb(var(--glow-accent) / 0.30)' : 'none',
                    }}
                  >
                    Save ~35%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Free plan */}
          <div className={`glass-panel p-6 flex flex-col gap-5 ${tier === 'free' ? 'border-muted/40' : 'opacity-60'}`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">Free</span>
                {tier === 'free' && (
                  <span className="text-[10px] font-bold text-muted border border-muted/30 rounded-full px-2 py-0.5">Current Plan</span>
                )}
              </div>
              <p className="text-3xl font-bold font-mono text-white">$0</p>
              <p className="text-xs text-muted mt-1">Forever free, limited access</p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-xs text-muted">
                  <Check size={12} className="text-muted/50 shrink-0" />
                  {f}
                </li>
              ))}
              <li className="flex items-center gap-2.5 text-xs text-muted/40">
                <Lock size={12} className="shrink-0" />
                AI Behavioral Analytics — locked
              </li>
              <li className="flex items-center gap-2.5 text-xs text-muted/40">
                <Lock size={12} className="shrink-0" />
                Full trade history — locked
              </li>
            </ul>

            {tier === 'pro' && (
              <a
                href="https://billing.stripe.com/p/login/test_00000000"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto w-full py-2.5 rounded-md border border-border text-muted text-sm hover:text-white hover:border-muted transition-colors text-center block"
              >
                Manage Subscription
              </a>
            )}
          </div>

          {/* Pro plan */}
          <div
            className="glass-panel p-6 flex flex-col gap-5 relative overflow-hidden"
            style={{ borderColor: 'rgb(var(--color-gold) / 0.4)', boxShadow: '0 0 40px rgb(var(--glow-accent) / 0.10)' }}
          >
            {/* Glow accent strip */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Crown size={13} className="text-gold" />
                  <span className="text-xs font-bold uppercase tracking-widest text-gold">Pro</span>
                </div>
                {tier === 'pro' && (
                  <span className="text-[10px] font-bold text-gold border border-gold/30 rounded-full px-2 py-0.5 bg-gold/10">Active</span>
                )}
              </div>
              {billingPeriod === 'monthly' ? (
                <>
                  <p className="text-3xl font-bold font-mono text-white">$29<span className="text-base text-muted font-normal">/mo</span></p>
                  <p className="text-xs text-muted mt-1">Everything in Free, plus:</p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold font-mono text-white">$229<span className="text-base text-muted font-normal">/yr</span></p>
                  <p className="text-[10px] text-gold font-semibold mt-1">Equivalent to $19.08/mo (billed annually)</p>
                </>
              )}
            </div>

            <ul className="flex flex-col gap-2.5">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-xs text-white/80">
                  <Check size={12} className="text-live shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {tier === 'free' ? (
              <>
                {/* Terms & Privacy consent */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={e => setAgreed(e.target.checked)}
                    className="mt-0.5 accent-gold cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] text-muted/65 leading-relaxed">
                    I agree to the{' '}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold/75 hover:text-gold underline underline-offset-2 transition-colors"
                    >
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold/75 hover:text-gold underline underline-offset-2 transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </span>
                </label>

                <button
                  onClick={() => { window.location.href = billingPeriod === 'monthly' ? STRIPE_MONTHLY_LINK : STRIPE_YEARLY_LINK; }}
                  disabled={!agreed}
                  className="mt-auto w-full py-3 rounded-md text-sm font-bold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={agreed ? {
                    background: 'rgb(var(--color-gold))',
                    boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.35)',
                  } : {
                    background: 'rgb(var(--color-gold))',
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap size={14} />
                    Upgrade to Vantix PRO
                  </span>
                </button>
              </>
            ) : (
              <div
                className="mt-auto w-full py-3 rounded-md text-sm font-bold text-center text-black"
                style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.25)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Crown size={14} />
                  Active — You're on PRO
                </span>
              </div>
            )}
          </div>

        </div>

        {/* ── Monthly vs. Yearly comparison ────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="text-center flex flex-col gap-1">
            <h2 className="text-xl font-bold">Which Plan is Right for You?</h2>
            <p className="text-muted text-sm">Choose the plan that fits your trading style and commitment level.</p>
          </div>

          {/* 2-column cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Monthly */}
            <div className="glass-panel p-5 flex flex-col gap-4">
              <div>
                <p className="text-base font-bold text-white">Monthly Trader</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  $29<span className="text-sm text-muted font-normal">/mo</span>
                </p>
                <p className="text-xs text-muted mt-1.5">
                  <span className="font-semibold text-white/60">Best For:</span> Testing the waters &amp; short-term flexibility.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check size={12} className="text-live shrink-0 mt-0.5" />
                  No long-term commitment (cancel anytime)
                </li>
                <li className="flex items-start gap-2 text-xs text-white/80">
                  <Check size={12} className="text-live shrink-0 mt-0.5" />
                  Full access to all AI &amp; Whale features
                </li>
              </ul>
              <div className="flex flex-col gap-2 pt-3 border-t border-border">
                <span className="text-[10px] text-muted uppercase tracking-widest">Downsides</span>
                <li className="flex items-start gap-2 text-xs text-muted/70 list-none">
                  <X size={12} className="text-alert shrink-0 mt-0.5" />
                  Costs $348/year total (pays $119 more annually)
                </li>
                <li className="flex items-start gap-2 text-xs text-muted/70 list-none">
                  <X size={12} className="text-alert shrink-0 mt-0.5" />
                  Subject to future price increases
                </li>
              </div>
            </div>

            {/* Annual — highlighted */}
            <div
              className="glass-panel p-5 flex flex-col gap-4 relative overflow-hidden"
              style={{ borderColor: 'rgb(var(--color-gold) / 0.45)', boxShadow: '0 0 32px rgb(var(--glow-accent) / 0.10)' }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent opacity-70" />
              <div className="absolute top-3.5 right-4">
                <span
                  className="text-[9px] font-black text-black px-2.5 py-0.5 rounded-full uppercase tracking-widest"
                  style={{ background: 'rgb(var(--color-gold))' }}
                >
                  Recommended
                </span>
              </div>
              <div className="pr-24">
                <p className="text-base font-bold text-gold">PRO Annual Builder</p>
                <p className="text-2xl font-bold font-mono text-white mt-1">
                  $229<span className="text-sm text-muted font-normal">/yr</span>
                </p>
                <p className="text-xs text-muted mt-1.5">
                  <span className="font-semibold text-white/60">Best For:</span> Serious traders building consistent long-term discipline.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  'Save $119 every single year (35% discount)',
                  'Lock in the lowest rate forever (protected from price hikes)',
                  'Priority VIP Support',
                  'Dedicated AI Trading Coach profile setup',
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-white/80">
                    <Check size={12} className="text-gold shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Comparison table */}
          <div className="glass-panel overflow-hidden">
            {/* Header row */}
            <div className="grid grid-cols-3 border-b border-border bg-white/[0.02]">
              <div className="px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Feature</span>
              </div>
              <div className="px-4 py-3 border-l border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Monthly</span>
              </div>
              <div className="px-4 py-3 border-l border-border/60" style={{ background: 'rgb(var(--color-gold) / 0.05)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Yearly Plan (Best Value)</span>
              </div>
            </div>

            {TABLE_ROWS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 border-b border-border/30 ${i % 2 !== 0 ? 'bg-white/[0.015]' : ''}`}
              >
                <div className="px-4 py-3">
                  <span className="text-xs text-muted">{row.feature}</span>
                </div>
                <div className="px-4 py-3 border-l border-border/60">
                  <span className="text-xs text-white/60 font-mono">{row.monthly}</span>
                </div>
                <div className="px-4 py-3 border-l border-border/60" style={{ background: 'rgb(var(--color-gold) / 0.04)' }}>
                  <span className={`text-xs font-mono ${row.highlight ? 'font-semibold text-gold' : 'text-white/60'}`}>
                    {row.yearly}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-muted/40 text-center pb-4 leading-relaxed">
          All plans include a 7-day money-back guarantee. Stripe processes all payments securely.
        </p>
      </div>
    </div>
  );
}
