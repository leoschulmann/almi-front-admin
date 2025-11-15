import { createContext, ReactNode, useContext, useState } from "react";
import { VerbShortDto } from "@/model/Verb.ts";
import { VerbForm } from "@/model/VerbForm.ts";

interface SelectedVerbValue {
  verb: VerbShortDto | null;
  setVerb: (verb: VerbShortDto | null) => void;
  verbForms: VerbForm[];
  setVerbForms: (
    value: VerbForm[] | ((prevState: VerbForm[]) => VerbForm[]),
  ) => void;
}

const SelectedVerbCtx = createContext<SelectedVerbValue | null>(null);

export function SelectedVerbProvider({ children }: { children: ReactNode }) {
  const [verb, setVerb] = useState<VerbShortDto | null>(null);
  const [verbForms, setVerbForms]: [
    VerbForm[],
    (value: VerbForm[] | ((prevState: VerbForm[]) => VerbForm[])) => void,
  ] = useState<VerbForm[]>([]);
  return (
    <SelectedVerbCtx.Provider
      value={{ verb, setVerb, verbForms, setVerbForms }}
    >
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
