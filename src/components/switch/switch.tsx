import { Switch } from "adwavecss";
import { Attribute, CustomElement } from "jsxte-wc";
import { BaseElement } from "../../base-elements";
import "../../index.css";
import { cls } from "../../utils/cls";
import { CustomKeyboardEvent, CustomMouseEvent } from "../../utils/events";
import { stopEvent } from "../../utils/prevent-default";
import { AttributeBool } from "../../utils/types";
import "./switch.css";

declare global {
  namespace JSX {
    interface AdwSwitchProps {
      class?: string;
      id?: string;
      slot?: string;
      style?: string;
      active?: AttributeBool;
      disabled?: AttributeBool;
      name?: string;
      form?: string;
      onChange?: (e: SwitchChangeEvent) => void;
      onchange?: string;
      onClick?: (e: CustomMouseEvent<{}>) => void;
      onclick?: string;
      onKeyDown?: (e: CustomKeyboardEvent<{}>) => void;
      onkeydown?: string;
    }

    interface IntrinsicElements {
      "adw-switch": AdwSwitchProps;
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

export type { SwitchChangeEvent };

@CustomElement("adw-switch")
export class ADWaveSwitchElement extends BaseElement {
  @Attribute({ type: "boolean", nullable: false })
  accessor active: boolean = false;

  @Attribute({ type: "boolean", nullable: false, default: false })
  accessor disabled: boolean = false;

  @Attribute({ nullable: true })
  accessor name: string | null = null;

  @Attribute({ nullable: true })
  accessor form: string | null = null;

  constructor() {
    super();

    this.effect(
      ({ isFirstMount }) => {
        if (isFirstMount) return;
        this.dispatchEvent(new SwitchChangeEvent(this.active));
      },
      (s) => [s.active],
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
          [Switch.disabled]: this.disabled,
          [Switch.active]: this.active,
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
          name={this.name ?? undefined}
          form={this.form ?? undefined}
          onclick={this.handleClick}
          onchange={stopEvent}
          aria-hidden="true"
        />
      </div>
    );
  }
}
