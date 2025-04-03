import { Root } from "@/model/Root.ts";
import { getDataScalar, postData } from "@/util/ApiClient.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { useEffect, useState } from "react";
import { RootPage } from "@/model/RootPage.ts";
import { Input } from "@/components/ui/input.tsx";
import { Plus } from "lucide-react";
import { useSelectedRoot } from "@/ctx/SelectedRootCtx.tsx";
import { renderSkeleton } from "@/utils.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button.tsx";

export function RootList() {
  const [roots, setRoots] = useState<Root[]>([]);
  const [visibleRoots, setVisibleRoots] = useState<Root[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newRootDialogOpen, setNewRootDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input1, setInput1] = useState("");
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

  const { setSelectedRoot } = useSelectedRoot();

  return (
    <div className="h-screen w-48 flex flex-col">
      <div className="p-3 flex-shrink-0 flex items-center justify-between">
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
        <Dialog open={newRootDialogOpen} onOpenChange={setNewRootDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 w-fit pl-2 pr-4 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600">
              <Plus className="h-5 w-5" /> root
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Root</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={input1}
                onChange={(e) => setInput1(e.target.value)}
                placeholder="Input 1"
                className="border rounded p-2"
              />
            </div>
            <DialogFooter>
              <DialogClose>
                <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                  Cancel
                </button>
              </DialogClose>
              <button
                className="w-1/4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center"
                disabled={sending}
                onClick={async () => {
                  setSending(true);
                  try {
                    await postData("root", input1, Root);
                  } finally {
                    setSending(false);
                    setNewRootDialogOpen(false);
                    setInput1("");
                    setShouldReload((prev) => prev + 1);
                  }
                }}
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  "Submit"
                )}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
