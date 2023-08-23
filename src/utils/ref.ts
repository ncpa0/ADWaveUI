export const createRef = <T extends HTMLElement = HTMLElement>() => {
  return { current: null as T | null };
};
