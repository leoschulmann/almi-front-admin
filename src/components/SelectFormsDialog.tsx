import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
import { Tense } from "@/model/VerbParameters.ts";

export const COLUMNS: { tense: Tense; title: string }[] = [
  { tense: "INFINITIVE", title: "Infinitive" },
  { tense: "PRESENT", title: "Present" },
  { tense: "PAST", title: "Past" },
  { tense: "FUTURE", title: "Future" },
  { tense: "IMPERATIVE", title: "Imperative" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  confirmLabel: string;
  forms: VerbForm[];
  onConfirm: (selected: VerbForm[]) => void;
  // forms checked when the dialog opens; all of them by default
  isInitiallyChecked?: (form: VerbForm) => boolean;
}

export function SelectFormsDialog({
  open,
  onOpenChange,
  title,
  confirmLabel,
  forms,
  onConfirm,
  isInitiallyChecked = () => true,
}: Props) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  // all forms are checked every time the dialog opens
  useEffect(() => {
    if (open) {
      setChecked(new Set(forms.filter(isInitiallyChecked).map((f) => f.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, forms]);

  function checkAll() {
    setChecked(new Set(forms.map((f) => f.id)));
  }

  function uncheckAll() {
    setChecked(new Set());
  }

  function invert() {
    setChecked(
      new Set(forms.filter((f) => !checked.has(f.id)).map((f) => f.id)),
    );
  }

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-4">
          {COLUMNS.map(({ tense, title }) => (
            <div key={tense}>
              <div className="mb-2 text-sm italic text-[#FF006E]">{title}</div>
              <ul className="flex flex-col gap-1">
                {forms
                  .filter((f) => f.tense === tense)
                  .map((f) => (
                    <li key={f.id}>
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked.has(f.id)}
                          onChange={() => toggle(f.id)}
                        />
                        <span dir="rtl" className="text-lg">
                          {f.value}
                        </span>
                      </label>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
        <DialogFooter>
          <div className="mr-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={checkAll}>
              Check all
            </Button>
            <Button variant="outline" size="sm" onClick={uncheckAll}>
              Uncheck all
            </Button>
            <Button variant="outline" size="sm" onClick={invert}>
              Invert
            </Button>
          </div>
          <Button
            disabled={checked.size === 0}
            onClick={() => {
              onConfirm(forms.filter((f) => checked.has(f.id)));
              onOpenChange(false);
            }}
          >
            {confirmLabel} ({checked.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
