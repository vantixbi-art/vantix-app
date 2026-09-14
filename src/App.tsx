import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { Layout } from './components/layout/Layout';
import { LandingView } from './pages/LandingView';
import { TerminalView } from './pages/TerminalView';
import { ToolsView } from './pages/ToolsView';
import { JournalView } from './pages/JournalView';
import { WhalesView } from './pages/WhalesView';
import { AlertsView } from './pages/AlertsView';
import { NewsView } from './pages/NewsView';
import { SettingsView } from './pages/SettingsView';
import { AcademyView } from './pages/AcademyView';
import { BillingView } from './pages/BillingView';
import { TermsView } from './pages/TermsView';
import { PrivacyView } from './pages/PrivacyView';
import { AccessibilityView } from './pages/AccessibilityView';
import { NotFoundView } from './pages/NotFoundView';
import { SiteAccessGate } from './components/auth/SiteAccessGate';

function Preloader() {
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center relative overflow-hidden select-none">
      {/* Background ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-live/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Dual spinning rings with candlestick center */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          {/* Outer gold ring — clockwise */}
          <div
            className="absolute inset-0 rounded-full border-2 border-gold/20 border-t-gold animate-spin"
            style={{ animationDuration: '1.2s' }}
          />

          {/* Inner green ring — counter-clockwise */}
          <div
            className="absolute inset-2 rounded-full border-2 border-live/20 border-b-live animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.8s' }}
          />

          {/* Center: Japanese candlestick chart icon */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,255,136,0.08) 0%, rgba(7,7,9,0.95) 70%)',
              border: '1px solid rgba(212,175,55,0.45)',
              boxShadow: '0 0 22px rgba(212,175,55,0.28), 0 0 12px rgba(0,255,136,0.14)',
            }}
          >
            {/*
              3-bar candlestick: red bearish candle (left) followed by
              two rising green bullish candles — a classic bullish reversal pattern.
              Each group pulses with a staggered delay for a sequenced neon glow effect.
            */}
            <svg width="23" height="19" viewBox="0 0 23 19" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Candle 1 — bearish red (price fell) */}
              <g style={{ filter: 'drop-shadow(0 0 2px rgba(255,77,77,0.95))', animation: 'pulse 2.6s ease-in-out infinite' }}>
                <line x1="3.5" y1="2"    x2="3.5" y2="17"   stroke="#FF4D4D" strokeWidth="0.9" strokeLinecap="round" />
                <rect x="1.8"  y="4.5"   width="3.4" height="9"   rx="0.35" fill="#FF4D4D" />
              </g>

              {/* Candle 2 — bullish green (recovery) */}
              <g style={{ filter: 'drop-shadow(0 0 2.5px rgba(0,255,136,0.95))', animation: 'pulse 2.6s ease-in-out 0.45s infinite' }}>
                <line x1="11.5" y1="3"   x2="11.5" y2="16"  stroke="#00FF88" strokeWidth="0.9" strokeLinecap="round" />
                <rect x="9.8"   y="5.5"  width="3.4" height="8"   rx="0.35" fill="#00FF88" />
              </g>

              {/* Candle 3 — strong bullish green (breakout, tallest) */}
              <g style={{ filter: 'drop-shadow(0 0 3px rgba(0,255,136,0.95))', animation: 'pulse 2.6s ease-in-out 0.9s infinite' }}>
                <line x1="19.5" y1="1.5" x2="19.5" y2="12"  stroke="#00FF88" strokeWidth="0.9" strokeLinecap="round" />
                <rect x="17.8"  y="2.5"  width="3.4" height="7.5" rx="0.35" fill="#00FF88" />
              </g>
            </svg>
          </div>
        </div>

        {/* Branding & status */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2">
            <span className="text-base font-black tracking-[0.25em] uppercase text-white">VANTIX</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-gold/40 bg-gold/10 text-gold tracking-widest uppercase">
              AI
            </span>
          </div>

          <p className="text-xs text-muted/80 tracking-wide font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-live animate-ping" />
            Loading AI Market Engine…
          </p>
        </div>

        {/* High-tech micro progress bar */}
        <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden relative mt-1">
          <div
            className="h-full bg-gradient-to-r from-gold via-live to-gold rounded-full animate-pulse"
            style={{ width: '100%', boxShadow: '0 0 12px rgba(0,255,136,0.6)' }}
          />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, loading } = useUser();

  if (loading) {
    return <Preloader />;
  }

  // Auth gate: the entire BrowserRouter (and therefore every private route component)
  // is only mounted after loading resolves AND a valid session exists.
  // No private component can data-fetch or render until both conditions are true.
  if (!user) {
    return <LandingView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<TerminalView />} />
          <Route path="news"     element={<NewsView />} />
          <Route path="tools"    element={<ToolsView />} />
          <Route path="journal"  element={<JournalView />} />
          <Route path="whales"   element={<WhalesView />} />
          <Route path="alerts"   element={<AlertsView />} />
          <Route path="academy"  element={<AcademyView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="billing"  element={<BillingView />} />
          <Route path="terms"          element={<TermsView />} />
          <Route path="privacy"        element={<PrivacyView />} />
          <Route path="accessibility"  element={<AccessibilityView />} />
          <Route path="*"              element={<NotFoundView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <SiteAccessGate>
      <ThemeProvider>
        <UserProvider>
          <AppShell />
        </UserProvider>
      </ThemeProvider>
    </SiteAccessGate>
  );
}

export default App;
