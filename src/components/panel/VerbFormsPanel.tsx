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
import { useDictionaryContext } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";

export function VerbFormsPanel() {
  const { verb } = useSelectedVerb();
  const [isLoading, setLoading] = useState(false);
  const [verbForms, setVerbForms] = useState<VerbForm[]>([]);
  const { langs } = useDictionaryContext();
  const { lang, setLang } = useSelectedLang();

  useEffect(() => {
    if (langs && langs.length > 0) {
      const lang = langs[0];
      setLang(lang);
    }
  }, [langs, setLang]);

  useEffect(() => {
    if (verb) {
      void (async function (verbId: number) {
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
      })(verb.id);
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

    return <ul>{content}</ul>;
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
      <li
        key={`${vf.tense}${vf.gender}${vf.person}${vf.plurality}`}
        className="flex items-center gap-3"
      >
        <img
          src={getIcon(vf.gender, vf.person, vf.plurality)}
          className="w-6 h-6"
          alt={`gender: ${vf.gender}, person: ${vf.person}, plurality: ${vf.plurality}`}
        ></img>
        <span className="font-rubik font-semibold text-xl">{vf.value}</span>
        {vf.transliterations.map((t) => t.lang + ":" + t.value).join(", ")}
      </li>
    );
  }

  function createComponentForMissingForm(
    { person, gender, plurality, optional }: TupleForTenses,
    tense: Tense,
  ): ReactElement {
    return (
      <li
        key={`${tense}${gender}${person}${plurality}`}
        className="flex items-center gap-3"
      >
        <img
          src={getIcon(gender, person, plurality)}
          className="w-6 h-6"
          alt={`gender: ${gender}, person: ${person}, plurality: ${plurality}`}
        ></img>
        Missing verb form for {person}, {gender}, {plurality}{" "}
        {optional ? "[optional]" : ""}
      </li>
    );
  }

  function renderTitle(title: string) {
    return (
      // <div>
      <li key={`title-${title}`}>
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
          <div className="text-2xl font-normal font-noto-sans text-[#FF006E] italic text-left">
            {title}
          </div>
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
        </div>
      </li>
      // </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-3 flex items-center gap-3">
        <Button
          disabled={true}
          className="h-9 w-32 justify-center bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          <Plus className="h-5 w-5" /> verb form
        </Button>

        {lang ? (
          <Select
            value={lang.name}
            onValueChange={(e) => setLang(langs.find((l) => l.name === e))}
          >
            <SelectTrigger className="w-36">
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
          renderSkeleton(1)
        )}
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
