# SQB: a damned simple SQL query builder

Write simple and easy Javascript code to generate your SQL queries from the simplest to what fits best your needs but without having to mix (too much) SQL with your js code.

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