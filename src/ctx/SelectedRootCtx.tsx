import { createContext, ReactNode, useContext, useState } from "react";
import { Root } from "@/model/Root";

interface SelectedRootContextValue {
  selectedRoot: Root | null;
  setSelectedRoot: (root: Root | null) => void;
}

const SelectedRootContext = createContext<SelectedRootContextValue | undefined>(
  undefined,
);

export const SelectedRootProvider = ({ children }: { children: ReactNode }) => {
  const [selectedRoot, setSelectedRoot] = useState<Root | null>(null);

  return (
    <SelectedRootContext.Provider value={{ selectedRoot, setSelectedRoot }}>
      {children}
    </SelectedRootContext.Provider>
  );
};

export const useSelectedRoot = () => {
  const context = useContext(SelectedRootContext);
  if (!context) {
    throw new Error(
      "useSelectedRoot must be used within a SelectedRootProvider",
    );
  }
  return context;
};
