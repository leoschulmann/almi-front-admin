import { Expose } from "class-transformer";

export class Gizrah {
  readonly id: number;

  @Expose({ name: "g" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, name?: string, version?: number) {
    this.id = id ?? 0;
    this.value = name ?? "";
    this.version = version ?? 0;
  }
}
