import { describe, expect, test } from "vitest";
import { select, column, table, alias, innerJoin, eq } from '../src/shortcuts'

describe("select shortcut", () => {
	test("basic select", () => {
		let q = select([], "table") 
		expect(q.sql()).toBe("select * from table")
	})

	test("basic select v2", () => {
		let q = select(
			[column("f0"), column("f1")],
			table("table", "db")
		);
		expect(q.sql()).toBe("select f0, f1 from db.table")
	})

	test("basic select v3", () => {
		let q = select(
			[alias("a", column("f0")), alias("b", column("f1"))],
			table("t0", "db"),
			[innerJoin("t1", [eq("id0", "id1")])]
		)
		expect(q.sql()).toBe("select f0 as a, f1 as b from db.t0 inner join t1 on id0=id1");
	})
})