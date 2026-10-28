// values proposed for a form row from outside (e.g. almi-ai); applied to the fields, saving stays manual
export interface FormPatch {
  value?: string;
  // transliteration by lang code (EN, RU)
  translits?: Record<string, string>;
}
