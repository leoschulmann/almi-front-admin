import { Expose } from "class-transformer";
import { Binyan } from "@/model/Binyan.ts";
import { Root } from "@/model/Root.ts";
import { Gizrah } from "@/model/Gizrah.ts";
import { Preposition } from "@/model/Preposition.ts";

export class Verb {
  readonly id: number;

  @Expose({ name: "v" })
  readonly value: string;

  @Expose({ name: "ver" })
  readonly version: number;

  @Expose({ name: "b" })
  readonly binyan: Binyan;

  @Expose({ name: "r" })
  readonly root: Root;

  @Expose({ name: "g" })
  readonly gizrahs: Gizrah[];

  @Expose({ name: "p" })
  readonly prepositions: Preposition[];

  // @Expose({ name: "t" })
  // readonly translations: any;

  constructor(
    id?: number,
    value?: string,
    version?: number,
    binyan?: Binyan,
    root?: Root,
    gizrahs?: Gizrah[],
    prepositions?: Preposition[],
  ) {
    this.id = id ?? 0;
    this.value = value ?? "";
    this.version = version ?? 0;
    this.binyan = binyan ?? new Binyan();
    this.root = root ?? new Root();
    this.gizrahs = gizrahs ?? [];
    this.prepositions = prepositions ?? [];
  }
}
