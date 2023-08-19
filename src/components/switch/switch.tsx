import { Switch } from "gtk-css-web";
import { InterpolateTag } from "jsxte";
import { customElement, property } from "lit/decorators.js";
import { BaseElement } from "../../base-element";
import { render } from "../../decorators/render";
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

@customElement("g-switch")
export class GSwitchElement extends BaseElement {
  @property({ reflect: true, type: Boolean })
  active: boolean = false;

  @property({ reflect: true, type: Boolean })
  disabled: boolean = false;

  @property({ reflect: true })
  name: string = "";

  private onClick = (e: Event) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.active = !this.active;
    this.dispatchEvent(new SwitchChangeEvent(this.active));
  };

  @render
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
        <InterpolateTag>
          <input
            type="checkbox"
            class="_g_hidden"
            disabled={this.disabled}
            checked={this.active}
            name={this.name}
            onclick={this.onClick}
          />
        </InterpolateTag>
      </div>
    );
  }
}
