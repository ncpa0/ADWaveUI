import { Slider } from "gtk-css-web";
import {
  Attribute,
  CustomElement,
  Element,
  ElementLifecycleEvent,
} from "jsxte-wc";
import { cls } from "../../utils/cls";
import { changeWithStep, clamp, toPrecision } from "../../utils/math";
import { createRef } from "../../utils/ref";
import "./slider.css";

const preventDefault = (e: Event) => e.preventDefault();

class SliderChangeEvent extends CustomEvent<{ value: number }> {
  constructor(value: number) {
    super("change", {
      detail: {
        value,
      },
    });
  }
}

@CustomElement("g-slider")
export class GSliderElement extends Element {
  @Attribute({ type: "number" })
  accessor value: number = 0;

  @Attribute({ type: "number" })
  accessor min: number = 0;

  @Attribute({ type: "number" })
  accessor max: number = 100;

  @Attribute({ type: "number" })
  accessor step: number = 1;

  @Attribute({ type: "number" })
  accessor precision: number = 4;

  @Attribute({ type: "boolean" })
  accessor disabled: boolean | undefined = undefined;

  @Attribute()
  accessor name: string | undefined = undefined;

  private progress = createRef<HTMLDivElement>();
  private thumb = createRef<HTMLDivElement>();
  protected isPressed = false;

  constructor() {
    super();

    this.lifecycle.once(ElementLifecycleEvent.DidMount, () => {
      this.moveThumb(this.value);
    });
  }

  private moveThumb(value: number) {
    const percent =
      ((value - this.min) / (this.max - this.min)) * 100;

    this.progress.current!.style.right = `${100 - percent}%`;
    this.thumb.current!.style.left = `calc(${percent}% - 0.3em)`;
  }

  private handlePointerDown = (e: PointerEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    if (e.pointerType === "mouse" && e.button !== 0) return;

    this.isPressed = true;
    this.handlePointerEventMove(e);
    return false;
  };

  private handlePointerEventUp = (e: PointerEvent) => {
    e.stopPropagation();
    if (this.disabled) return;

    this.isPressed = false;
  };

  private handlePointerEventMove = (e: PointerEvent) => {
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
      window.addEventListener("pointerup", this.handlePointerEventUp);
      window.addEventListener(
        "pointermove",
        this.handlePointerEventMove,
      );
    }
  }

  render() {
    return (
      <div
        draggable="false"
        class={cls({
          g_slider: true,
          disabled: this.disabled,
        })}
        onpointerdown={this.handlePointerDown}
        onpointermove={preventDefault}
        ondrag={preventDefault}
      >
        <div
          draggable="false"
          class={Slider.track}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <div
          ref={this.progress}
          draggable="false"
          class={Slider.progress}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <div
          ref={this.thumb}
          draggable="false"
          class={Slider.thumb}
          onpointermove={preventDefault}
          ondrag={preventDefault}
        ></div>
        <input
          type="range"
          class="_g_hidden"
          disabled={this.disabled}
          name={this.name}
          min={this.min}
          max={this.max}
          step={this.step.toString()}
          value={this.value.toString()}
        />
      </div>
    );
  }
}
