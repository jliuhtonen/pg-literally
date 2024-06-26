import { describe, it } from "node:test"
import assert from "node:assert"
import { sql } from "../src/sql"

describe('sql', () => {
  it('returns a SQL string', () => {
    assert.equal(sql`SELECT * FROM users`.text, 'SELECT * FROM users');
  })
})