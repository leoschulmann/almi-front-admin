import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { ReactElement, useEffect, useState } from "react";
import { getDataVector } from "@/util/ApiClient.ts";
import { Button } from "@/components/ui/button.tsx";
import { Plus } from "lucide-react";
import { renderMessageCentered, renderSkeleton } from "@/util/Common.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
import type { Tense } from "@/model/Tense.ts";
import {
  getForTense,
  getIcon,
  TupleForTenses,
} from "@/util/VerbFormCombinator.ts";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

export function VerbFormsPanel() {
  const { verb } = useSelectedVerb();
  const [isLoading, setLoading] = useState(false);
  const [verbForms, setVerbForms] = useState<VerbForm[]>([]);

  async function fetchVerbForms(verbId: number) {
    setLoading(true);

    try {
      const forms: VerbForm[] = await getDataVector("verb/form", VerbForm, {
        searchParams: { verb_id: verbId },
      });
      setVerbForms(forms);
    } catch (error) {
      console.error("Error loading data:", error);
      setVerbForms([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (verb) {
      void fetchVerbForms(verb.id);
    }
  }, [verb]);

  function renderVerbForms() {
    const content: ReactElement[] = [];

    // infinitive
    content.push(renderTitle("Infinitive"));

    processTense(
      verbForms.filter((vf) => vf.tense === "INFINITIVE"),
      "INFINITIVE",
    ).forEach((e) => content.push(e));

    // Present
    content.push(renderTitle("Present"));

    processTense(
      verbForms.filter((vf) => vf.tense === "PRESENT"),
      "PRESENT",
    ).forEach((e) => content.push(e));

    // Past
    content.push(renderTitle("Past"));
    processTense(
      verbForms.filter((vf) => vf.tense === "PAST"),
      "PAST",
    ).forEach((e) => content.push(e));

    // future
    content.push(renderTitle("Future"));
    processTense(
      verbForms.filter((vf) => vf.tense === "FUTURE"),
      "FUTURE",
    ).forEach((e) => content.push(e));

    // imperative
    content.push(renderTitle("Imperative"));
    processTense(
      verbForms.filter((vf) => vf.tense === "IMPERATIVE"),
      "IMPERATIVE",
    ).forEach((e) => content.push(e));

    return content;
  }

  function processTense(forms: VerbForm[], tense: Tense): ReactElement[] {
    const combinations: TupleForTenses[] = getForTense(tense);

    return combinations.map((combination) => {
      const verbForm: VerbForm | undefined = forms.find((vf) => {
        return (
          vf.person === combination.person &&
          vf.gender === combination.gender &&
          vf.plurality === combination.plurality
        );
      });

      if (verbForm) {
        return renderVerbForm(verbForm);
      } else {
        return createComponentForMissingForm(combination, tense);
      }
    });
  }

  function renderVerbForm(vf: VerbForm): ReactElement {
    return (
      <div className="flex items-center gap-3">
        <img
          src={getIcon(vf.gender, vf.person, vf.plurality)}
          className="w-6 h-6"
        ></img>
        {vf.value},{" "}
        {vf.transliterations
          .map((t) => {

            console.log(`${t.lang}-${t.value}-${t.id}`);
            
          return   t.lang + ":" + t.value;
          })
          .join(", ")}
      </div>
    );
  }

  function createComponentForMissingForm(
    { person, gender, plurality, optional }: TupleForTenses,
    tense: Tense,
  ): ReactElement {
    return (
      <div className="flex items-center gap-3">
        <img src={getIcon(gender, person, plurality)} className="w-6 h-6"></img>
        Missing verb form for {person}, {gender}, {plurality}{" "}
        {optional ? "[optional]" : ""}
      </div>
    );
  }

  function renderTitle(title: string) {
    return (
      <div>
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
          <div className="text-2xl font-normal font-noto-sans text-[#FF006E] italic text-left">
            {title}
          </div>
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-3">
        <Button
          disabled={true}
          className="h-9 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" /> verb form
        </Button>
      </div>
      <ScrollArea className="flex-grow p-3 overflow-y-auto">
        {!verb
          ? renderMessageCentered("Select a verb")
          : isLoading
            ? renderSkeleton(15)
            : verbForms.length > 0
              ? renderVerbForms()
              : renderMessageCentered("No forms ☹️")}
      </ScrollArea>
    </div>
  );
}
