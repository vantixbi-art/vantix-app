import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, BrainCircuit, ExternalLink, Clock, Search, Volume2, VolumeX, X, Lock, Crown } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

// ── Types & mock data ─────────────────────────────────────────────────────────

type Category  = 'All' | 'Macro' | 'Crypto' | 'Earnings' | 'Geopolitical';
type Sentiment = 'Bullish' | 'Bearish' | 'Neutral';

interface Article {
  id: number;
  source: string;
  time: string;
  headline: string;
  summary: string;
  category: Exclude<Category, 'All'>;
  sentiment: Sentiment;
  ticker?: string;
  link?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  Bloomberg:  'text-[#6C9EF8]',
  Reuters:    'text-[#FFA040]',
  WSJ:        'text-white/60',
  FT:         'text-[#F8C540]',
  CNBC:       'text-[#5FBEAA]',
  CoinDesk:   'text-[#7B61FF]',
  'Barron\'s':'text-white/60',
  'The Block':'text-[#A78BFA]',
  Axios:      'text-white/60',
  'Yahoo Finance': 'text-gold',
};

const CATEGORY_COLORS: Record<Exclude<Category, 'All'>, string> = {
  Macro:        'text-gold',
  Crypto:       'text-[#7B61FF]',
  Earnings:     'text-live',
  Geopolitical: 'text-alert',
};

const FILTERS: Category[] = ['All', 'Macro', 'Crypto', 'Earnings', 'Geopolitical'];

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  Bullish: 'bg-live/15 text-live border border-live/30',
  Bearish: 'bg-alert/15 text-alert border border-alert/30',
  Neutral: 'bg-white/10 text-muted border border-border',
};

// ── Sentiment Gauge ───────────────────────────────────────────────────────────

function SentimentGauge({ articles }: { articles: Article[] }) {
  const total    = articles.length;
  const bullish  = articles.filter(a => a.sentiment === 'Bullish').length;
  const bearish  = articles.filter(a => a.sentiment === 'Bearish').length;
  const neutral  = articles.filter(a => a.sentiment === 'Neutral').length;

  const opinionated = bullish + bearish;
  const gaugePct    = opinionated > 0 ? Math.round((bullish / opinionated) * 100) : 50;

  const label      = gaugePct > 55 ? `${gaugePct}% Bullish`
                   : gaugePct < 45 ? `${100 - gaugePct}% Bearish`
                   : 'Neutral';
  const labelColor = gaugePct > 55 ? 'text-live' : gaugePct < 45 ? 'text-alert' : 'text-gold';
  const glowVar    = gaugePct > 55 ? 'var(--color-live)' : gaugePct < 45 ? 'var(--color-alert)' : 'var(--color-gold)';

  if (total === 0) return null;

  return (
    <div className="glass-panel px-4 py-3 flex flex-col gap-2 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted uppercase tracking-widest font-medium">
          Today's Sentiment Bias
        </span>
        <span className={`text-sm font-bold font-mono ${labelColor}`}>{label}</span>
      </div>

      {/* Gradient track + indicator dot */}
      <div className="relative py-1.5">
        <div className="h-2 w-full rounded-full bg-gradient-to-r from-alert via-gold to-live" />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-canvas shadow-md transition-all duration-500"
          style={{
            left: `${gaugePct}%`,
            boxShadow: `0 0 10px rgb(${glowVar} / 0.6)`,
          }}
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 flex-wrap text-[10px]">
        <span className="font-mono font-semibold text-live">{bullish} Bullish</span>
        <span className="text-muted/40">·</span>
        <span className="font-mono font-semibold text-alert">{bearish} Bearish</span>
        <span className="text-muted/40">·</span>
        <span className="font-mono text-muted">{neutral} Neutral</span>
        <span className="ml-auto text-muted/50">from {total} articles</span>
      </div>
    </div>
  );
}

// ── News Feed ─────────────────────────────────────────────────────────────────

interface NewsFeedProps {
  active: Category;
  setActive: (c: Category) => void;
  tickerSearch: string;
  setTickerSearch: (t: string) => void;
  articles: Article[];
  loading: boolean;
  breakingId: number;
}

