import { GrammaticalGender } from "@/model/GrammaticalGender.ts";
import { GrammaticalPerson } from "@/model/GrammaticalPerson.ts";
import { Plurality } from "@/model/Plurality.ts";
import { Tense } from "@/model/Tense.ts";

export class TupleForTenses {
  constructor(
    readonly gender: GrammaticalGender,
    readonly person: GrammaticalPerson,
    readonly plurality: Plurality,
    readonly optional: boolean = false,
  ) {}
}

export function getForTense(tense: Tense): TupleForTenses[] {
  switch (tense) {
    case "PRESENT":
      return [
        new TupleForTenses("MASCULINE", "NONE", "SINGULAR"),
        new TupleForTenses("FEMININE", "NONE", "SINGULAR"),
        new TupleForTenses("MASCULINE", "NONE", "PLURAL"),
        new TupleForTenses("FEMININE", "NONE", "PLURAL"),
      ];
    case "PAST":
      return [
        new TupleForTenses("NONE", "FIRST", "SINGULAR"),
        new TupleForTenses("NONE", "FIRST", "PLURAL"),

        new TupleForTenses("MASCULINE", "SECOND", "SINGULAR"),
        new TupleForTenses("FEMININE", "SECOND", "SINGULAR"),
        new TupleForTenses("MASCULINE", "SECOND", "PLURAL"),
        new TupleForTenses("FEMININE", "SECOND", "PLURAL"),

        new TupleForTenses("MASCULINE", "THIRD", "SINGULAR"),
        new TupleForTenses("FEMININE", "THIRD", "SINGULAR"),
        new TupleForTenses("NONE", "THIRD", "PLURAL"),
      ];
    case "FUTURE":
      return [
        new TupleForTenses("NONE", "FIRST", "SINGULAR"),
        new TupleForTenses("NONE", "FIRST", "PLURAL"),

        new TupleForTenses("MASCULINE", "SECOND", "SINGULAR"),
        new TupleForTenses("FEMININE", "SECOND", "SINGULAR"),
        new TupleForTenses("MASCULINE", "SECOND", "PLURAL"),
        new TupleForTenses("FEMININE", "SECOND", "PLURAL", true),

        new TupleForTenses("MASCULINE", "THIRD", "SINGULAR"),
        new TupleForTenses("FEMININE", "THIRD", "SINGULAR"),
        new TupleForTenses("MASCULINE", "THIRD", "PLURAL"),
        new TupleForTenses("FEMININE", "THIRD", "PLURAL", true),
      ];
    case "IMPERATIVE":
      return [
        new TupleForTenses("MASCULINE", "NONE", "SINGULAR"),
        new TupleForTenses("FEMININE", "NONE", "SINGULAR"),
        new TupleForTenses("MASCULINE", "NONE", "PLURAL"),
        new TupleForTenses("FEMININE", "NONE", "PLURAL", true),
      ];
    case "INFINITIVE":
      return [new TupleForTenses("NONE", "NONE", "NONE")];
  }
}

export function getIcon(
  gender: GrammaticalGender,
  person: GrammaticalPerson,
  plurality: Plurality,
): string {
  if (person === "FIRST") {
    return plurality === "PLURAL"
      ? "/svg/first-pl-o.svg"
      : "/svg/first-sing-o.svg";
  }

  if (person === "SECOND") {
    if (plurality === "PLURAL") {
      return gender === "FEMININE"
        ? "/svg/sec-pl-fem-o.svg"
        : "/svg/sec-pl-masc-o.svg";
    }
    return gender === "FEMININE"
      ? "/svg/sec-sing-fem-o.svg"
      : "/svg/sec-sing-masc-o.svg";
  }

  if (person === "THIRD") {
    if (plurality === "PLURAL") {
      if (gender === "NONE") {
        return "/svg/third-pl-o.svg";
      }
      return gender === "FEMININE"
        ? "/svg/third-pl-fem-o.svg"
        : "/svg/third-pl-masc-o.svg";
    }
    return gender === "FEMININE"
      ? "/svg/third-sing-fem-o.svg"
      : "/svg/third-sing-masc-o.svg";
  }

  if (person === "NONE") {
    if (plurality === "SINGULAR") {
      return gender === "FEMININE"
        ? "/svg/sec-sing-fem-o.svg"
        : "/svg/sec-sing-masc-o.svg";
    }
    if (plurality === "PLURAL") {
      return gender === "FEMININE"
        ? "/svg/sec-pl-fem-o.svg"
        : "/svg/sec-pl-masc-o.svg";
    }
  }

  return "/svg/inf.svg";
}
