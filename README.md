# pg-literally 📚

SQL template tag literals and SQL fragments for Node and Postgres. Compatible with `node-pg` and `pg-promise`.

## Why?

It's best to use parameterized queries to prevent SQL injection attacks instead of escaping the interpolated values in your application or library code. However, you need to provide values for your queries and doing that separately clumsy. This library provides a way to build parametrized queries from tagged template literals.

There are also some nice tools for formatting SQL queries in template tag literals like [`prettier-plugin-sql`](https://github.com/un-ts/prettier/tree/master/packages/sql) and [syntax highlighting in code editors like VSCode](https://marketplace.visualstudio.com/items?itemName=frigus02.vscode-sql-tagged-template-literals).

## How?

```ts
import { sql } from "pg-literally"

const name = "Gandalf"
const age = 24000

const query = sql`
  SELECT *
  FROM characters
  WHERE name = ${name}
  AND age = ${age}
`
```

Result:

```json
{
  "text": "SELECT * FROM characters WHERE name = $1 AND age = $2",
  "values": ["Gandalf", 24000]
}
```

Here are some examples of how you can use the `query` with `node-pg` or `pg-promise`:

### Example 1: Using `node-pg`

```ts
import { Client } from "pg"
import { sql } from "pg-literally"

const name = "Gandalf"
const age = 24000

const query = sql`
  SELECT *
  FROM characters
  WHERE name = ${name}
  AND age = ${age}
`

const client = new Client()
client.connect()

await client.query(query)
```

### Example 2: Using `pg-promise`

```ts
import { Database } from "pg-promise"
import { sql } from "pg-literally"

const name = "Gandalf"
const age = 24000

const query = sql`
  SELECT *
  FROM characters
  WHERE name = ${name}
  AND age = ${age}
`

const db = new Database("connection-string")

await db.one(query)
```

## Reference

### `sql`

The `sql` function is a template tag that returns an object with a `text` property and a `values` property. The `text` property is the SQL query with placeholders for the values. The `values` property is an array of the values that should be substituted into the query.

```ts
const query = sql`
  SELECT *
  FROM characters
  WHERE name = ${name}
  AND age = ${age}
`
```

The `query` object will look like this:

```ts
{
  text: 'SELECT * FROM characters WHERE name = $1 AND age = $2',
  values: ['Gandalf', 24000]
}
```

### `sqlFragment`

The `sqlFragment` function can be used to create a SQL fragment that can be used in a larger query. It works the same way as the `sql` function, but it does not return an object with a `text` and `values` property. Instead, it returns a `SqlFragment` type that can be joined and combined together before actually rendering it to query placeholder and values array.

And yes, you can put sql fragments in sql fragments.

```ts
const whereFragment = sqlFragment`
  name = ${name}
  AND age = ${age}
`
```

You can then use the `whereFragment` in a larger query like this:

```ts
const query = sql`
  SELECT *
  FROM characters
  WHERE ${whereFragment}
`
```

### `joinSqlFragments`

The `joinSqlFragments` function can be used to join two `SqlFragment` objects together. It returns a new `SqlFragment` object that represents the combined fragments.

```ts
const whereFragment1 = sqlFragment`name = ${name}`
const whereFragment2 = sqlFragment`age = ${age}`
const combinedFragment = joinSqlFragments(
  whereFragment1,
  whereFragment2,
  "\nAND ",
)

const query = sql`
  SELECT *
  FROM characters
  WHERE ${combinedFragment}
`
```

Result:

```json
{
  "text": "SELECT * FROM characters WHERE name = $1\nAND age = $2",
  "values": ["Gandalf", 24000]
}
```

### `combineFragments`

The `combineFragments` function can be used to combine multiple `SqlFragment` objects together. It returns a new `SqlFragment` object that represents the combined fragments. Basically, this is syntactic sugar for reducing an array of `SqlFragment` objects.

```ts
import { combineFragments, sql, sqlFragment as sqlF } from "pg-literally"

const companiesToInsert = [
  { name: "Apple", address: "1 Infinite Loop" },
  { name: "Google", address: "1600 Amphitheatre Parkway" },
  { name: "Microsoft", address: "One Microsoft Way" },
  { name: "Amazon", address: "410 Terry Ave. North" },
]

const result = sql`
  INSERT INTO company (name, address)
  VALUES ${combineFragments(
    ",\n",
    ...companiesToInsert.map(
      (company) => sqlF`(${[company.name, company.address]})`,
    ),
  )}
`
```

Result:

```json
{
  "text": "INSERT INTO company (name, address) VALUES ($1, $2),\n($3, $4),\n($5, $6),\n($7, $8)",
  "values": [
    "Apple",
    "1 Infinite Loop",
    "Google",
    "1600 Amphitheatre Parkway",
    "Microsoft",
    "One Microsoft Way",
    "Amazon",
    "410 Terry Ave. North"
  ]
}
```
