import {
  Element,
  ElementAttributeDidChangeEvent,
  ElementLifecycleEvent,
  ElementStateDidChangeEvent,
} from "jsxte-wc";

export type Dependency<T> = {
  getValue: () => T;
  name: string;
};

const noop = () => {};

export abstract class BaseElement extends Element {
  getRootClassNames = undefined;
}
