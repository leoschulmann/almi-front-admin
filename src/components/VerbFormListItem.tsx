import { VerbForm } from "@/model/VerbForm.ts";
import { Tense } from "@/model/Tense.ts";
import {
  generatePlaceholder,
  TupleForTenses,
} from "@/util/VerbFormCombinator.ts";
import { Input } from "@/components/ui/input.tsx";
import { Save, TriangleAlert } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { Button } from "@/components/ui/button.tsx";
import { postData } from "@/util/ApiClient.ts";
import { Verb } from "@/model/Verb.ts";
import {
  CreateVerbForm,
  toPluralityGender,
  toTensePerson,
} from "@/model/CreateVerbForm.ts";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { renderIcon } from "@/util/Common.tsx";

export function VerbFormListItem({
  vform,
  tense,
  template,
}: {
  vform: VerbForm | undefined;
  tense: Tense;
  template: TupleForTenses;
}) {
  const { lang } = useSelectedLang();
  const { verb } = useSelectedVerb();
  const [verbValue, setVerbValue] = useState("");
  const [translitValue, setTranslitValue] = useState("");
  const [initialVerbValue, setInitialVerbValue] = useState("");
  const [initialTranslitValue, setInitialTranslitValue] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const newVerbValue = vform?.value ?? "";
    setVerbValue(newVerbValue);
    setInitialVerbValue(newVerbValue);

    const transliteration = vform?.transliterations.find(
      (t) => t.lang === lang?.code,
    );
    const newTranslitValue = transliteration?.value ?? "";
    setTranslitValue(newTranslitValue);
    setInitialTranslitValue(newTranslitValue);

    setHasChanges(false);
  }, [vform, lang, verb]); // !

  useEffect(() => {
    //TODO: maybe merge with the one above
    const verbChanged = verbValue !== initialVerbValue;
    const translitChanged = translitValue !== initialTranslitValue;
    setHasChanges(verbChanged || translitChanged);
  }, [verbValue, translitValue, initialVerbValue, initialTranslitValue]);

  const handleSave = async () => {
    setSending(true);

    const id = verb?.id;
    const toTensePerson1 = toTensePerson(tense, template.person);
    const toPluralityGender1 = toPluralityGender(
      template.plurality,
      template.gender,
    );
    const createVerbForm = new CreateVerbForm(
      id,
      verbValue,
      toTensePerson1,
      toPluralityGender1,
      [{ first: lang!.code, second: translitValue }],
    );

    try {
      await postData("verb/form", createVerbForm, Verb); // todo implement
    } finally {
      setInitialVerbValue(verbValue);
      setInitialTranslitValue(translitValue);
      setHasChanges(false);
    }
  };

  return (
    <li
      key={`${tense}-${template.gender}-${template.person}-${template.plurality}`}
    >
      <div className={"pt-1 pb-1 flex items-center gap-2"}>
        {renderIcon(template.gender, template.person, template.plurality)}

        {vform ? ( // todo finish
          <div className="flex items-center gap-3">
            <span className="font-rubik font-semibold text-xl">
              {vform.value}
            </span>
            {vform.transliterations
              .map((t) => t.lang + ":" + t.value)
              .join(", ")}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Input
              type={"text"}
              className={"w-60"}
              placeholder={generatePlaceholder(
                template.gender,
                template.person,
                template.plurality,
              )}
              value={verbValue}
              onChange={(e) => {
                setVerbValue(e.target.value);
              }}
            />
            {verbValue.trim() === "" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TriangleAlert className="h-5 w-5 text-orange-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Пустая форма глагола</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Input
              type={"text"}
              className={"w-60"}
              placeholder={`Transliterations for ${lang?.name}`}
              value={translitValue}
              onChange={(e) => {
                setTranslitValue(e.target.value);
              }}
            />
            {translitValue.trim() === "" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <TriangleAlert className="h-5 w-5 text-orange-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Empty transliteration</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="outline"
              disabled={!hasChanges}
              onClick={handleSave}
              className={hasChanges ? "bg-blue-50" : ""}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
              ) : (
                <Save className={hasChanges ? "text-blue-500" : ""} />
              )}
            </Button>
          </div>
        )}
      </div>
    </li>
  );
}
