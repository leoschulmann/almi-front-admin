import { Verb } from "@/model/Verb.ts";
import { getDataScalar } from "@/util/ApiClient.ts";

// the selected verb in the list is a short dto: root, binyan and gizrot come from the full one
export async function loadAiVerbContext(verbId: number) {
  const verb = await getDataScalar(`verb/${verbId}`, Verb);
  const translations: Record<string, string[]> = {};
  for (const t of verb.translations) {
    if (t.value.trim()) (translations[t.lang] ??= []).push(t.value.trim());
  }
  return {
    translations,
    root: verb.root.name,
    binyan: verb.binyan.value,
    gizrot: verb.gizrahs.map((g) => g.value),
  };
}

// languages almi-ai can produce text for
export const AI_LANGS = ["EN", "RU"];
