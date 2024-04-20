import { describe, expect, test } from "vitest";
import { Case } from "../src/commons"
import { Literal } from "../src/literal"
import { Binary } from "../src/predicate"

describe("case", () => {

	test("case 1", () => {
		let c = Case.make()
			.when(Binary.eq("field", Literal.numeric(0)), Literal.str("foo"))
			.when(Binary.ne("field", Literal.numeric(0)), Literal.str("bar"))
			.alternative(Literal.str("foobar"))

		expect(c.sql()).toBe("case when field=0 then 'foo' when field<>0 then 'bar' else 'foobar' end")
	})

	test("case 2", () => {
		let c = new Case("field")
			.when(Literal.numeric(0), Literal.str("foo"))
			.when(Literal.numeric(1), Literal.str("bar"))
			.alternative(Literal.str("foobar"))

		expect(c.sql()).toBe("case field when 0 then 'foo' when 1 then 'bar' else 'foobar' end")
	})
})