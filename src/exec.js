"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exec = void 0;
class Exec {
	static sum(args) {
		return new Exec("sum", args);
	}
	static len(args) {
		return new Exec("length", args);
	}
	static substr(args) {
		return new Exec("substr", args);
	}
	static avg(args) {
		return new Exec("avg", args);
	}
	static count(args) {
		return new Exec("count", args);
	}
	static min(args) {
		return new Exec("min", args);
	}
	static max(args) {
		return new Exec("max", args);
	}
	constructor(fn, args) {
		this.fn = fn;
		this.args = args;
	}
	sql() {
		const args = this.args.map((a) => a.sql());
		return `${this.fn}(${args.join(", ")})`;
	}
}
exports.Exec = Exec;
