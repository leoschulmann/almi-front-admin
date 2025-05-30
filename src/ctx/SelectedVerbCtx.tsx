import { VerbShortDto } from "@/model/VerbShortDto.ts";
import { createContext, ReactNode, useContext, useState } from "react";

interface SelectedVerbValue {
  verb: VerbShortDto;
  setVerb: (verb: VerbShortDto) => void;
}

const SelectedVerbCtx = createContext<SelectedVerbValue | null>(null);

export function SelectedVerbProvider({ children }: { children: ReactNode }) {
  const [verb, setVerb] = useState<VerbShortDto>(new VerbShortDto());

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
