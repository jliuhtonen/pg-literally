import { isSqlFragment } from "./sqlFragment"

export type SqlQuery = { text: string; values: unknown[] }

interface TextReplacementState {
  text: string
  currentVariableIndex: number
}

const expandPlaceholdersToText = (
  strings: readonly string[],
  values: unknown[],
  initialValue: TextReplacementState,
): TextReplacementState =>
  strings.reduce((acc, str, i) => {
    const currentValue = values[i]
    if (isSqlFragment(currentValue)) {
      const { text, currentVariableIndex } = expandPlaceholdersToText(
        currentValue.strings,
        currentValue.values,
        {
          text: "",
          currentVariableIndex: acc.currentVariableIndex,
        },
      )

      return {
        currentVariableIndex,
        text: `${acc.text}${str}${text}`,
      }
    } else if (Array.isArray(currentValue)) {
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
  }, initialValue)

const expandValues = (values: unknown[]): unknown[] =>
  values.flatMap((value) => {
    if (isSqlFragment(value)) {
      return expandValues(value.values)
    } else if (Array.isArray(value)) {
      return value
    } else {
      return [value]
    }
  })

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const initialValue: { text: string; currentVariableIndex: number } = {
    text: "",
    currentVariableIndex: 1,
  }

  const { text } = expandPlaceholdersToText(strings, values, initialValue)
  const expandedValues = expandValues(values)

  return { text, values: expandedValues }
}
