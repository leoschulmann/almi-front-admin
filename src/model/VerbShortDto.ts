import { Expose, Type } from "class-transformer";
import { VerbTranslation } from "@/model/VerbTranslation.ts";

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
