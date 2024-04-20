import { type Sql, type SqlElement, isSql } from "./commons";
import { Binary } from "./predicate";
import { toStr } from "./helpers";

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
		if (this.values.length > 0 && this.columns.length !== this.values.length) {
			throw new Error("update: number of columns/values mismatched");
		}
		const fields: Array<string> = this.columns.map(
			(c: SqlElement, i: number) => {
				return `${toStr(c)}=${toStr(this.values[i])}`;
			},
		);
		query.push(fields.join(", "));
		if (this.wheres.length) {
			const wheres = this.wheres.map(toStr);
			query.push("where");
			query.push(wheres.join(" and "));
		}
		return query.join(" ");
	}
}
