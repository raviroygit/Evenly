import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SwipeActionContextType {
  activeSwipeId: string | null;
  setActiveSwipeId: (id: string | null) => void;
}

const SwipeActionContext = createContext<SwipeActionContextType | undefined>(undefined);

interface SwipeActionProviderProps {
  children: ReactNode;
}

export const SwipeActionProvider: React.FC<SwipeActionProviderProps> = ({ children }) => {
  const [activeSwipeId, setActiveSwipeId] = useState<string | null>(null);

  return (
    <SwipeActionContext.Provider value={{ activeSwipeId, setActiveSwipeId }}>
      {children}
    </SwipeActionContext.Provider>
  );
};

export const useSwipeAction = () => {
  const context = useContext(SwipeActionContext);
  if (context === undefined) {
    throw new Error('useSwipeAction must be used within a SwipeActionProvider');
  }
  return context;
};
