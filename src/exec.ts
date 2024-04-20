import type { Sql } from "./commons";
import { toStr } from "./helpers";

export class Exec implements Sql {
	static sum(args: Array<SqlElement>): Sql {
		return new Exec("sum", args);
	}

	static len(args: Array<SqlElement>): Sql {
		return new Exec("length", args);
	}

	static mod(args: Array<SqlElement>): Sql {
		return new Exec("mod", args);
	}

	static substr(args: Array<SqlElement>): Sql {
		return new Exec("substr", args);
	}

	static coalesce(args: Array<SqlElement>): Sql {
		return new Exec("coalesce", args);
	}

	static ifnull(args: Array<SqlElement>): Sql {
		return new Exec("ifnull", args);
	}

	static isnull(args: Array<SqlElement>): Sql {
		return new Exec("isnull", args);
	}

	static avg(args: Array<SqlElement>): Sql {
		return new Exec("avg", args);
	}

	static count(args: Array<SqlElement>): Sql {
		return new Exec("count", args);
	}

	static min(args: Array<SqlElement>): Sql {
		return new Exec("min", args);
	}

	static max(args: Array<SqlElement>): Sql {
		return new Exec("max", args);
	}

	fn: string;
	args: Array<SqlElement>;

	constructor(fn: string, args: Array<SqlElement>) {
		this.fn = fn;
		this.args = args;
	}

	sql(): string {
		const args = this.args.map(toStr);
		return `${this.fn}(${args.join(", ")})`;
	}
}
