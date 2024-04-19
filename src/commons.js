"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidIdentifier =
	exports.wrap =
	exports.WrappedSql =
	exports.Column =
	exports.Alias =
	exports.isSql =
		void 0;
const select_1 = require("./select");
const literal_1 = require("./literal");
function isSql(str) {
	return str.sql !== undefined;
}
exports.isSql = isSql;
class Alias {
	static make(name, alias) {
		return new Alias(name, alias);
	}
	constructor(name, alias) {
		this.name = wrap(name);
		this.alias = alias;
	}
	sql() {
		const name = isSql(this.name) ? this.name.sql() : this.name;
		return `${name} as ${this.alias}`;
	}
}
exports.Alias = Alias;
class Column {
	static make(field, table) {
		return new Column(field, table, "");
	}
	static all(table = "") {
		return new Column("*", table, "");
	}
	constructor(name, table, schema) {
		this.name = name;
		this.table = table;
		this.schema = schema;
	}
	sql() {
		return [this.schema, this.table, this.name].filter((i) => i).join(".");
	}
}
exports.Column = Column;
class WrappedSql {
	constructor(sql) {
		this.wrapped = sql;
	}
	sql() {
		return `(${this.wrapped.sql()})`;
	}
}
exports.WrappedSql = WrappedSql;
function wrap(q) {
	if (q instanceof select_1.Select || q instanceof literal_1.Expr) {
		return new WrappedSql(q);
	}
	return q;
}
exports.wrap = wrap;
function isValidIdentifier(ident) {
	const re = /[a-zA-Z][a-zA-Z0-9_]*/;
	if (!re.test(ident)) {
		throw new Error(`${ident}: invalid identifier`);
	}
	return true;
}
exports.isValidIdentifier = isValidIdentifier;
