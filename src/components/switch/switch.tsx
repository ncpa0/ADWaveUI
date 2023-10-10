import { Switch } from "gtk-css-web";
import { Attribute, CustomElement, Element } from "jsxte-wc";
import { cls } from "../../utils/cls";
import "./switch.css";

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
export class ADWaveSwitchElement extends Element {
  @Attribute({ type: "boolean" })
  accessor active: boolean = false;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean = false;

  @Attribute()
  accessor name: string | undefined = undefined;

  @Attribute()
  accessor form: string | undefined = undefined;

  private handleClick = (e: Event) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.active = !this.active;
    this.dispatchEvent(new SwitchChangeEvent(this.active));
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === " ") {
      this.handleClick(e);
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
        />
      </div>
    );
  }
}
