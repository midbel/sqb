import {
	type Sql,
	type SqlElement,
	With,
	Table,
	Alias,
	Column,
} from "./commons";
import { Binary } from "./predicate";
import { Literal } from "./literal";

class matched {
	_columns: Array<Sql>;
	_values: Array<Sql>;
	_predicate?: Sql;

	constructor(cs: Array<Sql>, vs: Array<Sql>, ts?: Sql) {
		this._columns = cs;
		this._values = vs;
		this._predicate = ts;
	}

	get asDelete(): string {
		return "delete";
	}

	get asInsert(): string {
		if (this._columns.length !== this._values.length) {
			throw new Error("merge (insert): columns/values number mismatched");
		}
		const query: Array<string> = [];
		query.push("insert");
		query.push(
			`(${this._columns.map((c: Sql): string => c.sql()).join(", ")})`,
		);
		query.push("values");
		query.push(`(${this._values.map((v: Sql): string => v.sql()).join(", ")})`);
		return query.join(" ");
	}

	get asUpdate(): string {
		const query: Array<string> = [];
		query.push("update");
		query.push("set");
		if (this._columns.length !== this._values.length) {
			throw new Error("merge (update): columns/values number mismatched");
		}
		const q = this._columns
			.map((c: Sql, i: number): string => {
				return `${c.sql()}=${this._values[i].sql()}`;
			})
			.join(", ");
		query.push(q);
		return query.join(" ");
	}
}

export class Merge implements Sql {
	static merge(table: SqlElement): Merge {
		return new Merge(table);
	}

	_target: Sql;
	_using: Sql;
	_join: Sql;
	_insert: Array<matched>;
	_delete: Array<matched>;
	_update: Array<matched>;
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
			throw new Error(`merge: ${table} can not be used as table expression`);
		}
		this._target = target;
		this._join = Binary.eq(Literal.numeric(1), Literal.numeric(1));
		this._using = target;
		this._insert = [];
		this._delete = [];
		this._update = [];
		this._with = new With();
	}

	using(table: SqlElement, predicate: Sql): Merge {
		const target: Sql =
			typeof table === "string" ? Table.make(table, "") : table;
		if (target instanceof Alias) {
			if (typeof target.name === "string") {
				target.name = Table.make(target.name);
			}
		}
		if (!Table.asTable(target)) {
			throw new Error(`merge: ${table} can not be used as table expression`);
		}
		this._using = target;
		this._join = predicate;
		return this;
	}

	with(cte: Sql): Merge {
		this._with.append(cte);
		return this;
	}

	delete(predicate?: Sql): Merge {
		this._delete.push(new matched([], [], predicate));
		return this;
	}

	update(
		columns: Array<SqlElement>,
		values?: Array<SqlElement>,
		predicate?: Sql,
	): Merge {
		let vs = values;
		if (!vs || vs.length === 0) {
			vs = columns.map(() => Column.placeholder());
		}
		this._update.push(
			new matched(
				columns.map(
					(c: SqlElement): Sql =>
						typeof c === "string" ? Column.make(c, "") : c,
				),
				vs.map(
					(c: SqlElement): Sql =>
						typeof c === "string" ? Column.make(c, "") : c,
				),
				predicate,
			),
		);
		return this;
	}

	insert(
		columns: Array<SqlElement>,
		values?: Array<SqlElement>,
		predicate?: Sql,
	): Merge {
		let vs = values;
		if (!vs || vs.length === 0) {
			vs = columns.map(() => Column.placeholder());
		}
		this._insert.push(
			new matched(
				columns.map(
					(c: SqlElement): Sql =>
						typeof c === "string" ? Column.make(c, "") : c,
				),
				vs.map(
					(c: SqlElement): Sql =>
						typeof c === "string" ? Column.make(c, "") : c,
				),
				predicate,
			),
		);
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this._with.count > 0) {
			query.push(this._with.sql());
		}
		query.push("merge");
		query.push("into");
		query.push(this._target.sql());
		query.push("using");
		query.push(this._using.sql());
		query.push("on");
		query.push(this._join.sql());
		for (const m of this._insert) {
			query.push("when not matched");
			if (m._predicate) {
				query.push("and");
				query.push(m._predicate.sql());
			}
			query.push("then");
			query.push(m.asInsert);
		}
		for (const m of this._update) {
			query.push("when matched");
			if (m._predicate) {
				query.push("and");
				query.push(m._predicate.sql());
			}
			query.push("then");
			query.push(m.asUpdate);
		}
		for (const m of this._delete) {
			query.push("when matched");
			if (m._predicate) {
				query.push("and");
				query.push(m._predicate.sql());
			}
			query.push("then");
			query.push(m.asDelete);
		}
		return query.join(" ");
	}
}
