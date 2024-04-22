import { type Sql, isSql, wrap } from "./commons";

export enum SqlOp {
	Add = "+",
	Sub = "-",
	Mul = "*",
	Div = "/",
	Concat = "||",
}

export class Expr implements Sql {
	static add(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, SqlOp.Add);
	}
	static sub(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, SqlOp.Sub);
	}
	static mul(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, SqlOp.Mul);
	}
	static div(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, SqlOp.Div);
	}
	static concat(left: string | Sql | Expr, right: string | Sql | Expr): Expr {
		return new Expr(left, right, SqlOp.Concat);
	}

	left: string | Sql | Expr;
	right: string | Sql | Expr;
	op: SqlOp;

	constructor(
		left: string | Sql | Expr,
		right: string | Sql | Expr,
		op: SqlOp,
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
			const month = (this.value.getMonth() + 1).toString().padStart(2, "0");
			const day = this.value.getDate().toString().padStart(2, "0");
			return `'${this.value.getFullYear()}-${month}-${day}'`;
		}
		return this.value.toString();
	}
}

export function placeholder(): string {
	return "?";
}
