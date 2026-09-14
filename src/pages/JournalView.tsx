import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, BrainCircuit, FlaskConical, Plus, TrendingUp, TrendingDown, X, AlertTriangle, CheckCircle2, Lock, Crown, Zap, Trash2, ChevronDown, Sparkles, RefreshCw } from 'lucide-react';
import { generateAICoachAnalysis, computeCoachInsightsFallback, type CoachInsight } from '../lib/aiCoachService';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../lib/supabase';
import { Tooltip } from '../components/ui/Tooltip';
import { decryptKey } from '../lib/crypto';

// ── Types ─────────────────────────────────────────────────────────────────────

type PsychTag = 'Calm' | 'FOMO' | 'Revenge' | 'Disciplined' | 'Impulsive';

interface Trade {
  id: string;
  symbol: string;
  entry: number;
  exit: number;
  pnl: number;
  date: string;       // stored as YYYY-MM-DD; formatted for display only at render time
  tag: PsychTag;
  notes?: string;
  stopLoss?: number;
}

const TAG_STYLES: Record<PsychTag, string> = {
  Calm: 'bg-live/15 text-live border border-live/30',
  Disciplined: 'bg-live/10 text-live/80 border border-live/20',
  FOMO: 'bg-alert/15 text-alert border border-alert/30',
  Revenge: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  Impulsive: 'bg-gold/10 text-gold border border-gold/30',
};

const TAG_PILL_ACTIVE: Record<PsychTag, string> = {
  Calm: 'bg-live/20 text-live border-live/50',
  Disciplined: 'bg-live/15 text-live/90 border-live/40',
  FOMO: 'bg-alert/20 text-alert border-alert/50',
  Revenge: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  Impulsive: 'bg-gold/20 text-gold border-gold/50',
};

const PSYCH_TAGS: PsychTag[] = ['Calm', 'Disciplined', 'FOMO', 'Revenge', 'Impulsive'];

const SCENARIOS = [
  'What if interest rates drop by 1%?',
  'What if VIX spikes above 30?',
  'What if BTC drops 20%?',
  'What if the Fed pauses hikes?',
  'What if CPI comes in hot?',
  'What if oil prices surge to $120?',
  'What if US Dollar (DXY) spikes to 110?',
  'What if geopolitical conflict escalates?',
  'What if unemployment rises to 5%?',
];

const FREE_TRADE_LIMIT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Formats a YYYY-MM-DD string (or legacy already-formatted string) to "Jul 11".
// Formatting happens only at render time so raw dates are stored in the database.
function formatDate(dateStr: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateStr; // legacy rows already formatted — pass through unchanged
}

// ── Shared ────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, tooltip }: { icon: React.ReactNode; title: string; tooltip?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gold">{icon}</span>
      <h2 className="text-base font-bold tracking-wide flex items-center gap-1.5">
        {title}
        {tooltip && <Tooltip text={tooltip} />}
      </h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] text-muted uppercase tracking-widest font-medium">
      {children}
    </label>
  );
}

const inputCls =
  'w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors font-mono';

// ── Upgrade Modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-[#0D0D0F] border border-gold/25 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden"
        style={{ boxShadow: '0 0 60px rgb(var(--glow-accent) / 0.15), 0 20px 60px rgba(0,0,0,0.7)' }}
      >
        <div className="h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="px-7 pt-7 pb-8 flex flex-col gap-5">
          <div className="flex justify-center">
            <div
              className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 30px rgb(var(--glow-accent) / 0.25)' }}
            >
              <Lock size={24} className="text-gold" />
            </div>
          </div>
          <div className="text-center flex flex-col gap-2">
            <h3 className="text-lg font-bold text-white">Journal Logging Limit Reached</h3>
            <p className="text-sm text-muted leading-relaxed">
              🔥 Don't trade in the dark. Free accounts are limited to{' '}
              <span className="text-white font-semibold">5 trade logs</span>. Upgrade to{' '}
              <span className="text-gold font-semibold">Vantix PRO</span> for unlimited logging,
              historical analysis, and personalized insights from the AI Trading Coach.
            </p>
          </div>
          <Link
            to="/billing"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold text-black transition-all"
            style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 28px rgb(var(--glow-accent) / 0.40)' }}
          >
            <Crown size={15} />
            Upgrade to PRO ($29/mo)
          </Link>
          <button onClick={onClose} className="text-xs text-muted/50 hover:text-muted text-center transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Trade Modal ───────────────────────────────────────────────────────────

interface NewTradeModalProps {
  onClose: () => void;
  onSave: (trade: Omit<Trade, 'id'>) => void;
}

interface TradeForm {
  symbol: string;
  direction: 'Long' | 'Short';
  quantity: string;
  entry: string;
  stopLoss: string;
  exit: string;
  date: string;
  tag: PsychTag;
  notes: string;
}

const EMPTY_FORM: TradeForm = {
  symbol: '',
  direction: 'Long',
  quantity: '',
  entry: '',
  stopLoss: '',
  exit: '',
  date: '',
  tag: 'Calm',
  notes: '',
};

