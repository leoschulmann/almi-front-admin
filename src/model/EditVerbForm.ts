import { Expose } from "class-transformer";

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
