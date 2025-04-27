import { Expose } from "class-transformer";

export class VerbTranslation {
 
  // @Expose()
  readonly id: number;
 
  @Expose({name: "t"})
  readonly value: string;
 
  @Expose({ name: "ver"})
  readonly version: number;
 
  @Expose({ name: "l"})
  readonly lang: string;

  constructor(id?: number, value?: string, version?: number, lang?: string) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.lang = lang ?? 'EN';
  }
}
