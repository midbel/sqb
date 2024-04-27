import {
	type Sql,
	type SqlElement,
	isSql,
	wrap,
	Order,
	With,
	Cte,
	Table,
	Alias,
	Column,
	WrappedSql,
} from "./commons";
import { Filter } from "./predicate";
import { toStr } from "./helpers";
import { Literal, placeholder } from "./literal";

export enum SqlSetOp {
	Union = "union",
	Intersect = "intersect",
	Except = "except",
}

export class Sets implements Sql {
	static union(q1: Select | Sets, q2: Select | Sets, all = false): Sql {
		return new Sets(SqlSetOp.Union, q1, q2, all);
	}

	static intersect(q1: Select | Sets, q2: Select | Sets, all = false): Sql {
		return new Sets(SqlSetOp.Intersect, q1, q2, all);
	}

	static except(q1: Select | Sets, q2: Select | Sets, all = false): Sql {
		return new Sets(SqlSetOp.Except, q1, q2, all);
	}

	type: SqlSetOp;
	left: Select | Sets;
	right: Select | Sets;
	all: boolean;

	constructor(
		type: SqlSetOp,
		q1: Select | Sets,
		q2: Select | Sets,
		all: boolean,
	) {
		this.type = type;
		this.left = q1;
		this.right = q2;
		this.all = all;
	}

	get length(): number {
		return this.left.length;
	}

	sql(): string {
		if (this.left.length !== this.right.length) {
			throw new Error(
				`${this.type}: number of fields mismatched between queries`,
			);
		}
		return [this.left.sql(), this.type, this.all ? "all" : "", this.right.sql()]
			.filter((s: string) => s)
			.join(" ");
	}
}

export class Select implements Sql {
	static from(table: SqlElement): Select {
		return new Select(table);
	}

	_table: Sql;
	_uniq: boolean;
	count?: SqlElement;
	at?: SqlElement;
	sub: With;
	_fields: Array<Sql>;
	_joins: Array<Sql>;
	_where: Filter;
	groups: Array<SqlElement>;
	_having: Filter;
	orders: Array<SqlElement>;

	constructor(table: SqlElement) {
		let ts: Sql = typeof table === "string" ? Table.make(table, "") : table;
		if (ts instanceof Select) {
			ts = new WrappedSql(ts);
		} else if (ts instanceof Alias) {
			if (typeof ts.name === "string") {
				ts.name = Table.make(ts.name);
			}
		}
		if (!Table.asTable(ts)) {
			throw new Error(`${table} can not be used as table expression`);
		}
		this._table = ts;
		this._uniq = false;
		this._joins = [];
		this._fields = [];
		this._where = Filter.where();
		this.groups = [];
		this._having = Filter.having();
		this.orders = [];
		this.sub = new With();
	}

	get length(): number {
		return this._fields.length;
	}

	cte(name: string): Sql {
		return Cte.make(name, this);
	}

	with(cte: Sql): Select {
		this.sub.append(cte);
		return this;
	}

	join(table: string | Join): Select {
		const tb = typeof table === "string" ? Join.inner(table) : table;
		this._joins.push(tb);
		return this;
	}

	distinct(): Select {
		this._uniq = !this._uniq;
		return this;
	}

	column(name: SqlElement | Array<SqlElement>): Select {
		const prepare = (c: SqlElement): Sql => {
			if (c instanceof Select) {
				return new WrappedSql(c);
			}
			return typeof c === "string" ? Column.make(c, "") : c;
		};
		const cs = Array.isArray(name) ? name : [name];
		this._fields = this._fields.concat(cs.map(prepare));
		return this;
	}

	where(field: SqlElement | Array<SqlElement>): Select {
		this._where.add(field);
		return this;
	}

	eq(field: SqlElement, value?: SqlElement): Select {
		this._where.eq(field, value);
		return this;
	}

	ne(field: SqlElement, value?: SqlElement): Select {
		this._where.ne(field, value);
		return this;
	}

	lt(field: SqlElement, value?: SqlElement): Select {
		this._where.lt(field, value);
		return this;
	}

	le(field: SqlElement, value?: SqlElement): Select {
		this._where.le(field, value);
		return this;
	}

	gt(field: SqlElement, value?: SqlElement): Select {
		this._where.gt(field, value);
		return this;
	}

	ge(field: SqlElement, value?: SqlElement): Select {
		this._where.ge(field, value);
		return this;
	}

	having(field: SqlElement | Array<SqlElement>): Select {
		this._having.add(field);
		return this;
	}

	group(name: SqlElement | Array<SqlElement>): Select {
		const ns = Array.isArray(name) ? name : [name];
		this.groups = this.groups.concat(ns);
		return this;
	}

	order(name: SqlElement | Array<SqlElement>): Select {
		const ns = Array.isArray(name) ? name : [name];
		this.orders = this.orders.concat(ns);
		return this;
	}

	offset(at: SqlElement | number): Select {
		if (typeof at === "number") {
			return this.offset(Literal.numeric(at));
		}
		this.at = at;
		return this;
	}

	limit(count: SqlElement | number): Select {
		if (typeof count === "number") {
			return this.offset(Literal.numeric(count));
		}
		this.count = count;
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this.sub.count > 0) {
			query.push(this.sub.sql());
		}
		query.push("select");
		if (this._uniq) {
			query.push("distinct");
		}
		if (this._fields.length) {
			query.push(this._fields.map((f) => f.sql()).join(", "));
		} else {
			query.push("*");
		}
		query.push("from");
		query.push(this._table.sql());

		if (this._joins.length) {
			const joins = this._joins.map((j) => j.sql());
			query.push(joins.join(" "));
		}

		if (this._where.count) {
			query.push(this._where.sql());
		}

		if (this.groups.length) {
			const groups = this.groups.map(toStr);
			query.push("group by");
			query.push(groups.join(", "));
		}

		if (this._having.count) {
			if (!this.groups.length) {
				throw new Error("select: having used with group by claused");
			}
			query.push(this._having.sql());
		}

		if (this.orders.length) {
			const orders = this.orders.map(toStr);
			query.push("order by");
			query.push(orders.join(", "));
		}

		if (this.count) {
			query.push("limit");
			query.push(toStr(this.count));
		}

		if (this.at) {
			query.push("offset");
			query.push(toStr(this.at));
		}

		return query.join(" ");
	}
}

export enum SqlJoinType {
	Left = "left",
	Right = "right",
	Full = "full",
	Inner = "inner",
	Cross = "cross",
}

export class Join implements Sql {
	static left(table: SqlElement): Join {
		return new Join(table, SqlJoinType.Left);
	}

	static right(table: SqlElement): Join {
		return new Join(table, SqlJoinType.Right);
	}

	static cross(table: SqlElement): Join {
		return new Join(table, SqlJoinType.Cross);
	}

	static full(table: SqlElement): Join {
		return new Join(table, SqlJoinType.Full);
	}

	static inner(table: SqlElement): Join {
		return new Join(table, SqlJoinType.Inner);
	}

	_table: SqlElement;
	_join: SqlJoinType;
	_conditions: Array<SqlElement>;

	constructor(table: SqlElement, type: SqlJoinType) {
		this._table = wrap(table);
		this._join = type;
		this._conditions = [];
	}

	on(cdt: Sql): Join {
		this._conditions.push(wrap(cdt));
		return this;
	}

	sql(): string {
		return [
			this._join,
			"join",
			toStr(this._table),
			"on",
			this._conditions.map(toStr).join(" and "),
		].join(" ");
	}
}
