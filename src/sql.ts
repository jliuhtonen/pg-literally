import { isSqlFragment } from "./sqlFragment"

export type SqlQuery = { text: string; values: unknown[] }

interface AccumulatedQuery {
  text: string
  currentVariableIndex: number
  values: unknown[]
}

const appendPartToQueryFn =
  (numberOfQueryParts: number, queryPartValues: unknown[]) =>
  (
    acc: AccumulatedQuery,
    currentQueryPart: string,
    currentQueryPartIndex: number,
  ): AccumulatedQuery => {
    const isLastQueryPart = currentQueryPartIndex === numberOfQueryParts - 1
    if (isLastQueryPart) {
      return {
        currentVariableIndex: acc.currentVariableIndex,
        text: `${acc.text}${currentQueryPart}`,
        values: acc.values,
      }
    }

    const currentValue = queryPartValues[currentQueryPartIndex]
    if (isSqlFragment(currentValue)) {
      const {
        text: fragmentQueryText,
        currentVariableIndex,
        values: fragmentValues,
      } = currentValue.strings.reduce(
        appendPartToQueryFn(currentValue.strings.length, currentValue.values),
        {
          text: "",
          currentVariableIndex: acc.currentVariableIndex,
          values: [],
        },
      )

      return {
        currentVariableIndex,
        text: `${acc.text}${currentQueryPart}${fragmentQueryText}`,
        values: [...acc.values, ...fragmentValues],
      }
    } else if (Array.isArray(currentValue)) {
      const arrayVars = currentValue
        .map((_, i) => `$${acc.currentVariableIndex + i}`)
        .join(", ")

      return {
        currentVariableIndex: acc.currentVariableIndex + currentValue.length,
        text: `${acc.text}${currentQueryPart}${arrayVars}`,
        values: [...acc.values, ...currentValue],
      }
    } else {
      return {
        currentVariableIndex: acc.currentVariableIndex + 1,
        text: `${acc.text}${currentQueryPart}$${acc.currentVariableIndex}`,
        values: [...acc.values, currentValue],
      }
    }
  }

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const initialValue: {
    text: string
    currentVariableIndex: number
    values: unknown[]
  } = {
    text: "",
    currentVariableIndex: 1,
    values: [],
  }

  const { text, values: expandedValues } = strings.reduce(
    appendPartToQueryFn(strings.length, values),
    initialValue,
  )

  return { text, values: expandedValues }
}
