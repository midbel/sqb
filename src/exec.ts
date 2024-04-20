import type { Sql } from "./commons";

export class Exec implements Sql {
	static sum(args: Array<Sql>): Sql {
		return new Exec("sum", args);
	}

	static len(args: Array<Sql>): Sql {
		return new Exec("length", args);
	}

	static mod(args: Array<Sql>): Sql {
		return new Exec("mod", args);
	}

	static substr(args: Array<Sql>): Sql {
		return new Exec("substr", args);
	}

	static coalesce(args: Array<Sql>): Sql {
		return new Exec("coalesce", args);
	}

	static ifnull(args: Array<Sql>): Sql {
		return new Exec("ifnull", args);
	}

	static isnull(args: Array<Sql>): Sql {
		return new Exec("isnull", args);
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
