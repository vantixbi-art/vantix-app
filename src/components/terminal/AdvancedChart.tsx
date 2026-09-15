import { useEffect, useRef, memo } from 'react';

interface AdvancedChartProps {
  symbol: string;
}

export const AdvancedChart = memo(function AdvancedChart({ symbol }: AdvancedChartProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.current.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol || "NVDA",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      backgroundColor: "#0A0A0B",
      gridColor: "#1E1E22",
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      support_host: "https://www.tradingview.com"
    });

    container.current.appendChild(script);
  }, [symbol]);

  return (
    <div id="tour-advanced-chart" className="glass-panel w-full h-full min-h-[420px] overflow-hidden flex flex-col p-1">
      <div className="tradingview-widget-container flex-1 w-full h-full" ref={container}></div>
    </div>
  );
});
