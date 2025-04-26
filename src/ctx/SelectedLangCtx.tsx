import { Lang } from "@/model/Lang.ts";
import { createContext, ReactNode, useContext, useState } from "react";

interface SelectedLangCtx {
  lang: Lang | undefined;
  setLang: (lang: Lang | undefined) => void;
}

const SelectedLangCtx = createContext<SelectedLangCtx | undefined>(undefined);

export function SelectedLangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang | undefined>(undefined);

  return (
    <SelectedLangCtx.Provider value={{ lang, setLang }}>
      {children}
    </SelectedLangCtx.Provider>
  );
}

export const useSelectedLang = () => {
  const context = useContext(SelectedLangCtx);
  if (!context) {
    throw new Error(
      "useSelectedLang must be used within a SelectedLangProvider",
    );
  }
  return context;
};
