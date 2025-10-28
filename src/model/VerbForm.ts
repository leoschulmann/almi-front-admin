import { Expose, Type } from "class-transformer";
import type {
  GrammaticalGender,
  GrammaticalPerson,
  Plurality,
  PluralityGender,
  Tense,
  TensePerson,
} from "@/model/VerbParameters.ts";
import { UpdateVerbFormTransliteration, UpsertVFormTranslitDto, VFormTransliteration } from "@/model/VFormTransliteration.ts";

export class VerbForm {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "t" })
  readonly tense: Tense;

  @Expose({ name: "p" })
  readonly person: GrammaticalPerson;

  @Expose({ name: "pl" })
  readonly plurality: Plurality;

  @Expose({ name: "g" })
  readonly gender: GrammaticalGender;

  @Expose({ name: "ts" })
  @Type(() => VFormTransliteration)
  readonly transliterations: VFormTransliteration[];

  constructor(
    id?: number,
    value?: string,
    version?: number,
    tense?: Tense,
    person?: GrammaticalPerson,
    plurality?: Plurality,
    gender?: GrammaticalGender,
    transliterations?: VFormTransliteration[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.tense = tense ?? "INFINITIVE"
    this.person = person ?? "NONE";
    this.plurality = plurality ?? "NONE";
    this.gender = gender ?? "NONE";
    this.transliterations = transliterations ?? [];
  }
}

export class UpdateVerbForm {
  id: number;

  @Expose({ name: "v" })
  value: string;

  @Expose({ name: "t" })
  upsertTranslits: UpsertVFormTranslitDto[];

  constructor(
    id?: number,
    value?: string,
    upsertTranslits?: UpsertVFormTranslitDto[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.upsertTranslits = upsertTranslits ?? [];
  }
}

export class EditVerbForm {
  id: number;

  @Expose({ name: "ver" })
  version: number;

  @Expose({ name: "v" })
  value: string;

  @Expose({ name: "cts" })
  createTransliterations: Array<{
    first: string;
    second: string;
  }>;

  @Expose({ name: "uts" })
  updateTransliterations: UpdateVerbFormTransliteration[];

  constructor(
    id?: number,
    version?: number,
    value?: string,
    createTransliterations?: Array<{
      first: string;
      second: string;
    }>,
    updateTransliterations?: UpdateVerbFormTransliteration[],
  ) {
    this.id = id ?? 0;
    this.version = version ?? 0;
    this.value = value ?? "";
    this.createTransliterations = createTransliterations ?? [];
    this.updateTransliterations = updateTransliterations ?? [];
  }
}

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