import { describe, expect, test } from "vitest";
import { Update } from "../src/update";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";
import { Cte } from "../src/commons";
import { Select } from "../src/select";

describe("update", () => {

	test("update batch", () => {
		const q = Update.update("table")
			.set("field", Literal.bool(true))
			.set("field", "other")
		expect(q.sql()).toBe("update table set field=true, field=other")
	})

	test("update with predicate", () => {
		const q = Update.update("table")
			.set("field", Literal.bool(true))
			.set("field", "other")
			.where(Binary.eq("field", Literal.numeric(0)))
			.where(Binary.ne("field"));
		expect(q.sql()).toBe("update table set field=true, field=other where field=0 and field<>?")
	})

	test("update with cte", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e = Cte.make("cte", c, ["test0", "test1"])

		const q = Update.update("table")
			.set("field", Literal.bool(true))
			.set("field", "other")
			.with(e)
		expect(q.sql()).toBe("with cte(test0, test1) as (select field0, field1 from table) update table set field=true, field=other")		
	})

})