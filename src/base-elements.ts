import { Element } from "jsxte-wc";

export type Dependency<T> = {
  getValue: () => T;
  name: string;
};

export abstract class BaseElement extends Element {
  getRootClassNames = undefined;
}
