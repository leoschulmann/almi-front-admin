import { Expose, Type } from "class-transformer";
import type {
  GrammaticalGender,
  GrammaticalPerson,
  Plurality,
  Tense,
} from "@/model/VerbParameters.ts";
import { z } from "zod";
import { CreateVerbTranslation } from "@/model/VerbTranslation.ts";

export class VFormExample {
  readonly id: number;

  @Expose({ name: "e" })
  readonly value: string;

  @Expose({ name: "t" })
  readonly tense: Tense;

  @Expose({ name: "p" })
  readonly person: GrammaticalPerson;

  @Expose({ name: "pl" })
  readonly plurality: Plurality;

  @Expose({ name: "g" })
  readonly gender: GrammaticalGender;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "f" })
  readonly file?: string | null;

  @Expose({ name: "tr" })
  @Type(() => VFormExampleTr8n)
  readonly translations: VFormExampleTr8n[];

  constructor(
    id?: number,
    value?: string,
    tense?: Tense,
    person?: GrammaticalPerson,
    plurality?: Plurality,
    gender?: GrammaticalGender,
    version?: number,
    file?: string | null,
    translations?: VFormExampleTr8n[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.tense = tense ?? "INFINITIVE";
    this.person = person ?? "NONE";
    this.plurality = plurality ?? "NONE";
    this.gender = gender ?? "NONE";
    this.version = version ?? 0;
    this.file = file;
    this.translations = translations ?? [];
  }
}

export class VFormExampleTr8n {
  readonly id: number;

  @Expose({ name: "t" })
  readonly value: string;

  @Expose({ name: "l" })
  readonly lang: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, value?: string, lang?: string, version?: number) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.lang = lang ?? "EN";
    this.version = version ?? 0;
  }
}

export class CreateVFormExampleDto {
  @Expose({ name: "f_id" })
  verbFormId: number;

  @Expose({ name: "e" })
  value: string;

  @Expose({ name: "f" })
  file?: string | null;

  @Expose({ name: "tr" })
  @Type(() => CreateVerbTranslation)
  translations: CreateVerbTranslation[];

  constructor(
    verbFormId?: number,
    value?: string,
    file?: string | null,
    translations?: CreateVerbTranslation[],
  ) {
    this.verbFormId = verbFormId ?? 0;
    this.value = value ?? "";
    this.file = file;
    this.translations = translations ?? [];
  }
}

export const createVFormExampleDtoSchema = z.object({
  verbFormId: z.number().min(1, "verbFormId required"),
  value: z
    .string()
    .min(5, "value must be at least 5 characters long")
    .max(255, "value must be at most 255 characters long"),
  file: z.string().optional().nullable(),
  translations: z.array(
    z.object({
      value: z.string(),
      lang: z.string(),
    }),
  ),
});
