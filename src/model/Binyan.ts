import {Expose} from "class-transformer";

export class Binyan {
  readonly id: number;

  @Expose({ name: "b" })
  readonly value: string;
  
  @Expose({ name: "ver" })
  readonly version: number;
  
  constructor(id?: number, value?: string, version?: number) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
  }
}
