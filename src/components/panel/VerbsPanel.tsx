import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { getDataVector } from "@/util/ApiClient.ts";
import { VerbShortDto } from "@/model/VerbShortDto.ts";
import { useEffect, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Separator } from "@/components/ui/separator.tsx";
import { CreateVerbDialogButton } from "@/components/CreateVerbDialogButton.tsx";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { renderMessageCentered, renderSkeleton } from "@/util/Common.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { VerbTranslation } from "@/model/VerbTranslation.ts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";

function VerbsPanel() {
  const { selectedRoot } = useSelectedRoot();
  const [dtos, setDtos] = useState<VerbShortDto[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { setVerb, verb } = useSelectedVerb();
  const { lang } = useSelectedLang();

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
  }, [selectedRoot, verb]);

  const renderVerbList = () => (
    <ul>
      {dtos.map((dto: VerbShortDto, index) => {
        const translations = dto.translations
          .filter((t) => t.lang === lang.code)
          .map((t) => t.value);
        const firstTranslation = translations?.[0];
        const allTranslations = translations?.join("; ") ?? "";
        const isSelected = verb?.id === dto.id;

        return (
          <li
            key={dto.id}
            onClick={() => setVerb(dto)}
            className="cursor-pointer"
          >
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`text-sm text-center truncate hover:bg-gray-100
                      ${isSelected ? "font-bold bg-gray-100" : ""}`}
                  >
                    {dto.value} {firstTranslation && `(${firstTranslation})`}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{allTranslations}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {index < dtos.length - 1 && <Separator className="my-2" />}
          </li>
        );
      })}
    </ul>
  );

  function onSuccess(
    id: number,
    value: string,
    version: number,
    translations: VerbTranslation[],
  ) {
    setDtos((prev) => [
      ...prev,
      new VerbShortDto(id, value, version, translations),
    ]);
  }

  return (
    <div className="h-screen w-48 flex flex-col ">
      <div className="flex-shrink-0 flex items-center justify-between p-3">
        <CreateVerbDialogButton
          enabled={!!selectedRoot}
          onSuccess={onSuccess}
        />
      </div>
      <ScrollArea className="flex-grow p-3 overflow-y-auto border-r">
        {!selectedRoot
          ? renderMessageCentered("Select a root")
          : isLoading
            ? renderSkeleton(15)
            : dtos.length > 0
              ? renderVerbList()
              : renderMessageCentered(
                  `Nothing found for '${selectedRoot?.name}' 😕`,
                )}
      </ScrollArea>
    </div>
  );
}

export { VerbsPanel };
