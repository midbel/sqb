import { type Sql, isSql, wrap } from "./commons";

export class Expr implements Sql {
	static add(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, "+");
	}
	static sub(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, "-");
	}
	static mul(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, "*");
	}
	static div(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, "/");
	}
	static concat(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, "||");
	}

	left: string | Sql | Expr;
	right: string | Sql | Expr;
	op: string;

	constructor(
		left: string | Sql | Expr,
		right: string | Sql | Expr,
		op: string,
	) {
		this.left = wrap(left);
		this.right = wrap(right);
		this.op = op;
	}

	add(right: Sql | Expr): Expr {
		return Expr.add(this, right);
	}

	sub(right: Sql | Expr): Expr {
		return Expr.sub(this, right);
	}

	mul(right: Sql | Expr): Expr {
		return Expr.mul(this, right);
	}

	div(right: Sql | Expr): Expr {
		return Expr.div(this, right);
	}

	sql(): string {
		return [
			isSql(this.left) ? this.left.sql() : this.left,
			this.op,
			isSql(this.right) ? this.right.sql() : this.right,
		].join(" ");
	}
}

type Primitive = string | number | boolean | Date;

export class Literal implements Sql {
	static str(val: string): Sql {
		return new Literal(val);
	}

	static numeric(val: number): Sql {
		return new Literal(val);
	}

	static bool(val: boolean): Sql {
		return new Literal(val);
	}

	static date(val: Date): Sql {
		return new Literal(val);
	}

	value: Primitive;

	constructor(literal: Primitive) {
		this.value = literal;
	}

	sql(): string {
		if (typeof this.value === "string") {
			return `'${this.value.replaceAll("'", "''")}'`;
		}
		if (this.value instanceof Date) {
			return `${this.value.getFullYear()}-${
				this.value.getMonth() + 1
			}-${this.value.getDate()}`;
		}
		return this.value.toString();
	}
}

export function literal(value: string | number | boolean | Date): Sql {
	return new Literal(value);
}

export function placeholder(): string {
	return "?";
}
