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
import { FormPatch } from "@/model/FormPatch.ts";

function getTransliteration(
  verbForm: VerbForm,
  lang: Lang,
): VFormTransliteration | undefined {
  return verbForm.transliterations.find((t) => t.lang === lang.code);
}

// all transliterations as one comparable string, so a change in any language counts
function translitsKey(verbForm: VerbForm): string {
  return verbForm.transliterations
    .map((t) => `${t.lang}:${t.value}`)
    .sort()
    .join("|");
}

function setTransliteration(
  verbForm: VerbForm,
  langCode: string,
  value: string,
): VerbForm {
  let translits = verbForm.transliterations;

  if (verbForm.transliterations.some((t) => t.lang === langCode)) {
    // update existing by lang code
    translits = translits.map((t) =>
      t.lang === langCode ? { ...t, value: value } : t,
    );
  } else {
    translits = [
      ...translits,
      new VFormTransliteration(undefined, value, undefined, langCode),
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
  onSuccessUpsertVerbForm,
  onSuccessUpdateVerb,
  correction,
  registerSaver,
}: {
  vform: VerbForm | undefined;
  tense: Tense;
  template: TupleForTenses;
  onSuccessUpsertVerbForm: (respVForm: VerbForm) => void;
  onSuccessUpdateVerb: (respVerb: VerbShortDto) => void;
  // value proposed from outside (e.g. almi-ai); put into the field, saving stays manual
  correction?: FormPatch;
  // lets the panel save every changed form at once; null means nothing to save
  registerSaver?: (key: string, save: (() => Promise<void>) | null) => void;
}) {
  const { lang } = useSelectedLang();
  const { setVerb, verb } = useSelectedVerb();

  const [vformExists, setVformExists] = useState(vform !== undefined);
  const [mutableVform, setMutableVform] = useState(vform ?? new VerbForm());
  const [reference, setReference] = useState(vform ?? new VerbForm());
  const [showSaveBtn, setShowSaveBtn] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (correction) {
      setMutableVform((prev) => {
        let next: VerbForm = {
          ...prev,
          value: correction.value ?? prev.value,
        };
        for (const [code, text] of Object.entries(correction.translits ?? {})) {
          next = setTransliteration(next, code, text);
        }
        return next;
      });
    }
  }, [correction]);

  useEffect(() => {
    const verbValueChanged: boolean = mutableVform.value !== reference.value;
    const translitValueChanged: boolean =
      translitsKey(mutableVform) !== translitsKey(reference);

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

      // if form is 'infinitive', we need to update verb value too
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

        onSuccessUpdateVerb(updateVerbResponse);
      }

      setMutableVform(upsertVerbFormResponse);
      setReference(upsertVerbFormResponse);
      setVformExists(true);
      onSuccessUpsertVerbForm(upsertVerbFormResponse);
    } finally {
      setShowSaveBtn(false);
      setSending(false);
    }
  };

  const saverKey = `${tense}-${template.gender}-${template.person}-${template.plurality}`;

  // re-registered on every render so the panel always calls the latest closure
  useEffect(() => {
    registerSaver?.(saverKey, showSaveBtn ? handleClickSave : null);
  });

  useEffect(() => {
    return () => registerSaver?.(saverKey, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saverKey]);

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
              setTransliteration(mutableVform, lang.code, e.target.value),
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
