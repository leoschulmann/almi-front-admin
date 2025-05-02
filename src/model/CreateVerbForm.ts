import { GrammaticalPerson } from "@/model/GrammaticalPerson.ts";
import { GrammaticalGender } from "@/model/GrammaticalGender.ts";
import { Tense } from "@/model/Tense.ts";
import { Plurality } from "@/model/Plurality.ts";
import { Expose } from "class-transformer";

export class CreateVerbForm {
  @Expose({ name: "v_id" })
  verbId: number;

  @Expose({ name: "v" })
  value: string;

  @Expose({ name: "t" })
  tenseAndPerson: TensePerson;

  @Expose({ name: "p" })
  pluralityGender: PluralityGender;

  @Expose({ name: "ts" }) //todo make this a list of objects
  transliterations: Array<{
    first: string;
    second: string;
  }>;

  constructor(
    verbId?: number,
    value?: string,
    tenseAndPerson?: TensePerson,
    pluralityGender?: PluralityGender,
    transliterations?: Array<{
      first: string;
      second: string;
    }>,
  ) {
    this.verbId = verbId ?? 0;
    this.value = value ?? "";
    this.tenseAndPerson = tenseAndPerson ?? "INFINITIVE";
    this.pluralityGender = pluralityGender ?? "NONE";
    this.transliterations = transliterations ?? [];
  }
}

type TensePerson =
  | "INFINITIVE"
  | "PRESENT"
  | "PAST_FIRST_PERSON"
  | "PAST_SECOND_PERSON"
  | "PAST_THIRD_PERSON"
  | "FUTURE_FIRST_PERSON"
  | "FUTURE_SECOND_PERSON"
  | "FUTURE_THIRD_PERSON"
  | "IMPERATIVE";

export function toTensePerson(
  tense: Tense,
  person: GrammaticalPerson,
): TensePerson {
  switch (tense) {
    case "INFINITIVE":
      return "INFINITIVE";
    case "PRESENT":
      return "PRESENT";
    case "IMPERATIVE":
      return "IMPERATIVE";
    case "PAST":
      switch (person) {
        case "FIRST":
          return "PAST_FIRST_PERSON";
        case "SECOND":
          return "PAST_SECOND_PERSON";
        case "THIRD":
          return "PAST_THIRD_PERSON";
        default:
          throw new Error("Invalid person for past tense");
      }
    case "FUTURE":
      switch (person) {
        case "FIRST":
          return "FUTURE_FIRST_PERSON";
        case "SECOND":
          return "FUTURE_SECOND_PERSON";
        case "THIRD":
          return "FUTURE_THIRD_PERSON";
        default:
          throw new Error("Invalid person for future tense");
      }
  }
}

type PluralityGender =
  | "NONE"
  | "SINGULAR_MASCULINE"
  | "SINGULAR_FEMININE"
  | "SINGULAR_NOGENDER"
  | "PLURAL_MASCULINE"
  | "PLURAL_FEMININE"
  | "PLURAL_NOGENDER";

export function toPluralityGender(
  plurality: Plurality,
  gender: GrammaticalGender,
): PluralityGender {
  if (plurality === "NONE" && gender === "NONE") {
    return "NONE";
  }

  if (plurality === "SINGULAR") {
    switch (gender) {
      case "MASCULINE":
        return "SINGULAR_MASCULINE";
      case "FEMININE":
        return "SINGULAR_FEMININE";
      case "NONE":
        return "SINGULAR_NOGENDER";
    }
  }

  if (plurality === "PLURAL") {
    switch (gender) {
      case "MASCULINE":
        return "PLURAL_MASCULINE";
      case "FEMININE":
        return "PLURAL_FEMININE";
      case "NONE":
        return "PLURAL_NOGENDER";
    }
  }

  throw new Error("Invalid plurality and gender combination");
}
