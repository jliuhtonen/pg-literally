
export type SqlQuery = { text: string, values: unknown[] }

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const text = strings.reduce((acc, str, i) => {
    return `${acc}$${i + 1}${str}`
  })

  return { text, values }
}