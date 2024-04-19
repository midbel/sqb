import { Select } from "./select";
import { Expr } from "./literal";
import { toStr } from "./helpers";

export interface Sql {
	sql(): string;
}

export type SqlElement = string | Sql;

export function isSql(str: SqlElement): str is Sql {
	return (str as Sql).sql !== undefined;
}

export class Cast implements Sql {
	static asInt(field: SqlElement): Sql {
		return new Cast(field, "int");
	}

	static asVarchar(field: SqlElement, len: number): Sql {
		return new Cast(field, `varchar(${len})`);
	}

	static asChar(field: SqlElement, len: number): Sql {
		return new Cast(field, `char(${len})`);
	}

	static asDecimal(field: SqlElement, len: number, prec: number): Sql {
		return new Cast(field, `decimal(${len}, ${prec})`);
	}

	static asDate(field: SqlElement): Sql {
		return new Cast(field, "date");
	}

	field: SqlElement;
	type: string;

	constructor(field: SqlElement, type: string) {
		this.field = field;
		this.type = type;
	}

	sql(): string {
		return `cast(${toStr(this.field)} as ${this.type})`;
	}
}

export class Alias implements Sql {
	static make(name: SqlElement, alias: string): Sql {
		return new Alias(name, alias);
	}

	name: SqlElement;
	alias: string;

	constructor(name: SqlElement, alias: string) {
		this.name = wrap(name);
		this.alias = alias;
	}

	sql(): string {
		const name = isSql(this.name) ? this.name.sql() : this.name;
		return `${name} as ${this.alias}`;
	}
}

export class Column implements Sql {
	static make(field: string, table: string): Sql {
		return new Column(field, table, "");
	}

	static all(table = ""): Sql {
		return new Column("*", table, "");
	}

	name: string;
	table: string;
	schema: string;

	constructor(name: string, table: string, schema: string) {
		this.name = name;
		this.table = table;
		this.schema = schema;
	}

	sql(): string {
		return [this.schema, this.table, this.name].filter((i) => i).join(".");
	}
}

export class WrappedSql implements Sql {
	wrapped: Sql;

	constructor(sql: Sql) {
		this.wrapped = sql;
	}

	sql(): string {
		return `(${this.wrapped.sql()})`;
	}
}

export function wrap(q: SqlElement): SqlElement {
	if (q instanceof Select || q instanceof Expr) {
		return new WrappedSql(q);
	}
	return q;
}

export function isValidIdentifier(ident: string): boolean {
	const re = /[a-zA-Z][a-zA-Z0-9_]*/;
	if (!re.test(ident)) {
		throw new Error(`${ident}: invalid identifier`);
	}
	return true;
}
