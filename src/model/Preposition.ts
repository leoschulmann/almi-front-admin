import { Expose } from "class-transformer";

export class Preposition {
  readonly id: number;

  @Expose({ name: "p" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, value?: string, version?: number) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
  }
}
