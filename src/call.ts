import type { Sql, SqlElement } from "./commons";
import { toStr } from "./helpers";

export class Call implements Sql {
	static call(name: string, args?: SqlElement[]): Sql {
		return new Call(name, args);
	}

	_name: string;
	_args: Array<SqlElement>;

	constructor(name: string, args?: SqlElement[]) {
		this._name = name;
		this._args = args || [];
	}

	sql(): string {
		const args = this._args.map(toStr).join(", ");
		return ["call", this._name, `(${args})`].join(" ");
	}
}
