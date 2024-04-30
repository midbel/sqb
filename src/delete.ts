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

export class Truncate implements Sql {
	static table(table: SqlElement): Sql {
		return new Truncate(table);
	}

	_target: Sql;

	constructor(table: SqlElement) {
		const target: Sql =
			typeof table === "string" ? Table.make(table, "") : table;
		if (target instanceof Alias) {
			if (typeof target.name === "string") {
				target.name = Table.make(target.name);
			}
		}
		if (!Table.asTable(target)) {
			throw new Error(`truncate: ${table} can not be used as table expression`);
		}
		this._target = target;
	}

	sql(): string {
		return `truncate ${this._target.sql()}`;
	}
}

export class Delete implements Sql {
	static from(table: SqlElement): Delete {
		return new Delete(table);
	}

	_target: Sql;
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
			throw new Error(`delete: ${table} can not be used as table expression`);
		}
		this._target = target;
		this._where = Filter.where();
		this._with = new With();
	}

	where(field: SqlElement | Array<SqlElement>): Delete {
		this._where.add(field);
		return this;
	}

	with(cte: Sql): Delete {
		this._with.append(cte);
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this._with.count) {
			query.push(this._with.sql());
		}
		query.push("delete from");
		query.push(this._target.sql());
		if (this._where.count) {
			query.push(this._where.sql());
		}
		return query.join(" ");
	}
}