function NewsFeed({
  active,
  setActive,
  tickerSearch,
  setTickerSearch,
  articles,
  loading,
  breakingId,
}: NewsFeedProps) {
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Premium 3-note arpeggio chime via Web Audio API
  const playChime = useCallback(async () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') await ctx.resume();

      const now = ctx.currentTime;
      // A-major arpeggio: E5 → A5 → C#6
      [
        { freq: 659.25,  delay: 0    },
        { freq: 880.00,  delay: 0.15 },
        { freq: 1108.73, delay: 0.30 },
      ].forEach(({ freq, delay }) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + delay;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.11, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        osc.start(t);
        osc.stop(t + 0.85);
      });
    } catch {
      // AudioContext blocked — fail silently
    }
  }, []);

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev;
      if (next) playChime();
      return next;
    });
  }, [playChime]);

  // Play periodic alert chime for breaking news if audio enabled
  useEffect(() => {
    if (!audioEnabled || articles.length === 0) return;
    const id = setInterval(() => {
      playChime();
    }, 18000);
    return () => clearInterval(id);
  }, [audioEnabled, articles, playChime]);

  // Cleanup AudioContext on unmount
  useEffect(() => () => { audioCtxRef.current?.close(); }, []);

  return (
    <section className="flex flex-col h-full min-h-0">

      {/* Header row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold"><Newspaper size={16} /></span>
        <h2 className="text-base font-bold">News Feed</h2>
        <button
          onClick={toggleAudio}
          className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
            audioEnabled
              ? 'bg-live/10 border-live/40 text-live'
              : 'bg-white/5 border-border text-muted hover:text-white hover:border-muted'
          }`}
          style={audioEnabled ? { boxShadow: '0 0 14px rgb(var(--color-live) / 0.22)' } : undefined}
          title={audioEnabled ? 'Live audio alerts ON' : 'Enable live audio alerts'}
        >
          {audioEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
          <span>{audioEnabled ? 'Audio On' : 'Live Alerts'}</span>
        </button>
      </div>

      {/* Filter pills + search */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
              active === f
                ? 'bg-gold/15 border-gold/50 text-gold'
                : 'bg-white/5 border-border text-muted hover:text-white hover:border-muted'
            }`}
          >
            {f}
          </button>
        ))}

        {/* Ticker search */}
        <div className="relative ml-auto">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted/60 pointer-events-none" />
          <input
            value={tickerSearch}
            onChange={e => setTickerSearch(e.target.value)}
            placeholder="Ticker…"
            spellCheck={false}
            maxLength={6}
            className="bg-input border border-border rounded-md pl-7 pr-7 py-1.5 text-xs font-mono uppercase text-white placeholder:normal-case placeholder:text-muted/40 focus:outline-none focus:border-gold/50 transition-colors w-28"
          />
          {tickerSearch && (
            <button
              onClick={() => setTickerSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted/60 hover:text-white transition-colors"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Sentiment Gauge */}
      <SentimentGauge articles={articles} />

      {/* Article List */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <span className="w-6 h-6 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
            <p className="text-xs text-muted">Streaming live financial feeds...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Search size={28} className="text-muted/30" />
            <p className="text-sm text-muted">No news articles found.</p>
          </div>
        ) : (
          articles.map(article => (
            <article
              key={article.id}
              onClick={() => article.link && article.link !== '#' && window.open(article.link, '_blank')}
              className="glass-panel px-4 py-4 flex flex-col gap-2 hover:border-border/80 transition-colors cursor-pointer group"
            >
              {/* Top meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[11px] font-bold ${SOURCE_COLORS[article.source] ?? 'text-muted'}`}>
                  {article.source}
                </span>
                <span className="text-muted/40 text-[10px]">·</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_COLORS[article.category]}`}>
                  {article.category}
                </span>
                {article.ticker && (
                  <>
                    <span className="text-muted/40 text-[10px]">·</span>
                    <span className="text-[10px] font-mono bg-white/5 border border-border px-1.5 py-0.5 rounded text-white/60">
                      {article.ticker}
                    </span>
                  </>
                )}
                {article.id === breakingId && (
                  <span className="text-[9px] font-black bg-alert text-black px-1.5 py-0.5 rounded uppercase tracking-widest animate-pulse">
                    Breaking
                  </span>
                )}
                <div className="flex items-center gap-1 ml-auto text-muted">
                  <Clock size={10} />
                  <span className="text-[10px]">{article.time}</span>
                </div>
              </div>

              {/* Headline */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-white leading-snug group-hover:text-white/90 flex-1">
                  {article.headline}
                </h3>
                <ExternalLink size={12} className="text-muted/40 group-hover:text-muted mt-0.5 shrink-0 transition-colors" />
              </div>

              {/* Summary */}
              <p className="text-xs text-muted leading-relaxed">{article.summary}</p>

              {/* Sentiment badge */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted/60 uppercase tracking-widest">AI Sentiment</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SENTIMENT_STYLES[article.sentiment]}`}>
                  {article.sentiment}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

    </section>
  );
}

