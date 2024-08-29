export type SqlQuery = { text: string; values: unknown[] }

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const initialValue: { text: string; currentVariableIndex: number } = {
    text: '',
    currentVariableIndex: 1,
  }
  const { text } = strings.reduce(
    (acc, str, i) => {
      const currentValue = values[i]
      if (Array.isArray(currentValue)) {
        const arrayVars = currentValue
          .map((_, i) => `$${acc.currentVariableIndex + i}`)
          .join(", ")

        return {
          currentVariableIndex: acc.currentVariableIndex + currentValue.length,
          text: `${acc.text}${str}${arrayVars}`,
        }
      } else if (i < strings.length - 1) {
        return {
          currentVariableIndex: acc.currentVariableIndex + 1,
          text: `${acc.text}${str}$${acc.currentVariableIndex}`,
        }
      } else {
        return {
          currentVariableIndex: acc.currentVariableIndex,
          text: `${acc.text}${str}`,
        }
      }
    },
    initialValue
  )

  const expandedValues = values.flatMap((value) =>
    Array.isArray(value) ? value : [value],
  )

  return { text, values: expandedValues }
}
