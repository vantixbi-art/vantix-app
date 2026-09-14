import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2 } from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text: "Hey — I'm your Vantix AI. Ask me anything: pattern analysis, risk sizing, market context, or how to use any feature on the platform.",
  },
];

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "That's a great question. Based on current market structure I'd look for confluence at key support levels before entering. Always confirm on the higher timeframe first.",
  bull: "Bull flags on high-volume breakouts have historically resolved upward ~72% of the time when confirmed above the prior high. Tight stop just below the flag pole base.",
  risk: "The institutional standard is 1–2% of account per trade. With a $10,000 account that's $100–$200 max loss. Use the Position Sizer in the Terminal to calculate exact share count.",
  vwap: "VWAP is the volume-weighted average price for the session. A stock trading above VWAP with rising volume is in a healthy intraday uptrend. Below VWAP with rising volume signals distribution.",
  rsi: "RSI above 70 is technically overbought, but in strong trending markets stocks can stay overbought for extended periods. More useful as a divergence signal than a hard reversal trigger.",
};

function getMockResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('bull') || lower.includes('flag')) return MOCK_RESPONSES.bull;
  if (lower.includes('risk') || lower.includes('size') || lower.includes('position')) return MOCK_RESPONSES.risk;
  if (lower.includes('vwap')) return MOCK_RESPONSES.vwap;
  if (lower.includes('rsi') || lower.includes('oversold') || lower.includes('overbought')) return MOCK_RESPONSES.rsi;
  return MOCK_RESPONSES.default;
}

export function AIAssistant() {
  const [open, setOpen]       = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: getMockResponse(text) }]);
    }, 900 + Math.random() * 600);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-panel border border-live/40 flex items-center justify-center shadow-lg shadow-live/10 hover:border-live/80 hover:shadow-live/25 transition-all group"
        title="Vantix AI Assistant"
      >
        <Bot size={24} className="text-live group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-live animate-pulse" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 flex flex-col glass-panel shadow-2xl shadow-black/60 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-live/10 border border-live/40 flex items-center justify-center">
          <Bot size={14} className="text-live" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-none">Vantix AI</p>
          <p className="text-xs text-muted mt-0.5">Pattern & Risk Analyst</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-muted hover:text-white transition-colors p-1 rounded"
        >
          <Minimize2 size={14} />
        </button>
        <button
          onClick={() => { setOpen(false); setMessages(INITIAL_MESSAGES); }}
          className="text-muted hover:text-alert transition-colors p-1 rounded"
        >
          <X size={14} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-live/10 border border-live/30 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={11} className="text-live" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-live/15 text-white rounded-br-none'
                  : 'bg-input text-white/90 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-live/10 border border-live/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={11} className="text-live" />
            </div>
            <div className="bg-input rounded-xl rounded-bl-none px-3 py-2">
              <span className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about patterns, risk, setups..."
          className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-muted focus:outline-none focus:border-live/50 transition-colors"
        />
        <button
          onClick={send}
          disabled={!input.trim() || typing}
          className="w-8 h-8 rounded-lg bg-live/10 border border-live/40 flex items-center justify-center text-live hover:bg-live/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
