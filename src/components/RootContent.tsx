import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { getDataVector } from "@/util/ApiClient.ts";
import { VerbShortDto } from "@/model/VerbShortDto.ts";
import { useEffect, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Separator } from "@/components/ui/separator.tsx";
import { renderSkeleton } from "@/utils.tsx";
import { CreateVerbDialogButton } from "@/components/CreateVerbDialogButton.tsx";

function RootContent() {
  const { selectedRoot } = useSelectedRoot();
  const [dtos, setDtos] = useState<VerbShortDto[]>([]);
  const [isLoading, setLoading] = useState(false);

  const fetchVerbs = async (rootId: number): Promise<void> => {
    setLoading(true);
    try {
      const verbs = await getDataVector("verb", VerbShortDto, {
        searchParams: { rootId },
      });
      setDtos(verbs);
    } catch (error) {
      console.error("Error loading data:", error);
      setDtos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoot) {
      void fetchVerbs(selectedRoot.id);
    }
  }, [selectedRoot]);

  const renderMessage = (message: string) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm text-center">
      <p>{message}</p>
    </div>
  );

  const renderVerbList = () => (
    <ul>
      {dtos.map(({ id, value }: VerbShortDto) => (
        <li key={id}>
          <div className="text-sm text-center">{value}</div>
          <Separator className="my-2" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="h-screen w-48 flex flex-col ">
      <div className="flex-shrink-0 flex items-center justify-between p-3">
        <CreateVerbDialogButton
          enabled={!!selectedRoot}
          onSuccess={(id: number, value: string, version: number) => {
            setDtos((prev) => [...prev, { id, value, version }]);
          }}
        />
      </div>
      <ScrollArea className="flex-grow p-3 overflow-y-auto border-r">
        {!selectedRoot
          ? renderMessage("Select a root")
          : isLoading
            ? renderSkeleton(15)
            : dtos.length > 0
              ? renderVerbList()
              : renderMessage(`Nothing found for '${selectedRoot?.name}' 😕`)}
      </ScrollArea>
    </div>
  );
}

export { RootContent };
