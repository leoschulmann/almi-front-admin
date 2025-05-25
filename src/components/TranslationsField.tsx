import { Input } from "@/components/ui/input.tsx";
import { FormItem, FormLabel } from "@/components/ui/form.tsx";
import { useEffect, useState } from "react";
import { useDictionaryContext } from "@/ctx/InitialDictionariesLoadCtx.tsx";

export function TranslationsField({
  value,
  onChange,
}: {
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string>) => void;
}) {
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { langs } = useDictionaryContext();

  useEffect(() => {
    const translationsObject: Record<string, string> = {};
    if (typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        translationsObject[key] = val;
      });
    }
    setTranslations(translationsObject);
  }, [value]);

  const handleTranslationChange = (code: string, text: string) => {
    const newTranslations: { [p: string]: string } = {
      ...translations,
      [code]: text,
    };
    setTranslations(newTranslations);

    const translationsMap: Record<string, string> = {};

    Object.entries(newTranslations).forEach(([key, val]) => {
      if (val.trim() !== "") {
        translationsMap[key] = val;
      }
    });

    onChange(translationsMap);
  };

  return (
    <div className="flex align-middle gap-3">
      {langs.map(({ code, name }) => (
        <FormItem key={code}>
          <FormLabel>{name}</FormLabel>
          <Input
            placeholder={code + " translation"}
            value={translations[code] || ""}
            onChange={(e) => handleTranslationChange(code, e.target.value)}
          />
        </FormItem>
      ))}
    </div>
  );
}
