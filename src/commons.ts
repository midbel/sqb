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

export class Table implements Sql {
	name: string;
	schema: string;
	alias?: string;

	constructor(name: string, schema: string, alias?: string) {
		this.name = name;
		this.schema = schema;
		this.alias = alias;
	}

	column(name: string, alias?: string): Sql {
		const c = Column.make(name, this.alias || this.name);
		if (alias) {
			return Alias.make(c, alias);
		}
		return c;
	}

	sql(): string {
		const parts: Array<string> = [];
		if (this.schema) {
			parts.push(this.schema);
		}
		parts.push(this.name);
		if (this.alias) {
			return Alias.make(parts.join("."), this.alias).sql();
		}
		return parts.join(".");
	}
}

export class Case implements Sql {
	field?: SqlElement;
	alt?: SqlElement;

	constructor(field?: SqlElement) {
		this.field = field;
	}

	when(cdt: SqlElement, stmt: SqlElement): Case {
		return this;
	}

	alternative(stmt: SqlElement): Case {
		return this;
	}

	sql(): string {
		return "";
	}
}

export enum SqlType {
	Int = 0,
	Decimal = 1,
	Char = 2,
	Varchar = 3,
	Date = 4,
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
