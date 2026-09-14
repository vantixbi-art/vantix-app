import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BellRing, Plus, Trash2, Zap, History, CheckCircle2, XCircle, Mail, Lock, Crown, ShieldAlert, MessageSquare, Send, ChevronDown } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';

const METRIC_TIPS: Partial<Record<string, string>> = {
  'RSI(14)': 'Relative Strength Index (14-period): oscillates 0–100. Above 70 = overbought, below 30 = oversold.',
  'VWAP': 'Volume-Weighted Average Price: the average price weighted by volume since the session open. Used by institutions as a benchmark.',
  'MACD': 'Moving Average Convergence Divergence: difference between 12- and 26-period EMAs. Crossovers signal momentum shifts.',
  'ATR': 'Average True Range: measures market volatility over a period. Higher ATR = wider price swings.',
  'Stochastic RSI': 'RSI of the RSI: a faster oscillator combining Stochastic and RSI for overbought/oversold signals.',
};

const METRIC_ARTICLE_MAP: Partial<Record<string, string>> = {
  'Price': 'ind-price-volume',
  'Volume': 'ind-price-volume',
  'RSI(14)': 'ind-rsi-stoch',
  'Stochastic RSI': 'ind-rsi-stoch',
  'SMA(50)': 'ind-moving-averages',
  'SMA(200)': 'ind-moving-averages',
  'EMA(20)': 'ind-moving-averages',
  'MACD': 'ind-macd',
  'VWAP': 'ind-vwap',
  'Bollinger Bands (Upper)': 'ind-bollinger',
  'Bollinger Bands (Lower)': 'ind-bollinger',
  'ATR': 'ind-atr',
  'Support Level': 'ind-support-resistance',
  'Resistance Level': 'ind-support-resistance',
};

// ── Types & constants ─────────────────────────────────────────────────────────

type Metric =
  | 'Price' | 'RSI(14)' | 'SMA(50)' | 'SMA(200)' | 'EMA(20)' | 'MACD' | 'Volume' | 'VWAP'
  | 'Bollinger Bands (Upper)' | 'Bollinger Bands (Lower)'
  | 'Stochastic RSI' | 'ATR'
  | 'Support Level' | 'Resistance Level';

type Operator = 'Crosses Above' | 'Crosses Below' | '>' | '<' | '>=' | '<=' | '=';

const METRICS: Metric[] = [
  'Price', 'RSI(14)', 'SMA(50)', 'SMA(200)', 'EMA(20)', 'MACD', 'Volume', 'VWAP',
  'Bollinger Bands (Upper)', 'Bollinger Bands (Lower)',
  'Stochastic RSI', 'ATR',
  'Support Level', 'Resistance Level',
];
const OPERATORS: Operator[] = ['Crosses Above', 'Crosses Below', '>', '<', '>=', '<=', '='];

interface Condition {
  id: number;
  metric: Metric;
  operator: Operator;
  value: string;
}

interface Alert {
  id: string;
  ticker: string;
  conditions: { metric: string; operator: string; value: string }[];
  enabled: boolean;
  createdAt: string;
  status: 'active' | 'paused';
}

interface TriggerEvent {
  id: number;
  ticker: string;
  summary: string;
  timestamp: string;
  ago: string;
  fired: boolean;
}

// ── Mock trigger history (static) ────────────────────────────────────────────

const TRIGGER_HISTORY: TriggerEvent[] = [
  { id: 1, ticker: 'TSLA', summary: 'MACD Crossed Above Signal', timestamp: '09:41 EST', ago: '2 mins ago', fired: true },
  { id: 2, ticker: 'SPY', summary: 'RSI(14) dropped below 35', timestamp: '09:38 EST', ago: '5 mins ago', fired: true },
  { id: 3, ticker: 'NVDA', summary: 'Price Crossed Above SMA(200)', timestamp: '09:31 EST', ago: '12 mins ago', fired: true },
  { id: 4, ticker: 'BTC', summary: 'Price < SMA(200) — Condition Met', timestamp: '09:15 EST', ago: '28 mins ago', fired: true },
  { id: 5, ticker: 'AMD', summary: 'Volume > 2× Average — Spike Alert', timestamp: '08:52 EST', ago: '51 mins ago', fired: true },
  { id: 6, ticker: 'META', summary: 'RSI(14) Crossed Above 70', timestamp: '08:33 EST', ago: '1 hr 10m ago', fired: true },
  { id: 7, ticker: 'QQQ', summary: 'EMA(20) Crossed Below SMA(50)', timestamp: 'Yesterday', ago: 'Yesterday', fired: false },
  { id: 8, ticker: 'AAPL', summary: 'Price Crossed Below VWAP', timestamp: 'Yesterday', ago: 'Yesterday', fired: false },
];

