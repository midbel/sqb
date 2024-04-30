import {
	type Sql,
	type SqlElement,
	isSql,
	With,
	Table,
	Alias,
} from "./commons";
import { Filter } from "./predicate";
import { toStr } from "./helpers";
import { placeholder } from "./literal";
import { type Select, Join } from "./select";

export class Update implements Sql {
	static update(table: SqlElement): Update {
		return new Update(table);
	}

	_target: Sql;
	_joins: Array<Sql>;
	_columns: Array<SqlElement>;
	_values: Array<SqlElement>;
	_where: Filter;
	_with: With;

	constructor(table: SqlElement) {
		const target: Sql =
			typeof table === "string" ? Table.make(table, "") : table;
		if (target instanceof Alias) {
			if (typeof target.name === "string") {
				target.name = Table.make(target.name);
			}
		}
		if (!Table.asTable(target)) {
			throw new Error(`select: ${table} can not be used as table expression`);
		}
		this._target = target;
		this._joins = [];
		this._columns = [];
		this._values = [];
		this._where = Filter.where();
		this._with = new With();
	}

	with(cte: Sql): Update {
		this._with.append(cte);
		return this;
	}

	join(table: string | Join): Update {
		const tb = typeof table === "string" ? Join.inner(table) : table;
		this._joins.push(tb);
		return this;
	}

	set(field: SqlElement, value?: SqlElement): Update {
		this._columns.push(field);
		this._values.push(value || placeholder());
		return this;
	}

	where(field: SqlElement | Array<SqlElement>): Update {
		this._where.add(field);
		return this;
	}

	sql(): string {
		if (
			this._values.length > 0 &&
			this._columns.length !== this._values.length
		) {
			throw new Error("update: number of columns/values mismatched");
		}
		if (this._joins.length) {
			return this.#updateJoins();
		}
		return this.#updateValues();
	}

	#updateJoins(): string {
		const query: Array<string> = [];
		if (this._with.count) {
			query.push(this._with.sql());
		}
		query.push("update");
		if (this._target instanceof Alias) {
			query.push(this._target.alias);
		} else {
			query.push(this._target.sql());
		}
		query.push("set");
		const fields: Array<string> = this._columns.map(
			(c: SqlElement, i: number) => {
				return `${toStr(c)}=${toStr(this._values[i])}`;
			},
		);
		query.push(fields.join(", "));
		query.push("from");
		query.push(this._target.sql());
		if (this._joins.length) {
			const joins = this._joins.map((j) => j.sql());
			query.push(joins.join(" "));
		}
		if (this._where.count) {
			query.push(this._where.sql());
		}
		return query.join(" ");
	}

	#updateValues(): string {
		const query: Array<string> = [];
		if (this._with.count) {
			query.push(this._with.sql());
		}
		query.push("update");
		query.push(this._target.sql());
		query.push("set");
		const fields: Array<string> = this._columns.map(
			(c: SqlElement, i: number) => {
				return `${toStr(c)}=${toStr(this._values[i])}`;
			},
		);
		query.push(fields.join(", "));
		if (this._where.count) {
			query.push(this._where.sql());
		}
		return query.join(" ");
	}
}
