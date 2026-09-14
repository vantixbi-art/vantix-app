import { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';

interface Quote {
  price: number;
  chg: number;
}

type FlashDir = 'up' | 'down' | null;

const BASE_QUOTES: Record<string, Quote> = {
  TSLA:  { price: 175.22, chg: -1.40 },
  AMD:   { price: 164.50, chg:  2.80 },
  META:  { price: 485.10, chg:  0.50 },
  MSFT:  { price: 420.55, chg:  1.10 },
  GOOGL: { price: 168.30, chg: -0.20 },
};

function fmtPrice(n: number): string {
  return `$${n.toFixed(2)}`;
}
function fmtChg(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

interface WatchlistProps {
  activeTicker: string;
  onSelect: (ticker: string) => void;
  tickers: string[];
  onAddTicker: (sym: string) => void;
  onRemoveTicker: (sym: string) => void;
}

export function Watchlist({ activeTicker, onSelect, tickers, onAddTicker, onRemoveTicker }: WatchlistProps) {
  const [input, setInput] = useState('');
  const [quotes, setQuotes] = useState<Record<string, Quote>>({ ...BASE_QUOTES });
  const [flashDirs, setFlashDirs] = useState<Record<string, FlashDir>>({});
  const [flashKeys, setFlashKeys] = useState<Record<string, number>>({});
  const flashTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch quotes from Yahoo Finance proxy
  const fetchQuotes = async (symbolsList: string[]) => {
    if (!symbolsList.length) return;
    try {
      const res = await fetch(`/api/yahoo/v7/finance/spark?symbols=${symbolsList.join(',')}&t=${Date.now()}`);
      const data = await res.json();
      const results = data?.spark?.result || [];

      const newQuotes: Record<string, Quote> = {};
      const newFlashDirs: Record<string, FlashDir> = {};

      results.forEach((item: any) => {
        const sym = item.symbol;
        const responseMeta = item.response?.[0]?.meta;
        if (!responseMeta) return;

        const price = responseMeta.regularMarketPrice ?? 150;
        const prevClose = responseMeta.previousClose ?? price;
        const chg = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0;

        newQuotes[sym] = { price, chg };

        // Determine flash directions by comparing with previous quotes
        setQuotes(prev => {
          const prevQuote = prev[sym];
          if (prevQuote) {
            if (price > prevQuote.price) {
              newFlashDirs[sym] = 'up';
            } else if (price < prevQuote.price) {
              newFlashDirs[sym] = 'down';
            }
          }
          return prev;
        });
      });

      // Seed fallback values for any symbol that Yahoo didn't return
      symbolsList.forEach(sym => {
        if (!newQuotes[sym]) {
          newQuotes[sym] = quotes[sym] || BASE_QUOTES[sym] || { price: 150, chg: 0 };
        }
      });

      setQuotes(prev => ({ ...prev, ...newQuotes }));

      // Trigger flash animations
      Object.keys(newFlashDirs).forEach(sym => {
        const dir = newFlashDirs[sym];
        if (!dir) return;
        setFlashDirs(prev => ({ ...prev, [sym]: dir }));
        setFlashKeys(prev => ({ ...prev, [sym]: (prev[sym] ?? 0) + 1 }));

        clearTimeout(flashTimers.current[sym]);
        flashTimers.current[sym] = setTimeout(() => {
          setFlashDirs(prev => ({ ...prev, [sym]: null }));
        }, 700);
      });
    } catch (e) {
      console.error('Failed to fetch real-time quotes:', e);
    }
  };

  // Fetch on mount and set up periodic updates every 10 seconds
  useEffect(() => {
    fetchQuotes(tickers);

    const interval = setInterval(() => {
      fetchQuotes(tickers);
    }, 10000);

    return () => clearInterval(interval);
  }, [tickers]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleAdd() {
    const sym = input.trim().toUpperCase();
    if (!sym) return;
    onAddTicker(sym);
    setInput('');
  }

  return (
    <div id="tour-watchlist" className="glass-panel p-4 flex flex-col h-full">
      <h2 className="text-base font-heading font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        Watchlist
      </h2>

      <div className="flex items-center bg-input border border-border rounded-md mb-4 px-3 focus-within:border-gold transition-colors">
        <input
          className="flex-1 bg-transparent py-2 text-sm font-mono placeholder:text-muted focus:outline-none uppercase"
          placeholder="Add symbol…"
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button
          onClick={handleAdd}
          className="text-muted hover:text-gold transition-colors pl-2 py-1"
          aria-label="Add ticker"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="text-muted text-left border-b border-border">
            <tr>
              <th className="pb-2 text-[10px] font-medium uppercase tracking-wider">Symbol</th>
              <th className="pb-2 text-[10px] font-medium uppercase tracking-wider text-right">Price</th>
              <th className="pb-2 text-[10px] font-medium uppercase tracking-wider text-right">Chg%</th>
              <th className="pb-2 w-6" />
            </tr>
          </thead>
          <tbody>
            {tickers.map(sym => {
              const isActive = activeTicker === sym;
              const q = quotes[sym] ?? { price: 150, chg: 0 };
              const isPositive = q.chg >= 0;
              const flash = flashDirs[sym];

              return (
                <tr
                  key={sym}
                  onClick={() => onSelect(sym)}
                  className={`border-b border-border/40 cursor-pointer transition-colors ${
                    isActive ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  }`}
                >
                  <td className="py-2.5">
                    <div className="flex items-center gap-2 font-display font-bold text-xs">
                      {isActive && <div className="w-1 h-4 bg-live rounded-full shrink-0" />}
                      {sym}
                    </div>
                  </td>

                  <td className="py-2.5 text-right font-mono text-xs text-muted">
                    <span
                      key={flashKeys[sym] ?? 0}
                      className={
                        flash === 'up'   ? 'price-flash-up   px-1' :
                        flash === 'down' ? 'price-flash-down px-1' :
                        'px-1'
                      }
                    >
                      {fmtPrice(q.price)}
                    </span>
                  </td>

                  <td className={`py-2.5 text-right font-mono text-xs ${isPositive ? 'text-live' : 'text-alert'}`}>
                    {fmtChg(q.chg)}
                  </td>

                  <td className="py-2.5 text-right">
                    <button
                      onClick={e => { e.stopPropagation(); onRemoveTicker(sym); }}
                      className="text-muted hover:text-alert transition-colors p-0.5 rounded"
                      aria-label={`Remove ${sym}`}
                    >
                      <X size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
