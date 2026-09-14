import { createContext, useContext, useState, type ReactNode } from 'react';

interface ZenModeContextValue {
  isZenMode: boolean;
  enterZen: () => void;
  exitZen: () => void;
}

const ZenModeContext = createContext<ZenModeContextValue>({
  isZenMode: false,
  enterZen: () => {},
  exitZen: () => {},
});

export function ZenModeProvider({ children }: { children: ReactNode }) {
  const [isZenMode, setIsZenMode] = useState(false);

  return (
    <ZenModeContext.Provider
      value={{
        isZenMode,
        enterZen: () => setIsZenMode(true),
        exitZen:  () => setIsZenMode(false),
      }}
    >
      {children}
    </ZenModeContext.Provider>
  );
}

export function useZenMode() {
  return useContext(ZenModeContext);
}
