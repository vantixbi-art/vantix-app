import { useState, useEffect } from 'react';
import { MessageSquarePlus, X, Star, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../../contexts/UserContext';

type FeedbackType = 'bug' | 'feature' | 'general';

const COOLDOWN_KEY = 'vantix_feedback_cooldown';
const COOLDOWN_S   = 60;

const CATEGORIES: { type: FeedbackType; label: string; sub: string }[] = [
  { type: 'bug',     label: 'Bug Report',       sub: 'דיווח באג'   },
  { type: 'feature', label: 'Feature Request',  sub: "הצעת פיצ'ר"  },
  { type: 'general', label: 'General Feedback', sub: 'משוב כללי'   },
];

export function FeedbackWidget() {
  const { user } = useUser();

  const [open,        setOpen]        = useState(false);
  const [type,        setType]        = useState<FeedbackType>('general');
  const [rating,      setRating]      = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message,     setMessage]     = useState('');
  const [email,       setEmail]       = useState('');
  const [submitting,   setSubmitting]  = useState(false);
  const [success,      setSuccess]     = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // 60-second cooldown — ticks down in real time
  useEffect(() => {
    const tick = () => {
      const ts = localStorage.getItem(COOLDOWN_KEY);
      if (!ts) { setCooldownLeft(0); return; }
      const left = Math.ceil((COOLDOWN_S * 1000 - (Date.now() - parseInt(ts, 10))) / 1000);
      setCooldownLeft(Math.max(0, left));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Pre-fill email from auth session
  useEffect(() => {
    if (user?.email) setEmail(user.email as string);
  }, [user]);

  // Custom event — lets any page open the modal
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('open-feedback-modal', handler);
    return () => window.removeEventListener('open-feedback-modal', handler);
  }, []);

  // Auto-close 2 s after successful submission
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => { setOpen(false); setSuccess(false); }, 2000);
    return () => clearTimeout(t);
  }, [success]);

  function resetForm() {
    setType('general');
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setEmail((user?.email as string) ?? '');
    setSuccess(false);
  }

  function handleClose() { setOpen(false); resetForm(); }

  async function handleSubmit() {
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: user?.id   ?? null,
        email:   email.trim() || null,
        type,
        rating:  rating || null,
        message: message.trim(),
      });
      if (!error) {
        localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
        setCooldownLeft(COOLDOWN_S);
        setSuccess(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const starDisplay = hoverRating || rating;

  return (
    <>
      {/* ── Floating action button ── */}
      <button
        onClick={() => setOpen(true)}
        title="Feedback & Bug Report"
        className={[
          'fixed bottom-6 left-6 z-50',
          'w-11 h-11 flex items-center justify-center rounded-full',
          'border border-border/60 bg-panel/90 backdrop-blur-md',
          'text-muted transition-all duration-200',
          'hover:text-gold hover:border-gold/40 hover:scale-110',
        ].join(' ')}
        style={{ boxShadow: '0 4px 22px rgba(0,0,0,0.55)' }}
      >
        <MessageSquarePlus
          size={17}
          className="transition-all group-hover:drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]"
        />
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <div
            className="relative w-full max-w-md glass-panel border-gold/20 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 60px rgba(0,0,0,0.7), 0 0 24px rgba(255,215,0,0.06)' }}
          >
            {/* Close */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted/60 hover:text-white transition-colors z-10"
            >
              <X size={15} />
            </button>

            {/* ── Success screen ── */}
            {success ? (
              <div className="flex flex-col items-center justify-center gap-4 py-14 px-8 text-center">
                <div
                  className="w-16 h-16 rounded-full bg-live/10 border border-live/25 flex items-center justify-center"
                  style={{ boxShadow: '0 0 24px rgba(0,255,136,0.15)' }}
                >
                  <CheckCircle2
                    size={30}
                    className="text-live"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.55))' }}
                  />
                </div>
                <div>
                  <p className="text-base font-bold text-white">Thank you for your feedback!</p>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">
                    We read every submission and appreciate your input.
                  </p>
                </div>
              </div>
            ) : (
              /* ── Form ── */
              <div className="p-6 flex flex-col gap-5">

                {/* Header */}
                <div className="pr-6">
                  <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
                    <MessageSquarePlus size={15} className="text-gold" />
                    Submit Feedback
                  </h2>
                  <p className="text-[11px] text-muted mt-0.5">Help us make Vantix better</p>
                </div>

                {/* Category pills */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Category</span>
                  <div className="flex gap-2">
                    {CATEGORIES.map(c => (
                      <button
                        key={c.type}
                        onClick={() => setType(c.type)}
                        className={[
                          'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg border text-center transition-all',
                          type === c.type
                            ? 'bg-gold/10 border-gold/40 text-gold'
                            : 'bg-white/5 border-border text-muted hover:border-gold/25 hover:text-white',
                        ].join(' ')}
                      >
                        <span className="text-[11px] font-semibold leading-none">{c.label}</span>
                        <span className="text-[9px] opacity-60 font-normal mt-0.5 leading-none">{c.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Email</span>
                  <input
                    type="email"
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white placeholder:text-muted/40 font-mono focus:outline-none focus:border-gold transition-colors"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                {/* Star rating */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Overall Rating</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        key={n}
                        onMouseEnter={() => setHoverRating(n)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(n === rating ? 0 : n)}
                        className="p-1 transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          size={22}
                          className={`transition-all ${
                            n <= starDisplay ? 'fill-gold text-gold' : 'text-muted/25'
                          }`}
                          style={n <= starDisplay
                            ? { filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.65))' }
                            : undefined}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="text-[10px] text-muted ml-1.5 font-mono">{rating}/5</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-muted uppercase tracking-widest">Description</span>
                  <textarea
                    rows={4}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-white placeholder:text-muted/40 resize-none focus:outline-none focus:border-gold transition-colors"
                    placeholder="Describe the bug, feature idea, or feedback in detail…"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                  <span className="text-[10px] text-muted/40 self-end font-mono">{message.length} chars</span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || submitting || cooldownLeft > 0}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-bold transition-all bg-gold text-black hover:bg-gold/90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={message.trim() && cooldownLeft === 0 ? { boxShadow: '0 0 20px rgba(255,215,0,0.28)' } : undefined}
                >
                  {submitting
                    ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                    : cooldownLeft > 0
                    ? `Please wait ${cooldownLeft}s…`
                    : 'Submit Feedback'
                  }
                </button>

              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
