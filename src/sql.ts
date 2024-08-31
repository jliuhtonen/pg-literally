import { isSqlFragment } from "./sqlFragment"

export type SqlQuery = { text: string; values: unknown[] }

interface AccumulatedQueryState {
  text: string
  currentVariableIndex: number
}

const appendCurrentVariableToQueryFn = (numberOfQueryParts: number, queryPartValues: unknown[]) => (acc: AccumulatedQueryState, currentQueryPart: string, currentQueryPartIndex: number): AccumulatedQueryState =>  {
    const currentValue = queryPartValues[currentQueryPartIndex]
    if (isSqlFragment(currentValue)) {
      const { text: fragmentQueryText, currentVariableIndex } = currentValue.strings.reduce(
        appendCurrentVariableToQueryFn(currentValue.strings.length, currentValue.values),
        {
          text: "",
          currentVariableIndex: acc.currentVariableIndex,
        },
      )

      return {
        currentVariableIndex,
        text: `${acc.text}${currentQueryPart}${fragmentQueryText}`,
      }
    } else if (Array.isArray(currentValue)) {
      const arrayVars = currentValue
        .map((_, i) => `$${acc.currentVariableIndex + i}`)
        .join(", ")

      return {
        currentVariableIndex: acc.currentVariableIndex + currentValue.length,
        text: `${acc.text}${currentQueryPart}${arrayVars}`,
      }
    } else if (currentQueryPartIndex < numberOfQueryParts - 1) {
      return {
        currentVariableIndex: acc.currentVariableIndex + 1,
        text: `${acc.text}${currentQueryPart}$${acc.currentVariableIndex}`,
      }
    } else {
      return {
        currentVariableIndex: acc.currentVariableIndex,
        text: `${acc.text}${currentQueryPart}`,
      }
    }
}

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

  const { text } = strings.reduce(
    appendCurrentVariableToQueryFn(strings.length, values),
    initialValue,
  ) 
  const expandedValues = expandValues(values)

  return { text, values: expandedValues }
}
