import { Element, ElementLifecycleEvent } from "jsxte-wc";

export const forceClassName = (
  element: Element,
  className: string,
) => {
  element.classList.add(className);
  element.observeAttribute("class");
  element.lifecycle.on(
    ElementLifecycleEvent.AttributeDidChange,
    (event) => {
      if (event.detail.attributeName === "class") {
        if (!element.classList.contains(className)) {
          element.classList.add(className);
        }
      }
    },
  );
};
