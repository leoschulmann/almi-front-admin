import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { deleteData, getDataVector } from "@/util/ApiClient.ts";
import { useEffect, useState } from "react";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import CreateVerbDialogButton, {
  VerbDialog,
} from "@/components/CreateVerbDialogButton.tsx";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { renderMessageCentered, renderSkeleton } from "@/util/Common.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { VerbTranslation } from "@/model/VerbTranslation.ts";
import { HoverableListItem } from "@/components/HoverableListItem.tsx";
import { VerbShortDto } from "@/model/Verb.ts";
import { Stamp } from "lucide-react";
import { StampVerbDialog } from "@/components/StampVerbDialog.tsx";

function VerbsPanel() {
  const { selectedRoot } = useSelectedRoot();
  const [dtos, setDtos] = useState<VerbShortDto[]>([]);
  const [isLoading, setLoading] = useState(false);
  const { setVerb, verb } = useSelectedVerb();
  const { lang } = useSelectedLang();
  const [stampVerbId, setStampVerbId] = useState<number | null>(null);
  const [isStampDialogOpen, setStampDialogOpen] = useState(false);
  const [editVerbId, setEditVerbId] = useState<number | null>(null);

  const fetchVerbs = async (rootId: number): Promise<void> => {
    setLoading(true);
    try {
      const verbs = await getDataVector(`verb/root/${rootId}`, VerbShortDto);
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
      setVerb(null);
    }
  }, [selectedRoot, setVerb]);

  async function handleDeleteVerb(id: number) {
    try {
      // DELETE /api/verb/{id}
      await deleteData(`verb/${id}`);
      setDtos((prev) => prev.filter((d) => d.id !== id));
      if (verb?.id === id) {
        setVerb(null);
      }
    } catch (error) {
      console.error("Failed to delete verb:", error);
      alert("Failed to delete the verb. Please try again.");
    }
  }

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
          <HoverableListItem
            key={dto.id}
            clickCallback={() => setVerb(dto)}
            editCallback={() => setEditVerbId(dto.id)}
            deleteCallback={() => handleDeleteVerb(dto.id)}
            thirdAction={{
              icon: Stamp,
              callback: () => {
                setStampVerbId(dto.id);
                setStampDialogOpen(true);
              },
              toolTipDisplay:
                lang.code == "RU" ? "Проштамповать" : "Stamp verb",
            }}
            displayName={`${dto.value}${firstTranslation ? ` (${firstTranslation})` : ""}`}
            toolTipDisplay={allTranslations}
            isSelected={isSelected}
            showSeparator={index < dtos.length - 1}
          />
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
      <div className="flex-shrink-0 flex flex-col items-center justify-between p-3">
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
      <VerbDialog
        open={editVerbId !== null}
        onOpenChange={(o) => !o && setEditVerbId(null)}
        editVerbId={editVerbId}
        onUpdated={(updated) =>
          setDtos((prev) =>
            prev.map((d) =>
              d.id === updated.id
                ? new VerbShortDto(
                    updated.id,
                    updated.value,
                    updated.version,
                    updated.translations,
                  )
                : d,
            ),
          )
        }
      />
      <StampVerbDialog
        open={isStampDialogOpen}
        onOpenChange={setStampDialogOpen}
        modelVerbId={stampVerbId}
        onSuccess={onSuccess}
      />
    </div>
  );
}

export { VerbsPanel };
