import { Root } from "@/model/Root.ts";
import { getDataScalar } from "@/util/ApiClient.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useEffect, useState } from "react";
import { RootPage } from "@/model/RootPage.ts";
import { Input } from "@/components/ui/input.tsx";
import { Plus } from "lucide-react";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { renderSkeleton } from "@/utils.tsx";

export function RootList() {
  const [roots, setRoots] = useState<Root[]>([]);
  const [visibleRoots, setVisibleRoots] = useState<Root[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, []);

  const { setSelectedRoot } = useSelectedRoot();

  return (
    <div className="h-screen w-48 flex flex-col">
      <div className="pt-3 pl-3 flex-shrink-0 flex items-center justify-between">
        <Input
          placeholder="Search..."
          className="h-9 w-full rounded bg-gray-100 border border-gray-300 mr-3"
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
        <button className="h-9 w-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600">
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <ScrollArea className="flex-grow border-r  p-4 overflow-y-auto ml-3 mt-3">
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
                <div className="text-sm text-center">{root.name}</div>
                <Separator className="my-2" />
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
