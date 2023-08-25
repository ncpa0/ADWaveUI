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

@CustomElement("g-switch")
export class GSwitchElement extends Element {
  @Attribute({ type: "boolean" })
  accessor active: boolean = false;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean = false;

  @Attribute()
  accessor name: string = "";

  private onClick = (e: Event) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.active = !this.active;
    this.dispatchEvent(new SwitchChangeEvent(this.active));
  };

  render() {
    return (
      <div
        class={cls({
          [Switch.switch]: true,
          disabled: this.disabled,
          active: this.active,
        })}
        onclick={this.onClick}
      >
        <div class={Switch.knob}></div>
        <input
          type="checkbox"
          class="_g_hidden"
          disabled={this.disabled}
          checked={this.active}
          name={this.name}
          onclick={this.onClick}
        />
      </div>
    );
  }
}
