import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import {
  renderIcon,
  byLang,
  renderMessageCentered,
  renderSkeleton,
} from "@/util/Common.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { useDictionaryContext } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import { ReactElement, useEffect, useState } from "react";
import { VerbForm } from "@/model/VerbForm.ts";
import { VFormExample } from "@/model/VFormExample.ts";
import { getDataVector } from "@/util/ApiClient.ts";
import {
  FUTURE_VERB_FORM_TEMPLATES,
  IMPERATIVE_VERB_FORM_TEMPLATES,
  INFINITIVE_VERB_FORM_TEMPLATE,
  PAST_VERB_FORM_TEMPLATES,
  PRESENT_VERB_FORM_TEMPLATES,
  TupleForTenses,
} from "@/util/VerbFormCombinator.ts";
import { renderTitle } from "@/components/panel/VerbFormsPanel.tsx";
import { Tense } from "@/model/VerbParameters.ts";
import { Button } from "@/components/ui/button.tsx";
import { Settings, Sparkles } from "lucide-react";
import { SelectFormsDialog } from "@/components/SelectFormsDialog.tsx";
import { GenerateExamplesResultDialog } from "@/components/GenerateExamplesResultDialog.tsx";
import {
  CreateVFExampleDialogButton,
  ExampleDialog,
} from "@/components/CreateVFExampleDialogButton.tsx";

