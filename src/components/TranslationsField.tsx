import { Input } from "@/components/ui/input.tsx";
import { FormItem, FormLabel } from "@/components/ui/form.tsx";
import { useEffect, useState } from "react";
import { useDictionaryContext } from "@/ctx/InitialDictionariesLoadCtx.tsx";
import { VerbTranslation } from "@/model/VerbTranslation.ts";

export function TranslationsField({
  translations,
  onChange,
}: {
  translations: VerbTranslation[];
  onChange: (translations: VerbTranslation[]) => void;
}) {
  const { langs } = useDictionaryContext();
  const [translationsMap, setTranslationsMap] = useState<
    Record<string, VerbTranslation[]>
  >({});

  useEffect(() => {
    const map = translations.reduce(
      (acc, trans) => {
        const accElement = acc[trans.lang] ?? [];
        accElement.push(trans);
        acc[trans.lang] = accElement;
        return acc;
      },
      {} as Record<string, VerbTranslation[]>,
    );

    setTranslationsMap(map);
  }, [translations]);

  function writeTranslation(lang: string, idx: number, text: string) {
    console.log(`mutating map ${translationsMap}`);
    const translations = translationsMap[lang] || [];
    if (!translations[idx]) {
      translations[idx] = new VerbTranslation(-1, "", -1, lang);
    }

    const translation = translations[idx];
    translation.value = text;
    translation.lang = lang;

    const newTranslations = { ...translationsMap };
    newTranslations[lang] = translations;
    newTranslations[lang][idx] = translation;
    setTranslationsMap(newTranslations);
    onChange(Object.values(newTranslations).flat());
  }

  function createTranslation(lang: string) {
    const newTranslations = {
      ...translationsMap,
      [lang]: [
        ...(translationsMap[lang] ?? []),
        new VerbTranslation(-1, "", -1, lang),
      ],
    };

    setTranslationsMap(newTranslations);
    onChange(Object.values(newTranslations).flat());
  }

  function canRenderPlusBtn(code: string) {
    return (
      translationsMap[code]?.length > 0 &&
      translationsMap[code][translationsMap[code].length - 1]?.value?.trim() !==
        ""
    );
  }

  return (
    <div className="flex align-middle gap-3">
      {langs.map(({ code, name }) => (
        <FormItem key={code}>
          <FormLabel>{name}</FormLabel>
          <div className="flex flex-col gap-2">
            {(
              translationsMap[code] || [new VerbTranslation(-1, "", -1, code)]
            ).map((translation, i) => (
              <div key={code + "_" + i} className="flex gap-2">
                <Input
                  placeholder={code + " translation"}
                  value={translation.value}
                  onChange={(e) => {
                    writeTranslation(code, i, e.target.value);
                  }}
                />
              </div>
            ))}
            {canRenderPlusBtn(code) && (
              <button
                type="button"
                className="px-2 py-1 bg-blue-500 text-white rounded"
                onClick={() => {
                  createTranslation(code);
                }}
              >
                +
              </button>
            )}
          </div>
        </FormItem>
      ))}
    </div>
  );
}
