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
  const [value, setValue] = useState(["", "", "", ""]);

  useEffect(() => {
    setValue((root?.name ?? "").padEnd(4, " ").split("").slice(0, 4));
  }, [root]);

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
          <DialogTitle>Редактировать корень</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <InputRoot glyphs={value} setGlyphs={setValue} />
          <Button
            onClick={() => handleSubmit(root.id, value.join(""))}
            disabled={sending}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              "Сохранить"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
