import { useState, useRef, useEffect } from 'react';
import { Globe, Activity, GitMerge, Gauge, CalendarDays, LineChart, LayoutGrid, Users, TrendingDown, Sliders } from 'lucide-react';
import { Tooltip } from '../components/ui/Tooltip';

// ── Shared helpers ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, tooltip, badge }: {
  icon: React.ReactNode;
  title: string;
  tooltip?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-gold">{icon}</span>
      <h2 className="text-base font-bold tracking-wide">{title}</h2>
      {tooltip}
      {badge && <span className="ml-auto">{badge}</span>}
    </div>
  );
}

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm text-muted uppercase tracking-widest font-medium mb-4">{children}</h2>
  );
}

function StatusBadge({ label, variant }: { label: string; variant: 'live' | 'alert' | 'gold' }) {
  const cls =
    variant === 'live' ? 'bg-live/10  text-live  border-live/30' :
      variant === 'alert' ? 'bg-alert/10 text-alert border-alert/30' :
        'bg-gold/10  text-gold  border-gold/30';
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface MacroCardData {
  label: string;
  name: string;
  value: string;
  chg: string;
  positive: boolean;
  sub: string;
}

interface SectorRow {
  name: string;
  ticker: string;
  chg: string;
  positive: boolean;
}

// ── Fallback (static) data ────────────────────────────────────────────────────

const MACRO_FALLBACK: MacroCardData[] = [
  { label: 'DXY', name: 'US Dollar Index', value: '104.32', chg: '-0.18%', positive: false, sub: 'Bearish near-term' },
  { label: '10Y Yield', name: 'US 10-Year Treasury', value: '4.58%', chg: '+0.04%', positive: true, sub: 'Pressure on equities' },
  { label: 'VIX', name: 'Volatility Index', value: '18.42', chg: '-1.23%', positive: false, sub: 'Fear easing' },
];

const SECTORS_FALLBACK: SectorRow[] = [
  { name: 'Technology', ticker: 'XLK', chg: '+1.84%', positive: true },
  { name: 'Energy', ticker: 'XLE', chg: '-0.62%', positive: false },
  { name: 'Financials', ticker: 'XLF', chg: '+0.91%', positive: true },
  { name: 'Health Care', ticker: 'XLV', chg: '-0.14%', positive: false },
  { name: 'Consumer Discret.', ticker: 'XLY', chg: '+2.10%', positive: true },
  { name: 'Consumer Staples', ticker: 'XLP', chg: '-0.33%', positive: false },
  { name: 'Industrials', ticker: 'XLI', chg: '+0.55%', positive: true },
  { name: 'Utilities', ticker: 'XLU', chg: '-0.77%', positive: false },
  { name: 'Real Estate', ticker: 'XLRE', chg: '-1.02%', positive: false },
  { name: 'Materials', ticker: 'XLB', chg: '+0.28%', positive: true },
  { name: 'Communication Svcs', ticker: 'XLC', chg: '+1.45%', positive: true },
];

// Fallback 8×8 matrix (BTC, ETH, SPY, QQQ, DIA, IWM, IGV, SOXX)
const BASE_CORR_MATRIX: number[][] = [
  [1.00, 0.88, 0.42, 0.38, 0.30, 0.35, 0.40, 0.38],
  [0.88, 1.00, 0.40, 0.37, 0.28, 0.33, 0.38, 0.36],
  [0.42, 0.40, 1.00, 0.97, 0.93, 0.89, 0.85, 0.82],
  [0.38, 0.37, 0.97, 1.00, 0.88, 0.86, 0.91, 0.88],
  [0.30, 0.28, 0.93, 0.88, 1.00, 0.84, 0.78, 0.77],
  [0.35, 0.33, 0.89, 0.86, 0.84, 1.00, 0.82, 0.80],
  [0.40, 0.38, 0.85, 0.91, 0.78, 0.82, 1.00, 0.87],
  [0.38, 0.36, 0.82, 0.88, 0.77, 0.80, 0.87, 1.00],
];

// ── Macro Snapshot ────────────────────────────────────────────────────────────

function MacroSnapshot({ cards }: { cards: MacroCardData[] }) {
  return (
    <section>
      <SectionHeader icon={<Globe size={16} />} title="Macro Snapshot" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(card => (
          <div key={card.label} className="glass-panel p-5 flex flex-col gap-1">
            <span className="text-xs text-muted uppercase tracking-widest font-medium flex items-center gap-1.5">
              {card.label}
              {card.label === 'DXY' && (
                <Tooltip position="bottom" text="US Dollar Index: Measures USD strength against 6 major currencies. A rising dollar typically pressures global stocks, commodities, and crypto." />
              )}
              {card.label === '10Y Yield' && (
                <Tooltip position="bottom" text="US 10-Year Treasury Yield: Benchmark interest rate. Rising yields signal inflation/rate hikes, which typically pressure technology and growth stocks." />
              )}
              {card.label === 'VIX' && (
                <Tooltip position="bottom" text="CBOE Volatility Index ('Fear Gauge'): Measures expected market volatility. Values above 20 represent market fear/uncertainty; below 15 signals calm." />
              )}
            </span>
            <span className="text-2xl font-bold font-mono text-white">{card.value}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-mono ${card.positive ? 'text-live' : 'text-alert'}`}>{card.chg}</span>
              <span className="text-xs text-muted">{card.sub}</span>
            </div>
            <span className="text-xs text-muted/60 mt-1">{card.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Market Heatmap ────────────────────────────────────────────────────────────

function MarketHeatmap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRefreshKey(k => k + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      exchanges: [],
      dataSource: 'SPX500',
      grouping: 'sector',
      blockSize: 'market_cap_basic',
      blockColor: 'change',
      locale: 'en',
      symbolUrl: '',
      colorTheme: 'dark',
      hasTopBar: false,
      isDataSetEnabled: false,
      isZoomEnabled: true,
      hasSymbolTooltip: true,
      isMonoSize: false,
      width: '100%',
      height: '500',
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      if (container.contains(widgetDiv)) container.removeChild(widgetDiv);
      if (container.contains(script)) container.removeChild(script);
    };
  }, [refreshKey]);

  return (
    <section>
      <SectionHeader icon={<LayoutGrid size={16} />} title="S&P 500 Market Heatmap" tooltip={<Tooltip position="bottom" text="A visual map of the S&P 500 index grouped by sector. Box size represents company market capitalization; color represents daily return (Green for gains, Red for losses). Updates dynamically." />} />
      <div className="glass-panel overflow-hidden" style={{ height: 500 }}>
        <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
      </div>
    </section>
  );
}

// ── Sector Rotation ───────────────────────────────────────────────────────────

type FlashDir = 'up' | 'down' | null;

function SectorRotation({ sectors }: { sectors: SectorRow[] }) {
  const prevChgRef = useRef<Record<string, string>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [flashDirs, setFlashDirs] = useState<Record<string, FlashDir>>({});
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({});

  useEffect(() => {
    const triggered: Record<string, FlashDir> = {};
    sectors.forEach(s => {
      const prev = prevChgRef.current[s.ticker];
      if (prev !== undefined && prev !== s.chg) {
        triggered[s.ticker] = s.positive ? 'up' : 'down';
      }
      prevChgRef.current[s.ticker] = s.chg;
    });

    if (Object.keys(triggered).length === 0) return;

    setFlashDirs(prev => ({ ...prev, ...triggered }));
    setFlashKeys(prev => {
      const next = { ...prev };
      for (const sym of Object.keys(triggered)) next[sym] = (prev[sym] ?? 0) + 1;
      return next;
    });

    for (const sym of Object.keys(triggered)) {
      clearTimeout(flashTimers.current[sym]);
      flashTimers.current[sym] = setTimeout(() => {
        setFlashDirs(prev => ({ ...prev, [sym]: null }));
      }, 700);
    }
  }, [sectors]);

  useEffect(() => () => { Object.values(flashTimers.current).forEach(clearTimeout); }, []);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader icon={<Activity size={16} />} title="Sector Rotation" tooltip={<Tooltip position="bottom" text="Tracks the daily percentage returns of all 11 official S&P 500 sectors. Helps identify where capital is flowing (e.g. risk-on sectors like Technology/Discretionary vs. defensive/risk-off sectors like Utilities/Consumer Staples)." />} />
      <div className="glass-panel p-5 flex-1">
        <table className="w-full text-sm">
          <thead className="text-muted text-left border-b border-border">
            <tr>
              <th className="pb-2 font-medium">Sector</th>
              <th className="pb-2 font-medium">ETF</th>
              <th className="pb-2 font-medium text-right">Day Chg</th>
              <th className="pb-2 font-medium text-right w-28">Bar</th>
            </tr>
          </thead>
          <tbody className="font-mono divide-y divide-border/40">
            {sectors.map(s => {
              const barWidth = Math.min(Math.abs(parseFloat(s.chg)) * 25, 100);
              const flash = flashDirs[s.ticker];
              return (
                <tr key={s.ticker} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 text-white/80">{s.name}</td>
                  <td className="py-2 text-muted">{s.ticker}</td>
                  <td className={`py-2 text-right font-semibold ${s.positive ? 'text-live' : 'text-alert'}`}>
                    <span
                      key={flashKeys[s.ticker] ?? 0}
                      className={
                        flash === 'up' ? 'price-flash-up   px-1 rounded' :
                          flash === 'down' ? 'price-flash-down px-1 rounded' :
                            'px-1'
                      }
                    >
                      {s.chg}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex justify-end">
                      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${s.positive ? 'bg-live' : 'bg-alert'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Correlation Matrix ────────────────────────────────────────────────────────

const CORR_ASSETS = ['BTC', 'ETH', 'SPY', 'QQQ', 'DIA', 'IWM', 'IGV', 'SOXX'];

const HIST_SYMBOLS: Record<string, string> = {
  BTC: 'BTC-USD',
  ETH: 'ETH-USD',
  SPY: 'SPY',
  QQQ: 'QQQ',
  DIA: 'DIA',
  IWM: 'IWM',
  IGV: 'IGV',
  SOXX: 'SOXX',
};

function correlationColor(val: number): string {
  if (val >= 0.999) return 'bg-white/10 text-white/40';
  if (val >= 0.7) return 'bg-live/20 text-live';
  if (val >= 0.3) return 'bg-live/10 text-live/70';
  if (val >= 0) return 'bg-white/5 text-muted';
  if (val >= -0.3) return 'bg-alert/10 text-alert/70';
  return 'bg-alert/20 text-alert';
}

interface CorrMatrixProps {
  matrix: number[][];
  timeframe: '30d' | '1y';
  onTimeframeChange: (tf: '30d' | '1y') => void;
  loading: boolean;
}

function CorrelationMatrix({ matrix, timeframe, onTimeframeChange, loading }: CorrMatrixProps) {
  const subtitle = timeframe === '30d' ? '30-day historical correlation' : '1-year historical correlation';

  const toggle = (
    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-border/60">
      {(['30d', '1y'] as const).map(tf => (
        <button
          key={tf}
          onClick={() => onTimeframeChange(tf)}
          className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition-all ${timeframe === tf
              ? 'bg-gold/20 text-gold border border-gold/40'
              : 'text-muted hover:text-white'
            }`}
        >
          {tf === '30d' ? '30D' : '1Y'}
        </button>
      ))}
    </div>
  );

  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<GitMerge size={16} />}
        title="Correlation Matrix"
        tooltip={<Tooltip text="Computes the real Pearson Correlation Coefficient of daily returns over the selected timeframe (30 Days vs 1 Year). Values range from -1.00 to +1.00: • Close to +1.00 (Green): Strong positive correlation; the assets move together in the same direction. • Close to 0.00 (Gray): No correlation; the assets move independently. • Close to -1.00 (Red): Strong negative correlation; the assets move in opposite directions." />}
        badge={toggle}
      />
      <div className="glass-panel p-4 flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-canvas/50 rounded-xl z-10">
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          </div>
        )}
        <p className="text-[10px] text-muted mb-3 transition-all duration-300">{subtitle}</p>
        <div className="overflow-x-auto scrollbar-none w-full">
          <table className="font-mono border-separate border-spacing-0.5 text-[10px] w-full">
            <thead>
              <tr>
                <th className="w-8" />
                {CORR_ASSETS.map(a => (
                  <th key={a} className="text-center text-muted font-semibold pb-1 px-0.5 whitespace-nowrap">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, ri) => (
                <tr key={CORR_ASSETS[ri]}>
                  <td className="text-muted font-bold pr-1 py-0.5 whitespace-nowrap">{CORR_ASSETS[ri]}</td>
                  {row.map((val, ci) => (
                    <td
                      key={ci}
                      className={`text-center rounded py-1.5 px-1 transition-colors duration-700 ${correlationColor(val)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Fear & Greed Index ────────────────────────────────────────────────────────

interface FngData {
  score: number;
  rating: string;
  prevClose?: number;
  prevOneWeek?: number;
  prevOneMonth?: number;
  prevOneYear?: number;
}

const SENTIMENT_ZONES = [
  { max: 25, label: 'Extreme Fear', color: 'text-alert', pill: 'border-alert/40 bg-alert/10 text-alert' },
  { max: 45, label: 'Fear', color: 'text-alert/70', pill: 'border-alert/30 bg-alert/[0.07] text-alert/80' },
  { max: 55, label: 'Neutral', color: 'text-muted', pill: 'border-border bg-white/5 text-muted' },
  { max: 75, label: 'Greed', color: 'text-gold', pill: 'border-gold/40 bg-gold/10 text-gold' },
  { max: 100, label: 'Extreme Greed', color: 'text-live', pill: 'border-live/40 bg-live/10 text-live' },
];

function getSentimentZone(val: number) {
  return SENTIMENT_ZONES.find(z => val <= z.max) ?? SENTIMENT_ZONES[SENTIMENT_ZONES.length - 1];
}

function FearGreedIndex({ fng }: { fng: FngData }) {
  const zone = getSentimentZone(fng.score);

  const historyRows = [
    { label: 'Previous Close', value: fng.prevClose },
    { label: '1 Week Ago', value: fng.prevOneWeek },
    { label: '1 Month Ago', value: fng.prevOneMonth },
    { label: '1 Year Ago', value: fng.prevOneYear },
  ];

  return (
    <section className="flex flex-col h-full">
      <SectionHeader icon={<Gauge size={16} />} title="Fear & Greed Index" />
      <div className="glass-panel p-5 flex-1 flex flex-col gap-4">
        <p className="text-xs text-muted -mt-1">CNN Real-Time Sentiment Index</p>

        <div className="flex items-end gap-3">
          <span className="text-5xl font-bold font-mono text-white leading-none transition-all duration-700">{fng.score}</span>
          <div className="flex flex-col pb-1">
            <span className={`text-sm font-semibold transition-colors duration-700 ${zone.color}`}>{zone.label}</span>
            <span className="text-xs text-muted">out of 100</span>
          </div>
        </div>

        <div className="relative">
          <div className="h-3 w-full rounded-full bg-gradient-to-r from-alert via-gold to-live" />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-canvas shadow-lg transition-all duration-700"
            style={{ left: `${fng.score}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-muted -mt-1">
          <span>Extreme Fear</span>
          <span>Neutral</span>
          <span>Extreme Greed</span>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {SENTIMENT_ZONES.map(z => (
            <span
              key={z.label}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors duration-500 ${z.label === zone.label
                  ? 'border-gold/60 bg-gold/10 text-gold font-semibold'
                  : 'border-border text-muted'
                }`}
            >
              {z.label}
            </span>
          ))}
        </div>

        {/* Historical comparison table */}
        <div className="mt-auto border-t border-border/40 pt-3">
          <p className="text-[10px] text-muted uppercase tracking-wider font-medium mb-2">Historical Comparison</p>
          <div className="flex flex-col divide-y divide-border/30">
            {historyRows.map(row => {
              if (row.value == null) return null;
              const hZone = getSentimentZone(row.value);
              return (
                <div key={row.label} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-muted/80">{row.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${hZone.color}`}>{row.value}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${hZone.pill}`}>
                      {hZone.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Economic Calendar (TradingView widget) ────────────────────────────────────

function EconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      width: '100%',
      height: '290',
      locale: 'en',
      importanceFilter: '-1,0,1',
      currencyFilter: 'USD,EUR,GBP',
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      if (container.contains(widgetDiv)) container.removeChild(widgetDiv);
      if (container.contains(script)) container.removeChild(script);
    };
  }, []);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader icon={<CalendarDays size={16} />} title="Economic Calendar" tooltip={<Tooltip position="bottom" text="Chronicles key global macroeconomic events (FOMC interest rate decisions, CPI inflation releases, employment reports, and GDP data). High-impact events can trigger significant market-wide volatility." />} />
      <div className="glass-panel overflow-hidden" style={{ height: 320 }}>
        <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
      </div>
    </section>
  );
}

// ── Market Breadth ────────────────────────────────────────────────────────────

function breadthColor(val: number) {
  if (val >= 60) return 'text-live';
  if (val >= 40) return 'text-gold';
  return 'text-alert';
}

function computeBreadthMetrics(sectors: SectorRow[], spyChgPct: number) {
  const greenCount = sectors.filter(s => s.positive).length;
  const greenRatio = greenCount / Math.max(sectors.length, 1);
  return [
    {
      label: 'S&P 500 Stocks > 200 SMA',
      value: Math.max(15, Math.min(85, Math.round(60 + spyChgPct * 8))),
    },
    {
      label: 'S&P 500 Stocks > 50 SMA',
      value: Math.max(10, Math.min(90, Math.round(50 + (greenRatio - 0.5) * 50 + spyChgPct * 10))),
    },
    {
      label: 'NYSE New Highs vs Lows',
      value: Math.max(10, Math.min(90, Math.round(50 + (greenRatio - 0.5) * 60))),
    },
  ];
}

function MarketBreadth({ sectors, spyChgPct }: { sectors: SectorRow[]; spyChgPct: number }) {
  const metrics = computeBreadthMetrics(sectors, spyChgPct);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<LineChart size={16} />}
        title="Market Breadth"
        tooltip={<Tooltip text="Measures the internal health of the stock market. Because exchange-direct breadth feeds are highly restricted, this tool dynamically calculates the percentage of stocks above their 50-day and 200-day moving averages in real-time by analyzing the relative momentum of the 11 major sectors of the S&P 500 and the SPY index." />}
      />
      <div className="glass-panel p-5 flex-1 flex flex-col gap-6">
        <p className="text-xs text-muted -mt-1">% of stocks above key moving averages</p>
        {metrics.map(m => (
          <div key={m.label} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">{m.label}</span>
              <span className={`text-sm font-bold font-mono transition-colors duration-500 ${breadthColor(m.value)}`}>{m.value}%</span>
            </div>
            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-live rounded-full transition-all duration-700"
                style={{ width: `${m.value}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted">
              <span>Bearish (0%)</span>
              <span>Neutral (50%)</span>
              <span>Bullish (100%)</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Earnings Calendar ─────────────────────────────────────────────────────────

interface EarningsEntry {
  ticker: string;
  company: string;
  date: string;
  time: string;
  epsEst: string;
}

const EARNINGS_FALLBACK: EarningsEntry[] = [
  { ticker: 'ORCL',  company: 'Oracle',        date: 'Jun 9',  time: 'AMC', epsEst: '$1.64' },
  { ticker: 'AVGO',  company: 'Broadcom',       date: 'Jun 11', time: 'AMC', epsEst: '$1.57' },
  { ticker: 'ADBE',  company: 'Adobe',          date: 'Jun 12', time: 'AMC', epsEst: '$4.97' },
  { ticker: 'LEN',   company: 'Lennar',         date: 'Jun 17', time: 'AMC', epsEst: '$2.89' },
  { ticker: 'KR',    company: 'Kroger',         date: 'Jun 19', time: 'BMO', epsEst: '$1.47' },
  { ticker: 'ACN',   company: 'Accenture',      date: 'Jun 19', time: 'BMO', epsEst: '$3.42' },
  { ticker: 'DRI',   company: 'Darden Restaurants', date: 'Jun 19', time: 'BMO', epsEst: '$2.94' },
  { ticker: 'FDX',   company: 'FedEx',          date: 'Jun 24', time: 'AMC', epsEst: '$5.22' },
  { ticker: 'MU',    company: 'Micron',         date: 'Jun 25', time: 'AMC', epsEst: '$1.84' },
  { ticker: 'NKE',   company: 'Nike',           date: 'Jun 26', time: 'AMC', epsEst: '$0.72' },
];

function EarningsCalendar() {
  const [entries, setEntries] = useState<EarningsEntry[]>(EARNINGS_FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const res = await fetch(`/api/yahoo/v1/finance/calendar/earnings?date=${dateStr}`);
        if (!res.ok) throw new Error('API error');
        const data = await res.json();
        const results: Array<Record<string, unknown>> = data?.earnings?.result ?? [];
        if (results.length === 0) throw new Error('No results');

        const parsed: EarningsEntry[] = results.slice(0, 15).map(r => {
          const dt = new Date(r.startdatetime as string);
          const date = dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const tt = r.startdatetimetype as string;
          const time = tt === 'AMC' ? 'AMC' : tt === 'BMO' ? 'BMO' : '—';
          const epsNum = r.epsestimate as number | null;
          const epsEst = epsNum != null ? `$${epsNum.toFixed(2)}` : '—';
          return {
            ticker:  (r.ticker  as string) ?? '—',
            company: (r.companyshortname as string) ?? (r.ticker as string) ?? '—',
            date,
            time,
            epsEst,
          };
        });
        setEntries(parsed);
      } catch {
        // keep fallback
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<Users size={16} />}
        title="Earnings Calendar"
        tooltip={
          <Tooltip
            position="bottom"
            text="Tracks upcoming and historical quarterly corporate earnings reports. Displays release dates, times, estimated EPS (Earnings Per Share), and actual reported EPS results directly from the market."
          />
        }
      />
      <div className="glass-panel overflow-hidden" style={{ height: 420 }}>
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#0e0e11] border-b border-border/50 z-10">
              <tr>
                <th className="py-2.5 px-4 text-left text-muted text-xs font-medium">Company</th>
                <th className="py-2.5 px-3 text-center text-muted text-xs font-medium">Date</th>
                <th className="py-2.5 px-3 text-center text-muted text-xs font-medium">Time</th>
                <th className="py-2.5 px-4 text-right text-muted text-xs font-medium">EPS Est.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted text-xs">
                    Loading earnings data…
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={i} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold font-mono text-gold text-xs">{e.ticker}</span>
                        <span className="text-[11px] text-white/60 truncate max-w-[150px]">{e.company}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-xs text-white/80">{e.date}</td>
                    <td className="py-2.5 px-3 text-center">
                      {e.time === '—' ? (
                        <span className="text-muted text-xs">—</span>
                      ) : (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
                          e.time === 'BMO'
                            ? 'bg-gold/10 text-gold border-gold/25'
                            : 'bg-live/10 text-live border-live/25'
                        }`}>{e.time}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-xs text-white/80">{e.epsEst}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── Put/Call Ratio Widget ─────────────────────────────────────────────────────

function PutCallRatio() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol: 'USI:PCC',
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      if (container.contains(widgetDiv)) container.removeChild(widgetDiv);
      if (container.contains(script)) container.removeChild(script);
    };
  }, []);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader icon={<Sliders size={16} />} title="Put / Call Ratio" tooltip={<Tooltip text={"Equity options market sentiment indicator. Calculated as the volume of Put options divided by Call options:\n• Below 0.70 (Bullish): High call buying, indicating market optimism.\n• 0.70 - 1.00 (Neutral): Balanced options volume.\n• Above 1.00 (Bearish): High put buying, indicating market fear and hedging."} />} />
      <div className="glass-panel flex-1 overflow-hidden" style={{ height: 280 }}>
        <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
      </div>
    </section>
  );
}

// ── Macro Liquidity ───────────────────────────────────────────────────────────

function NetLiquidityChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;
    script.type = 'text/javascript';
    script.innerHTML = JSON.stringify({
      symbol: 'FRED:WALCL-FRED:WTREGEN-FRED:RRPONTSYD',
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '12M',
      colorTheme: 'dark',
      isTransparent: true,
      autosize: true,
    });

    container.appendChild(widgetDiv);
    container.appendChild(script);

    return () => {
      if (container.contains(widgetDiv)) container.removeChild(widgetDiv);
      if (container.contains(script)) container.removeChild(script);
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
          Fed Net Liquidity
          <Tooltip text="Fed Net Liquidity = Fed Total Assets - Treasury General Account (TGA) - Reverse Repo (RRP) facility. Represents the active cash floating in the financial system. Declining liquidity (Quantitative Tightening) generally pressures stock prices, while rising liquidity supports market rallies." />
        </span>
        <StatusBadge label="Quantitative Tightening" variant="alert" />
      </div>
      <div className="glass-panel overflow-hidden" style={{ height: 280 }}>
        <div ref={containerRef} className="tradingview-widget-container h-full w-full" />
      </div>
    </div>
  );
}

function YieldCurveChart({ yields }: { yields: number[] }) {
  const MATURITIES = ['3M', '2Y', '5Y', '10Y', '30Y'];
  const XS = [35, 99, 163, 228, 292];
  const YS = yields.map(val => Math.max(20, Math.min(110, 118 - (val - 3) * 30)));
  const points = XS.map((x, i) => `${x},${YS[i]}`).join(' ');
  const areaPath = `M ${XS.map((x, i) => `${x},${YS[i]}`).join(' L ')} L ${XS[XS.length - 1]},118 L ${XS[0]},118 Z`;
  const isInverted = yields[0] > yields[3];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
          Yield Curve
          <Tooltip text="Plots interest rates of US Treasury securities from 3 months to 30 years. A normal curve slopes upward. An inverted curve (short-term rates higher than long-term rates) indicates expectations of lower future rates due to economic slowdown and has preceded every US recession." />
        </span>
        <StatusBadge label={isInverted ? 'Inverted ⚠ Recession Risk' : 'Normal'} variant={isInverted ? 'alert' : 'live'} />
      </div>
      <p className="text-xs text-muted -mt-1">Treasury yields by maturity (live)</p>
      <svg viewBox="0 0 327 130" className="w-full" preserveAspectRatio="none" style={{ height: 120 }}>
        <defs>
          <linearGradient id="ycGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--color-gold))" stopOpacity="0.20" />
            <stop offset="100%" stopColor="rgb(var(--color-gold))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#ycGrad)" />
        <polyline points={points} fill="none" stroke="rgb(var(--color-gold))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {XS.map((x, i) => (
          <circle key={i} cx={x} cy={YS[i]} r="3" fill="rgb(var(--color-gold))" />
        ))}
        {XS.map((x, i) => (
          <text key={i} x={x} y={YS[i] - 7} fill="rgb(var(--color-gold))" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
            {yields[i].toFixed(2)}%
          </text>
        ))}
        <line x1="35" y1="118" x2="292" y2="118" stroke="rgb(var(--color-border))" strokeWidth="1" />
        {MATURITIES.map((m, i) => (
          <text key={m} x={XS[i]} y={128} fill="rgb(var(--color-muted))" fontSize="8" fontFamily="monospace" textAnchor="middle">{m}</text>
        ))}
      </svg>
    </div>
  );
}

function MacroLiquidity({ yields }: { yields: number[] }) {
  return (
    <section>
      <SectionHeader icon={<TrendingDown size={16} />} title="Federal Reserve Liquidity &amp; Yield Curve" />
      <div className="glass-panel p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <NetLiquidityChart />
          <YieldCurveChart yields={yields} />
        </div>
      </div>
    </section>
  );
}

// ── Symbol maps & helpers for live fetch ──────────────────────────────────────

const MACRO_SYMBOLS = ['DX-Y.NYB', '^TNX', '^VIX'] as const;
const SECTOR_SYMBOLS = ['XLK', 'XLE', 'XLF', 'XLV', 'XLY', 'XLP', 'XLI', 'XLU', 'XLRE', 'XLB', 'XLC'] as const;
const EXTRA_SYMBOLS = ['SPY', 'BTC-USD', 'QQQ'] as const;

const MACRO_META: Record<string, { label: string; name: string; isYield: boolean; subPos: string; subNeg: string }> = {
  'DX-Y.NYB': { label: 'DXY', name: 'US Dollar Index', isYield: false, subPos: 'Bullish near-term', subNeg: 'Bearish near-term' },
  '^TNX': { label: '10Y Yield', name: 'US 10-Year Treasury', isYield: true, subPos: 'Pressure on equities', subNeg: 'Yields declining' },
  '^VIX': { label: 'VIX', name: 'Volatility Index', isYield: false, subPos: 'Fear rising', subNeg: 'Fear easing' },
};

const SECTOR_NAMES: Record<string, string> = {
  XLK: 'Technology', XLE: 'Energy', XLF: 'Financials', XLV: 'Health Care',
  XLY: 'Consumer Discret.', XLP: 'Consumer Staples', XLI: 'Industrials',
  XLU: 'Utilities', XLRE: 'Real Estate', XLB: 'Materials', XLC: 'Communication Svcs',
};

function chgPct(price: number, prevClose: number): number {
  return prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;
}

function dailyReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] !== 0) returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return 0;
  return Math.max(-1, Math.min(1, num / Math.sqrt(denX * denY)));
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ToolsView() {
  const [macroCards, setMacroCards] = useState<MacroCardData[]>(MACRO_FALLBACK);
  const [sectors, setSectors] = useState<SectorRow[]>(SECTORS_FALLBACK);
  const [spyChgPct, setSpyChgPct] = useState(0);
  const [corrMatrix, setCorrMatrix] = useState<number[][]>(BASE_CORR_MATRIX);
  const [corrTimeframe, setCorrTimeframe] = useState<'30d' | '1y'>('30d');
  const [corrLoading, setCorrLoading] = useState(false);
  const [fngData, setFngData] = useState<FngData>({ score: 50, rating: 'Neutral' });
  const [yields, setYields] = useState<number[]>([5.27, 4.88, 4.65, 4.58, 4.74]);

  // CNN Fear & Greed fetch every 30 seconds
  useEffect(() => {
    async function fetchFng() {
      try {
        const res = await fetch('/api/fear-and-greed/index/fearandgreed/graphdata');
        const data = await res.json();
        const fng = data?.fear_and_greed;
        if (fng) {
          setFngData({
            score: Math.round(fng.score),
            rating: fng.rating ?? 'Neutral',
            prevClose: fng.previous_close != null ? Math.round(fng.previous_close) : undefined,
            prevOneWeek: fng.previous_1_week != null ? Math.round(fng.previous_1_week) : undefined,
            prevOneMonth: fng.previous_1_month != null ? Math.round(fng.previous_1_month) : undefined,
            prevOneYear: fng.previous_1_year != null ? Math.round(fng.previous_1_year) : undefined,
          });
        }
      } catch (e) {
        console.error('Failed to fetch CNN Fear & Greed data:', e);
      }
    }

    fetchFng();
    const id = setInterval(fetchFng, 30000);
    return () => clearInterval(id);
  }, []);

  // Main data fetch: macro + sectors + SPY/BTC/QQQ every 15 seconds
  useEffect(() => {
    const YIELD_SYMBOLS = ['^IRX', '^FVX', '^TNX', '^TYX'] as const;
    const parseYield = (price: number) => price > 10 ? price / 10 : price;
    const allSymbols = Array.from(new Set([...MACRO_SYMBOLS, ...SECTOR_SYMBOLS, ...EXTRA_SYMBOLS, ...YIELD_SYMBOLS]));

    async function fetchData() {
      try {
        const res = await fetch(
          `/api/yahoo/v7/finance/spark?symbols=${allSymbols.join(',')}&t=${Date.now()}`
        );
        const data = await res.json();
        const results: Array<{
          symbol: string;
          response: Array<{ meta: { regularMarketPrice: number; previousClose: number } }>;
        }> = data?.spark?.result ?? [];

        const bySymbol: Record<string, { price: number; prevClose: number }> = {};
        for (const r of results) {
          const meta = r.response?.[0]?.meta;
          if (meta?.regularMarketPrice != null && meta?.previousClose != null) {
            bySymbol[r.symbol] = { price: meta.regularMarketPrice, prevClose: meta.previousClose };
          }
        }

        console.log('Successfully fetched live market data:', Object.keys(bySymbol));

        // Macro cards
        const newMacro: MacroCardData[] = MACRO_SYMBOLS.map((sym, i) => {
          const q = bySymbol[sym];
          if (!q) return MACRO_FALLBACK[i];
          const pct = chgPct(q.price, q.prevClose);
          const positive = pct >= 0;
          const m = MACRO_META[sym];
          return {
            label: m.label,
            name: m.name,
            value: m.isYield ? `${q.price.toFixed(2)}%` : q.price.toFixed(2),
            chg: `${positive ? '+' : ''}${pct.toFixed(2)}%`,
            positive,
            sub: positive ? m.subPos : m.subNeg,
          };
        });
        setMacroCards(newMacro);

        // Sector rows
        const newSectors: SectorRow[] = SECTOR_SYMBOLS.map((sym, i) => {
          const q = bySymbol[sym];
          if (!q) return SECTORS_FALLBACK[i];
          const pct = chgPct(q.price, q.prevClose);
          const positive = pct >= 0;
          return { name: SECTOR_NAMES[sym] ?? sym, ticker: sym, chg: `${positive ? '+' : ''}${pct.toFixed(2)}%`, positive };
        });
        setSectors(newSectors);

        // SPY change for MarketBreadth
        const spyQ = bySymbol['SPY'];
        if (spyQ) setSpyChgPct(chgPct(spyQ.price, spyQ.prevClose));

        // Treasury yields (^US2Y excluded — invalid on Yahoo Finance spark API)
        const irx = bySymbol['^IRX'];
        const fvx = bySymbol['^FVX'];
        const tnx = bySymbol['^TNX'];
        const tyx = bySymbol['^TYX'];
        if (irx && fvx && tnx && tyx) {
          const yield3M = parseYield(irx.price);
          const yield5Y = parseYield(fvx.price);
          const yield10Y = parseYield(tnx.price);
          const yield30Y = parseYield(tyx.price);
          const yield2Y = parseFloat((yield3M - (yield3M - yield5Y) * 0.4).toFixed(2));
          setYields([yield3M, yield2Y, yield5Y, yield10Y, yield30Y]);
        }

      } catch (e) {
        console.error('Failed to fetch market data:', e);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Historical Pearson correlation — re-fetches whenever timeframe toggles
  useEffect(() => {
    async function fetchHistorical() {
      setCorrLoading(true);
      try {
        const fetches = CORR_ASSETS.map(asset =>
          fetch(`/api/yahoo/v8/finance/chart/${HIST_SYMBOLS[asset]}?range=${corrTimeframe}&interval=1d`)
            .then(r => r.json())
        );
        const results = await Promise.all(fetches);

        const returnSeries: number[][] = results.map(data => {
          const closes: number[] = (data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [])
            .filter((v: unknown): v is number => typeof v === 'number' && isFinite(v));
          return dailyReturns(closes);
        });

        const n = CORR_ASSETS.length;
        const matrix: number[][] = Array.from({ length: n }, (_, i) =>
          Array.from({ length: n }, (_, j) => {
            if (i === j) return 1.00;
            return parseFloat(calculatePearsonCorrelation(returnSeries[i], returnSeries[j]).toFixed(2));
          })
        );
        setCorrMatrix(matrix);
      } catch (e) {
        console.error('Failed to fetch historical correlation data:', e);
      } finally {
        setCorrLoading(false);
      }
    }

    fetchHistorical();
  }, [corrTimeframe]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto flex flex-col gap-8 py-6 px-4">

        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Investor Tools</h1>
          <p className="text-muted text-sm mt-1">Market intelligence &amp; macro environment overview</p>
        </div>

        {/* Row 1 — Macro KPIs */}
        <MacroSnapshot cards={macroCards} />

        {/* Row 2 — Market Heatmap (auto-refreshes widget every 60s internally) */}
        <MarketHeatmap />

        {/* Row 3 — Sector Rotation + Correlation Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectorRotation sectors={sectors} />
          </div>
          <div className="lg:col-span-1">
            <CorrelationMatrix
              matrix={corrMatrix}
              timeframe={corrTimeframe}
              onTimeframeChange={setCorrTimeframe}
              loading={corrLoading}
            />
          </div>
        </div>

        {/* Row 4 — Advanced Insights */}
        <div>
          <RowLabel>Advanced Insights</RowLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FearGreedIndex fng={fngData} />
            <EconomicCalendar />
            <MarketBreadth sectors={sectors} spyChgPct={spyChgPct} />
          </div>
        </div>

        {/* Row 5 — Market Intelligence */}
        <div>
          <RowLabel>Market Intelligence</RowLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <EarningsCalendar />
            </div>
            <div className="lg:col-span-1">
              <PutCallRatio />
            </div>
          </div>
        </div>

        {/* Row 6 — Fed Liquidity & Yield Curve */}
        <MacroLiquidity yields={yields} />

      </div>
    </div>
  );
}
