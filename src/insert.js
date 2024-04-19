"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Insert = void 0;
const literal_1 = require("./literal");
const helpers_1 = require("./helpers");
class Insert {
	static into(table) {
		return new Insert(table);
	}
	constructor(table) {
		this.table = table;
		this.query = undefined;
		this.columns = [];
		this.values = [];
	}
	select(query) {
		this.query = query;
		return this;
	}
	column(name) {
		const cs = Array.isArray(name) ? name : [name];
		this.columns = this.columns.concat(cs);
		return this;
	}
	value(value) {
		const vs = Array.isArray(value) ? value : [value];
		this.values = this.values.concat(vs);
		return this;
	}
	sql() {
		if (this.query) {
			return this.insertQuery();
		}
		return this.insertValues();
	}
	insertQuery() {
		const columns = this.columns.map(helpers_1.toStr);
		return `insert into ${(0, helpers_1.toStr)(this.table)} (${columns.join(
			", ",
		)}) ${this.query?.sql()}`;
	}
	insertValues() {
		if (this.values.length > 0 && this.columns.length !== this.values.length) {
			throw new Error("insert: number of columns/values mismatched");
		}
		const columns = this.columns.map(helpers_1.toStr);
		let values = [];
		if (this.values.length) {
			values = this.values.map(helpers_1.toStr);
		} else {
			values = this.columns.map((_) => (0, literal_1.placeholder)());
		}
		return `insert into ${(0, helpers_1.toStr)(this.table)} (${columns.join(
			", ",
		)}) values (${values.join(", ")})`;
	}
}
exports.Insert = Insert;
