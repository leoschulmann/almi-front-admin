import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { getDataVector } from "@/util/ApiClient.ts";
import { renderMessageCentered, renderSkeleton } from "@/util/Common.tsx";
import { VerbForm } from "@/model/VerbForm.ts";
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
import { Tense } from "@/model/VerbParameters.ts";
import { VerbShortDto } from "@/model/Verb";
import { Button } from "@/components/ui/button.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip.tsx";
import { ValidateFormsResultDialog } from "@/components/ValidateFormsResultDialog.tsx";
import { TransliterationResultDialog } from "@/components/TransliterationResultDialog.tsx";
import { FormPatch } from "@/model/FormPatch.ts";
import { SelectFormsDialog } from "@/components/SelectFormsDialog.tsx";
import { Languages, SaveAll, SpellCheck } from "lucide-react";

export function renderTitle(title: string) {
  return (
    <li key={`title-${title}`}>
      <div className="flex items-center gap-3">
        <div className="h-0.5 w-full bg-[#FF006E]" />
        <div className="text-2xl font-normal font-noto-sans text-[#FF006E] italic text-left">
          {title}
        </div>
        <div className="h-0.5 w-full bg-[#FF006E]" />
      </div>
    </li>
  );
}

export function VerbFormsPanel() {
  const { setVerbForms, verb, verbForms } = useSelectedVerb();
  const [isLoading, setLoading] = useState(false);
  const { langs } = useDictionaryContext();
  const { lang, setLang } = useSelectedLang();
  // forms sent for validation; non-null while the result dialog is shown
  const [validatedForms, setValidatedForms] = useState<VerbForm[] | null>(null);
  // corrections applied from the validation result, by form id
  const [translitForms, setTranslitForms] = useState<VerbForm[] | null>(null);
  const [corrections, setCorrections] = useState<Map<number, FormPatch>>(
    new Map(),
  );
  // savers of the changed form rows (key -> save), see VerbFormListItem
  const saversRef = useRef(new Map<string, () => Promise<void>>());
  const [dirtyCount, setDirtyCount] = useState(0);
  const [savingAll, setSavingAll] = useState(false);
  const [dialogMode, setDialogMode] = useState<"validate" | "translit" | null>(
    null,
  );

  useEffect(() => {
    if (langs && langs.length > 0) {
      const lang = langs[0];
      setLang(lang);
    }
  }, [langs, setLang]);

  useEffect(() => {
    setCorrections(new Map());
    if (verb) {
      void loadVerbForms(verb.id);
    }
  }, [verb]);

  async function loadVerbForms(verbId: number) {
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
  }

  const registerSaver = useCallback(
    (key: string, save: (() => Promise<void>) | null) => {
      if (save) saversRef.current.set(key, save);
      else saversRef.current.delete(key);
      setDirtyCount(saversRef.current.size);
    },
    [],
  );

  async function saveAll() {
    // the infinitive goes last: saving it reloads the verb, and the reload drops unsaved rows
    const keys = [...saversRef.current.keys()].sort(
      (a, b) =>
        Number(a.startsWith("INFINITIVE")) - Number(b.startsWith("INFINITIVE")),
    );
    setSavingAll(true);
    let failed = 0;
    for (const key of keys) {
      try {
        await saversRef.current.get(key)?.();
      } catch (error) {
        console.error("Failed to save form:", key, error);
        failed++;
      }
    }
    setSavingAll(false);
    if (failed > 0) {
      alert(`Failed to save ${failed} of ${keys.length} forms.`);
    }
  }

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
        <VerbFormListItem
          vform={vform}
          correction={vform ? corrections.get(vform.id) : undefined}
          registerSaver={registerSaver}
          tense={tense}
          template={template}
          onSuccessUpsertVerbForm={(respVerbForm: VerbForm) => {
            setVerbForms((prev8) => [...prev8, respVerbForm]);
          }}
          onSuccessUpdateVerb={(respVerb: VerbShortDto): void => {
            // todo - update verb in the list
          }}
        />
      );
    };
  }

  function renderTitle(title: string) {
    return (
      <li key={`title-${title}`}>
        <div className="flex items-center gap-3">
          <div className="h-0.5 w-full bg-[#FF006E]" />
          <div className="text-2xl font-normal font-noto-sans text-[#FF006E] italic text-left">
            {title}
          </div>
          <div className="h-0.5 w-full bg-[#FF006E]" />
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
    <div className="h-screen w-[500px] flex flex-col">
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={!verb || verbForms.length === 0}
                onClick={() => setDialogMode("validate")}
              >
                <SpellCheck />
                {lang?.code === "RU" ? "Проверить" : "Validate"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lang?.code === "RU"
                ? "Проверить все формы"
                : "Validate all forms"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                disabled={!verb || verbForms.length === 0}
                onClick={() => setDialogMode("translit")}
              >
                <Languages />
                {lang?.code === "RU" ? "Транслит" : "Translit"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lang?.code === "RU"
                ? "Сгенерировать транслитерацию"
                : "Generate transliteration"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="ml-auto"
                disabled={dirtyCount === 0 || savingAll}
                onClick={() => void saveAll()}
              >
                {savingAll ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-black" />
                ) : (
                  <SaveAll />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {lang?.code === "RU"
                ? `Сохранить все изменения (${dirtyCount})`
                : `Save all changes (${dirtyCount})`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {!verb ? (
        renderMessageCentered("Select a verb")
      ) : isLoading ? (
        renderSkeleton(15)
      ) : (
        <ScrollArea className="flex-grow p-3 overflow-y-auto border-r">
          {renderVerbForms()}
        </ScrollArea>
      )}
      <SelectFormsDialog
        open={dialogMode !== null}
        onOpenChange={(o) => !o && setDialogMode(null)}
        title={
          dialogMode === "validate"
            ? "Validate forms"
            : "Generate transliteration"
        }
        confirmLabel={dialogMode === "validate" ? "Validate" : "Generate"}
        forms={verbForms}
        onConfirm={(selected) => {
          if (dialogMode === "validate") {
            setValidatedForms(selected);
          } else {
            setTranslitForms(selected);
          }
        }}
      />
      {verb && validatedForms && (
        <ValidateFormsResultDialog
          verbId={verb.id}
          forms={validatedForms}
          onClose={() => setValidatedForms(null)}
          onApply={(applied) =>
            setCorrections(
              (prev) =>
                new Map([
                  ...prev,
                  ...[...applied].map(
                    ([id, value]) => [id, { value }] as [number, FormPatch],
                  ),
                ]),
            )
          }
        />
      )}
      {translitForms && (
        <TransliterationResultDialog
          forms={translitForms}
          onClose={() => setTranslitForms(null)}
          onApply={(applied) =>
            setCorrections(
              (prev) =>
                new Map([
                  ...prev,
                  ...[...applied].map(
                    ([id, translits]) =>
                      [id, { translits }] as [number, FormPatch],
                  ),
                ]),
            )
          }
        />
      )}
    </div>
  );
}
