"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";

type OnlineStatusContextValue = {
  isOnline: boolean;
};

const OnlineStatusContext = createContext<OnlineStatusContextValue>({
  isOnline: true,
});

export function useOnlineStatus() {
  return useContext(OnlineStatusContext);
}

export function OnlineStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
    }

    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const value = useMemo(() => ({ isOnline }), [isOnline]);

  return (
    <OnlineStatusContext.Provider value={value}>
      {children}
    </OnlineStatusContext.Provider>
  );
}
