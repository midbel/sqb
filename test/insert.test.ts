import { describe, expect, test } from "vitest";
import { Insert } from "../src/insert";
import { Select } from "../src/select";
import { Literal } from "../src/literal";
import { Binary } from "../src/predicate";
import { Cte } from "../src/commons";

describe("insert", () => {
	test("insert into with placeholders", () => {
		const q = Insert.into("table").column(["field1", "field2"]);
		expect(q.sql()).toBe("insert into table (field1, field2) values (?, ?)");
	});

	test("insert into with values", () => {
		const q = Insert.into("table")
			.column(["field1", "field2"])
			.value([Literal.str("sql"), Literal.numeric(1)]);
		expect(q.sql()).toBe(
			"insert into table (field1, field2) values ('sql', 1)",
		);
	});

	test("insert into from select", () => {
		const q = Select.from("table")
			.column(["field1", "field2"])
			.where(Binary.eq("id", Literal.str("sql")));
		const i = Insert.into("table").column(["field1", "field2"]).select(q);
		expect(i.sql()).toBe(
			"insert into table (field1, field2) select table.field1, table.field2 from table where id='sql'",
		);
	});

	test("insert with cte", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e = Cte.make("cte", c, ["test0", "test1"])

		const q = Insert.into("table")
			.column(["field1", "field2"])
			.value([Literal.str("sql"), Literal.numeric(1)])
			.with(e);
		expect(q.sql()).toBe(
			"with cte(test0, test1) as (select table.field0, table.field1 from table) insert into table (field1, field2) values ('sql', 1)",
		);		
	})
});
