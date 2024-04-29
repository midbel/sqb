import {
	type Sql,
	type SqlElement,
	isSql,
	Column,
	isHas,
	wrap,
} from "./commons";
import { placeholder } from "./literal";
import { toStr } from "./helpers";

enum SqlFilterType {
	Where = "where",
	Having = "having",
}

export class Filter implements Sql {
	static where(): Filter {
		return new Filter(SqlFilterType.Where);
	}

	static having(): Filter {
		return new Filter(SqlFilterType.Having);
	}

	list: Array<SqlElement>;
	type: SqlFilterType;

	constructor(type: SqlFilterType) {
		this.list = [];
		this.type = type;
	}

	get count(): number {
		return this.list.length;
	}

	has(field: string): boolean {
		return this.list.some((i: SqlElement): boolean => {
			return isHas(i) && i.has(field);
		});
	}

	add(w: SqlElement | SqlElement[]): Filter {
		const ws = Array.isArray(w) ? w : [w];
		this.list = this.list.concat(ws);
		return this;
	}

	eq(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.eq(field, value || placeholder()));
		return this;
	}

	ne(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.ne(field, value || placeholder()));
		return this;
	}

	lt(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.lt(field, value || placeholder()));
		return this;
	}

	le(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.le(field, value || placeholder()));
		return this;
	}

	gt(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.gt(field, value || placeholder()));
		return this;
	}

	ge(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.ge(field, value || placeholder()));
		return this;
	}

	like(field: SqlElement, value?: SqlElement): Filter {
		this.list.push(Binary.like(field, value || placeholder()));
		return this;
	}

	between(field: SqlElement, low: SqlElement, high: SqlElement): Filter {
		this.list.push(Between.between(field, low, high));
		return this;
	}

	isNull(field: SqlElement): Filter {
		this.list.push(Is.is(field));
		return this;
	}

	sql(): string {
		const list = this.list.map(toStr);
		return `${this.type} ${list.join(" and ")}`;
	}
}

// export class Not implements Sql {
// 	static not(q: SqlElement): Sql {
// 		return new Not(q);
// 	}

// 	query: SqlElement;

// 	constructor(q: SqlElement) {
// 		this.query = q;
// 	}

// 	sql(): string {
// 		return `not ${toStr(this.query)}`;
// 	}
// }

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
	static eq(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Eq, field, value);
	}

	static ne(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Ne, field, value);
	}

	static lt(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Lt, field, value);
	}

	static le(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Le, field, value);
	}

	static gt(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Gt, field, value);
	}

	static ge(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Ge, field, value);
	}

	static like(field: SqlElement, value: SqlElement): Sql {
		return new Binary(SqlCmpOp.Like, field, value);
	}

	left: SqlElement;
	right: SqlElement;
	op: SqlCmpOp;

	constructor(op: SqlCmpOp, left: SqlElement, right: SqlElement) {
		this.left = left;
		this.right = right ? wrap(right) : placeholder();
		this.op = op;
	}

	has(field: string): boolean {
		return [this.left, this.right].some((col: SqlElement): boolean => {
			if (col instanceof Column) {
				return col.name === field;
			}
			return (
				(isHas(col) && col.has(field)) ||
				(typeof col === "string" && col === field)
			);
		});
	}

	sql(): string {
		if (this.op === SqlCmpOp.Like) {
			return `${toStr(this.left)} ${this.op} ${toStr(this.right)}`;
		}
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

	get name(): string {
		if (typeof this.field === "string") {
			return this.field;
		}
		if (this.field instanceof Column) {
			return this.field.name;
		}
		return "?";
	}

	has(field: string): boolean {
		return [this.field, this.left, this.right].some(
			(i: SqlElement): boolean => {
				return (
					(isHas(i) && i.has(field)) || (typeof i === "string" && i === field)
				);
			},
		);
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

	get name(): string {
		if (this.field instanceof Column) {
			return this.field.name;
		}
		return typeof this.field === "string" ? this.field : "";
	}

	has(field: string): boolean {
		return (
			this.name === field ||
			this.values.some((i: SqlElement): boolean => {
				if (i instanceof Column) {
					return i.name === field;
				}
				return (
					(isHas(i) && i.has(field)) || (typeof i === "string" && i === field)
				);
			})
		);
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

	get name(): string {
		if (this.field instanceof Column) {
			return this.field.name;
		}
		return typeof this.field === "string" ? this.field : "";
	}

	has(field: string): boolean {
		return this.name === field;
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

export enum SqlCheckType {
	All = "all",
	Any = "any",
	Some = "some",
}

export class Check implements Sql {
	static all(args: SqlElement[]): Sql {
		return new Check(SqlCheckType.All, args);
	}

	static any(args: SqlElement[]): Sql {
		return new Check(SqlCheckType.Any, args);
	}

	static some(args: SqlElement[]): Sql {
		return new Check(SqlCheckType.Some, args);
	}

	type: SqlCheckType;
	args: Array<SqlElement>;

	constructor(type: SqlCheckType, args: Array<SqlElement>) {
		this.type = type;
		this.args = args;
	}

	sql(): string {
		return "";
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

	_args: Array<SqlElement>;
	_op: SqlRelOp;

	constructor(op: SqlRelOp, args: Array<SqlElement>) {
		this._op = op;
		this._args = args;
	}

	has(field: string): boolean {
		return this._args.some((i: SqlElement): boolean => {
			return isHas(i) && i.has(field);
		});
	}

	sql(): string {
		return this._args.map(wrap).map(toStr).join(` ${this._op} `);
	}
}
