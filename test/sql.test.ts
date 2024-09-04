import { describe, it } from "node:test"
import assert from "node:assert"
import { sql } from "../src"
import { sqlFragment as sqlF } from "../src"
import { combineFragments } from "../src"

const normalizeWhitespace = (sql: string) => sql.replace(/\s+/g, " ").trim()

describe("sql", () => {
  it("returns a SQL string", () => {
    assert.equal(sql`SELECT * FROM users`.text, "SELECT * FROM users")
  })

  it("returns values", () => {
    assert.deepEqual(sql`SELECT * FROM users WHERE id = ${1}`.values, [1])
  })

  it("supports array values", () => {
    const result = sql`SELECT * FROM users WHERE id = ANY(${[1, 2, 3]})`
    assert.equal(result.text, "SELECT * FROM users WHERE id = ANY($1, $2, $3)")
    assert.deepEqual(result.values, [1, 2, 3])
  })

  it("handles array values correctly when there are multiple placeholders", () => {
    const result = sql`SELECT * FROM users WHERE id = ANY(${[1, 2, 3]}) AND name = ${"Alice"}`
    assert.equal(
      result.text,
      "SELECT * FROM users WHERE id = ANY($1, $2, $3) AND name = $4",
    )
    assert.deepEqual(result.values, [1, 2, 3, "Alice"])
  })

  it("supports nested sql fragments", () => {
    const fragment = sqlF`SELECT * FROM users WHERE id = ${1}`
    const result = sql`SELECT * FROM (${fragment})`
    assert.equal(
      result.text,
      "SELECT * FROM (SELECT * FROM users WHERE id = $1)",
    )
    assert.deepEqual(result.values, [1])
  })

  it("support more complicated fragment query", () => {
    const orderBy = sqlF`ORDER BY ${"year"} LIMIT ${5}`
    const where = sqlF`WHERE id = ${1} AND title NOT IN (${["Richard D. James album", "Syro"]})`
    const query = sql`
      SELECT * FROM albums
      JOIN artists ON albums.artist_id = artists.id
      ${where}
      GROUP BY artist_id
      ${orderBy}
    `

    assert.equal(
      normalizeWhitespace(query.text),
      `SELECT * FROM albums JOIN artists ON albums.artist_id = artists.id WHERE id = $1 AND title NOT IN ($2, $3) GROUP BY artist_id ORDER BY $4 LIMIT $5`,
    )
    assert.deepEqual(query.values, [
      1,
      "Richard D. James album",
      "Syro",
      "year",
      5,
    ])
  })

  it("supports sql fragments in sql fragments", () => {
    const fragment = sqlF`SELECT * FROM users
      WHERE id = p.id
        AND ${sqlF`name = ${"Alice"}`} 
        AND email = ${"alice@company.com"}`
    const result = sqlF`LATERAL JOIN (${fragment})`
    const queryResult = sql`SELECT * FROM projects p ${result}`
    assert.equal(
      normalizeWhitespace(queryResult.text),
      "SELECT * FROM projects p LATERAL JOIN (SELECT * FROM users WHERE id = p.id AND name = $1 AND email = $2)",
    )
    assert.deepEqual(queryResult.values, ["Alice", "alice@company.com"])
  })

  it("supports joining sql fragments with proper output", () => {
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
    assert.equal(
      normalizeWhitespace(result.text),
      "INSERT INTO company (name, address) VALUES ($1, $2), ($3, $4), ($5, $6), ($7, $8)",
    )
    assert.deepEqual(result.values, [
      "Apple",
      "1 Infinite Loop",
      "Google",
      "1600 Amphitheatre Parkway",
      "Microsoft",
      "One Microsoft Way",
      "Amazon",
      "410 Terry Ave. North",
    ])
  })
})
