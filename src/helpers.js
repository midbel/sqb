"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toStr = void 0;
const commons_1 = require("./commons");
function toStr(item) {
	return (0, commons_1.isSql)(item) ? item.sql() : item;
}
exports.toStr = toStr;
