// AI Coach Service — wraps Gemini 1.5 Flash with rule-based fallback

import { supabase } from './supabase';

export interface CoachInsight {
  type: 'risk' | 'edge' | 'rule';
  title: string;
  body: string;
}

export interface CoachAnalysis {
  summary: string;
  insights: CoachInsight[];
}

export interface TradeSummary {
  id: string;
  symbol: string;
  entry: number;
  exit: number;
  pnl: number;
  date: string;
  tag: string;
  notes?: string;
  stopLoss?: number;
}

// ── Rule-based fallback ────────────────────────────────────────────────────────

export function computeCoachInsightsFallback(trades: TradeSummary[]): CoachAnalysis {
  if (trades.length === 0) {
    return { summary: '', insights: [] };
  }

  const insights: CoachInsight[] = [];

  const fomoTrades = trades.filter(t => t.tag === 'FOMO');
  const fomoWins = fomoTrades.filter(t => t.pnl > 0).length;
  if (fomoTrades.length >= 1 && fomoWins / fomoTrades.length < 0.5) {
    insights.push({
      type: 'risk',
      title: 'FOMO Pattern Detected',
      body: `Your win rate on FOMO-tagged trades is ${Math.round((fomoWins / fomoTrades.length) * 100)}%. Consider stepping away after a losing trade before re-entering the market.`,
    });
  }

  const revengeTrades = trades.filter(t => t.tag === 'Revenge');
  const revengeWins = revengeTrades.filter(t => t.pnl > 0).length;
  if (revengeTrades.length >= 1 && revengeWins / revengeTrades.length < 0.5) {
    insights.push({
      type: 'risk',
      title: 'Revenge Trading Risk',
      body: `${revengeTrades.length - revengeWins} of your ${revengeTrades.length} Revenge-tagged trades were losses. Implement a circuit-breaker: stop trading after 2 consecutive losses in a session.`,
    });
  }

  const impulsiveTrades = trades.filter(t => t.tag === 'Impulsive');
  const impulsiveWins = impulsiveTrades.filter(t => t.pnl > 0).length;
  if (impulsiveTrades.length >= 2 && impulsiveWins / impulsiveTrades.length < 0.4) {
    insights.push({
      type: 'risk',
      title: 'Impulsive Entries Hurting P&L',
      body: `Only ${Math.round((impulsiveWins / impulsiveTrades.length) * 100)}% of impulsive trades are profitable. Add a 5-minute wait rule before entering any unplanned trade.`,
    });
  }

  const disciplinedTrades = trades.filter(t => t.tag === 'Disciplined' || t.tag === 'Calm');
  const disciplinedWins = disciplinedTrades.filter(t => t.pnl > 0).length;
  if (disciplinedTrades.length >= 1 && disciplinedWins / disciplinedTrades.length > 0.6) {
    insights.push({
      type: 'edge',
      title: 'Peak State Identified',
      body: `Trades tagged Calm or Disciplined show a ${Math.round((disciplinedWins / disciplinedTrades.length) * 100)}% win rate. Your edge is strongest when you wait for high-conviction setups.`,
    });
  }

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);
  if (wins.length > 0 && losses.length > 0) {
    const avgWin = wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
    const avgLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length);
    const rratio = avgWin / avgLoss;
    if (rratio < 1) {
      insights.push({
        type: 'rule',
        title: 'Unfavorable Risk/Reward',
        body: `Your average win ($${avgWin.toFixed(2)}) is smaller than your average loss ($${avgLoss.toFixed(2)}). Aim for at least a 1.5:1 reward-to-risk on every trade.`,
      });
    } else if (rratio >= 2) {
      insights.push({
        type: 'edge',
        title: 'Strong Risk/Reward Ratio',
        body: `Excellent — your average win ($${avgWin.toFixed(2)}) is ${rratio.toFixed(1)}× your average loss. Maintain this by cutting losers early and letting winners run.`,
      });
    }
  }

  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winRate = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : 0;
  const summary = `Analyzed ${trades.length} trade${trades.length > 1 ? 's' : ''}. Win rate: ${winRate}%. Net P&L: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}.`;

  return { summary, insights };
}

// ── Gemini response parser ─────────────────────────────────────────────────────
// The prompt is now built server-side in the Edge Function (gemini-coach/index.ts).
// The client only needs to parse the JSON response.

function parseGeminiResponse(raw: string): CoachAnalysis {
  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned) as {
    summary: string;
    insights: Array<{ type: string; title: string; body: string }>;
  };
  return {
    summary: parsed.summary ?? '',
    insights: (parsed.insights ?? []).map(ins => ({
      type: (['risk', 'edge', 'rule'].includes(ins.type) ? ins.type : 'rule') as CoachInsight['type'],
      title: ins.title ?? '',
      body: ins.body ?? '',
    })),
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export async function generateAICoachAnalysis(
  trades: TradeSummary[],
  userApiKey?: string,
): Promise<{ analysis: CoachAnalysis; usedAI: boolean }> {
  if (trades.length === 0) {
    return { analysis: { summary: '', insights: [] }, usedAI: false };
  }

  // All Gemini calls are routed through the Supabase Edge Function.
  // Fix #20: user-supplied keys travel in the JSON body (HTTPS), never as a
  // URL query parameter that would appear in server access logs or browser history.
  const { data: { session } } = await supabase.auth.getSession();
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (session && supabaseUrl && supabaseAnonKey) {
    try {
      const endpoint = `${supabaseUrl}/functions/v1/gemini-coach`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          trades,
          // User's personal key (if provided) goes in the body, not the URL.
          // The Edge Function uses it in preference to the server's GEMINI_API_KEY.
          ...(userApiKey?.trim() ? { userApiKey: userApiKey.trim() } : {}),
        }),
      });

      if (response.ok) {
        const text = await response.text();
        const analysis = parseGeminiResponse(text);
        return { analysis, usedAI: true };
      }
    } catch (e) {
      console.warn('Edge Function proxy failed, falling back to rule-based analysis:', e);
    }
  }

  // Fallback to rule-based engine when the user has no session or the Edge Function
  // is unavailable (e.g. development without a running Supabase local instance).
  return { analysis: computeCoachInsightsFallback(trades), usedAI: false };
}
