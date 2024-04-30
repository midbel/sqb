import { describe, expect, test } from "vitest";
import { Delete, Truncate } from "../src/delete";
import { Select } from "../src/select";
import { Cte } from "../src/commons";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";

describe("truncate", () => {
	test("truncate table", () => {
		let q = Truncate.table("table")
		expect(q.sql()).toBe("truncate table")
	})
})

describe("delete", () => {

	test("delete all", () => {
		let q = Delete.from("table")
		expect(q.sql()).toBe("delete from table")
	})

	test("delete with predicate", () => {
		const q = Delete.from("table")
			.where(Binary.eq("field", Literal.numeric(0)))
			.where(Binary.ne("field"));
		expect(q.sql()).toBe("delete from table where field=0 and field<>?");
	})

	test("delete with cte", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e = Cte.make("cte", c, ["test0", "test1"])

		const q = Delete.from("table")
			.where(Binary.eq("field", Literal.numeric(0)))
			.where(Binary.ne("field"))
			.with(e);
		expect(q.sql()).toBe("with cte(test0, test1) as (select field0, field1 from table) delete from table where field=0 and field<>?");
	})

})