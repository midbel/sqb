import { type Sql, type SqlElement, Column, isHas } from "./commons";
import { toStr } from "./helpers";
import { Literal } from "./literal";

const scalars = new Set([
	"length",
	"mod",
	"substr",
	"coalesce",
	"ifnull",
	"isnull",
]);
const windows = new Set(["row_number"]);
const aggregates = new Set(["min", "max", "avg", "count", "sum"]);

export interface Function extends Sql {
	isWindow(): boolean;
	isAggregate(): boolean;
	isScalar(): boolean;
}

export class Exec implements Function {
	static sum(args: Array<SqlElement>): Sql {
		if (args.length !== 1) {
			throw new Error("sum: expected 1 argument");
		}
		return new Exec("sum", args);
	}

	static len(args: Array<SqlElement>): Sql {
		if (args.length !== 1) {
			throw new Error("length: expected 1 argument");
		}
		return new Exec("length", args);
	}

	static mod(args: Array<SqlElement>): Sql {
		if (args.length !== 2) {
			throw new Error("mod: expected 2 arguments");
		}
		return new Exec("mod", args);
	}

	static substr(args: Array<SqlElement>): Sql {
		if (args.length !== 3) {
			throw new Error("substr: expected 3 arguments");
		}
		return new Exec("substr", args);
	}

	static coalesce(args: Array<SqlElement>): Sql {
		if (args.length === 0) {
			throw new Error("coalesce: expected at least 1 argument");
		}
		return new Exec("coalesce", args);
	}

	static ifnull(args: Array<SqlElement>): Sql {
		if (args.length !== 2) {
			throw new Error("ifnull: expected 2 arguments");
		}
		return new Exec("ifnull", args);
	}

	static isnull(args: Array<SqlElement>): Sql {
		if (args.length !== 2) {
			throw new Error("isnull: expected 2 arguments");
		}
		return new Exec("isnull", args);
	}

	static avg(args: Array<SqlElement>): Sql {
		if (args.length !== 0) {
			throw new Error("avg: expected at least 1 argumen");
		}
		return new Exec("avg", args);
	}

	static count(args: Array<SqlElement>): Sql {
		if (args.length !== 1) {
			throw new Error("count: expected 1 argument");
		}
		return new Exec("count", args);
	}

	static min(args: Array<SqlElement>): Sql {
		if (args.length !== 1) {
			throw new Error("min: expected 1 argument");
		}
		return new Exec("min", args);
	}

	static max(args: Array<SqlElement>): Sql {
		if (args.length !== 1) {
			throw new Error("max: expected 1 argument");
		}
		return new Exec("max", args);
	}

	fn: string;
	args: Array<SqlElement>;

	constructor(fn: string, args: Array<SqlElement>) {
		this.fn = fn;
		this.args = args;
	}

	has(field: string): boolean {
		return this.args.some((i: SqlElement): boolean => {
			return (
				(i instanceof Column && i.name === field) ||
				(isHas(i) && i.has(field)) ||
				(typeof i === "string" && i === field)
			);
		});
	}

	sql(): string {
		const args = this.args.map(toStr);
		return `${this.fn}(${args.join(", ")})`;
	}

	isScalar(): boolean {
		return scalars.has(this.fn);
	}

	isAggregate(): boolean {
		return aggregates.has(this.fn);
	}

	isWindow(): boolean {
		return windows.has(this.fn);
	}
}