// ── Technical Indicators ──────────────────────────────────────────────────────

function calculateSMA(period: number, closes: number[]): number {
  if (closes.length === 0) return 0;
  const slice = closes.slice(-Math.min(period, closes.length));
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateEMA(period: number, closes: number[]): number {
  if (closes.length === 0) return 0;
  if (closes.length < period) return calculateSMA(closes.length, closes);
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const recent = closes.slice(-(period + 1));
  const changes = recent.slice(1).map((c, i) => c - recent[i]);
  const avgGain = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
  const avgLoss = changes.filter(c => c < 0).reduce((a, b) => a + Math.abs(b), 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateVWAP(
  closes: number[], highs: number[], lows: number[], volumes: number[],
): number {
  const len = Math.min(closes.length, highs.length, lows.length, volumes.length);
  if (len === 0) return 0;
  let totalPV = 0, totalV = 0;
  for (let i = 0; i < len; i++) {
    const typical = (highs[i] + lows[i] + closes[i]) / 3;
    totalPV += typical * volumes[i];
    totalV += volumes[i];
  }
  return totalV === 0 ? 0 : totalPV / totalV;
}

function calculateStochRSI(closes: number[], rsiPeriod = 14, stochPeriod = 14): number {
  if (closes.length < rsiPeriod + stochPeriod) return 50;
  const rsiSeries: number[] = [];
  for (let i = rsiPeriod; i <= closes.length; i++) {
    rsiSeries.push(calculateRSI(closes.slice(0, i), rsiPeriod));
  }
  if (rsiSeries.length < stochPeriod) return 50;
  const window = rsiSeries.slice(-stochPeriod);
  const minRSI = Math.min(...window);
  const maxRSI = Math.max(...window);
  const lastRSI = rsiSeries.at(-1)!;
  return maxRSI === minRSI ? 50 : ((lastRSI - minRSI) / (maxRSI - minRSI)) * 100;
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const hl = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i] - closes[i - 1]);
    trs.push(Math.max(hl, hpc, lpc));
  }
  const slice = trs.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

interface TickerIndicators {
  price: number;
  volume: number;
  rsi14: number;
  sma50: number;
  sma200: number;
  ema20: number;
  macd: number;
  vwap: number;
  bollingerUpper: number;
  bollingerLower: number;
  stochRSI: number;
  atr: number;
  support: number;
  resistance: number;
}

function computeIndicators(
  closes: number[],
  highs: number[] = [],
  lows: number[] = [],
  volumes: number[] = [],
): TickerIndicators {
  const ema12 = calculateEMA(12, closes);
  const ema26 = calculateEMA(26, closes);
  const sma20 = calculateSMA(20, closes);
  const last20 = closes.slice(-20);
  const std20 = calculateStdDev(last20);
  const lookback = Math.min(20, closes.length);
  const h = highs.length ? highs : closes;
  const l = lows.length ? lows : closes;
  const v = volumes.length ? volumes : closes.map(() => 1);
  return {
    price: closes.at(-1) ?? 0,
    volume: volumes.at(-1) ?? 0,
    rsi14: calculateRSI(closes),
    sma50: calculateSMA(50, closes),
    sma200: calculateSMA(200, closes),
    ema20: calculateEMA(20, closes),
    macd: ema12 - ema26,
    vwap: calculateVWAP(closes, h, l, v),
    bollingerUpper: sma20 + 2 * std20,
    bollingerLower: sma20 - 2 * std20,
    stochRSI: calculateStochRSI(closes),
    atr: calculateATR(h, l, closes),
    support: Math.min(...closes.slice(-lookback)),
    resistance: Math.max(...closes.slice(-lookback)),
  };
}

function resolveMetric(metric: string, inds: TickerIndicators): number | null {
  switch (metric) {
    case 'Price': return inds.price;
    case 'RSI(14)': return inds.rsi14;
    case 'SMA(50)': return inds.sma50;
    case 'SMA(200)': return inds.sma200;
    case 'EMA(20)': return inds.ema20;
    case 'MACD': return inds.macd;
    case 'Volume': return inds.volume;
    case 'VWAP': return inds.vwap;
    case 'Bollinger Bands (Upper)': return inds.bollingerUpper;
    case 'Bollinger Bands (Lower)': return inds.bollingerLower;
    case 'Stochastic RSI': return inds.stochRSI;
    case 'ATR': return inds.atr;
    case 'Support Level': return inds.support;
    case 'Resistance Level': return inds.resistance;
    default: return null;
  }
}

function evaluateCondition(
  cond: { metric: string; operator: string; value: string },
  cur: TickerIndicators,
  prev: TickerIndicators,
): boolean {
  const curVal = resolveMetric(cond.metric, cur);
  if (curVal === null) return false; // unsupported metric — skip condition

  const numThreshold = parseFloat(cond.value);
  const threshold = !isNaN(numThreshold)
    ? numThreshold
    : resolveMetric(cond.value, cur); // value is another indicator name, e.g. "SMA(200)"
  if (threshold === null) return false;

  switch (cond.operator) {
    case '>': return curVal > threshold;
    case '<': return curVal < threshold;
    case '>=': return curVal >= threshold;
    case '<=': return curVal <= threshold;
    case '=': return Math.abs(curVal - threshold) / (Math.abs(threshold) || 1) < 0.002;
    case 'Crosses Above': {
      const prevVal = resolveMetric(cond.metric, prev);
      const prevThr = !isNaN(numThreshold) ? numThreshold : resolveMetric(cond.value, prev);
      return prevVal !== null && prevThr !== null && prevVal <= prevThr && curVal > threshold;
    }
    case 'Crosses Below': {
      const prevVal = resolveMetric(cond.metric, prev);
      const prevThr = !isNaN(numThreshold) ? numThreshold : resolveMetric(cond.value, prev);
      return prevVal !== null && prevThr !== null && prevVal >= prevThr && curVal < threshold;
    }
    default: return false;
  }
}

function playAlertBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = (window.AudioContext ?? (window as any).webkitAudioContext) as typeof AudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.28);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch { /* audio unavailable */ }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gold">{icon}</span>
      <div>
        <h2 className="text-base font-bold leading-none">{title}</h2>
        {subtitle && <p className="text-[10px] text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const inputCls ='bg-input border border-border rounded-md px-3 py-2 text-sm text-white placeholder:text-muted/50 font-mono focus:outline-none focus:border-gold transition-colors';

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors ${enabled ? 'bg-live/30 border-live/40' : 'bg-white/10 border-border'
        }`}
      aria-label="Toggle alert"
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full transition-transform shadow ${enabled ? 'translate-x-4 bg-live' : 'translate-x-1 bg-muted'
          }`}
      />
    </button>
  );
}

