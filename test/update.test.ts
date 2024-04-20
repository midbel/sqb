import { describe, expect, test } from "vitest";
import { Update } from "../src/update";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";

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

})