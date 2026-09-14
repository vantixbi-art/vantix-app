import { useEffect, useRef } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { FeedbackWidget } from '../feedback/FeedbackWidget';
import { CookieBanner } from '../common/CookieBanner';
import { ZenModeProvider, useZenMode } from '../../contexts/ZenModeContext';

function LayoutInner() {
  const { isZenMode } = useZenMode();
  const location = useLocation();

  const mainRef    = useRef<HTMLElement>(null);
  const aurora1Ref = useRef<HTMLDivElement>(null);
  const aurora2Ref = useRef<HTMLDivElement>(null);
  const aurora3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const panel = (e.target as HTMLElement).closest<HTMLElement>('.glass-panel');
      if (!panel) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      panel.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    }

    const main = mainRef.current;
    function onScroll() {
      if (!main) return;
      const y = main.scrollTop;
      // Each orb moves at a different rate for depth — positive = drift down, negative = drift up
      if (aurora1Ref.current) aurora1Ref.current.style.transform = `translateY(${y * 0.08}px) translateZ(0)`;
      if (aurora2Ref.current) aurora2Ref.current.style.transform = `translateY(${y * -0.05}px) translateZ(0)`;
      if (aurora3Ref.current) aurora3Ref.current.style.transform = `translateY(${y * 0.035}px) translateZ(0)`;
    }

    window.addEventListener('mousemove', onMouseMove);
    main?.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      main?.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="relative flex h-screen bg-canvas text-white overflow-hidden">

      {/* ── Aurora backdrop ── */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Each wrapper holds the scroll-parallax transform; the inner .aurora-orb handles the drift animation */}
        <div ref={aurora1Ref} className="absolute" style={{ top: '-15%', left: '-5%', width: '700px', height: '700px', willChange: 'transform' }}>
          <div
            className="aurora-orb aurora-1"
            style={{ width: '700px', height: '700px', top: 0, left: 0,
              background: 'radial-gradient(ellipse at center, rgb(var(--glow-accent) / 0.10) 0%, transparent 70%)' }}
          />
        </div>
        <div ref={aurora2Ref} className="absolute" style={{ top: '28%', right: '-8%', width: '620px', height: '620px', willChange: 'transform' }}>
          <div
            className="aurora-orb aurora-2"
            style={{ width: '620px', height: '620px', top: 0, left: 0,
              background: 'radial-gradient(ellipse at center, rgb(var(--glow-live) / 0.07) 0%, transparent 70%)' }}
          />
        </div>
        <div ref={aurora3Ref} className="absolute" style={{ bottom: '-12%', left: '32%', width: '520px', height: '520px', willChange: 'transform' }}>
          <div
            className="aurora-orb aurora-3"
            style={{ width: '520px', height: '520px', top: 0, left: 0,
              background: 'radial-gradient(ellipse at center, rgb(var(--glow-accent) / 0.055) 0%, transparent 70%)' }}
          />
        </div>
      </div>

      {!isZenMode && <Sidebar />}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main ref={mainRef} className="flex-1 overflow-y-auto p-6 relative">
          <div key={location.pathname} className="page-enter h-full">
            <Outlet />
          </div>
        </main>

        <footer className="shrink-0 border-t border-border/40 px-6 py-3 text-[10px] text-muted/40 leading-relaxed text-center">
          <span className="font-semibold text-muted/50">Disclaimer:</span> Vantix is an informational and educational platform. All content, data, alerts, tools, and AI-generated analysis are for analytical purposes only and do not constitute financial, investment, trading, or tax advice. Trading financial instruments, including stocks, options, and cryptocurrencies, carries a high level of risk and may not be suitable for all investors. Vantix does not assume any liability for financial losses or trading decisions made based on the information provided on this website.
          <span className="mt-1.5 flex items-center justify-center gap-3 flex-wrap">
            <Link to="/terms"          className="hover:text-muted/70 underline underline-offset-2 transition-colors">Terms of Service</Link>
            <span className="text-muted/20">·</span>
            <Link to="/privacy"        className="hover:text-muted/70 underline underline-offset-2 transition-colors">Privacy Policy</Link>
            <span className="text-muted/20">·</span>
            <Link to="/accessibility"  className="hover:text-muted/70 underline underline-offset-2 transition-colors">Accessibility</Link>
            <span className="text-muted/20">·</span>
            <a href="mailto:support@vantix.io" className="hover:text-muted/70 underline underline-offset-2 transition-colors">Contact</a>
          </span>
        </footer>
      </div>

      <FeedbackWidget />
      <CookieBanner />
    </div>
  );
}

export function Layout() {
  return (
    <ZenModeProvider>
      <LayoutInner />
    </ZenModeProvider>
  );
}
