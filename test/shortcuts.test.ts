import { describe, expect, test } from "vitest";
import { select, column, table } from '../src/shortcuts'

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
})