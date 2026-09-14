import { Link } from 'react-router-dom';
import { Home, TriangleAlert } from 'lucide-react';

export function NotFoundView() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 select-none" role="main">
      <div className="flex flex-col items-center gap-5 text-center max-w-sm px-6">

        {/* Icon */}
        <div className="p-5 rounded-2xl border border-alert/20 bg-alert/5">
          <TriangleAlert size={36} className="text-alert" />
        </div>

        {/* Copy */}
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono text-muted/40 tracking-widest uppercase">Error 404</p>
          <h1 className="text-3xl font-bold text-white">Page not found</h1>
          <p className="text-sm text-muted/70 leading-relaxed">
            This page doesn't exist or has been moved. Use the sidebar to navigate.
          </p>
        </div>

        {/* Action */}
        <Link
          to="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-live/10 border border-live/30 text-live text-sm font-semibold hover:bg-live/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-live/60"
        >
          <Home size={15} />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
