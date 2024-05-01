import { describe, expect, test } from "vitest";
import { Merge } from "../src/merge";
import { Alias, Column } from "../src/commons";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";

describe("merge", () => {
	test("merge with table", () => {
		Alias.withAs = false

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

	test.skip("merge with select", () => {})
})