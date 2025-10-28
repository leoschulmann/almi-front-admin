import { Expose, Type } from "class-transformer";
import { Binyan, Gizrah, Preposition } from "@/model/VerbParameters.ts";
import { CreateVerbTranslation, VerbTranslation } from "@/model/VerbTranslation.ts";
import { z } from "zod";
import { Root } from "@/model/Root.ts";

export class Verb {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "b" })
  readonly binyan: Binyan;

  @Expose({ name: "r" })
  readonly root: Root;

  @Expose({ name: "g" })
  readonly gizrahs: Gizrah[];

  @Expose({ name: "p" })
  readonly prepositions: Preposition[];

  @Expose({ name: "t" })
  @Type(() => VerbTranslation)
  readonly translations: VerbTranslation[];

  constructor(
    id?: number,
    value?: string,
    version?: number,
    binyan?: Binyan,
    root?: Root,
    gizrahs?: Gizrah[],
    prepositions?: Preposition[],
    translations?: VerbTranslation[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.binyan = binyan ?? new Binyan();
    this.root = root ?? new Root();
    this.gizrahs = gizrahs ?? [];
    this.prepositions = prepositions ?? [];
    this.translations = translations ?? [];
  }
}

export class CreateVerbDto {
  @Expose({ name: "v" })
  value: string;

  @Expose({ name: "r" })
  rootId: number;

  @Expose({ name: "b" })
  binyanId: number;

  @Expose({ name: "g" })
  gizrahId: number[];

  @Expose({ name: "p" })
  prepositionId: number[];

  @Expose({ name: "t" })
  @Type(() => CreateVerbTranslation)
  translations: CreateVerbTranslation[];

  constructor(
    value?: string,
    rootId?: number,
    binyanId?: number,
    gizrahId?: number[],
    prepositionId?: number[],
    translations?: CreateVerbTranslation[],
  ) {
    this.value = value ?? "";
    this.rootId = rootId ?? 0;
    this.binyanId = binyanId ?? 0;
    this.gizrahId = gizrahId ?? [];
    this.prepositionId = prepositionId ?? [];
    this.translations = translations ?? [];
  }
}

export const createVerbSchema = z.object({
  value: z
    .string()
    .min(2, "value must be at least 2 characters long")
    .max(255, "value must be at most 255 characters long")
    .regex(/^[\u0590-\u05FF]+$/, "only hebrew characters are allowed"),

  rootId: z
    .number()
    .min(0, "rootId must be > 0")
    .max(1000, "rootId must be < 1000"),

  binyanId: z.number().min(1, "binyanId required"),
  gizrahId: z.array(z.number()),
  prepositionId: z.array(z.number()),
  translations: z.array(
    z.object({
      value: z.string(),
      lang: z.string(),
    }),
  ),
});

export type CreateVerbType = z.infer<typeof createVerbSchema>;

export class VerbShortDto {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "t" })
  @Type(() => VerbTranslation)
  readonly translations: VerbTranslation[];

  constructor(
    id?: number,
    value?: string,
    version?: number,
    translations?: VerbTranslation[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.translations = translations ?? [];
  }
}

export class EditVerbDto {
  id: number;

  @Expose({ name: "v" })
  value: string;

  constructor(id?: number, value?: string) {
    this.id = id ?? -1;
    this.value = value ?? "";
  }
}
