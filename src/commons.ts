import { Select } from "./select";
import { Expr } from "./literal";
import { Relation } from "./predicate";
import { toStr } from "./helpers";

export interface Sql {
	sql(): string;
}

export type SqlElement = string | Sql;

export function isSql(str: SqlElement): str is Sql {
	return (str as Sql).sql !== undefined;
}

export enum SqlOrderDir {
	Asc = "asc",
	Desc = "desc",
}

export class Order implements Sql {
	static asc(field: SqlElement): Sql {
		return new Order(field, SqlOrderDir.Asc);
	}

	static desc(field: SqlElement): Sql {
		return new Order(field, SqlOrderDir.Desc);
	}

	field: SqlElement;
	dir: SqlOrderDir;

	constructor(field: SqlElement, dir: SqlOrderDir = SqlOrderDir.Asc) {
		this.field = field;
		this.dir = dir;
	}

	sql(): string {
		return `${toStr(this.field)} ${this.dir}`;
	}
}

export class Table implements Sql {
	name: string;
	schema: string;
	alias?: string;

	static make(name: string, schema: string, alias?: string): Table {
		return new Table(name, schema, alias);
	}

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
	cdts: Array<SqlElement>;
	stmts: Array<SqlElement>;

	static make(): Case {
		return new Case();
	}

	constructor(field?: SqlElement) {
		this.field = field;
		this.cdts = [];
		this.stmts = [];
	}

	when(cdt: SqlElement, stmt: SqlElement): Case {
		this.stmts.push(stmt);
		this.cdts.push(cdt);
		return this;
	}

	alternative(stmt: SqlElement): Case {
		this.alt = stmt;
		return this;
	}

	sql(): string {
		const parts = ["case"];
		if (this.field) {
			parts.push(toStr(this.field));
		}
		this.cdts.forEach((c: SqlElement, i: number) => {
			parts.push("when");
			parts.push(toStr(c));
			parts.push("then");
			parts.push(toStr(this.stmts[i]));
		});
		if (this.alt) {
			parts.push("else");
			parts.push(toStr(this.alt));
		}
		parts.push("end");
		return parts.join(" ");
	}
}

export enum SqlType {
	Int = "int",
	Decimal = "decimal",
	Char = "char",
	Varchar = "varchar",
	Date = "date",
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
	static withAs = true;

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
		const parts: Array<string> = [];
		parts.push(toStr(this.name));
		if (Alias.withAs) {
			parts.push("as");
		}
		parts.push(this.alias);
		return parts.join(" ");
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
	if (q instanceof Select || q instanceof Expr || q instanceof Relation) {
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
