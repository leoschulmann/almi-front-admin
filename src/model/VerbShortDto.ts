import { Expose, Type } from "class-transformer";

export class VerbShortDto {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;
  
  @Expose({ name: "t" })
  @Type(() => Map)
  readonly translations: Map<string, string>;

  constructor(id?: number, value?: string, version?: number, translations?: Map<string, string>) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.translations = translations ?? new Map();
  }
}
