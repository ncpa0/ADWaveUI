export function debounced<Args extends any[]>(
  fn: (...args: Args) => any,
  time = 0,
): (...args: Args) => void {
  let isQueued = false;
  return (...args: Args) => {
    if (isQueued) {
      return;
    }
    isQueued = true;
    setTimeout(() => {
      isQueued = false;
      fn(...args);
    }, time);
  };
}
