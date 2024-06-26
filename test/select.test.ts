import { describe, expect, test, beforeEach } from "vitest";
import { Alias, Column, Table, Order, Cte } from "../src/commons";
import { Literal, placeholder } from "../src/literal";
import { Binary, Exists, Between, In, Is, Relation } from "../src/predicate";
import { Join, Select, Sets } from "../src/select";
import { Exec } from "../src/exec";


describe("sets", () => {
	test("union", () => {
		const q1 = Select.from("table1").column("field")
		const q2 = Select.from("table2").column("field")
		const q = Sets.union(q1, q2)
		expect(q.sql()).toBe("select field from table1 union select field from table2")
	})

	test("intersect invalid length", () => {
		const q1 = Select.from("table1").column(["field0", "field1"])
		const q2 = Select.from("table2").column(["field0"])
		const q = Sets.intersect(q1, q2)

		expect(() => q.sql()).toThrow("intersect")
	})
})

describe("select", () => {
	beforeEach(() => Alias.withAs = true)

	test("select *", () => {
		let q = Select.from("table");
		expect(q.sql()).toBe("select * from table");

		let t = Table.make("table", "")
		q = Select.from(t.as("t"))
		expect(q.sql()).toBe("select * from table as t")
	});

	test("select field", () => {
		let q = Select.from("table");
		q = q.column("field");
		expect(q.sql()).toBe("select field from table");
	});

	test("select multi fields", () => {
		let q = Select.from("table");
		q = q.column(["field1", "field2"]);
		expect(q.sql()).toBe("select field1, field2 from table");
	});

	test("select with functions", () => {
		const q = Select.from("table").column(Exec.count([Column.all()]));
		expect(q.sql()).toBe("select count(*) from table");
	});

	test("select distinct", () => {
		const q = Select.from("table").distinct().column(["field1", "field2"]);
		expect(q.sql()).toBe("select distinct field1, field2 from table");
	});

	test("select with limit and offset", () => {
		const q = Select.from("table").limit(Literal.numeric(100)).offset(Literal.numeric(150));
		expect(q.sql()).toBe("select * from table limit 100 offset 150");
	});

	test("select with table alias", () => {
		let q = Select.from(Alias.make("table", "t"));
		q = q.column(Column.make("field", "t"));
		expect(q.sql()).toBe("select t.field from table as t");

		Alias.withAs = false

		q = Select.from(Alias.make("table", "t"));
		q = q.column(Column.make("field", "t"));
		expect(q.sql()).toBe("select t.field from table t");

		q = Select.from(Table.make("table").as("t")).column("field")
		expect(q.sql()).toBe("select field from table t")
	});

	test("select with field and table alias", () => {
		let q = Select.from(Alias.make("table", "t"));
		q = q.column(Alias.make(Column.make("field", "t"), "f"));
		expect(q.sql()).toBe("select t.field as f from table as t");
	});

	test("select with join", () => {
		let q = Select.from(Alias.make("table1", "t1"));
		let j = Join.inner(Alias.make("table2", "t2"));
		j = j.on(Binary.eq(Column.make("field", "t1"), Column.make("field", "t2")));
		q = q.join(j);
		expect(q.sql()).toBe(
			"select * from table1 as t1 inner join table2 as t2 on t1.field=t2.field",
		);
	});

	test("select with join and subquery", () => {
		const q1 = Select.from(Alias.make("table", "t1"));
		const q2 = Select.from("table");
		const lj = Join.left(Alias.make(q2, "t2")).on(
			Binary.eq(Column.make("field", "t1"), Column.make("field", "t2")),
		);

		expect(q1.join(lj).sql()).toBe(
			"select * from table as t1 left join (select * from table) as t2 on t1.field=t2.field",
		);
	});

	test("select with nested select", () => {
		const q = Select.from("table").column("field");
		const a = Select.from("table").column(["field", q]);
		expect(a.sql()).toBe("select field, (select field from table) from table");
	});

	test("select with literal", () => {
		const q = Select.from("table")
			.column("field")
			.column(Literal.str("string"))
			.column(Literal.numeric(0))
			.column(Literal.bool(true));
		expect(q.sql()).toBe("select field, 'string', 0, true from table");
	});

	test("select with predicate", () => {
		const q = Select.from("table")
			.where(Binary.eq("field", Literal.numeric(0)))
			.where(Binary.ne("field", placeholder()));
		expect(q.sql()).toBe("select * from table where field=0 and field<>?");
	});

	test("select with predicte: between", () => {
		const n = new Date(Date.parse('2024-04-22'))
		const y = new Date(n - (86400 * 1000))

		let q1 = Select.from("table").where(Between.not("field", Literal.date(y), Literal.date(n)))
		expect(q1.sql()).toBe("select * from table where field not between '2024-04-21' and '2024-04-22'")

		let q2 = Select.from("table").where(Between.between("field", Literal.date(y), Literal.date(n)))
		expect(q2.sql()).toBe("select * from table where field between '2024-04-21' and '2024-04-22'")
	})

	test("select with predicte: in", () => {
		let q1 = Select.from("table").where(In.contains("field", [Literal.numeric(10), Literal.numeric(100)]))
		expect(q1.sql()).toBe("select * from table where field in (10, 100)")

		let q2 = Select.from("table").where(In.not("field", [Literal.numeric(10), Literal.numeric(100)]))
		expect(q2.sql()).toBe("select * from table where field not in (10, 100)")
	})

	test("select with predicate: is", () => {
		let q1 = Select.from("table").where(Is.is('field'))
		expect(q1.sql()).toBe("select * from table where field is null")
		let q2 = Select.from("table").where(Is.not('field'))
		expect(q2.sql()).toBe("select * from table where field is not null")
	})

	test("select with predicate v1: and/or", () => {
		let and1 = Relation.and([
			Binary.eq("field1", Literal.numeric(0)), 
			Binary.eq("field2", Literal.str('foo'))
		])
		let and2 = Relation.and([
			Binary.eq("field1", Literal.numeric(0)), 
			Binary.eq("field2", Literal.str('bar'))
		])
		let q = Select.from("table").where(Relation.or([and1, and2]))
		expect(q.sql()).toBe("select * from table where ((field1=0 and field2='foo') or (field1=0 and field2='bar'))")
	})

	test("select with predicate v2: and/or", () => {
		let or1 = Relation.or([
			Binary.eq("field1", Literal.numeric(0)), 
			Binary.eq("field2", Literal.str('foo'))
		])
		let or2 = Relation.or([
			Binary.eq("field1", Literal.numeric(0)), 
			Binary.eq("field2", Literal.str('bar'))
		])
		let q = Select.from("table").where(or1).where(or2)
		expect(q.sql()).toBe("select * from table where (field1=0 or field2='foo') and (field1=0 or field2='bar')")
	})

	test("select with predicate and alias", () => {
		let q = Select.from("table")
			.column(Alias.make("field", "f"))
			.where(Binary.like("f", Literal.str("%value%")))

		expect(() => q.sql()).toThrow()
	})

	test("select exists", () => {
		const e = Select.from("table").where(Binary.lt("id", Literal.numeric(150)))
		let q = Select.from("table").where(Exists.exists(e))
		expect(q.sql()).toBe("select * from table where exists (select * from table where id<150)")
	})

	test("select with order", () => {
		const q = Select.from("table")
			.order(Order.asc("field"))
			.order(Order.asc(Column.make("other", "t")));
		expect(q.sql()).toBe("select * from table order by field asc, t.other asc");
	});

	test("select with groups", () => {
		const q = Select.from("table")
			.column(["field0", Exec.count(["field1"])])
			.group("field0")
		expect(q.sql()).toBe("select field0, count(field1) from table group by field0")
	})

	test("select with groups and not aggregate field", () => {
		const q = Select.from("table")
			.column(["field0", "field1"])
			.group("field0")
		expect(() => q.sql()).toThrow()
	})
});


describe("select with cte", () => {
	test("select with cte", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e = Cte.make("cte", c, ["test0", "test1"])
		const q = Select.from("cte").with(e)

		expect(q.sql()).toBe("with cte(test0, test1) as (select field0, field1 from table) select * from cte")
	})

	test("select with cte invalid length", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e = Cte.make("cte", c, ["test0"])
		const q = Select.from("cte").with(e)

		expect(() => q.sql()).toThrow("cte(cte): number of fields mismatched fields in the query")
	})

	test("select with duplicate cte name", () => {
		const c = Select.from("table").column(["field0", "field1"])
		const e1 = Cte.make("cte", c, ["field0", "field1"])	
		const e2 = Cte.make("cte", c, ["field0", "field1"])	
		const q = Select.from("cte")
			.with(e1)
			.with(e2)

		expect(() => q.sql()).toThrow("with: cte named 'cte' already defined")
	})
})