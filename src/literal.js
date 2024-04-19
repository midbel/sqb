"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.placeholder = exports.literal = exports.Literal = exports.Expr = void 0;
const commons_1 = require("./commons");
class Expr {
	static add(left, right) {
		return new Expr(left, right, "+");
	}
	static sub(left, right) {
		return new Expr(left, right, "-");
	}
	static mul(left, right) {
		return new Expr(left, right, "*");
	}
	static div(left, right) {
		return new Expr(left, right, "/");
	}
	static concat(left, right) {
		return new Expr(left, right, "||");
	}
	constructor(left, right, op) {
		this.left = (0, commons_1.wrap)(left);
		this.right = (0, commons_1.wrap)(right);
		this.op = op;
	}
	add(right) {
		return Expr.add(this, right);
	}
	sub(right) {
		return Expr.sub(this, right);
	}
	mul(right) {
		return Expr.mul(this, right);
	}
	div(right) {
		return Expr.div(this, right);
	}
	sql() {
		return [
			(0, commons_1.isSql)(this.left) ? this.left.sql() : this.left,
			this.op,
			(0, commons_1.isSql)(this.right) ? this.right.sql() : this.right,
		].join(" ");
	}
}
exports.Expr = Expr;
class Literal {
	static str(val) {
		return new Literal(val);
	}
	static numeric(val) {
		return new Literal(val);
	}
	static bool(val) {
		return new Literal(val);
	}
	static date(val) {
		return new Literal(val);
	}
	constructor(literal) {
		this.value = literal;
	}
	sql() {
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
exports.Literal = Literal;
function literal(value) {
	return new Literal(value);
}
exports.literal = literal;
function placeholder() {
	return "?";
}
exports.placeholder = placeholder;
