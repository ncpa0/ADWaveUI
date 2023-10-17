export function preventDefault(event: Event): void {
  event.preventDefault();
}

export function stopEvent(event: Event): void {
  event.stopPropagation();
}
