import { useState } from 'react';
import { Camera, ChevronRight, Zap, CheckCircle2 } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

type Experience = 'Beginner' | 'Intermediate' | 'Pro';

const EXPERIENCE_OPTIONS: { value: Experience; label: string; desc: string }[] = [
  { value: 'Beginner',     label: 'Beginner',     desc: 'Less than 1 year trading'         },
  { value: 'Intermediate', label: 'Intermediate', desc: '1–5 years, comfortable with TA'   },
  { value: 'Pro',          label: 'Pro',           desc: '5+ years, full-time or systematic' },
];

const FOCUS_OPTIONS = ['Equities', 'Crypto', 'Options', 'Forex', 'Futures'];

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [nickname,    setNickname]    = useState('');
  const [experience,  setExperience]  = useState<Experience>('Intermediate');
  const [focus,       setFocus]       = useState<string[]>(['Equities']);
  const [avatarHover, setAvatarHover] = useState(false);

  const canComplete = nickname.trim().length >= 2;

  function toggleFocus(f: string) {
    setFocus(prev =>
      prev.includes(f) ? (prev.length > 1 ? prev.filter(x => x !== f) : prev) : [...prev, f]
    );
  }

  const inputCls =
    'w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-gold transition-colors';

  return (
    <div className="min-h-screen bg-canvas text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full bg-live/5 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full bg-gold/4 blur-[120px]" />
      </div>

      {/* Logo */}
      <div className="relative z-10 flex items-center gap-2 mb-10">
        <Zap size={18} className="text-gold" />
        <span className="text-base font-bold tracking-widest uppercase">Vantix</span>
      </div>

      {/* Card */}
      <div
        className="relative z-10 glass-panel p-8 w-full max-w-md flex flex-col gap-6"
        style={{ boxShadow: '0 0 40px rgba(0,255,136,0.06)' }}
      >
        {/* Progress bar */}
        <div className="flex gap-1.5 -mt-2">
          {[1, 2, 3].map(step => (
            <div key={step} className={`h-0.5 flex-1 rounded-full ${step === 1 ? 'bg-live' : 'bg-border'}`} />
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold">Set Up Your Profile</h1>
          <p className="text-xs text-muted">Personalise your Vantix experience before entering the terminal</p>
        </div>

        {/* Avatar upload */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
            className="relative w-16 h-16 rounded-full border-2 border-dashed border-border hover:border-gold transition-colors shrink-0 bg-white/5 flex items-center justify-center overflow-hidden group"
          >
            <span className={`flex flex-col items-center gap-1 transition-opacity ${avatarHover ? 'opacity-100' : 'opacity-60'}`}>
              <Camera size={16} className="text-muted group-hover:text-gold transition-colors" />
              <span className="text-[9px] text-muted group-hover:text-gold transition-colors leading-none">Upload</span>
            </span>
          </button>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white">Profile Photo</span>
            <span className="text-xs text-muted">Optional · PNG or JPG · Max 2MB</span>
          </div>
        </div>

        {/* Nickname */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-muted uppercase tracking-widest">Choose a Nickname</label>
          <input
            className={inputCls}
            placeholder="e.g. AlphaTrader"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={24}
          />
          <div className="flex justify-end">
            <span className="text-[10px] text-muted/50">{nickname.length}/24</span>
          </div>
        </div>

        {/* Trading Experience */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-muted uppercase tracking-widest">Trading Experience</label>
          <div className="flex flex-col gap-2">
            {EXPERIENCE_OPTIONS.map(opt => {
              const active = experience === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperience(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all ${
                    active
                      ? 'border-gold/40 bg-gold/8 text-white'
                      : 'border-border bg-white/5 text-muted hover:border-muted hover:text-white'
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    active ? 'border-gold' : 'border-muted'
                  }`}>
                    {active && <div className="w-1.5 h-1.5 rounded-full bg-gold" />}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className={`text-sm font-semibold ${active ? 'text-white' : ''}`}>{opt.label}</span>
                    <span className="text-[11px] text-muted">{opt.desc}</span>
                  </div>
                  {active && <CheckCircle2 size={14} className="text-gold ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Market Focus */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] text-muted uppercase tracking-widest">Market Focus</label>
          <div className="flex flex-wrap gap-2">
            {FOCUS_OPTIONS.map(f => {
              const active = focus.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFocus(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-live/15 border-live/40 text-live'
                      : 'bg-white/5 border-border text-muted hover:border-muted hover:text-white'
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
          <span className="text-[10px] text-muted/50">Select all that apply</span>
        </div>

        {/* Complete Setup */}
        <button
          onClick={onComplete}
          disabled={!canComplete}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-sm font-bold bg-live text-black hover:bg-live/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={canComplete ? { boxShadow: '0 0 20px rgba(0,255,136,0.25)' } : {}}
        >
          Enter the Terminal
          <ChevronRight size={16} />
        </button>

        {!canComplete && (
          <p className="text-center text-[11px] text-muted -mt-2">
            Enter a nickname to continue (min. 2 characters)
          </p>
        )}
      </div>

      <p className="relative z-10 text-[11px] text-muted/40 mt-8">
        You can update these settings anytime from the Settings page.
      </p>
    </div>
  );
}
