import {
	type Sql,
	type SqlElement,
	isSql,
	wrap,
	Order,
	With,
	Cte,
} from "./commons";
import { Filter } from "./predicate";
import { toStr } from "./helpers";
import { placeholder } from "./literal";

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

	table: SqlElement;
	uniq: boolean;
	count?: SqlElement;
	at?: SqlElement;
	sub: With;
	fields: Array<SqlElement>;
	joins: Array<SqlElement>;
	_where: Filter;
	groups: Array<SqlElement>;
	_having: Filter;
	orders: Array<SqlElement>;

	constructor(table: SqlElement) {
		this.table = wrap(table);
		this.uniq = false;
		this.joins = [];
		this.fields = [];
		this._where = Filter.where();
		this.groups = [];
		this._having = Filter.having();
		this.orders = [];
		this.sub = new With();
	}

	get length(): number {
		return this.fields.length;
	}

	cte(name: string): Sql {
		return Cte.make(name, this);
	}

	with(cte: Sql): Select {
		this.sub.append(cte);
		return this;
	}

	join(table: string | Join): Select {
		let tb = table;
		if (!isSql(table)) {
			tb = Join.inner(table);
		}
		this.joins.push(tb);
		return this;
	}

	distinct(): Select {
		this.uniq = !this.uniq;
		return this;
	}

	column(name: SqlElement | Array<SqlElement>): Select {
		const cs = Array.isArray(name) ? name : [name];
		this.fields = this.fields.concat(cs.map(wrap));
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

	offset(at: SqlElement): Select {
		this.at = at;
		return this;
	}

	limit(count: SqlElement): Select {
		this.count = count;
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this.sub.count > 0) {
			query.push(this.sub.sql());
		}
		query.push("select");
		if (!this.fields.length) {
			this.fields.push("*");
		}
		if (this.uniq) {
			query.push("distinct");
		}
		query.push(this.fields.map(toStr).join(", "));
		query.push("from");
		query.push(toStr(this.table));

		if (this.joins.length) {
			const joins = this.joins.map(toStr);
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

	table: SqlElement;
	join: SqlJoinType;
	conditions: Array<SqlElement>;

	constructor(table: SqlElement, type: SqlJoinType) {
		this.table = wrap(table);
		this.join = type;
		this.conditions = [];
	}

	on(cdt: Sql): Join {
		this.conditions.push(wrap(cdt));
		return this;
	}

	sql(): string {
		const joins = this.conditions.map(toStr);
		return `${this.join} join ${toStr(this.table)} on ${joins.join(" and ")}`;
	}
}
