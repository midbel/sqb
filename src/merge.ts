import { type Sql, type SqlElement, With, Table, Alias } from "./commons";

export class Merge implements Sql {
	static merge(table: SqlElement): Merge {
		return new Merge(table);
	}

	_target: Sql;
	_using: Sql | undefined;
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
		this._with = new With();
	}

	using(query: SqlElement, join?: Array<Sql>): Merge {
		return this;
	}

	with(cte: Sql): Merge {
		this._with.append(cte);
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this._with.count > 0) {
			query.push(this._with.sql());
		}
		query.push("merge into");
		query.push(this._target.sql());
		query.push("using");
		return query.join(" ");
	}
}