export function VerbExamplesPanel() {
  const { verb, verbForms } = useSelectedVerb();
  const { lang, setLang } = useSelectedLang();
  const { langs } = useDictionaryContext();
  const [isLoading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editExample, setEditExample] = useState<VFormExample | null>(null);
  // forms chosen for generation; non-null while the result dialog is shown
  const [generateForms, setGenerateForms] = useState<VerbForm[] | null>(null);
  const [examples, setExamples]: [
    VFormExample[],
    (
      value: ((prevState: VFormExample[]) => VFormExample[]) | VFormExample[],
    ) => void,
  ] = useState<VFormExample[]>([]);

  useEffect(() => {
    if (verb) {
      void loadExamples(verb.id);
    }
  }, [verb]);

  async function loadExamples(verbId: number) {
    setLoading(true);
    try {
      const examples: VFormExample[] = await getDataVector(
        `vform/example/${verbId}`,
        VFormExample,
      );
      setExamples(examples);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  }

  function getTranslationComponent(tense: Tense) {
    return (tft: TupleForTenses) => {
      const formExamples = examples.filter(
        (example) =>
          example.tense === tense &&
          example.person === tft.person &&
          example.gender === tft.gender &&
          example.plurality === tft.plurality,
      );

      return formExamples.map((example) => (
        <li key={example.id}>
          <div className={"pt-1 pb-1 flex items-center gap-3 group"}>
            <p dir="rtl">{example.value}</p>
            {renderIcon(tft.gender, tft.person, tft.plurality, "w-9 h-9 p-1.5")}
            <p>
              {example.translations.find((t) => {
                return t.lang === lang.code;
              })?.value ?? "-- EMPTY --"}
            </p>
            <button
              type="button"
              title="Edit"
              className="ml-auto p-1 rounded bg-gray-100 opacity-0 group-hover:opacity-100 active:opacity-50"
              onClick={() => setEditExample(example)}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </li>
      ));
    };
  }

  function renderExamples() {
    const content: ReactElement[] = [];

    let tense: Tense = "INFINITIVE";

    // infinitive
    if (examples.filter((e) => e.tense === "INFINITIVE").length > 0) {
      content.push(renderTitle("Infinitive"));

      INFINITIVE_VERB_FORM_TEMPLATE.flatMap(
        getTranslationComponent(tense),
      ).forEach((e) => content.push(e));
    }

    // Present
    tense = "PRESENT";
    if (examples.filter((e) => e.tense === "PRESENT").length > 0) {
      content.push(renderTitle("Present"));

      PRESENT_VERB_FORM_TEMPLATES.flatMap(
        getTranslationComponent(tense),
      ).forEach((e) => content.push(e));
    }

    // Past

    tense = "PAST";
    if (examples.filter((e) => e.tense === "PAST").length > 0) {
      content.push(renderTitle("Past"));

      PAST_VERB_FORM_TEMPLATES.flatMap(getTranslationComponent(tense)).forEach(
        (e) => content.push(e),
      );
    }

    // future
    tense = "FUTURE";
    if (examples.filter((e) => e.tense === "FUTURE").length > 0) {
      content.push(renderTitle("Future"));

      FUTURE_VERB_FORM_TEMPLATES.flatMap(
        getTranslationComponent(tense),
      ).forEach((e) => content.push(e));
    }

    // imperative
    tense = "IMPERATIVE";

    ///Currently employed as tech lead on a project - we’re building enterprise monitoring system. Managing small team, address incidents, writing server-side of the project, delivering the product.

    if (examples.filter((e) => e.tense === "IMPERATIVE").length > 0) {
      content.push(renderTitle("Imperative"));
      IMPERATIVE_VERB_FORM_TEMPLATES.flatMap(
        getTranslationComponent("IMPERATIVE"),
      ).forEach((e) => content.push(e));
    }
    if (content.length === 0) {
      return renderMessageCentered(
        byLang(lang.code, "No examples yet", "Примеров пока нет"),
      );
    }
    return <ul>{content}</ul>;
  }

  return (
    <div className="h-screen flex-grow flex flex-col">
      <div className="p-3 flex flex-col gap-3 flex-grow">
        <div className="flex gap-3">
          <CreateVFExampleDialogButton
            enabled={!!verb}
            onSuccess={(resp) => {
              console.log(resp);

              setExamples((prev) => [...prev, resp]);
            }}
          />
          <Button
            variant="outline"
            disabled={!verb || verbForms.length === 0}
            onClick={() => setPickerOpen(true)}
          >
            <Sparkles />
            Generate examples
          </Button>
          {lang && langs.length > 0 ? (
            <Select
              value={lang.name}
              onValueChange={(e) =>
                setLang(langs.find((l) => l.name === e) ?? langs[0])
              }
            >
              <SelectTrigger className="ml-auto w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {langs.map(({ code, name }) => {
                  return (
                    <SelectItem key={code} value={name}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <span className="ml-auto" />
          )}
        </div>
        <div className="flex flex-grow flex-col">
          {!verb
            ? renderMessageCentered(
                byLang(lang.code, "Select a verb", "Выберите глагол"),
              )
            : isLoading
              ? renderSkeleton(10)
              : renderExamples()}
        </div>
      </div>
      <SelectFormsDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Generate examples"
        confirmLabel="Generate"
        forms={verbForms.filter((f) => f.value.length > 0)}
        // forms that already have an example start unchecked; check them to get an extra one
        isInitiallyChecked={(f) =>
          !examples.some(
            (e) =>
              e.tense === f.tense &&
              e.person === f.person &&
              e.plurality === f.plurality &&
              e.gender === f.gender,
          )
        }
        onConfirm={setGenerateForms}
      />
      <ExampleDialog
        open={editExample !== null}
        onOpenChange={(o) => !o && setEditExample(null)}
        editExample={editExample}
        onSaved={(saved) =>
          setExamples((prev) =>
            prev.map((e) => (e.id === saved.id ? saved : e)),
          )
        }
        onDeleted={(id) =>
          setExamples((prev) => prev.filter((e) => e.id !== id))
        }
      />
      {verb && generateForms && (
        <GenerateExamplesResultDialog
          verbId={verb.id}
          forms={generateForms}
          onClose={() => setGenerateForms(null)}
          onCreated={(created) => setExamples((prev) => [...prev, ...created])}
        />
      )}
    </div>
  );
}
