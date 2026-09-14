import { TrendingUp, TrendingDown, Briefcase, DollarSign } from 'lucide-react';

interface Position {
  symbol: string;
  direction: 'Long' | 'Short';
  qty: number;
  entry: number;
  current: number;
  openDate: string;
}

const POSITIONS: Position[] = [
  { symbol: 'TSLA', direction: 'Long',  qty: 12,  entry: 175.22, current: 189.40, openDate: '2026-05-14' },
  { symbol: 'NVDA', direction: 'Long',  qty: 8,   entry: 482.10, current: 511.75, openDate: '2026-05-13' },
  { symbol: 'SPY',  direction: 'Short', qty: 20,  entry: 521.88, current: 514.30, openDate: '2026-05-16' },
  { symbol: 'AAPL', direction: 'Long',  qty: 15,  entry: 192.44, current: 188.90, openDate: '2026-05-12' },
  { symbol: 'BTC',  direction: 'Long',  qty: 0.5, entry: 61200,  current: 67340,  openDate: '2026-05-10' },
];

const VIRTUAL_CAPITAL = 100_000;

function calcPnl(p: Position) {
  const mult = p.direction === 'Long' ? 1 : -1;
  return (p.current - p.entry) * p.qty * mult;
}

export function PortfolioView() {
  const totalPnl = POSITIONS.reduce((sum, p) => sum + calcPnl(p), 0);
  const totalValue = POSITIONS.reduce((sum, p) => sum + p.current * p.qty, 0);
  const buyingPower = VIRTUAL_CAPITAL - POSITIONS.reduce((sum, p) => sum + p.entry * p.qty, 0);
  const pnlPositive = totalPnl >= 0;

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Paper Trading Portfolio</h1>
        <p className="text-muted text-sm">Virtual account — practice risk-free with real market data.</p>
      </div>

      {/* Banner cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<DollarSign size={18} className="text-live" />}
          label="Virtual Buying Power"
          value={`$${buyingPower.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="text-live"
        />
        <StatCard
          icon={pnlPositive ? <TrendingUp size={18} className="text-live" /> : <TrendingDown size={18} className="text-alert" />}
          label="Total Unrealised P&L"
          value={`${pnlPositive ? '+' : ''}$${totalPnl.toFixed(2)}`}
          color={pnlPositive ? 'text-live' : 'text-alert'}
        />
        <StatCard
          icon={<Briefcase size={18} className="text-gold" />}
          label="Open Positions"
          value={String(POSITIONS.length)}
          color="text-gold"
        />
        <StatCard
          icon={<DollarSign size={18} className="text-muted" />}
          label="Market Value"
          value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          color="text-white"
        />
      </div>

      {/* Positions table */}
      <div className="glass-panel overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Briefcase size={16} className="text-muted" />
          <h2 className="font-bold">Open Positions</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Symbol</th>
                <th className="text-left px-5 py-3">Direction</th>
                <th className="text-right px-5 py-3">Qty</th>
                <th className="text-right px-5 py-3">Entry</th>
                <th className="text-right px-5 py-3">Current</th>
                <th className="text-right px-5 py-3">Unrealised P&L</th>
                <th className="text-right px-5 py-3">Move</th>
                <th className="text-right px-5 py-3">Opened</th>
              </tr>
            </thead>
            <tbody>
              {POSITIONS.map((pos) => {
                const pnl     = calcPnl(pos);
                const move    = ((pos.current - pos.entry) / pos.entry) * 100 * (pos.direction === 'Short' ? -1 : 1);
                const isGreen = pnl >= 0;
                return (
                  <tr key={pos.symbol} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-bold font-mono text-white">{pos.symbol}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${pos.direction === 'Long' ? 'bg-live/10 text-live' : 'bg-alert/10 text-alert'}`}>
                        {pos.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-mono">{pos.qty}</td>
                    <td className="px-5 py-3 text-right font-mono text-muted">${pos.entry.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right font-mono">${pos.current.toFixed(2)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold ${isGreen ? 'text-live' : 'text-alert'}`}>
                      {isGreen ? '+' : ''}${pnl.toFixed(2)}
                    </td>
                    <td className={`px-5 py-3 text-right font-mono text-sm ${isGreen ? 'text-live' : 'text-alert'}`}>
                      {move >= 0 ? '+' : ''}{move.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-muted text-xs">{pos.openDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-muted/40 text-center mt-8 pb-4 px-4 leading-relaxed">
        <span className="font-semibold text-muted/50">Notice:</span> Past performance is not indicative of future results. Simulated or historical performance results have certain inherent limitations. All trading outcomes shown on this dashboard are for analytical purposes only.
      </p>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="glass-panel p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}