// ── Condition Dropdown ────────────────────────────────────────────────────────

function ConditionDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false); }
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-input border border-border rounded-md px-3 py-2 text-sm text-white hover:border-gold/50 transition-colors cursor-pointer focus:outline-none"
        style={isOpen ? { borderColor: 'rgb(var(--color-gold) / 0.6)', boxShadow: '0 0 0 1px rgb(var(--color-gold)/0.2)' } : {}}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          size={13}
          className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 top-full left-0 mt-1 w-full rounded-md border border-gold/30 bg-panel/95 backdrop-blur-md shadow-xl overflow-hidden"
          style={{ boxShadow: '0 0 24px rgb(var(--glow-accent)/0.12), 0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <div className="max-h-52 overflow-y-auto scrollbar-gold py-1">
            {options.map(opt => (
              <button
                key={opt}
                type="button"
                title={opt}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-xs truncate transition-colors ${opt === value
                    ? 'text-gold bg-gold/10 font-semibold'
                    : 'text-white/80 hover:bg-white/[0.08] hover:text-white'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Condition row ─────────────────────────────────────────────────────────────

function ConditionRow({
  condition,
  index,
  showAnd,
  onChange,
  onRemove,
}: {
  condition: Condition;
  index: number;
  showAnd: boolean;
  onChange: (id: number, field: keyof Omit<Condition, 'id'>, value: string) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {showAnd && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold px-2 py-0.5 border border-gold/30 rounded-full bg-gold/5">
            AND
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1.1fr_1fr_auto] gap-3 sm:gap-2 items-end">
        {/* Metric */}
        <div className="flex flex-col gap-1">
          <span className={index === 0
            ? 'text-[10px] text-muted uppercase tracking-widest'
            : 'text-[10px] text-muted uppercase tracking-widest block sm:hidden'
          }>Metric</span>
          <ConditionDropdown
            value={condition.metric}
            options={METRICS}
            onChange={v => onChange(condition.id, 'metric', v)}
          />
        </div>

        {/* Operator */}
        <div className="flex flex-col gap-1">
          <span className={index === 0
            ? 'text-[10px] text-muted uppercase tracking-widest'
            : 'text-[10px] text-muted uppercase tracking-widest block sm:hidden'
          }>Operator</span>
          <ConditionDropdown
            value={condition.operator}
            options={OPERATORS}
            onChange={v => onChange(condition.id, 'operator', v)}
          />
        </div>

        {/* Value */}
        <div className="flex flex-col gap-1">
          <span className={index === 0
            ? 'text-[10px] text-muted uppercase tracking-widest'
            : 'text-[10px] text-muted uppercase tracking-widest block sm:hidden'
          }>Value</span>
          <input
            className={inputCls}
            placeholder="e.g. 30"
            value={condition.value}
            onChange={e => onChange(condition.id, 'value', e.target.value)}
          />
        </div>

        {/* Remove */}
        <div>
          <button
            onClick={() => onRemove(condition.id)}
            disabled={index === 0}
            className="p-2 text-muted hover:text-alert transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            aria-label="Remove condition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

interface ToastProps {
  ticker: string;
  email: string;
  onDismiss: () => void;
}

function DeployToast({ ticker, email, onDismiss }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed top-5 right-5 z-[200] flex items-start gap-3 px-4 py-3.5 rounded-xl border border-live/30 bg-panel/95 backdrop-blur-md shadow-2xl min-w-72 max-w-sm"
      style={{ animation: 'page-enter 0.3s ease-out', boxShadow: '0 0 30px rgba(0,255,136,0.12), 0 8px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="w-8 h-8 rounded-full bg-live/15 border border-live/30 flex items-center justify-center shrink-0 mt-0.5">
        <CheckCircle2 size={16} className="text-live" />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          Alert Deployed — <span className="text-live">{ticker}</span>
        </p>
        <p className="text-xs text-muted leading-snug">Active monitoring has started.</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Mail size={10} className="text-gold shrink-0" />
          <span className="text-[10px] text-gold/80 font-mono truncate">{email}</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

// ── Alert Fired Toast ─────────────────────────────────────────────────────────

function AlertFiredToast({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const summary = alert.conditions
    .map(c => `${c.metric} ${c.operator} ${c.value}`)
    .join(' AND ');

  return (
    <div
      className="fixed top-5 right-5 z-[202] flex items-start gap-3 px-4 py-3.5 rounded-xl border border-gold/40 bg-panel/95 backdrop-blur-md shadow-2xl min-w-72 max-w-sm"
      style={{ animation: 'page-enter 0.3s ease-out', boxShadow: '0 0 48px rgb(var(--glow-accent)/0.22), 0 8px 40px rgba(0,0,0,0.65)' }}
    >
      <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
        <BellRing size={16} className="text-gold" />
      </div>
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <p className="text-sm font-bold text-white">
          Alert Triggered — <span className="text-gold">{alert.ticker}</span>
        </p>
        <p className="text-xs text-muted leading-snug line-clamp-2">{summary}</p>
        <p className="text-[10px] text-muted/55 mt-1">
          Alert paused after firing. Re-enable to monitor again.
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-muted hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        <XCircle size={14} />
      </button>
    </div>
  );
}

// ── Alert Builder ─────────────────────────────────────────────────────────────

let conditionIdSeed = 1;

function AlertBuilder({
  onDeploy,
  userEmail,
  tier,
  activeCount,
}: {
  onDeploy: (ticker: string, conditions: Alert['conditions']) => void;
  userEmail: string;
  tier: 'free' | 'pro';
  activeCount: number;
}) {
  const [ticker, setTicker] = useState('');
  const [conditions, setConditions] = useState<Condition[]>([
    { id: conditionIdSeed++, metric: 'RSI(14)', operator: 'Crosses Below', value: '30' },
  ]);
  const [deployed, setDeployed] = useState(false);

  const isLimitReached = tier === 'free' && activeCount >= 1;

  function updateCondition(id: number, field: keyof Omit<Condition, 'id'>, value: string) {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  function addCondition() {
    setConditions(prev => [...prev, { id: conditionIdSeed++, metric: 'Price', operator: '>', value: '' }]);
  }

  function removeCondition(id: number) {
    setConditions(prev => prev.filter(c => c.id !== id));
  }

  function deploy() {
    if (isLimitReached) return;
    const sym = ticker.trim().toUpperCase();
    if (!sym || conditions.some(c => !c.value.trim())) return;
    onDeploy(
      sym,
      conditions.map(c => ({ metric: c.metric, operator: c.operator, value: c.value })),
    );
    setTicker('');
    setConditions([{ id: conditionIdSeed++, metric: 'RSI(14)', operator: 'Crosses Below', value: '30' }]);
    setDeployed(true);
    setTimeout(() => setDeployed(false), 2500);
  }

  // Live preview string
  const preview = ticker
    ? `${ticker.toUpperCase()}: ${conditions.map(c => `${c.metric} ${c.operator} ${c.value || '…'}`).join(' AND ')}`
    : null;

  return (
    <div className="glass-panel p-5 flex flex-col gap-4 relative z-10"
      style={{ boxShadow: '0 0 20px rgba(0,255,136,0.05)' }}
    >
      <SectionHeader
        icon={<Zap size={16} />}
        title="Smart Alert Builder"
        subtitle="Construct multi-condition logic alerts"
      />

      {/* Free-tier limit warning */}
      {isLimitReached && (
        <div className="flex items-start gap-3 px-3.5 py-3 rounded-lg border border-alert/30 bg-alert/[0.06]">
          <ShieldAlert size={14} className="text-alert shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white">Free plan limit reached (1 active alert)</p>
            <p className="text-[11px] text-muted mt-0.5 leading-snug">
              Upgrade to PRO for unlimited smart alerts.{' '}
              <Link to="/billing" className="text-gold hover:underline font-semibold">Upgrade now →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Ticker */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] text-muted uppercase tracking-widest">Ticker Symbol</span>
        <input
          className={`${inputCls} w-48 uppercase`}
          placeholder="e.g. TSLA"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
        />
      </div>

      {/* Notification Channels */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] text-muted uppercase tracking-widest">Notification Channels</span>
        {/* Email — always enabled */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-gold/20 bg-gold/[0.04]">
          <Mail size={13} className="text-gold shrink-0" />
          <p className="text-xs text-muted leading-snug flex-1">
            Email:{' '}
            <span className="text-gold font-semibold font-mono">{userEmail}</span>
          </p>
          <span className="text-[9px] font-bold text-live border border-live/30 rounded-full px-1.5 py-0.5 bg-live/10">
            Active
          </span>
        </div>
        {/* Discord — PRO only */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-border bg-white/[0.02] opacity-60">
          <MessageSquare size={13} className="text-muted shrink-0" />
          <p className="text-xs text-muted flex-1">Discord Webhook</p>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-gold/30 bg-gold/10">
            <Crown size={9} className="text-gold" />
            <span className="text-[9px] font-bold text-gold">PRO</span>
          </div>
        </div>
        {/* Telegram — PRO only */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border border-border bg-white/[0.02] opacity-60">
          <Send size={13} className="text-muted shrink-0" />
          <p className="text-xs text-muted flex-1">Telegram Channel</p>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-gold/30 bg-gold/10">
            <Crown size={9} className="text-gold" />
            <span className="text-[9px] font-bold text-gold">PRO</span>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div className="flex flex-col gap-3">
        {conditions.map((c, i) => (
          <ConditionRow
            key={c.id}
            condition={c}
            index={i}
            showAnd={i > 0}
            onChange={updateCondition}
            onRemove={removeCondition}
          />
        ))}
      </div>

      {/* Add AND button */}
      <button
        onClick={addCondition}
        className="self-start flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-border bg-white/5 text-muted hover:text-white hover:border-muted transition-colors"
      >
        <Plus size={12} />
        Add "AND" Condition
      </button>

      {/* Preview */}
      {preview && (
        <div className="rounded-md border border-gold/20 bg-gold/5 px-3 py-2">
          <span className="text-[10px] text-muted uppercase tracking-widest block mb-1">Preview</span>
          <span className="text-xs font-mono text-gold/90 leading-relaxed">{preview}</span>
        </div>
      )}

      {/* Deploy */}
      {isLimitReached ? (
        <Link
          to="/billing"
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold text-black transition-all"
          style={{
            background: 'rgb(var(--color-gold))',
            boxShadow: '0 0 20px rgb(var(--glow-accent) / 0.30)',
          }}
        >
          <Crown size={14} />
          Unlock Unlimited Alerts
        </Link>
      ) : (
        <>
          <button
            onClick={deploy}
            disabled={deployed}
            className="self-start flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold bg-live text-black hover:bg-live/90 transition-colors disabled:opacity-40"
          >
            {deployed
              ? <><CheckCircle2 size={14} /> Deployed!</>
              : <><Bell size={14} /> Deploy Alert</>}
          </button>
          <p className="text-[10px] text-muted/35 leading-relaxed max-w-sm">
            Alert delivery depends on network stability and third-party email providers. Not intended for high-frequency execution.
          </p>
        </>
      )}
    </div>
  );
}

// ── Active Alerts ─────────────────────────────────────────────────────────────

function ActiveAlerts({ alerts, onToggle, onDelete, tier, activeCount }: {
  alerts: Alert[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  tier: 'free' | 'pro';
  activeCount: number;
}) {
  return (
    <div className="glass-panel flex flex-col overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between">
        <SectionHeader icon={<BellRing size={16} />} title="Active Alerts" subtitle="Click toggle to pause or resume" />
        <span className="text-xs font-mono text-live font-semibold">{activeCount} running</span>
      </div>

      <div className="overflow-y-auto flex-1 divide-y divide-border/40">
        {alerts.length === 0 && (
          <p className="px-5 py-8 text-sm text-muted text-center">No alerts deployed yet.</p>
        )}
        {alerts.map(alert => {
          const wouldExceedLimit = tier === 'free' && !alert.enabled && activeCount >= 1;
          return (
            <div
              key={alert.id}
              className={`px-5 py-4 flex items-start gap-4 transition-colors ${alert.enabled ? 'hover:bg-white/5' : 'opacity-50 hover:bg-white/5'
                }`}
            >
              {/* Toggle */}
              <div className="pt-0.5">
                <Toggle
                  enabled={alert.enabled}
                  onChange={() => {
                    if (wouldExceedLimit) return;
                    onToggle(alert.id);
                  }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold font-mono text-white">{alert.ticker}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${alert.enabled
                      ? 'text-live border-live/30 bg-live/10'
                      : 'text-muted border-border bg-white/5'
                    }`}>
                    {alert.enabled ? 'Active' : 'Paused'}
                  </span>
                  <span className="text-[10px] text-muted ml-auto">{alert.createdAt}</span>
                </div>

                {/* Logic string */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {alert.conditions.map((c, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gold px-1.5 py-0.5 border border-gold/30 rounded-full bg-gold/5">
                          AND
                        </span>
                      )}
                      <span className="text-xs font-mono bg-white/5 border border-border px-2 py-0.5 rounded-md text-white/70 inline-flex items-center gap-1">
                        <span className="inline-flex items-center gap-1">
                          {METRIC_ARTICLE_MAP[c.metric] ? (
                            <Link
                              to={`/academy?article=${METRIC_ARTICLE_MAP[c.metric]}`}
                              className="hover:underline text-gold/90 font-mono"
                            >
                              {c.metric}
                            </Link>
                          ) : (
                            c.metric
                          )}
                          {METRIC_TIPS[c.metric] && <Tooltip text={METRIC_TIPS[c.metric]!} />}
                        </span>
                        {' '}<span className="text-muted">{c.operator}</span>{' '}{c.value}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Inline warning when trying to re-enable on free tier */}
                {wouldExceedLimit && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <Lock size={10} className="text-gold shrink-0" />
                    <span className="text-[10px] text-gold/80">
                      1-alert limit reached.{' '}
                      <Link to="/billing" className="underline font-semibold hover:text-gold">
                        Upgrade to PRO
                      </Link>{' '}
                      to enable multiple alerts.
                    </span>
                  </div>
                )}
              </div>

              {/* Delete */}
              <button
                onClick={() => onDelete(alert.id)}
                className="text-muted hover:text-alert transition-colors p-1 mt-0.5 shrink-0"
                aria-label="Delete alert"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trigger History ───────────────────────────────────────────────────────────

function TriggerHistoryPanel({ events }: { events: TriggerEvent[] }) {
  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<History size={16} />}
        title="Trigger History"
        subtitle="Recently fired conditions"
      />

      <div className="glass-panel flex-1 overflow-y-auto divide-y divide-border/40">
        {events.length === 0 && (
          <p className="px-5 py-8 text-sm text-muted text-center">No alerts have fired yet.</p>
        )}
        {events.map(ev => (
          <div key={ev.id} className="px-4 py-3 flex flex-col gap-1 hover:bg-white/5 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {ev.fired
                  ? <CheckCircle2 size={12} className="text-live shrink-0" />
                  : <XCircle size={12} className="text-muted shrink-0" />}
                <span className="text-sm font-bold font-mono text-white">{ev.ticker}</span>
              </div>
              <span className="text-[10px] text-muted whitespace-nowrap">{ev.ago}</span>
            </div>
            <p className="text-xs text-muted pl-5 leading-relaxed">{ev.summary}</p>
            <span className="text-[10px] text-muted/50 pl-5 font-mono">{ev.timestamp}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Row mapper ────────────────────────────────────────────────────────────────

function mapAlertRow(row: Record<string, unknown>): Alert {
  return {
    id: String(row.id),
    ticker: String(row.ticker),
    conditions: row.conditions as Alert['conditions'],
    enabled: Boolean(row.enabled),
    createdAt: new Date(String(row.created_at)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    status: (row.enabled ? 'active' : 'paused') as Alert['status'],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function AlertsView() {
  const { tier, user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [toast, setToast] = useState<{ ticker: string } | null>(null);
  const [firedAlert, setFiredAlert] = useState<Alert | null>(null);
  const [triggerHistory, setTriggerHistory] = useState<TriggerEvent[]>(TRIGGER_HISTORY);

  // Stable ref so the monitoring effect always sees the latest alerts without
  // needing them as a dependency (which would cause an infinite loop on setAlerts).
  const alertsRef = useRef<Alert[]>([]);
  useEffect(() => { alertsRef.current = alerts; });

  // ── Load from Supabase ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setAlerts([]); setAlertsLoading(false); return; }
    setAlertsLoading(true);
    supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setAlerts((data as Record<string, unknown>[]).map(mapAlertRow));
        setAlertsLoading(false);
      });
  }, [user]);

  // ── Live monitoring — runs every 30 s while there are active alerts ──────────
  const activeAlertIds = alerts.filter(a => a.enabled).map(a => a.id).sort().join(',');

  useEffect(() => {
    if (!activeAlertIds) return;
    let cancelled = false;

    async function checkAlerts() {
      if (cancelled) return;
      const active = alertsRef.current.filter(a => a.enabled);
      if (!active.length) return;

      // Unique tickers needed
      const tickers = [...new Set(active.map(a => a.ticker))];

      // Normalise crypto tickers for Yahoo Finance
      const toYahoo = (t: string) =>
        t === 'BTC' ? 'BTC-USD' : t === 'ETH' ? 'ETH-USD' : t;

      // Fetch 1-year daily closes for every ticker in parallel
      const indicatorsMap = new Map<string, { cur: TickerIndicators; prev: TickerIndicators }>();
      await Promise.allSettled(
        tickers.map(async (ticker) => {
          try {
            const res = await fetch(
              `/api/yahoo/v8/finance/chart/${toYahoo(ticker)}?range=1y&interval=1d&t=${Date.now()}`,
            );
            if (!res.ok) return;
            const json = await res.json();
            const quote = json?.chart?.result?.[0]?.indicators?.quote?.[0] ?? {};
            const fin = (arr: unknown[]): number[] =>
              (arr as unknown[]).filter((v): v is number => typeof v === 'number' && isFinite(v));
            const closes = fin(quote.close ?? []);
            const highs = fin(quote.high ?? []);
            const lows = fin(quote.low ?? []);
            const volumes = fin(quote.volume ?? []);
            if (closes.length < 2) return;
            indicatorsMap.set(ticker, {
              cur: computeIndicators(closes, highs, lows, volumes),
              prev: computeIndicators(closes.slice(0, -1), highs.slice(0, -1), lows.slice(0, -1), volumes.slice(0, -1)),
            });
          } catch { /* network/parse error — skip this ticker */ }
        }),
      );

      if (cancelled) return;

      // Evaluate every active alert against its ticker's computed indicators
      const fired: Alert[] = [];
      for (const alert of active) {
        const inds = indicatorsMap.get(alert.ticker);
        if (!inds) continue;
        const allMet = alert.conditions.every(c => evaluateCondition(c, inds.cur, inds.prev));
        if (allMet) fired.push(alert);
      }

      // Fire each triggered alert (sequential to keep Supabase writes clean)
      for (const alert of fired) {
        if (cancelled) break;
        // Pause in DB (fire-once semantics)
        await supabase.from('alerts').update({ enabled: false }).eq('id', alert.id);
        // Update local state
        setAlerts(prev =>
          prev.map(a => a.id === alert.id ? { ...a, enabled: false, status: 'paused' } : a),
        );
        // Show golden toast + beep
        setFiredAlert(alert);
        playAlertBeep();
        // Prepend to live trigger history
        const now = new Date();
        setTriggerHistory(prev => [{
          id: Date.now(),
          ticker: alert.ticker,
          summary: alert.conditions.map(c => `${c.metric} ${c.operator} ${c.value}`).join(' AND '),
          timestamp: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }),
          ago: 'Just now',
          fired: true,
        }, ...prev]);
      }
    }

    checkAlerts().catch(console.error);
    const intervalId = setInterval(() => checkAlerts().catch(console.error), 30_000);
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [activeAlertIds]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = alerts.filter(a => a.enabled).length;

  async function deployAlert(ticker: string, conditions: Alert['conditions']) {
    if (!user) return;
    const { data: row, error } = await supabase
      .from('alerts')
      .insert({ user_id: user.id, ticker, conditions, enabled: true })
      .select()
      .single();
    if (!error && row) {
      setAlerts(prev => [mapAlertRow(row as Record<string, unknown>), ...prev]);
      setToast({ ticker });
    }
  }

  async function toggleAlert(id: string) {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;
    const newEnabled = !alert.enabled;
    const { error } = await supabase.from('alerts').update({ enabled: newEnabled }).eq('id', id);
    if (!error) {
      setAlerts(prev => prev.map(a =>
        a.id === id ? { ...a, enabled: newEnabled, status: newEnabled ? 'active' : 'paused' } : a
      ));
    }
  }

  async function deleteAlert(id: string) {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (!error) setAlerts(prev => prev.filter(a => a.id !== id));
  }

  const userEmail = user?.email ?? '';

  if (alertsLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-3 text-muted text-sm">
        <span className="w-2 h-2 rounded-full bg-live animate-pulse shrink-0" />
        Loading alerts from cloud…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {toast && (
        <DeployToast
          ticker={toast.ticker}
          email={userEmail}
          onDismiss={() => setToast(null)}
        />
      )}
      {firedAlert && (
        <AlertFiredToast alert={firedAlert} onDismiss={() => setFiredAlert(null)} />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4">

        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Smart Alerts</h1>
          <p className="text-muted text-sm mt-1">
            Build complex multi-condition alerts and track when they fire in real time
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* Left — Builder + Active Alerts stacked */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            <AlertBuilder onDeploy={deployAlert} userEmail={userEmail} tier={tier} activeCount={activeCount} />
            <ActiveAlerts alerts={alerts} onToggle={toggleAlert} onDelete={deleteAlert} tier={tier} activeCount={activeCount} />
          </div>

          {/* Right — Trigger History */}
          <div className="xl:col-span-1 flex flex-col min-h-0">
            <TriggerHistoryPanel events={triggerHistory} />
          </div>

        </div>
      </div>
    </div>
  );
}
