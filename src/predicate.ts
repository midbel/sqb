import { type Sql, type SqlElement, isSql, wrap } from "./commons";
import { placeholder } from "./literal";
import { toStr } from "./helpers";

export class Where implements Sql {
	list: Array<SqlElement>;

	constructor() {
		this.list = [];
	}

	sql(): string {
		return "";
	}
}

export class Not implements Sql {
	not(q: SqlElement): Sql {
		return new Not(q);
	}

	query: SqlElement;

	constructor(q: SqlElement) {
		this.query = q;
	}

	sql(): string {
		return `not ${toStr(this.query)}`;
	}
}

export enum SqlCmpOp {
	Eq = "=",
	Ne = "<>",
	Lt = "<",
	Le = "<=",
	Gt = ">",
	Ge = ">=",
	Like = "like",
}

export class Binary implements Sql {
	static eq(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Eq, field, value);
	}

	static ne(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Ne, field, value);
	}

	static lt(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Lt, field, value);
	}

	static le(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Le, field, value);
	}

	static gt(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Gt, field, value);
	}

	static ge(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Ge, field, value);
	}

	static like(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(SqlCmpOp.Like, field, value);
	}

	left: SqlElement;
	right: SqlElement;
	op: SqlCmpOp;

	constructor(op: SqlCmpOp, left: SqlElement, right?: SqlElement) {
		this.left = left;
		this.right = right ? wrap(right) : placeholder();
		this.op = op;
	}

	sql(): string {
		return `${toStr(this.left)}${this.op}${toStr(this.right)}`;
	}
}

export class Between implements Sql {
	static between(field: SqlElement, left: SqlElement, right: SqlElement): Sql {
		return new Between(field, left, right);
	}

	static not(field: SqlElement, left: SqlElement, right: SqlElement): Sql {
		return new Between(field, left, right, true);
	}

	field: SqlElement;
	left: SqlElement;
	right: SqlElement;
	not: boolean;

	constructor(
		field: SqlElement,
		left: SqlElement,
		right: SqlElement,
		not = false,
	) {
		this.field = field;
		this.left = left ? wrap(left) : placeholder();
		this.right = right ? wrap(right) : placeholder();
		this.not = not;
	}

	negate(): Sql {
		this.not = !this.not;
		return this;
	}

	sql(): string {
		return [
			toStr(this.field),
			this.not ? "not" : "",
			"between",
			toStr(this.left),
			"and",
			toStr(this.right),
		]
			.filter((i: string) => i)
			.join(" ");
	}
}

export class In implements Sql {
	static contains(field: SqlElement, values: Array<SqlElement>): Sql {
		return new In(field, values);
	}

	static not(field: SqlElement, values: Array<SqlElement>): Sql {
		return new In(field, values, true);
	}

	field: SqlElement;
	values: Array<SqlElement>;
	not: boolean;

	constructor(field: SqlElement, values: Array<SqlElement>, not = false) {
		this.field = field;
		this.not = not;
		this.values = values;
	}

	sql(): string {
		const values = this.values.map(toStr);
		const parts = [
			toStr(this.field),
			this.not ? "not" : "",
			"in",
			`(${values.join(", ")})`,
		];
		return parts.filter((i: string) => i).join(" ");
	}
}

export class Is implements Sql {
	static is(field: SqlElement): Sql {
		return new Is(field);
	}

	static not(field: SqlElement): Sql {
		const i = new Is(field);
		return i.negate();
	}

	not: boolean;
	field: SqlElement;

	constructor(field: SqlElement) {
		this.field = field;
		this.not = false;
	}

	negate(): Sql {
		this.not = !this.not;
		return this;
	}

	sql(): string {
		const parts = [toStr(this.field), "is", this.not ? "not" : "", "null"];
		return parts.filter((i: string) => i).join(" ");
	}
}

export class Exists implements Sql {
	static exists(query: Sql): Sql {
		return new Exists(query);
	}

	query: Sql;

	constructor(query: Sql) {
		this.query = query;
	}

	sql(): string {
		return `exists (${this.query.sql()})`;
	}
}

export enum SqlRelOp {
	And = "and",
	Or = "or",
}

export class Relation implements Sql {
	static and(args: Array<SqlElement>): Sql {
		return new Relation(SqlRelOp.And, args);
	}

	static or(args: Array<SqlElement>): Sql {
		return new Relation(SqlRelOp.Or, args);
	}

	args: Array<SqlElement>;
	op: SqlRelOp;

	constructor(op: SqlRelOp, args: Array<SqlElement>) {
		this.op = op;
		this.args = args;
	}

	sql(): string {
		return this.args.map(wrap).map(toStr).join(` ${this.op} `);
	}
}
