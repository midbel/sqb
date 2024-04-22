import { type Sql, type SqlElement, isSql, wrap } from "./commons";
import { Binary } from "./predicate";
import { toStr } from "./helpers";

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

	sql(): string {
		return [this.left.sql(), this.type, this.all ? "all" : "", this.right.sql()]
			.filter((s: string) => s)
			.join(" ");
	}
}

export class Order implements Sql {
	static asc(field: SqlElement): Sql {
		return new Order(field, "asc");
	}

	static desc(field: SqlElement): Sql {
		return new Order(field, "desc");
	}

	field: SqlElement;
	dir: string;

	constructor(field: SqlElement, dir = "") {
		this.field = field;
		this.dir = dir ? dir : "asc";
	}

	sql(): string {
		return `${toStr(this.field)} ${this.dir}`;
	}
}

export class Select implements Sql {
	static from(table: SqlElement): Select {
		return new Select(table);
	}

	table: SqlElement;
	uniq: boolean;
	limit?: SqlElement;
	offset?: SqlElement;
	fields: Array<SqlElement>;
	joins: Array<SqlElement>;
	wheres: Array<SqlElement>;
	groups: Array<SqlElement>;
	havings: Array<SqlElement>;
	orders: Array<SqlElement>;

	constructor(table: SqlElement) {
		this.table = wrap(table);
		this.uniq = false;
		this.joins = [];
		this.fields = [];
		this.groups = [];
		this.havings = [];
		this.orders = [];
		this.wheres = [];
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
		const fs = Array.isArray(field) ? field : [field];
		this.wheres = this.wheres.concat(
			fs.map((f) => (isSql(f) ? f : Binary.eq(f))),
		);
		return this;
	}

	having(field: SqlElement | Array<SqlElement>): Select {
		const fs = Array.isArray(field) ? field : [field];
		this.havings = this.havings.concat(
			fs.map((f) => (isSql(f) ? f : Binary.eq(f))),
		);
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

	at(offset: SqlElement): Select {
		this.offset = offset;
		return this;
	}

	count(limit: SqlElement): Select {
		this.limit = limit;
		return this;
	}

	sql(): string {
		if (!this.fields.length) {
			this.fields.push("*");
		}
		const fields = this.fields.map(toStr);

		const query: Array<string> = ["select"];
		if (this.uniq) {
			query.push("distinct");
		}
		query.push(fields.join(", "));
		query.push("from");
		query.push(toStr(this.table));

		if (this.joins.length) {
			const joins = this.joins.map(toStr);
			query.push(joins.join(" "));
		}

		if (this.wheres.length) {
			const wheres = this.wheres.map(toStr);
			query.push("where");
			query.push(wheres.join(" and "));
		}

		if (this.groups.length) {
			const groups = this.groups.map(toStr);
			query.push("group by");
			query.push(groups.join(", "));
		}

		if (this.orders.length) {
			const orders = this.orders.map(toStr);
			query.push("order by");
			query.push(orders.join(", "));
		}

		if (this.limit) {
			query.push("limit");
			query.push(toStr(this.limit));
		}

		if (this.offset) {
			query.push("offset");
			query.push(toStr(this.offset));
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
