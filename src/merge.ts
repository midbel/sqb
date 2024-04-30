import { type Sql, type SqlElement, With, Table, Alias } from "./commons";

export class Merge implements Sql {
	static merge(table: SqlElement): Merge {
		return new Merge(table);
	}

	_target: Sql;
	_using: Sql | undefined;
	_with: With;
	_updates: Array<Sql>;
	_inserts: Array<Sql>;
	_deletes: Array<Sql>;

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
		this._updates = [];
		this._deletes = [];
		this._inserts = [];
		this._with = new With();
	}

	using(query: SqlElement, join?: Array<Sql>): Merge {
		return this;
	}

	update(
		fields: Array<Sql>,
		values: Array<Sql>,
		conditions?: Array<Sql>,
	): Merge {
		return this;
	}

	delete(
		fields: Array<Sql>,
		values: Array<Sql>,
		conditions?: Array<Sql>,
	): Merge {
		return this;
	}

	insert(
		fields: Array<Sql>,
		values: Array<Sql>,
		conditions?: Array<Sql>,
	): Merge {
		return this;
	}

	sql(): string {
		return `merge into ${this._target.sql()}`;
	}
}
