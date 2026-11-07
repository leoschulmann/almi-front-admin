import {
  Dialog,
  DialogContent,
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
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { byLang } from "@/util/Common.tsx";

export function CreateRootDialog({ onSuccess }: { onSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rootValue, setRootValue] = useState("");
  const [sending, setSending] = useState(false);
  const { lang } = useSelectedLang();

  async function handleSubmit() {
    setSending(true);
    try {
      await postData("root", rootValue, Root);
      setIsOpen(false);
      setRootValue("");
      onSuccess();
    } catch (e) {
      console.error("Ошибка при создании корня:", e);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        // closing in any way (Esc, outside click) clears the input
        if (!open) setRootValue("");
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-9 w-fit shrink-0 pl-2 pr-4 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600">
          <Plus className="h-5 w-5" /> {byLang(lang.code, "root", "корень")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {byLang(lang.code, "Create root", "Создать корень")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center">
            <InputRoot value={rootValue} onChange={setRootValue} />
          </div>
          <Button
            onClick={() => void handleSubmit()}
            disabled={sending || rootValue.length === 0}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              byLang(lang.code, "Save", "Сохранить")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
