import { type Sql, type SqlElement, isSql, With } from "./commons";
import { Filter } from "./predicate";
import { toStr } from "./helpers";
import { placeholder } from "./literal";

export class Update implements Sql {
	static update(table: SqlElement): Update {
		return new Update(table);
	}

	table: SqlElement;
	columns: Array<SqlElement>;
	values: Array<SqlElement>;
	_where: Filter;
	sub: With;

	constructor(table: SqlElement) {
		this.table = table;
		this.columns = [];
		this.values = [];
		this._where = Filter.where();
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
		this._where.add(field);
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
		if (this._where.count) {
			query.push(this._where.sql());
		}
		return query.join(" ");
	}
}
