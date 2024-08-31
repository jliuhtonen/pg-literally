import { isSqlFragment } from "./sqlFragment"

export type SqlQuery = { text: string; values: unknown[] }

interface AccumulatedQueryState {
  text: string
  currentVariableIndex: number
  values: unknown[]
}

const appendCurrentVariableToQueryFn =
  (numberOfQueryParts: number, queryPartValues: unknown[]) =>
  (
    acc: AccumulatedQueryState,
    currentQueryPart: string,
    currentQueryPartIndex: number,
  ): AccumulatedQueryState => {
    const currentValue = queryPartValues[currentQueryPartIndex]
    if (isSqlFragment(currentValue)) {
      const {
        text: fragmentQueryText,
        currentVariableIndex,
        values: fragmentValues,
      } = currentValue.strings.reduce(
        appendCurrentVariableToQueryFn(
          currentValue.strings.length,
          currentValue.values,
        ),
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
    } else if (currentQueryPartIndex < numberOfQueryParts - 1) {
      return {
        currentVariableIndex: acc.currentVariableIndex + 1,
        text: `${acc.text}${currentQueryPart}$${acc.currentVariableIndex}`,
        values: [...acc.values, currentValue],
      }
    } else {
      return {
        currentVariableIndex: acc.currentVariableIndex,
        text: `${acc.text}${currentQueryPart}`,
        values: acc.values,
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
    appendCurrentVariableToQueryFn(strings.length, values),
    initialValue,
  )

  return { text, values: expandedValues }
}
