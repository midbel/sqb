import { type Sql, SqlElement, isSql } from "./commons";
import { Binary } from "./predicate";

export class Update implements Sql {
	static update(table: SqlElement): Update {
		return new Update(table);
	}

	table: SqlElement;
	columns: Array<SqlElement>;
	values: Array<SqlElement>;
	wheres: Array<SqlElement>;

	constructor(table: SqlElement) {
		this.table = table;
		this.columns = [];
		this.values = [];
		this.wheres = [];
	}

	set(field: SqlElement, value: SqlElement): Update {
		this.columns.push(field);
		this.values.push(value);
		return this;
	}

	where(field: SqlElement | Array<SqlElement>): Update {
		const fs = Array.isArray(field) ? field : [field];
		this.wheres = this.wheres.concat(
			fs.map((f) => (isSql(f) ? f : Binary.eq(f))),
		);
		return this;
	}

	sql(): string {
		const query: Array<string> = ["update", toStr(this.table), "set"];
		if (this.wheres.length) {
			const wheres = this.wheres.map(toStr);
			query.push("where");
			query.push(wheres.join(" and "));
		}
		return query.join(" ");
		return query.join(" ");
	}
}
