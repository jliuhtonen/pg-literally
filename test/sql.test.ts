import { describe, it } from "node:test"
import assert from "node:assert"
import { sql } from "../src/sql"

describe('sql', () => {
  it('returns a SQL string', () => {
    assert.equal(sql`SELECT * FROM users`.text, 'SELECT * FROM users')
  })

  it('returns values', () => {
    assert.deepEqual(sql`SELECT * FROM users WHERE id = ${1}`.values, [1])
  })

  it('supports array values', () => {
    const result = sql`SELECT * FROM users WHERE id = ANY(${[1, 2, 3]})`
    assert.equal(result.text, 'SELECT * FROM users WHERE id = ANY($1, $2, $3)')
    assert.deepEqual(result.values, [1, 2, 3])
  })

  it('handles array values correctly when there are multiple placeholders', () => {
    const result = sql`SELECT * FROM users WHERE id = ANY(${[1, 2, 3]}) AND name = ${'Alice'}`
    assert.equal(result.text, 'SELECT * FROM users WHERE id = ANY($1, $2, $3) AND name = $4')
    assert.deepEqual(result.values, [1, 2, 3, 'Alice'])
  })
})