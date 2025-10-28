import { Expose, Type } from "class-transformer";

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

export class RootPage {
  @Type(() => Root)
  content!: Root[];
  page!: number;
  size!: number;
  totalElements!: number;
  totalPages!: number;
}

export class EditRootDto {
  id: number;

  @Expose({ name: "r" })
  value: string;

  constructor(id?: number, value?: string) {
    this.id = id ?? -1;
    this.value = value ?? "";
  }
}
