import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, GraduationCap, BookOpen, BrainCircuit, TrendingUp, LineChart, ChevronRight, Clock, Tag, Play } from 'lucide-react';
import { useVantixTour } from '../hooks/useVantixTour';

// ── Content model ─────────────────────────────────────────────────────────────

type Block =
  | { type: 'h2';      text: string }
  | { type: 'h3';      text: string }
  | { type: 'p';       text: string }
  | { type: 'list';    items: string[] }
  | { type: 'callout'; variant: 'info' | 'tip' | 'warning'; title: string; body: string }
  | { type: 'metrics'; items: { label: string; value: string; color: string }[] }
  | { type: 'keyterm'; term: string; definition: string };

interface Article {
  id: string;
  title: string;
  category: Category;
  readTime: string;
  tags: string[];
  blocks: Block[];
}

type Category = 'Platform Guide' | 'Market Concepts' | 'Trading Psychology' | 'Technical Indicators';

// ── Articles ──────────────────────────────────────────────────────────────────

const ARTICLES: Article[] = [
  // ── Platform Guide ──────────────────────────────────────────────────────────
  {
    id: 'ai-coach',
    title: 'Using the AI Coach',
    category: 'Platform Guide',
    readTime: '6 min read',
    tags: ['Trade Journal', 'Psychology', 'AI'],
    blocks: [
      { type: 'p', text: 'The Vantix AI Coach is not a trade signal generator. It is a behavioural analytics engine built into your Trade Journal that detects patterns in your decision-making — specifically the psychological context behind each trade — and surfaces actionable insights designed to fix the leaks in your process.' },
      { type: 'h2', text: 'How It Works' },
      { type: 'p', text: 'Every trade you log in the Journal requires a Psychological Tag. This single field is the foundation of the AI Coach\'s analysis. Over time, the coach correlates these tags with your P&L outcomes to identify statistically significant patterns.' },
      { type: 'keyterm', term: 'Psychological Tag', definition: 'A mandatory label on every trade entry that captures your mental state at execution: Calm, Disciplined, FOMO, Revenge, or Impulsive.' },
      { type: 'h3', text: 'The Five Tags Explained' },
      { type: 'list', items: [
        'Calm — Entered the trade without emotional pressure. The setup met all your criteria and you executed according to plan.',
        'Disciplined — You followed your rules strictly, including risk sizing and stop placement, even when the market made you doubt the setup.',
        'FOMO — Fear Of Missing Out. You entered because price was moving fast and you felt left behind, not because the setup was valid.',
        'Revenge — You took this trade specifically to recover losses from a previous trade. Revenge trades are almost always losers.',
        'Impulsive — An unplanned entry made on a momentary impulse, news event, or social media tip with insufficient analysis.',
      ]},
      { type: 'callout', variant: 'warning', title: 'The FOMO Pattern', body: 'Across Vantix beta users, FOMO-tagged trades have a 31% average win rate — compared to 74% for Calm and Disciplined trades. If the AI Coach flags a FOMO pattern, treat it as a hard stop signal.' },
      { type: 'h2', text: 'Reading the Insight Cards' },
      { type: 'p', text: 'The AI Coach panel displays three types of insight cards. Risk cards (red border) flag destructive patterns. Edge cards (green border) identify your strengths and peak performance conditions. Circuit Breaker cards (gold border) are triggered when the coach detects you are likely in a revenge or tilt state based on your recent trade sequence.' },
      { type: 'metrics', items: [
        { label: 'Calm / Disciplined Win Rate', value: '74%', color: 'text-live' },
        { label: 'FOMO / Revenge Win Rate',     value: '31%', color: 'text-alert' },
        { label: 'Impulsive Win Rate',           value: '48%', color: 'text-gold' },
      ]},
      { type: 'h3', text: 'The Circuit Breaker Rule' },
      { type: 'p', text: 'If the AI Coach detects two consecutive losses tagged Revenge or Impulsive, it will surface a Circuit Breaker card. This is your signal to close the platform and step away for at least 30 minutes. The rule is simple: no new trades until the next session. Professionals call this a "stop loss on the day."' },
      { type: 'h2', text: 'How Vantix Uses Your Notes' },
      { type: 'p', text: 'The Trade Notes field is not cosmetic. When Supabase integration is enabled, the AI Coach will perform semantic analysis on your notes to identify recurring language patterns — words like "sure thing," "can\'t miss," or "just one more" that precede losing trades. This is phase 2 of the coach feature.' },
      { type: 'callout', variant: 'tip', title: 'Best Practice', body: 'Write your trade notes before you see the P&L. This forces you to articulate your reasoning while still in the mindset of the trade, producing far more useful data for the coach to analyse.' },
    ],
  },
  {
    id: 'alert-builder',
    title: 'Smart Alert Builder',
    category: 'Platform Guide',
    readTime: '4 min read',
    tags: ['Alerts', 'Conditions', 'Automation'],
    blocks: [
      { type: 'p', text: 'The Smart Alert Builder lets you construct institutional-grade conditional alerts using a logical chain of technical indicators. Unlike simple price alerts, Vantix alerts fire only when all specified conditions are simultaneously true — eliminating noise and ensuring every notification is meaningful.' },
      { type: 'h2', text: 'Building a Condition' },
      { type: 'p', text: 'Each alert is built from one or more condition rows. A condition row has three components: a Metric, an Operator, and a Value. Multiple rows are joined with AND logic — all conditions must be true for the alert to fire.' },
      { type: 'keyterm', term: 'AND Logic', definition: 'Every condition in the chain must evaluate to true simultaneously for the alert to trigger. This dramatically reduces false positives versus single-condition alerts.' },
      { type: 'h3', text: 'Available Metrics' },
      { type: 'list', items: [
        'Price — The current market price of the instrument.',
        'RSI(14) — 14-period Relative Strength Index (0–100 scale).',
        'SMA(50) / SMA(200) — 50 and 200-period Simple Moving Averages.',
        'EMA(20) — 20-period Exponential Moving Average.',
        'MACD — Moving Average Convergence Divergence line.',
        'Volume — Current bar volume.',
        'VWAP — Volume-Weighted Average Price.',
      ]},
      { type: 'callout', variant: 'info', title: 'Example: Oversold Reversal Alert', body: 'Ticker: BTC\nCondition 1: RSI(14) Crosses Above 30\nCondition 2: Price > VWAP\n\nThis fires only when RSI recovers from oversold territory AND price is above VWAP — a much stronger signal than RSI alone.' },
    ],
  },
  {
    id: 'whale-guide',
    title: 'Reading the Whale Tracker',
    category: 'Platform Guide',
    readTime: '5 min read',
    tags: ['Options Flow', 'Dark Pool', 'Institutions'],
    blocks: [
      { type: 'p', text: 'The Whale Tracker aggregates two of the most powerful leading indicators available to retail traders: unusual options flow and dark pool prints. Both reveal what institutional money is doing before it shows up in the public price chart.' },
      { type: 'h2', text: 'Options Flow vs Dark Pool' },
      { type: 'keyterm', term: 'Unusual Options Flow', definition: 'Large-premium options orders — sweeps or blocks — placed significantly above the average daily volume for that contract. These signal that an institution is making a high-conviction directional bet.' },
      { type: 'keyterm', term: 'Dark Pool Print', definition: 'A large block trade of shares executed off the public exchange in a private Alternative Trading System (ATS) to minimise market impact. Prints appear in the tape 15–60 minutes after execution.' },
      { type: 'h3', text: 'Sweep vs Block Orders' },
      { type: 'list', items: [
        'Sweep — An aggressive order that sweeps multiple exchanges simultaneously to fill immediately at any price. Sweeps are urgent and directional.',
        'Block — A large order negotiated privately between two parties, then printed to the tape. Blocks can be hedges or directional bets — context matters.',
      ]},
      { type: 'callout', variant: 'warning', title: 'Do Not Trade Flow Blindly', body: 'Options flow is a signal, not a strategy. A massive put block can be a hedge on an existing long position. Always cross-reference flow with the chart, the macro environment, and the AI Analyst output before acting.' },
    ],
  },

  // ── Market Concepts ─────────────────────────────────────────────────────────
  {
    id: 'vix',
    title: 'What is the VIX?',
    category: 'Market Concepts',
    readTime: '7 min read',
    tags: ['Macro', 'Volatility', 'Risk'],
    blocks: [
      { type: 'p', text: 'The VIX — formally the CBOE Volatility Index — is the financial market\'s real-time gauge of expected volatility in the S&P 500 over the next 30 days. Traders call it the "Fear Index" because it spikes sharply when investors rush to buy protective put options, signalling widespread anxiety about an imminent market decline.' },
      { type: 'keyterm', term: 'VIX', definition: 'A real-time index derived from S&P 500 options prices that measures the market\'s expectation of 30-day forward volatility. Published by the CBOE since 1993. Higher values = more fear.' },
      { type: 'h2', text: 'How to Read VIX Levels' },
      { type: 'p', text: 'The VIX does not move in the same direction as stocks — it is inversely correlated. When the S&P 500 falls sharply, the VIX typically surges. This inverse relationship makes it a valuable hedging and risk-management tool.' },
      { type: 'metrics', items: [
        { label: 'Below 15 — Complacency',  value: 'Low Fear',     color: 'text-live'  },
        { label: '15 – 25 — Normal Range',  value: 'Neutral',      color: 'text-gold'  },
        { label: '25 – 35 — Elevated Fear', value: 'Caution',      color: 'text-alert' },
        { label: 'Above 35 — Panic',        value: 'Extreme Fear', color: 'text-alert' },
      ]},
      { type: 'h3', text: 'The VIX Spike Pattern' },
      { type: 'p', text: 'VIX spikes are characteristically fast and violent — the index can double in 24 hours during a market crisis (as seen in March 2020 when it hit 85.47). Crucially, spikes are also mean-reverting. The VIX very rarely stays elevated for long. Savvy traders use VIX spikes not as a signal to panic, but as a contrarian opportunity to identify capitulation lows.' },
      { type: 'callout', variant: 'tip', title: 'The 20% Rule', body: 'When the VIX rises more than 20% in a single session, historically the S&P 500 has been higher 30 days later approximately 72% of the time. Extreme fear often marks the best buying opportunities.' },
      { type: 'h2', text: 'How Vantix Uses the VIX' },
      { type: 'p', text: 'The VIX appears in three places within Vantix. First, on the Macro Snapshot card in Investor Tools, showing the current level and intraday change. Second, the AI Analyst incorporates the VIX regime into its pattern confidence score — setups in high-VIX environments carry wider expected ranges and lower conviction. Third, the Scenario Simulator uses the "What if VIX spikes above 30?" scenario to model the impact on your portfolio.' },
      { type: 'h3', text: 'VIX and Your Position Sizing' },
      { type: 'p', text: 'A professional risk management rule: divide your normal position size by the VIX divided by 20. If VIX is 40 (2× the baseline of 20), cut your normal position size in half. This mechanically forces you to trade smaller when the market is most dangerous and larger when it is calm — the opposite of what fear and greed naturally drive you to do.' },
      { type: 'callout', variant: 'info', title: 'VIX Position Sizing Formula', body: 'Adjusted Size = Normal Size × (20 ÷ Current VIX)\n\nExample: Normal size 100 shares, VIX = 30\nAdjusted Size = 100 × (20 ÷ 30) = 67 shares' },
    ],
  },
  {
    id: 'options-flow',
    title: 'Understanding Options Flow',
    category: 'Market Concepts',
    readTime: '5 min read',
    tags: ['Options', 'Derivatives', 'Institutions'],
    blocks: [
      { type: 'p', text: 'Options flow analysis is the practice of monitoring large, unusual options transactions to infer the directional bias of institutional traders. Because options give the buyer the right — but not the obligation — to buy or sell a stock at a specific price, a large bet in options represents a high-conviction view about where price will be at expiration.' },
      { type: 'h2', text: 'Why Calls and Puts Matter' },
      { type: 'keyterm', term: 'Call Option', definition: 'Gives the buyer the right to purchase shares at the strike price before expiration. A large call purchase is typically a bullish directional bet.' },
      { type: 'keyterm', term: 'Put Option', definition: 'Gives the buyer the right to sell shares at the strike price before expiration. A large put purchase can be a bearish directional bet or a hedge on existing long positions.' },
      { type: 'h3', text: 'The Premium as a Signal Strength Filter' },
      { type: 'p', text: 'Raw contract count can be misleading. Vantix filters by dollar premium — the total cost of the order — because a $5M options bet carries far more information than 1,000 cheap lottery contracts. Orders above $1M in premium represent genuine institutional conviction and are highlighted in the flow table.' },
      { type: 'callout', variant: 'warning', title: 'Not All Flow Is Directional', body: 'Up to 40% of large options activity is hedging — institutions protecting existing equity positions, not making new directional bets. A large put block against a stock where the institution is already long is not a bearish signal. Context is critical.' },
    ],
  },
  {
    id: 'dark-pool',
    title: 'Dark Pools Explained',
    category: 'Market Concepts',
    readTime: '4 min read',
    tags: ['Dark Pool', 'Institutions', 'Volume'],
    blocks: [
      { type: 'p', text: 'Dark pools are private exchanges — also called Alternative Trading Systems (ATS) — where institutional investors buy and sell large blocks of shares away from the public market. They exist to allow large trades to be executed without moving the market price against the buyer or seller.' },
      { type: 'h2', text: 'Why Institutions Use Dark Pools' },
      { type: 'p', text: 'Imagine you need to buy 2 million shares of AAPL. If you place that order on the public exchange, the market immediately knows about it — other traders will front-run the order, pushing the price up before you can fill it. A dark pool allows you to execute the entire order at a negotiated price without alerting the market.' },
      { type: 'keyterm', term: 'Price Impact', definition: 'The adverse movement in price that occurs when a large order is placed publicly. Dark pools eliminate price impact by keeping the order off the public order book until after execution.' },
      { type: 'callout', variant: 'info', title: 'How Much Volume Trades Dark?', body: 'Approximately 35–40% of all US equity volume trades off-exchange in dark pools. This means a significant portion of institutional conviction is invisible to standard price charts — which is why Vantix surfaces it separately.' },
    ],
  },

  // ── Trading Psychology ──────────────────────────────────────────────────────
  {
    id: 'fomo',
    title: 'Avoiding the FOMO Trap',
    category: 'Trading Psychology',
    readTime: '5 min read',
    tags: ['FOMO', 'Psychology', 'Discipline'],
    blocks: [
      { type: 'p', text: 'Fear Of Missing Out — FOMO — is the single most destructive force in a retail trader\'s psychology. It is the impulse to enter a trade not because the setup is valid, but because price is moving and you are not in it. FOMO is the market\'s most effective mechanism for transferring money from retail to institutional accounts.' },
      { type: 'h2', text: 'How FOMO Manifests' },
      { type: 'list', items: [
        'You see a stock has already moved 5% and feel an urgent need to buy it "before it goes higher."',
        'You read a tweet or news headline and enter a position without consulting your trading plan.',
        'You increase your position size because you feel you need to "make up" for missing the initial move.',
        'You abandon your entry criteria because "this one is different."',
      ]},
      { type: 'callout', variant: 'warning', title: 'The FOMO Entry Math', body: 'A stock that has moved 8% in one day and then gives back 5% from the high has moved from $100 → $108 → $102.60. The FOMO buyer at $108 is now down -5% while the disciplined buyer at $100 is still up 2.6%. Chasing always skews the risk/reward against you.' },
      { type: 'h2', text: 'The Vantix Antidote' },
      { type: 'p', text: 'The AI Coach tracks your FOMO-tagged trades and presents the aggregate data back to you. When you see in black and white that your FOMO trades lose money 69% of the time, the emotional impulse begins to lose its power. Data is the cure for emotion.' },
      { type: 'keyterm', term: 'The Next Bus Rule', definition: 'Buses run on a schedule. If you miss one, another will come. Every market setup that you miss will repeat in some form. Your job is to be ready for the next one, not to chase the one that just left.' },
    ],
  },
  {
    id: 'revenge-trading',
    title: 'The Revenge Trade Trap',
    category: 'Trading Psychology',
    readTime: '4 min read',
    tags: ['Revenge Trading', 'Psychology', 'Risk'],
    blocks: [
      { type: 'p', text: 'Revenge trading is the act of immediately re-entering the market after a loss with the primary goal of recovering the money just lost, rather than because a valid new setup has appeared. It is one of the fastest ways to turn a small loss into an account-destroying drawdown.' },
      { type: 'keyterm', term: 'Tilt', definition: 'A term from poker describing a state of emotional disruption that causes a player to make suboptimal decisions. In trading, tilt occurs after a painful loss and leads to oversizing, overtrading, and abandoning risk rules.' },
      { type: 'h2', text: 'The Psychology Behind It' },
      { type: 'p', text: 'After a loss, the brain activates the same pain circuits triggered by physical harm. The urgent desire to "get it back" is a primal threat response, not a rational decision. The market does not owe you your money back, and it has no memory of what you lost.' },
      { type: 'callout', variant: 'warning', title: 'The Compounding Loss Trap', body: 'Trader loses $500 on trade 1. Takes a revenge trade, sizes up to "make it back faster," loses $800 on trade 2. Total loss: $1,300. The revenge trade turned a manageable loss into a session-destroying event.' },
      { type: 'h3', text: 'Vantix Circuit Breaker' },
      { type: 'p', text: 'The AI Coach automatically detects two consecutive Revenge-tagged trades and surfaces a Circuit Breaker alert. When you see this card, the protocol is non-negotiable: close the terminal, log the emotional state in your notes, and do not return until the next trading session.' },
      { type: 'callout', variant: 'tip', title: 'The Professional Standard', body: 'Every professional trading firm has a daily loss limit — a maximum dollar amount a trader can lose in a single day before they are pulled from the desk. Build your own. When you hit it, you are done for the day. No exceptions, no negotiations.' },
    ],
  },

  // ── Technical Indicators ────────────────────────────────────────────────────
  {
    id: 'ind-price-volume',
    title: 'Price & Volume',
    category: 'Technical Indicators',
    readTime: '4 min read',
    tags: ['Price', 'Volume', 'Basics', 'Alert Builder'],
    blocks: [
      { type: 'p', text: 'Price and Volume are the two most primitive inputs in all of technical analysis. Every other indicator in Vantix is ultimately derived from these two values. Understanding how to use raw Price and Volume in alert conditions — without layering in derivatives — gives you the purest, most direct read of what the market is actually doing.' },
      { type: 'h2', text: 'Price' },
      { type: 'keyterm', term: 'Price', definition: 'The last traded closing price of an instrument. In Vantix alert conditions, "Price" evaluates the closing price of the most recent daily bar fetched from Yahoo Finance — the most current market consensus of value available.' },
      { type: 'p', text: 'Price-based alerts are the most direct but also the noisiest — they trigger on minor fluctuations unless anchored to technically significant levels. The highest-probability Price alerts reference key structural zones: "Price Crosses Above Resistance Level" outperforms "Price > $500" in signal quality every time.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: AAPL\nCondition 1: Price Crosses Above Resistance Level\nCondition 2: RSI(14) > 50\n\nFires when AAPL breaks above its 20-day high with positive momentum — a dual-confirmed breakout rather than a static price threshold.' },
      { type: 'h2', text: 'Volume' },
      { type: 'keyterm', term: 'Volume', definition: 'The total number of shares, contracts, or units traded during a period. In Vantix, Volume is the daily bar volume from Yahoo Finance. It is the single most important confirmation tool in technical analysis — price moves gain conviction on high volume and lose reliability on thin volume.' },
      { type: 'p', text: 'The principle "volume precedes price" is one of the oldest and most reliable in market analysis. Institutional accumulation frequently appears in the volume data before it manifests as a price breakout. A stock making new highs on declining volume is a divergence warning — the move is losing institutional participation.' },
      { type: 'metrics', items: [
        { label: '1× Average Volume',   value: 'Normal',    color: 'text-muted'  },
        { label: '1.5× Average Volume', value: 'Elevated',  color: 'text-gold'   },
        { label: '2× Average Volume',   value: 'Confirmed', color: 'text-live'   },
        { label: '3×+ Average Volume',  value: 'Climactic', color: 'text-alert'  },
      ]},
      { type: 'callout', variant: 'info', title: 'Alert Builder Example', body: 'Ticker: SPY\nCondition 1: Price Crosses Above Resistance Level\nCondition 2: Volume > 80000000\n\nFires when SPY breaks its 20-day high on above-average volume — confirming institutional participation rather than algorithmic noise.' },
    ],
  },
  {
    id: 'ind-rsi-stoch',
    title: 'RSI & Stochastic RSI',
    category: 'Technical Indicators',
    readTime: '6 min read',
    tags: ['RSI', 'Stochastic RSI', 'Momentum', 'Oscillator'],
    blocks: [
      { type: 'p', text: 'RSI and Stochastic RSI are both momentum oscillators that answer the same question from different angles: is price moving too far, too fast? RSI measures the speed of recent price changes directly. Stochastic RSI applies a second layer of normalisation to RSI itself, producing a faster and more sensitive signal ideal for volatile instruments.' },
      { type: 'h2', text: 'RSI — Relative Strength Index' },
      { type: 'keyterm', term: 'RSI(14)', definition: 'RSI = 100 − [100 ÷ (1 + RS)], where RS = Average Gain ÷ Average Loss over the most recent 14 closing prices. Developed by J. Welles Wilder in 1978. Oscillates 0–100. Above 70 = overbought; below 30 = oversold.' },
      { type: 'p', text: 'Vantix computes RSI(14) on daily closing prices from the past year of Yahoo Finance data, using a simple average of the 14 most recent gains and losses — Wilder\'s original method. This produces an RSI value fully comparable to TradingView and all professional charting platforms.' },
      { type: 'metrics', items: [
        { label: 'Oversold',    value: '< 30',    color: 'text-live'  },
        { label: 'Neutral',     value: '30–70',   color: 'text-gold'  },
        { label: 'Overbought',  value: '> 70',    color: 'text-alert' },
        { label: 'Period',      value: '14',      color: 'text-muted' },
      ]},
      { type: 'callout', variant: 'info', title: 'RSI Divergence — The Advanced Signal', body: 'Bullish divergence: Price makes a lower low, RSI makes a higher low. Momentum is decelerating even as price falls — a powerful early reversal signal.\n\nBearish divergence: Price makes a higher high, RSI makes a lower high. Momentum is fading at new highs — often precedes corrections of 5–15%.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: BTC\nCondition 1: RSI(14) Crosses Above 30\nCondition 2: Price > VWAP\n\nFires when RSI recovers from oversold AND price is above the institutional VWAP benchmark — a dual-confirmation oversold reversal signal.' },
      { type: 'h2', text: 'Stochastic RSI' },
      { type: 'keyterm', term: 'Stochastic RSI', definition: 'StochRSI = (RSI − Min RSI over N periods) ÷ (Max RSI over N periods − Min RSI over N periods) × 100. Developed by Tushar Chande and Stanley Kroll (1994). Vantix uses a 14-period RSI and 14-period Stochastic window, returning 0–100.' },
      { type: 'p', text: 'Because StochRSI is the RSI of the RSI, it is far more sensitive than standard RSI — reacting more quickly to price changes. This makes it effective for alert conditions on crypto and high-volatility equities where standard RSI can lag significantly.' },
      { type: 'metrics', items: [
        { label: 'Oversold',   value: '< 20',  color: 'text-live'  },
        { label: 'Neutral',    value: '20–80', color: 'text-gold'  },
        { label: 'Overbought', value: '> 80',  color: 'text-alert' },
        { label: 'Period',     value: '14',    color: 'text-muted' },
      ]},
      { type: 'callout', variant: 'warning', title: 'False Signals in Strong Trends', body: 'StochRSI can remain above 80 for extended periods during strong uptrends. Never use it as a standalone sell signal — combine with a trend filter such as Price > SMA(200) to avoid fighting the trend with an oscillator that is simply reflecting persistent strength.' },
    ],
  },
  {
    id: 'ind-moving-averages',
    title: 'Moving Averages: SMA & EMA',
    category: 'Technical Indicators',
    readTime: '5 min read',
    tags: ['SMA', 'EMA', 'Trend', 'Moving Average', 'Golden Cross'],
    blocks: [
      { type: 'p', text: 'Moving averages smooth price noise and reveal the underlying direction of trend. Vantix provides three in the Alert Builder — SMA(50), SMA(200), and EMA(20) — covering short-term momentum, institutional structure, and the two most watched price levels in all of professional equity analysis.' },
      { type: 'h2', text: 'SMA — Simple Moving Average' },
      { type: 'keyterm', term: 'SMA(N)', definition: 'The arithmetic mean of the closing price over the most recent N periods. SMA(50) = sum of last 50 closes ÷ 50. SMA(200) = sum of last 200 closes ÷ 200. All data points are weighted equally — making SMA slower to react but more resistant to short-term noise than EMA.' },
      { type: 'p', text: 'The SMA(50) and SMA(200) are the two most watched levels in all of institutional trading. Trillions of dollars in algorithmic orders are programmed to respond to price interaction with these lines. SMA(50) defines intermediate trend; SMA(200) defines the long-term bull or bear structural status of an instrument.' },
      { type: 'keyterm', term: 'Golden Cross / Death Cross', definition: 'Golden Cross: SMA(50) crosses above SMA(200) — a major long-term bullish structural signal. Death Cross: SMA(50) crosses below SMA(200) — the equivalent bearish signal. These lag significantly but have historically identified sustained multi-month trend changes with high accuracy.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example — Golden Cross', body: 'Ticker: SPY\nCondition: SMA(50) Crosses Above SMA(200)\n\nDeploy on any major index or large-cap stock to receive the single most significant bullish structural confirmation in all of technical analysis.' },
      { type: 'h2', text: 'EMA — Exponential Moving Average' },
      { type: 'keyterm', term: 'EMA(N)', definition: 'EMA applies exponentially decreasing weight to older prices: EMA = (Close × k) + (Previous EMA × (1 − k)), where k = 2 ÷ (N + 1). For EMA(20): k ≈ 0.095 — recent prices receive nearly 10× more weight than the oldest, making EMA significantly more responsive than SMA.' },
      { type: 'p', text: 'The EMA(20) is the active trader\'s short-term trend filter. In a healthy uptrend, price repeatedly dips to the EMA(20) and bounces. Two consecutive daily closes below the EMA(20) signal that short-term momentum has shifted. Vantix computes EMA(20) on a full year of daily closes, ensuring the value is fully converged and not distorted by initialisation lag.' },
      { type: 'metrics', items: [
        { label: 'EMA(20)',  value: 'Short-term',  color: 'text-live'  },
        { label: 'SMA(50)', value: 'Intermediate', color: 'text-gold'  },
        { label: 'SMA(200)', value: 'Long-term',   color: 'text-alert' },
      ]},
      { type: 'callout', variant: 'warning', title: 'EMA in Choppy Markets', body: 'EMA reacts faster to price changes, generating more false signals in sideways, low-volatility environments. In choppy conditions, rely on SMA(50) — its slower response filters the noise that would whipsaw a shorter EMA.' },
    ],
  },
  {
    id: 'ind-macd',
    title: 'MACD',
    category: 'Technical Indicators',
    readTime: '5 min read',
    tags: ['MACD', 'Momentum', 'EMA', 'Crossover', 'Divergence'],
    blocks: [
      { type: 'p', text: 'MACD — Moving Average Convergence Divergence — is the most widely used trend-following momentum indicator in professional trading. It reveals the relationship between two exponential moving averages and translates changes in momentum into a single, actionable numerical value. Developed by Gerald Appel in the 1970s, it remains standard equipment on every professional trading desk worldwide.' },
      { type: 'h2', text: 'How Vantix Calculates MACD' },
      { type: 'keyterm', term: 'MACD Line', definition: 'MACD = EMA(12) − EMA(26), computed on daily closing prices. A positive MACD means short-term momentum is running ahead of the long-term trend — bullish. A negative MACD means short-term momentum is lagging the long-term average — bearish. The zero line is the structural pivot.' },
      { type: 'p', text: 'Vantix computes both EMA(12) and EMA(26) on the full year of daily closing prices, producing a fully-converged MACD line that matches standard charting platforms. The value used in alert conditions is the raw MACD line (EMA(12) minus EMA(26)) — not the Signal line, which would require a further EMA(9) computation pass.' },
      { type: 'metrics', items: [
        { label: 'Fast EMA',     value: 'EMA(12)',       color: 'text-live'  },
        { label: 'Slow EMA',     value: 'EMA(26)',       color: 'text-alert' },
        { label: 'MACD Line',    value: 'EMA12 − EMA26', color: 'text-gold'  },
        { label: 'Bullish Zone', value: 'MACD > 0',     color: 'text-live'  },
      ]},
      { type: 'h2', text: 'Trading the Zero Line' },
      { type: 'p', text: 'The most powerful MACD signal in the Alert Builder is "MACD Crosses Above 0": when the MACD line crosses from negative to positive, both the short and long-term EMAs confirm upward momentum — a high-conviction structural shift. The equivalent "MACD Crosses Below 0" is the bearish counterpart.' },
      { type: 'callout', variant: 'info', title: 'MACD Divergence', body: 'Bullish divergence: Price makes a new low but MACD makes a higher low — selling pressure is fading beneath the surface. Often leads the price reversal by several sessions.\n\nBearish divergence: Price makes a new high but MACD makes a lower high — buying momentum is exhausting at the highs. A powerful early warning for corrections.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: NVDA\nCondition 1: MACD Crosses Above 0\nCondition 2: Price > SMA(200)\n\nFires when short-term momentum overtakes the long-term average AND the instrument is in a structural uptrend — a dual-confirmed momentum breakout.' },
    ],
  },
  {
    id: 'ind-vwap',
    title: 'VWAP',
    category: 'Technical Indicators',
    readTime: '4 min read',
    tags: ['VWAP', 'Volume', 'Institutional', 'Mean Reversion'],
    blocks: [
      { type: 'p', text: 'VWAP — Volume-Weighted Average Price — is the most important institutional benchmark in trading. It represents the true average price at which all volume in the measurement period has been transacted, weighting each price by the volume traded there. When you trade above VWAP, you trade above the institutional average cost; below it, below the institutional average.' },
      { type: 'h2', text: 'How Vantix Calculates VWAP' },
      { type: 'keyterm', term: 'VWAP', definition: 'VWAP = Σ (Typical Price × Volume) ÷ Σ Volume, where Typical Price = (High + Low + Close) ÷ 3. Vantix computes this across the full year of daily bars from Yahoo Finance — a multi-session VWAP acting as a long-term institutional cost basis benchmark.' },
      { type: 'p', text: 'Traditional VWAP resets at the start of each session. Vantix computes VWAP on a rolling daily bar dataset — making it a medium-to-long-term volume-weighted average that reveals the institutional average entry price over the full measurement period. It acts as a mean-reversion anchor and a structural support/resistance pivot.' },
      { type: 'callout', variant: 'info', title: 'Why Institutions Are Benchmarked to VWAP', body: 'Institutional order desks measure execution quality against VWAP. An algorithm that consistently buys below VWAP "beats the benchmark." This creates a self-fulfilling dynamic: institutions buy heavily when price is below VWAP, creating natural support at the VWAP level with remarkable consistency.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: SPY\nCondition 1: Price Crosses Above VWAP\nCondition 2: RSI(14) > 50\n\nFires when price reclaims the institutional cost basis AND momentum is positive — one of the highest-probability mean-reversion long setups in the Alert Builder.' },
      { type: 'callout', variant: 'warning', title: 'VWAP Context Matters', body: 'In a prolonged downtrend, price can trade below VWAP for weeks. A "Price Crosses Above VWAP" alert in a downtrend may signal a short-lived bounce, not a structural reversal. Always confirm with a trend filter: Price > SMA(200) or SMA(50) > SMA(200).' },
    ],
  },
  {
    id: 'ind-bollinger',
    title: 'Bollinger Bands',
    category: 'Technical Indicators',
    readTime: '5 min read',
    tags: ['Bollinger Bands', 'Volatility', 'Standard Deviation', 'Mean Reversion'],
    blocks: [
      { type: 'p', text: 'Bollinger Bands place dynamic volatility envelopes around price — expanding when markets are active and contracting when they are quiet. Developed by John Bollinger in the 1980s, they function simultaneously as a trend tool, a volatility measure, and a mean-reversion signal generator.' },
      { type: 'h2', text: 'How Vantix Calculates Bollinger Bands' },
      { type: 'keyterm', term: 'Bollinger Bands (Upper)', definition: 'Upper Band = SMA(20) + (2 × σ), where σ is the population standard deviation of the most recent 20 daily closing prices. Approximately 95% of all price action should fall within the bands — making Upper Band touches statistically significant events.' },
      { type: 'keyterm', term: 'Bollinger Bands (Lower)', definition: 'Lower Band = SMA(20) − (2 × σ), where σ is the population standard deviation of the most recent 20 daily closes. When price touches the Lower Band, it has moved more than 2 standard deviations below its 20-day average — a statistically rare condition.' },
      { type: 'metrics', items: [
        { label: 'Middle Band',        value: 'SMA(20)',    color: 'text-gold'  },
        { label: 'Band Width',         value: '±2 StdDev', color: 'text-muted' },
        { label: 'Price Inside Bands', value: '~95%',      color: 'text-live'  },
        { label: 'StdDev Period',      value: '20 closes', color: 'text-muted' },
      ]},
      { type: 'h2', text: 'Mean Reversion vs Trend Following' },
      { type: 'p', text: 'The correct interpretation of a band touch depends on the market regime. In a ranging market, Upper Band touches are sell signals and Lower Band touches are buy signals. In a trending market, price "rides the band" — repeated Upper Band touches are a sign of strength, not a reversal signal. Identifying the regime before setting the alert is the critical prerequisite.' },
      { type: 'callout', variant: 'info', title: 'The Bollinger Band Squeeze', body: 'When the bands narrow to their tightest width in months, the market is coiling for a large directional move. The squeeze does not reveal direction — wait for the first large expansion candle post-squeeze. The direction of that candle determines whether to deploy a long or short follow-through alert.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: TSLA\nCondition: Price Crosses Below Bollinger Bands (Lower)\n\nFires when TSLA closes more than 2 standard deviations below its 20-day average — a statistically rare oversold event best used for mean-reversion long entries in broad-market uptrends.' },
    ],
  },
  {
    id: 'ind-atr',
    title: 'ATR — Average True Range',
    category: 'Technical Indicators',
    readTime: '4 min read',
    tags: ['ATR', 'Volatility', 'Risk Management', 'Position Sizing'],
    blocks: [
      { type: 'p', text: 'ATR — Average True Range — is the definitive volatility indicator. It does not predict direction, trend, or momentum. It answers a single question with precision: how much is this instrument actually moving? The answer determines stop-loss distance, position size, and whether the current environment favours breakout or mean-reversion strategies.' },
      { type: 'h2', text: 'How Vantix Calculates ATR' },
      { type: 'keyterm', term: 'True Range', definition: 'True Range = max of: (1) High − Low, (2) |High − Previous Close|, (3) |Low − Previous Close|. Captures the full price range including overnight gaps — which the simple High−Low misses entirely. ATR(14) = average of the 14 most recent True Range values.' },
      { type: 'p', text: 'Vantix computes ATR(14) using the High, Low, and Close arrays from Yahoo Finance daily data. The result is the average daily price range in dollar terms over the past 14 sessions — a direct measure of current volatility. Rising ATR signals expanding volatility; falling ATR signals the market is compressing toward a potential breakout.' },
      { type: 'metrics', items: [
        { label: 'Period',      value: '14 bars',    color: 'text-muted' },
        { label: 'Falling ATR', value: 'Compressed', color: 'text-live'  },
        { label: 'Rising ATR',  value: 'Expanding',  color: 'text-gold'  },
        { label: 'ATR Spike',   value: 'Climactic',  color: 'text-alert' },
      ]},
      { type: 'callout', variant: 'info', title: 'ATR-Based Stop Loss Formula', body: 'Stop Distance = ATR × Multiplier (typically 1.5× to 2.5×)\n\nExample: ATR = $3.50, 2× multiplier → Stop = $7.00 below entry\n\nThis places the stop outside normal daily noise, reducing premature stop-outs while keeping dollar risk quantified and consistent across instruments with different volatility profiles.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example', body: 'Ticker: AMD\nCondition: ATR > 5\n\nFires when AMD\'s 14-day average daily range exceeds $5 — signalling that volatility has entered a new expanded regime. Use this to confirm a breakout has enough energy to sustain a multi-day directional move.' },
    ],
  },
  {
    id: 'ind-support-resistance',
    title: 'Support & Resistance Levels',
    category: 'Technical Indicators',
    readTime: '5 min read',
    tags: ['Support', 'Resistance', 'Price Levels', 'Breakout', 'Role Reversal'],
    blocks: [
      { type: 'p', text: 'Support and Resistance Levels are the most structurally important price zones in technical analysis — the market\'s memory of where supply and demand have previously reached equilibrium. These zones attract institutional liquidity and trigger algorithmic orders every time price approaches them again.' },
      { type: 'h2', text: 'How Vantix Calculates These Levels' },
      { type: 'keyterm', term: 'Support Level', definition: 'Vantix Support Level = the lowest closing price over the most recent 20 daily bars — the floor the market has defended in the recent period, where buyers have absorbed all selling pressure. Calculated dynamically and updated with each new daily bar.' },
      { type: 'keyterm', term: 'Resistance Level', definition: 'Vantix Resistance Level = the highest closing price over the most recent 20 daily bars — the ceiling the market has failed to break above, where sellers have consistently overwhelmed buyers. A clean break above this level is a confirmed breakout signal.' },
      { type: 'metrics', items: [
        { label: 'Support Lookback',    value: '20 closes', color: 'text-live'  },
        { label: 'Resistance Lookback', value: '20 closes', color: 'text-alert' },
        { label: 'Window Type',         value: 'Rolling',   color: 'text-gold'  },
      ]},
      { type: 'h2', text: 'Role Reversal' },
      { type: 'keyterm', term: 'Role Reversal', definition: 'A broken support level becomes new resistance; a broken resistance level becomes new support. One of the most reliably observed phenomena in technical analysis — occurring because traders who bought at the old support and held through the break will sell to break even when price returns to that level.' },
      { type: 'p', text: 'When price breaks below the Support Level and then returns to it, role reversal predicts that former support will now act as resistance. The equivalent applies to Resistance Level breakouts: former resistance becomes support on the first pullback, offering a high-probability long entry.' },
      { type: 'callout', variant: 'tip', title: 'Alert Builder Example — Breakout', body: 'Ticker: META\nCondition 1: Price Crosses Above Resistance Level\nCondition 2: Volume > 30000000\n\nFires when META breaks its 20-day high on above-average volume — the classic confirmed breakout signal. Volume is non-negotiable: a breakout on thin volume is a false start.' },
      { type: 'callout', variant: 'info', title: 'Alert Builder Example — Breakdown', body: 'Ticker: AAPL\nCondition 1: Price Crosses Below Support Level\nCondition 2: RSI(14) < 35\n\nFires when AAPL breaks its 20-day low with RSI already oversold — a breakdown confirmation signal. Use to exit or hedge when both price structure and momentum confirm the move.' },
    ],
  },
  // ── Investor Tools Guide ────────────────────────────────────────────────────
  {
    id: 'investor-tools-guide',
    title: 'Mastering Investor Tools & Macro Data',
    category: 'Platform Guide',
    readTime: '10 min read',
    tags: ['Investor Tools', 'Macro', 'Sector Rotation', 'Correlation'],
    blocks: [
      { type: 'p', text: 'The Investor Tools section is one of the most powerful and least understood features of the Vantix platform. While most retail traders focus exclusively on individual stock charts, professional portfolio managers make their highest-conviction decisions only after first reading the macro environment — the forces that determine whether the market\'s tide is coming in or going out. This guide explains each component of the Investor Tools suite in complete professional detail.' },

      { type: 'h2', text: 'Macro Snapshot' },
      { type: 'p', text: 'The Macro Snapshot provides a real-time dashboard of the three indicators that professional traders watch above all others: the DXY (US Dollar Index), the 10-Year Treasury Yield, and the VIX. These three data points form the global risk framework within which every individual trade decision should be evaluated. Reading all three in context — not in isolation — gives you an accurate picture of whether the market is in risk-on or risk-off mode.' },

      { type: 'h3', text: 'DXY — US Dollar Index' },
      { type: 'keyterm', term: 'DXY (US Dollar Index)', definition: 'A geometrically weighted index measuring the value of the US Dollar against a basket of six major currencies: EUR (57.6%), JPY (13.6%), GBP (11.9%), CAD (9.1%), SEK (4.2%), CHF (3.6%). Trades as a futures contract on the ICE Futures US exchange and is the global benchmark for dollar strength.' },
      { type: 'p', text: 'The DXY has an inverse relationship with risk assets in most market environments. When the dollar strengthens (DXY rises), capital tends to flow out of commodities, emerging markets, and growth equities — back into dollar-denominated safe assets. Multinational companies in the S&P 500 that earn significant revenue overseas are particularly sensitive to DXY strength, which erodes the dollar value of their foreign earnings when repatriated.' },
      { type: 'p', text: 'The DXY is also the primary structural driver of commodity prices. Oil, gold, and all dollar-denominated commodities share an inverse correlation with the DXY — when the dollar weakens, commodities become cheaper for foreign buyers, increasing demand and driving prices higher. Bitcoin has shown persistent inverse correlation to the DXY in recent years, making DXY direction essential reading for crypto traders.' },
      { type: 'callout', variant: 'tip', title: 'The Dollar Smile Theory', body: 'The dollar tends to strengthen in two distinct scenarios: (1) when the US economy is significantly outperforming the rest of the world — risk-on dollar strength; and (2) during global risk-off events when capital flees to the safety of US assets — fear-driven dollar strength. It weakens when global growth is improving broadly. Reading which scenario applies changes how you interpret DXY strength for equities.' },

      { type: 'h3', text: '10Y Yield — US 10-Year Treasury Yield' },
      { type: 'keyterm', term: '10Y Treasury Yield', definition: 'The annualised return on US government bonds maturing in 10 years. Set by the market through bond supply and demand — not directly by the Federal Reserve. Acts as the global risk-free rate: the baseline discount rate against which every asset on earth is theoretically priced. The most important single number in global finance.' },
      { type: 'p', text: 'Rising yields are generally bearish for equities, particularly high-multiple growth stocks. A higher risk-free rate increases the discount rate used in Discounted Cash Flow (DCF) models, reducing the present value of future earnings. Companies with earnings far in the future — growth stocks with high P/E ratios — are the most sensitive. In contrast, banks and financial companies often benefit from rising yields through improved net interest margins.' },
      { type: 'metrics', items: [
        { label: 'Below 2% — Accommodative', value: 'Risk-On', color: 'text-live' },
        { label: '2% – 4% — Neutral Range', value: 'Watch', color: 'text-gold' },
        { label: '4% – 5% — Restrictive', value: 'Caution', color: 'text-alert' },
        { label: 'Above 5% — Contractionary', value: 'Risk-Off', color: 'text-alert' },
      ]},
      { type: 'callout', variant: 'warning', title: 'The Yield Curve Inversion Signal', body: 'When the 2-Year Treasury yield exceeds the 10-Year yield — an "inverted yield curve" — it has preceded every US recession for 50 years. The lead time is typically 12–24 months post-inversion. It does not predict exact timing, but it does predict direction. Monitor the 2s10s spread in the Macro Snapshot for early structural warning signals in the credit market.' },

      { type: 'h3', text: 'Reading the Macro Trifecta Together' },
      { type: 'p', text: 'The DXY, 10Y yield, and VIX should be read as a system, not individually. In true risk-off environments all three move in a characteristic pattern. Understanding when they confirm or contradict each other reveals the depth and nature of any market stress event.' },
      { type: 'callout', variant: 'info', title: 'The Macro Trifecta Reading', body: 'Risk-On (Bullish): DXY ↓ + Yields moderate + VIX < 15\nRisk-Off (Bearish): DXY ↑ + Yields spike or crash + VIX > 25\nMixed Signal: Any contradiction between the three indicators — this requires elevated scrutiny and reduced position sizing until the signals align.' },

      { type: 'h2', text: 'Sector Rotation' },
      { type: 'p', text: 'Sector rotation is the movement of institutional capital between different economic sectors in response to changes in the macroeconomic cycle. Understanding which phase of the cycle the market is currently pricing determines which sectors should be overweighted and which avoided. The pattern is not random — it is driven by the predictable relationship between corporate earnings and the macroeconomic variables (rates, inflation, GDP) that dominate each phase of the business cycle.' },
      { type: 'keyterm', term: 'Sector Rotation', definition: 'The systematic movement of investment capital from one industry sector to another as institutions anticipate the next phase of the economic cycle. Documented by Sam Stovall of CFRA Research as the "Sector Rotation Model" — mapping each sector\'s expected relative performance to the four phases of the business cycle: recovery, expansion, peak, and contraction.' },
      { type: 'p', text: 'The two most commonly contrasted sectors in Vantix are XLK (Technology) and XLE (Energy). XLK benefits from low interest rates, high-growth environments, and risk-on sentiment — it is the quintessential expansion-phase sector. XLE benefits from rising commodity prices, supply constraints, and a recovering demand cycle — it is a late-cycle, inflation-hedge sector. The XLK/XLE ratio acts as a real-time growth-versus-value and risk-on/risk-off barometer for the entire equity market.' },
      { type: 'list', items: [
        'Early Cycle (Recovery): Financials (XLF), Consumer Discretionary (XLY), Real Estate (XLRE) outperform as credit conditions ease and consumers re-engage.',
        'Mid Cycle (Expansion): Technology (XLK), Industrials (XLI), Materials (XLB) lead as corporate investment accelerates and earnings grow.',
        'Late Cycle (Peak): Energy (XLE), Healthcare (XLV), Consumer Staples (XLP) rotate into favour as inflation rises and growth decelerates.',
        'Recession / Contraction: Utilities (XLU), Consumer Staples (XLP), Healthcare (XLV) act as defensive havens — businesses and households still need electricity, food, and medicine regardless of economic conditions.',
      ]},
      { type: 'callout', variant: 'tip', title: 'Spotting Institutional Capital Flow Early', body: 'Watch for sectors making new 52-week relative highs versus the S&P 500 (high Relative Strength rank) while the overall market is flat or declining. This divergence — a sector outperforming a weak market — reveals where institutional capital is quietly rotating, typically 3–6 weeks before the rotation becomes visible to the broader market.' },

      { type: 'h2', text: 'Correlation Matrix' },
      { type: 'p', text: 'The Correlation Matrix displays the statistical relationship between pairs of assets in your watchlist. The correlation coefficient, ranging from -1.0 to +1.0, measures how closely two assets\' price movements track each other over a defined lookback period. Correlation analysis is one of the most undervalued skills in portfolio construction — it determines whether your apparent diversification is genuine risk reduction or an illusion.' },
      { type: 'keyterm', term: 'Correlation Coefficient (r)', definition: 'A statistical measure of the linear relationship between two return series. r = +1.0 means perfect positive correlation — they move identically. r = −1.0 means perfect negative correlation — they move in exactly opposite directions. r = 0 means no linear relationship. Calculated using Pearson\'s formula on logarithmic returns over the selected lookback period.' },
      { type: 'metrics', items: [
        { label: '+0.80 to +1.0', value: 'Redundant Risk', color: 'text-alert' },
        { label: '+0.40 to +0.80', value: 'Partial Overlap', color: 'text-gold' },
        { label: '−0.40 to +0.40', value: 'True Diversification', color: 'text-live' },
        { label: '−0.80 to −1.0', value: 'Natural Hedge', color: 'text-live' },
      ]},
      { type: 'p', text: 'The practical application of the Correlation Matrix is avoiding the illusion of diversification. A portfolio of AAPL, MSFT, GOOGL, META, and NVDA may feel diversified — five different companies — but with inter-correlations consistently above 0.85, a 10% sector selloff hits all five simultaneously. True portfolio diversification requires mixing assets with correlations below 0.40: for example, equities with short-duration bonds, commodities, or alternative assets.' },
      { type: 'callout', variant: 'warning', title: 'Crisis Correlation Convergence', body: 'Correlations measured in normal market conditions systematically underestimate crisis-period risk. During the March 2020 selloff and the 2022 bear market, correlations across virtually all risk assets converged toward +1.0 — even assets normally uncorrelated moved down together as forced selling dominated. Use the Correlation Matrix as a baseline structural guide, not as a guarantee of future diversification benefit in stress scenarios.' },

      { type: 'h2', text: 'Market Breadth' },
      { type: 'p', text: 'Market breadth indicators measure the participation of individual stocks in a market move — not just the headline index level. A rising S&P 500 where only 10% of constituent stocks are above their 50-day SMA is fundamentally different from a rising S&P 500 where 80% are. The former is fragile and concentrated in a handful of mega-caps; the latter is broad, healthy, and sustainable. Breadth analysis is the difference between a market that is genuinely strong and one being levitated by a few large-cap stocks while the majority deteriorate.' },
      { type: 'keyterm', term: '% Stocks Above SMA', definition: 'The percentage of stocks in a given index currently trading above their 50-day or 200-day simple moving average. Calculated across all index constituents. A high reading (above 70%) indicates broad participation — a healthy internal structure. A low reading (below 30%) indicates narrow, fragile leadership.' },
      { type: 'metrics', items: [
        { label: '% Above 50 SMA > 70%', value: 'Broad Bull', color: 'text-live' },
        { label: '% Above 50 SMA 40–70%', value: 'Transitional', color: 'text-gold' },
        { label: '% Above 50 SMA < 30%', value: 'Extreme Oversold', color: 'text-alert' },
        { label: '% Above 200 SMA < 20%', value: 'Structural Bear', color: 'text-alert' },
      ]},
      { type: 'p', text: 'Breadth divergence is the most powerful signal the Market Breadth panel provides. When the S&P 500 is making new all-time highs but the percentage of stocks above their 200-day SMA is declining month after month, the rally is being driven by a shrinking number of large-cap stocks. This is a classic late-cycle distribution pattern — institutions selling into the index strength while the majority of the market quietly deteriorates.' },
      { type: 'callout', variant: 'tip', title: 'Breadth as a Market Bottom Signal', body: 'When % above 50 SMA drops below 15%, the market is in a historically rare, deeply oversold breadth condition. Every instance since 1950 — including 2009, 2011, 2020, and 2022 — saw the S&P 500 higher 6 months later without exception. Extreme breadth weakness is a contrarian accumulation signal, not a reason to panic. It means the selling has been indiscriminate and the recovery, when it comes, will be broad.' },
    ],
  },

  // ── Sentiment & Calendar Guide ──────────────────────────────────────────────
  {
    id: 'sentiment-calendar-guide',
    title: 'Vantix Sentiment & Economic Events',
    category: 'Market Concepts',
    readTime: '8 min read',
    tags: ['Sentiment', 'Macro Events', 'CPI', 'FOMC', 'Fear & Greed'],
    blocks: [
      { type: 'p', text: 'Two of the most actionable data sources available to traders are the Sentiment Index and the Economic Calendar. The Sentiment Index tells you where collective market psychology currently stands — whether participants are fearful or greedy, and how extreme that condition is. The Economic Calendar tells you exactly when the most market-moving events are scheduled. Combining both gives you a powerful framework for understanding the emotional state of the market and timing entries around the macro catalysts that move it.' },

      { type: 'h2', text: 'The Vantix Sentiment Index — Fear & Greed' },
      { type: 'p', text: 'The Vantix Sentiment Index is modelled on composite sentiment methodology — rather than tracking what the market is doing, it tracks how the market is feeling. Extreme sentiment readings have historically been among the most reliable contrarian signals in all of investing. The index aggregates seven market inputs into a single 0–100 score, where 0 represents maximum fear and 100 represents maximum greed.' },
      { type: 'keyterm', term: 'Fear & Greed Index', definition: 'A composite sentiment indicator calculated from 7 market inputs: (1) Market Momentum — S&P 500 versus its 125-day MA, (2) Stock Price Strength — ratio of 52-week highs to lows, (3) Stock Price Breadth — McClellan Volume Summation Index, (4) Put/Call Ratio, (5) Junk Bond Demand — high-yield vs investment-grade spread, (6) Market Volatility — VIX level vs its 50-day MA, (7) Safe Haven Demand — stocks vs Treasury bonds relative return over 20 days.' },
      { type: 'metrics', items: [
        { label: '0 – 24 — Extreme Fear', value: 'Buy Zone', color: 'text-live' },
        { label: '25 – 44 — Fear', value: 'Accumulate', color: 'text-gold' },
        { label: '45 – 55 — Neutral', value: 'Neutral', color: 'text-muted' },
        { label: '56 – 74 — Greed', value: 'Reduce Risk', color: 'text-gold' },
        { label: '75 – 100 — Extreme Greed', value: 'Sell Zone', color: 'text-alert' },
      ]},

      { type: 'h3', text: 'Contrarian Strategy: Executing at Extreme Fear' },
      { type: 'p', text: 'Extreme Fear readings (0–24) indicate that market participants are overwhelmingly pessimistic, selling aggressively, and pricing in further losses. This is precisely the environment in which the best long-term buying opportunities exist. The difficulty is psychological: extreme fear feels like the worst possible time to buy — which is exactly why prices are so low. Warren Buffett\'s maxim, "Be fearful when others are greedy and greedy when others are fearful," is the professional distillation of this contrarian principle.' },
      { type: 'p', text: 'The contrarian buying strategy should be mechanical, not emotional. When the Fear & Greed Index drops into the Extreme Fear zone (below 25), increase your buying pace systematically across multiple days or weeks as the reading remains extreme. Historical analysis shows that buying during Extreme Fear and holding for 12 months produced positive returns over 85% of the time in the S&P 500 since 1990 — a statistical edge too large to ignore.' },
      { type: 'callout', variant: 'tip', title: 'The Sentiment-Adjusted DCA Strategy', body: 'Standard DCA = buy a fixed amount every month, regardless of conditions.\n\nSentiment-Adjusted DCA = dynamically scale based on the Fear reading:\n• Fear < 25 (Extreme Fear): Deploy 2× normal amount\n• Fear 25–55 (Fear to Neutral): Deploy 1× normal amount\n• Fear > 75 (Extreme Greed): Deploy 0.5× normal, increase cash\n\nThis automatically buys more at lower prices without requiring you to call a bottom.' },

      { type: 'h3', text: 'Contrarian Strategy: Reducing Exposure at Extreme Greed' },
      { type: 'p', text: 'Extreme Greed readings (75–100) signal that market participants are euphoric, leveraged, and complacent about risk. In this environment, the marginal risk/reward of adding new long positions is unfavourable — you are buying at peak valuations while the probability of a sentiment-driven correction is at its highest. The contrarian discipline is not necessarily aggressive shorting — it is systematic portfolio hygiene.' },
      { type: 'p', text: 'Use Extreme Greed readings as actionable signals for: (1) taking partial profits on positions that have had large recent moves, (2) tightening trailing stops to lock in unrealised gains, (3) reducing leverage if any is being used, (4) increasing cash allocation to deploy at the next Fear episode. You do not need to be right about the exact timing — you need to be right that at some point, Extreme Greed reverts toward Neutral. It always has.' },
      { type: 'callout', variant: 'warning', title: 'Sentiment Can Stay Extreme Longer Than You Expect', body: 'In strong bull markets — 1995–1999, 2020–2021 — the Fear & Greed Index stayed in Greed or Extreme Greed for months at a time. Do not short a market solely because sentiment is elevated. Markets can and do remain irrational far longer than any one trader can remain solvent. Use Extreme Greed as a signal to manage existing risk, never as a standalone trigger for aggressive short positions.' },

      { type: 'h2', text: 'The Economic Calendar' },
      { type: 'p', text: 'The Economic Calendar tracks scheduled macro events that historically cause the largest and most immediate moves in financial markets. Unlike earnings — where the market reaction depends purely on the number versus expectations — macro events have both a number and a narrative. How the market responds to a CPI print that comes in "hot" or "cold" depends on what was already expected AND what it implies for Federal Reserve policy. This multi-layered interpretation is what makes macro events among the most complex and most lucrative trading opportunities.' },

      { type: 'h3', text: 'CPI — Consumer Price Index' },
      { type: 'keyterm', term: 'CPI (Consumer Price Index)', definition: 'A measure of the average change in prices paid by consumers for a fixed basket of goods and services over time. Published monthly by the US Bureau of Labor Statistics on a pre-announced schedule. The year-over-year CPI is the most closely watched inflation metric and the most market-moving regular economic release. Core CPI excludes food and energy — the Fed\'s preferred inflation gauge because it strips out the most volatile components.' },
      { type: 'p', text: 'CPI releases move markets because they directly influence Federal Reserve interest rate decisions. A hot CPI — above consensus expectations — signals persistent inflation, increasing the probability of additional rate hikes or delayed cuts. Rate hikes are bearish for growth stocks (higher discount rate reduces future cash flow valuations), moderately bearish for bonds, and typically bullish for the US dollar. A cold CPI — below expectations — signals cooling inflation and increases probability of cuts, which is bullish for bonds, growth equities, and risk assets broadly.' },
      { type: 'p', text: 'Crucially, the "surprise" matters far more than the absolute number. Markets react to the deviation from consensus — not the level of CPI itself. A print at 3.5% when the consensus expected 3.7% is a cold print and bullish for stocks even though 3.5% is still historically elevated. Always monitor the Bloomberg or Reuters consensus number before the release and track the deviation, not just the headline figure.' },
      { type: 'callout', variant: 'warning', title: 'Position Sizing Around CPI Releases', body: 'In the 4 hours before a CPI release, implied volatility on S&P 500 options typically rises 20–40%. Post-release, volatility collapses ("IV crush"), leaving options buyers exposed even if they called the direction correctly.\n\nThe discipline: reduce directional position sizes to 50% or less before any high-impact CPI release. Never hold leveraged positions through CPI. The potential loss from a 2–3% adverse gap in 30 seconds is not compensated by any expected edge.' },

      { type: 'h3', text: 'FOMC — Federal Open Market Committee' },
      { type: 'keyterm', term: 'FOMC', definition: 'The Federal Open Market Committee sets US monetary policy through the Federal Funds Rate — the overnight lending rate between banks that forms the base of all borrowing costs in the economy. FOMC meetings occur 8 times per year, with decisions released at 2:00 PM ET followed by a press conference at 2:30 PM ET. Four of the eight meetings include the quarterly "dot plot" — the Fed\'s own projection of future rates.' },
      { type: 'p', text: 'FOMC meetings are the single most market-impactful scheduled event in the calendar. The decision itself — hike, hold, or cut — matters less than the forward guidance in the statement and press conference. A rate hold accompanied by hawkish language ("we remain prepared to hike further if necessary") can be more bearish for markets than an actual hike that was fully priced in. Markets always react to the delta between what was expected and what was actually delivered.' },
      { type: 'p', text: 'The tactical approach around FOMC: avoid holding new directional positions into the 2:00 PM announcement. The 30-minute window between the decision and the end of the press conference is characterised by violent, reversal-prone algorithm-driven moves. The highest-probability entry is typically 30–60 minutes after the press conference ends — when the dust has settled, analysts have interpreted the statement, and a sustainable directional trend begins to establish itself with real institutional participation behind it.' },
      { type: 'callout', variant: 'tip', title: 'The FOMC Dot Plot — What Moves Markets', body: 'Every quarter (March, June, September, December), the FOMC releases the "dot plot" showing where each of the 19 Fed officials projects the Federal Funds Rate at year-end for the next 3 years. Shifts in the median dot — particularly changes to the projected terminal rate — are frequently more market-moving than the rate decision itself.\n\nA dot plot showing fewer projected cuts than the market expected is hawkish and will sell off equities and bonds simultaneously. Watch the dots, not just the decision.' },

      { type: 'h3', text: 'Risk Management Rules for All High-Impact Events' },
      { type: 'list', items: [
        'Know the date and time in advance: Every high-impact event in the Economic Calendar is flagged. Mark them at the start of each week and plan your position sizes before they arrive — not during.',
        'Reduce size before the event: Cut position sizes to 50% or less before any high-impact release. The additional volatility risk is not compensated by a commensurate increase in expected return.',
        'Avoid adding positions in the final 2 hours before a release: Bid-ask spreads widen, slippage increases, and implied volatility is at its peak — every entry and option contract is at maximum cost.',
        'Wait for the initial move to settle: The first 5–15 minutes after a major release are driven by algorithmic headline readers reacting to a single number. These machines often get it wrong. Wait for the "re-read" move — the market\'s second reaction once humans have interpreted the full report — for higher-probability entries.',
        'Pre-define your stop loss before the event: Post-event volatility can gap through mental stops in milliseconds. Your order must already be in the book with specific price levels. Mental stops do not execute.',
      ]},
      { type: 'callout', variant: 'info', title: 'The 30-Minute Post-Release Rule', body: 'After any major macro release — CPI, FOMC, NFP (Nonfarm Payrolls), PCE — enforce a 30-minute waiting period before entering any new position.\n\nIn that window:\n1. Let the algorithmic first reaction fully play out\n2. Read analyst commentary to understand the consensus interpretation\n3. Identify whether the initial directional move is holding, reversing, or extending\n\nOnly after step 3 do you have the information asymmetry needed for a high-probability decision. The 30 minutes costs you nothing. It saves you from the worst slippage in the trading calendar.' },
    ],
  },
];

