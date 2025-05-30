import { Expose } from "class-transformer";

export class EditVerbDto {
  id: number;

  @Expose({ name: "ver" })
  version: number;

  @Expose({ name: "v" })
  value: string;

  constructor(id?: number, version?: number, value?: string) {
    this.id = id ?? -1;
    this.version = version ?? -1;
    this.value = value ?? "";
  }
}
