import { useEffect, useState } from "react";
import { CircleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
import {
  aiTransliterate,
  AiTransliterateResponse,
  AiTransliterationItem,
} from "@/util/AiClient.ts";
import { COLUMNS } from "@/components/SelectFormsDialog.tsx";

interface Props {
  forms: VerbForm[];
  onClose: () => void;
  // form id -> transliteration by lang code chosen by the admin
  onApply: (translits: Map<number, Record<string, string>>) => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; response: AiTransliterateResponse };

export function TransliterationResultDialog({
  forms,
  onClose,
  onApply,
}: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    async function run() {
      try {
        const response = await aiTransliterate(forms.map((f) => f.value));
        if (cancelled) return;
        setState({ status: "done", response });
        // every successful transliteration is checked by default
        setChecked(
          new Set(
            response.results.filter(isUsable).map((r) => forms[r.index].id),
          ),
        );
      } catch (error) {
        console.error("Transliteration failed:", error);
        if (!cancelled) {
          setState({
            status: "error",
            message: "Transliteration failed. Is almi-ai running?",
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [forms, attempt]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function apply() {
    if (state.status !== "done") return;
    const applied = new Map<number, Record<string, string>>();
    for (const r of state.response.results) {
      const id = forms[r.index].id;
      if (isUsable(r) && checked.has(id)) {
        applied.set(id, { EN: r.en!, RU: r.ru! });
      }
    }
    onApply(applied);
    onClose();
  }

  function renderResult(r: AiTransliterationItem) {
    const form = forms[r.index];
    return (
      <li
        key={form.id}
        title={r.error ?? ""}
        className="flex items-start gap-2"
      >
        <input
          type="checkbox"
          className="mt-2"
          checked={checked.has(form.id)}
          disabled={!isUsable(r)}
          onChange={() => toggle(form.id)}
        />
        <div className="flex flex-col">
          <span dir="rtl" className="text-lg">
            {form.value}
          </span>
          {isUsable(r) ? (
            <>
              <span className="text-sm">{r.en}</span>
              <span className="text-sm">{r.ru}</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-xs text-neutral-500">
              <CircleAlert className="size-4 shrink-0" />
              not generated
            </span>
          )}
        </div>
      </li>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Transliteration result</DialogTitle>
        </DialogHeader>

        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
            Transliterating {forms.length} forms…
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-red-600">{state.message}</p>
            <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
              Retry
            </Button>
          </div>
        )}

        {state.status === "done" && (
          <div className="grid grid-cols-5 gap-4">
            {COLUMNS.map(({ tense, title }) => (
              <div key={tense}>
                <div className="mb-2 text-sm italic text-[#FF006E]">
                  {title}
                </div>
                <ul className="flex flex-col gap-2">
                  {state.response.results
                    .filter((r) => forms[r.index].tense === tense)
                    .map(renderResult)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {state.status === "done" && (
            <Button disabled={checked.size === 0} onClick={apply}>
              Apply ({checked.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function isUsable(r: AiTransliterationItem): boolean {
  return !r.error && !!r.en && !!r.ru;
}
