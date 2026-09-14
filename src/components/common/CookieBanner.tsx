import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'vantix_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(CONSENT_KEY)) setVisible(true);
    } catch {
      // localStorage unavailable (sandboxed iframe, private mode with strict settings)
    }
  }, []);

  const accept = (level: 'all' | 'essential') => {
    try {
      localStorage.setItem(CONSENT_KEY, level);
    } catch { /* ignore */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie and storage consent"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] w-full max-w-lg px-4"
    >
      <div className="rounded-xl border border-border bg-canvas/95 backdrop-blur-sm shadow-2xl p-4 flex flex-col gap-3">

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cookie size={14} className="text-gold shrink-0" />
            <p className="text-xs font-semibold text-white">We use browser storage</p>
          </div>
          <button
            type="button"
            onClick={() => accept('essential')}
            aria-label="Dismiss, accept essential only"
            className="text-muted/50 hover:text-muted transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-[11px] text-muted/70 leading-relaxed">
          Vantix stores essential data in your browser (session tokens, preferences, and API keys you provide) to run the service. We also use analytics to improve the platform. See our{' '}
          <Link to="/privacy" className="underline text-muted/90 hover:text-white transition-colors">
            Privacy Policy
          </Link>{' '}
          for a full list of what is stored.
        </p>

        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => accept('essential')}
            className="text-[11px] px-3 py-1.5 rounded-lg border border-border text-muted hover:border-white/20 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={() => accept('all')}
            className="text-[11px] px-3 py-1.5 rounded-lg bg-gold text-canvas font-semibold hover:bg-gold/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            Accept All
          </button>
        </div>

      </div>
    </div>
  );
}
