import { type SqlElement, isSql } from "./commons";

export function toStr(item: SqlElement): string {
	return isSql(item) ? item.sql() : item;
}
