import { Select } from "./select";
import { Expr } from "./literal";
import { Relation } from "./predicate";
import { toStr } from "./helpers";

export interface Sql {
	sql(): string;
}

export type SqlElement = string | Sql;

export function isSql(str: unknown): str is Sql {
	return (str as Sql).sql !== undefined;
}

export interface Has {
	has(field: string): boolean;
}

export function isHas(val: unknown): val is Has {
	return (val as Has).has !== undefined;
}

export class Cte implements Sql {
	static make(
		name: string,
		query: SqlElement,
		fields?: Array<SqlElement>,
	): Sql {
		return new Cte(name, query, fields);
	}

	name: string;
	query: SqlElement;
	fields?: Array<SqlElement>;

	constructor(name: string, query: SqlElement, fields?: Array<SqlElement>) {
		this.name = name;
		this.query = query;
		this.fields = fields;
	}

	sql(): string {
		if (!(this.query instanceof Select)) {
			throw new Error(`cte(${this.name}): expected select query`);
		}
		if (
			this.fields?.length &&
			this.fields.length > 0 &&
			this.query.length !== this.fields.length
		) {
			throw new Error(
				`cte(${this.name}): number of fields mismatched fields in the query`,
			);
		}
		const parts: Array<string> = [this.name];
		if (this.fields?.length) {
			const fields = this.fields.map(toStr);
			const list = `(${fields.join(", ")})`;
			parts[0] = `${parts[0]}${list}`;
		}
		parts.push("as");
		parts.push(`(${toStr(this.query)})`);
		return parts.join(" ");
	}
}

export class With implements Sql {
	list: Array<SqlElement>;

	constructor() {
		this.list = [];
	}

	get count(): number {
		return this.list.length;
	}

	append(query: SqlElement): With {
		this.list.push(query);
		return this;
	}

	define(name: string, query: SqlElement, fields?: Array<SqlElement>): With {
		const c = Cte.make(name, query, fields);
		return this.append(c);
	}

	sql(): string {
		const seen: Set<string> = new Set();
		for (const q of this.list) {
			if (!(q instanceof Cte)) {
				throw new Error("with: expected cte object");
			}
			if (seen.has(q.name)) {
				throw new Error(`with: cte named '${q.name}' already defined`);
			}
			seen.add(q.name);
		}
		const parts = this.list.map(toStr);
		return `with ${parts.join(", ")}`;
	}
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

	static make(name: string, schema?: string): Table {
		return new Table(name, schema || "");
	}

	static asTable(name: unknown): boolean {
		if (name instanceof Table || name instanceof Select) {
			return true;
		}
		if (name instanceof Alias) {
			return Table.asTable(name.name);
		}
		if (name instanceof WrappedSql) {
			return Table.asTable(name.wrapped);
		}
		return false;
	}

	constructor(name: string, schema: string) {
		this.name = isValidIdentifier(name);
		this.schema = schema ? isValidIdentifier(schema) : schema;
	}

	column(name: string, alias?: string): Sql {
		const c = Column.make(name, this.name);
		if (alias) {
			return Alias.make(c, alias);
		}
		return c;
	}

	as(alias: string): Sql {
		return Alias.make(this, alias);
	}

	sql(): string {
		return [this.schema, this.name].filter((i) => i).join(".");
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
		this.alias = isValidIdentifier(alias);
	}

	sql(): string {
		return [toStr(this.name), Alias.withAs ? "as" : "", this.alias]
			.filter((i) => i)
			.join(" ");
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
		this.name = isValidIdentifier(name);
		this.table = table ? isValidIdentifier(table) : table;
		this.schema = schema ? isValidIdentifier(schema) : schema;
	}

	as(alias: string): Sql {
		return Alias.make(this, alias);
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

export function isValidIdentifier(ident: string): string {
	if (ident === "*") {
		return ident;
	}
	const re = /[a-zA-Z][a-zA-Z0-9_]*/;
	if (!re.test(ident)) {
		throw new Error(`${ident}: invalid SQL identifier`);
	}
	return ident;
}
