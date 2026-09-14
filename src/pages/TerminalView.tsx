import { useState, useEffect, useRef } from 'react';
import { Maximize2, Minimize2, Search } from 'lucide-react';
import { TickerTape } from '../components/terminal/TickerTape';
import { AdvancedChart } from '../components/terminal/AdvancedChart';
import { Watchlist } from '../components/terminal/Watchlist';
import { PositionSizer } from '../components/terminal/PositionSizer';
import { AIAnalyst } from '../components/terminal/AIAnalyst';
import { useZenMode } from '../contexts/ZenModeContext';

const DEFAULT_TICKERS = ['TSLA', 'AMD', 'META', 'MSFT', 'GOOGL'];

export function TerminalView() {
  const [activeTicker, setActiveTicker] = useState<string>(() =>
    localStorage.getItem('vantix_active_ticker') ?? 'TSLA'
  );
  const [tickers, setTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('vantix_watchlist');
    return saved ? JSON.parse(saved) : DEFAULT_TICKERS;
  });
  const [searchInput, setSearchInput] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const { isZenMode, enterZen, exitZen } = useZenMode();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isZenMode) exitZen();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZenMode, exitZen]);

  useEffect(() => {
    localStorage.setItem('vantix_watchlist', JSON.stringify(tickers));
  }, [tickers]);

  useEffect(() => {
    localStorage.setItem('vantix_active_ticker', activeTicker);
  }, [activeTicker]);

  function addToWatchlist(sym: string) {
    if (!sym || tickers.includes(sym)) return;
    setTickers(prev => [...prev, sym]);
  }

  function removeFromWatchlist(sym: string) {
    setTickers(prev => prev.filter(t => t !== sym));
  }

  function handleSearch() {
    const sym = searchInput.trim().toUpperCase();
    if (!sym) return;
    setActiveTicker(sym);
    setSearchInput('');
  }

  if (isZenMode) {
    return (
      <div className="fixed inset-0 z-40 bg-canvas flex flex-col">
        <div className="flex-1">
          <AdvancedChart symbol={activeTicker} />
        </div>
        <button
          onClick={exitZen}
          className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-panel border border-border text-muted text-xs hover:text-white hover:border-live/50 transition-all"
        >
          <Minimize2 size={13} />
          Exit Zen — Esc
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <TickerTape />

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Main Chart Area */}
        <div className="col-span-12 xl:col-span-9 flex flex-col gap-3">

          {/* Unified Search Bar */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-input border border-border rounded-md px-3 py-1.5 w-64 focus-within:border-gold/50 transition-colors group">
              <Search size={13} className="text-muted/60 group-focus-within:text-gold/70 transition-colors shrink-0" />
              <input
                ref={searchRef}
                className="flex-1 bg-transparent text-xs text-white font-mono uppercase placeholder:text-muted/50 placeholder:normal-case focus:outline-none"
                placeholder="Search ticker… e.g. NVDA"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              {searchInput && (
                <button
                  onClick={handleSearch}
                  className="text-[10px] font-semibold text-gold/70 hover:text-gold transition-colors shrink-0"
                >
                  GO
                </button>
              )}
            </div>
            <span className="text-[10px] text-muted/40 font-mono hidden sm:block">
              Press Enter to sync chart &amp; analyst
            </span>
          </div>

          <div className="flex-1 min-h-[500px] relative">
            <AdvancedChart symbol={activeTicker} />
            <button
              onClick={enterZen}
              title="Zen Mode — full-screen chart"
              className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel/90 border border-border text-muted text-xs hover:text-white hover:border-live/50 transition-all backdrop-blur-sm"
            >
              <Maximize2 size={12} />
              Zen
            </button>
          </div>

          {/* Bottom Row under chart */}
          <div className="h-64 grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <AIAnalyst symbol={activeTicker} />
            </div>
            <div className="col-span-1">
              <PositionSizer />
            </div>
          </div>
        </div>

        {/* Right Sidebar Area */}
        <div className="col-span-12 xl:col-span-3 flex flex-col gap-6">
          <div className="flex-1 min-h-0">
            <Watchlist
              activeTicker={activeTicker}
              onSelect={setActiveTicker}
              tickers={tickers}
              onAddTicker={addToWatchlist}
              onRemoveTicker={removeFromWatchlist}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
