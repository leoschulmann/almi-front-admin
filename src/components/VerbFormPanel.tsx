import { useSelectedVerb } from "@/ctx/SelectedVerbCtx.tsx";
import { useEffect, useState } from "react";
import { getDataVector } from "@/util/ApiClient.ts";
import { Verb } from "@/model/Verb.ts";
import { renderSkeleton } from "@/utils.tsx";

export function VerbFormPanel() {
  const { verb } = useSelectedVerb();
  const [isLoading, setLoading] = useState(false);
  const [verbs, setVerbs] = useState<Verb[]>([]);

  async function fetchVerbForms(verbId: number) {
    setLoading(true);

    try {
      const verbs: Verb[] = await getDataVector("verb/form", Verb, {
        searchParams: { verb_id: verbId },
      });
      setVerbs(verbs);
    } catch (error) {
      console.error("Error loading data:", error);
      setVerbs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (verb) {
      void fetchVerbForms(verb.id);
    }
  }, [verb]);

  return (
    <div>
      {!verb
        ? "select a verb"
        : isLoading
          ? renderSkeleton(15)
          : verbs.length > 0
            ? verbs.map((verb) => <div>{verb.value}</div>)
            : "no forms"}
    </div>
  );
}
