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

  let result = "";

  if (Array.isArray(classNames)) {
    for (let i = 0; i < classNames.length; i++) {
      result += cls(classNames[i]!) + " ";
    }
  } else {
    const entries = Object.entries(classNames);

    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i]!;
      if (value) {
        result += key + " ";
      }
    }
  }

  return result.substring(0, result.length - 1);
}
