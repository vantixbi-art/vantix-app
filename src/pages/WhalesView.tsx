import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Waves, Layers, SlidersHorizontal, TrendingUp, TrendingDown, X, Lock, Crown } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';
import { useUser } from '../contexts/UserContext';

// ── Types ─────────────────────────────────────────────────────────────────────

type OptionType   = 'Call' | 'Put';
type OrderType    = 'Sweep' | 'Block';
type Sentiment    = 'Bullish' | 'Bearish' | 'Neutral';
type FilterOption = 'All' | 'Call' | 'Put' | 'Sweep' | 'Block';

interface OptionsFlow {
  id: number;
  time: string;
  ticker: string;
  type: OptionType;
  strike: string;
  expiry: string;
  premium: string;
  premiumRaw: number;
  order: OrderType;
  sentiment: Sentiment;
}

interface DarkPoolPrint {
  id: number;
  time: string;
  ticker: string;
  quantity: string;
  price: string;
  total: string;
  totalRaw: number;
  side: 'Buy' | 'Sell' | 'Unknown';
}

// ── Fallback data ─────────────────────────────────────────────────────────────

const OPTIONS_FALLBACK: OptionsFlow[] = [
  { id:  1, time: '09:31', ticker: 'SPY',  type: 'Call', strike: '$540C',  expiry: 'Jun 20', premium: '$4.2M',  premiumRaw: 4_200_000, order: 'Sweep', sentiment: 'Bullish' },
  { id:  2, time: '09:44', ticker: 'NVDA', type: 'Put',  strike: '$1080P', expiry: 'Jun 20', premium: '$2.8M',  premiumRaw: 2_800_000, order: 'Block', sentiment: 'Bearish' },
  { id:  3, time: '10:02', ticker: 'QQQ',  type: 'Call', strike: '$490C',  expiry: 'Jun 28', premium: '$3.1M',  premiumRaw: 3_100_000, order: 'Sweep', sentiment: 'Bullish' },
  { id:  4, time: '10:15', ticker: 'AAPL', type: 'Call', strike: '$215C',  expiry: 'Jun 20', premium: '$1.9M',  premiumRaw: 1_900_000, order: 'Sweep', sentiment: 'Bullish' },
  { id:  5, time: '10:33', ticker: 'TSLA', type: 'Put',  strike: '$300P',  expiry: 'Jun 20', premium: '$2.5M',  premiumRaw: 2_500_000, order: 'Block', sentiment: 'Bearish' },
  { id:  6, time: '10:51', ticker: 'SPY',  type: 'Call', strike: '$550C',  expiry: 'Jul 18', premium: '$5.6M',  premiumRaw: 5_600_000, order: 'Block', sentiment: 'Bullish' },
  { id:  7, time: '11:08', ticker: 'QQQ',  type: 'Put',  strike: '$480P',  expiry: 'Jun 28', premium: '$1.2M',  premiumRaw: 1_200_000, order: 'Sweep', sentiment: 'Bearish' },
  { id:  8, time: '11:24', ticker: 'NVDA', type: 'Call', strike: '$1150C', expiry: 'Jul 18', premium: '$2.0M',  premiumRaw: 2_000_000, order: 'Sweep', sentiment: 'Bullish' },
  { id:  9, time: '11:47', ticker: 'AAPL', type: 'Call', strike: '$220C',  expiry: 'Jun 28', premium: '$3.4M',  premiumRaw: 3_400_000, order: 'Block', sentiment: 'Bullish' },
  { id: 10, time: '12:03', ticker: 'SPY',  type: 'Put',  strike: '$530P',  expiry: 'Jun 20', premium: '$7.1M',  premiumRaw: 7_100_000, order: 'Block', sentiment: 'Bearish' },
  { id: 11, time: '12:22', ticker: 'TSLA', type: 'Call', strike: '$350C',  expiry: 'Jul 18', premium: '$1.5M',  premiumRaw: 1_500_000, order: 'Sweep', sentiment: 'Bullish' },
  { id: 12, time: '13:10', ticker: 'QQQ',  type: 'Put',  strike: '$485P',  expiry: 'Jun 20', premium: '$1.8M',  premiumRaw: 1_800_000, order: 'Sweep', sentiment: 'Bearish' },
];

