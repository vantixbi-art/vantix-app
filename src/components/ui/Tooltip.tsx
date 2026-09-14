import { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  position?: 'top' | 'bottom';
  children?: React.ReactNode;
}

export function Tooltip({ text, position = 'top', children }: TooltipProps) {
  const [show, setShow] = useState(false);

  const isBottom = position === 'bottom';

  return (
    <span
      className="relative inline-flex items-center cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children ?? (
        <Info size={11} className="text-muted/45 hover:text-gold/70 transition-colors" />
      )}

      {show && (
        <span
          className={[
            'absolute left-1/2 -translate-x-1/2 z-[100] w-48 px-2.5 py-2 rounded-lg bg-[#131316] border border-border/90 text-[10px] text-muted/90 leading-relaxed shadow-2xl pointer-events-none whitespace-normal font-sans font-normal not-italic text-left',
            isBottom ? 'top-full mt-2' : 'bottom-full mb-2.5',
          ].join(' ')}
        >
          {text}
          {/* Arrow */}
          {isBottom ? (
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-b-[#1e1e22]" />
          ) : (
            <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-[#1e1e22]" />
          )}
        </span>
      )}
    </span>
  );
}