const CATEGORIES: Category[] = ['Platform Guide', 'Market Concepts', 'Trading Psychology', 'Technical Indicators'];

const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  'Platform Guide':       <BookOpen    size={13} />,
  'Market Concepts':      <TrendingUp  size={13} />,
  'Trading Psychology':   <BrainCircuit size={13} />,
  'Technical Indicators': <LineChart   size={13} />,
};

// ── Block renderer ────────────────────────────────────────────────────────────

const CALLOUT_STYLES = {
  info:    { border: 'border-gold/30',  bg: 'bg-gold/5',   dot: 'bg-gold',  label: 'text-gold'  },
  tip:     { border: 'border-live/30',  bg: 'bg-live/5',   dot: 'bg-live',  label: 'text-live'  },
  warning: { border: 'border-alert/30', bg: 'bg-alert/5',  dot: 'bg-alert', label: 'text-alert' },
};

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={idx} className="text-xl font-bold text-white mt-8 mb-3 border-b border-border pb-2">
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={idx} className="text-base font-bold text-white/90 mt-6 mb-2">
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={idx} className="text-sm text-muted leading-[1.9] mb-0">
          {block.text}
        </p>
      );
    case 'list':
      return (
        <ul key={idx} className="flex flex-col gap-2.5 my-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted leading-relaxed">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'callout': {
      const s = CALLOUT_STYLES[block.variant];
      return (
        <div key={idx} className={`rounded-lg border ${s.border} ${s.bg} px-4 py-4 flex flex-col gap-1.5 my-1`}>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${s.label}`}>{block.title}</span>
          </div>
          <p className="text-xs text-muted leading-relaxed whitespace-pre-line">{block.body}</p>
        </div>
      );
    }
    case 'metrics':
      return (
        <div key={idx} className="grid grid-cols-2 gap-3 my-1">
          {block.items.map((m, i) => (
            <div key={i} className="flex flex-col gap-0.5 bg-canvas rounded-lg px-4 py-3 border border-border">
              <span className="text-[10px] text-muted uppercase tracking-widest leading-none">{m.label}</span>
              <span className={`text-lg font-bold font-mono mt-1 ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      );
    case 'keyterm':
      return (
        <div key={idx} className="flex gap-3 border-l-2 border-gold/50 pl-4 my-1">
          <div>
            <span className="text-xs font-bold text-gold">{block.term}</span>
            <p className="text-xs text-muted leading-relaxed mt-0.5">{block.definition}</p>
          </div>
        </div>
      );
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function AcademyView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get('article') ?? 'vix';
  const [query,  setQuery] = useState('');
  const { startTour } = useVantixTour();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ARTICLES;
    return ARTICLES.filter(
      a => a.title.toLowerCase().includes(q) ||
           a.tags.some(t => t.toLowerCase().includes(q)) ||
           a.category.toLowerCase().includes(q)
    );
  }, [query]);

  const article = ARTICLES.find(a => a.id === activeId) ?? ARTICLES[0];

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Top search header ── */}
      <div className="shrink-0 pb-4 mb-4 border-b border-border flex items-center gap-4">
        <div className="flex items-center gap-2 text-gold">
          <GraduationCap size={18} />
          <h1 className="text-base font-bold">Vantix Academy</h1>
        </div>

        {/* Tour launcher */}
        <button
          onClick={startTour}
          className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold border border-live/40 bg-live/10 hover:bg-live/20 text-live transition-colors shrink-0"
          style={{ boxShadow: '0 0 12px rgba(0,255,136,0.12)' }}
        >
          <Play size={13} className="fill-live" />
          Start Interactive Platform Tour
        </button>
        <div className="relative flex-1 max-w-lg">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="w-full bg-input border border-border rounded-md pl-9 pr-3 py-2 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors"
            placeholder="Search concepts, features, or tutorials..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="flex-1 flex gap-5 min-h-0">

        {/* ── Left sidebar ── */}
        <aside className="w-56 shrink-0 flex flex-col gap-4 overflow-y-auto pr-1">
          {CATEGORIES.map(cat => {
            const items = filtered.filter(a => a.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 px-2 mb-1.5">
                  <span className="text-gold">{CATEGORY_ICONS[cat]}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{cat}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  {items.map(a => {
                    const isActive = a.id === activeId;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSearchParams({ article: a.id })}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-colors ${
                          isActive
                            ? 'bg-gold/10 text-gold border border-gold/20 font-semibold'
                            : 'text-muted hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {isActive && <ChevronRight size={11} className="shrink-0" />}
                        <span className={isActive ? '' : 'pl-[15px]'}>{a.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-xs text-muted px-2">No articles match your search.</p>
          )}
        </aside>

        {/* ── Article content ── */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <article className="glass-panel p-8 max-w-2xl flex flex-col gap-4">

            {/* Article header */}
            <div className="flex flex-col gap-3 pb-5 border-b border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] text-gold font-bold uppercase tracking-widest">
                  {CATEGORY_ICONS[article.category]}
                  {article.category}
                </span>
                <span className="text-muted/30">·</span>
                <span className="flex items-center gap-1 text-[10px] text-muted">
                  <Clock size={10} />
                  {article.readTime}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white leading-tight">{article.title}</h1>

              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag size={10} className="text-muted/60" />
                {article.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-muted/60 bg-white/5 border border-border px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Article body */}
            <div className="flex flex-col gap-4">
              {article.blocks.map((block, i) => renderBlock(block, i))}
            </div>

            {/* Footer navigation */}
            <div className="pt-6 mt-2 border-t border-border flex justify-between items-center">
              <span className="text-[11px] text-muted/50">Vantix Academy · {article.category}</span>
              <span className="text-[11px] text-muted/50">{article.readTime}</span>
            </div>

          </article>
        </main>

      </div>
    </div>
  );
}
