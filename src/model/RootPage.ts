import { Root } from "@/model/Root.ts";
import { Type } from "class-transformer";

export class RootPage {
  @Type(() => Root)
  content!: Root[];
  page!: number;
  size!: number;
  totalElements!: number;
  totalPages!: number;
}
