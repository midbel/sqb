"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Join = exports.Select = exports.Order = exports.Set = void 0;
const commons_1 = require("./commons");
const predicate_1 = require("./predicate");
const helpers_1 = require("./helpers");
class Set {
	static union(q1, q2, all = false) {
		return new Set("union", q1, q2, all);
	}
	static intersect(q1, q2, all = false) {
		return new Set("intersect", q1, q2, all);
	}
	static except(q1, q2, all = false) {
		return new Set("except", q1, q2, all);
	}
	constructor(type, q1, q2, all) {
		this.type = type;
		this.left = q1;
		this.right = q2;
		this.all = all;
	}
	sql() {
		return [
			this.left.sql(),
			this.type,
			this.all ? "all" : "",
			this.right.sql(),
		].join(" ");
	}
}
exports.Set = Set;
class Order {
	static asc(field) {
		return new Order(field, "asc");
	}
	static desc(field) {
		return new Order(field, "desc");
	}
	constructor(field, dir = "") {
		this.field = field;
		this.dir = dir ? dir : "asc";
	}
	sql() {
		return `${(0, helpers_1.toStr)(this.field)} ${this.dir}`;
	}
}
exports.Order = Order;
class Select {
	static from(table) {
		return new Select(table);
	}
	constructor(table) {
		this.table = (0, commons_1.wrap)(table);
		this.uniq = false;
		this.joins = [];
		this.fields = [];
		this.groups = [];
		this.havings = [];
		this.orders = [];
		this.wheres = [];
		this.limit = 0;
		this.offset = 0;
	}
	join(table) {
		let tb = table;
		if (!(0, commons_1.isSql)(table)) {
			tb = Join.inner(table);
		}
		this.joins.push(tb);
		return this;
	}
	distinct() {
		this.uniq = !this.uniq;
		return this;
	}
	column(name) {
		const cs = Array.isArray(name) ? name : [name];
		this.fields = this.fields.concat(cs.map(commons_1.wrap));
		return this;
	}
	where(field) {
		const fs = Array.isArray(field) ? field : [field];
		this.wheres = this.wheres.concat(
			fs.map((f) => ((0, commons_1.isSql)(f) ? f : predicate_1.Binary.eq(f))),
		);
		return this;
	}
	having(field) {
		const fs = Array.isArray(field) ? field : [field];
		this.havings = this.havings.concat(
			fs.map((f) => ((0, commons_1.isSql)(f) ? f : predicate_1.Binary.eq(f))),
		);
		return this;
	}
	group(name) {
		const ns = Array.isArray(name) ? name : [name];
		this.groups = this.groups.concat(ns);
		return this;
	}
	order(name) {
		const ns = Array.isArray(name) ? name : [name];
		this.orders = this.orders.concat(ns);
		return this;
	}
	at(offset) {
		this.offset = offset;
		return this;
	}
	count(limit) {
		this.limit = limit;
		return this;
	}
	sql() {
		if (!this.fields.length) {
			this.fields.push("*");
		}
		const fields = this.fields.map((f) =>
			(0, commons_1.isSql)(f) ? f.sql() : f,
		);
		const table = (0, commons_1.isSql)(this.table)
			? this.table.sql()
			: this.table;
		const query = ["select"];
		if (this.uniq) {
			query.push("distinct");
		}
		query.push(fields.join(", "));
		query.push("from");
		query.push(table);
		if (this.joins.length) {
			const joins = this.joins.map(helpers_1.toStr);
			query.push(joins.join(" "));
		}
		if (this.wheres.length) {
			const wheres = this.wheres.map(helpers_1.toStr);
			query.push("where");
			query.push(wheres.join(" and "));
		}
		if (this.groups.length) {
			const groups = this.groups.map(helpers_1.toStr);
			query.push("group by");
			query.push(groups.join(", "));
		}
		if (this.orders.length) {
			const orders = this.orders.map(helpers_1.toStr);
			query.push("order by");
			query.push(orders.join(", "));
		}
		if (this.limit) {
			query.push("limit");
			query.push(this.limit);
		}
		if (this.offset) {
			query.push("offset");
			query.push(this.offset);
		}
		return query.join(" ");
	}
}
exports.Select = Select;
class Join {
	static left(table) {
		return new Join(table, "left");
	}
	static right(table) {
		return new Join(table, "right");
	}
	static cross(table) {
		return new Join(table, "cross");
	}
	static full(table) {
		return new Join(table, "full");
	}
	static inner(table) {
		return new Join(table, "inner");
	}
	constructor(table, type) {
		this.table = (0, commons_1.wrap)(table);
		this.join = type;
		this.conditions = [];
	}
	on(cdt) {
		this.conditions.push((0, commons_1.wrap)(cdt));
		return this;
	}
	sql() {
		const joins = this.conditions.map(helpers_1.toStr);
		return `${this.join} join ${(0, helpers_1.toStr)(
			this.table,
		)} on ${joins.join(" and ")}`;
	}
}
exports.Join = Join;
