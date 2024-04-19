import type { Sql } from "./commons";

export class Exec implements Sql {
	static sum(args: Array<Sql>): Sql {
		return new Exec("sum", args);
	}

	static len(args: Array<Sql>): Sql {
		return new Exec("length", args);
	}

	static substr(args: Array<Sql>): Sql {
		return new Exec("substr", args);
	}

	static avg(args: Array<Sql>): Sql {
		return new Exec("avg", args);
	}

	static count(args: Array<Sql>): Sql {
		return new Exec("count", args);
	}

	static min(args: Array<Sql>): Sql {
		return new Exec("min", args);
	}

	static max(args: Array<Sql>): Sql {
		return new Exec("max", args);
	}

	fn: string;
	args: Array<Sql>;

	constructor(fn: string, args: Array<Sql>) {
		this.fn = fn;
		this.args = args;
	}

	sql(): string {
		const args = this.args.map((a) => a.sql());
		return `${this.fn}(${args.join(", ")})`;
	}
}
