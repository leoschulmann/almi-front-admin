import { AllRootsPanel } from "@/components/panel/AllRootsPanel.tsx";
import { SelectedRootProvider } from "@/ctx/SelectedRootCtx.tsx";
import { VerbsPanel } from "@/components/panel/VerbsPanel.tsx";
import { DictionaryContextProvider } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import { SelectedVerbProvider } from "@/ctx/SelectedVerbCtx.tsx";
import { VerbFormsPanel } from "@/components/panel/VerbFormsPanel.tsx";
import { SelectedLangProvider } from "@/ctx/SelectedLangCtx.tsx";

function App() {
  return (
    <DictionaryContextProvider>
      <SelectedRootProvider>
        <div className="flex flex-row items-start justify-items-start min-h-svh">
          <SelectedLangProvider>
            <AllRootsPanel />
            <SelectedVerbProvider>
              <VerbsPanel />
              <VerbFormsPanel />
            </SelectedVerbProvider>
          </SelectedLangProvider>
        </div>
      </SelectedRootProvider>
    </DictionaryContextProvider>
  );
}

export default App;
