import { LitElement } from "lit";

export class BaseElement extends LitElement {
  protected createRenderRoot() {
    return this;
  }
}
