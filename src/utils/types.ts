export type AttributeBool = true | false | "true" | "false";

export type InputType =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

type AutoFillAddressKind = "billing" | "shipping";
type AutoFillBase = "" | "off" | "on";
type AutoFillContactField =
  | "email"
  | "tel"
  | "tel-area-code"
  | "tel-country-code"
  | "tel-extension"
  | "tel-local"
  | "tel-local-prefix"
  | "tel-local-suffix"
  | "tel-national";
type AutoFillContactKind = "home" | "mobile" | "work";
type AutoFillCredentialField = "webauthn";
type AutoFillNormalField =
  | "additional-name"
  | "address-level1"
  | "address-level2"
  | "address-level3"
  | "address-level4"
  | "address-line1"
  | "address-line2"
  | "address-line3"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-family-name"
  | "cc-given-name"
  | "cc-name"
  | "cc-number"
  | "cc-type"
  | "country"
  | "country-name"
  | "current-password"
  | "family-name"
  | "given-name"
  | "honorific-prefix"
  | "honorific-suffix"
  | "name"
  | "new-password"
  | "one-time-code"
  | "organization"
  | "postal-code"
  | "street-address"
  | "transaction-amount"
  | "transaction-currency"
  | "username";
type OptionalPrefixToken<T extends string> = `${T} ` | "";
type OptionalPostfixToken<T extends string> = ` ${T}` | "";
type AutoFillField =
  | AutoFillNormalField
  | `${OptionalPrefixToken<AutoFillContactKind>}${AutoFillContactField}`;
type AutoFillSection = `section-${string}`;
export type InpurAutoFill =
  | AutoFillBase
  | `${OptionalPrefixToken<AutoFillSection>}${OptionalPrefixToken<
    AutoFillAddressKind
  >}${AutoFillField}${OptionalPostfixToken<AutoFillCredentialField>}`;
