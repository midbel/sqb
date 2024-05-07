# SQB: a damned simple SQL query builder

Write simple and easy Javascript code to generate your SQL queries from the simplest to what fits best your needs but without having to mix (too much) SQL with your js code.

sqb provides functions and types to build commons SQL statements like:

* Select (and union, intersect and except with their all variants)
* Insert
* Update
* Delete

It provides functions to help you build conditions, expressions and some SQL functions like `count`, `avg`, `coalesce`, `ifnull`, etc.

## Install

```bash
npm install -D @midbel/sqb
```

## Queries

sqb provides one builder per type of SQL statement. The following builder are currently available:

* Select
* Update
* Insert
* Delete
* Truncate
* Merge

See the following sections for their usage

### Select

```js
import { Select, Binary, placeholder } from '@midbel/sqb'

const q = Select.from('employees')
	.column(["firstname", "lastname"])
	.where(Binary.eq("department", placeholder()))
console.log(q.sql())
```
```shell
select firstname, lastname from employees where department=?
```

### Delete

```js
import { Delete } from '@midbel/sqb'
const q = Delete.from("employees").where(Binary.eq("department", Literal.str("HR")))
console.log(q)
```
```shell
delete from employees where department='HR'
```

### Insert

```js
import { Insert, Exec, placeholder } from '@midbel/sqb'

const q = Insert.into("employees")
	.column(['id', 'firstname', 'lastname', 'department', 'hired_date'])
	.value(['default', placeholder(), placeholder(), placeholder(), Exec.currentDate()])
console.log(q.sql())
```
```shell
insert into employees(id, firstname, lastname, department, hired_date) values (default, ?, ?, ?, current_date)
```

### Update

```js
import { Update, Binary, Literal, placeholder } from '@midbel/sqb'
const q = Update.update("employees")
	.set("department", Literal.str("it"))
	.where(Binary.eq("id", placeholder()))

console.log(q.sql()) // 
```
```shell
update employees set department='IT' where id=?
```