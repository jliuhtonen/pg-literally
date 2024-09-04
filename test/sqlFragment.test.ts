import assert from "node:assert"
import { joinSqlFragments, sqlFragment } from "../src"
import { describe, it } from "node:test"

describe("sqlFragment", () => {
  it("returns a SQL fragment", () => {
    const fragment = sqlFragment`SELECT * FROM albums WHERE year = ${1999}`
    assert.deepEqual(fragment.strings, [
      "SELECT * FROM albums WHERE year = ",
      "",
    ])
    assert.deepEqual(fragment.values, [1999])
  })

  it("joins two fragments", () => {
    const fragment1 = sqlFragment`SELECT * FROM albums WHERE year = ${1999}`
    const fragment2 = sqlFragment`ORDER BY year LIMIT ${5}`
    const joined = joinSqlFragments(fragment1, fragment2)
    assert.deepEqual(joined.strings, [
      "SELECT * FROM albums WHERE year = ",
      "\nORDER BY year LIMIT ",
      "",
    ])
    assert.deepEqual(joined.values, [1999, 5])
  })
})
