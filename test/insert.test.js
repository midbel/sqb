"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const insert_1 = require("../src/insert");
const select_1 = require("../src/select");
const literal_1 = require("../src/literal");
const predicate_1 = require("../src/predicate");
(0, vitest_1.describe)("insert", () => {
    (0, vitest_1.test)("insert into with placeholders", () => {
        const q = insert_1.Insert.into("table").column(["field1", "field2"]);
        (0, vitest_1.expect)(q.sql()).toBe("insert into table (field1, field2) values (?, ?)");
    });
    (0, vitest_1.test)("insert into with values", () => {
        const q = insert_1.Insert.into("table")
            .column(["field1", "field2"])
            .value([literal_1.Literal.str("sql"), literal_1.Literal.numeric(1)]);
        (0, vitest_1.expect)(q.sql()).toBe("insert into table (field1, field2) values ('sql', 1)");
    });
    (0, vitest_1.test)("insert into from select", () => {
        const q = select_1.Select.from("table")
            .column(["field1", "field2"])
            .where(predicate_1.Binary.eq("id", literal_1.Literal.str("sql")));
        const i = insert_1.Insert.into("table").column(["field1", "field2"]).select(q);
        (0, vitest_1.expect)(i.sql()).toBe("insert into table (field1, field2) select field1, field2 from table where id='sql'");
    });
});
