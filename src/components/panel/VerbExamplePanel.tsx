import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import {
  renderIcon,
  renderMessageCentered,
  renderSkeleton,
} from "@/util/Common.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { ReactElement, useEffect, useState } from "react";
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
import { CreateVFExampleDialogButton } from "@/components/CreateVFExampleDialogButton.tsx";

export function VerbExamplesPanel() {
  const { verb, verbForms } = useSelectedVerb();
  const { lang } = useSelectedLang();
  const [isLoading, setLoading] = useState(false);
  const [examples, setExamples]: [VFormExample[], (value: (((prevState: VFormExample[]) => VFormExample[]) | VFormExample[])) => void] = useState<VFormExample[]>([]);

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
      const example = examples.find(
        (example) =>
          example.tense === tense &&
          example.person === tft.person &&
          example.gender === tft.gender &&
          example.plurality === tft.plurality,
      );

      if (!example) {
        return;
      }

      return (
        <li key={`${tense}-${tft.gender}-${tft.person}-${tft.plurality}`}>
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
      );
    };
  }

  function renderExamples() {
    const content: ReactElement[] = [];

    let tense: Tense = "INFINITIVE";

    // infinitive
    if (examples.filter((e) => e.tense === "INFINITIVE").length > 0) {
      content.push(renderTitle("Infinitive"));

      INFINITIVE_VERB_FORM_TEMPLATE.map(getTranslationComponent(tense))
        .filter((e) => e !== undefined)
        .forEach((e) => content.push(e));
    }

    // Present
    tense = "PRESENT";
    if (examples.filter((e) => e.tense === "PRESENT").length > 0) {
      content.push(renderTitle("Present"));

      PRESENT_VERB_FORM_TEMPLATES.map(getTranslationComponent(tense))
        .filter((e) => e !== undefined)
        .forEach((e) => content.push(e));
    }

    // Past

    tense = "PAST";
    if (examples.filter((e) => e.tense === "PAST").length > 0) {
      content.push(renderTitle("Past"));

      PAST_VERB_FORM_TEMPLATES.map(getTranslationComponent(tense))
        .filter((e) => e !== undefined)
        .forEach((e) => content.push(e));
    }

    // future
    tense = "FUTURE";
    if (examples.filter((e) => e.tense === "FUTURE").length > 0) {
      content.push(renderTitle("Future"));

      FUTURE_VERB_FORM_TEMPLATES.map(getTranslationComponent(tense))
        .filter((e) => e !== undefined)
        .forEach((e) => content.push(e));
    }

    // imperative
    tense = "IMPERATIVE";

    ///Currently employed as tech lead on a project - we’re building enterprise monitoring system. Managing small team, address incidents, writing server-side of the project, delivering the product.

    if (examples.filter((e) => e.tense === "IMPERATIVE").length > 0) {
      content.push(renderTitle("Imperative"));
      IMPERATIVE_VERB_FORM_TEMPLATES.map(getTranslationComponent("IMPERATIVE"))
        .filter((e) => e !== undefined)
        .forEach((e) => content.push(e));
    }
    return <ul>{content}</ul>;
  }
  
  return (
    <div className="h-screen flex-grow">
      <div className="p-3 flex flex-col gap-3">
        <div>
          <CreateVFExampleDialogButton
            enabled={!!verb}
            onSuccess={(resp) => {
              console.log(resp);
              
              setExamples((prev) => [...prev, resp]);
              
            }}
          />
        </div>
        <div className="flex flex-grow flex-col">
          {!verb
            ? renderMessageCentered("Select a verb")
            : isLoading
              ? renderSkeleton(10)
              : renderExamples()}
        </div>
      </div>
    </div>
  );
}
