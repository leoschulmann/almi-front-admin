import { Expose } from "class-transformer";

export type GrammaticalGender = "NONE" | "MASCULINE" | "FEMININE";

export type GrammaticalPerson = "NONE" | "FIRST" | "SECOND" | "THIRD";

export type Plurality = "SINGULAR" | "PLURAL" | "NONE";

export type Tense = "PRESENT" | "PAST" | "FUTURE" | "IMPERATIVE" | "INFINITIVE";

export class Binyan {
  readonly id: number;

  @Expose({ name: "b" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, value?: string, version?: number) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
  }
}

export class Gizrah {
  readonly id: number;

  @Expose({ name: "g" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, name?: string, version?: number) {
    this.id = id ?? 0;
    this.value = name ?? "";
    this.version = version ?? 0;
  }
}

export class Preposition {
  readonly id: number;

  @Expose({ name: "p" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, value?: string, version?: number) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
  }
}


export type TensePerson =
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

export type PluralityGender =
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
