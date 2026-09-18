import { useState, useEffect } from 'react';
import {
  Zap, Activity, Fish, BrainCircuit, LineChart, Globe2,
  X, ChevronLeft, ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'vantix_welcome_seen';

interface Step {
  icon: React.ElementType;
  accent: 'gold' | 'live';
  eyebrow: string;
  title: string;
  subtitle?: string;
  desc: string;
}

const STEPS: Step[] = [
  {
    icon: Zap,
    accent: 'gold',
    eyebrow: 'VANTIX AI — EARLY ACCESS',
    title: 'Welcome to Vantix AI',
    subtitle: 'Your Institutional Trading Ecosystem',
    desc: 'Welcome to the future of trading intelligence. Explore institutional-grade market tools, AI pattern recognition, and real-time capital flow analysis.',
  },
  {
    icon: Activity,
    accent: 'live',
    eyebrow: 'FEATURE 01',
    title: 'Terminal Workspace',
    desc: 'Your primary command center. Combines full TradingView advanced charting, AI pattern recognition, live watchlists, and an interactive position sizer into a unified screen.',
  },
  {
    icon: Fish,
    accent: 'live',
    eyebrow: 'FEATURE 02',
    title: 'Whale Tracker',
    desc: "Never trade in the dark. Track institutional money flows, dark pool transactions, and block trades from hedge funds in real time before the crowd notices.",
  },
  {
    icon: BrainCircuit,
    accent: 'gold',
    eyebrow: 'FEATURE 03',
    title: 'Trade Journal & AI Coach',
    desc: "Log your trades and analyze psychological states (FOMO, Revenge, Calm). Powered by Vantix's world-leading proprietary Behavioral AI Engine, your AI Coach refines your execution strategy and maximizes your win rate.",
  },
  {
    icon: LineChart,
    accent: 'live',
    eyebrow: 'FEATURE 04',
    title: 'Investor Tools & Macro',
    desc: "Gain full macro clarity with the S&P 500 Heatmap, Fear & Greed Index, Put/Call ratios, Fed Net Liquidity charts, and real-time economic calendars.",
  },
  {
    icon: Globe2,
    accent: 'gold',
    eyebrow: 'FEATURE 05',
    title: 'News, Alerts & Academy',
    desc: "Stay ahead with real-time catalyst news, custom price/volume alerts, and comprehensive educational modules to sharpen your trading edge.",
  },
];

export function WelcomeModal() {
  const [visible,  setVisible]  = useState(false);
  const [step,     setStep]     = useState(0);
  const [dir,      setDir]      = useState<'fwd' | 'back'>('fwd');
  const [animKey,  setAnimKey]  = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch { /* localStorage unavailable in some sandboxed contexts */ }
  }, []);

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
    setVisible(false);
  }

  function advance(targetStep: number, direction: 'fwd' | 'back') {
    setDir(direction);
    setAnimKey(k => k + 1);
    setStep(targetStep);
  }

  function goNext() {
    if (step === STEPS.length - 1) { dismiss(); return; }
    advance(step + 1, 'fwd');
  }

  function goBack() {
    if (step === 0) return;
    advance(step - 1, 'back');
  }

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isGold  = current.accent === 'gold';
  const Icon    = current.icon;

  // Per-step accent values
  const accentHex    = isGold ? '#FFD700' : '#00FF88';
  const accentRgb    = isGold ? '255,215,0' : '0,255,136';
  const iconBg       = `radial-gradient(ellipse at center, rgba(${accentRgb},0.12) 0%, rgba(7,7,9,0.95) 70%)`;
  const iconBorder   = `rgba(${accentRgb},0.50)`;
  const iconGlow     = `0 0 32px rgba(${accentRgb},0.28), 0 0 70px rgba(${accentRgb},0.08)`;

  const progressPct  = ((step + 1) / STEPS.length) * 100;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: 'rgba(7,7,9,0.86)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome tour"
    >
      <div
        className="w-full max-w-md rounded-2xl relative"
        style={{
          background: 'linear-gradient(160deg, rgba(20,20,22,0.99) 0%, rgba(10,10,11,1) 100%)',
          border: '1px solid rgba(255,215,0,0.22)',
          boxShadow: '0 0 0 1px rgba(255,215,0,0.05), 0 0 90px rgba(255,215,0,0.10), 0 40px 100px rgba(0,0,0,0.72)',
        }}
      >
        {/* Progress bar */}
        <div className="h-[3px] w-full bg-white/[0.06] rounded-t-2xl overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, #FFD700 0%, #00FF88 100%)',
            }}
          />
        </div>

        {/* Close */}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close welcome tour"
          className="absolute top-4 right-4 z-10 text-muted/35 hover:text-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded"
        >
          <X size={15} />
        </button>

        {/* Animated step content */}
        <div
          key={animKey}
          className={dir === 'fwd' ? 'welcome-slide-right' : 'welcome-slide-left'}
        >
          <div className="px-8 pt-7 pb-4 flex flex-col items-center text-center">

            {/* Eyebrow */}
            <p
              className="text-[10px] font-mono tracking-[0.18em] uppercase mb-5"
              style={{ color: `rgba(${accentRgb},0.60)` }}
            >
              {current.eyebrow}
            </p>

            {/* Icon */}
            <div
              className="w-[76px] h-[76px] rounded-2xl flex items-center justify-center mb-6 shrink-0"
              style={{ background: iconBg, border: `1.5px solid ${iconBorder}`, boxShadow: iconGlow }}
            >
              <Icon size={36} style={{ color: accentHex }} />
            </div>

            {/* Title */}
            <h2 className="text-[1.25rem] font-bold text-white leading-tight mb-1.5">
              {current.title}
            </h2>

            {/* Subtitle (step 1 only) */}
            {current.subtitle && (
              <p
                className="text-[11px] font-semibold tracking-wide mb-3"
                style={{ color: 'rgba(255,215,0,0.72)' }}
              >
                {current.subtitle}
              </p>
            )}

            {/* Description */}
            <p className="text-[13px] text-muted/72 leading-relaxed max-w-sm">
              {current.desc}
            </p>

          </div>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px bg-border/50 mt-1" />

        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.map((s, i) => {
            const dotAccent = s.accent === 'gold' ? '#FFD700' : '#00FF88';
            return (
              <button
                key={i}
                type="button"
                onClick={() => i !== step && advance(i, i > step ? 'fwd' : 'back')}
                aria-label={`Go to step ${i + 1}`}
                className="transition-all duration-300 rounded-full"
                style={{
                  width:      i === step ? '18px' : '6px',
                  height:     '6px',
                  background: i === step
                    ? dotAccent
                    : i < step
                    ? 'rgba(255,215,0,0.28)'
                    : 'rgba(255,255,255,0.14)',
                }}
              />
            );
          })}
        </div>

        {/* Navigation row */}
        <div className="flex items-center justify-between px-8 pb-7 gap-3">
          {/* Skip */}
          <button
            type="button"
            onClick={dismiss}
            className="text-[11px] text-muted/40 hover:text-muted/70 transition-colors whitespace-nowrap focus-visible:outline-none"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {/* Back */}
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg border border-border text-[12px] font-semibold text-muted hover:border-white/20 hover:text-white transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
              >
                <ChevronLeft size={13} />
                Back
              </button>
            )}

            {/* Next / Finish */}
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all focus-visible:outline-none focus-visible:ring-2"
              style={
                isLast
                  ? {
                      background: 'linear-gradient(90deg, #FFD700 0%, #e8c500 100%)',
                      color: '#070709',
                      boxShadow: '0 0 24px rgba(255,215,0,0.32)',
                      padding: '0.55rem 1.1rem',
                    }
                  : isGold
                  ? {
                      background: 'rgba(255,215,0,0.09)',
                      border: '1px solid rgba(255,215,0,0.35)',
                      color: '#FFD700',
                    }
                  : {
                      background: 'rgba(0,255,136,0.07)',
                      border: '1px solid rgba(0,255,136,0.30)',
                      color: '#00FF88',
                    }
              }
            >
              {isLast
                ? 'Start Exploring Vantix'
                : <><span>Next</span><ChevronRight size={13} /></>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
