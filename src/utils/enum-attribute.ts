import { AttributeParser } from "wc_toolkit";

export function Enum<
  const Values extends string | number,
>(
  values: Values[],
  defaultValue: Values | null = null,
): AttributeParser<Values> {
  return {
    fromString(value: string): Values | null {
      if (values.includes(value as Values)) {
        return value as Values;
      } else if (values.includes(Number(value) as Values)) {
        return Number(value) as Values;
      }
      return defaultValue;
    },
    intoString(value: null | Values): string {
      if (value) return String(value);
      if (defaultValue) return String(defaultValue);
      return "";
    },
  };
}
