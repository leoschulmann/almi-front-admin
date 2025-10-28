import { createContext, ReactNode, useContext, useState } from "react";
import { VerbShortDto } from "@/model/Verb.ts";

interface SelectedVerbValue {
  verb: VerbShortDto | null;
  setVerb: (verb: VerbShortDto | null) => void;
}

const SelectedVerbCtx = createContext<SelectedVerbValue | null>(null);

export function SelectedVerbProvider({ children }: { children: ReactNode }) {
  const [verb, setVerb] = useState<VerbShortDto | null>(null);

  return (
    <SelectedVerbCtx.Provider value={{ verb, setVerb }}>
      {children}
    </SelectedVerbCtx.Provider>
  );
}

export const useSelectedVerb = () => {
  const context = useContext(SelectedVerbCtx);
  if (!context) {
    throw new Error(
      "useSelectedVerb must be used within a SelectedVerbProvider",
    );
  }
  return context;
};
