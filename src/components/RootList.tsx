import { Root } from "@/model/Root.ts";
import { getDataScalar } from "@/util/ApiClient.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { RootPage } from "@/model/RootPage.ts";

export function RootList() {
  const [roots, setRoots] = useState<Root[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: RootPage = await getDataScalar("root", RootPage, {
          searchParams: { page: 0, limit: 1000 },
        });
        setRoots(data.content);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e));
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <ScrollArea className="h-72 w-48 rounded-md border p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium leading-none">Roots</h4>

      </div>

      {loading && (
        <div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {error && <div className="text-red-500">{error}</div>}

      {!loading && !error && roots && (
        <div>
          {roots.map((root) => {
            return (
              <div key={root.id}>
                <div className="text-sm">{root.name}</div>
                <Separator className="my-2" />
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
}
