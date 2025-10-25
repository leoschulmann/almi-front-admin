import { Expose } from "class-transformer";

export class EditRootDto {
  id: number;

  @Expose({ name: "r" })
  value: string;

  constructor(id?: number, value?: string) {
    this.id = id ?? -1;
    this.value = value ?? "";
  }
}
