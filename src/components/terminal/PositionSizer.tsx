import { useState } from 'react';
import { Calculator } from 'lucide-react';

export function PositionSizer() {
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('1.0');
  const [entryPrice, setEntryPrice] = useState('175.22');
  const [stopLoss, setStopLoss] = useState('170.00');

  // Logic
  const size = parseFloat(accountSize) || 0;
  const risk = parseFloat(riskPercent) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;

  const capitalAtRisk = size * (risk / 100);
  const diff = Math.abs(entry - sl);
  const shares = diff > 0 ? Math.floor(capitalAtRisk / diff) : 0;
  const positionValue = shares * entry;

  return (
    <div id="tour-position-sizer" className="glass-panel p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-muted" />
        Position Sizer
      </h2>
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Account Size ($)</label>
          <input 
            type="number" 
            value={accountSize}
            onChange={(e) => setAccountSize(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-live/50 transition-colors"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Risk %</label>
            <input 
              type="number" 
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-live/50 transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Entry Price</label>
            <input 
              type="number" 
              step="0.01"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-live/50 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1 uppercase tracking-wider">Stop Loss</label>
            <input 
              type="number" 
              step="0.01"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:border-alert/50 transition-colors"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 mt-4 border-t border-border">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted">Suggested Shares</span>
          <span className="font-mono font-bold text-live text-lg">{shares}</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-muted">Capital at Risk</span>
          <span className="font-mono font-bold text-alert">${capitalAtRisk.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted">Position Value</span>
          <span className="font-mono text-xs text-white">${positionValue.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
