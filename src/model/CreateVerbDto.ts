import { Expose, Transform, Type } from "class-transformer";
import { z } from "zod";
import { VerbTranslation } from "@/model/VerbTranslation.ts";

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
  translations: VerbTranslation[];

  constructor(
    value?: string,
    rootId?: number,
    binyanId?: number,
    gizrahId?: number[],
    prepositionId?: number[],
    translations?: VerbTranslation[],
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
      id: z.number(),
      value: z.string(),
      lang: z.string(),
      version: z.number(),
    }),
  ),
});

export type CreateVerbType = z.infer<typeof createVerbSchema>;