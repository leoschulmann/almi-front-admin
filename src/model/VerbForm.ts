import { Expose, Type } from "class-transformer";
import { Transliteration } from "@/model/Transliteration.ts";
import type { Tense } from "@/model/Tense.ts";
import type { GrammaticalPerson } from "@/model/GrammaticalPerson.ts";
import type { Plurality } from "@/model/Plurality.ts";
import type { GrammaticalGender } from "@/model/GrammaticalGender.ts";

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
  @Type(() => Transliteration)
  readonly transliterations: Transliteration[];

  constructor(
    id?: number,
    value?: string,
    version?: number,
    tense?: Tense,
    person?: GrammaticalPerson,
    plurality?: Plurality,
    gender?: GrammaticalGender,
    transliterations?: Transliteration[],
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
