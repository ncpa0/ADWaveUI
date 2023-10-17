import { Switch } from "gtk-css-web";
import {
  Attribute,
  CustomElement,
  ElementLifecycleEvent,
} from "jsxte-wc";
import { BaseElement } from "../../base-elements";
import { cls } from "../../utils/cls";
import {
  CustomKeyboardEvent,
  CustomMouseEvent,
} from "../../utils/events";
import { stopEvent } from "../../utils/prevent-default";
import "./switch.css";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "adw-switch": {
        class?: string;
        id?: string;
        slot?: string;
        style?: string;
        active?: boolean;
        disabled?: boolean;
        name?: string;
        form?: string;
      };
    }
  }
}

class SwitchChangeEvent extends CustomEvent<{ active: boolean }> {
  constructor(active: boolean) {
    super("change", {
      detail: {
        active,
      },
    });
  }
}

@CustomElement("adw-switch")
export class ADWaveSwitchElement extends BaseElement {
  @Attribute({ type: "boolean" })
  accessor active: boolean = false;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean = false;

  @Attribute()
  accessor name: string | undefined = undefined;

  @Attribute()
  accessor form: string | undefined = undefined;

  constructor() {
    super();

    this.lifecycle.on(
      ElementLifecycleEvent.AttributeDidChange,
      (c) => {
        if (c.detail.attributeName === "active") {
          this.dispatchEvent(
            new SwitchChangeEvent(c.detail.newValue as any),
          );
        }
      },
    );
  }

  private handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    const shouldContinue = this.dispatchEvent(
      new CustomMouseEvent("click", {}, e),
    );

    if (this.disabled || !shouldContinue) return;

    this.active = !this.active;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    const shouldContinue = this.dispatchEvent(
      new CustomKeyboardEvent("keydown", {}, e),
    );
    if (shouldContinue && e.key === " ") {
      if (this.disabled || !shouldContinue) return;

      this.active = !this.active;
    }
  };

  render() {
    return (
      <div
        class={cls({
          [Switch.switch]: true,
          disabled: this.disabled,
          active: this.active,
        })}
        onclick={this.handleClick}
        onkeydown={this.handleKeyDown}
        tabindex="0"
        role="switch"
        aria-checked={this.active}
        aria-disabled={this.disabled ? "true" : "false"}
      >
        <div class={Switch.knob}></div>
        <input
          type="checkbox"
          class="_adw_hidden"
          disabled={this.disabled}
          checked={this.active}
          name={this.name}
          form={this.form}
          onclick={this.handleClick}
          onchange={stopEvent}
          aria-hidden="true"
        />
      </div>
    );
  }
}
