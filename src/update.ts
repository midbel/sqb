import { type Sql, type SqlElement, isSql, With } from "./commons";
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
	sub: With;

	constructor(table: SqlElement) {
		this.table = table;
		this.columns = [];
		this.values = [];
		this.wheres = [];
		this.sub = new With();
	}

	with(cte: Sql): Update {
		this.sub.append(cte);
		return this;
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
		if (this.values.length > 0 && this.columns.length !== this.values.length) {
			throw new Error("update: number of columns/values mismatched");
		}

		const query: Array<string> = [];
		if (this.sub.count) {
			query.push(this.sub.sql());
		}
		query.push("update");
		query.push(toStr(this.table));
		query.push("set");
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
