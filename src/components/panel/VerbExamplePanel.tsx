import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import {
  renderIcon,
  renderMessageCentered,
  renderSkeleton,
} from "@/util/Common.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
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
import { Sparkles } from "lucide-react";
import { SelectFormsDialog } from "@/components/SelectFormsDialog.tsx";
import { GenerateExamplesResultDialog } from "@/components/GenerateExamplesResultDialog.tsx";
import { CreateVFExampleDialogButton } from "@/components/CreateVFExampleDialogButton.tsx";

export function VerbExamplesPanel() {
  const { verb, verbForms } = useSelectedVerb();
  const { lang } = useSelectedLang();
  const [isLoading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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
          <div className={"pt-1 pb-1 flex items-center gap-3"}>
            <p>{example.value}</p>
            {renderIcon(tft.gender, tft.person, tft.plurality, "w-9 h-9 p-1.5")}
            <p>
              {example.translations.find((t) => {
                return t.lang === lang.code;
              })?.value ?? "-- EMPTY --"}
            </p>
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
    return <ul>{content}</ul>;
  }

  return (
    <div className="h-screen flex-grow">
      <div className="p-3 flex flex-col gap-3">
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
        </div>
        <div className="flex flex-grow flex-col">
          {!verb
            ? renderMessageCentered("Select a verb")
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