function NewTradeModal({ onClose, onSave }: NewTradeModalProps) {
  const [form, setForm] = useState<TradeForm>(EMPTY_FORM);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstInputRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set(field: keyof TradeForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    const sym = form.symbol.trim().toUpperCase();
    const entry = parseFloat(form.entry);
    const exit = parseFloat(form.exit);
    const qty = parseFloat(form.quantity);
    if (!sym || isNaN(entry) || isNaN(exit) || isNaN(qty) || qty <= 0) return;

    const mult = form.direction === 'Long' ? 1 : -1;
    const pnl = (exit - entry) * qty * mult;

    // Store raw YYYY-MM-DD — formatDate() renders it at display time
    const date = form.date || new Date().toISOString().split('T')[0];

    const rawStopLoss = parseFloat(form.stopLoss);
    onSave({
      symbol: sym,
      entry,
      exit,
      pnl,
      date,
      tag: form.tag,
      notes: form.notes.trim() || undefined,
      stopLoss: !isNaN(rawStopLoss) && rawStopLoss > 0 ? rawStopLoss : undefined,
    });
  }

  const canSave = form.symbol.trim() && form.entry && form.exit && form.quantity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#121214] border border-[#1E1E22] rounded-xl w-full max-w-md shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-gold"><BookOpen size={16} /></span>
            <h3 className="font-bold text-base">New Trade</h3>
          </div>
          <button onClick={onClose} className="text-muted hover:text-white transition-colors p-1 rounded" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">

          {/* Symbol + Direction */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <FieldLabel>Symbol</FieldLabel>
              <input
                ref={firstInputRef}
                className={inputCls}
                placeholder="e.g. TSLA"
                value={form.symbol}
                onChange={e => set('symbol', e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Direction</FieldLabel>
              <div className="flex rounded-md overflow-hidden border border-border h-[38px]">
                <button type="button" onClick={() => set('direction', 'Long')}
                  className={`px-4 text-sm font-semibold transition-colors ${form.direction === 'Long' ? 'bg-live/20 text-live' : 'bg-input text-muted hover:text-white'}`}>
                  Long
                </button>
                <div className="w-px bg-border" />
                <button type="button" onClick={() => set('direction', 'Short')}
                  className={`px-4 text-sm font-semibold transition-colors ${form.direction === 'Short' ? 'bg-alert/20 text-alert' : 'bg-input text-muted hover:text-white'}`}>
                  Short
                </button>
              </div>
            </div>
          </div>

          {/* Qty + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Quantity (Shares / Coins)</FieldLabel>
              <input className={inputCls} placeholder="e.g. 100" type="number" min="0" step="any"
                value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Date</FieldLabel>
              <input className={`${inputCls} [color-scheme:dark]`} type="date"
                value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          {/* Entry + Stop-Loss + Exit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Entry Price</FieldLabel>
              <input className={inputCls} placeholder="0.00" type="number" min="0" step="0.01"
                value={form.entry} onChange={e => set('entry', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Stop-Loss <span className="normal-case text-muted/50">(opt.)</span></FieldLabel>
              <input className={inputCls} placeholder="0.00" type="number" min="0" step="0.01"
                value={form.stopLoss} onChange={e => set('stopLoss', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Exit Price</FieldLabel>
              <input className={inputCls} placeholder="0.00" type="number" min="0" step="0.01"
                value={form.exit} onChange={e => set('exit', e.target.value)} />
            </div>
          </div>

          {/* P&L preview */}
          {form.entry && form.exit && form.quantity && (
            <PnlPreview
              entry={parseFloat(form.entry)}
              exit={parseFloat(form.exit)}
              quantity={parseFloat(form.quantity)}
              direction={form.direction}
              stopLoss={form.stopLoss ? parseFloat(form.stopLoss) : undefined}
            />
          )}

          {/* Psychological State */}
          <div className="flex flex-col gap-2">
            <FieldLabel>Psychological State</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {PSYCH_TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => set('tag', tag)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${form.tag === tag ? TAG_PILL_ACTIVE[tag] : 'bg-white/5 text-muted border-border hover:border-muted'
                    }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Trade Notes */}
          <div className="flex flex-col gap-1.5">
            <FieldLabel>Trade Notes / Lesson</FieldLabel>
            <textarea
              className={`${inputCls} resize-none leading-relaxed`} rows={3}
              placeholder="Why did you take this trade? What did you learn?"
              value={form.notes} onChange={e => set('notes', e.target.value)}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-muted hover:text-white border border-border hover:border-muted rounded-md transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-live/10 hover:bg-live/20 border border-live/40 text-live transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Trade
          </button>
        </div>
      </div>
    </div>
  );
}

// ── P&L Preview ───────────────────────────────────────────────────────────────

interface PnlPreviewProps {
  entry: number;
  exit: number;
  quantity: number;
  direction: 'Long' | 'Short';
  stopLoss?: number;
}

function PnlPreview({ entry, exit, quantity, direction, stopLoss }: PnlPreviewProps) {
  if (!entry || !exit || !quantity || isNaN(entry) || isNaN(exit) || isNaN(quantity)) return null;

  const rawMove = direction === 'Long' ? exit - entry : entry - exit;
  const dollarPnl = rawMove * quantity;
  const pct = ((rawMove / entry) * 100).toFixed(2);
  const positive = dollarPnl >= 0;

  let rrLabel: string | null = null;
  if (stopLoss && stopLoss > 0) {
    const risk = Math.abs(entry - stopLoss) * quantity;
    const reward = Math.abs(dollarPnl);
    if (risk > 0) rrLabel = (reward / risk).toFixed(2);
  }

  return (
    <div className={`rounded-md border px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono ${positive ? 'border-live/30 bg-live/5' : 'border-alert/30 bg-alert/5'
      }`}>
      <div className="flex items-center gap-1.5">
        <span className="text-muted/70">P&amp;L</span>
        <span className={`font-bold ${positive ? 'text-live' : 'text-alert'}`}>
          {positive ? '+' : ''}${dollarPnl.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted/70">Move</span>
        <span className={positive ? 'text-live' : 'text-alert'}>{positive ? '+' : ''}{pct}%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-muted/70">Qty</span>
        <span className="text-white/70">{quantity}</span>
      </div>
      {rrLabel && (
        <div className="flex items-center gap-1.5">
          <span className="text-muted/70">R/R</span>
          <span className="text-gold font-semibold">{rrLabel}:1</span>
        </div>
      )}
    </div>
  );
}

// ── Trade Logger ──────────────────────────────────────────────────────────────

interface TradeLoggerProps {
  trades: Trade[];
  tier: 'free' | 'pro';
  onNewTrade: () => void;
  onDeleteTrade: (id: string) => void;
}

function TradeLogger({ trades, tier, onNewTrade, onDeleteTrade }: TradeLoggerProps) {
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const wins = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

  const visibleTrades = tier === 'free' ? trades.slice(0, FREE_TRADE_LIMIT) : trades;
  const hiddenCount = tier === 'free' ? Math.max(0, trades.length - FREE_TRADE_LIMIT) : 0;

  return (
    <section className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader icon={<BookOpen size={16} />} title="Trade Logger" tooltip="Allows you to manually log and track your trades. The system calculates the total P&L, win rate, and number of executed trades." />
        <button
          onClick={onNewTrade}
          className="btn-glow flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md bg-live/10 hover:bg-live/20 border border-live/40 text-live transition-colors"
        >
          <Plus size={14} />
          New Trade
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Total P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, positive: totalPnl >= 0 },
          { label: 'Win Rate', value: `${winRate}%`, positive: winRate >= 50 },
          { label: 'Trades', value: String(trades.length), positive: true },
        ].map(s => (
          <div key={s.label} className="glass-panel card-lift px-4 py-3 flex flex-col gap-0.5">
            <span className="text-[10px] text-muted uppercase tracking-widest">{s.label}</span>
            <span className={`text-lg font-bold font-mono ${s.positive ? 'text-live' : 'text-alert'}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-panel flex-1 overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel text-muted text-left border-b border-border z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium text-right">Entry / SL</th>
                <th className="px-4 py-3 font-medium text-right">Exit</th>
                <th className="px-4 py-3 font-medium text-right">P&L</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Psychology</th>
                <th className="px-4 py-3 font-medium max-w-[130px]">Notes</th>
                <th className="w-10 py-3" />
              </tr>
            </thead>
            <tbody className="font-mono divide-y divide-border/40">
              {visibleTrades.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-xs text-muted/50">
                    No trades logged yet. Click <span className="text-white/60 font-semibold">'New Trade'</span> to log your first trade.
                  </td>
                </tr>
              )}
              {visibleTrades.map(t => {
                const isWin = t.pnl >= 0;
                return (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-bold text-white">
                      <div className="flex items-center gap-2">
                        {isWin
                          ? <TrendingUp size={13} className="text-live" />
                          : <TrendingDown size={13} className="text-alert" />}
                        {t.symbol}
                      </div>
                    </td>
                    {/* Entry + optional Stop Loss */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-muted">${t.entry.toFixed(2)}</span>
                        {t.stopLoss != null && (
                          <span className="text-[10px] text-alert/65 font-mono">
                            SL ${t.stopLoss.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">${t.exit.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isWin ? 'text-live' : 'text-alert'}`}>
                      {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                    </td>
                    {/* Date: render formatted, store raw */}
                    <td className="px-4 py-3 text-muted">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TAG_STYLES[t.tag]}`}>
                        {t.tag}
                      </span>
                    </td>
                    {/* Notes preview — full text accessible via title tooltip */}
                    <td className="px-4 py-3 max-w-[130px]">
                      {t.notes ? (
                        <span
                          className="block truncate text-[11px] text-muted/65 cursor-help"
                          title={t.notes}
                        >
                          {t.notes}
                        </span>
                      ) : (
                        <span className="text-muted/25 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="pr-3 py-3 text-right">
                      <button
                        onClick={() => onDeleteTrade(t.id)}
                        className="text-muted hover:text-alert transition-colors p-1 rounded hover:bg-alert/10"
                        title="Delete trade"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {/* Locked history row */}
              {hiddenCount > 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg border border-gold/20 bg-gold/[0.04]">
                      <div className="flex items-center gap-2.5 text-xs text-muted/70">
                        <Lock size={13} className="text-gold/60 shrink-0" />
                        <span>
                          <span className="font-semibold text-white/60">{hiddenCount} older trade{hiddenCount > 1 ? 's' : ''}</span>
                          {' '}hidden in Free tier.
                        </span>
                      </div>
                      <Link
                        to="/billing"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-black shrink-0 transition-all"
                        style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 14px rgb(var(--glow-accent) / 0.30)' }}
                      >
                        <Crown size={11} />
                        Unlock Full History
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ── AI Coach ──────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<CoachInsight['type'], {
  border: string; dot: string; label: string; labelCls: string; bg: string;
}> = {
  risk: { border: 'border-alert/30',  dot: 'bg-alert',  label: 'Risk', labelCls: 'text-alert',  bg: 'bg-alert/[0.04]'  },
  edge: { border: 'border-live/30',   dot: 'bg-live',   label: 'Edge', labelCls: 'text-live',   bg: 'bg-live/[0.04]'   },
  rule: { border: 'border-gold/30',   dot: 'bg-gold',   label: 'Rule', labelCls: 'text-gold',   bg: 'bg-gold/[0.04]'   },
};

interface CachedCoach {
  tradeCount: number;
  usedAI: boolean;
  summary: string;
  insights: CoachInsight[];
  ts: number;
}

const CACHE_KEY = 'vantix_ai_coach_cache';
const CACHE_TTL = 1000 * 60 * 30; // 30 min

function loadCache(): CachedCoach | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CachedCoach;
    if (Date.now() - c.ts > CACHE_TTL) return null;
    return c;
  } catch { return null; }
}

function saveCache(data: Omit<CachedCoach, 'ts'>) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() }));
}

function InsightCard({ ins }: { ins: CoachInsight }) {
  const s = INSIGHT_STYLES[ins.type];
  return (
    <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-[10px] font-bold uppercase tracking-widest ${s.labelCls}`}>{s.label}</span>
        <span className="text-xs font-semibold text-white/85 ml-1">{ins.title}</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{ins.body}</p>
    </div>
  );
}

function AICoach({ trades, userId }: { trades: Trade[]; userId: string }) {
  const [status, setStatus]   = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [usedAI, setUsedAI]   = useState(false);
  const [summary, setSummary] = useState('');
  const [insights, setInsights] = useState<CoachInsight[]>([]);
  const [errMsg, setErrMsg]   = useState('');

  // Load cache on mount
  useEffect(() => {
    const c = loadCache();
    if (c && c.tradeCount === trades.length) {
      setSummary(c.summary);
      setInsights(c.insights);
      setUsedAI(c.usedAI);
      setStatus('done');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = useCallback(async (force = false) => {
    if (trades.length === 0) return;
    setStatus('loading');
    setErrMsg('');
    try {
      const rawKey = localStorage.getItem('vantix_gemini_api_key') ?? '';
      const apiKey = decryptKey(rawKey, userId) || undefined;
      const { analysis, usedAI: ai } = await generateAICoachAnalysis(trades, apiKey);
      setSummary(analysis.summary);
      setInsights(analysis.insights);
      setUsedAI(ai);
      saveCache({ tradeCount: trades.length, usedAI: ai, summary: analysis.summary, insights: analysis.insights });
      setStatus('done');
    } catch (e) {
      // Gemini failed — fall back to rule-based
      const fallback = computeCoachInsightsFallback(trades);
      setSummary(fallback.summary);
      setInsights(fallback.insights);
      setUsedAI(false);
      if (force) {
        setErrMsg(e instanceof Error ? e.message : 'Gemini API error. Showing rule-based analysis.');
      }
      setStatus('done');
    }
  }, [trades, userId]);

  const hasLocalKey = !!decryptKey(localStorage.getItem('vantix_gemini_api_key') ?? '', userId);

  return (
    <section className="flex flex-col h-full">
      <SectionHeader
        icon={<BrainCircuit size={16} />}
        title="AI Coach Insights"
        tooltip="Powered by Google Gemini 1.5 Flash when an API key is configured, or falls back to behavioral rule analysis of your logged trades."
      />
      <div className="glass-panel flex-1 flex flex-col p-5 gap-4 overflow-y-auto">

        {/* Legal disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/5 border border-alert/15 shrink-0">
          <AlertTriangle size={12} className="text-alert/50 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted/55 leading-relaxed">
            <span className="font-semibold text-muted/75">Disclaimer:</span> AI Coach insights are calculated using behavioral analysis rules based on your logged trades, are for educational purposes only, and do not constitute professional financial advice. Vantix is not responsible for trading losses.
          </p>
        </div>

        {trades.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[80px]">
            <p className="text-xs text-muted/40 text-center px-4">Log trades to unlock your personalized AI Coaching insights.</p>
          </div>
        ) : status === 'idle' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
            <div
              className="w-14 h-14 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center"
              style={{ boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.15)' }}
            >
              <Sparkles size={22} className="text-gold" />
            </div>
            <div className="text-center flex flex-col gap-1.5">
              <p className="text-sm font-semibold text-white/80">Ready to analyze {trades.length} trade{trades.length > 1 ? 's' : ''}</p>
              <p className="text-xs text-muted/60 max-w-[220px] leading-relaxed">
                {hasLocalKey || (import.meta as any).env?.VITE_GEMINI_API_KEY
                  ? 'Powered by Google Gemini 1.5 Flash'
                  : 'Using behavioral rule analysis (add Gemini key in Settings for AI coaching)'}
              </p>
            </div>
            <button
              onClick={() => void generate(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 20px rgb(var(--glow-accent) / 0.30)' }}
            >
              <Sparkles size={15} />
              Generate AI Coaching Analysis
            </button>
          </div>
        ) : status === 'loading' ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-8">
            <div className="relative w-10 h-10">
              <div
                className="absolute inset-0 rounded-full border-2 border-gold/15 animate-spin"
                style={{ borderTopColor: 'rgb(var(--color-gold))' }}
              />
            </div>
            <p className="text-xs text-muted animate-pulse">Analyzing your trade journal…</p>
          </div>
        ) : (
          <>
            {/* Status bar */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-white/5 border border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-live animate-pulse shrink-0" />
                <span className="text-xs text-muted">
                  {usedAI ? 'Gemini AI' : 'Rule-based'} · {trades.length} trade{trades.length > 1 ? 's' : ''} analyzed
                </span>
              </div>
              <button
                onClick={() => void generate(true)}
                className="flex items-center gap-1.5 text-[11px] text-muted/60 hover:text-white transition-colors"
                title="Re-generate"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            </div>

            {/* Error notice */}
            {errMsg && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-alert/5 border border-alert/20 shrink-0">
                <AlertTriangle size={12} className="text-alert/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-alert/70 leading-snug">{errMsg}</p>
              </div>
            )}

            {/* Summary */}
            {summary && (
              <p className="text-xs text-muted/80 leading-relaxed italic shrink-0">{summary}</p>
            )}

            {/* Insight cards */}
            {insights.length === 0 ? (
              <p className="text-xs text-muted/60 italic">Keep logging trades — patterns will surface as your journal grows.</p>
            ) : (
              insights.map((ins, i) => <InsightCard key={i} ins={ins} />)
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ── Scenario Simulator ────────────────────────────────────────────────────────

const TECH_TICKERS = new Set(['NVDA', 'TSLA', 'MSFT', 'AAPL', 'GOOGL', 'META', 'AMD', 'AMZN', 'NFLX', 'ORCL', 'CRM', 'SNOW', 'PLTR']);
const CRYPTO_TICKERS = new Set(['COIN', 'MSTR', 'RIOT', 'MARA', 'BTC', 'ETH', 'BTCUSD', 'ETHUSD']);
const ENERGY_TICKERS = new Set(['XLE', 'CVX', 'XOM', 'COP', 'SLB', 'OXY', 'MPC', 'PSX', 'EOG', 'PXD', 'VLO', 'HAL']);

interface SimResult { headline: string; detail: string; positive: boolean }

const BASE_IMPACTS: Record<string, { bull: number; bear: number; detail: (pct: number, hasTech: boolean, hasCrypto: boolean) => string; positiveBull: boolean }> = {
  'What if interest rates drop by 1%?': {
    bull: 12.4, bear: 12.4,
    detail: (_pct, hasTech) => `Growth stocks ${hasTech ? '(TSLA, NVDA, MSFT in your journal) ' : ''}likely to outperform. Bonds rally. USD weakens. Bullish for risk-on positions.`,
    positiveBull: true,
  },
  'What if VIX spikes above 30?': {
    bull: -8.7, bear: -8.7,
    detail: (pct) => `High volatility regime compresses multiples. Estimated ${pct.toFixed(1)}% drawdown. Reduce position sizes; hedge with VIX calls or inverse ETFs.`,
    positiveBull: false,
  },
  'What if BTC drops 20%?': {
    bull: -3.1, bear: -3.1,
    detail: (_pct, _h, hasCrypto) => `${hasCrypto ? 'Direct crypto exposure detected in your journal. ' : ''}Indirect drag via COIN, MSTR sentiment. Crypto-correlated equities may sell off 10–15%.`,
    positiveBull: false,
  },
  'What if the Fed pauses hikes?': {
    bull: 9.2, bear: 9.2,
    detail: () => 'Relief rally likely across equities. Small-caps and rate-sensitive sectors (Real Estate, Utilities) lead the move.',
    positiveBull: true,
  },
  'What if CPI comes in hot?': {
    bull: -6.5, bear: -6.5,
    detail: (_pct, hasTech) => `Hawkish repricing of rate path. ${hasTech ? 'Tech-heavy portfolio faces outsized compression. ' : ''}Energy and commodities may rally as inflation hedge.`,
    positiveBull: false,
  },
  'What if oil prices surge to $120?': {
    bull: -4.5, bear: -4.5,
    detail: () => 'Margin compression for airlines, logistics, and consumer discretionary. Energy sector (XLE, CVX, XOM) benefits strongly. Broader market faces stagflation risk.',
    positiveBull: false,
  },
  'What if US Dollar (DXY) spikes to 110?': {
    bull: -3.8, bear: -3.8,
    detail: (_pct, hasTech, hasCrypto) => `Strong dollar headwinds hit multinationals and emerging markets. ${hasTech ? 'Tech earnings at risk from overseas revenue compression. ' : ''}${hasCrypto ? 'Crypto typically sells off as USD strengthens. ' : ''}Commodities and gold face selling pressure.`,
    positiveBull: false,
  },
  'What if geopolitical conflict escalates?': {
    bull: -6.2, bear: -6.2,
    detail: () => 'VIX spikes — risk-off rotation accelerates. Defense stocks (LMT, RTX, NOC) and gold rally. Energy supply fears push oil higher. Reduce leverage; increase defensive exposure.',
    positiveBull: false,
  },
  'What if unemployment rises to 5%?': {
    bull: -5.0, bear: -5.0,
    detail: () => 'Recession risk elevated — consumer spending contracts. However, rising unemployment may force the Fed into rate cuts, providing a medium-term tailwind for growth stocks and bonds.',
    positiveBull: false,
  },
};

function computeScenarioResult(scenario: string, trades: Trade[]): SimResult {
  const base = BASE_IMPACTS[scenario];
  if (!base) return { headline: 'N/A', detail: 'Unknown scenario.', positive: true };

  const symbols = trades.map(t => t.symbol.toUpperCase());
  const hasTech = symbols.some(s => TECH_TICKERS.has(s));
  const hasCrypto = symbols.some(s => CRYPTO_TICKERS.has(s));
  const hasEnergy = symbols.some(s => ENERGY_TICKERS.has(s));

  let impact = base.bull;
  if (trades.length === 0) {
    const detail = base.detail(Math.abs(impact), false, false) + ' (Simulating impact on standard benchmark index.)';
    return { headline: `${impact >= 0 ? '+' : ''}${impact.toFixed(1)}% est. benchmark impact`, detail, positive: base.positiveBull };
  }

  if (hasTech && (scenario.includes('interest rates') || scenario.includes('Fed') || scenario.includes('CPI'))) {
    impact = impact * 1.15;
  }
  if (hasCrypto && scenario.includes('BTC')) impact = impact * 1.6;
  if (scenario.includes('oil prices')) impact = hasEnergy ? 8.2 : impact;
  if (scenario.includes('DXY') || scenario.includes('US Dollar')) {
    if (hasTech || hasCrypto) impact = impact * 1.25;
  }
  if (scenario.includes('geopolitical') && (hasTech || hasCrypto)) impact = impact * 1.1;

  return {
    headline: `${impact >= 0 ? '+' : ''}${impact.toFixed(1)}% est. portfolio impact`,
    detail: base.detail(Math.abs(impact), hasTech, hasCrypto),
    positive: impact >= 0,
  };
}

function ScenarioSimulator({ trades }: { trades: Trade[] }) {
  const [selected, setSelected] = useState(SCENARIOS[0]);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setIsOpen(false); }
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onMouseDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onMouseDown);
    };
  }, [isOpen]);

  function select(scenario: string) { setSelected(scenario); setResult(null); setIsOpen(false); }

  function runSimulation() {
    setResult(null);
    setRunning(true);
    setTimeout(() => { setResult(computeScenarioResult(selected, trades)); setRunning(false); }, 900);
  }

  return (
    <section className="flex flex-col h-full">
      <SectionHeader icon={<FlaskConical size={16} />} title="Scenario Simulator" tooltip="Allows you to test and simulate how different macro market scenarios (such as change in interest rates, spike in the VIX fear index, or a crash in Bitcoin) will affect your portfolio." />
      <div className="glass-panel flex-1 p-5 flex flex-col gap-4">
        <p className="text-xs text-muted -mt-1">Model the impact of macro events on your portfolio</p>

        {/* Legal disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-alert/5 border border-alert/15">
          <AlertTriangle size={12} className="text-alert/50 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted/55 leading-relaxed">
            <span className="font-semibold text-muted/75">Disclaimer:</span> Projections are simulated estimations of historical beta adjustments and do not guarantee future market behavior.
          </p>
        </div>

        {/* Custom dropdown */}
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Select scenario</FieldLabel>
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(v => !v)}
              className={[
                'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm text-white',
                'bg-input border transition-colors duration-150 cursor-pointer text-left',
                isOpen ? 'border-gold/60 shadow-[0_0_0_1px_rgb(var(--color-gold)/0.15)]' : 'border-border hover:border-muted/50',
              ].join(' ')}
            >
              <span className="truncate">{selected}</span>
              <ChevronDown size={15} className={`shrink-0 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={[
              'absolute z-50 left-0 right-0 top-full mt-1.5 rounded-lg overflow-hidden',
              'bg-[#131316] border border-border/90 shadow-2xl',
              'transition-all duration-200 origin-top',
              isOpen
                ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-y-95 -translate-y-1 pointer-events-none',
            ].join(' ')}>
              <div className="max-h-52 overflow-y-auto scrollbar-gold py-1">
                {SCENARIOS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => select(s)}
                    className={[
                      'w-full text-left px-3 py-2.5 text-sm transition-colors duration-100',
                      s === selected ? 'bg-gold/10 text-gold font-medium' : 'text-white/80 hover:bg-white/5 hover:text-white',
                    ].join(' ')}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button onClick={runSimulation} disabled={running}
          className="btn-glow w-full py-2.5 rounded-md text-sm font-semibold border border-gold/40 bg-gold/10 hover:bg-gold/20 text-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {running ? 'Running simulation…' : 'Run Simulation'}
        </button>

        {running && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-white/5 border border-border animate-pulse">
            <span className="w-2 h-2 rounded-full bg-gold animate-ping" />
            <span className="text-xs text-muted">Processing macro variables…</span>
          </div>
        )}

        {result && !running && (
          <div className={`rounded-lg border p-4 flex flex-col gap-2 ${result.positive ? 'border-live/30 bg-live/5' : 'border-alert/30 bg-alert/5'}`}>
            <span className={`text-lg font-bold font-mono ${result.positive ? 'text-live' : 'text-alert'}`}>{result.headline}</span>
            <p className="text-xs text-muted leading-relaxed">{result.detail}</p>
          </div>
        )}

        {!result && !running && (
          <div className="flex-1 flex items-center justify-center empty-state-pulse min-h-[60px]">
            <p className="text-xs text-muted/40">Select a scenario and run the simulation</p>
          </div>
        )}
      </div>
    </section>
  );
}

// ── AI Behavioral Dashboard ───────────────────────────────────────────────────

const BAR_COLOR: Record<PsychTag, string> = {
  Calm: 'bg-live',
  Disciplined: 'bg-live/80',
  FOMO: 'bg-alert',
  Revenge: 'bg-orange-500',
  Impulsive: 'bg-gold',
};

function computeBehaviorStats(trades: Trade[]) {
  const map: Partial<Record<PsychTag, { wins: number; total: number }>> = {};
  for (const t of trades) {
    if (!map[t.tag]) map[t.tag] = { wins: 0, total: 0 };
    map[t.tag]!.total++;
    if (t.pnl > 0) map[t.tag]!.wins++;
  }
  return PSYCH_TAGS.map(tag => ({ tag, wins: map[tag]?.wins ?? 0, total: map[tag]?.total ?? 0 }));
}

interface AIBehavioralDashboardProps {
  trades: Trade[];
  tier: 'free' | 'pro';
}

function AIBehavioralDashboard({ trades, tier }: AIBehavioralDashboardProps) {
  const behaviorStats = computeBehaviorStats(trades);
  const locked = tier === 'free';

  // Revenge trade dynamics
  const revengeTrades = trades.filter(t => t.tag === 'Revenge');
  const revengeWins = revengeTrades.filter(t => t.pnl > 0).length;
  const revengeLosses = revengeTrades.length - revengeWins;
  const revengeLossPct = revengeTrades.length > 0
    ? Math.round((revengeLosses / revengeTrades.length) * 100)
    : 0;

  // Peak performance dynamics (Calm + Disciplined)
  const focusTrades = trades.filter(t => t.tag === 'Calm' || t.tag === 'Disciplined');
  const focusWins = focusTrades.filter(t => t.pnl > 0).length;
  const focusWinPct = focusTrades.length > 0
    ? Math.round((focusWins / focusTrades.length) * 100)
    : 0;

  return (
    <section className="glass-panel p-5 flex flex-col gap-5 relative">

      <div className={locked ? 'blur-[3px] select-none pointer-events-none' : ''}>
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-gold"><BrainCircuit size={16} /></span>
          <h2 className="text-base font-bold tracking-wide flex items-center gap-1.5">
            AI Behavioral Analytics
            <Tooltip text="Analyzes the performance of your trades based on the psychological state you were in (Calm, FOMO, Revenge, etc.). It helps you identify which psychological behavior patterns positively or negatively affect your trading profitability." />
          </h2>
          <span className="ml-auto text-[10px] font-mono text-muted border border-border px-2 py-0.5 rounded-full">
            Last {trades.length} trades
          </span>
        </div>

        {/* Win-rate bars */}
        <div className="flex flex-col gap-3 mb-5">
          {behaviorStats.map(({ tag, wins, total }) => {
            const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
            return (
              <div key={tag} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-semibold px-1.5 py-0.5 rounded text-[10px] border ${TAG_STYLES[tag]}`}>{tag}</span>
                  <span className={`font-mono font-bold text-xs ${pct >= 50 ? 'text-live' : total === 0 ? 'text-muted/50' : 'text-alert'}`}>
                    {total === 0 ? 'No trades' : `${pct}% win`}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${BAR_COLOR[tag]}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-muted/60 font-mono">{wins}/{total} trades profitable</p>
              </div>
            );
          })}
        </div>

        {/* Dynamic insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Revenge Trade Alert — dynamic */}
          <div className="rounded-lg border border-orange-500/30 bg-orange-500/[0.06] p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={13} className="text-orange-400 shrink-0" />
              <span className="text-xs font-bold text-orange-400">Revenge Trade Alert</span>
            </div>
            <p className="text-[11px] text-muted/80 leading-relaxed">
              {revengeTrades.length === 0
                ? 'No Revenge trades logged yet. Great discipline!'
                : `${revengeLossPct}% loss rate on ${revengeTrades.length} Revenge-tagged trade${revengeTrades.length > 1 ? 's' : ''}. Trades placed after a loss carry significantly elevated risk. Consider a mandatory 30-min cooling-off rule.`}
            </p>
          </div>

          {/* Peak Performance — dynamic */}
          <div
            className="rounded-lg border border-live/25 bg-live/[0.06] p-4 flex flex-col gap-2"
            style={{ boxShadow: '0 0 18px rgb(var(--glow-live) / 0.06)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={13} className="text-live shrink-0" />
              <span className="text-xs font-bold text-live">Peak Performance</span>
            </div>
            <p className="text-[11px] text-muted/80 leading-relaxed">
              {focusTrades.length === 0
                ? 'Log Calm or Disciplined trades to analyze your peak focus state.'
                : `${focusWinPct}% win rate across ${focusTrades.length} Calm & Disciplined trade${focusTrades.length > 1 ? 's' : ''}. Your edge is strongest when you wait for high-conviction setups without emotional pressure.`}
            </p>
          </div>

        </div>
      </div>

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 rounded-xl backdrop-blur-sm bg-black/60 flex flex-col items-center justify-center p-8 z-10">
          <div className="flex flex-col items-center gap-4 text-center max-w-xs">
            <div
              className="w-12 h-12 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center"
              style={{ boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.25)' }}
            >
              <Lock size={20} className="text-gold" />
            </div>
            <h3 className="text-base font-bold text-white">🔒 Unlock AI Behavioral Analytics</h3>
            <p className="text-xs text-muted/80 leading-relaxed">
              Our AI engine analyzes your psychological states (FOMO, Revenge trading, Calm) to spot patterns that cost you money. Free users exhibit high emotional risk. Unlock your full diagnostics to prevent emotional trading.
            </p>
            <Link
              to="/billing"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black transition-all"
              style={{ background: 'rgb(var(--color-gold))', boxShadow: '0 0 24px rgb(var(--glow-accent) / 0.35)' }}
            >
              <Zap size={14} />
              Unlock Behavioral Dashboard
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Database mapping ──────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Trade {
  return {
    id: String(row.id),
    symbol: String(row.symbol),
    entry: Number(row.entry),
    exit: Number(row.exit),
    pnl: Number(row.pnl),
    date: String(row.date),
    tag: row.tag as PsychTag,
    notes: row.notes != null ? String(row.notes) : undefined,
    stopLoss: row.stop_loss != null ? Number(row.stop_loss) : undefined,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function JournalView() {
  const { tier, user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tradesLoading, setTradesLoading] = useState(true);
  const [modalState, setModalState] = useState<'none' | 'new-trade' | 'upgrade'>('none');

  useEffect(() => {
    if (!user) { setTrades([]); setTradesLoading(false); return; }
    setTradesLoading(true);
    supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setTrades((data as Record<string, unknown>[]).map(mapRow));
        setTradesLoading(false);
      });
  }, [user]);

  async function handleDeleteTrade(id: string) {
    if (!user) return;
    // Double-layer protection: match both the trade id and the owning user_id
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) setTrades(prev => prev.filter(t => t.id !== id));
  }

  function handleNewTrade() {
    if (tier === 'free' && trades.length >= FREE_TRADE_LIMIT) {
      setModalState('upgrade');
    } else {
      setModalState('new-trade');
    }
  }

  async function handleSaveTrade(data: Omit<Trade, 'id'>) {
    if (!user) return;
    const { data: rows, error } = await supabase
      .from('trades')
      .insert({
        user_id: user.id,
        symbol: data.symbol,
        entry: data.entry,
        exit: data.exit,
        pnl: data.pnl,
        date: data.date,
        tag: data.tag,
        notes: data.notes ?? null,
        stop_loss: data.stopLoss ?? null,
      })
      .select()
      .single();
    if (!error && rows) setTrades(prev => [mapRow(rows as Record<string, unknown>), ...prev]);
    setModalState('none');
  }

  if (tradesLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-3 text-muted text-sm">
        <span className="w-2 h-2 rounded-full bg-live animate-pulse shrink-0" />
        Loading trades from cloud…
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {modalState === 'new-trade' && (
        <NewTradeModal onClose={() => setModalState('none')} onSave={handleSaveTrade} />
      )}
      {modalState === 'upgrade' && (
        <UpgradeModal onClose={() => setModalState('none')} />
      )}

      <div className="max-w-7xl mx-auto flex flex-col gap-8 py-6 px-4">

        <div>
          <h1 className="text-2xl font-bold text-gradient-gold">Trade Journal</h1>
          <p className="text-muted text-sm mt-1">Log trades, identify patterns, and simulate macro scenarios with your AI Coach</p>
        </div>

        <AIBehavioralDashboard trades={trades} tier={tier} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          <div className="xl:col-span-2 flex flex-col gap-6">
            <TradeLogger trades={trades} tier={tier} onNewTrade={handleNewTrade} onDeleteTrade={handleDeleteTrade} />
          </div>
          <div className="xl:col-span-1 flex flex-col gap-6">
            <AICoach trades={trades} userId={user?.id || ''} />
            <ScenarioSimulator trades={trades} />
          </div>
        </div>

        <p className="text-[10px] text-muted/40 text-center mt-8 pb-4 px-4 leading-relaxed">
          <span className="font-semibold text-muted/50">Notice:</span> Past performance is not indicative of future results. Simulated or historical performance results have certain inherent limitations. All trading outcomes shown on this dashboard are for analytical purposes only.
        </p>

      </div>
    </div>
  );
}
