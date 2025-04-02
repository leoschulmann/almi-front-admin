import { RootList } from "@/components/RootList.tsx";
import { SelectedRootProvider } from "@/ctx/SelectedRootCtx.tsx";
import { RootContent } from "@/components/RootContent.tsx";

function App() {
  return (
    <SelectedRootProvider>
      <div className="flex flex-row items-start justify-items-start min-h-svh">
        <RootList />
        <RootContent />
      </div>
    </SelectedRootProvider>
  );
}

export default App;
