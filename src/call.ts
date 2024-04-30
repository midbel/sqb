import { type Sql } from "./commons";

export class Call implements Sql {
	sql(): string {
		return "call";
	}
}
