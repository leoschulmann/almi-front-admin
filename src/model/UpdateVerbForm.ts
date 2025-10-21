import { Expose } from "class-transformer";

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
