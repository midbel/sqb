# SQB: a damned simple SQL query builder

Write simple and easy Javascript code to generate your SQL queries from the simplest to what fits best your needs but without having to mix (too much) SQL with your js code.

sqb provides functions and types to build commons SQL statements like:

* Select (and union, intersect and except with their all variants)
* Insert
* Update
* Delete

It also provides functions to help you build conditions, expressions and some most of the commons used SQL functions like `count`, `avg`, `coalesce`, `ifnull`, etc.

## Install

```bash
npm install -D @midbel/sqb
```

## Quick Start

```js
import { Select } from '@midbel/sqb'

const q = Select.from('employees')
	.column(["firstname", "lastname"]);
console.log(q.sql()) // select firstname, lastname from employees
```