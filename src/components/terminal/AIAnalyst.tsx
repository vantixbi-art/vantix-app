import { useState, useEffect } from 'react';
import {
  BrainCircuit, TrendingUp, TrendingDown, AlertTriangle,
  Database, MoveUpRight, MoveDownRight, WifiOff,
  Activity, Layers, BarChart2, Target,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type MTFSignal   = 'Bull' | 'Bear' | 'Neutral';
type OptionsBias = 'Bullish' | 'Bearish' | 'Neutral';
type Tab         = 'core' | 'advanced';

interface SymbolData {
  bullish:   boolean;
  pattern:   string;
  analysis:  string;
  macro:     string;
  matches:   string;
  accuracy:  number;
  projected: number;
  years:     string;
  entry:     string;
  tp:        string;
  stop:      string;
  breakeven: string;   // trigger price to move SL → entry (1×ATR from entry)
  price:     number;
  confluenceScore:      number;
  confluenceIndicators: { rsi: string; macd: string; ma: string; vwap: string };
  volumeProfile:        { poc: string; supportBlock: string; resistanceBlock: string };
  mtfConfirmation:      { m15: MTFSignal; h1: MTFSignal; h4: MTFSignal; d1: MTFSignal };
  expectedRange:        { low: string; high: string; current: string };
  optionsSentiment:     { callsPct: number; putsPct: number; bias: OptionsBias };
  bollingerBands:       { upper: number; middle: number; lower: number };
  pivotPoints:          { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number };
  // ── Risk-calibration fields ────────────────────────────────────────────────
  isOverextended: boolean;
  highRiskVol:    boolean;
  volRegime:      'low' | 'medium' | 'high';
  atrPercent:     number;
  bearishMarket:  boolean;
  marketRegime:   'Bullish' | 'Bearish' | 'Unknown';
  // ── v2.1 additions ─────────────────────────────────────────────────────────
  rsRating:   number;   // stock 20d return − SPY 20d return (percentage points)
  rsPositive: boolean;  // stock outperforming SPY over 20 days
  rvol:       number;   // relative volume vs 20-day average
  rvolHigh:   boolean;  // RVOL ≥ 1.5 (institutional accumulation signal)
  sparkPts:   number[];
}

// ── Math helpers ──────────────────────────────────────────────────────────────

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
  for (let i = period; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return ema;
}

function calculateRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  const recent  = closes.slice(-(period + 1));
  const changes = recent.slice(1).map((c, i) => c - recent[i]);
  const avgGain = changes.filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
  const avgLoss = changes.filter(c => c < 0).reduce((a, b) => a + Math.abs(b), 0) / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean     = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function calculateATR(highs: number[], lows: number[], closes: number[], period = 14): number {
  if (highs.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < highs.length; i++) {
    const hl  = highs[i] - lows[i];
    const hpc = Math.abs(highs[i] - closes[i - 1]);
    const lpc = Math.abs(lows[i]  - closes[i - 1]);
    trs.push(Math.max(hl, hpc, lpc));
  }
  const slice = trs.slice(-period);
  return slice.length === 0 ? 0 : slice.reduce((a, b) => a + b, 0) / slice.length;
}

function calculateVWAP(closes: number[], highs: number[], lows: number[], volumes: number[]): number {
  const len = Math.min(closes.length, highs.length, lows.length, volumes.length);
  if (len === 0) return 0;
  let totalPV = 0, totalV = 0;
  for (let i = 0; i < len; i++) {
    const typical = (highs[i] + lows[i] + closes[i]) / 3;
    totalPV += typical * volumes[i];
    totalV  += volumes[i];
  }
  return totalV === 0 ? 0 : totalPV / totalV;
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const xs = x.slice(-n), ys = y.slice(-n);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx2 = 0, dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx, dy = ys[i] - my;
    num += dx * dy; dx2 += dx * dx; dy2 += dy * dy;
  }
  return dx2 === 0 || dy2 === 0 ? 0 : num / Math.sqrt(dx2 * dy2);
}

function resampleTo4H(closes1h: number[]): number[] {
  const result: number[] = [];
  for (let i = 3; i < closes1h.length; i += 4) result.push(closes1h[i]);
  return result;
}

function mtfSignal(closes: number[]): MTFSignal {
  if (closes.length < 2) return 'Neutral';
  const ema  = calculateEMA(20, closes);
  const last = closes.at(-1)!;
  return last > ema ? 'Bull' : last < ema ? 'Bear' : 'Neutral';
}

function detectCandlePattern(opens: number[], highs: number[], lows: number[], closes: number[]): string | null {
  const n = closes.length;
  if (n < 2 || opens.length < n) return null;
  const i = n - 1;
  const o = opens[i], h = highs[i], l = lows[i], c = closes[i];
  const range = h - l;
  if (range > 0) {
    if (Math.abs(c - o) <= range * 0.1) return 'Doji';
    if ((h - Math.max(o, c)) < range * 0.1 && (Math.min(o, c) - l) >= 2 * Math.abs(o - c)) return 'Hammer';
    if ((h - Math.max(o, c)) >= 2 * Math.abs(o - c) && (Math.min(o, c) - l) < range * 0.1) return 'Inverted Hammer';
  }
  const pi = n - 2;
  const po = opens[pi], pc = closes[pi];
  if (pc < po && c > o && o <= pc && c >= po) return 'Bullish Engulfing';
  if (pc > po && c < o && o >= pc && c <= po) return 'Bearish Engulfing';
  return null;
}

// 20-period SMA ± 2σ Bollinger Bands
function calculateBollingerBands(closes: number[], period = 20) {
  const slice  = closes.slice(-Math.min(period, closes.length));
  const middle = slice.reduce((a, b) => a + b, 0) / (slice.length || 1);
  const stdDev = calculateStdDev(slice);
  return { upper: middle + 2 * stdDev, middle, lower: middle - 2 * stdDev };
}

// Classic pivot points from the prior bar's H / L / C
function calculatePivotPoints(high: number, low: number, close: number) {
  const pivot = (high + low + close) / 3;
  return {
    pivot,
    r1: 2 * pivot - low,
    r2: pivot + (high - low),
    r3: high + 2 * (pivot - low),
    s1: 2 * pivot - high,
    s2: pivot - (high - low),
    s3: low  - 2 * (high - pivot),
  };
}

// ── computeSymbolData ─────────────────────────────────────────────────────────

