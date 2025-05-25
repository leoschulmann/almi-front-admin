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
import { postData, putData } from "@/util/ApiClient.ts";
import {
  CreateVerbForm,
  toPluralityGender,
  toTensePerson,
} from "@/model/CreateVerbForm.ts";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { renderIcon } from "@/util/Common.tsx";
import { InputWithWarning } from "@/components/InputWithWarning.tsx";
import {
  EditVerbForm,
  UpdateVerbFormTransliteration,
} from "@/model/EditVerbForm.ts";
import { Transliteration } from "@/model/Transliteration.ts";
import { Lang } from "@/model/Lang.ts";

function getTransliteration(
  verbForm: VerbForm | undefined,
  lang: Lang | undefined,
): Transliteration | undefined {
  return verbForm?.transliterations.find((t) => t.lang === lang?.code);
}

function setTransliteration(
  verbForm: VerbForm,
  lang: Lang | undefined,
  translitValue: string,
): VerbForm {
  let transliterations = verbForm.transliterations;

  if (getTransliteration(verbForm, lang)) {
    transliterations = transliterations.map((t) =>
      t.lang === lang?.code ? { ...t, value: translitValue } : t,
    );
  } else {
    transliterations = [
      ...transliterations,
      new Transliteration(-1, translitValue, 0, lang?.code),
    ];
  }

  return { ...verbForm, transliterations };
}

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

  const [exists, setExists] = useState(vform !== undefined);

  const [init, setInit] = useState(vform ?? new VerbForm());
  const [verbForm, setVerbForm] = useState(vform ?? new VerbForm());

  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const verbValueChanged: boolean = verbForm.value !== init.value;
    const translitValueChanged: boolean =
      getTransliteration(verbForm, lang)?.value !==
      getTransliteration(init, lang)?.value;

    setShowSaveBtn(verbValueChanged || translitValueChanged);
  }, [verbForm, lang, verb, init]);

  const createNewVerbForm = async () => {
    const id = verb?.id;
    const tensePerson = toTensePerson(tense, template.person);
    const pluralityGender = toPluralityGender(
      template.plurality,
      template.gender,
    );

    const transliteration = getTransliteration(verbForm, lang);

    return await postData(
      "verb/form",
      new CreateVerbForm(
        id,
        verbForm.value,
        tensePerson,
        pluralityGender,

        transliteration
          ? [
              {
                first: transliteration?.lang,
                second: transliteration?.value,
              },
            ]
          : [],
      ),
      VerbForm,
    );
  };

  const updateVerbForm = async () => {
    console.log("updateVerbForm", verbForm);
    const transliteration = getTransliteration(verbForm, lang);
    const existingTransliteration = (transliteration?.id ?? -1) >= 0;

    const [newTransliterations, updatedTransliterations] =
      existingTransliteration
        ? 
        [
            [],
            [
              new UpdateVerbFormTransliteration(
                transliteration!.id,
                transliteration!.version,
                transliteration!.value,
              ),
            ],
          ]
        
        : [
            transliteration
              ? [
                  {
                    first: transliteration?.lang ?? "",
                    second: transliteration?.value ?? "",
                  },
                ]
              : [],
            [],
          ];
    console.log("existingTransliteration", existingTransliteration);
    console.log("tranlit", transliteration);
    console.log("updatingtr", updatedTransliterations);
    console.log("newTransliterations", newTransliterations);
    
    const payload = new EditVerbForm(
      verbForm.id,
      verbForm.version,
      verbForm.value,
      newTransliterations,
      updatedTransliterations,
    );

    return await putData("verb/form", payload, VerbForm);
  };

  const handleClickSave = async () => {
    setSending(true);

    try {
      vform = await (exists ? updateVerbForm() : createNewVerbForm());
      setVerbForm(vform);
      setInit(vform);
      setExists(true);
    } finally {
      setShowSaveBtn(false);
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
          value={verbForm ? verbForm.value : ""}
          onChange={(e) => setVerbForm({ ...verbForm, value: e.target.value })}
          warningMessage="Missing verb value"
          showWarning={verbForm.value === ""}
          textClassName="font-rubik font-semibold italic !text-2xl text-neutral-800"
          placeholderClassName="placeholder:text-sm placeholder:not-italic placeholder:font-normal"
        />

        {renderIcon(template.gender, template.person, template.plurality)}

        <InputWithWarning
          type={"text"}
          className={"w-64"}
          placeholder={`Transliteration for ${lang?.name}`}
          disabled={verbForm.value === ""}
          value={getTransliteration(verbForm, lang)?.value ?? ""}
          onChange={(e) =>
            setVerbForm(setTransliteration(verbForm, lang, e.target.value))
          }
          showWarning={getTransliteration(verbForm, lang)?.value.trim() === ""}
          warningMessage="Missing transliteration"
        />

        {showSaveBtn ? (
          <Button
            variant="outline"
            disabled={verbForm.value === ""}
            onClick={handleClickSave}
            className="bg-blue-50"
          >
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
