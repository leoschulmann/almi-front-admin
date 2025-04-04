import { Expose } from "class-transformer";

export class Root {
  @Expose({ name: "id" })
  readonly id: number;

  @Expose({ name: "r" })
  readonly name: string;

  @Expose({ name: "ver" })
  readonly version: number;

  constructor(id?: number, name?: string, version?: number) {
    this.id = id ?? 0;
    this.name = name ?? '';
    this.version = version ?? 1;
  }
}
