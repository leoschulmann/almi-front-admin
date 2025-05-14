import { VerbForm } from "@/model/VerbForm.ts";
import { Tense } from "@/model/Tense.ts";
import {
  generatePlaceholder,
  TupleForTenses,
} from "@/util/VerbFormCombinator.ts";
import { Save } from "lucide-react";
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
import { InputWithWarning } from "@/components/InputWithWarning.tsx";

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
  const [verbValue, setVerbValue] = useState(vform?.value ?? "");
  const initialTransliteration =
    vform?.transliterations.find((t) => t.lang === lang?.code)?.value ?? "";
  const [translitValue, setTranslitValue] = useState(initialTransliteration);
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
      setSending(false);
    }
  };

  return (
    <li
      key={`${tense}-${template.gender}-${template.person}-${template.plurality}`}
    >
      <div className={"pt-1 pb-1 flex items-center gap-3"}>
        <InputWithWarning
          type={"text"}
          className={"w-64"}
          placeholder={generatePlaceholder(
            template.gender,
            template.person,
            template.plurality,
          )}
          value={verbValue}
          onChange={(e) => setVerbValue(e.target.value)}
          warningMessage="Missing verb value"
          showWarning={verbValue.trim() === ""}
          textClassName="font-rubik font-semibold italic !text-2xl text-neutral-800"
          placeholderClassName="placeholder:text-sm placeholder:not-italic placeholder:font-normal"
        />

        {renderIcon(template.gender, template.person, template.plurality)}

        <InputWithWarning
          type={"text"}
          className={"w-64"}
          placeholder={`Transliteration for ${lang?.name}`}
          value={translitValue}
          onChange={(e) => {
            setTranslitValue(e.target.value);
          }}
          showWarning={translitValue.trim() === ""}
          warningMessage="Missing transliteration"
        />

        {hasChanges ? (
          <Button variant="outline" onClick={handleSave} className="bg-blue-50">
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black"></div>
            ) : (
              <Save className="text-blue-500" />
            )}
          </Button>
        ) : (
          <div />
        )}
      </div>
    </li>
  );
}
