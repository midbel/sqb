"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logical = exports.Between = exports.Binary = exports.Not = void 0;
const commons_1 = require("./commons");
const literal_1 = require("./literal");
const helpers_1 = require("./helpers");
class Not {
	not(q) {
		return new Not(q);
	}
	constructor(q) {
		this.query = q;
	}
	sql() {
		return `not ${(0, helpers_1.toStr)(this.query)}`;
	}
}
exports.Not = Not;
class Binary {
	static eq(field, value) {
		return new Binary("=", field, value);
	}
	static ne(field, value) {
		return new Binary("<>", field, value);
	}
	static lt(field, value) {
		return new Binary("<", field, value);
	}
	static le(field, value) {
		return new Binary("<=", field, value);
	}
	static gt(field, value) {
		return new Binary(">", field, value);
	}
	static ge(field, value) {
		return new Binary(">=", field, value);
	}
	static like(field, value) {
		return new Binary("like", field, value);
	}
	constructor(op, left, right) {
		this.left = left;
		this.right = right
			? (0, commons_1.wrap)(right)
			: (0, literal_1.placeholder)();
		this.op = op;
	}
	sql() {
		return `${(0, helpers_1.toStr)(this.left)}${this.op}${(0, helpers_1.toStr)(
			this.right,
		)}`;
	}
}
exports.Binary = Binary;
class Between {
	static between(field, left, right) {
		return new Between(field, left, right);
	}
	static not(field, left, right) {
		return new Between(field, left, right, true);
	}
	constructor(field, left, right, not = false) {
		this.field = field;
		this.left = left ? (0, commons_1.wrap)(left) : (0, literal_1.placeholder)();
		this.right = right
			? (0, commons_1.wrap)(right)
			: (0, literal_1.placeholder)();
		this.not = not;
	}
	sql() {
		return [
			(0, helpers_1.toStr)(this.field),
			this.not ? "not" : "",
			"between",
			(0, helpers_1.toStr)(this.left),
			(0, helpers_1.toStr)(this.right),
		].join(" ");
	}
}
exports.Between = Between;
class Logical {
	static and(args) {
		return new Logical("and", args);
	}
	static or(args) {
		return new Logical("or", args);
	}
	constructor(op, args) {
		this.op = op;
		this.args = args;
	}
	sql() {
		return this.args.map(toString).join(` ${this.op} `);
	}
}
exports.Logical = Logical;
