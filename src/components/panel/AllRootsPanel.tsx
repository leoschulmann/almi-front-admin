import { Root } from "@/model/Root.ts";
import { getDataScalar } from "@/util/ApiClient.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useEffect, useState } from "react";
import { RootPage } from "@/model/RootPage.ts";
import { Input } from "@/components/ui/input.tsx";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { CreateRootDialog } from "@/components/CreateRootDialog.tsx";
import { renderSkeleton } from "@/util/Common.tsx";

export function AllRootsPanel() {
  const [roots, setRoots] = useState<Root[]>([]);
  const [visibleRoots, setVisibleRoots] = useState<Root[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldReload, setShouldReload] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        const data: RootPage = await getDataScalar("root", RootPage, {
          searchParams: { page: 0, size: 1000 },
        });
        if (isMounted) {
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
  }, [shouldReload]);

  const { selectedRoot, setSelectedRoot } = useSelectedRoot();

  return (
    <div className="h-screen w-48 flex flex-col">
      <div className="p-3 flex-shrink-0 flex items-center justify-between">
        <Input
          placeholder="Search..."
          className="h-9 w-24 rounded bg-gray-100 border border-gray-300 mr-3"
          onChange={(e) => {
            const query = e.target.value.toLowerCase();
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
        <CreateRootDialog
          onSuccess={() => setShouldReload((prev) => prev + 1)}
        />
      </div>

      <ScrollArea className="flex-grow border-r p-3 overflow-y-auto  ">
        {loading && renderSkeleton(15)}

        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && visibleRoots && (
          <ul>
            {visibleRoots.map((root) => (
              <li
                key={root.id}
                onClick={() => setSelectedRoot(root)}
                className="cursor-pointer"
              >
                <div
                  className={`text-sm text-center hover:bg-gray-100 
                  ${selectedRoot?.id === root.id ? "font-bold bg-gray-100" : ""}`}
                >
                  {root.name}
                </div>
                <Separator className="my-2" />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
