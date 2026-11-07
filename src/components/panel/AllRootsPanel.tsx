import { HTTPError } from "ky";
import { Search } from "lucide-react";
import { Root, RootPage } from "@/model/Root.ts";
import { deleteData, getDataScalar, getDataVector } from "@/util/ApiClient.ts";
import { VerbShortDto } from "@/model/Verb.ts";
import { dashedRoot } from "@/util/HebrewUtil.ts";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input.tsx";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import {
  byLang,
  renderMessageCentered,
  renderSkeleton,
} from "@/util/Common.tsx";
import { HoverableListItem } from "@/components/HoverableListItem.tsx";
import { CreateRootDialog } from "@/components/CreateRootDialog.tsx";
import { EditRootDialog } from "@/components/EditRootDialog.tsx";

export function AllRootsPanel() {
  const [roots, setRoots] = useState<Root[]>([]);
  const [visibleRoots, setVisibleRoots] = useState<Root[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldReload, setShouldReload] = useState(0);
  const { selectedRoot, setSelectedRoot, rootsRevision } = useSelectedRoot();
  const { lang } = useSelectedLang();
  const [editedRoot, setEditedRoot] = useState<Root | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data: RootPage = await getDataScalar("root", RootPage, {
          searchParams: { page: 0, size: 1000 },
        });
        if (isMounted) {
          // the server returns roots in alphabetical order
          setRoots(data.content);
          setVisibleRoots(data.content);
        }
      } catch (e: unknown) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : String(e));
          console.log(e);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [shouldReload, rootsRevision]);
  // only an empty root can be edited: the server refuses (409) otherwise
  async function handleEditRoot(root: Root) {
    try {
      // GET /api/verb/root/{id}
      const verbs = await getDataVector(`verb/root/${root.id}`, VerbShortDto);
      if (verbs.length > 0) {
        alert(
          byLang(
            lang.code,
            `Root ${dashedRoot(root.name)} has verbs, so it cannot be edited. Delete them first.`,
            `В корне ${dashedRoot(root.name)} есть глаголы, поэтому его нельзя редактировать. Сначала удалите их.`,
          ),
        );
        return;
      }
      setEditedRoot(root);
      setIsEditDialogOpen(true);
    } catch (e) {
      console.error("Failed to check the root:", e);
      alert(
        byLang(
          lang.code,
          "Failed to check the root.",
          "Не удалось проверить корень.",
        ),
      );
    }
  }

  // only an empty root can be deleted: the server refuses (409) otherwise
  async function handleDeleteRoot(root: Root) {
    const notEmpty = byLang(
      lang.code,
      `Root ${dashedRoot(root.name)} still has verbs. Delete them first.`,
      `В корне ${dashedRoot(root.name)} ещё есть глаголы. Сначала удалите их.`,
    );
    try {
      // GET /api/verb/root/{id}
      const verbs = await getDataVector(`verb/root/${root.id}`, VerbShortDto);
      if (verbs.length > 0) {
        alert(notEmpty);
        return;
      }
      // DELETE /api/root/{id}
      await deleteData(`root/${root.id}`);
      setRoots((prev) => prev.filter((r) => r.id !== root.id));
      setVisibleRoots((prev) => prev.filter((r) => r.id !== root.id));
      if (selectedRoot?.id === root.id) setSelectedRoot(null);
    } catch (e) {
      console.error("Failed to delete root:", e);
      alert(
        e instanceof HTTPError && e.response.status === 409
          ? notEmpty
          : byLang(
              lang.code,
              "Failed to delete the root.",
              "Не удалось удалить корень.",
            ),
      );
    }
  }

  // const { isOpen, openRootDialog, params, setIsOpen, setParams } =
  //   useRootDialog();

  return (
    <div className="h-screen w-48 flex flex-col">
      <div className="p-3 flex-shrink-0 flex items-center justify-between">
        <div className="group relative mr-3 min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2 group-focus-within:hidden top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            aria-label={byLang(lang.code, "Search", "Поиск")}
            className="h-9 w-full rounded bg-gray-100 border border-gray-300 pl-8 focus:pl-3"
            onChange={(e) => {
              const query = e.target.value.toLowerCase().replace(/-/g, "");
              if (!query) {
                setVisibleRoots(roots);
                return;
              }
              setVisibleRoots(
                roots?.filter((root) =>
                  root.name.toLowerCase().includes(query),
                ) ?? null,
              );
            }}
          />
        </div>
        <CreateRootDialog
          onSuccess={() => setShouldReload((prev) => prev + 1)}
        />
      </div>

      {loading ? (
        <ScrollArea className="flex-grow border-r p-3 overflow-y-auto  ">
          {renderSkeleton(15)}
        </ScrollArea>
      ) : error ? (
        <div className="flex-grow border-r p-3 text-red-500">{error}</div>
      ) : visibleRoots.length === 0 ? (
        <div className="flex flex-col flex-grow border-r p-3">
          {renderMessageCentered(
            roots.length === 0
              ? byLang(lang.code, "No roots yet", "Корней пока нет")
              : byLang(lang.code, "Nothing found", "Ничего не найдено"),
          )}
        </div>
      ) : (
        <ScrollArea className="flex-grow border-r p-3 overflow-y-auto  ">
          <ul>
            {visibleRoots.map((root, idx) => (
              <HoverableListItem
                key={root.id}
                clickCallback={() => setSelectedRoot(root)}
                editCallback={() => void handleEditRoot(root)}
                deleteCallback={() => void handleDeleteRoot(root)}
                displayName={dashedRoot(root.name)}
                toolTipDisplay={dashedRoot(root.name)}
                isSelected={selectedRoot?.id === root.id}
                showSeparator={idx < visibleRoots.length - 1}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
      <EditRootDialog
        open={isEditDialogOpen}
        root={editedRoot!}
        onOpenChange={setIsEditDialogOpen}
        postSubmitCallback={() => {
          setShouldReload((prev) => prev + 1);
        }}
      ></EditRootDialog>
    </div>
  );
}