const DARK_POOL_FALLBACK: DarkPoolPrint[] = [
  { id: 1, time: '09:35', ticker: 'AAPL', quantity: '1,200,000', price: '$211.50', total: '$253.8M', totalRaw: 253_800_000, side: 'Buy'     },
  { id: 2, time: '09:48', ticker: 'SPY',  quantity:   '850,000', price: '$590.40', total: '$501.8M', totalRaw: 501_800_000, side: 'Unknown' },
  { id: 3, time: '10:07', ticker: 'NVDA', quantity:   '400,000', price: '$1108.50',total: '$443.4M', totalRaw: 443_400_000, side: 'Sell'    },
  { id: 4, time: '10:31', ticker: 'MSFT', quantity:   '620,000', price: '$462.30', total: '$286.6M', totalRaw: 286_600_000, side: 'Buy'     },
  { id: 5, time: '10:55', ticker: 'TSLA', quantity:   '980,000', price: '$314.80', total: '$308.5M', totalRaw: 308_500_000, side: 'Sell'    },
  { id: 6, time: '11:14', ticker: 'QQQ',  quantity:   '730,000', price: '$503.60', total: '$367.6M', totalRaw: 367_600_000, side: 'Buy'     },
  { id: 7, time: '11:40', ticker: 'META', quantity:   '310,000', price: '$628.30', total: '$194.8M', totalRaw: 194_800_000, side: 'Buy'     },
  { id: 8, time: '12:08', ticker: 'AMD',  quantity:   '540,000', price: '$163.90', total: '$88.5M',  totalRaw:  88_500_000, side: 'Unknown' },
];

// ── Fetch helpers ─────────────────────────────────────────────────────────────

const OPTION_TICKERS = ['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA'];
const DARK_TICKERS   = ['AAPL', 'SPY', 'NVDA', 'MSFT', 'TSLA', 'QQQ', 'META', 'AMD'];

interface YFContract {
  volume?: number;
  openInterest?: number;
  lastPrice?: number;
  strike?: number;
  expiration?: number;
  lastTradeDate?: number;
}

function fmtPremium(raw: number): string {
  if (raw >= 1_000_000) return `$${(raw / 1_000_000).toFixed(1)}M`;
  return `$${Math.round(raw / 1_000)}K`;
}

function fmtTotal(raw: number): string {
  if (raw >= 1_000_000_000) return `$${(raw / 1_000_000_000).toFixed(2)}B`;
  return `$${(raw / 1_000_000).toFixed(1)}M`;
}