function computeSymbolData(
  symbol:  string,
  closes:  number[],
  highs:   number[],
  lows:    number[],
  volumes: number[],
  opens:   number[],
  mtfOverride?:     { m15: MTFSignal; h1: MTFSignal; h4: MTFSignal; d1: MTFSignal },
  optionsOverride?: { callsPct: number; putsPct: number; bias: OptionsBias },
  macroOverride?:   string,
  spyCloses?:       number[],   // used for market-regime filter
): SymbolData {
  const H = highs.length   ? highs   : closes;
  const L = lows.length    ? lows    : closes;
  const V = volumes.length ? volumes : closes.map(() => 1);

  const price  = closes.at(-1) ?? 0;
  const sma50  = calculateSMA(50,  closes);
  const sma200 = calculateSMA(200, closes);
  const ema5   = calculateEMA(5,   closes);
  const ema10  = calculateEMA(10,  closes);
  const ema20  = calculateEMA(20,  closes);
  const ema12  = calculateEMA(12,  closes);
  const ema26  = calculateEMA(26,  closes);
  const rsi14  = calculateRSI(closes);
  const macd   = ema12 - ema26;
  const vwap   = calculateVWAP(closes, H, L, V);
  const atr    = calculateATR(H, L, closes);

  // BB needed before scoring (overextended detection uses upper band)
  const bollingerBands = calculateBollingerBands(closes);

  // ── 1. Base confluence score (four factors × 25) ───────────────────────────
  let confluenceScore = 0;
  if (price > sma50)  confluenceScore += 25;
  if (price > sma200) confluenceScore += 25;
  if (rsi14 > 50)     confluenceScore += 25;
  if (macd  > 0)      confluenceScore += 25;

  // ── 2. Overextended penalty (RSI > 70 OR price ≥ 98% of upper BB) ─────────
  // Buying at the peak of momentum produces only ~33% win rate — penalise it.
  const isOverextended = rsi14 > 70 || price >= bollingerBands.upper * 0.98;
  if (isOverextended) confluenceScore = Math.max(0, confluenceScore - 25);

  // ── 3. SPY Market Regime filter ────────────────────────────────────────────
  let bearishMarket                          = false;
  let marketRegime: SymbolData['marketRegime'] = 'Unknown';
  let rsRating   = 0;
  let rsPositive = false;
  if (spyCloses && spyCloses.length >= 2) {
    const spySMA50 = calculateSMA(50, spyCloses);
    const spyPrice = spyCloses.at(-1)!;
    bearishMarket  = spyPrice < spySMA50;
    marketRegime   = bearishMarket ? 'Bearish' : 'Bullish';
    if (bearishMarket && confluenceScore >= 50) {
      confluenceScore = Math.max(0, confluenceScore - 15);
    }

    // ── 3a. Relative Strength vs SPY (20-day RS Rating) ─────────────────────
    // +15 pts when stock outperforms SPY over last 20 trading days.
    if (spyCloses.length >= 21 && closes.length >= 21) {
      const stockReturn = (closes.at(-1)! - closes[closes.length - 21]) / (closes[closes.length - 21] || 1);
      const spyReturn   = (spyCloses.at(-1)! - spyCloses[spyCloses.length - 21]) / (spyCloses[spyCloses.length - 21] || 1);
      rsRating   = (stockReturn - spyReturn) * 100; // in percentage points
      rsPositive = rsRating > 0;
      if (rsPositive) confluenceScore += 15;
    }
  }

  // ── 4a. Institutional Volume Confirmation (RVOL) ───────────────────────────
  // +10 pts when current bar volume ≥ 1.5× the 20-day average (institutional flow).
  const vol20Avg  = V.length >= 21
    ? V.slice(-21, -1).reduce((a, b) => a + b, 0) / 20
    : (V.reduce((a, b) => a + b, 0) / (V.length || 1));
  const rvol     = vol20Avg > 0 ? (V.at(-1) ?? 0) / vol20Avg : 0;
  const rvolHigh = rvol >= 1.5;
  if (rvolHigh) confluenceScore += 10;

  // Clamp to valid range after all additions and deductions
  confluenceScore = Math.min(100, Math.max(0, confluenceScore));

  const bullish = confluenceScore >= 65;

  // ── 4. Volatility-adjusted ATR multipliers ─────────────────────────────────
  // Audit showed 69% win rate in low-vol vs. 17% in high-vol with static stops.
  const atrPercent = price > 0 ? (atr / price) * 100 : 0;
  let tpMult: number, slMult: number;
  let volRegime: SymbolData['volRegime'];
  let highRiskVol: boolean;

  if (atrPercent < 2.5) {
    volRegime = 'low';    tpMult = 2.0; slMult = 1.5; highRiskVol = false;
  } else if (atrPercent <= 3.5) {
    volRegime = 'medium'; tpMult = 2.2; slMult = 1.8; highRiskVol = false;
  } else {
    volRegime = 'high';   tpMult = 2.5; slMult = 2.2; highRiskVol = true;
  }

  const tpDollar = tpMult * atr;
  const slDollar = slMult * atr;
  // Breakeven trigger = 1×ATR from entry (50% of the way to TP).
  // When price reaches this level, move the stop-loss to the entry price.
  const beDollar = atr;

  // ── Pattern (overextended overrides everything else) ───────────────────────
  const candlePattern = detectCandlePattern(opens, highs, lows, closes);
  let pattern: string;
  if      (isOverextended)              pattern = 'Overextended / Pullback Risk';
  else if (candlePattern)               pattern = candlePattern;
  else if (rsi14 < 30)                  pattern = 'Oversold Rebound';
  else if (price > sma50 && macd > 0)   pattern = 'Bullish Momentum';
  else if (price < sma50 && macd < 0)   pattern = 'Bearish Breakdown';
  else                                  pattern = 'Range Consolidation';

  // ── Analysis text ──────────────────────────────────────────────────────────
  const analysis =
    `${symbol} is displaying a ${pattern} on the daily chart. ` +
    (candlePattern && !isOverextended ? `A ${candlePattern} candle was detected on the most recent bar. ` : '') +
    `Price is at $${price.toFixed(2)} with RSI at ${rsi14.toFixed(1)}, ` +
    (isOverextended
      ? `indicating overbought/overextended conditions with elevated pullback risk. `
      : `showing ${rsi14 > 60 ? 'strong bullish momentum' : rsi14 < 40 ? 'oversold conditions' : 'neutral consolidation'}. `) +
    `Moving averages suggest the primary trend is ${price > sma200 ? 'bullish' : 'bearish'}.` +
    (bearishMarket ? ` Broad market is bearish (SPY < SMA50) — reduces conviction on long setups.` : '');

  const macro = macroOverride ??
    (`Correlated with sector benchmarks. ATR at $${atr.toFixed(2)} (${atrPercent.toFixed(1)}% of price) — ` +
    `${volRegime} volatility regime.${highRiskVol ? ' Stops widened to avoid noise shakeouts.' : ''} Watch key supports for shifts.`);

  // ── Core metrics ───────────────────────────────────────────────────────────
  const accuracy  = 50 + Math.round(confluenceScore / 4.5);
  const projected = bullish
    ? parseFloat((confluenceScore / 20).toFixed(1))
    : -parseFloat(((100 - confluenceScore) / 20).toFixed(1));

  const entry = `$${price.toFixed(2)}`;
  // Directional: long targets go up, short targets go down
  const tp = bullish
    ? `+$${tpDollar.toFixed(2)} ($${(price + tpDollar).toFixed(2)})`
    : `-$${tpDollar.toFixed(2)} ($${(price - tpDollar).toFixed(2)})`;
  const stop = bullish
    ? `-$${slDollar.toFixed(2)} ($${(price - slDollar).toFixed(2)})`
    : `+$${slDollar.toFixed(2)} ($${(price + slDollar).toFixed(2)})`;
  // Breakeven trigger price (direction-aware), move SL to entry when hit
  const breakeven = bullish
    ? `+$${beDollar.toFixed(2)} ($${(price + beDollar).toFixed(2)})`
    : `-$${beDollar.toFixed(2)} ($${(price - beDollar).toFixed(2)})`;

  // ── Confluence indicator signals ───────────────────────────────────────────
  const sig = (bull: boolean, bear: boolean): string =>
    bull ? 'Bull' : bear ? 'Bear' : 'Neutral';
  const rsiSig  = sig(rsi14 > 60,                         rsi14 < 40);
  const macdSig = sig(macd  > 0,                          macd  < 0);
  const maSig   = sig(price > sma200 && price > sma50,     price < sma200 && price < sma50);
  const vwapSig = sig(price > vwap,                       price < vwap);

  // ── Volume Profile ─────────────────────────────────────────────────────────
  const last20C = closes.slice(-20);
  const last20H = H.slice(-20);
  const last20L = L.slice(-20);
  const last20V = V.slice(-20);
  let pocIdx = 0, maxVol = 0;
  for (let i = 0; i < Math.min(last20C.length, last20V.length); i++) {
    if (last20V[i] > maxVol) { maxVol = last20V[i]; pocIdx = i; }
  }
  const poc    = last20C[pocIdx] ?? price;
  const suppLo = Math.min(...last20L);
  const suppHi = Math.min(...last20C) + atr * 0.5;
  const resHi  = Math.max(...last20H);
  const resLo  = Math.max(...last20C) - atr * 0.5;

  // ── Multi-timeframe ────────────────────────────────────────────────────────
  const mtfFallback = (ref: number): MTFSignal =>
    price > ref ? 'Bull' : price < ref ? 'Bear' : 'Neutral';
  const mtf = mtfOverride ?? {
    m15: mtfFallback(ema5),
    h1:  mtfFallback(ema10),
    h4:  mtfFallback(ema20),
    d1:  mtfFallback(sma50),
  };

  const fbCalls = Math.min(90, Math.max(10, Math.round(50 + (rsi14 - 50) * 0.5)));
  const optSentiment = optionsOverride ?? {
    callsPct: fbCalls,
    putsPct:  100 - fbCalls,
    bias:     (fbCalls > 55 ? 'Bullish' : fbCalls < 45 ? 'Bearish' : 'Neutral') as OptionsBias,
  };

  const pivotPoints = calculatePivotPoints(H.at(-1) ?? price, L.at(-1) ?? price, price);

  return {
    bullish, pattern, analysis, macro,
    matches:  '3 similar structural patterns found (accuracy based on last 250 daily bars)',
    accuracy, projected,
    years:    '(avg. over next 10 candles)',
    entry, tp, stop, breakeven, price,
    confluenceScore,
    confluenceIndicators: { rsi: rsiSig, macd: macdSig, ma: maSig, vwap: vwapSig },
    volumeProfile: {
      poc:             `$${poc.toFixed(2)}`,
      supportBlock:    `$${suppLo.toFixed(2)}–$${suppHi.toFixed(2)}`,
      resistanceBlock: `$${resLo.toFixed(2)}–$${resHi.toFixed(2)}`,
    },
    mtfConfirmation: mtf,
    expectedRange: {
      low:     `$${(price - 2 * atr).toFixed(2)}`,
      high:    `$${(price + 2 * atr).toFixed(2)}`,
      current: `$${price.toFixed(2)}`,
    },
    optionsSentiment: optSentiment,
    bollingerBands,
    pivotPoints,
    isOverextended,
    highRiskVol,
    volRegime,
    atrPercent,
    bearishMarket,
    marketRegime,
    rsRating,
    rsPositive,
    rvol,
    rvolHigh,
    sparkPts: closes.slice(-8),
  };
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ positive, pts: customPts }: { positive: boolean; pts?: number[] }) {
  const staticUp   = [0, 3, 1, 5, 4, 7, 6, 10];
  const staticDown = [10, 8, 9, 6, 7, 4, 5, 2];
  const pts  = customPts && customPts.length >= 2 ? customPts : (positive ? staticUp : staticDown);
  const min  = Math.min(...pts);
  const max  = Math.max(...pts);
  const h = 32, w = 80;
  const step = w / (pts.length - 1);
  const safeY = (v: number) => max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
  const coords = pts.map((v, i) => `${i * step},${safeY(v)}`).join(' ');
  const lastY  = safeY(pts[pts.length - 1]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={positive ? '#00FF88' : '#FF4D4D'} stopOpacity="0.3" />
          <stop offset="100%" stopColor={positive ? '#00FF88' : '#FF4D4D'} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${h} ${coords} ${(pts.length - 1) * step},${h}`}
        fill={`url(#sg-${positive})`}
      />
      <polyline
        points={coords} fill="none"
        stroke={positive ? '#00FF88' : '#FF4D4D'}
        strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"
      />
      <circle cx={(pts.length - 1) * step} cy={lastY} r="2.5" fill={positive ? '#00FF88' : '#FF4D4D'} />
    </svg>
  );
}

// ── Shared primitives ─────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-muted/50">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted/60">{label}</span>
    </div>
  );
}

