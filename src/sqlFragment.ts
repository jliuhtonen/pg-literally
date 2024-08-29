export interface SqlFragment {
  __brand: "SqlFragment"
  strings: readonly string[]
  values: unknown[]
}

export const isSqlFragment = (value: unknown): value is SqlFragment => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__brand === "SqlFragment"
  )
}

export const sqlFragment = (
  strings: readonly string[],
  ...values: unknown[]
): SqlFragment => ({
  __brand: "SqlFragment",
  strings,
  values,
})

export const joinSqlFragments = (
  a: SqlFragment,
  b: SqlFragment,
  separator = " ",
): SqlFragment => ({
  __brand: "SqlFragment",
  strings: a.strings.concat(separator).concat(b.strings),
  values: a.values.concat(b.values),
})
