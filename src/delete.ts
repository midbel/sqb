import { type Sql, type SqlElement, isSql, With } from "./commons";
import { Binary } from "./predicate";
import { toStr } from "./helpers";

export class Delete implements Sql {
	static from(table: SqlElement): Delete {
		return new Delete(table);
	}

	table: SqlElement;
	wheres: Array<SqlElement>;
	sub: With;

	constructor(table: SqlElement) {
		this.table = table;
		this.wheres = [];
		this.sub = new With();
	}

	where(field: SqlElement | Array<SqlElement>): Delete {
		const fs = Array.isArray(field) ? field : [field];
		this.wheres = this.wheres.concat(
			fs.map((f) => (isSql(f) ? f : Binary.eq(f))),
		);
		return this;
	}

	with(cte: Sql): Delete {
		this.sub.append(cte);
		return this;
	}

	sql(): string {
		const query: Array<string> = [];
		if (this.sub.count) {
			query.push(this.sub.sql());
		}
		query.push("delete from");
		query.push(toStr(this.table));
		if (this.wheres.length) {
			const wheres = this.wheres.map(toStr);
			query.push("where");
			query.push(wheres.join(" and "));
		}
		return query.join(" ");
	}
}