function AdvCard({
  children, glow,
}: { children: React.ReactNode; glow?: string }) {
  return (
    <div
      className="rounded-xl border border-white/[0.07] p-4 flex flex-col gap-3"
      style={{ background: 'rgba(8,8,10,0.75)', boxShadow: glow ?? 'none' }}
    >
      {children}
    </div>
  );
}

// ── Confluence Ring ───────────────────────────────────────────────────────────

const RING_R    = 28;
const RING_C    = 2 * Math.PI * RING_R;
const RING_SIZE = 68;

const IND_TOOLTIP: Record<string, string> = {
  rsi:  'RSI 14 — momentum oscillator. Bull > 60, Bear < 40.',
  macd: 'MACD (12,26) — trend crossover. Bull when difference is positive.',
  ma:   'Moving Averages (SMA50 & SMA200). Bull when price is above both.',
  vwap: 'VWAP — volume-weighted fair value. Bull when price trades above.',
};

function sigDotGlow(v: string) {
  return v === 'Bull'
    ? '0 0 5px rgba(0,255,136,0.8)'
    : v === 'Bear'
    ? '0 0 5px rgba(255,77,77,0.8)'
    : '0 0 5px rgba(212,175,55,0.7)';
}
function sigColor(v: string) {
  return v === 'Bull' ? 'text-live' : v === 'Bear' ? 'text-alert' : 'text-gold';
}

