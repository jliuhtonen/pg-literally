import { isSqlFragment } from "./sqlFragment"

export type SqlQuery = { text: string; values: unknown[] }

interface AccumulatedQuery {
  text: string
  currentVariableNumber: number
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
        currentVariableNumber: acc.currentVariableNumber,
        text: `${acc.text}${currentQueryPart}`,
        values: acc.values,
      }
    }

    const currentValue = queryPartValues[currentQueryPartIndex]
    if (isSqlFragment(currentValue)) {
      const {
        text: fragmentQueryText,
        currentVariableNumber,
        values: fragmentValues,
      } = currentValue.strings.reduce(
        appendPartToQueryFn(currentValue.strings.length, currentValue.values),
        {
          text: "",
          currentVariableNumber: acc.currentVariableNumber,
          values: [],
        },
      )

      return {
        currentVariableNumber,
        text: `${acc.text}${currentQueryPart}${fragmentQueryText}`,
        values: [...acc.values, ...fragmentValues],
      }
    } else if (Array.isArray(currentValue)) {
      const arrayVars = currentValue
        .map((_, i) => `$${acc.currentVariableNumber + i}`)
        .join(", ")

      return {
        currentVariableNumber: acc.currentVariableNumber + currentValue.length,
        text: `${acc.text}${currentQueryPart}${arrayVars}`,
        values: [...acc.values, ...currentValue],
      }
    } else {
      return {
        currentVariableNumber: acc.currentVariableNumber + 1,
        text: `${acc.text}${currentQueryPart}$${acc.currentVariableNumber}`,
        values: [...acc.values, currentValue],
      }
    }
  }

export const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
  const initialValue: AccumulatedQuery = {
    text: "",
    currentVariableNumber: 1,
    values: [],
  }

  const { text, values: expandedValues } = strings.reduce(
    appendPartToQueryFn(strings.length, values),
    initialValue,
  )

  return { text, values: expandedValues }
}
