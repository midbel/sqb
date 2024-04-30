import { type Sql } from "./commons";

export class Merge implements Sql {
	sql(): string {
		return "merge";
	}
}
