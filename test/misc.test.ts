import { describe, expect, test } from "vitest";
import { Case } from "../src/commons"
import { Literal, Expr } from "../src/literal"
import { Exec } from "../src/exec"
import { Binary } from "../src/predicate"
import { Call } from '../src/call'

describe("call", () => {
	test("call no args", () => {
		const q = Call.call("proc")
		expect(q.sql()).toBe("call proc ()")
	})

	test("call with args", () => {
		const q = Call.call("proc", [Literal.numeric(100), Literal.str("foobar")])
		expect(q.sql()).toBe("call proc (100, 'foobar')")
	})
})

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

describe("expr and function", () => {

	test("expr add/mul", () => {
		const e = Expr.add("field", Literal.numeric(1)).mul("field")
		expect(e.sql()).toBe("(field + 1) * field")
	})

	test("expr div/func", () => {
		const e = Expr.div("field", Exec.mod(["field", Literal.numeric(10)]))
		expect(e.sql()).toBe("field / mod(field, 10)")
	})

	test("concat", () => {
		const e = Expr.concat("field0", "field1")
		expect(e.sql()).toBe("field0 || field1")
	})
})