import { useEffect, useRef } from 'react';

export function TickerTape() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'AMEX:SPY',      title: 'SPY'    },
        { proName: 'NASDAQ:QQQ',    title: 'QQQ'    },
        { proName: 'CRYPTO:BTCUSD', title: 'BTC/USD' },
        { proName: 'CRYPTO:ETHUSD', title: 'ETH/USD' },
        { proName: 'NASDAQ:TSLA',   title: 'TSLA'   },
        { proName: 'NASDAQ:NVDA',   title: 'NVDA'   },
      ],
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: 'adaptive',
      colorTheme: 'dark',
      theme: 'dark',
      locale: 'en',
    });

    container.current.appendChild(script);
  }, []);

  return (
    <div className="w-full bg-panel border-b border-border mb-6 rounded-lg overflow-hidden">
      <div className="tradingview-widget-container" ref={container}>
        <div className="tradingview-widget-container__widget"></div>
      </div>
    </div>
  );
}