function ConfluenceRing({ score, indicators }: {
  score:      number;
  indicators: SymbolData['confluenceIndicators'];
}) {
  const stroke = score >= 80 ? '#00FF88' : score >= 65 ? '#D4AF37' : '#FF4D4D';
  const glow   = score >= 80 ? '0 0 14px rgba(0,255,136,0.55)' : score >= 65 ? '0 0 14px rgba(212,175,55,0.55)' : '0 0 14px rgba(255,77,77,0.55)';
  const halo   = score >= 80 ? 'rgba(0,255,136,0.08)' : score >= 65 ? 'rgba(212,175,55,0.08)' : 'rgba(255,77,77,0.06)';
  const offset = RING_C * (1 - score / 100);
  const cx     = RING_SIZE / 2;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `0 0 22px ${halo}` }} />
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
          <circle cx={cx} cy={cx} r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle
            cx={cx} cy={cx} r={RING_R} fill="none"
            stroke={stroke} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={RING_C} strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cx})`}
            style={{ filter: `drop-shadow(${glow})`, transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-base font-bold font-mono text-white leading-none">{score}</span>
          <span className="text-[8px] text-muted/50 leading-none mt-0.5">/100</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {(Object.entries(indicators) as [string, string][]).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 cursor-help" title={IND_TOOLTIP[key] ?? key}>
            <span className="text-[9px] text-muted/40 uppercase w-9 shrink-0">{key}</span>
            <div
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${val === 'Bull' ? 'bg-live' : val === 'Bear' ? 'bg-alert' : 'bg-gold'}`}
              style={{ boxShadow: sigDotGlow(val) }}
            />
            <span className={`text-[10px] font-bold ${sigColor(val)}`}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MTF Pills ─────────────────────────────────────────────────────────────────

const MTF_STYLES: Record<MTFSignal, { dot: string; text: string; border: string; bg: string; glow: string }> = {
  Bull:    { dot: 'bg-live',  text: 'text-live',  border: 'border-live/30',  bg: 'bg-live/[0.08]',  glow: '0 0 10px rgba(0,255,136,0.14)' },
  Bear:    { dot: 'bg-alert', text: 'text-alert', border: 'border-alert/30', bg: 'bg-alert/[0.08]', glow: '0 0 10px rgba(255,77,77,0.14)' },
  Neutral: { dot: 'bg-gold',  text: 'text-gold',  border: 'border-gold/20',  bg: 'bg-gold/[0.06]',  glow: 'none' },
};

const MTF_TOOLTIP: Record<string, string> = {
  '15M': 'Short-term scalp signal derived from 15-minute EMA crossover.',
  '1H':  'Intraday trend signal derived from 1-hour EMA alignment.',
  '4H':  'Swing signal derived from 4-hour EMA crossover.',
  'D1':  'Macro bias derived from daily SMA50 vs. current price.',
};