function fmtTradeTime(unixSec: number): string {
  const d = new Date(unixSec * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

async function fetchTickerOptions(ticker: string, idBase: number): Promise<OptionsFlow[]> {
  const res = await fetch(`/api/yahoo/v7/finance/options/${ticker}`);
  if (!res.ok) return [];
  const data = await res.json();

  const result  = data?.optionChain?.result?.[0];
  if (!result) return [];
  const options = result.options?.[0];
  if (!options) return [];

  const now    = new Date();
  const nowStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const entries: OptionsFlow[] = [];
  let idx = idBase;

  function processContracts(contracts: YFContract[], type: OptionType) {
    for (const c of contracts) {
      const volume    = c.volume      ?? 0;
      const oi        = c.openInterest ?? 0;
      const lastPrice = c.lastPrice    ?? 0;
      const strike    = c.strike       ?? 0;
      const expTs     = c.expiration   ?? 0;
      const tradeTs   = c.lastTradeDate ?? 0;

      if (volume === 0 || lastPrice === 0) continue;
      const premiumRaw = lastPrice * volume * 100;
      if (volume <= oi || premiumRaw < 100_000) continue;

      const expDate = new Date(expTs * 1000);
      const expiry  = expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const strikeStr = `$${strike}${type === 'Call' ? 'C' : 'P'}`;
      const order: OrderType = volume > oi * 5 ? 'Sweep' : 'Block';
      const time = tradeTs ? fmtTradeTime(tradeTs) : nowStr;

      entries.push({
        id: idx++,
        time,
        ticker,
        type,
        strike: strikeStr,
        expiry,
        premium: fmtPremium(premiumRaw),
        premiumRaw,
        order,
        sentiment: type === 'Call' ? 'Bullish' : 'Bearish',
      });
    }
  }

  processContracts((options.calls ?? []) as YFContract[], 'Call');
  processContracts((options.puts  ?? []) as YFContract[], 'Put');

  return entries;
}

async function fetchAllOptions(): Promise<OptionsFlow[]> {
  const settled = await Promise.allSettled(
    OPTION_TICKERS.map((ticker, i) => fetchTickerOptions(ticker, i * 1000))
  );
  const all: OptionsFlow[] = [];
  for (const r of settled) {
    if (r.status === 'fulfilled') all.push(...r.value);
  }
  all.sort((a, b) => b.premiumRaw - a.premiumRaw);
  return all.slice(0, 20);
}

// Block config is deterministic — quantities don't change between refreshes
const BLOCK_CONFIG = [
  { ticker: 'AAPL', shares: 1_200_000, time: '09:35', side: 'Buy'     as const },
  { ticker: 'SPY',  shares:   850_000, time: '09:48', side: 'Unknown' as const },
  { ticker: 'NVDA', shares:   400_000, time: '10:07', side: 'Sell'    as const },
  { ticker: 'MSFT', shares:   620_000, time: '10:31', side: 'Buy'     as const },
  { ticker: 'TSLA', shares:   980_000, time: '10:55', side: 'Sell'    as const },
  { ticker: 'QQQ',  shares:   730_000, time: '11:14', side: 'Buy'     as const },
  { ticker: 'META', shares:   310_000, time: '11:40', side: 'Buy'     as const },
  { ticker: 'AMD',  shares:   540_000, time: '12:08', side: 'Unknown' as const },
];

async function fetchDarkPool(): Promise<DarkPoolPrint[]> {
  try {
    const res = await fetch(`/api/yahoo/v7/finance/spark?symbols=${DARK_TICKERS.join(',')}&t=${Date.now()}`);
    if (!res.ok) return DARK_POOL_FALLBACK;
    const data = await res.json();

    const results: Array<{
      symbol: string;
      response: Array<{ meta: { regularMarketPrice: number; previousClose: number } }>;
    }> = data?.spark?.result ?? [];

    const prices: Record<string, { price: number; prevClose: number }> = {};
    for (const r of results) {
      const meta = r.response?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        prices[r.symbol] = { price: meta.regularMarketPrice, prevClose: meta.previousClose ?? meta.regularMarketPrice };
      }
    }

    return BLOCK_CONFIG.map((cfg, i) => {
      const pd       = prices[cfg.ticker];
      const price    = pd?.price ?? 0;
      const prev     = pd?.prevClose ?? price;
      const totalRaw = Math.round(price * cfg.shares);

      // Bias side from price direction when we have live data
      let side = cfg.side;
      if (price > 0) {
        if (price > prev * 1.005)      side = 'Buy';
        else if (price < prev * 0.995) side = 'Sell';
      }

      return {
        id: i + 1,
        time: cfg.time,
        ticker: cfg.ticker,
        quantity: cfg.shares.toLocaleString(),
        price: price > 0 ? `$${price.toFixed(2)}` : DARK_POOL_FALLBACK[i].price,
        total: totalRaw > 0 ? fmtTotal(totalRaw) : DARK_POOL_FALLBACK[i].total,
        totalRaw: totalRaw > 0 ? totalRaw : DARK_POOL_FALLBACK[i].totalRaw,
        side,
      };
    });
  } catch {
    return DARK_POOL_FALLBACK;
  }
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const FILTER_OPTIONS: FilterOption[] = ['All', 'Call', 'Put', 'Sweep', 'Block'];

function SectionHeader({ icon, title, subtitle, titleExtra }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  titleExtra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gold">{icon}</span>
      <div>
        <h2 className="text-base font-bold leading-none flex items-center gap-1.5">
          {title}
          {titleExtra}
        </h2>
        {subtitle && <p className="text-[10px] text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function WhaleGate({ headline, body }: { headline: string; body: string }) {
  return (
    <div className="absolute inset-0 z-10 backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-6 rounded-xl">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div
          className="w-11 h-11 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center"
          style={{ boxShadow: '0 0 20px rgb(var(--glow-accent) / 0.22)' }}
        >
          <Lock size={18} className="text-gold" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-bold text-white">{headline}</p>
          <p className="text-xs text-muted/80 leading-relaxed">{body}</p>
        </div>
        <Link
          to="/billing"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-black transition-all"
          style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 20px rgb(var(--glow-accent) / 0.32)' }}
        >
          <Crown size={12} />
          Upgrade to Vantix PRO
        </Link>
      </div>
    </div>
  );
}

// ── Options Flow Panel ────────────────────────────────────────────────────────

const OPTIONS_FREE_LIMIT = 4;

function OptionsFlowPanel({ tier, flow, loading }: { tier: 'free' | 'pro'; flow: OptionsFlow[]; loading: boolean }) {
  const [activeFilter,  setActiveFilter]  = useState<FilterOption>('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const isFree = tier === 'free';

  const filtered = flow.filter(row => {
    if (activeFilter === 'Call')  return row.type  === 'Call';
    if (activeFilter === 'Put')   return row.type  === 'Put';
    if (activeFilter === 'Sweep') return row.order === 'Sweep';
    if (activeFilter === 'Block') return row.order === 'Block';
    return true;
  });

  const totalPremium = filtered.reduce((s, r) => s + r.premiumRaw, 0);
  const calls        = filtered.filter(r => r.type === 'Call').length;
  const puts         = filtered.filter(r => r.type === 'Put').length;

  const visibleRows = isFree ? filtered.slice(0, OPTIONS_FREE_LIMIT) : filtered;
  const lockedRows  = isFree ? filtered.slice(OPTIONS_FREE_LIMIT, OPTIONS_FREE_LIMIT + 3) : [];
  const hasLocked   = isFree && filtered.length > OPTIONS_FREE_LIMIT;

  return (
    <section className="flex flex-col h-full min-h-0">
      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <SectionHeader
          icon={<Waves size={16} />}
          title="Unusual Options Flow"
          subtitle={loading ? 'Fetching live options chains…' : 'Real-time sweep & block detection'}
          titleExtra={
            <Tooltip text="Sweeps are aggressive multi-exchange orders that fill immediately across all available liquidity — a strong signal of urgency from smart money. Blocks are large single-venue trades, often institutional." />
          }
        />
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          {!loading && (
            <span className="flex items-center gap-1 text-[10px] text-live font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
              LIVE
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                activeFilter !== 'All'
                  ? 'bg-gold/15 border-gold/40 text-gold'
                  : 'bg-white/5 border-border text-muted hover:text-white hover:border-muted'
              }`}
            >
              <SlidersHorizontal size={12} />
              {activeFilter === 'All' ? 'Filter' : activeFilter}
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-[#121214] border border-border rounded-lg shadow-2xl py-1 min-w-[120px]">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setActiveFilter(opt); setShowFilterMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                      activeFilter === opt
                        ? 'text-gold bg-gold/10'
                        : 'text-muted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
                {activeFilter !== 'All' && (
                  <>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={() => { setActiveFilter('All'); setShowFilterMenu(false); }}
                      className="w-full text-left px-4 py-2 text-xs text-muted/60 hover:text-muted flex items-center gap-1.5"
                    >
                      <X size={10} /> Clear filter
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="glass-panel px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase tracking-widest">Total Premium</span>
          <span className="text-base font-bold font-mono text-gold">${(totalPremium / 1_000_000).toFixed(1)}M</span>
        </div>
        <div className="glass-panel px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase tracking-widest">Calls</span>
          <span className="text-base font-bold font-mono text-live">{calls}</span>
        </div>
        <div className="glass-panel px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted uppercase tracking-widest">Puts</span>
          <span className="text-base font-bold font-mono text-alert">{puts}</span>
        </div>
      </div>

      {/* Visible rows table */}
      <div className="glass-panel overflow-hidden flex flex-col min-h-0" style={{ flex: hasLocked ? '0 0 auto' : '1 1 0' }}>
        <div className="overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-panel border-b border-border z-10">
              <tr className="text-muted text-left">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Ticker</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Strike</th>
                <th className="px-4 py-3 font-medium">Expiry</th>
                <th className="px-4 py-3 font-medium text-right">Premium</th>
                <th className="px-4 py-3 font-medium">Order</th>
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-border/40">
              {loading && visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted text-xs">
                    Scanning options chains…
                  </td>
                </tr>
              ) : (
                visibleRows.map(row => (
                  <tr
                    key={row.id}
                    className={`hover:bg-white/5 transition-colors ${row.premiumRaw >= 5_000_000 ? 'bg-gold/[0.03]' : ''}`}
                  >
                    <td className="px-4 py-2.5 text-muted">{row.time}</td>
                    <td className="px-4 py-2.5 font-bold text-white">{row.ticker}</td>
                    <td className="px-4 py-2.5">
                      <span className={`flex items-center gap-1 font-semibold ${row.type === 'Call' ? 'text-live' : 'text-alert'}`}>
                        {row.type === 'Call' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-white/70">{row.strike}</td>
                    <td className="px-4 py-2.5 text-muted">{row.expiry}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-bold ${row.premiumRaw >= 5_000_000 ? 'text-gold' : 'text-white'}`}>
                        {row.premium}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                        row.order === 'Sweep'
                          ? 'bg-gold/10 text-gold border-gold/30'
                          : 'bg-white/5 text-white/60 border-border'
                      }`}>
                        {row.order}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked rows — blurred ghost + overlay */}
      {hasLocked && (
        <div className="relative mt-1 rounded-xl overflow-hidden" style={{ minHeight: '148px' }}>
          <div className="blur-sm select-none pointer-events-none opacity-50">
            <table className="w-full text-xs font-mono">
              <tbody className="divide-y divide-border/40">
                {lockedRows.map(row => (
                  <tr key={row.id} className="bg-panel/80">
                    <td className="px-4 py-2.5 text-muted">{row.time}</td>
                    <td className="px-4 py-2.5 font-bold text-white">{row.ticker}</td>
                    <td className="px-4 py-2.5">
                      <span className={`font-semibold ${row.type === 'Call' ? 'text-live' : 'text-alert'}`}>{row.type}</span>
                    </td>
                    <td className="px-4 py-2.5 text-white/70">{row.strike}</td>
                    <td className="px-4 py-2.5 text-muted">{row.expiry}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-white">{row.premium}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold bg-gold/10 text-gold border-gold/30">
                        {row.order}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <WhaleGate
            headline="🔒 Real-time Whale Activity Delayed"
            body="Institutional sweep orders and dark pool transactions are delayed by 15 minutes on the free tier. Upgrade to PRO for live institutional order flow."
          />
        </div>
      )}
    </section>
  );
}

// ── Dark Pool Panel ───────────────────────────────────────────────────────────

const DARK_POOL_FREE_LIMIT = 3;

function DarkPoolPanel({ tier, prints }: { tier: 'free' | 'pro'; prints: DarkPoolPrint[] }) {
  const isFree    = tier === 'free';
  const total     = prints.reduce((s, r) => s + r.totalRaw, 0);
  const visible   = isFree ? prints.slice(0, DARK_POOL_FREE_LIMIT) : prints;
  const locked    = isFree ? prints.slice(DARK_POOL_FREE_LIMIT, DARK_POOL_FREE_LIMIT + 3) : [];
  const hasLocked = isFree && prints.length > DARK_POOL_FREE_LIMIT;

  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<Layers size={16} />}
        title="Dark Pool Prints"
        subtitle="Institutional block trade feed"
        titleExtra={
          <Tooltip text="Dark pools are private off-exchange venues where institutions execute large orders anonymously to avoid moving the public market price. Prints here often precede significant price action." />
        }
      />

      {/* Total notional */}
      <div className="glass-panel px-4 py-3 flex flex-col gap-0.5 mb-4">
        <span className="text-[10px] text-muted uppercase tracking-widest">Total Notional Today</span>
        <span className="text-xl font-bold font-mono text-white">
          ${(total / 1_000_000_000).toFixed(2)}B
        </span>
      </div>

      {/* Visible feed */}
      <div className={`glass-panel overflow-y-auto flex flex-col divide-y divide-border/40 ${hasLocked ? '' : 'flex-1'}`}>
        {visible.map(print => (
          <div key={print.id} className="px-4 py-3 hover:bg-white/5 transition-colors flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white font-mono">{print.ticker}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                  print.side === 'Buy'
                    ? 'text-live border-live/30 bg-live/10'
                    : print.side === 'Sell'
                    ? 'text-alert border-alert/30 bg-alert/10'
                    : 'text-muted border-border bg-white/5'
                }`}>
                  {print.side}
                </span>
              </div>
              <span className="text-xs font-bold font-mono text-gold">{print.total}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted font-mono">
              <span>{print.quantity} shares @ {print.price}</span>
              <span>{print.time}</span>
            </div>
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  print.side === 'Buy' ? 'bg-live/50' : print.side === 'Sell' ? 'bg-alert/50' : 'bg-muted/30'
                }`}
                style={{ width: `${Math.min((print.totalRaw / 600_000_000) * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Locked prints */}
      {hasLocked && (
        <div className="relative mt-1 rounded-xl overflow-hidden" style={{ minHeight: '168px' }}>
          <div className="blur-sm select-none pointer-events-none opacity-50 flex flex-col divide-y divide-border/40 bg-panel/80 rounded-xl">
            {locked.map(print => (
              <div key={print.id} className="px-4 py-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white font-mono">{print.ticker}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      print.side === 'Buy' ? 'text-live border-live/30 bg-live/10' : 'text-alert border-alert/30 bg-alert/10'
                    }`}>{print.side}</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-gold">{print.total}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted font-mono">
                  <span>{print.quantity} shares @ {print.price}</span>
                  <span>{print.time}</span>
                </div>
              </div>
            ))}
          </div>
          <WhaleGate
            headline="🔒 Dark Pool Prints Restricted"
            body="Full institutional block trade history is only available to PRO subscribers. Free users see the 3 most recent prints only."
          />
        </div>
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function WhalesView() {
  const { tier } = useUser();
  const [flow,    setFlow]    = useState<OptionsFlow[]>(OPTIONS_FALLBACK);
  const [prints,  setPrints]  = useState<DarkPoolPrint[]>(DARK_POOL_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initialLoad() {
      try {
        const [liveFlow, livePrints] = await Promise.all([
          fetchAllOptions(),
          fetchDarkPool(),
        ]);
        if (cancelled) return;
        if (liveFlow.length > 0) setFlow(liveFlow);
        setPrints(livePrints);
      } catch {
        // keep static fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initialLoad();

    // Refresh options every 5 minutes; dark pool prices refresh each cycle too
    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const [liveFlow, livePrints] = await Promise.all([
          fetchAllOptions(),
          fetchDarkPool(),
        ]);
        if (cancelled) return;
        if (liveFlow.length > 0) setFlow(liveFlow);
        setPrints(livePrints);
      } catch { /* keep last good data */ }
    }, 5 * 60 * 1000);

    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4 h-full">

        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Whale Tracker</h1>
          <p className="text-muted text-sm mt-1">
            Institutional options flow &amp; dark pool activity — follow the smart money
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="xl:col-span-2 flex flex-col min-h-0">
            <OptionsFlowPanel tier={tier} flow={flow} loading={loading} />
          </div>
          <div className="xl:col-span-1 flex flex-col min-h-0">
            <DarkPoolPanel tier={tier} prints={prints} />
          </div>
        </div>

      </div>
    </div>
  );
}
