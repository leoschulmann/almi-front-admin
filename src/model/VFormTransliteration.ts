import { Expose } from "class-transformer";

export class VFormTransliteration {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  readonly lang: string;
  
  constructor(id?: number, value?: string, version?: number, lang?: string) {
    this.id = id ?? -1;
    this.value = value ?? "";
    this.version = version ?? -1;
    this.lang = lang ?? "EN";
  }
}

export class UpsertVFormTranslitDto {
  id?: number;

  @Expose({ name: "v" })
  value: string;

  lang: string;

  constructor(id?: number, value?: string, lang?: string) {
    this.id = id;
    this.value = value ?? "";
    this.lang = lang ?? "EN";
  }
}

export class UpdateVerbFormTransliteration {
  id: number;

  @Expose({ name: "ver" })
  version: number;

  @Expose({ name: "v" })
  value: string;

  constructor(id?: number, version?: number, value?: string) {
    this.id = id ?? 0;
    this.version = version ?? 0;
    this.value = value ?? "";
  }
}
