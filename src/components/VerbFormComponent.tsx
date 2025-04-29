import { VerbForm } from "@/model/VerbForm.ts";
import { Tense } from "@/model/Tense.ts";
import { getIcon, TupleForTenses } from "@/util/VerbFormCombinator.ts";

export function VerbFormComponent({
  vform,
  tense,
  template,
}: {
  vform: VerbForm | undefined;
  tense: Tense;
  template: TupleForTenses;
}) {
  return vform ? (
    <li
      key={`${vform.tense}${vform.gender}${vform.person}${vform.plurality}`}
      className="flex items-center gap-3"
    > 
      <img
        src={getIcon(vform.gender, vform.person, vform.plurality)}
        className="w-6 h-6"
        alt={`gender: ${vform.gender}, person: ${vform.person}, plurality: ${vform.plurality}`}
      ></img>
      <span className="font-rubik font-semibold text-xl">{vform.value}</span>
      {vform.transliterations.map((t) => t.lang + ":" + t.value).join(", ")}
    </li>
  ) : (
    <li
      key={`${tense}${template.gender}${template.person}${template.plurality}`}
      className="flex items-center gap-3"
    >
      <img
        src={getIcon(template.gender, template.person, template.plurality)}
        className="w-6 h-6"
        alt={`gender: ${template.gender}, person: ${template.person}, plurality: ${template.plurality}`}
      ></img>
      Missing verb form for {template.person}, {template.gender},{" "}
      {template.plurality} {template.optional ? "[optional]" : ""}
    </li>
  );
}
