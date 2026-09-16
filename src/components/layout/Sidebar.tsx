import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Globe2,
  LineChart,
  BookOpen,
  Fish,
  BellRing,
  Settings,
  GraduationCap,
  CreditCard,
  Crown,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUser } from '../../contexts/UserContext';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/', icon: Activity, label: 'Terminal', tourId: 'tour-sidebar-terminal' },
  { path: '/news', icon: Globe2, label: 'Global News', tourId: 'tour-sidebar-news' },
  { path: '/tools', icon: LineChart, label: 'Investor Tools', tourId: 'tour-sidebar-tools' },
  { path: '/journal', icon: BookOpen, label: 'Trade Journal', tourId: 'tour-sidebar-journal' },
  { path: '/whales', icon: Fish, label: 'Whale Tracker', tourId: 'tour-sidebar-whales' },
  { path: '/alerts', icon: BellRing, label: 'Alerts', tourId: 'tour-sidebar-alerts' },
  { path: '/academy', icon: GraduationCap, label: 'Academy', tourId: 'tour-sidebar-academy' },
  { path: '/billing', icon: CreditCard, label: 'Billing & Plans' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const STORAGE_KEY = 'vantix-sidebar';

export function Sidebar() {
  const location = useLocation();
  const { tier, user, signOut } = useUser();

  const email       = user?.email || 'Guest Trader';
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.name
    || (user?.email ? user.email.split('@')[0] : 'Trader');
  const initial = displayName.charAt(0).toUpperCase();

  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    if (!user?.id) return '';
    return user?.user_metadata?.avatar_url || localStorage.getItem(`vantix_avatar_${user.id}`) || '';
  });

  useEffect(() => {
    function onUpdate(e: Event) {
      setAvatarUrl((e as CustomEvent<string>).detail ?? '');
    }
    window.addEventListener('vantix-avatar-updated', onUpdate);
    return () => window.removeEventListener('vantix-avatar-updated', onUpdate);
  }, []);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === 'collapsed'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, collapsed ? 'collapsed' : 'expanded'); }
    catch { /* ignore */ }
  }, [collapsed]);

  const isPro = tier === 'pro';

  return (
    <aside
      className={cn(
        'relative h-screen bg-canvas border-r border-border flex flex-col py-4 shrink-0 transition-all duration-300 ease-in-out overflow-visible',
        collapsed ? 'w-[72px] px-3' : 'w-64 px-4'
      )}
    >
      {/* Brand + inline toggle */}
      <div className={cn('flex items-center mb-6', collapsed ? 'justify-center' : 'justify-between px-1')}>
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded bg-live flex items-center justify-center text-canvas font-bold text-xl shrink-0">
            V
          </div>
          {!collapsed && (
            <span className="text-xl font-heading font-bold tracking-wider whitespace-nowrap">
              VANTIX
            </span>
          )}
        </div>

        {/* Toggle button — floats on the right edge in a round pill */}
        <button
          onClick={() => setCollapsed(v => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'absolute -right-3 top-7 z-50',
            'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
            'bg-canvas border border-border text-muted',
            'hover:border-gold/60 hover:text-gold hover:bg-gold/[0.08]',
            'transition-all duration-200 shadow-md'
          )}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Navigation */}
      <nav id="tour-sidebar-nav" className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <div key={item.path} className="relative group">
              <Link
                to={item.path}
                id={(item as { tourId?: string }).tourId}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'nav-item',
                  collapsed ? 'justify-center px-0 py-2.5' : '',
                  isActive && 'nav-item-active'
                )}
              >
                <Icon size={20} className={cn('shrink-0', isActive && 'text-live')} />
                {!collapsed && (
                  <span className="font-medium whitespace-nowrap">{item.label}</span>
                )}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-live" />
                )}
              </Link>

              {/* Collapsed tooltip */}
              {collapsed && (
                <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md bg-[#131316] border border-border/90 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-[200] shadow-xl">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* User profile card — expanded only */}
      {!collapsed && (
        <div className="mt-2 mb-2 p-3 glass-panel flex items-center gap-3">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-7 h-7 rounded-full object-cover border border-gold/30 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 border border-gold/30 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-gold">{initial}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{displayName}</p>
            <p className="text-[10px] text-muted truncate">{email}</p>
          </div>
          {isPro ? (
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 shrink-0"
              style={{ boxShadow: '0 0 8px rgb(var(--glow-accent) / 0.15)' }}
            >
              <Crown size={9} className="text-gold" />
              <span className="text-[9px] font-bold text-gold tracking-wide">PRO</span>
            </div>
          ) : (
            <span className="text-[9px] font-bold text-muted border border-muted/30 rounded-full px-2 py-0.5 shrink-0">
              FREE
            </span>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            aria-label="Sign out"
            title="Sign out"
            className="text-muted/40 hover:text-alert transition-colors shrink-0 ml-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-alert/50 rounded"
          >
            <LogOut size={13} />
          </button>
        </div>
      )}

      {/* Status bar — expanded only */}
      {!collapsed && (
        <div className="mb-1 p-4 glass-panel flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-live animate-pulse shrink-0" />
          <span className="text-sm font-mono text-muted">System Live</span>
        </div>
      )}

      {/* Legal links — expanded only */}
      {!collapsed && (
        <div className="mt-1 px-1 flex items-center justify-center gap-2 flex-wrap">
          <Link to="/privacy" className="text-[9px] text-muted/40 hover:text-muted/70 transition-colors underline-offset-2 hover:underline">Privacy</Link>
          <span className="text-muted/20 text-[9px]">·</span>
          <Link to="/terms" className="text-[9px] text-muted/40 hover:text-muted/70 transition-colors underline-offset-2 hover:underline">Terms</Link>
          <span className="text-muted/20 text-[9px]">·</span>
          <Link to="/accessibility" className="text-[9px] text-muted/40 hover:text-muted/70 transition-colors underline-offset-2 hover:underline">Accessibility</Link>
        </div>
      )}
    </aside>
  );
}
