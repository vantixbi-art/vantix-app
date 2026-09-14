import { useCallback, useRef } from 'react';
import { driver } from 'driver.js';

export function useVantixTour() {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const startTour = useCallback(() => {
    driverRef.current?.destroy();

    const d = driver({
      showProgress:  true,
      animate:       true,
      smoothScroll:  true,
      allowClose:    true,
      overlayOpacity: 0.78,
      stagePadding:  8,
      popoverClass:  'vantix-tour-popover',
      progressText:  'Step {{current}} of {{total}}',
      nextBtnText:   'Next →',
      prevBtnText:   '← Back',
      doneBtnText:   '🚀 Enter Terminal',
      steps: [

        // ── Step 1: Sidebar navigation overview ───────────────────────────────
        {
          element: '#tour-sidebar-nav',
          popover: {
            title: 'Your Command Centre',
            description:
              'Every section of Vantix is one click away from this sidebar. The platform is divided into six core areas — Terminal, News, Tools, Journal, Whales, and Alerts — each targeting a different phase of your trading process. Professional traders move fluidly between analysis, execution, and review. This sidebar is how you do that without friction.',
            side: 'right',
            align: 'start',
          },
        },

        // ── Step 2: Terminal link ──────────────────────────────────────────────
        {
          element: '#tour-sidebar-terminal',
          popover: {
            title: 'The Terminal — Your Trading HQ',
            description:
              'The Terminal is your primary workspace. It combines a full-featured TradingView chart, an AI pattern analyst, a dynamic watchlist, and a position sizer into a single, unified view. Everything you need to research a trade, size it correctly, and execute it is on this one screen. Most serious sessions will begin and end here.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 3: Advanced Chart ────────────────────────────────────────────
        {
          element: '#tour-advanced-chart',
          popover: {
            title: 'Advanced Chart — Full Drawing Toolkit',
            description:
              'This is the full TradingView Advanced Chart engine — the same technology used by institutional desks worldwide. The left rail contains every drawing tool you need: trend lines, Fibonacci retracements, horizontal levels, channels, and pitchforks. Use these to map key S/R zones before placing a trade. The symbol bar at the top lets you switch instruments without leaving the terminal. The timeframe selector lets you confirm setups across multiple time horizons — always check the higher timeframe before entering on a lower one.',
            side: 'bottom',
            align: 'start',
          },
        },

        // ── Step 4: Watchlist ─────────────────────────────────────────────────
        {
          element: '#tour-watchlist',
          popover: {
            title: 'Watchlist — Your Universe of Opportunities',
            description:
              'The Watchlist is your filtered universe of stocks and crypto to monitor each session. Click any ticker to instantly load it into the main chart. Add symbols using the search bar at the top — type a symbol and press Enter or click the + button. Remove tickers you no longer track with the × button on each row. Keep your watchlist tight: the traders who outperform are those who know 10 symbols deeply, not those scanning 200 symbols superficially.',
            side: 'left',
            align: 'start',
          },
        },

        // ── Step 5: AI Analyst ────────────────────────────────────────────────
        {
          element: '#tour-ai-analyst',
          popover: {
            title: 'Vantix AI Analyst — Pattern Recognition Engine',
            description:
              'The AI Analyst runs a structural pattern scan on the active symbol every time you switch tickers. It identifies the current pattern (Bull Flag, Ascending Triangle, Cup & Handle, etc.), cross-references it against a database of historical setups on that same instrument, and calculates the percentage of times that pattern resolved in an uptrend. The "Historical Accuracy" metric is key — a 75%+ win rate on a pattern with 4+ historical matches is a genuinely high-probability setup. The projected path sparkline shows the average price trajectory following the pattern. The Entry, Target, and Hard Stop values at the bottom give you a pre-built trade plan to validate against your own analysis.',
            side: 'top',
            align: 'start',
          },
        },

        // ── Step 6: Position Sizer ────────────────────────────────────────────
        {
          element: '#tour-position-sizer',
          popover: {
            title: 'Position Sizer — Risk-First Trade Sizing',
            description:
              'Every professional trader sizes positions based on risk, not conviction. Enter your total account size and the maximum percentage you are willing to lose on this trade (1–2% is the institutional standard). Then enter your planned entry price and your hard stop-loss level. The calculator divides your dollar risk by the distance between entry and stop to give you the exact number of shares to buy. This is not optional — trading without defined risk sizing is how retail accounts blow up. The "Capital at Risk" figure should never feel painful to lose. If it does, reduce your position size.',
            side: 'top',
            align: 'center',
          },
        },

        // ── Step 7: Trade Journal ─────────────────────────────────────────────
        {
          element: '#tour-sidebar-journal',
          popover: {
            title: 'Trade Journal & AI Coach — Your Edge Database',
            description:
              'The Trade Journal is where you build a searchable, analysable record of every trade. Most traders track P&L. Vantix goes further: every entry requires a Psychological Tag (Calm, Disciplined, FOMO, Revenge, Impulsive) and Trade Notes. Over time, the AI Coach correlates these tags with your P&L data to detect behavioural patterns — for example, identifying that your FOMO-tagged trades have a 31% win rate while your Disciplined trades hit 74%. The Coach also surfaces a Circuit Breaker when it detects two consecutive Revenge trades, automatically telling you to stop for the session. Your journal is your most valuable long-term trading asset.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 8: Whale Tracker — sidebar ──────────────────────────────────
        {
          element: '#tour-sidebar-whales',
          popover: {
            title: 'Whale Tracker — Follow Institutional Money',
            description:
              'The Whale Tracker aggregates two data streams that are invisible in standard price charts: Unusual Options Flow and Dark Pool Prints. Institutions move too much capital to hide their activity entirely — it leaks into the options market and dark pool tape before appearing in the stock price. The Whale Tracker surfaces this activity in real time so you can position alongside the smart money, not against it.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 9: Options flow (detail) — use news sidebar as anchor ────────
        {
          element: '#tour-sidebar-whales',
          popover: {
            title: 'Unusual Options Flow — Decoding Institutional Bets',
            description:
              'The Options Flow table filters for trades above $1M in premium — orders too large to be retail speculation. A Sweep order (highlighted in gold) is aggressive and directional: the institution is sweeping multiple exchanges to fill immediately, signalling urgency. A Block order is negotiated privately between two parties. Calls in green are bullish bets; Puts in red are bearish. When you see a $5M+ call sweep on a ticker with upcoming earnings, that is a high-conviction signal worth investigating. Cross-reference the flow with the AI Analyst output on that symbol before trading.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 10: Dark Pool (detail) ────────────────────────────────────────
        {
          element: '#tour-sidebar-whales',
          popover: {
            title: 'Dark Pool Prints — Hidden Block Trades',
            description:
              'Dark Pool Prints are massive share transactions executed off the public exchange to avoid moving the market price. When a fund needs to buy 1.2 million shares of AAPL, they cannot place that order publicly — it would drive the price up against them. Instead they negotiate in a private ATS (Alternative Trading System) and the print appears in the tape 15–60 minutes later. A large Buy-side dark pool print at a key technical support level is one of the strongest confluence signals in the market — it means an institution has chosen that exact price as a meaningful entry level.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 11: Smart Alerts ──────────────────────────────────────────────
        {
          element: '#tour-sidebar-alerts',
          popover: {
            title: 'Smart Alerts — Multi-Condition Logic Engine',
            description:
              'Vantix Alerts go far beyond simple price notifications. The Alert Builder lets you chain multiple technical conditions with AND logic — an alert only fires when every condition is simultaneously true. For example: "BTC: RSI(14) Crosses Above 30 AND Price > VWAP" fires only on a confirmed oversold recovery above intraday value — eliminating 90% of false positives that a single-condition alert would generate. Build your pre-market watchlist of setups the night before, deploy the alerts, and let Vantix notify you the moment the exact setup you planned for appears. This is how systematic traders stay disciplined without watching charts all day.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 12: News & Tools ──────────────────────────────────────────────
        {
          element: '#tour-sidebar-news',
          popover: {
            title: 'Global News Hub & Investor Tools',
            description:
              'The Global News Hub aggregates market-moving headlines from Bloomberg, Reuters, FT, and CoinDesk, with AI-generated Bullish/Bearish/Neutral sentiment tags on every article. The AI Market Summary synthesises the top stories into a single macro briefing so you understand the narrative driving price action before you chart a single setup. The adjacent Investor Tools page gives you the full macro picture — VIX levels, sector rotation, the Fear & Greed Index, upcoming economic events, and market breadth — everything you need to understand whether the tide is coming in or going out before you trade.',
            side: 'right',
            align: 'center',
          },
        },

        // ── Step 13: Final — no element anchor ────────────────────────────────
        {
          popover: {
            title: '🚀 Welcome to Vantix',
            description:
              'You now have a complete map of the platform. The edge is not in any single feature — it is in the system. Use the AI Analyst to identify high-probability setups. Size them with the Position Sizer. Execute with discipline. Log every trade in the Journal. Review your patterns with the AI Coach. Monitor institutional flow in the Whale Tracker. And use Smart Alerts so the market comes to you, not the other way around. The Academy has deep-dives on every concept whenever you need them. Good luck.',
            align: 'center',
          },
        },

      ],
    });

    driverRef.current = d;
    d.drive();
  }, []);

  return { startTour };
}
