import { describe, expect, test } from "vitest";
import { Insert } from "../src/insert";
import { Select } from "../src/select";
import { Literal } from "../src/literal";
import { Binary } from "../src/predicate";

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
			"insert into table (field1, field2) select field1, field2 from table where id='sql'",
		);
	});
});
