import { RootList } from "@/components/RootList.tsx";
import { SelectedRootProvider } from "@/ctx/SelectedRootCtx.tsx";
import { RootContent } from "@/components/RootContent.tsx";
import { DictionaryContextProvider } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import { VerbFormPanel } from "@/components/VerbFormPanel.tsx";
import { SelectedVerbProvider } from "@/ctx/SelectedVerbCtx.tsx";

function App() {
  return (
    <DictionaryContextProvider>
      <SelectedRootProvider>
        <div className="flex flex-row items-start justify-items-start min-h-svh">
          <RootList />
          <SelectedVerbProvider>
            <RootContent />
            <VerbFormPanel />
          </SelectedVerbProvider>
        </div>
      </SelectedRootProvider>
    </DictionaryContextProvider>
  );
}

export default App;
