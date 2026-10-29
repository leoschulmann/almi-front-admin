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
import { Tense } from "@/model/VerbParameters.ts";
import { CreateVFormExampleDto, VFormExample } from "@/model/VFormExample.ts";
import { CreateVerbTranslation } from "@/model/VerbTranslation.ts";
import { postData } from "@/util/ApiClient.ts";
import {
  aiExamples,
  AiExamplesResponse,
  AiExampleSentence,
} from "@/util/AiClient.ts";
import { AI_LANGS, loadAiVerbContext } from "@/util/AiVerbContext.ts";
import { COLUMNS } from "@/components/SelectFormsDialog.tsx";

interface Props {
  verbId: number;
  forms: VerbForm[];
  onClose: () => void;
  onCreated: (examples: VFormExample[]) => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; response: AiExamplesResponse };

// one generated sentence with a stable key: form id + position in the form's list
interface Row {
  key: string;
  form: VerbForm;
  sentence: AiExampleSentence;
}

export function GenerateExamplesResultDialog({
  verbId,
  forms,
  onClose,
  onCreated,
}: Props) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [rows, setRows] = useState<Row[]>([]);
  const [failedForms, setFailedForms] = useState<
    { form: VerbForm; error: string }[]
  >([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    async function run() {
      try {
        const context = await loadAiVerbContext(verbId);
        const response = await aiExamples({
          ...context,
          forms: forms.map((f) => ({
            tense: f.tense,
            person: f.person,
            plurality: f.plurality,
            gender: f.gender,
            form: f.value,
          })),
          languages: AI_LANGS,
          perForm: 1,
        });
        if (cancelled) return;

        const newRows: Row[] = [];
        const failed: { form: VerbForm; error: string }[] = [];
        for (const r of response.results) {
          const form = forms[r.index];
          if (r.error || !r.examples?.length) {
            failed.push({ form, error: r.error ?? "no examples" });
            continue;
          }
          r.examples.forEach((sentence, i) =>
            newRows.push({ key: `${form.id}-${i}`, form, sentence }),
          );
        }
        setRows(newRows);
        setFailedForms(failed);
        setChecked(new Set(newRows.map((r) => r.key)));
        setState({ status: "done", response });
      } catch (error) {
        console.error("Examples generation failed:", error);
        if (!cancelled) {
          setState({
            status: "error",
            message: "Generation failed. Is almi-ai running?",
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [verbId, forms, attempt]);

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  // each checked sentence becomes a new example of its form (several per form are allowed)
  async function save() {
    setSaving(true);
    setSaveError(null);
    const created: VFormExample[] = [];
    try {
      for (const row of rows.filter((r) => checked.has(r.key))) {
        const dto = new CreateVFormExampleDto(
          row.form.id,
          row.sentence.sentence,
          null,
          Object.entries(row.sentence.translations).map(
            ([lang, value]) => new CreateVerbTranslation(value, lang),
          ),
        );
        created.push(await postData("vform/example", dto, VFormExample));
        // saved rows leave the list so a retry does not duplicate them
        setRows((prev) => prev.filter((r) => r.key !== row.key));
        setChecked((prev) => {
          const next = new Set(prev);
          next.delete(row.key);
          return next;
        });
      }
      onCreated(created);
      onClose();
    } catch (error) {
      console.error("Failed to save the examples:", error);
      if (created.length > 0) onCreated(created);
      setSaveError(
        `Saved ${created.length}, then failed. The rest are still in the list.`,
      );
    } finally {
      setSaving(false);
    }
  }

  function renderRows(tense: Tense, title: string) {
    const tenseRows = rows.filter((r) => r.form.tense === tense);
    if (tenseRows.length === 0) return null;
    return (
      <div key={tense}>
        <div className="mb-1 text-sm italic text-[#FF006E]">{title}</div>
        <ul className="flex flex-col gap-2">
          {tenseRows.map((row) => (
            <li
              key={row.key}
              className="grid grid-cols-[auto_9rem_1fr_1fr] items-start gap-3"
            >
              <input
                type="checkbox"
                className="mt-2"
                checked={checked.has(row.key)}
                onChange={() => toggle(row.key)}
              />
              <span dir="rtl" className="text-lg font-semibold">
                {row.form.value}
              </span>
              <span dir="rtl" className="text-lg">
                {row.sentence.sentence}
              </span>
              <div className="flex flex-col gap-1 text-sm">
                <span>{row.sentence.translations.EN}</span>
                <span>{row.sentence.translations.RU}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Generated examples</DialogTitle>
        </DialogHeader>

        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
            Generating examples for {forms.length} forms…
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
          <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-2">
            {COLUMNS.map(({ tense, title }) => renderRows(tense, title))}
            {failedForms.length > 0 && (
              <p className="flex items-center gap-2 text-sm text-neutral-500">
                <CircleAlert className="size-4 shrink-0" />
                Not generated:{" "}
                <span dir="rtl">
                  {failedForms.map((f) => f.form.value).join(", ")}
                </span>
              </p>
            )}
          </div>
        )}

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Close
          </Button>
          {state.status === "done" && (
            <Button disabled={checked.size === 0 || saving} onClick={save}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white" />
              ) : (
                `Save (${checked.size})`
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
