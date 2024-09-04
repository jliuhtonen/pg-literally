export interface SqlFragment {
  __pgLiterallyKind: "SqlFragment"
  strings: readonly string[]
  values: unknown[]
}

export const isSqlFragment = (value: unknown): value is SqlFragment => {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as any).__pgLiterallyKind === "SqlFragment"
  )
}

export const sqlFragment = (
  strings: readonly string[],
  ...values: unknown[]
): SqlFragment => ({
  __pgLiterallyKind: "SqlFragment",
  strings,
  values,
})

const joinStringArrays = (
  a: readonly string[],
  b: readonly string[],
  separator: string,
): readonly string[] => {
  if (a.length === 0) {
    return b
  }
  if (b.length === 0) {
    return a
  }
  const aWithoutLast = a.slice(0, a.length - 1)
  const lastAString = a[a.length - 1]
  const firstBString = b[0]
  const restBString = b.slice(1)

  return aWithoutLast.concat(
    `${lastAString}${separator}${firstBString}`,
    restBString,
  )
}

export const joinSqlFragments = (
  a: SqlFragment,
  b: SqlFragment,
  separator = "\n",
): SqlFragment => ({
  __pgLiterallyKind: "SqlFragment",
  strings: joinStringArrays(a.strings, b.strings, separator),
  values: a.values.concat(b.values),
})