// ── AI Market Summary ─────────────────────────────────────────────────────────

function AIMarketSummary({ tier, articles }: { tier: 'free' | 'pro', articles: Article[] }) {
  const isFree = tier === 'free';

  // Compute dynamic AI Summary based on live articles
  const dynamicSummary = useMemo(() => {
    if (!articles || articles.length === 0) {
      return {
        headline: 'Market Conditions — Initializing Analysis',
        body: [
          'Analyzing live market sentiment. Fetching real-time global news feeds to compile AI Market Pulse indicators...',
          'Key risk events and institutional orders are being scanned across the network.',
          'Please ensure your internet connection is active to stream the current session data.'
        ],
        signals: [
          { label: 'Overall Bias',  value: 'Scanning...', color: 'text-gold'  },
          { label: 'Top Sector',    value: 'Calculating...', color: 'text-gold'  },
          { label: 'Key Risk',      value: 'Computing...', color: 'text-gold' }
        ],
        updatedAt: 'Synthesized just now'
      };
    }

    const bullishCount = articles.filter(a => a.sentiment === 'Bullish').length;
    const ratio = articles.length > 0 ? bullishCount / articles.length : 0.5;

    let bias = 'Neutral';
    let biasColor = 'text-gold';
    if (ratio > 0.55) {
      bias = 'Risk-On';
      biasColor = 'text-live';
    } else if (ratio < 0.45) {
      bias = 'Risk-Off';
      biasColor = 'text-alert';
    }

    // Find the most frequent ticker in the articles
    const tickersMap: Record<string, number> = {};
    articles.forEach(a => {
      if (a.ticker) {
        tickersMap[a.ticker] = (tickersMap[a.ticker] || 0) + 1;
      }
    });
    let topTicker = 'Tech/Growth';
    let maxCount = 0;
    Object.entries(tickersMap).forEach(([ticker, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topTicker = ticker;
      }
    });

    const headline = ratio > 0.55 ? 'Market Pulse — Optimistic Momentum' 
                   : ratio < 0.45 ? 'Market Pulse — Elevated Volatility'
                   : 'Market Pulse — Consolidation Range';

    const p1 = `The macro market narrative is shifting dynamically in response to incoming updates. Among the leading stories, the focus is dominated by: "${articles[0]?.headline || 'market changes'}". Spot desks are observing corresponding volatility shifts across related option chains.`;
    
    const p2 = articles.length > 1 
      ? `In corporate actions and technology sectors, market participants are heavily parsing the details of "${articles[1]?.headline}". The relative options volume shows concentrated sweeps and block prints on related tickers.`
      : `Broad sector flows show high concentration of algorithmic trades responding directly to live corporate alerts. Volatility index (VIX) trends remain key for medium term validation.`;

    const p3 = articles.length > 2
      ? `Additionally, late developments report that "${articles[2]?.headline}". Global asset desks are adjusting exposure guidelines accordingly to prevent tail risk under current conditions.`
      : `Market models suggest institutional accumulation remains resilient despite near term price adjustments. Watch for potential trend reversals on major macroeconomic releases.`;

    return {
      headline,
      body: [p1, p2, p3],
      signals: [
        { label: 'Overall Bias',  value: bias,         color: biasColor  },
        { label: 'Top Ticker',    value: topTicker,    color: 'text-gold'  },
        { label: 'Key Catalyst',  value: articles[0]?.source || 'News Feeds', color: 'text-alert' },
      ],
      updatedAt: `Synthesized just now from ${articles.length} live sources`
    };
  }, [articles]);

  return (
    <section className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-gold"><BrainCircuit size={16} /></span>
        <h2 className="text-base font-bold">AI Market Summary</h2>
      </div>

      <div
        className="glass-panel flex-1 flex flex-col p-5 border-gold/20 relative overflow-hidden"
        style={{ boxShadow: '0 0 24px rgba(255,215,0,0.06), inset 0 0 40px rgba(0,0,0,0.15)' }}
      >
        {/* Status bar */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-border mb-4">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold" />
          </span>
          <span className="text-[10px] text-muted">{dynamicSummary.updatedAt}</span>
        </div>

        {/* Headline */}
        <h3 className="text-sm font-bold text-gold mb-3">{dynamicSummary.headline}</h3>

        {/* Body paragraphs — blurred for free tier */}
        <div className={`flex flex-col gap-3 mb-5 ${isFree ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
          {dynamicSummary.body.map((para, i) => (
            <p key={i} className="text-xs text-muted leading-relaxed">{para}</p>
          ))}
        </div>

        {/* Signal chips — blurred for free tier */}
        <div className={`mt-auto flex flex-col gap-2 pt-4 border-t border-border ${isFree ? 'blur-[3px] select-none pointer-events-none' : ''}`}>
          <span className="text-[10px] text-muted uppercase tracking-widest mb-1">Key Signals</span>
          {dynamicSummary.signals.map(s => (
            <div key={s.label} className="flex items-center justify-between">
              <span className="text-xs text-muted">{s.label}</span>
              <span className={`text-xs font-bold font-mono ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Lock overlay for free tier */}
        {isFree && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 backdrop-blur-sm bg-black/60 rounded-[inherit]">
            <div
              className="w-11 h-11 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center"
              style={{ boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.30)' }}
            >
              <Lock size={18} className="text-gold" />
            </div>
            <div className="text-center flex flex-col gap-1.5 px-6">
              <p className="text-sm font-bold text-white">AI Market Intelligence Locked</p>
              <p className="text-xs text-muted/80 leading-relaxed">
                Get daily market syntheses and key sentiment signals curated from major news sources by our AI engine.
              </p>
            </div>
            <Link
              to="/billing"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-black transition-all"
              style={{
                background: 'rgb(var(--color-gold))',
                boxShadow: '0 0 20px rgb(var(--glow-accent) / 0.35)',
              }}
            >
              <Crown size={12} />
              Upgrade to PRO
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function NewsView() {
  const { tier } = useUser();
  const [active, setActive] = useState<Category>('All');
  const [tickerSearch, setTickerSearch] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [breakingId, setBreakingId] = useState<number>(1);

  // Fetch news from Yahoo Search proxy
  const fetchLiveNews = async (category: Category, searchTicker: string) => {
    setLoading(true);
    let query = 'market';
    
    const cleanTicker = searchTicker.trim().toUpperCase();
    if (cleanTicker) {
      query = cleanTicker;
    } else {
      switch (category) {
        case 'Macro':
          query = 'economy macro inflation fed';
          break;
        case 'Crypto':
          query = 'crypto bitcoin ethereum blockchain';
          break;
        case 'Earnings':
          query = 'earnings revenue earnings report';
          break;
        case 'Geopolitical':
          query = 'geopolitics trade war tariffs energy oil';
          break;
        default:
          query = 'stock market business finance';
          break;
      }
    }

    try {
      const res = await fetch(`/api/yahoo/v1/finance/search?q=${query}&t=${Date.now()}`);
      const data = await res.json();
      const newsItems = data?.news || [];

      const mapped: Article[] = newsItems.map((item: any, idx: number) => {
        const title = item.title || '';
        const publisher = item.publisher || 'Yahoo Finance';
        const timeMs = item.providerPublishTime ? item.providerPublishTime * 1000 : Date.now();
        const diffMins = Math.round((Date.now() - timeMs) / 60000);

        let timeStr = 'Just now';
        if (diffMins > 0) {
          if (diffMins < 60) {
            timeStr = `${diffMins}m ago`;
          } else {
            const hrs = Math.floor(diffMins / 60);
            timeStr = `${hrs}h ago`;
          }
        }

        // Dynamic Sentiment Analysis
        const lowerTitle = title.toLowerCase();
        let sentiment: Sentiment = 'Neutral';
        const bullishWords = ['surge', 'rise', 'beat', 'gain', 'rally', 'higher', 'growth', 'up', 'soar', 'ath', 'bull', 'upgrade', 'success', 'positive'];
        const bearishWords = ['drop', 'fall', 'slide', 'miss', 'sink', 'lower', 'down', 'warn', 'risk', 'slid', 'antitrust', 'bear', 'downgrade', 'plunge', 'deficit', 'negative'];

        const hasBullish = bullishWords.some(w => lowerTitle.includes(w));
        const hasBearish = bearishWords.some(w => lowerTitle.includes(w));
        if (hasBullish && !hasBearish) sentiment = 'Bullish';
        else if (hasBearish && !hasBullish) sentiment = 'Bearish';

        // Dynamic Category Analysis
        let cat: Exclude<Category, 'All'> = 'Macro';
        if (category !== 'All') {
          cat = category;
        } else {
          if (lowerTitle.includes('btc') || lowerTitle.includes('eth') || lowerTitle.includes('crypto') || lowerTitle.includes('bitcoin') || lowerTitle.includes('ethereum')) {
            cat = 'Crypto';
          } else if (lowerTitle.includes('earnings') || lowerTitle.includes('revenue') || lowerTitle.includes('beat') || lowerTitle.includes('profit')) {
            cat = 'Earnings';
          } else if (lowerTitle.includes('war') || lowerTitle.includes('geopolit') || lowerTitle.includes('china') || lowerTitle.includes('tariff') || lowerTitle.includes('oil') || lowerTitle.includes('crude')) {
            cat = 'Geopolitical';
          } else {
            cat = 'Macro';
          }
        }

        // Extract ticker from relatedTickers
        let ticker = undefined;
        if (item.relatedTickers && Array.isArray(item.relatedTickers)) {
          const firstRealTicker = item.relatedTickers.find((t: string) => !t.startsWith('^'));
          if (firstRealTicker) {
            ticker = firstRealTicker;
          }
        }

        // Generate synthetic summary based on actual headline
        const summary = `According to reports from ${publisher}, ${title} Market analysts and algorithmic desks are actively evaluating options positioning and potential risk shifts.`;

        return {
          id: idx + 1,
          source: publisher,
          time: timeStr,
          headline: title,
          summary,
          category: cat,
          sentiment,
          ticker,
          link: item.link || '#',
        };
      });

      setArticles(mapped);
      if (mapped.length > 0) {
        setBreakingId(mapped[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch live news:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveNews(active, tickerSearch);
  }, [active, tickerSearch]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 py-6 px-4">

        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Global News Hub</h1>
          <p className="text-muted text-sm mt-1">
            AI-curated market intelligence from Bloomberg, Reuters, FT &amp; more
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2">
            <NewsFeed
              active={active}
              setActive={setActive}
              tickerSearch={tickerSearch}
              setTickerSearch={setTickerSearch}
              articles={articles}
              loading={loading}
              breakingId={breakingId}
            />
          </div>
          <div className="xl:col-span-1">
            <AIMarketSummary tier={tier} articles={articles} />
          </div>
        </div>

      </div>
    </div>
  );
}
