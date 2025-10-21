import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { ReactElement, useEffect, useState } from "react";
import { getDataVector } from "@/util/ApiClient.ts";
import { renderMessageCentered, renderSkeleton } from "@/util/Common.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
import type { Tense } from "@/model/Tense.ts";
import {
  FUTURE_VERB_FORM_TEMPLATES,
  IMPERATIVE_VERB_FORM_TEMPLATES,
  INFINITIVE_VERB_FORM_TEMPLATE,
  PAST_VERB_FORM_TEMPLATES,
  PRESENT_VERB_FORM_TEMPLATES,
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
import { VerbFormListItem } from "@/components/VerbFormListItem.tsx";

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
      void (async (verbId: number) => {
        setLoading(true);
        try {
          const forms: VerbForm[] = await getDataVector(
            `vform/${verbId}`,
            VerbForm,
          );
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

  function mapToComponent(tense: Tense, verbForms: VerbForm[]) {
    return (template: TupleForTenses) => {
      const vform = verbForms
        .filter((vf) => vf.tense === tense)
        .find(
          (vf) =>
            template.person === vf.person &&
            template.gender === vf.gender &&
            template.plurality === vf.plurality,
        );

      return (
        <VerbFormListItem vform={vform} tense={tense} template={template} />
      );
    };
  }

  function renderTitle(title: string) {
    return (
      <li key={`title-${title}`}>
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
          <div className="text-2xl font-normal font-noto-sans text-[#FF006E] italic text-left">
            {title}
          </div>
          <div className="h-0.5 w-1/24 bg-[#FF006E]" />
        </div>
      </li>
    );
  }

  function renderVerbForms() {
    const content: ReactElement[] = [];

    // infinitive
    content.push(renderTitle("Infinitive"));

    INFINITIVE_VERB_FORM_TEMPLATE.map(
      mapToComponent("INFINITIVE", verbForms),
    ).forEach((vfc) => content.push(vfc));

    // Present
    content.push(renderTitle("Present"));

    PRESENT_VERB_FORM_TEMPLATES.map(
      mapToComponent("PRESENT", verbForms),
    ).forEach((vfc) => content.push(vfc));

    // Past
    content.push(renderTitle("Past"));
    PAST_VERB_FORM_TEMPLATES.map(mapToComponent("PAST", verbForms)).forEach(
      (vfc) => content.push(vfc),
    );

    // future
    content.push(renderTitle("Future"));

    FUTURE_VERB_FORM_TEMPLATES.map(mapToComponent("FUTURE", verbForms)).forEach(
      (vfc) => content.push(vfc),
    );

    // imperative
    content.push(renderTitle("Imperative"));
    IMPERATIVE_VERB_FORM_TEMPLATES.map(
      mapToComponent("IMPERATIVE", verbForms),
    ).forEach((vfc) => content.push(vfc));

    return <ul>{content}</ul>;
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="p-3 flex items-center gap-3">
        {lang ? (
          <Select
            value={lang.name}
            onValueChange={(e) =>
              setLang(langs.find((l) => l.name === e) ?? langs[0])
            }
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
            : renderVerbForms()}
      </ScrollArea>
    </div>
  );
}
