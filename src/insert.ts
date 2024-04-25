import { type Sql, type SqlElement, isSql, With } from "./commons";
import type { Select } from "./select";
import { placeholder } from "./literal";
import { toStr } from "./helpers";

export class Insert implements Sql {
	static into(table: SqlElement): Insert {
		return new Insert(table);
	}

	table: SqlElement;
	query: Select | undefined;
	columns: Array<SqlElement>;
	values: Array<SqlElement>;
	sub: With;

	constructor(table: SqlElement) {
		this.table = table;
		this.query = undefined;
		this.columns = [];
		this.values = [];
		this.sub = new With();
	}

	with(cte: Sql): Insert {
		this.sub.append(cte);
		return this;
	}

	select(query: Select): Insert {
		this.query = query;
		return this;
	}

	set(field: SqlElement, value: SqlElement): Insert {
		this.columns.push(field);
		this.values.push(value);
		return this;
	}

	column(name: SqlElement | Array<SqlElement>): Insert {
		const cs = Array.isArray(name) ? name : [name];
		this.columns = this.columns.concat(cs);
		return this;
	}

	value(value: SqlElement | Array<SqlElement>): Insert {
		const vs = Array.isArray(value) ? value : [value];
		this.values = this.values.concat(vs);
		return this;
	}

	sql(): string {
		if (this.columns.length === 0 && this.values.length === 0 && !this.query) {
			throw new Error("insert: missing values/query");
		}
		const query = this.query ? this.insertQuery() : this.insertValues();
		if (this.sub.count) {
			return `${this.sub.sql()} ${query}`;
		}
		return query;
	}

	private insertQuery(): string {
		const columns = this.columns.map(toStr);
		return `insert into ${toStr(this.table)} (${columns.join(
			", ",
		)}) ${this.query?.sql()}`;
	}

	private insertValues(): string {
		if (this.values.length > 0 && this.columns.length !== this.values.length) {
			throw new Error("insert: number of columns/values mismatched");
		}
		const columns = this.columns.map(toStr);
		let values = [];
		if (this.values.length) {
			values = this.values.map(toStr);
		} else {
			values = this.columns.map(() => placeholder());
		}
		return `insert into ${toStr(this.table)} (${columns.join(
			", ",
		)}) values (${values.join(", ")})`;
	}
}
