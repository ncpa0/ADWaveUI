export function isOneOf<T>(value: T, ...validValues: T[]): boolean {
  for (let i = 0; i < validValues.length; i++) {
    if (value === validValues[i]) {
      return true;
    }
  }
  return false;
}
