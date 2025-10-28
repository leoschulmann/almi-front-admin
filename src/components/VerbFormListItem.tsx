import { CreateVerbForm, UpdateVerbForm, VerbForm } from "@/model/VerbForm.ts";
import {
  generatePlaceholder2,
  TupleForTenses,
} from "@/util/VerbFormCombinator.ts";
import React, { useEffect, useState } from "react";
import { useSelectedLang } from "@/ctx/SelectedLangCtx.tsx";
import { Button } from "@/components/ui/button.tsx";
import { postData, putData } from "@/util/ApiClient.ts";
import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { renderIcon } from "@/util/Common.tsx";
import { InputWithWarning } from "@/components/InputWithWarning.tsx";
import {
  UpsertVFormTranslitDto,
  VFormTransliteration,
} from "@/model/VFormTransliteration.ts";
import { Lang } from "@/model/Lang.ts";
import {
  Tense,
  toPluralityGender,
  toTensePerson,
} from "@/model/VerbParameters.ts";
import { EditVerbDto, VerbShortDto } from "@/model/Verb.ts";

function getTransliteration(
  verbForm: VerbForm,
  lang: Lang,
): VFormTransliteration | undefined {
  return verbForm.transliterations.find((t) => t.lang === lang.code);
}

function setTransliteration(
  verbForm: VerbForm,
  lang: Lang,
  value: string,
): VerbForm {
  let translits = verbForm.transliterations;

  if (getTransliteration(verbForm, lang)) {
    // update existing by lang code
    translits = translits.map((t) =>
      t.lang === lang.code ? { ...t, value: value } : t,
    );
  } else {
    translits = [
      ...translits,
      new VFormTransliteration(undefined, value, undefined, lang.code),
    ];
  }

  return { ...verbForm, transliterations: translits };
}

async function createNewVerbForm(
  verbId: number,
  tense: Tense,
  template: TupleForTenses,
  formValue: string,
  translits: VFormTransliteration[] = [],
): Promise<VerbForm> {
  const tensePerson = toTensePerson(tense, template.person);
  const pluralityGender = toPluralityGender(
    template.plurality,
    template.gender,
  );

  const createVerbForm = new CreateVerbForm(
    verbId,
    formValue,
    tensePerson,
    pluralityGender,
    translits.map((t) => ({
      first: t.lang,
      second: t.value,
    })),
  );
  return await postData("vform", createVerbForm, VerbForm);
}

async function updateExistingVerbForm(
  vformId: number,
  formValue: string,
  translits: VFormTransliteration[] = [],
): Promise<VerbForm> {
  const updateDto = new UpdateVerbForm(
    vformId,
    formValue,
    translits.map(
      (t) =>
        new UpsertVFormTranslitDto(
          t.id < 0 ? undefined : t.id, // if id is negative, it means it's new
          t.value,
          t.lang,
        ),
    ),
  );

  return await putData("vform", updateDto, VerbForm);
}

async function updateVerbValue(
  verbId: number,
  value: string,
): Promise<VerbShortDto> {
  const editVerbDto = new EditVerbDto(verbId, value);
  return await putData("verb", editVerbDto, VerbShortDto);
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
  const { setVerb, verb } = useSelectedVerb();

  const [vformExists, setVformExists] = useState(vform !== undefined);
  const [mutableVform, setMutableVform] = useState(vform ?? new VerbForm());
  const [reference, setReference] = useState(vform ?? new VerbForm());
  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const verbValueChanged: boolean = mutableVform.value !== reference.value;
    const translitValueChanged: boolean =
      getTransliteration(mutableVform, lang)?.value !==
      getTransliteration(reference, lang)?.value;

    setShowSaveBtn(verbValueChanged || translitValueChanged);
  }, [mutableVform, lang, verb, reference]);

  const handleClickSave = async () => {
    setSending(true);

    try {
      const upsertVerbFormPromise: Promise<VerbForm> = vformExists
        ? updateExistingVerbForm(
            mutableVform.id,
            mutableVform.value,
            mutableVform.transliterations,
          )
        : createNewVerbForm(
            verb!.id,
            tense,
            template,
            mutableVform.value,
            mutableVform.transliterations,
          );

      const verbUpdatePromise =
        tense === "INFINITIVE" // form 'infinitive' eq verb value
          ? await updateVerbValue(verb!.id, mutableVform.value)
          : null;

      const [upsertVerbFormResponse, updateVerbResponse] = await Promise.all([
        upsertVerbFormPromise,
        verbUpdatePromise,
      ]);

      if (updateVerbResponse) {
        const verb1: VerbShortDto = {
          ...verb!,
          version: updateVerbResponse.version,
          value: updateVerbResponse.value,
        };
        setVerb(verb1);
      }

      setMutableVform(upsertVerbFormResponse);
      setReference(upsertVerbFormResponse);
      setVformExists(true);
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
          className={"w-48"}
          placeholder={generatePlaceholder2(lang)}
          value={mutableVform ? mutableVform.value : ""}
          onChange={(e) =>
            setMutableVform({ ...mutableVform, value: e.target.value })
          }
          warningMessage="Missing verb value"
          showWarning={mutableVform.value === ""}
          textClassName="font-rubik font-semibold italic !text-2xl text-neutral-800"
          placeholderClassName="placeholder:text-sm placeholder:not-italic placeholder:font-normal"
        />

        {showSaveBtn ? (
          <Button
            variant="outline"
            disabled={mutableVform.value === ""}
            onClick={handleClickSave}
            className="bg-blue-100 border-2 p-1 border-blue-500"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black"></div>
            ) : (
              renderIcon(
                template.gender,
                template.person,
                template.plurality,
                "w-6 h-6",
                `SAVE: ${tense} | ${template.gender} | ${template.person} | ${template.plurality}`,
              )
            )}
          </Button>
        ) : (
          renderIcon(
            template.gender,
            template.person,
            template.plurality,
            "w-9 h-9 p-1.5",
          )
        )}

        <InputWithWarning
          type={"text"}
          className={"w-48"}
          placeholder={generatePlaceholder2(lang)}
          disabled={mutableVform.value === ""}
          value={getTransliteration(mutableVform, lang)?.value ?? ""}
          onChange={(e) =>
            setMutableVform(
              setTransliteration(mutableVform, lang, e.target.value),
            )
          }
          showWarning={
            getTransliteration(mutableVform, lang)?.value.trim() === ""
          }
          warningMessage="Missing transliteration"
        />
      </div>
    </li>
  );
}