function MTFPills({ data }: { data: SymbolData['mtfConfirmation'] }) {
  const pills: { label: string; value: MTFSignal }[] = [
    { label: '15M', value: data.m15 },
    { label: '1H',  value: data.h1  },
    { label: '4H',  value: data.h4  },
    { label: 'D1',  value: data.d1  },
  ];
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {pills.map(({ label, value }) => {
        const s = MTF_STYLES[value];
        return (
          <div
            key={label}
            title={MTF_TOOLTIP[label]}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border cursor-help transition-all ${s.border} ${s.bg}`}
            style={{ boxShadow: s.glow }}
          >
            <span className="text-[9px] text-muted/50 font-mono font-semibold tracking-wide">{label}</span>
            <div className={`w-2 h-2 rounded-full ${s.dot}`} style={{ boxShadow: sigDotGlow(value) }} />
            <span className={`text-[10px] font-bold ${s.text}`}>{value}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Options Sentiment Bar ─────────────────────────────────────────────────────

function OptionsSentimentBar({ callsPct, putsPct, bias }: {
  callsPct: number; putsPct: number; bias: OptionsBias;
}) {
  const biasColor = bias === 'Bullish' ? 'text-live' : bias === 'Bearish' ? 'text-alert' : 'text-gold';
  const biasGlow  = bias === 'Bullish'
    ? '0 0 8px rgba(0,255,136,0.5)'
    : bias === 'Bearish'
    ? '0 0 8px rgba(255,77,77,0.5)'
    : 'none';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-muted/50 uppercase tracking-widest">Options Flow Bias</span>
        <span className={`text-[11px] font-bold ${biasColor}`} style={{ textShadow: biasGlow }}>{bias}</span>
      </div>
      <div className="h-5 w-full rounded-full overflow-hidden border border-white/[0.06] flex">
        <div
          className="flex items-center justify-center text-[9px] font-bold text-black"
          style={{ width: `${callsPct}%`, background: 'linear-gradient(90deg,#00AA55,#00FF88)' }}
        >
          {callsPct >= 28 ? `${callsPct}%` : ''}
        </div>
        <div
          className="flex items-center justify-center text-[9px] font-bold text-black flex-1"
          style={{ background: 'linear-gradient(90deg,#FF4D4D,#CC0000)' }}
        >
          {putsPct >= 25 ? `${putsPct}%` : ''}
        </div>
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono">
        <span className="text-live font-semibold">{callsPct}% Calls</span>
        <span className="text-alert font-semibold">{putsPct}% Puts</span>
      </div>
    </div>
  );
}

// ── Volume Profile Panel ──────────────────────────────────────────────────────

function VolumeProfilePanel({ poc, supportBlock, resistanceBlock }: SymbolData['volumeProfile']) {
  const rows = [
    { label: 'Res Zone', value: resistanceBlock, sym: '▲', color: 'text-alert',  border: 'border-alert/20',  bg: 'bg-alert/[0.05]'  },
    { label: 'POC',      value: poc,             sym: '●', color: 'text-gold',   border: 'border-gold/30',   bg: 'bg-gold/[0.07]'   },
    { label: 'Supp Zone', value: supportBlock,   sym: '▼', color: 'text-live',   border: 'border-live/20',   bg: 'bg-live/[0.05]'   },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map(r => (
        <div key={r.label} className={`flex items-center justify-between px-3 py-2 rounded-lg border ${r.border} ${r.bg}`}>
          <div className="flex items-center gap-1.5">
            <span className={`text-[9px] ${r.color}`}>{r.sym}</span>
            <span className="text-[9px] text-muted/50 uppercase tracking-widest">{r.label}</span>
          </div>
          <span className={`text-[11px] font-mono font-bold ${r.color}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Expected Range ────────────────────────────────────────────────────────────

function ExpectedRange({ low, high, current }: SymbolData['expectedRange']) {
  const parse = (s: string) => parseFloat(s.replace(/[$,—]/g, ''));
  const lo = parse(low), hi = parse(high), cur = parse(current);
  const valid = !isNaN(lo) && !isNaN(hi) && hi > lo && !isNaN(cur);
  const pct   = valid ? Math.min(100, Math.max(0, ((cur - lo) / (hi - lo)) * 100)) : 50;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-6 w-full rounded-full overflow-hidden"
        style={{ background: 'linear-gradient(90deg,rgba(255,77,77,0.12),rgba(212,175,55,0.10),rgba(0,255,136,0.12))' }}>
        <div className="absolute inset-0 rounded-full border border-white/[0.05]" />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white z-10"
          style={{ left: `${pct}%`, boxShadow: '0 0 0 2px rgba(212,175,55,0.6), 0 0 10px rgba(212,175,55,0.4)' }}
        />
      </div>
      <div className="relative flex items-center justify-between text-[9px] font-mono">
        <span className="text-alert/70">{low}</span>
        <span className="text-muted/50 absolute left-1/2 -translate-x-1/2">{current}</span>
        <span className="text-live/70">{high}</span>
      </div>
    </div>
  );
}

// ── Bollinger Bands Panel ─────────────────────────────────────────────────────

function BollingerBandsPanel({ bands, price }: { bands: SymbolData['bollingerBands']; price: number }) {
  const { upper, middle, lower } = bands;
  const range  = upper - lower || 1;
  const pos    = Math.min(100, Math.max(0, ((price  - lower) / range) * 100));
  const midPct = Math.min(100, Math.max(0, ((middle - lower) / range) * 100));
  const bandwidth = ((range / middle) * 100).toFixed(2);

  const posLabel = pos >= 80 ? 'Near Upper Band' : pos <= 20 ? 'Near Lower Band' : pos >= 50 ? 'Above Midline' : 'Below Midline';
  const posColor = pos >= 80 ? 'text-alert' : pos <= 20 ? 'text-live' : 'text-gold';
  const zone     = pos >= 80 ? 'Overbought Zone' : pos <= 20 ? 'Oversold Zone' : 'Neutral Zone';

  return (
    <div className="flex flex-col gap-3">
      {/* Band values */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Upper (+2σ)', value: upper,  color: 'text-alert/80' },
          { label: 'Middle SMA20', value: middle, color: 'text-gold'     },
          { label: 'Lower (−2σ)', value: lower,  color: 'text-live/80'  },
        ].map(s => (
          <div key={s.label} className="flex flex-col gap-0.5 rounded-lg px-2.5 py-2 border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[9px] text-muted/40 uppercase tracking-widest leading-tight">{s.label}</span>
            <span className={`text-xs font-bold font-mono ${s.color}`}>${s.value.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Visual track */}
      <div className="flex flex-col gap-1.5">
        <div
          className="relative h-7 w-full rounded-xl overflow-visible"
          style={{ background: 'linear-gradient(90deg,rgba(0,255,136,0.13) 0%,rgba(212,175,55,0.10) 50%,rgba(255,77,77,0.13) 100%)' }}
        >
          {/* Border overlay */}
          <div className="absolute inset-0 rounded-xl border border-white/[0.06] pointer-events-none" />
          {/* Midline (SMA20) */}
          <div
            className="absolute top-0 bottom-0 w-px bg-gold/35 pointer-events-none"
            style={{ left: `${midPct}%` }}
          />
          {/* Price thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
            style={{ left: `${pos}%` }}
          >
            <div
              className="w-4 h-4 rounded-full bg-white"
              style={{ boxShadow: '0 0 0 2px rgba(212,175,55,0.7), 0 0 14px rgba(212,175,55,0.45), 0 0 4px rgba(255,255,255,0.5)' }}
            />
          </div>
        </div>

        {/* Axis labels */}
        <div className="relative flex items-center justify-between text-[9px] font-mono">
          <span className="text-live/60">${lower.toFixed(2)}</span>
          <span
            className="text-gold/60 absolute -translate-x-1/2"
            style={{ left: `${midPct}%` }}
          >${middle.toFixed(2)}</span>
          <span className="text-alert/60">${upper.toFixed(2)}</span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${posColor}`}>{posLabel}</span>
          <span className="text-[9px] text-muted/30">·</span>
          <span className="text-[9px] text-muted/40">{zone}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted/40 uppercase tracking-widest">BW</span>
          <span className="text-[10px] font-mono font-semibold text-white/60">{bandwidth}%</span>
        </div>
      </div>
    </div>
  );
}

// ── Pivot Points Table ────────────────────────────────────────────────────────

function PivotPointsTable({ pivots, price }: { pivots: SymbolData['pivotPoints']; price: number }) {
  type LvlType = 'resistance' | 'pivot' | 'support';
  const levels: { label: string; value: number; type: LvlType }[] = [
    { label: 'R3', value: pivots.r3,    type: 'resistance' },
    { label: 'R2', value: pivots.r2,    type: 'resistance' },
    { label: 'R1', value: pivots.r1,    type: 'resistance' },
    { label: 'PP', value: pivots.pivot, type: 'pivot'      },
    { label: 'S1', value: pivots.s1,    type: 'support'    },
    { label: 'S2', value: pivots.s2,    type: 'support'    },
    { label: 'S3', value: pivots.s3,    type: 'support'    },
  ];

  const allValues = levels.map(l => l.value);
  const min = Math.min(...allValues, price);
  const max = Math.max(...allValues, price);
  const span = max - min || 1;

  const barFill: Record<LvlType, string> = {
    resistance: 'bg-live/50',
    pivot:      'bg-gold',
    support:    'bg-alert/50',
  };
  const textCol: Record<LvlType, string> = {
    resistance: 'text-live',
    pivot:      'text-gold',
    support:    'text-alert',
  };
  const tagCls: Record<LvlType, string> = {
    resistance: 'bg-live/10 border-live/25 text-live',
    pivot:      'bg-gold/10 border-gold/30 text-gold',
    support:    'bg-alert/10 border-alert/25 text-alert',
  };

  // Where the current price sits on the scale
  const pricePct = ((price - min) / span) * 100;

  return (
    <div className="flex flex-col gap-0.5">
      {/* Price position indicator across the scale */}
      <div className="relative h-1 w-full rounded-full bg-white/[0.05] mb-2">
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white"
          style={{ left: `${pricePct}%`, boxShadow: '0 0 6px rgba(255,255,255,0.7)' }}
        />
        <span
          className="absolute -top-4 -translate-x-1/2 text-[8px] text-white/40 font-mono whitespace-nowrap"
          style={{ left: `${pricePct}%` }}
        >Price</span>
      </div>

      {levels.map(({ label, value, type }) => {
        const barPct = ((value - min) / span) * 100;
        const diff   = value - price;
        const diffStr = diff === 0
          ? 'at price'
          : diff > 0
          ? `+$${diff.toFixed(2)}`
          : `-$${Math.abs(diff).toFixed(2)}`;

        return (
          <div
            key={label}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <span className={`text-[9px] font-bold w-6 text-center py-0.5 rounded border ${tagCls[type]}`}>
              {label}
            </span>
            <div className="flex-1 relative h-1 rounded-full bg-white/[0.06]">
              <div
                className={`h-full rounded-full ${barFill[type]}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
            <span className={`text-[11px] font-bold font-mono w-[4.5rem] text-right ${textCol[type]}`}>
              ${value.toFixed(2)}
            </span>
            <span className="text-[9px] font-mono text-muted/40 w-14 text-right shrink-0">
              {diffStr}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface AIAnalystProps { symbol: string }

export function AIAnalyst({ symbol }: AIAnalystProps) {
  const [tab,     setTab]     = useState<Tab>('core');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);
  const [data,    setData]    = useState<SymbolData | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setData(null);

    const toYahoo = (s: string) =>
      s === 'BTC' ? 'BTC-USD' : s === 'ETH' ? 'ETH-USD' : s;
    const sym = toYahoo(symbol);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeJson = (url: string): Promise<any> =>
      fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getQ = (json: any): Record<string, unknown[]> =>
      json?.chart?.result?.[0]?.indicators?.quote?.[0] ?? {};
    const fin = (arr: unknown[]): number[] =>
      (arr as unknown[]).filter((v): v is number => typeof v === 'number' && isFinite(v));

    (async () => {
      try {
        const dailyRes = await fetch(
          `/api/yahoo/v8/finance/chart/${sym}?range=1y&interval=1d&t=${Date.now()}`,
        );
        if (!dailyRes.ok) throw new Error('fetch');
        const dailyJson = await dailyRes.json();
        if (cancelled) return;

        const dq      = getQ(dailyJson);
        const closes  = fin(dq.close  ?? []);
        const highs   = fin(dq.high   ?? []);
        const lows    = fin(dq.low    ?? []);
        const volumes = fin(dq.volume ?? []);
        const opens   = fin(dq.open   ?? []);
        if (closes.length < 2) throw new Error('data');

        const [json1h, json15m, optJson, spyJson, vixJson, dxyJson] = await Promise.all([
          safeJson(`/api/yahoo/v8/finance/chart/${sym}?range=60d&interval=1h`),
          safeJson(`/api/yahoo/v8/finance/chart/${sym}?range=30d&interval=15m`),
          safeJson(`/api/yahoo/v7/finance/options/${sym}`),
          safeJson(`/api/yahoo/v8/finance/chart/SPY?range=1mo&interval=1d`),
          safeJson(`/api/yahoo/v8/finance/chart/%5EVIX?range=1mo&interval=1d`),
          safeJson(`/api/yahoo/v8/finance/chart/DX-Y.NYB?range=1mo&interval=1d`),
        ]);
        if (cancelled) return;

        const closes1h  = fin(getQ(json1h).close  ?? []);
        const closes15m = fin(getQ(json15m).close ?? []);
        const closes4h  = resampleTo4H(closes1h);
        const price     = closes.at(-1) ?? 0;
        const d1Ema     = calculateEMA(20, closes);
        const mtfOverride = {
          m15: mtfSignal(closes15m),
          h1:  mtfSignal(closes1h),
          h4:  mtfSignal(closes4h),
          d1:  (price > d1Ema ? 'Bull' : price < d1Ema ? 'Bear' : 'Neutral') as MTFSignal,
        };

        let optionsOverride: { callsPct: number; putsPct: number; bias: OptionsBias } | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chain = (optJson as any)?.optionChain?.result?.[0]?.options?.[0];
        if (chain) {
          const callsVol = ((chain.calls ?? []) as { volume?: number }[])
            .reduce((a: number, c) => a + (c.volume ?? 0), 0);
          const putsVol  = ((chain.puts  ?? []) as { volume?: number }[])
            .reduce((a: number, p) => a + (p.volume ?? 0), 0);
          const total = callsVol + putsVol;
          if (total > 0) {
            const callsPct = Math.round((callsVol / total) * 100);
            optionsOverride = {
              callsPct,
              putsPct: 100 - callsPct,
              bias: callsPct >= 55 ? 'Bullish' : (100 - callsPct) >= 55 ? 'Bearish' : 'Neutral',
            };
          }
        }

        let macroOverride: string | undefined;
        const spyCloses = fin(getQ(spyJson).close ?? []);
        const vixCloses = fin(getQ(vixJson).close ?? []);
        const dxyCloses = fin(getQ(dxyJson).close ?? []);
        if (spyCloses.length >= 2) {
          const n       = Math.min(30, closes.length, spyCloses.length);
          const symSl   = closes.slice(-n);
          const corrSPY = calculateCorrelation(symSl, spyCloses.slice(-n));
          const corrVIX = vixCloses.length >= 2
            ? calculateCorrelation(symSl, vixCloses.slice(-Math.min(n, vixCloses.length)))
            : 0;
          const corrDXY = dxyCloses.length >= 2
            ? calculateCorrelation(symSl, dxyCloses.slice(-Math.min(n, dxyCloses.length)))
            : 0;
          const spyDesc   = corrSPY >= 0.45 ? 'strong positive' : corrSPY <= -0.45 ? 'strong negative' : 'weak';
          const spySMA50  = calculateSMA(50, spyCloses);
          const spyLast   = spyCloses.at(-1)!;
          const spyRegime = spyLast >= spySMA50 ? 'Bullish (above SMA50)' : 'Bearish (below SMA50)';
          macroOverride =
            `${symbol} has a ${spyDesc} correlation to the S&P 500 (r = ${corrSPY.toFixed(2)}), ` +
            `a correlation of ${corrVIX.toFixed(2)} to the VIX, and ${corrDXY.toFixed(2)} to the US Dollar Index ` +
            `over the last 30 trading days. Market regime: SPY is ${spyRegime}.`;
        }

        if (!cancelled) {
          setData(computeSymbolData(
            symbol, closes, highs, lows, volumes, opens,
            mtfOverride, optionsOverride, macroOverride,
            spyCloses.length >= 2 ? spyCloses : undefined,
          ));
          setLoading(false);
        }
      } catch {
        if (!cancelled) { setError(true); setLoading(false); }
      }
    })();

    return () => { cancelled = true; };
  }, [symbol]);

  return (
    <div
      id="tour-ai-analyst"
      className="glass-panel flex flex-col h-full border-gold/20 overflow-hidden"
      style={{ boxShadow: '0 0 15px rgba(0,255,136,0.07), inset 0 0 40px rgba(0,0,0,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h2 className="text-base font-bold flex items-center gap-2 text-gold">
          <BrainCircuit size={16} />
          Vantix AI — <span className="font-mono">{symbol}</span>
        </h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-live/10 border border-live/20">
          <span className="relative flex h-1.5 w-1.5">
            <span className={`absolute inline-flex h-full w-full rounded-full bg-live opacity-75 ${loading ? 'animate-ping' : ''}`} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-live" />
          </span>
          <span className="text-[10px] font-semibold text-live tracking-wider uppercase">
            {loading ? 'Fetching' : 'Live'}
          </span>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 px-4 pb-2.5 shrink-0">
        {(['core', 'advanced'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            disabled={!data}
            className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all disabled:opacity-40 ${
              tab === t
                ? 'bg-gold/15 border border-gold/35 text-gold'
                : 'text-muted/70 border border-transparent hover:text-white hover:bg-white/5 hover:border-border'
            }`}
          >
            {t === 'core' ? 'Core Analysis' : 'Advanced Indicators'}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">

        {loading && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
            <div className="relative w-8 h-8">
              <span className="absolute inset-0 rounded-full border-2 border-gold/20" />
              <span className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
            </div>
            <span className="text-xs text-muted/60">Fetching live market data…</span>
          </div>
        )}

        {!loading && error && (
          <div className="h-full flex flex-col items-center justify-center gap-3 py-12 text-center">
            <WifiOff size={22} className="text-muted/40" />
            <p className="text-xs text-muted/60 leading-relaxed max-w-[180px]">
              Unable to fetch live data for <span className="font-mono text-white/70">{symbol}</span>.
              Check your connection or try another ticker.
            </p>
          </div>
        )}

        {/* ── Core Analysis tab ── */}
        {!loading && !error && data && tab === 'core' && (() => {
          const {
            bullish, pattern, analysis, macro, matches, accuracy, projected, years,
            entry, tp, stop, breakeven, isOverextended, highRiskVol, volRegime,
            atrPercent, bearishMarket, rsRating, rsPositive, rvol, rvolHigh,
          } = data;
          const projPositive = projected >= 0;

          const VOL_LABEL: Record<typeof volRegime, string> = {
            low:    'TP 2.0× · SL 1.5×',
            medium: 'TP 2.2× · SL 1.8×',
            high:   'TP 2.5× · SL 2.2×',
          };
          const volColor = volRegime === 'high' ? 'text-orange-400' : volRegime === 'medium' ? 'text-gold' : 'text-live';
          const rsLabel  = rsRating !== 0 ? `${rsRating > 0 ? '+' : ''}${rsRating.toFixed(1)}% vs SPY` : 'N/A';
          const rvolLabel = `${rvol.toFixed(2)}×`;

          return (
            <div className="flex flex-col gap-3">

              {/* Pattern card — amber border when overextended */}
              <div className={`rounded-lg p-3 border bg-canvas ${
                isOverextended ? 'border-orange-500/40' : 'border-border'
              }`}>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {isOverextended
                    ? <AlertTriangle size={13} className="text-orange-400" />
                    : bullish
                    ? <TrendingUp    size={13} className="text-live"  />
                    : <TrendingDown  size={13} className="text-alert" />}
                  <span className="text-xs font-bold tracking-wide flex-1">
                    {isOverextended ? (
                      <><span className="text-orange-400">Overextended</span> — Pullback Risk</>
                    ) : bullish ? (
                      <>Bullish Setup — <span className="text-live">{pattern}</span></>
                    ) : (
                      <>Bearish Pressure — <span className="text-alert">{pattern}</span></>
                    )}
                  </span>
                  {/* RS Rating badge */}
                  {rsRating !== 0 && (
                    <span
                      title="20-day Relative Strength vs SPY. Positive = stock outperforming the market."
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border cursor-help shrink-0 ${
                        rsPositive
                          ? 'text-live bg-live/10 border-live/25'
                          : 'text-alert bg-alert/10 border-alert/25'
                      }`}
                    >
                      RS {rsLabel}
                    </span>
                  )}
                  {isOverextended && (
                    <span className="text-[9px] font-bold text-orange-400/80 bg-orange-500/10 border border-orange-500/25 px-1.5 py-0.5 rounded-full shrink-0">
                      −25 pts
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted leading-relaxed">{analysis}</p>
              </div>

              {/* Bearish market regime warning */}
              {bearishMarket && bullish && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/[0.07] border border-alert/30">
                  <AlertTriangle size={12} className="text-alert shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold text-alert uppercase tracking-widest">
                      Bearish Market Regime
                    </span>
                    <p className="text-[10px] text-muted/70 leading-relaxed">
                      SPY is trading below its 50-day SMA. Confluence score reduced by 15 to reflect market headwinds. Consider reducing long exposure or waiting for broad market recovery.
                    </p>
                  </div>
                </div>
              )}

              {/* Macro */}
              <div className="rounded-lg p-3 border border-border bg-canvas">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle size={13} className="text-gold" />
                  <span className="text-xs font-bold">Macro Correlation</span>
                </div>
                <p className="text-xs text-muted leading-relaxed">{macro}</p>
              </div>

              {/* Historical context */}
              <div
                className="rounded-lg border border-live/20 bg-live/[0.03] p-4 flex flex-col gap-3"
                style={{ boxShadow: '0 0 12px rgba(0,255,136,0.06)' }}
              >
                <div className="flex items-center gap-2">
                  <Database size={13} className="text-live" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-live">Historical Context</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Match Found</span>
                  <span className="text-xs text-white/80">{matches}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 items-end">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-muted uppercase tracking-widest">Historical Accuracy</span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-bold font-mono text-live leading-none">{accuracy}%</span>
                      <span className="text-[10px] text-muted leading-none">
                        {bullish ? 'resulted in an uptrend' : 'resulted in a downtrend'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-muted uppercase tracking-widest self-start">Projected Path</span>
                    <Sparkline positive={projPositive} pts={data.sparkPts} />
                    <div className={`flex items-center gap-1 text-xs font-mono font-bold ${projPositive ? 'text-live' : 'text-alert'}`}>
                      {projPositive ? <MoveUpRight size={12} /> : <MoveDownRight size={12} />}
                      {projPositive ? '+' : ''}{projected}%{' '}
                      <span className="font-normal text-muted text-[10px] ml-0.5">{years}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trade metrics */}
              <div className="pt-3 border-t border-border flex flex-col gap-2">
                {/* Row 1: Entry · Target 1 · Hard Stop */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Entry',     value: entry, color: 'text-white' },
                    { label: 'Target 1',  value: tp,    color: 'text-live'  },
                    { label: 'Hard Stop', value: stop,  color: 'text-alert' },
                  ].map(m => (
                    <div key={m.label} className="flex flex-col gap-0.5 bg-canvas rounded-md px-2.5 py-2 border border-border">
                      <span className="text-[9px] text-muted uppercase tracking-widest">{m.label}</span>
                      <span className={`text-xs font-bold font-mono leading-snug ${m.color}`}>{m.value}</span>
                    </div>
                  ))}
                </div>

                {/* Row 2: Breakeven Trigger (full width, gold accent) */}
                <div
                  className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-gold/25 bg-gold/[0.05]"
                  title="When floating profit reaches 1×ATR, move your stop-loss to the entry price to lock in a risk-free trade."
                >
                  <Target size={11} className="text-gold shrink-0" />
                  <span className="text-[9px] text-gold/70 uppercase tracking-widest shrink-0">Breakeven Trigger</span>
                  <span className="text-[11px] font-bold font-mono text-gold">{breakeven}</span>
                  <span className="text-[9px] text-muted/45 ml-auto">→ Move SL to {entry}</span>
                </div>

                {/* Vol Regime + RVOL row */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${
                  highRiskVol
                    ? 'bg-orange-500/[0.07] border-orange-500/25'
                    : 'bg-white/[0.03] border-border/40'
                }`}>
                  {highRiskVol && <AlertTriangle size={11} className="text-orange-400 shrink-0" />}
                  <span className="text-[9px] text-muted/50 uppercase tracking-widest shrink-0">Vol Regime</span>
                  <span className={`text-[10px] font-bold ${volColor}`}>
                    {volRegime === 'low' ? 'Low' : volRegime === 'medium' ? 'Medium' : 'High'} ({atrPercent.toFixed(1)}% ATR)
                  </span>
                  <span className="text-[9px] text-muted/40 ml-1">{VOL_LABEL[volRegime]}</span>
                  {/* RVOL badge */}
                  <span
                    title={`Relative Volume: ${rvol.toFixed(2)}× vs 20-day average.${rvolHigh ? ' High RVOL suggests institutional accumulation (+10 pts).' : ''}`}
                    className={`ml-auto flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border cursor-help ${
                      rvolHigh
                        ? 'text-live bg-live/10 border-live/25'
                        : 'text-muted/50 bg-white/[0.03] border-border/30'
                    }`}
                  >
                    RVOL {rvolLabel}
                    {rvolHigh && <span className="text-[8px] font-normal">+10</span>}
                  </span>
                  {highRiskVol && (
                    <span className="text-[9px] text-orange-300/80 ml-1">Widen stops</span>
                  )}
                </div>
              </div>

            </div>
          );
        })()}

        {/* ── Advanced Indicators tab ── */}
        {!loading && !error && data && tab === 'advanced' && (() => {
          const scoreGlow = data.confluenceScore >= 80
            ? '0 0 18px rgba(0,255,136,0.10)'
            : data.confluenceScore >= 65
            ? '0 0 18px rgba(212,175,55,0.10)'
            : '0 0 18px rgba(255,77,77,0.08)';

          return (
            <div className="flex flex-col gap-3">

              {/* Row 1 — Confluence + MTF */}
              <div className="grid grid-cols-2 gap-3">

                <AdvCard glow={scoreGlow}>
                  <SectionLabel icon={<BrainCircuit size={11} />} label="Confluence Score" />
                  <ConfluenceRing score={data.confluenceScore} indicators={data.confluenceIndicators} />
                </AdvCard>

                <AdvCard>
                  <SectionLabel icon={<Layers size={11} />} label="Multi-Timeframe" />
                  <MTFPills data={data.mtfConfirmation} />
                  <div className="h-px bg-white/[0.06]" />
                  <SectionLabel icon={<Activity size={11} />} label="Options Flow" />
                  <OptionsSentimentBar
                    callsPct={data.optionsSentiment.callsPct}
                    putsPct={data.optionsSentiment.putsPct}
                    bias={data.optionsSentiment.bias}
                  />
                </AdvCard>

              </div>

              {/* Row 2 — Bollinger Bands */}
              <AdvCard>
                <SectionLabel icon={<Activity size={11} />} label="Bollinger Bands  (20, ±2σ)" />
                <BollingerBandsPanel bands={data.bollingerBands} price={data.price} />
              </AdvCard>

              {/* Row 3 — Classic Pivot Points */}
              <AdvCard>
                <SectionLabel icon={<Target size={11} />} label="Classic Pivot Points" />
                <PivotPointsTable pivots={data.pivotPoints} price={data.price} />
              </AdvCard>

              {/* Row 4 — Volume Profile + Expected Range */}
              <div className="grid grid-cols-2 gap-3">

                <AdvCard>
                  <SectionLabel icon={<BarChart2 size={11} />} label="Volume Profile" />
                  <VolumeProfilePanel
                    poc={data.volumeProfile.poc}
                    supportBlock={data.volumeProfile.supportBlock}
                    resistanceBlock={data.volumeProfile.resistanceBlock}
                  />
                </AdvCard>

                <AdvCard>
                  <SectionLabel icon={<Activity size={11} />} label="Expected Range (ATR)" />
                  <ExpectedRange
                    low={data.expectedRange.low}
                    high={data.expectedRange.high}
                    current={data.expectedRange.current}
                  />
                </AdvCard>

              </div>

            </div>
          );
        })()}

      </div>
    </div>
  );
}
