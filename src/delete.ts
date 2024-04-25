import { type Sql, type SqlElement, isSql, With } from "./commons";
import { Filter } from "./predicate";
import { toStr } from "./helpers";
import { placeholder } from "./literal";

export class Delete implements Sql {
	static from(table: SqlElement): Delete {
		return new Delete(table);
	}

	table: SqlElement;
	_where: Filter;
	sub: With;

	constructor(table: SqlElement) {
		this.table = table;
		this._where = Filter.where();
		this.sub = new With();
	}

	where(field: SqlElement | Array<SqlElement>): Delete {
		this._where.add(field);
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
		if (this._where.count) {
			query.push(this._where.sql());
		}
		return query.join(" ");
	}
}
