import { useEffect, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Verb } from "@/model/Verb.ts";
import { VerbForm } from "@/model/VerbForm.ts";
import { Tense } from "@/model/VerbParameters.ts";
import { getDataScalar } from "@/util/ApiClient.ts";
import {
  AiFormResult,
  aiValidateForms,
  AiValidateFormsResponse,
} from "@/util/AiClient.ts";

const COLUMNS: { tense: Tense; title: string }[] = [
  { tense: "INFINITIVE", title: "Infinitive" },
  { tense: "PRESENT", title: "Present" },
  { tense: "PAST", title: "Past" },
  { tense: "FUTURE", title: "Future" },
  { tense: "IMPERATIVE", title: "Imperative" },
];

const USAGE_LABEL = {
  COMMON: "",
  RARE: "rare",
  UNUSED: "unused",
  SEMANTICALLY_ODD: "odd",
} as const;

interface Props {
  verbId: number;
  forms: VerbForm[];
  onClose: () => void;
  // form id -> corrected value chosen by the admin
  onApply: (corrections: Map<number, string>) => void;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; response: AiValidateFormsResponse };

export function ValidateFormsResultDialog({
  verbId,
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
        // the selected verb in the list is a short dto: root, binyan and gizrot come from the full one
        const verb = await getDataScalar(`verb/${verbId}`, Verb);
        const response = await aiValidateForms({
          root: verb.root.name,
          binyan: verb.binyan.value,
          gizrot: verb.gizrahs.map((g) => g.value),
          forms: forms.map((f) => ({
            tense: f.tense,
            person: f.person,
            plurality: f.plurality,
            gender: f.gender,
            form: f.value,
          })),
        });
        if (cancelled) return;
        setState({ status: "done", response });
        // proposed corrections are checked by default
        setChecked(
          new Set(
            response.results
              .filter((r) => hasCorrection(r))
              .map((r) => forms[r.index].id),
          ),
        );
      } catch (error) {
        console.error("Form validation failed:", error);
        if (!cancelled) {
          setState({
            status: "error",
            message: "Validation failed. Is almi-ai running?",
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [verbId, forms, attempt]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function apply() {
    if (state.status !== "done") return;
    const corrections = new Map<number, string>();
    for (const r of state.response.results) {
      const id = forms[r.index].id;
      if (hasCorrection(r) && checked.has(id)) {
        corrections.set(id, r.correction!);
      }
    }
    onApply(corrections);
    onClose();
  }

  function renderSummary(results: AiFormResult[]) {
    const ok = results.filter((r) => r.valid && r.usage === "COMMON").length;
    const flagged = results.filter(
      (r) => r.valid && r.usage !== "COMMON",
    ).length;
    const wrong = results.filter((r) => r.valid === false).length;
    const failed = results.filter((r) => r.valid === null).length;
    return `${ok} ok, ${flagged} with remarks, ${wrong} wrong, ${failed} not checked`;
  }

  function renderResult(r: AiFormResult) {
    const form = forms[r.index];
    const tip = [r.usage && USAGE_LABEL[r.usage], r.note, r.error]
      .filter(Boolean)
      .join(" — ");

    let icon;
    if (r.valid === null) {
      icon = <CircleAlert className="size-4 shrink-0 text-neutral-400" />;
    } else if (!r.valid) {
      icon = <X className="size-4 shrink-0 text-red-600" />;
    } else if (r.usage !== "COMMON") {
      icon = <Check className="size-4 shrink-0 text-amber-500" />;
    } else {
      icon = <Check className="size-4 shrink-0 text-green-600" />;
    }

    return (
      <li key={form.id} title={tip} className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-2"
          checked={checked.has(form.id)}
          disabled={!hasCorrection(r)}
          onChange={() => toggle(form.id)}
        />
        <div className="flex flex-col">
          <span className="flex items-center gap-1">
            {icon}
            <span
              dir="rtl"
              className={`text-lg ${r.valid === false ? "text-red-600" : ""}`}
            >
              {form.value}
            </span>
          </span>
          {r.valid === false && r.correction && (
            <span dir="rtl" className="text-lg text-green-700">
              {r.correction}
            </span>
          )}
          {r.valid && r.usage !== "COMMON" && r.usage && (
            <span className="text-xs text-amber-600">
              {USAGE_LABEL[r.usage]}
            </span>
          )}
          {r.valid === null && (
            <span className="text-xs text-neutral-500">not checked</span>
          )}
        </div>
      </li>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Validation result</DialogTitle>
          {state.status === "done" && (
            <p className="text-sm text-neutral-500">
              {renderSummary(state.response.results)}
            </p>
          )}
        </DialogHeader>

        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-3 py-12">
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black" />
            Validating {forms.length} forms…
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

function hasCorrection(r: AiFormResult): boolean {
  return r.valid === false && !!r.correction;
}
