import { describe, expect, test, beforeEach } from "vitest";
import { Merge } from "../src/merge";
import { Alias, Column } from "../src/commons";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";
import { Select } from "../src/select";

describe("merge", () => {
	beforeEach(() => {
		Alias.withAs = false
	})

	test("merge with table", () => {
		const q = Merge.merge(Alias.make("table", "t1"))
			.using(
				Alias.make("table", "t2"), 
				Binary.eq(Column.make("id", "t1"), Column.make("id", "t2"))
			)
			.update(["field0", "field1"], [Literal.numeric(100), Literal.str('foobar')])
			.insert(["field0", "field1"])

		const parts = [
			"merge into table t1 using table t2 on t1.id=t2.id",
			"when not matched then insert (field0, field1) values (?, ?)",
			"when matched then update set field0=100, field1='foobar'"
		]
		expect(q.sql()).toBe(parts.join(' '))
	})

	test("merge with conditions", () => {
		const q = Merge.merge(Alias.make("table", "t1"))
			.using(
				Alias.make("table", "t2"), 
				Binary.eq(Column.make("id", "t1"), Column.make("id", "t2"))
			)
			.update(
				["field0", "field1"],
				[Literal.numeric(100), Literal.str('foobar')],
				Binary.ne(Column.make("field", "t1"), Column.make("field", "t2"))
			)
			.insert(
				["field0", "field1"], 
				[], 
				Binary.ge(Column.make("field", "t1"), Literal.numeric(0))
			)
			.delete(Binary.eq(Column.make("field", "t1"), Column.make("field", "t2")))

		const parts = [
			"merge into table t1 using table t2 on t1.id=t2.id",
			"when not matched and t1.field>=0 then insert (field0, field1) values (?, ?)",
			"when matched and t1.field<>t2.field then update set field0=100, field1='foobar'",
			"when matched and t1.field=t2.field then delete",
		]
		expect(q.sql()).toBe(parts.join(' '))
	})

	test("merge with select", () => {
		const q = Select.from("table")
			.column(["field0", "field1"])
		const m = Merge.merge(Alias.make("table", "t1"))
			.using(
				Alias.make(q, "t2"), 
				Binary.eq(Column.make("id", "t1"), Column.make("id", "t2"))
			)
			.update(["field0", "field1"], [Literal.numeric(100), Literal.str('foobar')])
			.insert(["field0", "field1"])

		const parts = [
			"merge into table t1 using (select field0, field1 from table) t2 on t1.id=t2.id",
			"when not matched then insert (field0, field1) values (?, ?)",
			"when matched then update set field0=100, field1='foobar'"
		]
		expect(m.sql()).toBe(parts.join(' '))
	})
})