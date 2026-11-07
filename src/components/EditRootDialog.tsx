import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { EditRootDto, Root } from "@/model/Root.ts";
import { useEffect, useState } from "react";
import { putData } from "@/util/ApiClient.ts";
import { InputRoot } from "@/components/InputRoot.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { byLang } from "@/util/Common.tsx";

export const EditRootDialog = ({
  open,
  onOpenChange,
  postSubmitCallback,
  root,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  root: Root;
  postSubmitCallback: () => void;
}) => {
  const [sending, setSending] = useState(false);
  const { lang } = useSelectedLang();
  const [value, setValue] = useState("");

  // filled from the root when opened, cleared when closed
  useEffect(() => {
    setValue(open ? (root?.name ?? "") : "");
  }, [root, open]);

  async function handleSubmit(id: number, value: string) {
    setSending(true);
    try {
      const payload: EditRootDto = new EditRootDto(id, value);
      await putData("root", payload, Root);
      onOpenChange(false);
      postSubmitCallback();
    } catch (e) {
      console.error("Ошибка при обновлении корня:", e);
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {byLang(lang.code, "Edit root", "Редактировать корень")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex justify-center">
            <InputRoot value={value} onChange={setValue} />
          </div>
          <Button
            onClick={() => handleSubmit(root.id, value)}
            disabled={sending || value.length === 0}
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
};
