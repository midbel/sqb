"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const commons_1 = require("../src/commons");
const literal_1 = require("../src/literal");
const predicate_1 = require("../src/predicate");
const select_1 = require("../src/select");
const exec_1 = require("../src/exec");
(0, vitest_1.describe)("select", () => {
    (0, vitest_1.test)("select *", () => {
        const q = select_1.Select.from("table");
        (0, vitest_1.expect)(q.sql()).toBe("select * from table");
    });
    (0, vitest_1.test)("select field", () => {
        let q = select_1.Select.from("table");
        q = q.column("field");
        (0, vitest_1.expect)(q.sql()).toBe("select field from table");
    });
    (0, vitest_1.test)("select multi fields", () => {
        let q = select_1.Select.from("table");
        q = q.column(["field1", "field2"]);
        (0, vitest_1.expect)(q.sql()).toBe("select field1, field2 from table");
    });
    (0, vitest_1.test)("select with functions", () => {
        const q = select_1.Select.from("table").column(exec_1.Exec.count([commons_1.Column.all()]));
        (0, vitest_1.expect)(q.sql()).toBe("select count(*) from table");
    });
    (0, vitest_1.test)("select distinct", () => {
        const q = select_1.Select.from("table").distinct().column(["field1", "field2"]);
        (0, vitest_1.expect)(q.sql()).toBe("select distinct field1, field2 from table");
    });
    (0, vitest_1.test)("select with limit and offset", () => {
        const q = select_1.Select.from("table").count(100).at(150);
        (0, vitest_1.expect)(q.sql()).toBe("select * from table limit 100 offset 150");
    });
    (0, vitest_1.test)("select with table alias", () => {
        let q = select_1.Select.from(commons_1.Alias.make("table", "t"));
        q = q.column(commons_1.Column.make("field", "t"));
        (0, vitest_1.expect)(q.sql()).toBe("select t.field from table as t");
    });
    (0, vitest_1.test)("select with field and table alias", () => {
        let q = select_1.Select.from(commons_1.Alias.make("table", "t"));
        q = q.column(commons_1.Alias.make(commons_1.Column.make("field", "t"), "f"));
        (0, vitest_1.expect)(q.sql()).toBe("select t.field as f from table as t");
    });
    (0, vitest_1.test)("select with join", () => {
        let q = select_1.Select.from(commons_1.Alias.make("table1", "t1"));
        let j = select_1.Join.inner(commons_1.Alias.make("table2", "t2"));
        j = j.on(predicate_1.Binary.eq(commons_1.Column.make("field", "t1"), commons_1.Column.make("field", "t2")));
        q = q.join(j);
        (0, vitest_1.expect)(q.sql()).toBe("select * from table1 as t1 inner join table2 as t2 on t1.field=t2.field");
    });
    (0, vitest_1.test)("select with join and subquery", () => {
        const q1 = select_1.Select.from(commons_1.Alias.make("table", "t1"));
        const q2 = select_1.Select.from("table");
        const lj = select_1.Join.left(commons_1.Alias.make(q2, "t2")).on(predicate_1.Binary.eq(commons_1.Column.make("field", "t1"), commons_1.Column.make("field", "t2")));
        (0, vitest_1.expect)(q1.join(lj).sql()).toBe("select * from table as t1 left join (select * from table) as t2 on t1.field=t2.field");
    });
    (0, vitest_1.test)("select with nested select", () => {
        const q = select_1.Select.from("table").column("field");
        const a = select_1.Select.from("table").column(["field", q]);
        (0, vitest_1.expect)(a.sql()).toBe("select field, (select field from table) from table");
    });
    (0, vitest_1.test)("select with literal", () => {
        const q = select_1.Select.from("table")
            .column("field")
            .column(literal_1.Literal.str("string"))
            .column(literal_1.Literal.numeric(0))
            .column(literal_1.Literal.bool(true));
        (0, vitest_1.expect)(q.sql()).toBe("select field, 'string', 0, true from table");
    });
    (0, vitest_1.test)("select with predicates", () => {
        const q = select_1.Select.from("table")
            .where(predicate_1.Binary.eq("field", literal_1.Literal.numeric(0)))
            .where(predicate_1.Binary.ne("field"));
        (0, vitest_1.expect)(q.sql()).toBe("select * from table where field=0 and field<>?");
    });
    (0, vitest_1.test)("select with order", () => {
        const q = select_1.Select.from("table")
            .order(select_1.Order.asc("field"))
            .order(select_1.Order.asc(commons_1.Column.make("other", "t")));
        (0, vitest_1.expect)(q.sql()).toBe("select * from table order by field asc, t.other asc");
    });
});
