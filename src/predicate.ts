import { type Sql, SqlElement, isSql, wrap } from "./commons";
import { placeholder } from "./literal";
import { toStr } from "./helpers";

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

export class Binary implements Sql {
	static eq(field: SqlElement, value?: SqlElement): Sql {
		return new Binary("=", field, value);
	}

	static ne(field: SqlElement, value?: SqlElement): Sql {
		return new Binary("<>", field, value);
	}

	static lt(field: SqlElement, value?: SqlElement): Sql {
		return new Binary("<", field, value);
	}

	static le(field: SqlElement, value?: SqlElement): Sql {
		return new Binary("<=", field, value);
	}

	static gt(field: SqlElement, value?: SqlElement): Sql {
		return new Binary(">", field, value);
	}

	static ge(field: SqlElement, value: SqlElement): Sql {
		return new Binary(">=", field, value);
	}

	static like(field: SqlElement, value: SqlElement): Sql {
		return new Binary("like", field, value);
	}

	left: SqlElement;
	right: SqlElement;
	op: string;

	constructor(op: string, left: SqlElement, right?: SqlElement) {
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

	sql(): string {
		return [
			toStr(this.field),
			this.not ? "not" : "",
			"between",
			toStr(this.left),
			toStr(this.right),
		].join(" ");
	}
}

export class Logical implements Sql {
	static and(args: Array<SqlElement>): Sql {
		return new Logical("and", args);
	}

	static or(args: Array<SqlElement>): Sql {
		return new Logical("or", args);
	}

	args: Array<SqlElement>;
	op: string;

	constructor(op: string, args: Array<SqlElement>) {
		this.op = op;
		this.args = args;
	}

	sql(): string {
		return this.args.map(toString).join(` ${this.op} `);
	}
}
