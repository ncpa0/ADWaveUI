export type ClassName =
  | string
  | Record<string, boolean | undefined>
  | undefined
  | Array<ClassName>;

export function cls(classNames: ClassName): string {
  if (classNames === undefined) {
    return "";
  }

  if (typeof classNames === "string") {
    return classNames;
  }

  if (Array.isArray(classNames)) {
    return classNames.map(cls).join(" ");
  }

  return Object.entries(classNames)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(" ");
}
