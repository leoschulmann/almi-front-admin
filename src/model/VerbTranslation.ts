import { Expose } from "class-transformer";

export class VerbTranslation {
  // @Expose()
  readonly id: number;

  @Expose({ name: "t" })
  value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "l" })
  lang: string;

  constructor(id?: number, value?: string, version?: number, lang?: string) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.lang = lang ?? "EN";
  }
}

export class CreateVerbTranslation {
  @Expose({ name: "t" })
  value: string;

  @Expose({ name: "l" })
  lang: string;

  constructor(value?: string, lang?: string) {
    this.value = value ?? "";
    this.lang = lang ?? "EN";
  }
}
