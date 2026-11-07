import { createContext, ReactNode, useContext, useState } from "react";
import { Root } from "@/model/Root";

interface SelectedRootContextValue {
  selectedRoot: Root | null;
  setSelectedRoot: (root: Root | null) => void;
  // bumped when a root was created outside the roots panel; the panel reloads its list on change
  rootsRevision: number;
  notifyRootsChanged: () => void;
}

const SelectedRootContext = createContext<SelectedRootContextValue | undefined>(
  undefined,
);

export function SelectedRootProvider({ children }: { children: ReactNode }) {
  const [selectedRoot, setSelectedRoot] = useState<Root | null>(null);
  const [rootsRevision, setRootsRevision] = useState(0);

  return (
    <SelectedRootContext.Provider
      value={{
        selectedRoot,
        setSelectedRoot,
        rootsRevision,
        notifyRootsChanged: () => setRootsRevision((r) => r + 1),
      }}
    >
      {children}
    </SelectedRootContext.Provider>
  );
}

export const useSelectedRoot = () => {
  const context = useContext(SelectedRootContext);
  if (!context) {
    throw new Error(
      "useSelectedRoot must be used within a SelectedRootProvider",
    );
  }
  return context;
};
