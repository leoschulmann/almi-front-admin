import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
import { postData } from "@/util/ApiClient.ts";
import { Root } from "@/model/Root.ts";
import { useState } from "react";
import { InputRoot } from "@/components/InputRoot.tsx";

export function CreateRootDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rootGlyphs, setRootGlyphs] = useState(["", "", "", ""]);
  const [sending, setSending] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 w-fit pl-2 pr-4 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600">
          <Plus className="h-5 w-5" /> root
        </Button>
      </DialogTrigger>
      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>Create Root</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <InputRoot glyphs={rootGlyphs} setGlyphs={setRootGlyphs} />
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
                await postData("root", rootGlyphs.join(""), Root);
              } finally {
                setSending(false);
                setIsOpen(false);
                setRootGlyphs(["", "", "", ""]);
                onSuccess();
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
  );
}
