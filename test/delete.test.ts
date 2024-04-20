import { describe, expect, test } from "vitest";
import { Delete } from "../src/delete";
import { Binary } from "../src/predicate";
import { Literal } from "../src/literal";

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

})