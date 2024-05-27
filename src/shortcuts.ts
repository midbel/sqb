import { Select, Join } from "./select";
import {
	type SqlElement,
	type Sql,
	Column,
	Order,
	Alias,
	Table,
} from "./commons";
import { Binary, Between, In, Is } from "./predicate";

export function eq(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.eq(field, value);
}

export function ne(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.ne(field, value);
}

export function lt(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.lt(field, value);
}

export function le(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.le(field, value);
}

export function gt(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.gt(field, value);
}

export function ge(field: SqlElement, value: SqlElement = placeholder()): Sql {
	return Binary.ge(field, value);
}

export function like(
	field: SqlElement,
	value: SqlElement = placeholder(),
	not = false,
): Sql {
	return Binary.like(field, value);
}

export function between(
	field: SqlElement,
	lower?: SqlElement,
	upper: SqlElement = placeholder(),
	not = false,
): Sql {
	if (not) {
		return Between.not(field, lower, upper);
	}
	return Between.between(field, lower, upper);
}

export function isNull(field: SqlElement, not = false): Sql {
	if (not) {
		return Is.not(field);
	}
	return Is.is(field);
}

export function contains(
	field: SqlElement,
	values: Array<SqlElement> = [],
	not = false,
): Sql {
	if (not) {
		return In.not(field, values);
	}
	return In.contains(field, values);
}

export function ascending(field: SqlElement): Sql {
	return Order.asc(field);
}

export function descending(field: SqlElement): Sql {
	return Order.desc(field);
}

export function alias(alias: string, elem: SqlElement): Sql {
	return Alias.make(elem, alias);
}

export function column(field: string, table = ""): Sql {
	return Column.make(field, table);
}

export function table(name: string, schema = ""): Sql {
	return Table.make(name, schema);
}

export function leftJoin(table: SqlElement, where: Array<SqlElement>): Sql {
	let j = Join.left(table);
	for (const w of where) {
		j = j.on(w);
	}
	return j;
}

export function rightJoin(table: SqlElement, where: Array<SqlElement>): Sql {
	let j = Join.right(table);
	for (const w of where) {
		j = j.on(w);
	}
	return j;
}

export function fullJoin(table: SqlElement, where: Array<SqlElement>): Sql {
	let j = Join.full(table);
	for (const w of where) {
		j = j.on(w);
	}
	return j;
}

export function innerJoin(table: SqlElement, where: Array<SqlElement>): Sql {
	let j = Join.inner(table);
	for (const w of where) {
		j = j.on(w);
	}
	return j;
}

export function select(
	columns: Array<SqlElement>,
	table: SqlElement,
	joins: Array<Sql> = [],
	where: Array<Sql> = [],
	groups: Array<Sql> = [],
	having: Array<Sql> = [],
	limit?: Sql,
	offset?: Sql,
): Sql {
	let q = Select.from(table).column(columns);
	where.forEach((w) => (q = q.where(w)));
	joins.forEach((j) => (q = q.join(j)));
	return q;
}

export function update(table: SqlElement): Sql {
	return Update.update(table);
}

export function insert(
	table: SqlElement,
	columns: Array<SqlElement>,
	values: Array<SqlElement>,
): Sql {
	return Insert.into(table);
}

export function remove(table: SqlElement, where: Array<SqlElement> = []): Sql {
	return Delete.from(table);
}

export function union(left: Sql, right: Sql, all = false): Sql {
	return Sets.union(left, right, all);
}
