import { Slider } from "gtk-css-web";
import { InterpolateTag } from "jsxte";
import { customElement, property } from "lit/decorators.js";
import { BaseElement } from "../../base-element";
import { render } from "../../decorators/render";
import { cls } from "../../utils/cls";
import { changeWithStep, clamp, toPrecision } from "../../utils/math";
import "./slider.css";

class SliderChangeEvent extends CustomEvent<{ value: number }> {
  constructor(value: number) {
    super("change", {
      detail: {
        value,
      },
    });
  }
}

@customElement("g-slider")
export class GSliderElement extends BaseElement {
  @property({ reflect: true, type: Number })
  value: number = 0;

  @property({ reflect: true, type: Number })
  min: number = 0;

  @property({ reflect: true, type: Number })
  max: number = 100;

  @property({ reflect: true, type: Number })
  step: number = 1;

  @property({ reflect: true, type: Number })
  precision: number = 4;

  @property({ reflect: true, type: Boolean })
  disabled: boolean = false;

  @property({ reflect: true })
  name: string = "";

  constructor() {
    super();
  }

  protected firstUpdated(): void {
    this.moveThumb(clamp(this.value, this.min, this.max));
  }

  private moveThumb(value: number) {
    const percent =
      ((value - this.min) / (this.max - this.min)) * 100;

    const progress = this.querySelector(
      `.${Slider.progress}`,
    ) as HTMLElement;
    const thumb = this.querySelector(
      `.${Slider.thumb}`,
    ) as HTMLElement;

    progress.style.right = `${100 - percent}%`;
    thumb.style.left = `calc(${percent}% - 0.3em)`;
  }

  isPressed = false;

  private handleMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.isPressed = true;
    this.handleMouseMove(e);
    return false;
  };

  private handleMouseUp = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.isPressed = false;
  };

  private handleMouseMove = (e: MouseEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    if (this.isPressed) {
      const { left, width } = this.getBoundingClientRect();
      const percent = (e.clientX - left) / width;
      const tmpValue = changeWithStep(
        this.value,
        toPrecision(
          this.min + percent * (this.max - this.min),
          this.precision,
        ),
        this.step,
      );
      const value = clamp(tmpValue, this.min, this.max);

      if (this.value === value) return;

      this.value = value;
      this.moveThumb(value);
      this.dispatchEvent(new SliderChangeEvent(value));
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (document) {
      document.addEventListener("mouseup", this.handleMouseUp);
      document.addEventListener("mousemove", this.handleMouseMove);
    }
  }

  @render
  render() {
    return (
      <div
        draggable="false"
        class={cls({
          g_slider: true,
          disabled: this.disabled,
        })}
        onmousedown={this.handleMouseDown}
      >
        <div
          draggable="false"
          class={Slider.track}
        ></div>
        <div
          draggable="false"
          class={Slider.progress}
        ></div>
        <div
          draggable="false"
          class={Slider.thumb}
        ></div>
        <InterpolateTag>
          <input
            type="range"
            class="_g_hidden"
            disabled={this.disabled}
            name={this.name}
          />
        </InterpolateTag>
      </div>
    );
  }
}
